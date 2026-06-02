# HTML Review Kit Claude Instructions

When applying HTML Review Kit comments, read `.review/html-review-comments.json` when present. If the user provides copied annotations instead, read the JSON payload's `annotationCollection`.

For native review packets, process open comments and write `.review/html-review-comments.resolved.json`. For copied annotation payloads, treat `AnnotationCollection.items[*]` with `motivation: "commenting"` as comments and use `body.value` as the requested change.

Prefer `data-hrk-id` / `FragmentSelector`, text quotes / `TextQuoteSelector`, CSS selectors / `CssSelector`, and then XPath / `XPathSelector`. Preserve semantic HTML and explain unresolved comments clearly.
