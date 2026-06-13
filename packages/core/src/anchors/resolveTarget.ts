import type { ArtifactTarget } from "../types";

function ownerDocument(root: Document | Element): Document {
  return root instanceof Document ? root : root.ownerDocument;
}

function query(root: Document | Element, selector: string): Element | null {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}

function escapeAttributeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\A ")
    .replace(/\r/g, "\\D ")
    .replace(/\f/g, "\\C ");
}

function escapeIdentifier(value: string): string {
  if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);

  const chars = Array.from(value);
  return chars
    .map((char, index) => {
      const codePoint = char.codePointAt(0);
      if (codePoint === undefined) return "";
      if (codePoint === 0) return "\uFFFD";

      const isDigit = codePoint >= 0x30 && codePoint <= 0x39;
      const isLetter =
        (codePoint >= 0x41 && codePoint <= 0x5a) || (codePoint >= 0x61 && codePoint <= 0x7a);
      const isSafe = isLetter || isDigit || char === "_" || char === "-" || codePoint >= 0x80;
      const next = chars[index + 1];

      if (index === 0 && isDigit) return `\\${codePoint.toString(16)} `;
      if (index === 0 && char === "-" && value.length === 1) return "\\-";
      if (index === 0 && char === "-" && next && /\d/.test(next)) return "\\-";

      return isSafe ? char : `\\${char}`;
    })
    .join("");
}

function hasMatchingElementChild(element: Element, text: string): boolean {
  return Array.from(element.children).some((child) => child.textContent?.includes(text));
}

function findByText(root: Document | Element, text: string): Element | null {
  const doc = ownerDocument(root);
  const walker = doc.createTreeWalker(
    root instanceof Document ? root.body : root,
    NodeFilter.SHOW_ELEMENT,
  );

  let candidate: Element | null = null;
  let current: Node | null = walker.currentNode;
  while (current) {
    if (
      current instanceof Element &&
      current.textContent?.includes(text) &&
      !hasMatchingElementChild(current, text)
    ) {
      candidate = current;
    }
    current = walker.nextNode();
  }

  return candidate;
}

function findByXPath(root: Document | Element, xpath: string): Element | null {
  try {
    const doc = ownerDocument(root);
    const result = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE);
    return result.singleNodeValue instanceof Element ? result.singleNodeValue : null;
  } catch {
    return null;
  }
}

export function resolveTarget(root: Document | Element, target: ArtifactTarget): Element | null {
  if (target.anchorId) {
    const byAnchor =
      query(root, `[data-hrk-id="${escapeAttributeValue(target.anchorId)}"]`) ||
      query(root, `#${escapeIdentifier(target.anchorId)}`);
    if (byAnchor) return byAnchor;
  }

  if (target.textQuote) {
    const byText = findByText(root, target.textQuote);
    if (byText) return byText;
  }

  if (target.cssSelector) {
    const bySelector = query(root, target.cssSelector);
    if (bySelector) return bySelector;
  }

  if (target.xpath) {
    const byXPath = findByXPath(root, target.xpath);
    if (byXPath) return byXPath;
  }

  if (target.beforeText || target.afterText) {
    const text = [target.beforeText, target.afterText].filter(Boolean).join(" ");
    const byContext = findByText(root, text);
    if (byContext) return byContext;
  }

  if (target.htmlSnippet) {
    return findByText(root, target.htmlSnippet.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  }

  return null;
}
