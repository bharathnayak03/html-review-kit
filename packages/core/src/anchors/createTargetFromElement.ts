import type { ArtifactTarget } from "../types";
import { generateAnchorId } from "./generateAnchorId";
import { generateCssSelector } from "./generateCssSelector";
import { generateXPath } from "./generateXPath";

function compactText(value: string | null | undefined): string | undefined {
  const compacted = value?.replace(/\s+/g, " ").trim();
  return compacted || undefined;
}

function headingContext(element: Element): string | undefined {
  return compactText(element.querySelector("h1,h2,h3,h4,h5,h6")?.textContent);
}

export function createTargetFromElement(element: Element): ArtifactTarget {
  const nearbyText = compactText(element.textContent);
  const htmlSnippet = element.outerHTML.slice(0, 1000);

  return {
    anchorId: generateAnchorId(element),
    xpath: generateXPath(element),
    cssSelector: generateCssSelector(element),
    textQuote: nearbyText?.slice(0, 160),
    htmlSnippet,
    elementFingerprint: {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      classNames: Array.from(element.classList),
      role: element.getAttribute("role") || undefined,
      ariaLabel: element.getAttribute("aria-label") || undefined,
      headingContext: headingContext(element),
      nearbyText,
    },
  };
}
