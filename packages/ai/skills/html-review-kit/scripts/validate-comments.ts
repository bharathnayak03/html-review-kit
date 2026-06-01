import { readFileSync } from "node:fs";
import { validateReviewPacket } from "../../../src/validation/validateReviewPacket";

const packetPath = process.argv[2] ?? ".review/html-review-comments.json";
const packet = JSON.parse(readFileSync(packetPath, "utf8")) as unknown;
const result = validateReviewPacket(packet);

if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log(`Valid HTML Review Kit packet: ${packetPath}`);
