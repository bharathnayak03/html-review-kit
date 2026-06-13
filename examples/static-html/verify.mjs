import { readFile } from "node:fs/promises";

const examplePath = new URL("./index.html", import.meta.url);
const readmePath = new URL("./README.md", import.meta.url);

const [html, readme] = await Promise.all([
  readFile(examplePath, "utf8"),
  readFile(readmePath, "utf8"),
]);

const requiredHtml = [
  'data-hrk-id="artifact-root"',
  "../../packages/core/dist/html-review-kit-core.amd.js",
  "HTMLReviewKitCore.createReviewLayer",
  'sourceFile: "examples/static-html/index.html"',
  'mode: "off"',
  "review.enable();",
];

for (const snippet of requiredHtml) {
  if (!html.includes(snippet)) {
    throw new Error(`Missing expected HTML snippet: ${snippet}`);
  }
}

const anchors = [...html.matchAll(/data-hrk-id="([^"]+)"/g)].map(
  (match) => match[1],
);
const duplicateAnchors = anchors.filter(
  (anchor, index) => anchors.indexOf(anchor) !== index,
);

if (anchors.length < 10) {
  throw new Error(
    `Expected at least 10 data-hrk-id anchors, found ${anchors.length}`,
  );
}

if (duplicateAnchors.length > 0) {
  throw new Error(
    `Duplicate data-hrk-id anchors: ${duplicateAnchors.join(", ")}`,
  );
}

const requiredReadme = [
  "pnpm --filter @bharathnayak03/html-review-kit-core build",
  "python3 -m http.server 4173 --directory .",
  "open http://localhost:4173/examples/static-html/",
  "http://localhost:4173/examples/static-html/",
];

for (const snippet of requiredReadme) {
  if (!readme.includes(snippet)) {
    throw new Error(`Missing expected README snippet: ${snippet}`);
  }
}

const staleReadme = [
  "open examples/static-html/index.html",
  "python3 -m http.server 4173 --directory examples/static-html",
  "http://localhost:4173\n",
];

for (const snippet of staleReadme) {
  if (readme.includes(snippet)) {
    throw new Error(`README still documents stale command: ${snippet}`);
  }
}
