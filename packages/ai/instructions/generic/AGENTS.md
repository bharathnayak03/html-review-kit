# HTML Review Kit Agent Instructions

Repository: https://github.com/bharathnayak03/html-review-kit

When asked to apply HTML Review Kit comments:

1. Read `.review/html-review-comments.json`.
2. Process open comments only.
3. Resolve targets using `anchorId`, `textQuote`, `cssSelector`, `xpath`, `beforeText` / `afterText`, then `htmlSnippet`.
4. Modify the source file identified by `artifact.sourceFile` when available.
5. Preserve semantic HTML and `data-hrk-id` anchors.
6. Write `.review/html-review-comments.resolved.json`.
7. Summarize resolved and unresolved comments.
