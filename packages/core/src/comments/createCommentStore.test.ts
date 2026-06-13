import { describe, expect, it, vi } from "vitest";
import type { ArtifactComment } from "../types";
import { createCommentStore } from "./createCommentStore";

async function waitForSaveCount(
  storage: { save: ReturnType<typeof vi.fn> },
  count: number,
): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (storage.save.mock.calls.length === count) return;
    await Promise.resolve();
  }

  expect(storage.save).toHaveBeenCalledTimes(count);
}

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
    await waitForSaveCount(storage, 2);

    expect(storage.save).toHaveBeenLastCalledWith([
      expect.objectContaining({
        id: created.id,
        body: "Persist the update.",
      }),
    ]);

    store.deleteComment(created.id);
    await waitForSaveCount(storage, 3);

    expect(storage.save).toHaveBeenLastCalledWith([]);

    store.importReviewPacket({
      schemaVersion: "0.1",
      artifact: { artifactId: "demo" },
      comments: [importedComment],
      exportedAt: "2026-06-01T10:00:00.000Z",
    });
    await waitForSaveCount(storage, 4);

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

  it("serializes automatic saves so rapid mutations persist the latest snapshot last", async () => {
    const savedSnapshots: ArtifactComment[][] = [];
    const releaseSave: Array<() => void> = [];
    const storage = {
      load: vi.fn().mockResolvedValue([]),
      save: vi.fn(
        (comments: ArtifactComment[]) =>
          new Promise<void>((resolve) => {
            savedSnapshots.push(structuredClone(comments));
            releaseSave.push(resolve);
          }),
      ),
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
    store.updateComment(created.id, { body: "Persist the update." });
    store.deleteComment(created.id);
    store.importReviewPacket({
      schemaVersion: "0.1",
      artifact: { artifactId: "demo" },
      comments: [importedComment],
      exportedAt: "2026-06-01T10:00:00.000Z",
    });

    expect(storage.save).toHaveBeenCalledTimes(1);
    releaseSave.shift()?.();
    await waitForSaveCount(storage, 2);
    releaseSave.shift()?.();
    await waitForSaveCount(storage, 3);
    releaseSave.shift()?.();
    await waitForSaveCount(storage, 4);
    releaseSave.shift()?.();
    const explicitSave = store.saveComments();
    await waitForSaveCount(storage, 5);
    releaseSave.shift()?.();
    await explicitSave;

    expect(savedSnapshots).toHaveLength(5);
    expect(savedSnapshots[0]).toEqual([created]);
    expect(savedSnapshots[1][0]).toMatchObject({
      id: created.id,
      body: "Persist the update.",
    });
    expect(savedSnapshots[2]).toEqual([]);
    expect(savedSnapshots[3]).toEqual([importedComment]);
    expect(savedSnapshots[4]).toEqual([importedComment]);
  });

  it("reports automatic save failures but rejects explicit save failures", async () => {
    const automaticError = new Error("automatic save failed");
    const explicitError = new Error("explicit save failed");
    const storage = {
      load: vi.fn().mockResolvedValue([]),
      save: vi
        .fn()
        .mockRejectedValueOnce(automaticError)
        .mockRejectedValueOnce(explicitError),
    };
    const onStorageError = vi.fn();
    const store = createCommentStore({
      artifact: { artifactId: "demo" },
      storage,
      onStorageError,
    });

    store.addComment({
      body: "Persist this.",
      target: { anchorId: "hero" },
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(onStorageError).toHaveBeenCalledWith(automaticError);
    await expect(store.saveComments()).rejects.toThrow(explicitError);
  });
});
