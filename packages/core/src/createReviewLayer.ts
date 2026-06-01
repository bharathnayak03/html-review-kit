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

export function createReviewLayer(options: CreateReviewLayerOptions): ReviewLayerInstance {
  const doc = getDocument(options.root);
  const rootElement = getRootElement(options.root);
  const overlay = createOverlay(doc);
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

  function handleClick(event: MouseEvent) {
    if (!enabled || mode !== "comment" || options.readonly) return;
    const target = event.target;
    if (!(target instanceof Element) || target.closest("[data-hrk-overlay]")) return;

    const body = doc.defaultView?.prompt?.("Comment on this element");
    if (!body) return;

    event.preventDefault();
    event.stopPropagation();
    store.addComment({ body, target: createTargetFromElement(target) });
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      mode = "off";
      rootElement.dataset.hrkMode = mode;
    }
    if (event.key.toLowerCase() === "c") {
      mode = "comment";
      rootElement.dataset.hrkMode = mode;
    }
    if (event.key.toLowerCase() === "v") {
      mode = "inspect";
      rootElement.dataset.hrkMode = mode;
    }
  }

  function mount() {
    if (enabled) return;
    enabled = true;
    rootElement.append(overlay.element);
    overlay.render(store.getComments());
    rootElement.dataset.hrkMode = mode;
    rootElement.addEventListener("click", handleClick, true);
    doc.addEventListener("keydown", handleKeydown);
  }

  function unmount() {
    if (!enabled) return;
    enabled = false;
    overlay.destroy();
    delete rootElement.dataset.hrkMode;
    rootElement.removeEventListener("click", handleClick, true);
    doc.removeEventListener("keydown", handleKeydown);
  }

  if (mode !== "off") mount();

  return {
    enable: mount,
    disable: unmount,
    setMode(nextMode) {
      mode = nextMode;
      if (enabled) rootElement.dataset.hrkMode = mode;
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
