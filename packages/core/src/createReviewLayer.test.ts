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

  it("renders absolutely positioned overlay comments only while their target is hovered", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const target = document.querySelector("[data-hrk-id='hero']");
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () =>
        ({
          bottom: 90,
          height: 60,
          left: 20,
          right: 180,
          top: 30,
          width: 160,
          x: 20,
          y: 30,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "comment",
    });

    review.addComment({
      body: "Make the headline more specific.",
      target: { anchorId: "hero" },
    });

    const inlineComment = document.querySelector("[data-hrk-inline-comment]");

    expect(inlineComment?.getAttribute("data-hrk-inline-comment")).toBeTruthy();
    expect(inlineComment?.parentElement?.hasAttribute("data-hrk-overlay")).toBe(
      true,
    );
    expect(target?.nextElementSibling).toBeNull();
    expect((inlineComment as HTMLElement | null)?.style.position).toBe(
      "absolute",
    );
    expect((inlineComment as HTMLElement | null)?.style.left).toBe("188px");
    expect((inlineComment as HTMLElement | null)?.style.top).toBe("30px");
    expect((inlineComment as HTMLElement | null)?.style.display).toBe("none");

    target?.dispatchEvent(new MouseEvent("mouseenter"));
    expect((inlineComment as HTMLElement | null)?.style.display).toBe("block");

    target?.dispatchEvent(new MouseEvent("mouseleave"));
    expect((inlineComment as HTMLElement | null)?.style.display).toBe("none");
    expect(inlineComment?.textContent).toContain(
      "Make the headline more specific.",
    );

    review.destroy();
  });

  it("marks the target while preparing a comment and renders a persistent comment marker", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "comment",
    });

    const target = document.querySelector("[data-hrk-id='hero']");
    target?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    expect(target?.getAttribute("data-hrk-hover-target")).toBe("true");

    target?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(target?.hasAttribute("data-hrk-hover-target")).toBe(false);

    review.addComment({
      body: "Make the headline more specific.",
      target: { anchorId: "hero" },
    });

    const marker = document.querySelector("[data-hrk-comment-marker]");
    const commentBox = document.querySelector("[data-hrk-inline-comment]");

    expect(marker?.parentElement?.hasAttribute("data-hrk-overlay")).toBe(true);
    expect((marker as HTMLElement | null)?.style.position).toBe("absolute");
    expect((marker as HTMLElement | null)?.style.display).toBe("flex");
    expect((commentBox as HTMLElement | null)?.style.display).toBe("none");

    marker?.dispatchEvent(new MouseEvent("mouseenter"));
    expect((commentBox as HTMLElement | null)?.style.display).toBe("block");

    marker?.dispatchEvent(new MouseEvent("mouseleave"));
    expect((commentBox as HTMLElement | null)?.style.display).toBe("none");

    review.destroy();
  });

  it("enables review mode from the toolbar", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "off",
    });

    review.enable();

    const toggle = document.querySelector<HTMLButtonElement>(
      "[data-hrk-toggle-review-mode]",
    );

    expect(document.body.dataset.hrkMode).toBe("off");
    expect(toggle?.textContent).toBe("Enable review mode");

    toggle?.click();

    expect(document.body.dataset.hrkMode).toBe("comment");
    expect(toggle?.textContent).toBe("Disable review mode");

    review.destroy();
  });

  it("exports the native review packet as JSON from the toolbar", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const createObjectURL = vi.fn(() => "blob:review-packet");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo", sourceFile: "artifact.html" },
      mode: "comment",
    });

    review.addComment({
      body: "Make the headline more specific.",
      target: { anchorId: "hero" },
    });

    document
      .querySelector<HTMLButtonElement>("[data-hrk-export-json]")
      ?.click();

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:review-packet");

    click.mockRestore();
    review.destroy();
  });

  it("copies all annotations in a W3C-inspired annotation collection", async () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo", sourceFile: "artifact.html" },
      mode: "comment",
    });

    review.addComment({
      body: "Make the headline more specific.",
      target: {
        anchorId: "hero",
        cssSelector: "[data-hrk-id='hero']",
        textQuote: "Hero",
        xpath: "/html/body/main/section",
      },
    });

    document
      .querySelector<HTMLButtonElement>("[data-hrk-copy-comments]")
      ?.click();
    await Promise.resolve();

    const copied = JSON.parse(writeText.mock.calls[0][0]);
    expect(copied.prompt).toContain("Revisit this HTML artifact");
    expect(copied.annotationCollection).toMatchObject({
      "@context": "http://www.w3.org/ns/anno.jsonld",
      type: "AnnotationCollection",
      total: 1,
    });
    expect(copied.annotationCollection.items[0]).toMatchObject({
      type: "Annotation",
      motivation: "commenting",
      body: {
        type: "TextualBody",
        purpose: "commenting",
        value: "Make the headline more specific.",
      },
      target: {
        type: "SpecificResource",
        source: "artifact.html",
      },
    });
    expect(copied.annotationCollection.items[0].target.selector).toEqual(
      expect.arrayContaining([
        { type: "FragmentSelector", value: "data-hrk-id=hero" },
        { type: "CssSelector", value: "[data-hrk-id='hero']" },
        { type: "XPathSelector", value: "/html/body/main/section" },
        { type: "TextQuoteSelector", exact: "Hero" },
      ]),
    );

    review.destroy();
  });
});
