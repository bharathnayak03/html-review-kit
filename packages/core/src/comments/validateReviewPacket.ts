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
  if (
    !artifact ||
    typeof artifact.artifactId !== "string" ||
    artifact.artifactId.length === 0
  ) {
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
