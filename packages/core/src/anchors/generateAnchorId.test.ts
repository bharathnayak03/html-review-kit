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
