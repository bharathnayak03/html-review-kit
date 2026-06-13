# Static HTML Example

This example is a standalone HTML artifact with semantic sections and stable
`data-hrk-id` anchors for HTML Review Kit comments.

Build the local AMD bundle first:

```bash
pnpm --filter @bharathnayak03/html-review-kit-core build
```

Then open the artifact directly:

```bash
open examples/static-html/index.html
```

Or serve the example directory:

```bash
python3 -m http.server 4173 --directory examples/static-html
```

Then visit:

```text
http://localhost:4173
```

The HTML loads the built bundle from:

```html
<script src="../../packages/core/dist/html-review-kit-core.amd.js"></script>
```

Use the toolbar to enable review mode, add comments, and copy the generated
agent prompt.
