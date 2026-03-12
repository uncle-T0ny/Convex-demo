import { describe, expect, test } from "vitest";
import { extractCompleteSentences } from "../../lib/extractCompleteSentences";

describe("extractCompleteSentences", () => {
  test("extracts sentences ending with period", () => {
    const result = extractCompleteSentences("Hello world. How are you. ");
    expect(result.sentences).toEqual(["Hello world. ", "How are you. "]);
    expect(result.remainder).toBe("");
  });

  test("returns remainder for incomplete sentence", () => {
    const result = extractCompleteSentences("Hello world. How are");
    expect(result.sentences).toEqual(["Hello world. "]);
    expect(result.remainder).toBe("How are");
  });

  test("handles exclamation and question marks", () => {
    const result = extractCompleteSentences("Wow! Really? Yes.");
    expect(result.sentences).toEqual(["Wow! ", "Really? ", "Yes."]);
    expect(result.remainder).toBe("");
  });

  test("returns empty sentences for text without terminators", () => {
    const result = extractCompleteSentences("no punctuation here");
    expect(result.sentences).toEqual([]);
    expect(result.remainder).toBe("no punctuation here");
  });

  test("handles empty string", () => {
    const result = extractCompleteSentences("");
    expect(result.sentences).toEqual([]);
    expect(result.remainder).toBe("");
  });

  test("handles multiple terminators", () => {
    const result = extractCompleteSentences("Wait... What?! ");
    expect(result.sentences).toEqual(["Wait... ", "What?! "]);
    expect(result.remainder).toBe("");
  });
});
