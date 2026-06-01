Apply HTML Review Kit comments.

Arguments:
- Source file: $1
- Review packet: $2

Steps:
1. Read the review packet.
2. Apply all open comments to the source file.
3. Preserve semantic HTML and stable anchors.
4. Write resolved output to `.review/html-review-comments.resolved.json`.
