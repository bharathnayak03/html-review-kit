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

  it("opens an inline composer instead of calling prompt when a target is clicked", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("Ignored prompt");
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "comment",
    });

    document
      .querySelector("[data-hrk-id='hero']")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    expect(prompt).not.toHaveBeenCalled();
    expect(document.querySelector("[data-hrk-comment-composer]")).toBeTruthy();
    expect(review.getComments()).toEqual([]);

    prompt.mockRestore();
    review.destroy();
  });

  it("saves a multiline composer comment with an optional AI instruction", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const onCommentCreate = vi.fn();
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "comment",
      onCommentCreate,
    });

    document
      .querySelector("[data-hrk-id='hero']")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    const body = document.querySelector<HTMLTextAreaElement>(
      "[data-hrk-comment-body]",
    );
    const aiInstruction = document.querySelector<HTMLTextAreaElement>(
      "[data-hrk-ai-instruction]",
    );
    body!.value = "Line one\nLine two";
    aiInstruction!.value = "Keep this concise";

    document
      .querySelector<HTMLButtonElement>("[data-hrk-save-comment]")
      ?.click();

    expect(onCommentCreate).toHaveBeenCalledOnce();
    expect(review.getComments()).toMatchObject([
      {
        body: "Line one\nLine two",
        aiInstruction: "Keep this concise",
        target: { anchorId: "hero" },
      },
    ]);
    expect(document.querySelector("[data-hrk-comment-composer]")).toBeNull();
    expect(document.querySelector("[data-hrk-comment-marker]")).toBeTruthy();

    review.destroy();
  });

  it("cancels the inline composer without creating a comment", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const onCommentCreate = vi.fn();
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "comment",
      onCommentCreate,
    });

    document
      .querySelector("[data-hrk-id='hero']")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    document
      .querySelector<HTMLTextAreaElement>("[data-hrk-comment-body]")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onCommentCreate).not.toHaveBeenCalled();
    expect(review.getComments()).toEqual([]);
    expect(document.querySelector("[data-hrk-comment-composer]")).toBeNull();

    review.destroy();
  });

  it("does not create a comment when saving an empty composer body", () => {
    document.body.innerHTML = `<main><section data-hrk-id="hero"><h1>Hero</h1></section></main>`;
    const onCommentCreate = vi.fn();
    const review = createReviewLayer({
      root: document.body,
      artifact: { artifactId: "demo" },
      mode: "comment",
      onCommentCreate,
    });

    document
      .querySelector("[data-hrk-id='hero']")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    document
      .querySelector<HTMLButtonElement>("[data-hrk-save-comment]")
      ?.click();

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
