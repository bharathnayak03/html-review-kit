# HTML Review Kit

### Review static HTML artifacts without turning feedback into screenshots.
https://github.com/user-attachments/assets/c7032a2c-385e-4438-bbbe-0cfff71965cf

HTML Review Kit adds a tiny browser review layer to static HTML artifacts. It lets a reviewer click rendered elements, leave comments, and copy an agent-ready prompt that includes stable selectors, text anchors, and source-file context.

Use it when an AI agent, design tool, report generator, or internal workflow produces HTML and you want precise human feedback to round-trip back into source changes.

- **Static-first** - Drop one AMD bundle into any HTML file. No app server, framework, or build pipeline required for reviewers.
- **Agent-ready feedback** - Copy a prompt with comments, artifact metadata, and target selectors that coding agents can apply directly.
- **Stable anchors** - Prefer `data-hrk-id` anchors, then fall back to text quotes, CSS selectors, XPath, nearby text, and HTML snippets.
- **Framework-agnostic core** - The `@bharathnayak03/html-review-kit-core` package is plain TypeScript and DOM APIs.
- **Local and portable** - Load from a pinned CDN version or copy the bundle next to a self-contained artifact.

## Quick Start

Install dependencies and build the browser bundle:

```bash
pnpm install
pnpm --filter @bharathnayak03/html-review-kit-core build
```

Add stable anchors to the HTML you want reviewed:

```html
<main data-hrk-id="artifact-root">
  <section data-hrk-id="hero">
    <h1>Launch plan</h1>
    <p>Review this artifact in the browser and send precise feedback back to the agent.</p>
  </section>
</main>
```

Load the pinned browser bundle and initialize the review layer:

```html
<script src="https://cdn.jsdelivr.net/npm/@bharathnayak03/html-review-kit-core@0.1.0/dist/html-review-kit-core.amd.js"></script>
<script>
  const review = HTMLReviewKitCore.createReviewLayer({
    root: document.querySelector("[data-hrk-id='artifact-root']"),
    artifact: {
      artifactId: "launch-plan",
      title: "Launch plan",
      sourceType: "html",
      sourceFile: "artifact.html",
    },
    mode: "off",
  });

  review.enable();
</script>
```

Open the HTML file, use the toolbar to enable review mode, add comments, then click **Copy prompt**. Paste that prompt into your coding agent to apply the requested changes.

## Try the Example

The repo includes a standalone artifact at [`examples/static-html`](examples/static-html/README.md).

```bash
pnpm --filter @bharathnayak03/html-review-kit-core build
python3 -m http.server 4173 --directory .
```

Then visit:

```text
http://localhost:4173/examples/static-html/
```

The example loads the local build from:

```html
<script src="../../packages/core/dist/html-review-kit-core.amd.js"></script>
```

## How It Works

```text
Static HTML artifact with data-hrk-id
  -> HTML Review Kit adds a review toolbar
  -> Reviewer comments on rendered DOM targets
  -> Copy prompt exports an AnnotationCollection
  -> Agent applies edits back to source HTML
```

The copied prompt includes an `AnnotationCollection` with open comments and target data. Agents should process annotations with `motivation: "commenting"` and locate targets in this order:

1. `target.htmlReviewKitTarget`
2. `FragmentSelector` with `data-hrk-id`
3. `TextQuoteSelector`
4. `CssSelector`
5. `XPathSelector`
6. nearby text
7. HTML snippet

That order keeps the workflow resilient when the rendered DOM shifts between review and patching.

## Package

This repository is a pnpm workspace. The publishable package is:

| Package | Purpose |
| --- | --- |
| `@bharathnayak03/html-review-kit-core` | Framework-agnostic DOM review layer and browser bundles |

The core build writes:

```text
packages/core/dist/index.js
packages/core/dist/index.d.ts
packages/core/dist/index.global.js
packages/core/dist/index.amd.js
packages/core/dist/html-review-kit-core.amd.js
```

Publish from `packages/core`, not the repository root:

```bash
cd packages/core
npm publish --access public
```

## Browser Bundle Options

Use a pinned CDN version for hosted or shareable artifacts:

```html
<script src="https://cdn.jsdelivr.net/npm/@bharathnayak03/html-review-kit-core@0.1.0/dist/html-review-kit-core.amd.js"></script>
```

Or copy the built bundle next to the artifact for offline review:

```html
<script src="./html-review-kit-core.amd.js"></script>
```

Pin package versions in static artifacts. Avoid `@latest`, because old review packets should keep using the script version they were created against.

## API Surface

The public API is exported from [`packages/core/src/index.ts`](packages/core/src/index.ts):

- `createReviewLayer`
- anchor helpers: `createTargetFromElement`, `generateAnchorId`, `generateCssSelector`, `generateXPath`, `resolveTarget`
- comment helpers: `createCommentStore`, `exportReviewPacket`, `validateReviewPacket`
- storage adapters: `localStorageAdapter`, `memoryStorageAdapter`
- TypeScript types for artifacts, comments, review packets, storage, and layer instances

Minimal TypeScript usage:

```ts
import {
  createReviewLayer,
  localStorageAdapter,
} from "@bharathnayak03/html-review-kit-core";

const review = createReviewLayer({
  root: document.querySelector("[data-hrk-id='artifact-root']")!,
  artifact: {
    artifactId: "artifact-root",
    sourceType: "html",
    sourceFile: "artifact.html",
  },
  storage: localStorageAdapter("html-review-kit:artifact-root"),
});

await review.loadComments();
review.enable();
```

See [`docs/sdk.md`](docs/sdk.md), [`docs/schema.md`](docs/schema.md), and [`docs/ai-workflow.md`](docs/ai-workflow.md) for deeper integration notes.

## Agent Skill

The installable skill lives at:

```text
skills/html-review-kit/SKILL.md
```

Use it when writing static HTML artifacts or applying copied HTML Review Kit annotations. The skill tells agents how to preserve semantic HTML, use stable `data-hrk-id` anchors, and resolve copied comments back to source files.

For local Codex use:

```bash
mkdir -p ~/.agents/skills/html-review-kit
cp skills/html-review-kit/SKILL.md ~/.agents/skills/html-review-kit/SKILL.md
```

For Claude Code use:

```bash
mkdir -p ~/.claude/skills/html-review-kit
cp skills/html-review-kit/SKILL.md ~/.claude/skills/html-review-kit/SKILL.md
```

The repository can also be loaded as a plugin source. Manifests live at:

```text
.codex-plugin/plugin.json
.claude-plugin/plugin.json
```

## Development

```bash
pnpm build       # Build all packages
pnpm test        # Run tests
pnpm typecheck   # Run TypeScript checks
pnpm lint        # Run ESLint
pnpm format      # Format the workspace
```

Useful focused commands:

```bash
pnpm --filter @bharathnayak03/html-review-kit-core build
pnpm smoke:static-html
```

## Project Status

HTML Review Kit currently focuses on one workflow: static HTML artifacts that load the AMD browser script. The core package stays framework-agnostic by design, and public APIs should be exported from each package's `src/index.ts`.
