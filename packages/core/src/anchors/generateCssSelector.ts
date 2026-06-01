function escapeSelectorValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function elementIndex(element: Element): number {
  if (!element.parentElement) return 1;
  const siblings = Array.from(element.parentElement.children).filter(
    (sibling) => sibling.tagName === element.tagName,
  );
  return siblings.indexOf(element) + 1;
}

export function generateCssSelector(element: Element): string {
  const anchorId = element.getAttribute("data-hrk-id");
  if (anchorId) return `[data-hrk-id="${escapeSelectorValue(anchorId)}"]`;

  if (element.id) return `#${CSS.escape(element.id)}`;

  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const tag = current.tagName.toLowerCase();
    const classes = Array.from(current.classList)
      .slice(0, 2)
      .map((className) => `.${CSS.escape(className)}`)
      .join("");
    const index = elementIndex(current);
    const segment = `${tag}${classes}:nth-of-type(${index})`;
    segments.unshift(segment);
    current = current.parentElement;

    if (current?.tagName.toLowerCase() === "html") break;
  }

  return segments.join(" > ");
}
