# HTML Review Kit v0 Design

## Summary

HTML Review Kit is a TypeScript monorepo for reviewing AI-generated HTML artifacts and handing structured visual comments back to coding agents. The v0 release provides a browser SDK, React iframe wrapper, AI prompt/instruction helpers, portable review packets, and demos.

The public branding is `html-review-kit` everywhere:

- Repository and product name: `html-review-kit`
- Package scope: `@html-review-kit/*`
- Core package: `@html-review-kit/core`
- React package: `@html-review-kit/react`
- AI package: `@html-review-kit/ai`
- Default review file: `.review/html-review-comments.json`

## Goals

v0 succeeds when a developer can render an HTML artifact, enable review mode, attach comments to elements or text, export a JSON review packet, and ask Codex, Claude Code, or another coding agent to apply the comments to the artifact source.

The release optimizes for local developer workflows. It does not include hosted collaboration, auth, realtime sync, browser extensions, VS Code extensions, MCP tools, screenshot diffing, or browser-side source patching.

## Architecture

The repo is a pnpm TypeScript workspace with focused packages:

- `packages/core`: framework-agnostic SDK for DOM review behavior, anchors, comments, target resolution, storage adapters, import, and export.
- `packages/react`: React wrapper that renders HTML in an iframe and wires `@html-review-kit/core` into it.
- `packages/ai`: prompt builders, review packet validation, Codex skill files, Claude instructions, and generic `AGENTS.md` guidance.
- `examples/basic-html`: direct browser SDK demo.
- `examples/react-demo`: React iframe wrapper demo.
- `docs`: schema, SDK, AI workflow, and roadmap documentation.

The core package must not depend on React. Public APIs are exported from each package's `src/index.ts`.

## Core SDK

`@html-review-kit/core` exposes `createReviewLayer(options)` and shared types.

Key types:

- `ArtifactInfo`: artifact id, version, title, source type, and source file.
- `ReviewMode`: `"off" | "comment" | "inspect"`.
- `ArtifactComment`: comment body, AI instruction, status, timestamps, author metadata, and target.
- `ArtifactTarget`: multiple anchors for resolving comments after source edits.
- `ArtifactReviewPacket`: schema version, artifact metadata, comments, export time, and optional instructions.

`ReviewLayerInstance` supports:

- `enable()`
- `disable()`
- `setMode(mode)`
- `getComments()`
- `addComment(input)`
- `updateComment(id, patch)`
- `deleteComment(id)`
- `exportReviewPacket()`
- `importReviewPacket(packet)`
- `destroy()`

The implementation keeps comment state in memory for v0 and calls lifecycle callbacks when comments are created, updated, deleted, or changed.

## Anchoring And Target Resolution

Targets capture multiple references because XPath alone is fragile. Resolution order is:

1. `data-hrk-id`
2. `id`
3. `textQuote`
4. `cssSelector`
5. `xpath`
6. `beforeText` / `afterText`
7. `htmlSnippet` fuzzy match

The SDK encourages AI-generated HTML to include stable `data-hrk-id` attributes on major sections, cards, tables, charts, and headings. When an element lacks a stable id, the SDK can generate one from tag name, role, heading context, readable text, and sibling index.

The spec's original `data-ap-id` is replaced by `data-hrk-id` to keep the public API aligned with HTML Review Kit branding.

## Review UI

The v0 UI is intentionally minimal but usable:

- Hover outline for inspectable elements.
- Click element in comment mode to start a comment.
- Text selection target capture.
- Floating comment input.
- Comment pins rendered as accessible buttons.
- Comment sidebar with open/resolved comment list.
- Export button in demos.

Keyboard behavior:

- `Escape`: cancel current draft.
- `C`: switch to comment mode.
- `V`: switch to inspect mode.
- `Cmd/Ctrl + Enter`: save the active comment.

The overlay must avoid blocking normal page scrolling. Pins and sidebar controls use ARIA labels and keyboard-reachable buttons.

## React Wrapper

`@html-review-kit/react` exposes:

- `ArtifactReviewFrame`
- `useArtifactReview`

`ArtifactReviewFrame` renders provided HTML inside an iframe, creates a review layer in the iframe document, and supports controlled or uncontrolled comments.

Props include:

- `html`
- `artifact`
- `reviewMode`
- `comments`
- `onCommentsChange`
- `className`
- `iframeSandbox`

The React package depends on `@html-review-kit/core` and React peer dependencies only.

## AI Package And Agent Instructions

`@html-review-kit/ai` exposes:

- `buildApplyCommentsPrompt(packet)`
- `validateReviewPacket(input)`
- shared exports for review packet types from core where useful

The package includes:

- `packages/ai/skills/html-review-kit/SKILL.md`
- `packages/ai/skills/html-review-kit/scripts/validate-comments.ts`
- `packages/ai/instructions/claude/CLAUDE.md`
- `packages/ai/instructions/claude/commands/apply-html-review-comments.md`
- `packages/ai/instructions/generic/AGENTS.md`

The distributable skill follows the standard skill anatomy:

```text
html-review-kit/
  SKILL.md
  scripts/
    validate-comments.ts
```

`SKILL.md` must start with YAML frontmatter containing at least:

```yaml
---
name: html-review-kit
description: Use when applying, validating, or resolving HTML Review Kit review packets for AI-generated HTML artifacts, including requests that mention .review/html-review-comments.json, visual HTML comments, artifact comments, or agent handoff comments.
---
```

The body should be concise markdown instructions for reading `.review/html-review-comments.json`, resolving anchors, applying source edits, and writing `.review/html-review-comments.resolved.json`. Detailed schemas and examples should live in package docs or bundled references only if they are needed later; the v0 skill should stay focused.

Agent instructions tell coding agents to read `.review/html-review-comments.json`, process open comments, locate targets by the most stable available anchor, edit source files while preserving semantic HTML, and write `.review/html-review-comments.resolved.json`.

## Storage And Export

v0 supports client-side storage only:

- `memoryStorageAdapter`
- `localStorageAdapter`

The default export packet path is `.review/html-review-comments.json`. Resolved output is `.review/html-review-comments.resolved.json`.

Packet schema version starts at `"0.1"`.

## Tooling

The monorepo uses:

- pnpm workspaces
- TypeScript
- tsup for package builds
- Vitest for unit tests
- Turbo for workspace scripts
- ESLint and Prettier for linting and formatting

Root scripts:

- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm dev`
- `pnpm typecheck`

## Testing

Testing starts with Vitest unit tests:

- Review packet validation accepts valid packets and rejects malformed packets.
- Anchor id generation produces stable kebab-case ids.
- CSS selector generation handles ids, `data-hrk-id`, classes, and fallback paths.
- XPath generation creates resolvable paths.
- Text quote capture records selected text.
- Export/import preserves packet content.
- Target resolution prefers `data-hrk-id`, then text quote, selector, and XPath.

Integration-level browser tests can be added after the API stabilizes. v0 does not require Playwright unless the implementation needs it for confidence in interactive behavior.

## Initial File Structure

```text
html-review-kit/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  turbo.json
  README.md
  AGENTS.md
  packages/
    core/
      src/
        index.ts
        createReviewLayer.ts
        anchors/
        comments/
        dom/
        export/
        overlay/
        storage/
        types.ts
      package.json
      tsconfig.json
    react/
      src/
        ArtifactReviewFrame.tsx
        useArtifactReview.ts
        index.ts
      package.json
      tsconfig.json
    ai/
      src/
        index.ts
        promptBuilders/
        validation/
      skills/
        html-review-kit/
          SKILL.md
          scripts/
            validate-comments.ts
      instructions/
        claude/
        generic/
      package.json
      tsconfig.json
  examples/
    basic-html/
    react-demo/
  docs/
    schema.md
    sdk.md
    ai-workflow.md
    roadmap.md
```

## Milestones

1. Monorepo setup: workspace files, TypeScript config, package manifests, tooling, root docs, and root `AGENTS.md`.
2. Core schema and comments: types, packet export/import, validation, in-memory comment state.
3. Anchors and target resolution: stable anchor generation, selectors, XPath, text quote capture, and resolver.
4. Core review layer UI: hover outline, click-to-comment, text selection capture, pins, sidebar, and keyboard shortcuts.
5. React wrapper: iframe rendering, lifecycle wiring, controlled and uncontrolled comments.
6. AI package: prompt builder, validator script, Codex skill, Claude instructions, generic agent guidance.
7. Demos and docs: basic HTML demo, React demo, schema docs, SDK docs, AI workflow, and roadmap.

## Open Decisions

The repository folder is currently `/Users/bharathnayak/Documents/html-artifact-patch`. Before implementation starts, request approval to rename the working directory to `/Users/bharathnayak/Documents/html-review-kit`, because the rename writes to the parent directory. If approval is not granted, continue with all repo metadata and public branding set to `html-review-kit` inside the current folder.
