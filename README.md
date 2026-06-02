# HTML Review Kit

HTML Review Kit is a tiny static HTML review helper for AI-generated artifacts.

It keeps the workflow simple:

1. Build the AMD browser script.
2. Load it in a static HTML artifact.
3. Add a short JavaScript initializer.
4. Review the rendered HTML.
5. Copy the prompt with HTML annotations and paste it into an agent.

Only the static HTML AMD-script workflow is included.

## Package

- `@html-review-kit/core`: framework-agnostic DOM review layer that builds browser scripts.

## Build

```bash
pnpm install
pnpm --filter @html-review-kit/core build
```

The core build writes:

```text
packages/core/dist/index.global.js
packages/core/dist/index.amd.js
packages/core/dist/html-review-kit-core.amd.js
```

## Static HTML Usage

Add stable anchors to the artifact:

```html
<main data-hrk-id="artifact-root">
  <section data-hrk-id="hero">
    <h1>Launch plan</h1>
  </section>
</main>
```

Load the AMD script and initialize the review layer:

```html
<script src="./html-review-kit-core.amd.js"></script>
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

## Review Flow

The toolbar provides:

- `Enable review mode` / `Disable review mode`
- `Copy prompt`

`Copy prompt` copies agent-ready instructions plus the open HTML annotations and target selectors. Paste that prompt into a coding agent to apply the comments to the source HTML.

## Skill

The installable skill lives at:

```text
skills/html-review-kit/SKILL.md
```

Use it when writing HTML specs or when a task explicitly mentions `html-review-kit`.

## Development

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```
