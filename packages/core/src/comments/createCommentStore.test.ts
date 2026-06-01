import { describe, expect, it, vi } from "vitest";
import { createCommentStore } from "./createCommentStore";

describe("createCommentStore", () => {
  it("adds, updates, deletes, exports, and imports comments", () => {
    const onCommentCreate = vi.fn();
    const onCommentUpdate = vi.fn();
    const onCommentDelete = vi.fn();
    const onCommentsChange = vi.fn();
    const store = createCommentStore({
      artifact: { artifactId: "demo", sourceFile: "index.html" },
      comments: [],
      onCommentCreate,
      onCommentUpdate,
      onCommentDelete,
      onCommentsChange,
    });

    const comment = store.addComment({
      body: "Tighten the headline.",
      target: { anchorId: "hero" },
    });

    expect(comment).toMatchObject({
      artifactId: "demo",
      status: "open",
      body: "Tighten the headline.",
      target: { anchorId: "hero" },
    });
    expect(comment.id).toMatch(/^cmt_/);
    expect(comment.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(onCommentCreate).toHaveBeenCalledWith(comment);
    expect(onCommentsChange).toHaveBeenCalledWith([comment]);

    store.updateComment(comment.id, { body: "Make the headline clearer.", status: "resolved" });
    const updated = store.getComments()[0];
    expect(updated.body).toBe("Make the headline clearer.");
    expect(updated.status).toBe("resolved");
    expect(updated.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(onCommentUpdate).toHaveBeenCalledWith(updated);

    const packet = store.exportReviewPacket();
    expect(packet).toMatchObject({
      schemaVersion: "0.1",
      artifact: { artifactId: "demo", sourceFile: "index.html" },
      comments: [updated],
    });

    store.deleteComment(comment.id);
    expect(store.getComments()).toEqual([]);
    expect(onCommentDelete).toHaveBeenCalledWith(comment.id);

    store.importReviewPacket(packet);
    expect(store.getComments()).toEqual([updated]);
  });
});
