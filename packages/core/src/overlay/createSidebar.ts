import type { ArtifactComment } from "../types";

export interface SidebarController {
  element: HTMLElement;
  render(comments: ArtifactComment[]): void;
}

export function createSidebar(doc: Document): SidebarController {
  const sidebar = doc.createElement("aside");
  sidebar.setAttribute("data-hrk-sidebar", "");
  sidebar.setAttribute("aria-label", "HTML Review Kit comments");
  sidebar.style.cssText = [
    "position:fixed",
    "top:16px",
    "right:16px",
    "z-index:2147483647",
    "width:280px",
    "max-height:calc(100vh - 32px)",
    "overflow:auto",
    "background:white",
    "color:#111827",
    "border:1px solid #d1d5db",
    "border-radius:8px",
    "box-shadow:0 12px 32px rgba(15,23,42,.18)",
    "font:13px system-ui,sans-serif",
    "padding:12px",
  ].join(";");

  return {
    element: sidebar,
    render(comments) {
      sidebar.replaceChildren();
      const title = doc.createElement("strong");
      title.textContent = `Comments (${comments.length})`;
      sidebar.append(title);

      const list = doc.createElement("ol");
      list.style.cssText = "margin:10px 0 0;padding-left:20px;display:grid;gap:8px";
      for (const comment of comments) {
        const item = doc.createElement("li");
        item.textContent = `${comment.status}: ${comment.body}`;
        list.append(item);
      }
      sidebar.append(list);
    },
  };
}
