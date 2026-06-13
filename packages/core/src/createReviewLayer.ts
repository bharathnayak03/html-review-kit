import { createTargetFromElement } from "./anchors/createTargetFromElement";
import { createCommentStore } from "./comments/createCommentStore";
import { createOverlay } from "./overlay/createOverlay";
import type {
  AddCommentInput,
  CreateReviewLayerOptions,
  ReviewLayerInstance,
  ReviewMode,
} from "./types";

function getDocument(root: HTMLElement | Document): Document {
  return root instanceof Document ? root : root.ownerDocument;
}

function getRootElement(root: HTMLElement | Document): HTMLElement {
  return root instanceof Document ? root.body : root;
}

export function createReviewLayer(
  options: CreateReviewLayerOptions,
): ReviewLayerInstance {
  const doc = getDocument(options.root);
  const rootElement = getRootElement(options.root);
  let mode: ReviewMode = options.mode ?? "off";
  let enabled = false;

  const store = createCommentStore({
    artifact: options.artifact,
    comments: options.comments,
    onCommentCreate: options.onCommentCreate,
    onCommentUpdate: options.onCommentUpdate,
    onCommentDelete: options.onCommentDelete,
    onCommentsChange(comments) {
      overlay.render(comments);
      options.onCommentsChange?.(comments);
    },
  });
  const overlay = createOverlay(doc, {
    artifact: options.artifact,
    root: rootElement,
    getComments: store.getComments,
    exportReviewPacket: store.exportReviewPacket,
    getMode: () => mode,
    setMode: setModeValue,
  });

  function setModeValue(nextMode: ReviewMode) {
    mode = nextMode;
    if (enabled) {
      rootElement.dataset.hrkMode = mode;
      overlay.setMode(mode);
      if (mode !== "comment") clearHoverTarget();
      if (mode !== "inspect") clearInspectTarget();
    }
  }

  let hoverTarget: Element | undefined;
  let inspectTarget: Element | undefined;

  function clearHoverTarget() {
    hoverTarget?.removeAttribute("data-hrk-hover-target");
    hoverTarget = undefined;
  }

  function clearInspectTarget() {
    inspectTarget?.removeAttribute("data-hrk-inspect-target");
    inspectTarget = undefined;
    overlay.clearInspect();
  }

  function handleMouseover(event: MouseEvent) {
    if (!enabled || mode === "off") return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest("[data-hrk-overlay]"))
      return;

    if (mode === "inspect") {
      if (target === inspectTarget) return;

      clearInspectTarget();
      inspectTarget = target;
      inspectTarget.setAttribute("data-hrk-inspect-target", "true");
      overlay.inspect(target, createTargetFromElement(target));
      return;
    }

    if (options.readonly || target === hoverTarget) return;

    clearHoverTarget();
    hoverTarget = target;
    hoverTarget.setAttribute("data-hrk-hover-target", "true");
  }

  function handleMouseout(event: MouseEvent) {
    const activeTarget = mode === "inspect" ? inspectTarget : hoverTarget;
    if (!activeTarget) return;
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && activeTarget.contains(relatedTarget))
      return;

    clearHoverTarget();
    clearInspectTarget();
  }

  function handleClick(event: MouseEvent) {
    if (!enabled || mode !== "comment" || options.readonly) return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest("[data-hrk-overlay]"))
      return;

    const body = doc.defaultView?.prompt?.("Comment on this element");
    if (!body) return;

    event.preventDefault();
    event.stopPropagation();
    store.addComment({ body, target: createTargetFromElement(target) });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setModeValue("off");
    }
    if (event.key.toLowerCase() === "c") {
      setModeValue("comment");
    }
    if (event.key.toLowerCase() === "v") {
      setModeValue("inspect");
    }
  }

  function mount() {
    if (enabled) return;
    enabled = true;
    rootElement.append(overlay.element);
    overlay.render(store.getComments());
    setModeValue(mode);
    rootElement.addEventListener("click", handleClick, true);
    rootElement.addEventListener("mouseover", handleMouseover, true);
    rootElement.addEventListener("mouseout", handleMouseout, true);
    doc.addEventListener("keydown", handleKeydown);
  }

  function unmount() {
    if (!enabled) return;
    enabled = false;
    overlay.destroy();
    clearHoverTarget();
    clearInspectTarget();
    delete rootElement.dataset.hrkMode;
    rootElement.removeEventListener("click", handleClick, true);
    rootElement.removeEventListener("mouseover", handleMouseover, true);
    rootElement.removeEventListener("mouseout", handleMouseout, true);
    doc.removeEventListener("keydown", handleKeydown);
  }

  if (mode !== "off") mount();

  return {
    enable: mount,
    disable: unmount,
    setMode(nextMode) {
      setModeValue(nextMode);
    },
    getComments: store.getComments,
    addComment(input: AddCommentInput) {
      return store.addComment(input);
    },
    updateComment: store.updateComment,
    deleteComment: store.deleteComment,
    exportReviewPacket: store.exportReviewPacket,
    importReviewPacket(packet) {
      store.importReviewPacket(packet);
      overlay.render(store.getComments());
    },
    destroy: unmount,
  };
}
