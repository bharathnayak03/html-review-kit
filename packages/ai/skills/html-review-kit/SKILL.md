---
name: html-review-kit
description: Use when applying, validating, or resolving HTML Review Kit review packets for AI-generated HTML artifacts, including requests that mention .review/html-review-comments.json, visual HTML comments, artifact comments, or agent handoff comments.
---

# HTML Review Kit

Use this skill when a user asks to apply or inspect HTML Review Kit comments.

Repository: https://github.com/bharathnayak03/html-review-kit

## Workflow

1. Read `.review/html-review-comments.json`.
2. Process only comments where `status` is `open`.
3. Locate each target in this order: `anchorId`, `textQuote`, `cssSelector`, `xpath`, `beforeText` / `afterText`, `htmlSnippet`.
4. Edit the artifact source file named by `artifact.sourceFile` when present.
5. Preserve semantic HTML and existing `data-hrk-id` anchors.
6. Add stable `data-hrk-id` anchors to changed major sections when useful.
7. Write `.review/html-review-comments.resolved.json`.
8. Report changed files, resolved comments, unresolved comments, and reasons for unresolved comments.

## Validation

When this skill is installed from the repo, prefer the bundled validation script:

```bash
tsx packages/ai/skills/html-review-kit/scripts/validate-comments.ts .review/html-review-comments.json
```

If the script is not present in the current checkout, future published versions can be run through npm:

```bash
npx @html-review-kit/ai validate .review/html-review-comments.json
```

For source installs, scripts can be downloaded from:

```text
https://raw.githubusercontent.com/bharathnayak03/html-review-kit/main/packages/ai/skills/html-review-kit/scripts/validate-comments.ts
```
