# HTML Review Kit Agent Instructions

Repository: https://github.com/bharathnayak03/html-review-kit

When asked to apply HTML Review Kit comments:

1. Read `.review/html-review-comments.json` when present. If the user provides copied annotations instead, read the JSON payload's `annotationCollection`.
2. Process open comments only. For copied annotations, treat `AnnotationCollection.items[*]` with `motivation: "commenting"` as open comments unless explicitly marked otherwise.
3. Resolve targets using `anchorId` / `FragmentSelector` with `data-hrk-id`, `textQuote` / `TextQuoteSelector`, `cssSelector` / `CssSelector`, `xpath` / `XPathSelector`, `beforeText` / `afterText`, then `htmlSnippet`.
4. Modify the source file identified by `artifact.sourceFile`, copied annotation `target.source`, or the user's named source file.
5. Preserve semantic HTML and `data-hrk-id` anchors.
6. Write `.review/html-review-comments.resolved.json` when applying a review packet.
7. Summarize resolved and unresolved comments.
