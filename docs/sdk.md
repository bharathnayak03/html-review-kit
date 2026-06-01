# SDK

## Core

`createReviewLayer(options)` attaches a review layer to a DOM root.

```ts
const review = createReviewLayer({
  root: document.body,
  artifact: { artifactId: "demo", sourceFile: "index.html" },
  mode: "comment",
});
```

The instance can enable or disable review mode, add/update/delete comments, import packets, and export packets.

## React

`ArtifactReviewFrame` renders HTML in an iframe and creates a review layer in that iframe document.
