#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { buildApplyCommentsPrompt } from "./promptBuilders/buildApplyCommentsPrompt";
import { validateReviewPacket } from "./validation/validateReviewPacket";
import type { ArtifactReviewPacket } from "@html-review-kit/core";

const [, , command, packetPath = ".review/html-review-comments.json"] = process.argv;

function readPacket(): ArtifactReviewPacket {
  return JSON.parse(readFileSync(packetPath, "utf8")) as ArtifactReviewPacket;
}

if (command === "validate") {
  const result = validateReviewPacket(readPacket());
  if (!result.ok) {
    console.error(result.errors.join("\n"));
    process.exit(1);
  }
  console.log(`Valid HTML Review Kit packet: ${packetPath}`);
} else if (command === "prompt") {
  console.log(buildApplyCommentsPrompt(readPacket()));
} else {
  console.log(`Usage:
  html-review-kit validate [packet-path]
  html-review-kit prompt [packet-path]`);
}
