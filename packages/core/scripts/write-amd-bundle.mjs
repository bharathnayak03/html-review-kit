import { copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve(import.meta.dirname, "../dist");
const iifeFile = resolve(distDir, "index.global.js");
const amdFile = resolve(distDir, "index.amd.js");

const source = await readFile(iifeFile, "utf8");
const amdRegistration = `
;if (typeof define === "function" && define.amd) {
  define("@bharathnayak03/html-review-kit-core", [], function () {
    return globalThis.HTMLReviewKitCore;
  });
}
`;

await writeFile(amdFile, `${source}${amdRegistration}`);
await copyFile(amdFile, resolve(distDir, "html-review-kit-core.amd.js"));
