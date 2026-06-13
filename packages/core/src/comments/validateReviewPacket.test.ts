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
    expect(
      validateReviewPacket({ schemaVersion: "0.2", comments: [] }),
    ).toEqual({
      ok: false,
      errors: [
        "schemaVersion must be 0.1",
        "artifact.artifactId is required",
        "exportedAt must be an ISO timestamp string",
      ],
    });
  });

  it("rejects malformed artifact fields without throwing", () => {
    expect(() =>
      validateReviewPacket({
        schemaVersion: "0.1",
        artifact: "pricing-page",
        comments: [],
        exportedAt: "2026-06-01T10:05:00.000Z",
      }),
    ).not.toThrow();

    expect(
      validateReviewPacket({
        ...validPacket,
        artifact: {
          artifactId: " ",
          sourceType: "markdown",
          sourceFile: 123,
          title: false,
          version: null,
        },
      }),
    ).toEqual({
      ok: false,
      errors: [
        "artifact.artifactId is required",
        "artifact.sourceType must be one of: html, unknown",
        "artifact.sourceFile must be a string",
        "artifact.title must be a string",
        "artifact.version must be a string",
      ],
    });
  });

  it("rejects malformed comments", () => {
    expect(
      validateReviewPacket({
        ...validPacket,
        comments: [
          "not a comment",
          {
            id: "",
            artifactId: "other-artifact",
            status: "done",
            body: " ",
            target: null,
            createdAt: "yesterday",
            updatedAt: 42,
          },
        ],
      }),
    ).toEqual({
      ok: false,
      errors: [
        "comments[0] must be an object",
        "comments[1].id is required",
        "comments[1].artifactId must match artifact.artifactId",
        "comments[1].status must be one of: open, resolved, ignored",
        "comments[1].body is required",
        "comments[1].target must be an object",
        "comments[1].createdAt must be an ISO timestamp string",
        "comments[1].updatedAt must be an ISO timestamp string",
      ],
    });
  });

  it("rejects malformed target fields", () => {
    expect(
      validateReviewPacket({
        ...validPacket,
        comments: [
          {
            ...validPacket.comments[0],
            target: {
              anchorId: 123,
              xpath: false,
              cssSelector: ["[data-hrk-id='pricing-table']"],
              textQuote: 7,
              beforeText: null,
              afterText: {},
              htmlSnippet: 9,
              textPosition: { start: 12, end: 4 },
              elementFingerprint: {
                tagName: "",
                id: 12,
                classNames: ["pricing", 7],
                role: false,
                ariaLabel: [],
                headingContext: 1,
                nearbyText: null,
              },
            },
          },
        ],
      }),
    ).toEqual({
      ok: false,
      errors: [
        "comments[0].target.anchorId must be a string",
        "comments[0].target.xpath must be a string",
        "comments[0].target.cssSelector must be a string",
        "comments[0].target.textQuote must be a string",
        "comments[0].target.beforeText must be a string",
        "comments[0].target.afterText must be a string",
        "comments[0].target.htmlSnippet must be a string",
        "comments[0].target.textPosition.start must be <= textPosition.end",
        "comments[0].target.elementFingerprint.tagName is required",
        "comments[0].target.elementFingerprint.id must be a string",
        "comments[0].target.elementFingerprint.classNames must be an array of strings",
        "comments[0].target.elementFingerprint.role must be a string",
        "comments[0].target.elementFingerprint.ariaLabel must be a string",
        "comments[0].target.elementFingerprint.headingContext must be a string",
        "comments[0].target.elementFingerprint.nearbyText must be a string",
      ],
    });
  });
});
