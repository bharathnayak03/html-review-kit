import { resolveTarget } from "../anchors/resolveTarget";
import type {
  ArtifactComment,
  ArtifactInfo,
  ArtifactReviewPacket,
  ReviewMode,
} from "../types";

export interface OverlayController {
  element: HTMLElement;
  render(comments: ArtifactComment[]): void;
  setMode(mode: ReviewMode): void;
  destroy(): void;
}

export interface CreateOverlayOptions {
  artifact: ArtifactInfo;
  root: HTMLElement;
  getComments(): ArtifactComment[];
  exportReviewPacket(): ArtifactReviewPacket;
  getMode(): ReviewMode;
  setMode(mode: ReviewMode): void;
}

function buildSelectors(comment: ArtifactComment) {
  const selectors: Array<Record<string, unknown>> = [];

  if (comment.target.anchorId) {
    selectors.push({
      type: "FragmentSelector",
      value: `data-hrk-id=${comment.target.anchorId}`,
    });
  }
  if (comment.target.cssSelector) {
    selectors.push({ type: "CssSelector", value: comment.target.cssSelector });
  }
  if (comment.target.xpath) {
    selectors.push({ type: "XPathSelector", value: comment.target.xpath });
  }
  if (comment.target.textQuote) {
    selectors.push({
      type: "TextQuoteSelector",
      exact: comment.target.textQuote,
    });
  }
  if (comment.target.textPosition) {
    selectors.push({
      type: "TextPositionSelector",
      start: comment.target.textPosition.start,
      end: comment.target.textPosition.end,
    });
  }

  return selectors;
}

function buildAnnotationPrompt(
  artifact: ArtifactInfo,
  comments: ArtifactComment[],
): string {
  const source = artifact.sourceFile ?? artifact.artifactId;
  const openComments = comments.filter((comment) => comment.status === "open");
  const annotationCollection = {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    type: "AnnotationCollection",
    id: `urn:html-review-kit:${artifact.artifactId}:annotations`,
    total: openComments.length,
    items: openComments.map((comment) => ({
      id: `urn:html-review-kit:${artifact.artifactId}:${comment.id}`,
      type: "Annotation",
      motivation: "commenting",
      created: comment.createdAt,
      ...(comment.updatedAt ? { modified: comment.updatedAt } : {}),
      body: {
        type: "TextualBody",
        purpose: "commenting",
        value: comment.body,
        format: "text/plain",
        ...(comment.aiInstruction
          ? { htmlReviewKitInstruction: comment.aiInstruction }
          : {}),
      },
      target: {
        type: "SpecificResource",
        source,
        selector: buildSelectors(comment),
        htmlReviewKitTarget: comment.target,
      },
    })),
  };

  return [
    "Apply these HTML Review Kit annotations to the source HTML artifact.",
    "",
    `Artifact: ${artifact.title ?? artifact.artifactId}`,
    `Source file: ${source}`,
    "",
    "Process only annotations with motivation \"commenting\". Use target.htmlReviewKitTarget first, then FragmentSelector/data-hrk-id, TextQuoteSelector, CssSelector, XPathSelector, and nearby HTML context. Preserve semantic HTML and stable data-hrk-id anchors. Summarize which annotations were applied and which could not be resolved.",
    "",
    "HTML annotations:",
    JSON.stringify(annotationCollection, null, 2),
  ].join("\n");
}

async function copyText(doc: Document, text: string): Promise<void> {
  if (doc.defaultView?.navigator.clipboard?.writeText) {
    await doc.defaultView.navigator.clipboard.writeText(text);
    return;
  }

  const textarea = doc.createElement("textarea");
  textarea.value = text;
  textarea.style.cssText = "position:fixed;top:-9999px;left:-9999px";
  doc.body.append(textarea);
  textarea.focus();
  textarea.select();
  doc.execCommand("copy");
  textarea.remove();
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function measureInlineCommentHeight(card: HTMLElement): number {
  const measuredHeight =
    card.offsetHeight || card.scrollHeight || card.getBoundingClientRect().height;
  if (measuredHeight > 0) return measuredHeight;

  if (!card.isConnected) return 80;

  const previousDisplay = card.style.display;
  const previousVisibility = card.style.visibility;
  card.style.display = "block";
  card.style.visibility = "hidden";

  const visibleHeight =
    card.offsetHeight || card.scrollHeight || card.getBoundingClientRect().height;

  card.style.display = previousDisplay;
  card.style.visibility = previousVisibility;

  return visibleHeight || 80;
}

export function createOverlay(
  doc: Document,
  options: CreateOverlayOptions,
): OverlayController {
  const cleanupHoverHandlers: Array<() => void> = [];
  let cleanupViewportHandlers: (() => void) | undefined;
  let renderFrame: number | undefined;
  let renderTimeout: number | undefined;
  const overlay = doc.createElement("div");
  overlay.setAttribute("data-hrk-overlay", "");
  overlay.style.cssText =
    "position:absolute;inset:0;z-index:2147483647;font:13px system-ui,sans-serif;pointer-events:none";

  const toolbar = doc.createElement("div");
  toolbar.setAttribute("data-hrk-toolbar", "");
  toolbar.style.cssText = [
    "position:fixed",
    "top:12px",
    "right:12px",
    "z-index:2147483647",
    "display:flex",
    "align-items:center",
    "gap:8px",
    "border:1px solid #d1d5db",
    "border-radius:8px",
    "padding:8px",
    "background:white",
    "box-shadow:0 10px 28px rgba(15,23,42,.16)",
    "pointer-events:auto",
  ].join(";");

  const count = doc.createElement("span");
  count.setAttribute("data-hrk-comment-count", "");
  count.style.cssText = "color:#374151";

  const modeButton = doc.createElement("button");
  modeButton.type = "button";
  modeButton.setAttribute("data-hrk-toggle-review-mode", "");

  const copyButton = doc.createElement("button");
  copyButton.type = "button";
  copyButton.setAttribute("data-hrk-copy-comments", "");
  copyButton.textContent = "Copy prompt";

  const buttonStyle = [
    "border:1px solid #2563eb",
    "border-radius:6px",
    "padding:6px 10px",
    "color:white",
    "background:#2563eb",
    "font:600 13px system-ui,sans-serif",
    "cursor:pointer",
    "pointer-events:auto",
  ].join(";");
  modeButton.style.cssText = buttonStyle;
  copyButton.style.cssText = buttonStyle;

  function updateModeButton(mode = options.getMode()) {
    modeButton.textContent =
      mode === "comment" ? "Disable review mode" : "Enable review mode";
  }

  modeButton.addEventListener("click", () => {
    options.setMode(options.getMode() === "comment" ? "off" : "comment");
  });

  copyButton.addEventListener("click", async () => {
    const prompt = buildAnnotationPrompt(
      options.artifact,
      options.getComments(),
    );
    await copyText(doc, prompt);
  });

  updateModeButton();
  toolbar.append(count, modeButton, copyButton);
  overlay.append(toolbar);

  const style = doc.createElement("style");
  style.textContent = `
    [data-hrk-mode="comment"] [data-hrk-hover-target="true"] {
      outline: 2px solid #2563eb !important;
      outline-offset: 3px !important;
      cursor: crosshair !important;
    }
  `;
  overlay.append(style);

  function clearInlineComments() {
    cleanupHoverHandlers.splice(0).forEach((cleanup) => cleanup());
    overlay
      .querySelectorAll("[data-hrk-inline-comment],[data-hrk-comment-marker]")
      .forEach((element) => element.remove());
  }

  function scheduleRender() {
    if (renderFrame !== undefined || renderTimeout !== undefined) return;
    const win = doc.defaultView;
    const renderComments = () => {
      renderFrame = undefined;
      renderTimeout = undefined;
      controller.render(options.getComments());
    };

    if (win?.requestAnimationFrame) {
      renderFrame = win.requestAnimationFrame(renderComments);
      return;
    }

    renderTimeout = win
      ? win.setTimeout(renderComments, 0)
      : (setTimeout(renderComments, 0) as unknown as number);
  }

  function ensureViewportHandlers() {
    if (cleanupViewportHandlers) return;
    const win = doc.defaultView;
    if (!win) return;

    win.addEventListener("resize", scheduleRender);
    win.addEventListener("scroll", scheduleRender, { passive: true });
    cleanupViewportHandlers = () => {
      win.removeEventListener("resize", scheduleRender);
      win.removeEventListener("scroll", scheduleRender);
    };
  }

  function bindHoverVisibility(
    target: Element,
    marker: HTMLElement,
    card: HTMLElement,
  ) {
    let targetHovered = false;
    let markerHovered = false;
    let cardHovered = false;

    const sync = () => {
      card.style.display =
        targetHovered || markerHovered || cardHovered ? "block" : "none";
    };
    const showForTarget = () => {
      targetHovered = true;
      sync();
    };
    const hideForTarget = () => {
      targetHovered = false;
      sync();
    };
    const showForMarker = () => {
      markerHovered = true;
      sync();
    };
    const hideForMarker = () => {
      markerHovered = false;
      sync();
    };
    const showForCard = () => {
      cardHovered = true;
      sync();
    };
    const hideForCard = () => {
      cardHovered = false;
      sync();
    };

    target.addEventListener("mouseenter", showForTarget);
    target.addEventListener("mouseleave", hideForTarget);
    marker.addEventListener("mouseenter", showForMarker);
    marker.addEventListener("mouseleave", hideForMarker);
    card.addEventListener("mouseenter", showForCard);
    card.addEventListener("mouseleave", hideForCard);
    cleanupHoverHandlers.push(() => {
      target.removeEventListener("mouseenter", showForTarget);
      target.removeEventListener("mouseleave", hideForTarget);
      marker.removeEventListener("mouseenter", showForMarker);
      marker.removeEventListener("mouseleave", hideForMarker);
      card.removeEventListener("mouseenter", showForCard);
      card.removeEventListener("mouseleave", hideForCard);
    });
    sync();
  }

  function positionInlineComment(
    card: HTMLElement,
    target: Element,
    stackOffset = 0,
  ) {
    const rect = target.getBoundingClientRect();
    const win = doc.defaultView;
    const scrollX = win?.scrollX ?? 0;
    const scrollY = win?.scrollY ?? 0;
    const viewportWidth = win?.innerWidth ?? doc.documentElement.clientWidth;
    const viewportHeight = win?.innerHeight ?? doc.documentElement.clientHeight;
    const margin = 12;
    const gap = 8;
    const preferredWidth = Math.max(220, Math.min(420, rect.width || 320));
    const width = Math.min(
      preferredWidth,
      Math.max(1, viewportWidth - margin * 2),
    );
    const viewportLeft = scrollX + margin;
    const viewportRight = scrollX + viewportWidth - margin;
    const viewportTop = scrollY + margin;
    const viewportBottom = scrollY + viewportHeight - margin;
    const rightSideLeft = rect.right + scrollX + gap;
    const leftSideLeft = rect.left + scrollX - gap - width;
    const fitsRight = rightSideLeft + width <= viewportRight;
    const preferredLeft = fitsRight ? rightSideLeft : leftSideLeft;
    const left = clamp(preferredLeft, viewportLeft, viewportRight - width);
    card.style.width = `${width}px`;
    const height = measureInlineCommentHeight(card);
    const top = clamp(
      rect.top + scrollY + stackOffset,
      viewportTop,
      viewportBottom - height,
    );

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function positionMarker(
    marker: HTMLElement,
    target: Element,
    offset: number,
  ) {
    const rect = target.getBoundingClientRect();
    const win = doc.defaultView;
    const scrollX = win?.scrollX ?? 0;
    const scrollY = win?.scrollY ?? 0;
    const viewportWidth = win?.innerWidth ?? doc.documentElement.clientWidth;
    const viewportHeight = win?.innerHeight ?? doc.documentElement.clientHeight;
    const margin = 6;
    const markerSize = 20;
    const left = clamp(
      rect.right + scrollX - markerSize / 2 + offset,
      scrollX + margin,
      scrollX + viewportWidth - markerSize - margin,
    );
    const top = clamp(
      rect.top + scrollY - markerSize / 2,
      scrollY + margin,
      scrollY + viewportHeight - markerSize - margin,
    );

    marker.style.left = `${left}px`;
    marker.style.top = `${top}px`;
  }

  function createCommentMarker(comment: ArtifactComment, index: number) {
    const marker = doc.createElement("button");
    marker.type = "button";
    marker.setAttribute("data-hrk-comment-marker", comment.id);
    marker.setAttribute("aria-label", `Show comment ${index + 1}`);
    marker.textContent = String(index + 1);
    marker.style.cssText = [
      "position:absolute",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "width:20px",
      "height:20px",
      "border:2px solid white",
      "border-radius:999px",
      "color:white",
      "background:#2563eb",
      "box-shadow:0 3px 10px rgba(15,23,42,.24)",
      "font:700 11px system-ui,sans-serif",
      "cursor:pointer",
      "pointer-events:auto",
    ].join(";");
    return marker;
  }

  function createInlineComment(
    comment: ArtifactComment,
    index: number,
  ): HTMLElement {
    const card = doc.createElement("aside");
    card.setAttribute("data-hrk-inline-comment", comment.id);
    card.setAttribute("aria-label", `Comment ${index + 1}`);
    card.style.cssText = [
      "position:absolute",
      "display:none",
      "border:1px solid #bfdbfe",
      "border-left:4px solid #2563eb",
      "border-radius:8px",
      "padding:10px 12px",
      "color:#111827",
      "background:#eff6ff",
      "font:13px system-ui,sans-serif",
      "box-shadow:0 8px 22px rgba(15,23,42,.14)",
      "pointer-events:auto",
    ].join(";");

    const title = doc.createElement("strong");
    title.textContent = `Comment ${index + 1}`;
    title.style.cssText = "display:block;margin-bottom:4px;color:#1d4ed8";

    const body = doc.createElement("p");
    body.textContent = comment.body;
    body.style.cssText = "margin:0";

    card.append(title, body);
    return card;
  }

  const controller: OverlayController = {
    element: overlay,
    render(comments) {
      ensureViewportHandlers();
      clearInlineComments();
      count.textContent = `${comments.filter((comment) => comment.status === "open").length} open`;
      const targetCounts = new WeakMap<Element, number>();
      comments.forEach((comment, index) => {
        if (comment.status !== "open") return;
        const target = resolveTarget(options.root, comment.target);
        const card = createInlineComment(comment, index);
        if (target) {
          const previousCount = targetCounts.get(target) ?? 0;
          const stackOffset = previousCount * 12;
          const marker = createCommentMarker(comment, index);
          positionMarker(marker, target, stackOffset);
          targetCounts.set(target, previousCount + 1);
          overlay.append(marker);
          overlay.append(card);
          positionInlineComment(card, target, stackOffset);
          bindHoverVisibility(target, marker, card);
        } else {
          overlay.append(card);
        }
      });
    },
    setMode(mode) {
      updateModeButton(mode);
    },
    destroy() {
      clearInlineComments();
      cleanupViewportHandlers?.();
      cleanupViewportHandlers = undefined;
      if (renderFrame !== undefined) {
        doc.defaultView?.cancelAnimationFrame?.(renderFrame);
        renderFrame = undefined;
      }
      if (renderTimeout !== undefined) {
        if (doc.defaultView) {
          doc.defaultView.clearTimeout(renderTimeout);
        } else {
          clearTimeout(renderTimeout);
        }
        renderTimeout = undefined;
      }
      overlay.remove();
    },
  };

  return controller;
}
