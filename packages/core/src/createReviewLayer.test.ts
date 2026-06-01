import { describe, expect, it, vi } from "vitest";
import { createReviewLayer } from "./createReviewLayer";

describe("createReviewLayer", () => {
  it("returns the public review layer API", () => {
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
    });

    expect(review).toMatchObject({
      enable: expect.any(Function),
      disable: expect.any(Function),
      setMode: expect.any(Function),
      getComments: expect.any(Function),
      addComment: expect.any(Function),
      updateComment: expect.any(Function),
      deleteComment: expect.any(Function),
      exportReviewPacket: expect.any(Function),
      importReviewPacket: expect.any(Function),
      destroy: expect.any(Function),
    });

    review.destroy();
  });

  it("creates comments and emits callbacks", () => {
    const onCommentCreate = vi.fn();
    const onCommentsChange = vi.fn();
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      onCommentCreate,
      onCommentsChange,
    });

    const comment = review.addComment({
      body: "Improve the hero.",
      target: { anchorId: "hero" },
    });

    expect(onCommentCreate).toHaveBeenCalledWith(comment);
    expect(onCommentsChange).toHaveBeenCalledWith([comment]);
    expect(review.getComments()).toEqual([comment]);

    review.destroy();
  });

  it("creates overlay nodes, supports modes, and destroys cleanly", () => {
    document.body.innerHTML = `<main data-hrk-id="hero"><h1>Hero</h1></main>`;
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "off",
    });

    review.enable();
    review.setMode("comment");

    expect(document.querySelector("[data-hrk-overlay]")).toBeTruthy();
    expect(document.body.dataset.hrkMode).toBe("comment");

    review.destroy();

    expect(document.querySelector("[data-hrk-overlay]")).toBeNull();
    expect(document.body.dataset.hrkMode).toBeUndefined();
  });
});
