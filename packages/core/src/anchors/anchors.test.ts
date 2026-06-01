import { describe, expect, it } from "vitest";
import { createTargetFromElement } from "./createTargetFromElement";
import { generateCssSelector } from "./generateCssSelector";
import { generateXPath } from "./generateXPath";
import { resolveTarget } from "./resolveTarget";

describe("anchor utilities", () => {
  it("generates CSS selectors that prefer data-hrk-id", () => {
    const element = document.createElement("section");
    element.setAttribute("data-hrk-id", "hero");

    expect(generateCssSelector(element)).toBe('[data-hrk-id="hero"]');
  });

  it("generates XPath values that resolve back to the element", () => {
    document.body.innerHTML = "<main><section><h2>Plans</h2></section></main>";
    const section = document.querySelector("section");
    if (!section) throw new Error("section missing");

    const xpath = generateXPath(section);
    const resolved = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
    ).singleNodeValue;

    expect(resolved).toBe(section);
  });

  it("creates rich targets from elements", () => {
    document.body.innerHTML = `
      <main>
        <section data-hrk-id="pricing-table" class="panel">
          <h2>Compare plans</h2>
          <p>Basic Pro Enterprise</p>
        </section>
      </main>
    `;
    const section = document.querySelector("section");
    if (!section) throw new Error("section missing");

    const target = createTargetFromElement(section);

    expect(target.anchorId).toBe("pricing-table");
    expect(target.cssSelector).toBe('[data-hrk-id="pricing-table"]');
    expect(target.xpath).toBeTruthy();
    expect(target.htmlSnippet).toContain("Compare plans");
    expect(target.elementFingerprint).toMatchObject({
      tagName: "section",
      classNames: ["panel"],
      headingContext: "Compare plans",
    });
  });

  it("resolves targets by data-hrk-id, text quote, selector, then XPath", () => {
    document.body.innerHTML = `
      <main>
        <section data-hrk-id="preferred"><p>Preferred anchor</p></section>
        <section class="quote"><p>Unique quote text</p></section>
        <section class="selector"><p>Selector target</p></section>
        <section class="xpath"><p>XPath target</p></section>
      </main>
    `;

    expect(resolveTarget(document, { anchorId: "preferred" })?.textContent).toContain(
      "Preferred anchor",
    );
    expect(resolveTarget(document, { textQuote: "Unique quote text" })?.className).toBe("quote");
    expect(resolveTarget(document, { cssSelector: ".selector" })?.textContent).toContain(
      "Selector target",
    );

    const xpathElement = document.querySelector(".xpath");
    if (!xpathElement) throw new Error("xpath element missing");
    expect(resolveTarget(document, { xpath: generateXPath(xpathElement) })).toBe(xpathElement);
  });
});
