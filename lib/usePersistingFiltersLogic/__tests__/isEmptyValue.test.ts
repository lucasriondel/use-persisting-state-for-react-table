import { describe, expect, it } from "vitest";
import { isEmptyValue } from "../isEmptyValue";

describe("isEmptyValue", () => {
  describe("returns true for empty values", () => {
    it("returns true for undefined", () => {
      expect(isEmptyValue(undefined)).toBe(true);
    });

    it("returns true for null", () => {
      expect(isEmptyValue(null)).toBe(true);
    });

    it("returns true for empty string", () => {
      expect(isEmptyValue("")).toBe(true);
    });

    it("returns true for empty array", () => {
      expect(isEmptyValue([])).toBe(true);
    });
  });

  describe("returns false for non-empty values", () => {
    it("returns false for non-empty string", () => {
      expect(isEmptyValue("hello")).toBe(false);
    });

    it("returns false for whitespace string", () => {
      expect(isEmptyValue(" ")).toBe(false);
    });

    it("returns false for string with only spaces", () => {
      expect(isEmptyValue("   ")).toBe(false);
    });

    it("returns false for non-empty array", () => {
      expect(isEmptyValue(["item"])).toBe(false);
    });

    it("returns false for array with empty string", () => {
      expect(isEmptyValue([""])).toBe(false);
    });

    it("returns false for array with null", () => {
      expect(isEmptyValue([null])).toBe(false);
    });

    it("returns false for zero", () => {
      expect(isEmptyValue(0)).toBe(false);
    });

    it("returns false for negative numbers", () => {
      expect(isEmptyValue(-1)).toBe(false);
    });

    it("returns false for positive numbers", () => {
      expect(isEmptyValue(42)).toBe(false);
    });

    it("returns false for boolean false", () => {
      expect(isEmptyValue(false)).toBe(false);
    });

    it("returns false for boolean true", () => {
      expect(isEmptyValue(true)).toBe(false);
    });

    it("returns false for objects", () => {
      expect(isEmptyValue({})).toBe(false);
    });

    it("returns false for non-empty objects", () => {
      expect(isEmptyValue({ key: "value" })).toBe(false);
    });

    it("returns false for dates", () => {
      expect(isEmptyValue(new Date())).toBe(false);
    });

    it("returns false for functions", () => {
      expect(isEmptyValue(() => {})).toBe(false);
    });

    it("returns false for symbols", () => {
      expect(isEmptyValue(Symbol("test"))).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles NaN", () => {
      expect(isEmptyValue(NaN)).toBe(false);
    });

    it("handles Infinity", () => {
      expect(isEmptyValue(Infinity)).toBe(false);
    });

    it("handles -Infinity", () => {
      expect(isEmptyValue(-Infinity)).toBe(false);
    });

    it("handles nested arrays", () => {
      expect(isEmptyValue([[], []])).toBe(false);
    });

    it("handles array-like objects", () => {
      expect(isEmptyValue({ length: 0 })).toBe(false);
    });

    it("handles string-like objects", () => {
      expect(isEmptyValue({ toString: () => "" })).toBe(false);
    });
  });
});