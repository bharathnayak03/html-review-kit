import type { ArtifactComment, ArtifactInfo, ArtifactReviewPacket } from "../types";

export function exportReviewPacket(
  artifact: ArtifactInfo,
  comments: ArtifactComment[],
  instructions?: string,
): ArtifactReviewPacket {
  return {
    schemaVersion: "0.1",
    artifact,
    comments: comments.map((comment) => ({ ...comment })),
    exportedAt: new Date().toISOString(),
    ...(instructions ? { instructions } : {}),
  };
}
