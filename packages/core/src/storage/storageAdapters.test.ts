import { describe, expect, it } from "vitest";
import type { ArtifactComment } from "../types";
import { localStorageAdapter } from "./localStorageAdapter";
import { memoryStorageAdapter } from "./memoryStorageAdapter";

const comments: ArtifactComment[] = [
  {
    id: "cmt_001",
    artifactId: "demo",
    status: "open",
    body: "Improve spacing.",
    target: { anchorId: "hero" },
    createdAt: "2026-06-01T10:00:00.000Z",
  },
];

describe("storage adapters", () => {
  it("stores comments in memory", async () => {
    const adapter = memoryStorageAdapter();

    await adapter.save(comments);

    expect(await adapter.load()).toEqual(comments);
  });

  it("stores comments in localStorage", async () => {
    const adapter = localStorageAdapter("hrk:test");

    await adapter.save(comments);

    expect(await adapter.load()).toEqual(comments);
  });
});
