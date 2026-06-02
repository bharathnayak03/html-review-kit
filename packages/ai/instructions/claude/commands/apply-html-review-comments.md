Apply HTML Review Kit comments.

Arguments:

- Source file: $1
- Review packet: $2

Steps:

1. Read the review packet. If copied annotations are provided instead, read the JSON payload's `annotationCollection`.
2. Apply all open comments to the source file. For copied annotations, use `body.value` as the comment text and `target.selector` / `target.htmlReviewKitTarget` to locate the node.
3. Preserve semantic HTML and stable anchors.
4. Write resolved output to `.review/html-review-comments.resolved.json` when applying a review packet.
