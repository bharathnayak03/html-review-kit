import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageJsonPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../package.json",
);

type PackageJson = {
  main?: string;
  module?: string;
  types?: string;
  unpkg?: string;
  jsdelivr?: string;
  exports?: {
    ".": {
      types?: string;
      import?: string;
      browser?: string;
      default?: string;
    };
    "./global"?: {
      types?: string;
      default?: string;
    };
    "./html-review-kit-core.amd.js"?: string;
    "./amd"?: {
      default?: string;
    };
  };
};

const readPackageJson = () =>
  JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageJson;

describe("package metadata", () => {
  it("preserves CDN/browser bundle entries while exposing TypeScript and ESM metadata", () => {
    const packageJson = readPackageJson();

    expect(packageJson.main).toBe("./dist/index.global.js");
    expect(packageJson.unpkg).toBe("./dist/html-review-kit-core.amd.js");
    expect(packageJson.jsdelivr).toBe("./dist/html-review-kit-core.amd.js");
    expect(packageJson.types).toBe("./dist/index.d.ts");
    expect(packageJson.module).toBe("./dist/index.js");

    expect(packageJson.exports?.["."]).toEqual({
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
      browser: "./dist/index.js",
      default: "./dist/index.global.js",
    });
    expect(packageJson.exports?.["./global"]).toEqual({
      types: "./dist/index.d.ts",
      default: "./dist/index.global.js",
    });
    expect(packageJson.exports?.["./html-review-kit-core.amd.js"]).toBe(
      "./dist/html-review-kit-core.amd.js",
    );
    expect(packageJson.exports?.["./amd"]).toEqual({
      default: "./dist/index.amd.js",
    });
  });
});
