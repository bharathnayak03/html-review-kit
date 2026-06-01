import type { ArtifactComment } from "../types";
import { createSidebar } from "./createSidebar";

export interface OverlayController {
  element: HTMLElement;
  render(comments: ArtifactComment[]): void;
  destroy(): void;
}

export function createOverlay(doc: Document): OverlayController {
  const overlay = doc.createElement("div");
  overlay.setAttribute("data-hrk-overlay", "");
  overlay.style.cssText = "position:relative;z-index:2147483647";

  const pins = doc.createElement("div");
  pins.setAttribute("data-hrk-pins", "");

  const sidebar = createSidebar(doc);
  overlay.append(pins, sidebar.element);

  return {
    element: overlay,
    render(comments) {
      pins.replaceChildren();
      comments.forEach((comment, index) => {
        const pin = doc.createElement("button");
        pin.type = "button";
        pin.setAttribute("aria-label", `Comment ${index + 1}: ${comment.body}`);
        pin.setAttribute("data-hrk-pin", comment.id);
        pin.textContent = String(index + 1);
        pin.style.cssText = [
          "position:fixed",
          `top:${72 + index * 28}px`,
          "right:316px",
          "width:24px",
          "height:24px",
          "border-radius:999px",
          "border:0",
          "background:#2563eb",
          "color:white",
          "font:12px system-ui,sans-serif",
          "cursor:pointer",
        ].join(";");
        pins.append(pin);
      });
      sidebar.render(comments);
    },
    destroy() {
      overlay.remove();
    },
  };
}
