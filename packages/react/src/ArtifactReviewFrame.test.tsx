import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ArtifactReviewFrame } from "./ArtifactReviewFrame";

vi.mock("@html-review-kit/core", async () => {
  const actual = await vi.importActual<typeof import("@html-review-kit/core")>(
    "@html-review-kit/core",
  );
  return {
    ...actual,
    createReviewLayer: vi.fn(() => ({
      enable: vi.fn(),
      disable: vi.fn(),
      setMode: vi.fn(),
      getComments: vi.fn(() => []),
      addComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
      exportReviewPacket: vi.fn(),
      importReviewPacket: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

describe("ArtifactReviewFrame", () => {
  it("renders an iframe for artifact HTML", () => {
    const renderer = create(
      <ArtifactReviewFrame
        html="<main><h1>Hello</h1></main>"
        artifact={{ artifactId: "demo", sourceFile: "index.html" }}
        reviewMode="comment"
      />,
    );

    const iframe = renderer.root.findByType("iframe");

    expect(iframe.props.srcDoc).toContain("<h1>Hello</h1>");
    expect(iframe.props.sandbox).toBe("allow-scripts");
  });

  it("supports iframe load lifecycle", () => {
    const renderer = create(
      <ArtifactReviewFrame
        html="<main><h1>Hello</h1></main>"
        artifact={{ artifactId: "demo" }}
        reviewMode="comment"
      />,
    );
    const iframe = renderer.root.findByType("iframe");

    act(() => iframe.props.onLoad());

    expect(iframe.props.title).toBe("HTML artifact review");
  });
});
