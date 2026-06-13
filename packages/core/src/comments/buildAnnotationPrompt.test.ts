import { describe, expect, it } from "vitest";
import type { ArtifactComment, ArtifactInfo } from "../types";
import { buildAnnotationPrompt, buildSelectors } from "./buildAnnotationPrompt";

const artifact: ArtifactInfo = {
  artifactId: "demo",
  sourceFile: "artifact.html",
  title: "Demo Artifact",
};

function comment(
  patch: Partial<ArtifactComment> = {},
): ArtifactComment {
  return {
    id: "comment-1",
    artifactId: "demo",
    status: "open",
    body: "Make the headline more specific.",
    createdAt: "2026-01-02T03:04:05.000Z",
    target: {
      anchorId: "hero",
      cssSelector: "[data-hrk-id='hero']",
      xpath: "/html/body/main/section",
      textQuote: "Hero",
      textPosition: { start: 12, end: 16 },
    },
    ...patch,
  };
}

describe("buildSelectors", () => {
  it("generates annotation selectors from an HTML Review Kit target", () => {
    expect(buildSelectors(comment())).toEqual([
      { type: "FragmentSelector", value: "data-hrk-id=hero" },
      { type: "CssSelector", value: "[data-hrk-id='hero']" },
      { type: "XPathSelector", value: "/html/body/main/section" },
      { type: "TextQuoteSelector", exact: "Hero" },
      { type: "TextPositionSelector", start: 12, end: 16 },
    ]);
  });
});

describe("buildAnnotationPrompt", () => {
  it("builds the copied annotation prompt with only open comments", () => {
    const prompt = buildAnnotationPrompt(artifact, [
      comment(),
      comment({
        id: "resolved-comment",
        status: "resolved",
        body: "This should not be copied.",
      }),
      comment({
        id: "ignored-comment",
        status: "ignored",
        body: "This should not be copied either.",
      }),
    ]);

    expect(prompt).toContain(
      "Apply these HTML Review Kit annotations to the source HTML artifact.",
    );
    expect(prompt).toContain("Artifact: Demo Artifact");
    expect(prompt).toContain("Source file: artifact.html");
    expect(prompt).toContain('"type": "AnnotationCollection"');
    expect(prompt).toContain('"total": 1');
    expect(prompt).toContain('"value": "Make the headline more specific."');
    expect(prompt).toContain('"source": "artifact.html"');
    expect(prompt).toContain('"htmlReviewKitTarget"');
    expect(prompt).not.toContain("This should not be copied.");
    expect(prompt).not.toContain("This should not be copied either.");
  });
});
