// @vitest-environment jsdom
/**
 * Accordion — plain useState expand/collapse list (no Radix Accordion
 * primitive exists in this project), used by /privacy's rights and FAQ
 * sections.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Accordion } from "@/components/marketing/accordion";

const ITEMS = [
  { question: "Question one", answer: "Answer one" },
  { question: "Question two", answer: "Answer two" },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render() {
  act(() => {
    root.render(React.createElement(Accordion, { items: ITEMS }));
  });
}

function questionButton(text: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLButtonElement;
}

describe("Accordion", () => {
  it("renders every question, collapsed by default", () => {
    render();
    expect(container.textContent).toContain("Question one");
    expect(container.textContent).toContain("Question two");
    expect(questionButton("Question one").getAttribute("aria-expanded")).toBe("false");
  });

  it("clicking a question expands it and shows its answer", () => {
    render();
    act(() => questionButton("Question one").click());
    expect(questionButton("Question one").getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking an open question again collapses it", () => {
    render();
    act(() => questionButton("Question one").click());
    act(() => questionButton("Question one").click());
    expect(questionButton("Question one").getAttribute("aria-expanded")).toBe("false");
  });

  it("opening a second item closes the first (single-open accordion)", () => {
    render();
    act(() => questionButton("Question one").click());
    act(() => questionButton("Question two").click());
    expect(questionButton("Question one").getAttribute("aria-expanded")).toBe("false");
    expect(questionButton("Question two").getAttribute("aria-expanded")).toBe("true");
  });
});
