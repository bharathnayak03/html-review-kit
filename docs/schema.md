# Copied Annotation Shape

`Copy prompt` copies plain text for an agent. The prompt includes an `AnnotationCollection` block with open comments.

Important fields:

- `body.value`: requested change.
- `target.source`: source HTML file.
- `target.htmlReviewKitTarget`: HTML Review Kit target data.
- `selector`: fallback selectors such as `FragmentSelector`, `TextQuoteSelector`, `CssSelector`, and `XPathSelector`.

Stable anchors use `data-hrk-id`.
