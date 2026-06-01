import type { ArtifactComment, CommentStorageAdapter } from "../types";

export function localStorageAdapter(key = "html-review-kit:comments"): CommentStorageAdapter {
  return {
    async load() {
      const raw = globalThis.localStorage?.getItem(key);
      if (!raw) return [];
      return JSON.parse(raw) as ArtifactComment[];
    },

    async save(comments) {
      globalThis.localStorage?.setItem(key, JSON.stringify(comments));
    },
  };
}
