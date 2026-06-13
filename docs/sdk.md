# Static HTML SDK

Build the core package to produce the browser scripts:

```bash
pnpm --filter @bharathnayak03/html-review-kit-core build
```

The build produces `index.global.js`, `index.amd.js`, and `html-review-kit-core.amd.js` in `packages/core/dist`.

Load the pinned npm CDN script in the artifact:

```html
<script src="https://cdn.jsdelivr.net/npm/@bharathnayak03/html-review-kit-core@0.1.0/dist/html-review-kit-core.amd.js"></script>
```

For offline or self-contained artifacts, copy the built bundle next to the HTML file and load it locally:

```html
<script src="./html-review-kit-core.amd.js"></script>
```

The same published file is also available through unpkg:

```html
<script src="https://unpkg.com/@bharathnayak03/html-review-kit-core@0.1.0/dist/html-review-kit-core.amd.js"></script>
```

Pin the version in static artifacts. Avoid `@latest`, because old review packets should keep using the script version they were created against.

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

To persist comments, pass a `CommentStorageAdapter` such as `memoryStorageAdapter` or `localStorageAdapter`. Loading is async, so call `loadComments()` after creating the layer; comment create/update/delete/import operations save back to the adapter automatically, and `saveComments()` is available for an explicit flush. Automatic save failures are reported through `onStorageError`; explicit `saveComments()` failures reject to the caller.

```html
<script>
  async function initializeReview() {
    const review = HTMLReviewKitCore.createReviewLayer({
      root: document.querySelector("[data-hrk-id='artifact-root']"),
      artifact: {
        artifactId: "artifact-root",
        sourceType: "html",
        sourceFile: "artifact.html",
      },
      storage: HTMLReviewKitCore.localStorageAdapter(
        "html-review-kit:artifact-root",
      ),
      onStorageError(error) {
        console.error("Unable to save review comments", error);
      },
    });

    await review.loadComments();
    review.enable();
  }

  initializeReview();
</script>
```

Use `data-hrk-id` on stable sections so copied annotations can be located reliably.
