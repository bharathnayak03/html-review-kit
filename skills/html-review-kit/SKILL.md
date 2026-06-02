---
name: html-review-kit
description: Use when writing or updating HTML specs, static HTML artifacts, or agent workflows that mention html-review-kit, HTML Review Kit, data-hrk-id, or copied HTML annotations.
---

# HTML Review Kit

Use this skill when a user asks for `html-review-kit` or when writing HTML specs that should be visually reviewable by an agent.

## Static HTML Setup

1. Add stable `data-hrk-id` anchors to important sections, cards, controls, and repeated items.
2. Load the AMD browser bundle in the HTML artifact:

```html
<script src="./html-review-kit-core.amd.js"></script>
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

Use the built bundle from `packages/core/dist/html-review-kit-core.amd.js` or `packages/core/dist/index.amd.js`.

## Review Workflow

1. Open the static HTML artifact in a browser.
2. Enable review mode from the toolbar.
3. Add comments on the rendered HTML.
4. Click `Copy prompt`.
5. Paste the copied prompt into the coding agent that should apply the changes.

The copied prompt already includes the HTML annotations and target selectors.

## Applying Copied Annotations

When applying a copied prompt:

1. Process annotations with `motivation: "commenting"`.
2. Use `target.source` or the user's named file as the source file.
3. Locate targets in this order: `target.htmlReviewKitTarget`, `FragmentSelector` / `data-hrk-id`, `TextQuoteSelector`, `CssSelector`, `XPathSelector`, nearby text, then HTML snippet.
4. Preserve semantic HTML and existing `data-hrk-id` anchors.
5. Summarize applied and unresolved annotations. Do not write a resolved JSON file unless the user explicitly asks for one.
