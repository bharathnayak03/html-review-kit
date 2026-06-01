function xpathSegment(element: Element): string {
  if (!element.parentElement) return `/${element.tagName.toLowerCase()}`;

  const sameTagSiblings = Array.from(element.parentElement.children).filter(
    (sibling) => sibling.tagName === element.tagName,
  );
  const index = sameTagSiblings.indexOf(element) + 1;

  return `/${element.tagName.toLowerCase()}[${index}]`;
}

export function generateXPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    segments.unshift(xpathSegment(current));
    current = current.parentElement;
  }

  return segments.join("");
}
