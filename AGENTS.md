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

1. Read `.review/html-review-comments.json` when present. If the user provides copied annotations instead, read the JSON payload's `annotationCollection`.
2. Process open comments only. For copied annotations, treat `AnnotationCollection.items[*]` with `motivation: "commenting"` as open comments unless explicitly marked otherwise.
3. Locate targets in this order: `anchorId` / `FragmentSelector` with `data-hrk-id`, `textQuote` / `TextQuoteSelector`, `cssSelector` / `CssSelector`, `xpath` / `XPathSelector`, `beforeText` / `afterText`, `htmlSnippet`.
4. Modify the source file identified by `artifact.sourceFile`, copied annotation `target.source`, or the user's named source file.
5. Preserve semantic HTML and stable `data-hrk-id` anchors.
6. Write `.review/html-review-comments.resolved.json` when applying a review packet.
7. Summarize resolved and unresolved comments.
