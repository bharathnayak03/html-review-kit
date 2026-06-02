---
name: html-review-kit
description: Use when applying, validating, or resolving HTML Review Kit review packets for AI-generated HTML artifacts, including requests that mention .review/html-review-comments.json, visual HTML comments, artifact comments, or agent handoff comments.
---

# HTML Review Kit

Use this skill when a user asks to apply or inspect HTML Review Kit comments, including native review packets and copied annotation payloads.

Repository: https://github.com/bharathnayak03/html-review-kit

## Workflow

1. Read `.review/html-review-comments.json` when present. If the user provides copied annotations instead, read the JSON payload's `annotationCollection`.
2. Process only comments where `status` is `open`. For copied annotations, treat `AnnotationCollection.items[*]` with `motivation: "commenting"` as open comments unless explicitly marked otherwise.
3. Locate each target in this order: `anchorId` / `FragmentSelector` with `data-hrk-id`, `textQuote` / `TextQuoteSelector`, `cssSelector` / `CssSelector`, `xpath` / `XPathSelector`, `beforeText` / `afterText`, `htmlSnippet`.
4. Edit the artifact source file named by `artifact.sourceFile`, copied annotation `target.source`, or the user's named source file.
5. Preserve semantic HTML and existing `data-hrk-id` anchors.
6. Add stable `data-hrk-id` anchors to changed major sections when useful.
7. Write `.review/html-review-comments.resolved.json` when applying a review packet.
8. Report changed files, resolved comments, unresolved comments, and reasons for unresolved comments.

## Copied Annotation Payloads

The static HTML toolbar can copy a JSON payload inspired by the W3C Web Annotation Data Model. It contains:

- `prompt`: agent-facing instructions.
- `htmlReviewKit`: artifact metadata and annotation count.
- `annotationCollection`: an object with `@context: "http://www.w3.org/ns/anno.jsonld"`, `type: "AnnotationCollection"`, and `items`.

For each annotation item, use `body.value` as the comment text and `target.selector` plus `target.htmlReviewKitTarget` to locate the source node. Prefer HTML Review Kit target fields when present because they preserve `data-hrk-id`, text quotes, CSS selectors, XPath, and other fallback anchors.

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
