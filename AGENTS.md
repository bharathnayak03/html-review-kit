# HTML Review Kit Agent Guide

This repo implements HTML Review Kit, a TypeScript SDK for reviewing AI-generated HTML artifacts.

## Setup

- Install dependencies: `pnpm install`
- Build all packages: `pnpm build`
- Run tests: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`

## Coding Rules

- Use TypeScript.
- Avoid `any` unless necessary.
- Keep `@html-review-kit/core` framework-agnostic.
- Public APIs must be exported from each package's `src/index.ts`.
- Use `data-hrk-id` for stable artifact anchors.

## Applying HTML Review Kit Comments

When asked to apply review comments:

1. Read `.review/html-review-comments.json`.
2. Process open comments only.
3. Locate targets in this order: `anchorId`, `textQuote`, `cssSelector`, `xpath`, `beforeText` / `afterText`, `htmlSnippet`.
4. Modify the source file identified by `artifact.sourceFile` when available.
5. Preserve semantic HTML and stable `data-hrk-id` anchors.
6. Write `.review/html-review-comments.resolved.json`.
7. Summarize resolved and unresolved comments.
