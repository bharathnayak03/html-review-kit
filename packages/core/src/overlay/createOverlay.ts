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

function buildAnnotationClipboardPayload(
  artifact: ArtifactInfo,
  comments: ArtifactComment[],
) {
  const source = artifact.sourceFile ?? artifact.artifactId;
  const openComments = comments.filter((comment) => comment.status === "open");

  return {
    prompt:
      "Revisit this HTML artifact and apply every annotation. Use the target selectors to locate each node, preferring data-hrk-id, then CSS selector, XPath, text quote, and text position.",
    htmlReviewKit: {
      artifact,
      annotationCount: openComments.length,
      generatedBy: "@html-review-kit/core",
    },
    annotationCollection: {
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
    },
  };
}

function downloadJson(doc: Document, filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = doc.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
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

export function createOverlay(
  doc: Document,
  options: CreateOverlayOptions,
): OverlayController {
  const cleanupHoverHandlers: Array<() => void> = [];
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

  const exportButton = doc.createElement("button");
  exportButton.type = "button";
  exportButton.setAttribute("data-hrk-export-json", "");
  exportButton.textContent = "Export JSON";

  const copyButton = doc.createElement("button");
  copyButton.type = "button";
  copyButton.setAttribute("data-hrk-copy-comments", "");
  copyButton.textContent = "Copy annotations";

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
  exportButton.style.cssText = buttonStyle;
  copyButton.style.cssText = buttonStyle;

  function updateModeButton(mode = options.getMode()) {
    modeButton.textContent =
      mode === "comment" ? "Disable review mode" : "Enable review mode";
  }

  modeButton.addEventListener("click", () => {
    options.setMode(options.getMode() === "comment" ? "off" : "comment");
  });

  exportButton.addEventListener("click", () => {
    downloadJson(
      doc,
      "html-review-comments.json",
      options.exportReviewPacket(),
    );
  });

  copyButton.addEventListener("click", async () => {
    const payload = buildAnnotationClipboardPayload(
      options.artifact,
      options.getComments(),
    );
    await copyText(doc, JSON.stringify(payload, null, 2));
  });

  updateModeButton();
  toolbar.append(count, modeButton, exportButton, copyButton);
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

  function positionInlineComment(card: HTMLElement, target: Element) {
    const rect = target.getBoundingClientRect();
    const scrollX = doc.defaultView?.scrollX ?? 0;
    const scrollY = doc.defaultView?.scrollY ?? 0;
    const left = Math.max(12, rect.right + scrollX + 8);
    const top = Math.max(12, rect.top + scrollY);
    const width = Math.max(220, Math.min(420, rect.width || 320));

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.width = `${width}px`;
  }

  function positionMarker(
    marker: HTMLElement,
    target: Element,
    offset: number,
  ) {
    const rect = target.getBoundingClientRect();
    const scrollX = doc.defaultView?.scrollX ?? 0;
    const scrollY = doc.defaultView?.scrollY ?? 0;
    const left = Math.max(6, rect.right + scrollX - 10 + offset);
    const top = Math.max(6, rect.top + scrollY - 10);

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

  return {
    element: overlay,
    render(comments) {
      clearInlineComments();
      count.textContent = `${comments.filter((comment) => comment.status === "open").length} open`;
      const targetCounts = new WeakMap<Element, number>();
      comments.forEach((comment, index) => {
        if (comment.status !== "open") return;
        const target = resolveTarget(options.root, comment.target);
        const card = createInlineComment(comment, index);
        if (target) {
          const previousCount = targetCounts.get(target) ?? 0;
          const marker = createCommentMarker(comment, index);
          positionMarker(marker, target, previousCount * 12);
          positionInlineComment(card, target);
          card.style.transform = `translateY(${previousCount * 12}px)`;
          targetCounts.set(target, previousCount + 1);
          bindHoverVisibility(target, marker, card);
          overlay.append(marker);
          overlay.append(card);
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
      overlay.remove();
    },
  };
}
