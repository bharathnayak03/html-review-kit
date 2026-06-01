import { describe, expect, it } from "vitest";
import type { ArtifactReviewPacket } from "../types";
import { validateReviewPacket } from "./validateReviewPacket";

const validPacket: ArtifactReviewPacket = {
  schemaVersion: "0.1",
  artifact: {
    artifactId: "pricing-page",
    sourceType: "html",
    sourceFile: "index.html",
  },
  comments: [
    {
      id: "cmt_001",
      artifactId: "pricing-page",
      status: "open",
      body: "Make the table easier to scan.",
      target: {
        anchorId: "pricing-table",
        cssSelector: "[data-hrk-id='pricing-table']",
      },
      createdAt: "2026-06-01T10:00:00.000Z",
    },
  ],
  exportedAt: "2026-06-01T10:05:00.000Z",
};

describe("validateReviewPacket", () => {
  it("accepts a valid review packet", () => {
    expect(validateReviewPacket(validPacket)).toEqual({ ok: true, errors: [] });
  });

  it("rejects malformed review packets", () => {
    expect(validateReviewPacket({ schemaVersion: "0.2", comments: [] })).toEqual({
      ok: false,
      errors: [
        "schemaVersion must be 0.1",
        "artifact.artifactId is required",
        "exportedAt must be an ISO timestamp string",
      ],
    });
  });
});
