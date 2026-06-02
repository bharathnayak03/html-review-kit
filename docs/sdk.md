# Static HTML SDK

Build the core package to produce the browser scripts:

```bash
pnpm --filter @html-review-kit/core build
```

The build produces `index.global.js`, `index.amd.js`, and `html-review-kit-core.amd.js` in `packages/core/dist`.

Load one AMD script in the artifact:

```html
<script src="./html-review-kit-core.amd.js"></script>
```

Initialize it with plain JavaScript:

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

Use `data-hrk-id` on stable sections so copied annotations can be located reliably.
