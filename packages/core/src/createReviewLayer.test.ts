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

  it("shows stable target data while hovering in inspect mode", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1> <p>Lead copy</p></section></main>`;
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "inspect",
    });

    const target = document.querySelector("[data-hrk-id='hero']");
    target?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));

    const panel = document.querySelector("[data-hrk-inspect-panel]");

    expect(document.body.dataset.hrkMode).toBe("inspect");
    expect(target?.getAttribute("data-hrk-inspect-target")).toBe("true");
    expect(panel?.textContent).toContain("data-hrk-id: hero");
    expect(panel?.textContent).toContain('CSS: [data-hrk-id="hero"]');
    expect(panel?.textContent).toContain("XPath:");
    expect(panel?.textContent).toContain("Text: Hero Lead copy");

    target?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));

    expect(target?.hasAttribute("data-hrk-inspect-target")).toBe(false);
    expect(document.querySelector("[data-hrk-inspect-panel]")).toBeNull();

    review.destroy();
  });

  it("does not prompt or create comments from inspect mode clicks", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const prompt = vi.fn().mockReturnValue("New comment");
    vi.spyOn(window, "prompt").mockImplementation(prompt);
    const onCommentCreate = vi.fn();
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "inspect",
      onCommentCreate,
    });

    document
      .querySelector("[data-hrk-id='hero']")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(prompt).not.toHaveBeenCalled();
    expect(onCommentCreate).not.toHaveBeenCalled();
    expect(review.getComments()).toEqual([]);

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

  it("copies a prompt with all annotations", async () => {
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

    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain(
      "Apply these HTML Review Kit annotations to the source HTML artifact.",
    );
    expect(copied).toContain("Source file: artifact.html");
    expect(copied).toContain('"type": "AnnotationCollection"');
    expect(copied).toContain('"motivation": "commenting"');
    expect(copied).toContain('"value": "Make the headline more specific."');
    expect(copied).toContain('"source": "artifact.html"');
    expect(copied).toContain('"type": "FragmentSelector"');
    expect(copied).toContain('"value": "data-hrk-id=hero"');
    expect(copied).toContain('"type": "CssSelector"');
    expect(copied).toContain("\"[data-hrk-id='hero']\"");
    expect(copied).toContain('"type": "XPathSelector"');
    expect(copied).toContain('"value": "/html/body/main/section"');
    expect(copied).toContain('"type": "TextQuoteSelector"');
    expect(copied).toContain('"exact": "Hero"');

    review.destroy();
  });
});
