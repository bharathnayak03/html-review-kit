# HTML Review Kit v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial `html-review-kit` TypeScript monorepo with core DOM review SDK, React wrapper, AI helper package, distributable `SKILL.md`, demos, docs, and tests for schema and anchoring behavior.

**Architecture:** Use a pnpm workspace with three packages: `@html-review-kit/core`, `@html-review-kit/react`, and `@html-review-kit/ai`. Keep DOM/schema/anchor logic in core, iframe React integration in react, and agent prompt/skill assets in ai.

**Tech Stack:** pnpm, TypeScript, tsup, Vitest, Turbo, React, Vite, ESLint, Prettier.

---

## File Structure

- Create root workspace files: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `turbo.json`, `.gitignore`, `.prettierrc`, `eslint.config.js`, `README.md`, `AGENTS.md`.
- Create `packages/core` for framework-agnostic SDK types, anchor helpers, target resolution, comment state, storage adapters, review layer, and tests.
- Create `packages/react` for `ArtifactReviewFrame`, `useArtifactReview`, and tests.
- Create `packages/ai` for prompt builders, review packet validation, agent instruction assets, the real skill package at `packages/ai/skills/html-review-kit/SKILL.md`, and tests.
- Create examples in `examples/basic-html` and `examples/react-demo`.
- Create docs in `docs/schema.md`, `docs/sdk.md`, `docs/ai-workflow.md`, and `docs/roadmap.md`.

## Task 0: Repository Path Decision

**Files:**
- No file changes if approval is granted; shell move happens from parent directory.

- [ ] **Step 1: Request folder rename approval**

Run only with explicit approval:

```bash
mv /Users/bharathnayak/Documents/html-artifact-patch /Users/bharathnayak/Documents/html-review-kit
```

Expected: workspace folder becomes `/Users/bharathnayak/Documents/html-review-kit`.

- [ ] **Step 2: If approval is not granted, continue in the current folder**

Keep all repo metadata and public branding as `html-review-kit`.

## Task 1: Workspace Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.prettierrc`
- Create: `eslint.config.js`

- [ ] **Step 1: Create root package manifest**

```json
{
  "name": "html-review-kit",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "dev": "turbo dev",
    "typecheck": "turbo typecheck",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "jsdom": "^25.0.0",
    "prettier": "^3.0.0",
    "tsup": "^8.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "typescript-eslint": "^8.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create workspace and TypeScript config**

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
  }
}
```

- [ ] **Step 3: Create Turbo, lint, and formatting config**

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

`.gitignore`:

```gitignore
node_modules
dist
.turbo
coverage
.DS_Store
.review/*.resolved.json
```

`.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all"
}
```

`eslint.config.js`:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"],
  },
];
```

- [ ] **Step 4: Commit workspace setup**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json turbo.json .gitignore .prettierrc eslint.config.js
git commit -m "chore: set up html review kit workspace"
```

## Task 2: Core Package Types And Schema Tests

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/comments/validateReviewPacket.ts`
- Create: `packages/core/src/comments/validateReviewPacket.test.ts`

- [ ] **Step 1: Write failing schema validation tests**

```ts
import { describe, expect, it } from "vitest";
import { validateReviewPacket } from "./validateReviewPacket";
import type { ArtifactReviewPacket } from "../types";

const validPacket: ArtifactReviewPacket = {
  schemaVersion: "0.1",
  artifact: {
    artifactId: "pricing-page",
    sourceType: "html",
    sourceFile: "index.html",
  },
  comments: [
    {
      id: "cmt_001",
      artifactId: "pricing-page",
      status: "open",
      body: "Make the table easier to scan.",
      target: {
        anchorId: "pricing-table",
        cssSelector: "[data-hrk-id='pricing-table']",
      },
      createdAt: "2026-06-01T10:00:00.000Z",
    },
  ],
  exportedAt: "2026-06-01T10:05:00.000Z",
};

describe("validateReviewPacket", () => {
  it("accepts a valid review packet", () => {
    expect(validateReviewPacket(validPacket)).toEqual({ ok: true, errors: [] });
  });

  it("rejects malformed review packets", () => {
    expect(validateReviewPacket({ schemaVersion: "0.2", comments: [] })).toEqual({
      ok: false,
      errors: [
        "schemaVersion must be 0.1",
        "artifact.artifactId is required",
        "exportedAt must be an ISO timestamp string",
      ],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-review-kit/core test -- validateReviewPacket.test.ts`

Expected: fails because package and validator do not exist yet.

- [ ] **Step 3: Create core package files and implementation**

`packages/core/package.json`:

```json
{
  "name": "@html-review-kit/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "test": "vitest run --environment jsdom",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  }
}
```

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

`packages/core/src/types.ts`:

```ts
export type ArtifactSourceType = "html" | "react" | "mdx" | "unknown";

export interface ArtifactInfo {
  artifactId: string;
  version?: string;
  title?: string;
  sourceType?: ArtifactSourceType;
  sourceFile?: string;
}

export type ReviewMode = "off" | "comment" | "inspect";
export type ArtifactCommentStatus = "open" | "resolved" | "ignored";

export interface ArtifactTarget {
  anchorId?: string;
  xpath?: string;
  cssSelector?: string;
  textQuote?: string;
  textPosition?: { start: number; end: number };
  beforeText?: string;
  afterText?: string;
  htmlSnippet?: string;
  elementFingerprint?: {
    tagName: string;
    id?: string;
    classNames?: string[];
    role?: string;
    ariaLabel?: string;
    headingContext?: string;
    nearbyText?: string;
  };
}

export interface ArtifactComment {
  id: string;
  artifactId: string;
  status: ArtifactCommentStatus;
  body: string;
  aiInstruction?: string;
  target: ArtifactTarget;
  author?: { name?: string; email?: string };
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
  resolution?: {
    summary: string;
    changedFiles: string[];
  };
}

export interface ArtifactReviewPacket {
  schemaVersion: "0.1";
  artifact: ArtifactInfo;
  comments: ArtifactComment[];
  exportedAt: string;
  instructions?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}
```

`packages/core/src/comments/validateReviewPacket.ts`:

```ts
import type { ValidationResult } from "../types";

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export function validateReviewPacket(input: unknown): ValidationResult {
  const errors: string[] = [];
  const packet = input as Record<string, unknown> | null;

  if (!packet || typeof packet !== "object") {
    return { ok: false, errors: ["packet must be an object"] };
  }

  if (packet.schemaVersion !== "0.1") {
    errors.push("schemaVersion must be 0.1");
  }

  const artifact = packet.artifact as Record<string, unknown> | undefined;
  if (!artifact || typeof artifact.artifactId !== "string" || artifact.artifactId.length === 0) {
    errors.push("artifact.artifactId is required");
  }

  if (!Array.isArray(packet.comments)) {
    errors.push("comments must be an array");
  }

  if (typeof packet.exportedAt !== "string" || !ISO_TIMESTAMP_PATTERN.test(packet.exportedAt)) {
    errors.push("exportedAt must be an ISO timestamp string");
  }

  return { ok: errors.length === 0, errors };
}
```

`packages/core/src/index.ts`:

```ts
export * from "./types";
export * from "./comments/validateReviewPacket";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @html-review-kit/core test -- validateReviewPacket.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit core types and validation**

```bash
git add packages/core
git commit -m "feat(core): add review packet schema types"
```

## Task 3: Anchor And Target Resolution Utilities

**Files:**
- Create: `packages/core/src/anchors/generateAnchorId.ts`
- Create: `packages/core/src/anchors/generateCssSelector.ts`
- Create: `packages/core/src/anchors/generateXPath.ts`
- Create: `packages/core/src/anchors/createTargetFromElement.ts`
- Create: `packages/core/src/anchors/resolveTarget.ts`
- Create: `packages/core/src/anchors/*.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing anchor tests**

```ts
import { describe, expect, it } from "vitest";
import { generateAnchorId } from "./generateAnchorId";

describe("generateAnchorId", () => {
  it("uses data-hrk-id when present", () => {
    const element = document.createElement("section");
    element.setAttribute("data-hrk-id", "pricing-comparison");

    expect(generateAnchorId(element)).toBe("pricing-comparison");
  });

  it("generates stable kebab-case ids from element text", () => {
    const element = document.createElement("section");
    element.textContent = "Executive Summary: Q2 Revenue";

    expect(generateAnchorId(element)).toBe("section-executive-summary-q2-revenue");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-review-kit/core test -- generateAnchorId.test.ts`

Expected: FAIL because `generateAnchorId` does not exist.

- [ ] **Step 3: Implement anchor id generation**

```ts
function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function generateAnchorId(element: Element): string {
  const existing = element.getAttribute("data-hrk-id") || element.id;
  if (existing) return toKebabCase(existing);

  const label =
    element.getAttribute("aria-label") ||
    element.querySelector("h1,h2,h3,h4,h5,h6")?.textContent ||
    element.textContent ||
    element.tagName.toLowerCase();

  const text = toKebabCase(label);
  const tag = element.tagName.toLowerCase();

  return text ? `${tag}-${text}` : tag;
}
```

- [ ] **Step 4: Add selector, XPath, target, and resolver tests before implementation**

Write tests that verify:

- `generateCssSelector` returns `[data-hrk-id="hero"]` for stable anchors.
- `generateXPath` returns a path that `document.evaluate` resolves.
- `createTargetFromElement` captures `anchorId`, `cssSelector`, `xpath`, `htmlSnippet`, and fingerprint.
- `resolveTarget` prefers `data-hrk-id`, then `textQuote`, then `cssSelector`, then `xpath`.

- [ ] **Step 5: Implement selector, XPath, target, and resolver utilities**

Use DOM APIs only. Avoid React and avoid external dependencies.

- [ ] **Step 6: Export utilities**

```ts
export * from "./anchors/generateAnchorId";
export * from "./anchors/generateCssSelector";
export * from "./anchors/generateXPath";
export * from "./anchors/createTargetFromElement";
export * from "./anchors/resolveTarget";
```

- [ ] **Step 7: Run tests**

Run: `pnpm --filter @html-review-kit/core test`

Expected: PASS.

- [ ] **Step 8: Commit anchor utilities**

```bash
git add packages/core/src
git commit -m "feat(core): add anchor and target resolution utilities"
```

## Task 4: Comment State, Storage, Import, And Export

**Files:**
- Create: `packages/core/src/comments/createCommentStore.ts`
- Create: `packages/core/src/comments/exportReviewPacket.ts`
- Create: `packages/core/src/storage/memoryStorageAdapter.ts`
- Create: `packages/core/src/storage/localStorageAdapter.ts`
- Create: tests for each file
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing tests for comment store and packet export**

Test that:

- `addComment` assigns `id`, `artifactId`, `status: "open"`, and ISO timestamps.
- `updateComment` changes body/status and sets `updatedAt`.
- `deleteComment` removes a comment.
- `exportReviewPacket` returns schema version `"0.1"` and artifact metadata.
- `importReviewPacket` replaces current comments.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @html-review-kit/core test -- comments`

Expected: FAIL because store/export modules do not exist.

- [ ] **Step 3: Implement comment store**

Create a small store factory with callbacks:

```ts
export interface AddCommentInput {
  body: string;
  aiInstruction?: string;
  target: ArtifactTarget;
  author?: ArtifactComment["author"];
  metadata?: Record<string, unknown>;
}
```

The store should accept `artifact`, initial `comments`, and callbacks. Generate ids as `cmt_${crypto.randomUUID()}` when `crypto.randomUUID` exists, otherwise use timestamp and counter.

- [ ] **Step 4: Implement export/import helpers and storage adapters**

`memoryStorageAdapter` keeps an internal array copy. `localStorageAdapter(key)` serializes comments to browser local storage.

- [ ] **Step 5: Export modules**

Add exports for comments and storage helpers from `packages/core/src/index.ts`.

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @html-review-kit/core test`

Expected: PASS.

- [ ] **Step 7: Commit comments and storage**

```bash
git add packages/core/src
git commit -m "feat(core): add comment state and review packet export"
```

## Task 5: Core Review Layer UI

**Files:**
- Create: `packages/core/src/createReviewLayer.ts`
- Create: `packages/core/src/overlay/createOverlay.ts`
- Create: `packages/core/src/overlay/createSidebar.ts`
- Create: `packages/core/src/createReviewLayer.test.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write failing review layer API tests**

Test that:

- `createReviewLayer` returns `enable`, `disable`, `setMode`, `getComments`, `addComment`, `updateComment`, `deleteComment`, `exportReviewPacket`, `importReviewPacket`, and `destroy`.
- `addComment` calls `onCommentCreate` and `onCommentsChange`.
- `setMode("comment")` updates interaction state.
- `destroy` removes overlay nodes and listeners.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-review-kit/core test -- createReviewLayer.test.ts`

Expected: FAIL because `createReviewLayer` does not exist.

- [ ] **Step 3: Add review layer option and instance types**

Add to `types.ts`:

```ts
export interface CreateReviewLayerOptions {
  root: HTMLElement | Document;
  artifact: ArtifactInfo;
  mode?: ReviewMode;
  comments?: ArtifactComment[];
  autoGenerateAnchors?: boolean;
  readonly?: boolean;
  onCommentCreate?: (comment: ArtifactComment) => void;
  onCommentUpdate?: (comment: ArtifactComment) => void;
  onCommentDelete?: (commentId: string) => void;
  onCommentsChange?: (comments: ArtifactComment[]) => void;
}

export interface ReviewLayerInstance {
  enable(): void;
  disable(): void;
  setMode(mode: ReviewMode): void;
  getComments(): ArtifactComment[];
  addComment(input: AddCommentInput): ArtifactComment;
  updateComment(id: string, patch: Partial<ArtifactComment>): void;
  deleteComment(id: string): void;
  exportReviewPacket(): ArtifactReviewPacket;
  importReviewPacket(packet: ArtifactReviewPacket): void;
  destroy(): void;
}
```

- [ ] **Step 4: Implement minimal overlay**

Implement DOM nodes with `data-hrk-overlay`, pin buttons, and sidebar. Use event delegation on the root for hover/click. On click in comment mode, prompt with a small textarea form and save via `Cmd/Ctrl + Enter`.

- [ ] **Step 5: Export `createReviewLayer`**

```ts
export * from "./createReviewLayer";
```

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @html-review-kit/core test`

Expected: PASS.

- [ ] **Step 7: Commit review layer**

```bash
git add packages/core/src
git commit -m "feat(core): add browser review layer"
```

## Task 6: React Wrapper Package

**Files:**
- Create: `packages/react/package.json`
- Create: `packages/react/tsconfig.json`
- Create: `packages/react/src/ArtifactReviewFrame.tsx`
- Create: `packages/react/src/useArtifactReview.ts`
- Create: `packages/react/src/index.ts`
- Create: `packages/react/src/ArtifactReviewFrame.test.tsx`

- [ ] **Step 1: Write failing React wrapper test**

Test with React Testing Library or a lightweight render check that `ArtifactReviewFrame` renders an iframe and calls `onCommentsChange` when the core layer changes. If adding React Testing Library expands dependencies too much, test the hook’s lifecycle with a focused mocked `createReviewLayer`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-review-kit/react test`

Expected: FAIL because package does not exist.

- [ ] **Step 3: Create React package**

Use React peer dependencies:

```json
{
  "name": "@html-review-kit/react",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts --external react",
    "test": "vitest run --environment jsdom",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@html-review-kit/core": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

- [ ] **Step 4: Implement wrapper**

`ArtifactReviewFrame` writes `html` into `iframe.srcdoc`, waits for iframe load, creates the review layer in the iframe document, and destroys it on unmount or prop changes. Controlled `comments` should call `importReviewPacket` or recreate the layer when the array changes.

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @html-review-kit/react test`

Expected: PASS.

- [ ] **Step 6: Commit React wrapper**

```bash
git add packages/react
git commit -m "feat(react): add artifact review frame"
```

## Task 7: AI Package And Skill Assets

**Files:**
- Create: `packages/ai/package.json`
- Create: `packages/ai/tsconfig.json`
- Create: `packages/ai/src/promptBuilders/buildApplyCommentsPrompt.ts`
- Create: `packages/ai/src/validation/validateReviewPacket.ts`
- Create: `packages/ai/src/index.ts`
- Create: `packages/ai/src/**/*.test.ts`
- Create: `packages/ai/skills/html-review-kit/SKILL.md`
- Create: `packages/ai/skills/html-review-kit/scripts/validate-comments.ts`
- Create: `packages/ai/instructions/claude/CLAUDE.md`
- Create: `packages/ai/instructions/claude/commands/apply-html-review-comments.md`
- Create: `packages/ai/instructions/generic/AGENTS.md`

- [ ] **Step 1: Write failing AI prompt builder test**

Test that `buildApplyCommentsPrompt(packet)` includes:

- artifact id
- source file
- open comments
- target resolution order
- resolved output file path

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @html-review-kit/ai test`

Expected: FAIL because package does not exist.

- [ ] **Step 3: Implement AI package and prompt builder**

The prompt should instruct the agent to read comments, preserve semantic HTML, prefer `data-hrk-id`, avoid unrelated edits, and write `.review/html-review-comments.resolved.json`.

- [ ] **Step 4: Create `SKILL.md` in standard format**

`packages/ai/skills/html-review-kit/SKILL.md`:

```markdown
---
name: html-review-kit
description: Use when applying, validating, or resolving HTML Review Kit review packets for AI-generated HTML artifacts, including requests that mention .review/html-review-comments.json, visual HTML comments, artifact comments, or agent handoff comments.
---

# HTML Review Kit

Use this skill when a user asks to apply or inspect HTML Review Kit comments.

## Workflow

1. Read `.review/html-review-comments.json`.
2. Process only comments where `status` is `open`.
3. Locate each target in this order: `anchorId`, `textQuote`, `cssSelector`, `xpath`, `beforeText` / `afterText`, `htmlSnippet`.
4. Edit the artifact source file named by `artifact.sourceFile` when present.
5. Preserve semantic HTML and existing `data-hrk-id` anchors.
6. Add stable `data-hrk-id` anchors to changed major sections when useful.
7. Write `.review/html-review-comments.resolved.json`.
8. Report changed files, resolved comments, unresolved comments, and reasons for unresolved comments.

## Validation

When a validation script is available, run:

```bash
tsx packages/ai/skills/html-review-kit/scripts/validate-comments.ts .review/html-review-comments.json
```
```

- [ ] **Step 5: Implement validation script**

The script reads a packet path, calls `validateReviewPacket`, prints errors, and exits nonzero on invalid input.

- [ ] **Step 6: Add Claude and generic instruction files**

Keep these as instruction assets, not skill packages.

- [ ] **Step 7: Run tests**

Run: `pnpm --filter @html-review-kit/ai test`

Expected: PASS.

- [ ] **Step 8: Commit AI package**

```bash
git add packages/ai
git commit -m "feat(ai): add prompt builder and html review kit skill"
```

## Task 8: Examples And Documentation

**Files:**
- Create: `examples/basic-html/package.json`
- Create: `examples/basic-html/index.html`
- Create: `examples/basic-html/src/main.ts`
- Create: `examples/react-demo/package.json`
- Create: `examples/react-demo/index.html`
- Create: `examples/react-demo/src/App.tsx`
- Create: `examples/react-demo/src/main.tsx`
- Create: `docs/schema.md`
- Create: `docs/sdk.md`
- Create: `docs/ai-workflow.md`
- Create: `docs/roadmap.md`
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Create README and AGENTS docs**

README should show install, direct SDK usage, React usage, and AI workflow. `AGENTS.md` should tell coding agents how to apply `.review/html-review-comments.json`.

- [ ] **Step 2: Create basic HTML demo**

Demo should call `createReviewLayer({ root: document.body, artifact, mode: "comment" })`, include semantic sections with `data-hrk-id`, and include an export button that downloads `html-review-comments.json`.

- [ ] **Step 3: Create React demo**

Use Vite and `ArtifactReviewFrame` to render sample HTML and show exported packet JSON.

- [ ] **Step 4: Create docs**

Document schema, SDK API, AI workflow, and roadmap from the approved spec.

- [ ] **Step 5: Run workspace checks**

Run:

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

Expected: all pass. If `pnpm install` fails because network access is restricted, rerun with escalation approval.

- [ ] **Step 6: Commit examples and docs**

```bash
git add README.md AGENTS.md docs examples
git commit -m "docs: add demos and html review kit workflow"
```

## Task 9: Final Verification

**Files:**
- No planned file edits unless verification finds a defect.

- [ ] **Step 1: Run full verification**

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

Expected: all pass.

- [ ] **Step 2: Inspect git status**

```bash
git status --short
```

Expected: clean working tree.

- [ ] **Step 3: If examples have runnable dev servers, start one for manual inspection**

Run:

```bash
pnpm --filter react-demo dev
```

Expected: Vite prints a localhost URL. Open with Browser plugin and verify iframe content appears, review mode creates comments, and exported JSON contains `schemaVersion: "0.1"`.

## Self-Review Notes

- Spec coverage: the plan covers monorepo setup, `core`, `react`, `ai`, basic demos, schema/anchor tests, `SKILL.md` format, docs, and local-only storage/export.
- Scope boundaries: no browser extension, VS Code extension, backend, auth, realtime, screenshot diffing, MCP server, or browser-side source patching.
- Type consistency: package scope is `@html-review-kit/*`; stable anchor attribute is `data-hrk-id`; default packet path is `.review/html-review-comments.json`; resolved path is `.review/html-review-comments.resolved.json`.
