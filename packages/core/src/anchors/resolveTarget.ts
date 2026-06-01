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

function findByText(root: Document | Element, text: string): Element | null {
  const doc = ownerDocument(root);
  const walker = doc.createTreeWalker(
    root instanceof Document ? root.body : root,
    NodeFilter.SHOW_ELEMENT,
  );

  let candidate: Element | null = null;
  let current = walker.currentNode;
  while (current) {
    if (current instanceof Element && current.textContent?.includes(text)) {
      candidate = current;
    }
    current = walker.nextNode();
  }

  if (
    candidate &&
    !candidate.id &&
    candidate.classList.length === 0 &&
    !candidate.getAttribute("data-hrk-id") &&
    candidate.parentElement &&
    candidate.parentElement !== doc.body
  ) {
    return candidate.parentElement;
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
    const byAnchor = query(root, `[data-hrk-id="${target.anchorId}"]`) || query(root, `#${target.anchorId}`);
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
