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
    expect(resolveTarget(document, { textQuote: "Unique quote text" })?.textContent).toBe(
      "Unique quote text",
    );
    expect(resolveTarget(document, { cssSelector: ".selector" })?.textContent).toContain(
      "Selector target",
    );

    const xpathElement = document.querySelector(".xpath");
    if (!xpathElement) throw new Error("xpath element missing");
    expect(resolveTarget(document, { xpath: generateXPath(xpathElement) })).toBe(xpathElement);
  });

  it("resolves escaped data-hrk-id values before other locators", () => {
    document.body.innerHTML = `
      <main>
        <section data-hrk-id='plan "pro" \\ yearly'><p>Anchor target</p></section>
        <section class="quote"><p>Shared fallback text</p></section>
        <section class="selector"><p>Selector fallback</p></section>
        <section class="xpath"><p>XPath fallback</p></section>
        <section class="context"><p>Before context After context</p></section>
        <section class="snippet"><p>Snippet fallback</p></section>
      </main>
    `;

    const xpathElement = document.querySelector(".xpath");
    if (!xpathElement) throw new Error("xpath element missing");

    expect(
      resolveTarget(document, {
        anchorId: 'plan "pro" \\ yearly',
        textQuote: "Shared fallback text",
        cssSelector: ".selector",
        xpath: generateXPath(xpathElement),
        beforeText: "Before context",
        afterText: "After context",
        htmlSnippet: "<p>Snippet fallback</p>",
      })?.textContent,
    ).toContain("Anchor target");
  });

  it("resolves escaped element id fallback when data-hrk-id is absent", () => {
    document.body.innerHTML = `
      <main>
        <section id="plan.pro:2026"><p>ID fallback target</p></section>
      </main>
    `;

    expect(resolveTarget(document, { anchorId: "plan.pro:2026" })?.textContent).toContain(
      "ID fallback target",
    );
  });

  it("prefers the most specific element for nested text matches", () => {
    document.body.innerHTML = `
      <main>
        <section class="broad">
          <p class="middle">Intro <strong>Nested unique phrase</strong></p>
        </section>
      </main>
    `;

    expect(resolveTarget(document, { textQuote: "Nested unique phrase" })?.tagName).toBe(
      "STRONG",
    );
  });
});
