import type { ArtifactComment, ArtifactInfo } from "../types";

export type AnnotationSelector =
  | { type: "FragmentSelector"; value: string }
  | { type: "CssSelector"; value: string }
  | { type: "XPathSelector"; value: string }
  | { type: "TextQuoteSelector"; exact: string }
  | { type: "TextPositionSelector"; start: number; end: number };

export function buildSelectors(
  comment: ArtifactComment,
): AnnotationSelector[] {
  const selectors: AnnotationSelector[] = [];

  if (comment.target.anchorId) {
    selectors.push({
      type: "FragmentSelector",
      value: `data-hrk-id=${comment.target.anchorId}`,
    });
  }
  if (comment.target.cssSelector) {
    selectors.push({ type: "CssSelector", value: comment.target.cssSelector });
  }
  if (comment.target.xpath) {
    selectors.push({ type: "XPathSelector", value: comment.target.xpath });
  }
  if (comment.target.textQuote) {
    selectors.push({
      type: "TextQuoteSelector",
      exact: comment.target.textQuote,
    });
  }
  if (comment.target.textPosition) {
    selectors.push({
      type: "TextPositionSelector",
      start: comment.target.textPosition.start,
      end: comment.target.textPosition.end,
    });
  }

  return selectors;
}

export function buildAnnotationPrompt(
  artifact: ArtifactInfo,
  comments: ArtifactComment[],
): string {
  const source = artifact.sourceFile ?? artifact.artifactId;
  const openComments = comments.filter((comment) => comment.status === "open");
  const annotationCollection = {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    type: "AnnotationCollection",
    id: `urn:html-review-kit:${artifact.artifactId}:annotations`,
    total: openComments.length,
    items: openComments.map((comment) => ({
      id: `urn:html-review-kit:${artifact.artifactId}:${comment.id}`,
      type: "Annotation",
      motivation: "commenting",
      created: comment.createdAt,
      ...(comment.updatedAt ? { modified: comment.updatedAt } : {}),
      body: {
        type: "TextualBody",
        purpose: "commenting",
        value: comment.body,
        format: "text/plain",
        ...(comment.aiInstruction
          ? { htmlReviewKitInstruction: comment.aiInstruction }
          : {}),
      },
      target: {
        type: "SpecificResource",
        source,
        selector: buildSelectors(comment),
        htmlReviewKitTarget: comment.target,
      },
    })),
  };

  return [
    "Apply these HTML Review Kit annotations to the source HTML artifact.",
    "",
    `Artifact: ${artifact.title ?? artifact.artifactId}`,
    `Source file: ${source}`,
    "",
    "Process only annotations with motivation \"commenting\". Use target.htmlReviewKitTarget first, then FragmentSelector/data-hrk-id, TextQuoteSelector, CssSelector, XPathSelector, and nearby HTML context. Preserve semantic HTML and stable data-hrk-id anchors. Summarize which annotations were applied and which could not be resolved.",
    "",
    "HTML annotations:",
    JSON.stringify(annotationCollection, null, 2),
  ].join("\n");
}
