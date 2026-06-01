import { describe, expect, it } from "vitest";
import type { ArtifactReviewPacket } from "@html-review-kit/core";
import { buildApplyCommentsPrompt } from "./buildApplyCommentsPrompt";

const packet: ArtifactReviewPacket = {
  schemaVersion: "0.1",
  artifact: {
    artifactId: "demo",
    sourceFile: "index.html",
  },
  comments: [
    {
      id: "cmt_001",
      artifactId: "demo",
      status: "open",
      body: "Improve the hero headline.",
      target: { anchorId: "hero", textQuote: "Welcome" },
      createdAt: "2026-06-01T10:00:00.000Z",
    },
    {
      id: "cmt_002",
      artifactId: "demo",
      status: "resolved",
      body: "Already handled.",
      target: { anchorId: "footer" },
      createdAt: "2026-06-01T10:00:00.000Z",
    },
  ],
  exportedAt: "2026-06-01T10:05:00.000Z",
};

describe("buildApplyCommentsPrompt", () => {
  it("builds an agent prompt from open comments", () => {
    const prompt = buildApplyCommentsPrompt(packet);

    expect(prompt).toContain("demo");
    expect(prompt).toContain("index.html");
    expect(prompt).toContain("cmt_001");
    expect(prompt).toContain("anchorId");
    expect(prompt).toContain(".review/html-review-comments.resolved.json");
    expect(prompt).not.toContain("cmt_002");
  });
});
