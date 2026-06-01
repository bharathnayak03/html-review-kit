import type { ArtifactComment, CommentStorageAdapter } from "../types";

export function memoryStorageAdapter(initialComments: ArtifactComment[] = []): CommentStorageAdapter {
  let comments = initialComments.map((comment) => ({ ...comment }));

  return {
    async load() {
      return comments.map((comment) => ({ ...comment }));
    },

    async save(nextComments) {
      comments = nextComments.map((comment) => ({ ...comment }));
    },
  };
}
