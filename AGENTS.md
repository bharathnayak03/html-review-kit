# HTML Review Kit Agent Guide

This repo implements HTML Review Kit for static HTML artifacts.

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

When asked to apply copied HTML Review Kit annotations:

1. Read the copied prompt and its `AnnotationCollection`.
2. Process annotations with `motivation: "commenting"`.
3. Locate targets in this order: `target.htmlReviewKitTarget`, `FragmentSelector` with `data-hrk-id`, `TextQuoteSelector`, `CssSelector`, `XPathSelector`, nearby text, then HTML snippet.
4. Modify the source file identified by `target.source` or the user's named source file.
5. Preserve semantic HTML and stable `data-hrk-id` anchors.
6. Summarize applied and unresolved annotations.

Do not write resolved JSON output unless the user explicitly asks for it.
