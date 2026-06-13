import type { ValidationResult } from "../types";

const ARTIFACT_SOURCE_TYPES = ["html", "unknown"] as const;
const COMMENT_STATUSES = ["open", "resolved", "ignored"] as const;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isNonEmptyString(input: unknown): input is string {
  return typeof input === "string" && input.trim().length > 0;
}

function isIsoTimestamp(input: unknown): input is string {
  return (
    typeof input === "string" &&
    ISO_TIMESTAMP_PATTERN.test(input) &&
    !Number.isNaN(Date.parse(input))
  );
}

function validateOptionalString(
  value: unknown,
  fieldPath: string,
  errors: string[],
): void {
  if (value !== undefined && typeof value !== "string") {
    errors.push(`${fieldPath} must be a string`);
  }
}

function validateRequiredTimestamp(
  value: unknown,
  fieldPath: string,
  errors: string[],
): void {
  if (!isIsoTimestamp(value)) {
    errors.push(`${fieldPath} must be an ISO timestamp string`);
  }
}

function validateOptionalTimestamp(
  value: unknown,
  fieldPath: string,
  errors: string[],
): void {
  if (value !== undefined) {
    validateRequiredTimestamp(value, fieldPath, errors);
  }
}

function validateArtifact(
  artifact: unknown,
  errors: string[],
): string | undefined {
  if (!isRecord(artifact)) {
    errors.push("artifact.artifactId is required");
    return undefined;
  }

  const artifactId = artifact.artifactId;
  if (!isNonEmptyString(artifactId)) {
    errors.push("artifact.artifactId is required");
  }

  if (
    artifact.sourceType !== undefined &&
    (typeof artifact.sourceType !== "string" ||
      !ARTIFACT_SOURCE_TYPES.includes(
        artifact.sourceType as (typeof ARTIFACT_SOURCE_TYPES)[number],
      ))
  ) {
    errors.push("artifact.sourceType must be one of: html, unknown");
  }

  validateOptionalString(artifact.sourceFile, "artifact.sourceFile", errors);
  validateOptionalString(artifact.title, "artifact.title", errors);
  validateOptionalString(artifact.version, "artifact.version", errors);

  return isNonEmptyString(artifactId) ? artifactId : undefined;
}

function validateStringTargetFields(
  target: Record<string, unknown>,
  targetPath: string,
  errors: string[],
): void {
  for (const field of [
    "anchorId",
    "xpath",
    "cssSelector",
    "textQuote",
    "beforeText",
    "afterText",
    "htmlSnippet",
  ]) {
    validateOptionalString(target[field], `${targetPath}.${field}`, errors);
  }
}

function validateTextPosition(
  textPosition: unknown,
  targetPath: string,
  errors: string[],
): void {
  if (textPosition === undefined) {
    return;
  }

  const fieldPath = `${targetPath}.textPosition`;
  if (!isRecord(textPosition)) {
    errors.push(`${fieldPath} must be an object`);
    return;
  }

  const { start, end } = textPosition;
  const hasNumericStart = typeof start === "number" && Number.isFinite(start);
  const hasNumericEnd = typeof end === "number" && Number.isFinite(end);

  if (!hasNumericStart) {
    errors.push(`${fieldPath}.start must be a number`);
  }

  if (!hasNumericEnd) {
    errors.push(`${fieldPath}.end must be a number`);
  }

  if (hasNumericStart && hasNumericEnd && start > end) {
    errors.push(`${fieldPath}.start must be <= textPosition.end`);
  }
}

function validateElementFingerprint(
  elementFingerprint: unknown,
  targetPath: string,
  errors: string[],
): void {
  if (elementFingerprint === undefined) {
    return;
  }

  const fieldPath = `${targetPath}.elementFingerprint`;
  if (!isRecord(elementFingerprint)) {
    errors.push(`${fieldPath} must be an object`);
    return;
  }

  if (!isNonEmptyString(elementFingerprint.tagName)) {
    errors.push(`${fieldPath}.tagName is required`);
  }

  validateOptionalString(elementFingerprint.id, `${fieldPath}.id`, errors);

  if (
    elementFingerprint.classNames !== undefined &&
    (!Array.isArray(elementFingerprint.classNames) ||
      !elementFingerprint.classNames.every(
        (className) => typeof className === "string",
      ))
  ) {
    errors.push(`${fieldPath}.classNames must be an array of strings`);
  }

  validateOptionalString(elementFingerprint.role, `${fieldPath}.role`, errors);
  validateOptionalString(
    elementFingerprint.ariaLabel,
    `${fieldPath}.ariaLabel`,
    errors,
  );
  validateOptionalString(
    elementFingerprint.headingContext,
    `${fieldPath}.headingContext`,
    errors,
  );
  validateOptionalString(
    elementFingerprint.nearbyText,
    `${fieldPath}.nearbyText`,
    errors,
  );
}

function validateTarget(
  target: unknown,
  commentPath: string,
  errors: string[],
): void {
  if (!isRecord(target)) {
    errors.push(`${commentPath}.target must be an object`);
    return;
  }

  const targetPath = `${commentPath}.target`;
  validateStringTargetFields(target, targetPath, errors);
  validateTextPosition(target.textPosition, targetPath, errors);
  validateElementFingerprint(target.elementFingerprint, targetPath, errors);
}

function validateComment(
  comment: unknown,
  index: number,
  artifactId: string | undefined,
  errors: string[],
): void {
  const commentPath = `comments[${index}]`;
  if (!isRecord(comment)) {
    errors.push(`${commentPath} must be an object`);
    return;
  }

  if (!isNonEmptyString(comment.id)) {
    errors.push(`${commentPath}.id is required`);
  }

  if (!isNonEmptyString(comment.artifactId)) {
    errors.push(`${commentPath}.artifactId is required`);
  } else if (artifactId !== undefined && comment.artifactId !== artifactId) {
    errors.push(`${commentPath}.artifactId must match artifact.artifactId`);
  }

  if (
    typeof comment.status !== "string" ||
    !COMMENT_STATUSES.includes(
      comment.status as (typeof COMMENT_STATUSES)[number],
    )
  ) {
    errors.push(
      `${commentPath}.status must be one of: open, resolved, ignored`,
    );
  }

  if (!isNonEmptyString(comment.body)) {
    errors.push(`${commentPath}.body is required`);
  }

  validateTarget(comment.target, commentPath, errors);
  validateRequiredTimestamp(
    comment.createdAt,
    `${commentPath}.createdAt`,
    errors,
  );
  validateOptionalTimestamp(
    comment.updatedAt,
    `${commentPath}.updatedAt`,
    errors,
  );
}

export function validateReviewPacket(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ["packet must be an object"] };
  }

  if (input.schemaVersion !== "0.1") {
    errors.push("schemaVersion must be 0.1");
  }

  const artifactId = validateArtifact(input.artifact, errors);

  if (!Array.isArray(input.comments)) {
    errors.push("comments must be an array");
  } else {
    input.comments.forEach((comment, index) => {
      validateComment(comment, index, artifactId, errors);
    });
  }

  validateRequiredTimestamp(input.exportedAt, "exportedAt", errors);

  return { ok: errors.length === 0, errors };
}
