# Review Packet Schema

HTML Review Kit exports `.review/html-review-comments.json` with schema version `0.1`.

Core fields:

- `artifact`: artifact id, version, source type, title, and source file.
- `comments`: review comments with status, body, optional AI instruction, target, author, and timestamps.
- `target`: stable location data including `anchorId`, `textQuote`, `cssSelector`, `xpath`, nearby text, HTML snippet, and element fingerprint.

Stable anchors use `data-hrk-id`.
