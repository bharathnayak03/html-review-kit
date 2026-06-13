import type { ArtifactComment, CommentStorageAdapter } from "../types";

function cloneComments(comments: ArtifactComment[]): ArtifactComment[] {
  return structuredClone(comments);
}

export function memoryStorageAdapter(initialComments: ArtifactComment[] = []): CommentStorageAdapter {
  let comments = cloneComments(initialComments);

  return {
    async load() {
      return cloneComments(comments);
    },

    async save(nextComments) {
      comments = cloneComments(nextComments);
    },
  };
}
