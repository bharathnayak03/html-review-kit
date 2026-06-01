import type { ArtifactReviewPacket } from "@html-review-kit/core";

export function buildApplyCommentsPrompt(packet: ArtifactReviewPacket): string {
  const openComments = packet.comments.filter((comment) => comment.status === "open");
  const commentsJson = JSON.stringify(openComments, null, 2);

  return `You are updating an AI-generated HTML artifact.

Artifact ID: ${packet.artifact.artifactId}
Source file: ${packet.artifact.sourceFile ?? "not specified"}
Review packet schema: ${packet.schemaVersion}

Use the following open review comments to update the artifact source.

Rules:
- Prefer target anchors in this order: anchorId, textQuote, cssSelector, xpath, beforeText / afterText, htmlSnippet.
- Prefer and preserve data-hrk-id anchors.
- Preserve semantic HTML.
- Do not remove unrelated content.
- Keep the existing layout unless a comment requests layout changes.
- Mark each open comment as resolved or explain why it could not be resolved.
- Write resolved output to .review/html-review-comments.resolved.json.

COMMENTS:
${commentsJson}
`;
}
