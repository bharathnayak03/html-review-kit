function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function generateAnchorId(element: Element): string {
  const existing = element.getAttribute("data-hrk-id") || element.id;
  if (existing) return toKebabCase(existing);

  const label =
    element.getAttribute("aria-label") ||
    element.querySelector("h1,h2,h3,h4,h5,h6")?.textContent ||
    element.textContent ||
    element.tagName.toLowerCase();
  const text = toKebabCase(label);
  const tag = element.tagName.toLowerCase();

  return text ? `${tag}-${text}` : tag;
}
