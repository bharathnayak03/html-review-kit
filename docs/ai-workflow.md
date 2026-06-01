# AI Workflow

1. Generate semantic HTML with `data-hrk-id` on important sections.
2. Review the rendered artifact with HTML Review Kit.
3. Export `.review/html-review-comments.json`.
4. Ask a coding agent to apply the comments.
5. The agent writes `.review/html-review-comments.resolved.json`.

Agents should resolve targets using `anchorId`, `textQuote`, `cssSelector`, `xpath`, contextual text, and HTML snippets in that order.
