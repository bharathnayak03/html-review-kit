# HTML Review Kit

HTML Review Kit adds review/comment workflows to AI-generated HTML artifacts. It lets a developer render HTML, enable review mode, export structured comments, and hand those comments to an AI coding agent.

Repository: https://github.com/bharathnayak03/html-review-kit

## What This Does

AI tools often generate rich HTML artifacts that are easier to inspect visually than as source text. HTML Review Kit adds a lightweight review layer to those rendered artifacts:

1. Render an HTML artifact.
2. Enable review mode.
3. Attach comments to elements.
4. Export `.review/html-review-comments.json`.
5. Ask an agent to apply the comments to the source.
6. Receive `.review/html-review-comments.resolved.json`.

v0 is local-first. It does not include a backend, authentication, realtime collaboration, browser extension, or VS Code extension.

## Packages

- `@html-review-kit/core`: framework-agnostic DOM review SDK.
- `@html-review-kit/react`: React iframe wrapper.
- `@html-review-kit/ai`: prompt builders, validation helpers, CLI entrypoint, and agent instruction assets.

## Repository Layout

```text
packages/core      DOM review layer, comments, anchors, schema utilities
packages/react     React iframe wrapper
packages/ai        prompt builders, validator, skill and agent instructions
examples/basic-html
examples/react-demo
docs               schema, SDK, AI workflow, roadmap
```

## Install

This repo is currently a pnpm workspace:

```bash
pnpm install
pnpm build
```

Once packages are published, expected installs are:

```bash
pnpm add @html-review-kit/core
pnpm add @html-review-kit/react
pnpm add -D @html-review-kit/ai
```

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

### Static HTML Usage

`@html-review-kit/core` also builds a browser bundle for static HTML artifacts:

```bash
pnpm --filter @html-review-kit/core build
```

The build writes:

```text
packages/core/dist/index.amd.js
packages/core/dist/html-review-kit-core.amd.js
```

Load that file from a static artifact and initialize the review layer directly:

```html
<script src="../../../packages/core/dist/index.amd.js"></script>
<script>
  const review = HTMLReviewKitCore.createReviewLayer({
    root: document.querySelector("[data-hrk-id='artifact-root']"),
    artifact: {
      artifactId: "artifact-root",
      sourceType: "html",
      sourceFile: "path/to/artifact.html",
    },
    mode: "off",
  });

  review.enable();
</script>
```

See the sample static artifact:

```text
docs/superpowers/specs/2026-06-01-vscode-extension-sample-artifact.html
```

## Review Toolbar

The core review layer now renders a small overlay toolbar with:

- `Enable review mode` / `Disable review mode`: toggles element commenting.
- `Export JSON`: downloads the native HTML Review Kit packet as `html-review-comments.json`.
- `Copy annotations`: copies all open annotations to the clipboard.

In comment mode, hovering an element outlines the exact target that will receive the next comment. Existing comments are represented by a small numbered marker near the target element. Hovering the target, marker, or comment box shows the comment in an absolutely positioned overlay box near the target's upper-right side.

The clipboard payload is JSON inspired by the W3C Web Annotation Data Model. It includes a prompt, HTML Review Kit metadata, and an `annotationCollection` with `@context: "http://www.w3.org/ns/anno.jsonld"`, `AnnotationCollection`, `Annotation`, `TextualBody`, `SpecificResource`, and selector entries such as `FragmentSelector`, `CssSelector`, `XPathSelector`, and `TextQuoteSelector`.

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

## AI CLI

The AI package includes a small CLI for validation and prompt generation. In this workspace:

```bash
pnpm --filter @html-review-kit/ai build
node packages/ai/dist/cli.cjs validate .review/html-review-comments.json
node packages/ai/dist/cli.cjs prompt .review/html-review-comments.json
```

After npm publication, the intended usage is:

```bash
npx @html-review-kit/ai validate .review/html-review-comments.json
npx @html-review-kit/ai prompt .review/html-review-comments.json
```

## Installing The Skill

The skill package lives at:

```text
packages/ai/skills/html-review-kit/SKILL.md
```

To install manually into Codex-style skills:

```bash
mkdir -p ~/.codex/skills/html-review-kit
cp -R packages/ai/skills/html-review-kit/* ~/.codex/skills/html-review-kit/
```

The skill references this repo so future versions can fetch scripts from GitHub:

```text
https://github.com/bharathnayak03/html-review-kit
```

For future npm-published versions, prefer the package CLI with `npx @html-review-kit/ai ...` for validation and prompt generation.

## Working With This Repo

Use small package-scoped changes and keep public exports in each package's `src/index.ts`.

Useful commands:

```bash
pnpm --filter @html-review-kit/core test
pnpm --filter @html-review-kit/react test
pnpm --filter @html-review-kit/ai test
pnpm --filter react-demo dev
```

Stable visual anchors use `data-hrk-id`. Keep `@html-review-kit/core` framework-agnostic; React-specific behavior belongs in `@html-review-kit/react`.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```
