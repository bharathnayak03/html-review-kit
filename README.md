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

- `@bharathnayak03/html-review-kit-core`: framework-agnostic DOM review layer that builds browser scripts.

## Build

```bash
pnpm install
pnpm --filter @bharathnayak03/html-review-kit-core build
```

The core build writes:

```text
packages/core/dist/index.global.js
packages/core/dist/index.amd.js
packages/core/dist/html-review-kit-core.amd.js
```

Publish the npm package from `packages/core`, not the repository root:

```bash
cd packages/core
npm publish --access public
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

Load the pinned AMD script from npm CDN and initialize the review layer:

```html
<script src="https://cdn.jsdelivr.net/npm/@bharathnayak03/html-review-kit-core@0.1.0/dist/html-review-kit-core.amd.js"></script>
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

For offline or self-contained artifacts, copy the built bundle next to the HTML artifact and load it locally:

```html
<script src="./html-review-kit-core.amd.js"></script>
```

Pin the package version so older artifacts keep using the same review script.

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

Use it when writing static HTML artifacts or when applying copied HTML Review Kit annotations.

The package intentionally keeps only one `SKILL.md` copy. Install it explicitly for local agent use, or install this repo as a Claude Code or Codex plugin for distribution.

## Publishing the Skill

The canonical skill content is `skills/html-review-kit/SKILL.md`.

For Claude Code:

```bash
mkdir -p ~/.claude/skills/html-review-kit
cp skills/html-review-kit/SKILL.md ~/.claude/skills/html-review-kit/SKILL.md
```

For Claude Code plugin testing:

```bash
claude --plugin-dir .
```

The Claude plugin manifest lives at:

```text
.claude-plugin/plugin.json
```

When loaded as a Claude plugin, the skill is invoked as:

```text
/html-review-kit:html-review-kit
```

For Codex local use:

```bash
mkdir -p ~/.agents/skills/html-review-kit
cp skills/html-review-kit/SKILL.md ~/.agents/skills/html-review-kit/SKILL.md
```

For Codex plugin distribution, this repository is also a plugin root. The manifest lives at:

```text
.codex-plugin/plugin.json
```

External developers can install or share the repo as a Codex plugin source. The plugin exposes the skill from `./skills/`.

## Development

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```
