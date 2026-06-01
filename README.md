# HTML Review Kit

HTML Review Kit adds review/comment workflows to AI-generated HTML artifacts. It lets a developer render HTML, enable review mode, export structured comments, and hand those comments to an AI coding agent.

## Packages

- `@html-review-kit/core`: framework-agnostic DOM review SDK.
- `@html-review-kit/react`: React iframe wrapper.
- `@html-review-kit/ai`: prompt builders, validation helpers, and agent instruction assets.

## Core Usage

```ts
import { createReviewLayer } from "@html-review-kit/core";

const review = createReviewLayer({
  root: document.body,
  artifact: {
    artifactId: "demo-artifact",
    sourceType: "html",
    sourceFile: "index.html",
  },
  mode: "comment",
});

review.enable();
```

## React Usage

```tsx
import { ArtifactReviewFrame } from "@html-review-kit/react";

<ArtifactReviewFrame
  html={html}
  artifact={{ artifactId: "demo", sourceFile: "index.html" }}
  reviewMode="comment"
  onCommentsChange={setComments}
/>;
```

## AI Workflow

1. Export `.review/html-review-comments.json`.
2. Ask a coding agent to apply the comments.
3. The agent resolves targets using `data-hrk-id`, text quotes, selectors, and XPath.
4. The agent writes `.review/html-review-comments.resolved.json`.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```
