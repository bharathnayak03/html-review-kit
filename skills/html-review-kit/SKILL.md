---
name: html-review-kit
description: Use when writing static HTML artifacts with HTML Review Kit anchors, or when applying copied HTML Review Kit annotations, AnnotationCollection data, data-hrk-id targets, or HTML artifact review comments.
---

# HTML Review Kit

Use this skill when a user asks for HTML Review Kit, writes static HTML that should be reviewable, or pastes copied HTML Review Kit annotations for an agent to apply.

## Static HTML Setup

1. Add stable `data-hrk-id` anchors to important sections, cards, controls, and repeated items.
2. Load the pinned AMD browser bundle in the HTML artifact:

```html
<script src="https://cdn.jsdelivr.net/npm/@bharathnayak03/html-review-kit-core@0.1.0/dist/html-review-kit-core.amd.js"></script>
```

3. Add a small JavaScript initializer after the artifact markup:

```html
<script>
  const review = HTMLReviewKitCore.createReviewLayer({
    root: document.querySelector("[data-hrk-id='artifact-root']"),
    artifact: {
      artifactId: "artifact-root",
      sourceType: "html",
      sourceFile: "artifact.html",
    },
    mode: "off",
  });

  review.enable();
</script>
```

For offline or self-contained artifacts, copy the built bundle from `packages/core/dist/html-review-kit-core.amd.js` and load it as `./html-review-kit-core.amd.js`.

## Review Workflow

1. Open the static HTML artifact in a browser.
2. Enable review mode from the toolbar.
3. Add comments on the rendered HTML.
4. Click `Copy prompt`.
5. Paste the copied prompt into the coding agent that should apply the changes.

The copied prompt already includes the HTML annotations and target selectors.

## Applying Copied Annotations

When applying a copied prompt:

1. Read the copied prompt and its `AnnotationCollection`.
2. Process annotations with `motivation: "commenting"`.
3. Modify the source file identified by `target.source` or the user's named source file.
4. Locate targets in this order: `target.htmlReviewKitTarget`, `FragmentSelector` with `data-hrk-id`, `TextQuoteSelector`, `CssSelector`, `XPathSelector`, nearby text, then HTML snippet.
5. Preserve semantic HTML and stable `data-hrk-id` anchors.
6. Summarize applied and unresolved annotations.

Do not write resolved JSON output unless the user explicitly asks for it.
