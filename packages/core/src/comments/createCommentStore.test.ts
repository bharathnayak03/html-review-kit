import { describe, expect, it, vi } from "vitest";
import type { ArtifactComment } from "../types";
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

  it("loads comments from storage and keeps caller-owned comments immutable", async () => {
    const storedComment: ArtifactComment = {
      id: "cmt_stored",
      artifactId: "demo",
      status: "open",
      body: "Stored comment.",
      target: { anchorId: "hero" },
      createdAt: "2026-06-01T10:00:00.000Z",
    };
    const storage = {
      load: vi.fn().mockResolvedValue([storedComment]),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const onCommentsChange = vi.fn();
    const store = createCommentStore({
      artifact: { artifactId: "demo" },
      storage,
      onCommentsChange,
    });

    const loaded = await store.loadComments();
    loaded[0].body = "Mutated loaded copy.";
    storedComment.body = "Mutated source copy.";

    expect(storage.load).toHaveBeenCalledTimes(1);
    expect(store.getComments()).toEqual([
      {
        ...storedComment,
        body: "Stored comment.",
      },
    ]);
    expect(onCommentsChange).toHaveBeenCalledWith([
      {
        ...storedComment,
        body: "Stored comment.",
      },
    ]);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("saves comments to storage after create, update, delete, import, and explicit save", async () => {
    const savedSnapshots: ArtifactComment[][] = [];
    const storage = {
      load: vi.fn().mockResolvedValue([]),
      save: vi.fn(async (comments: ArtifactComment[]) => {
        savedSnapshots.push(structuredClone(comments));
      }),
    };
    const importedComment: ArtifactComment = {
      id: "cmt_imported",
      artifactId: "demo",
      status: "open",
      body: "Imported comment.",
      target: { anchorId: "cta" },
      createdAt: "2026-06-01T10:00:00.000Z",
    };
    const store = createCommentStore({
      artifact: { artifactId: "demo" },
      storage,
    });

    const created = store.addComment({
      body: "Persist this.",
      target: { anchorId: "hero" },
    });

    expect(storage.save).toHaveBeenLastCalledWith([created]);

    store.updateComment(created.id, { body: "Persist the update." });

    expect(storage.save).toHaveBeenLastCalledWith([
      expect.objectContaining({
        id: created.id,
        body: "Persist the update.",
      }),
    ]);

    store.deleteComment(created.id);

    expect(storage.save).toHaveBeenLastCalledWith([]);

    store.importReviewPacket({
      schemaVersion: "0.1",
      artifact: { artifactId: "demo" },
      comments: [importedComment],
      exportedAt: "2026-06-01T10:00:00.000Z",
    });

    expect(storage.save).toHaveBeenLastCalledWith([importedComment]);

    await store.saveComments();

    expect(storage.save).toHaveBeenCalledTimes(5);
    expect(savedSnapshots[0]).toEqual([created]);
    expect(savedSnapshots[1][0]).toMatchObject({
      id: created.id,
      body: "Persist the update.",
    });
    expect(savedSnapshots[2]).toEqual([]);
    expect(savedSnapshots[3]).toEqual([importedComment]);
    expect(savedSnapshots[4]).toEqual([importedComment]);
  });
});
