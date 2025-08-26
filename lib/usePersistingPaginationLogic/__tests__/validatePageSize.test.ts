import { describe, expect, it } from "vitest";
import { validatePageSize } from "../validatePageSize";

describe("validatePageSize", () => {
  describe("with default allowed values", () => {
    it("returns valid page size when value is in default allowed list", () => {
      expect(validatePageSize(10)).toBe(10);
      expect(validatePageSize(20)).toBe(20);
      expect(validatePageSize(50)).toBe(50);
    });

    it("returns first default value when value is not in allowed list", () => {
      expect(validatePageSize(15)).toBe(10);
      expect(validatePageSize(100)).toBe(10);
      expect(validatePageSize(1)).toBe(10);
    });

    it("returns first default value when value is not a number", () => {
      expect(validatePageSize("10")).toBe(10);
      expect(validatePageSize(null)).toBe(10);
      expect(validatePageSize(undefined)).toBe(10);
      expect(validatePageSize({})).toBe(10);
      expect(validatePageSize([])).toBe(10);
      expect(validatePageSize(true)).toBe(10);
    });
  });

  describe("with custom allowed values", () => {
    const customAllowed = [5, 15, 25, 100];

    it("returns valid page size when value is in custom allowed list", () => {
      expect(validatePageSize(5, customAllowed)).toBe(5);
      expect(validatePageSize(15, customAllowed)).toBe(15);
      expect(validatePageSize(25, customAllowed)).toBe(25);
      expect(validatePageSize(100, customAllowed)).toBe(100);
    });

    it("returns first custom value when value is not in allowed list", () => {
      expect(validatePageSize(10, customAllowed)).toBe(5);
      expect(validatePageSize(20, customAllowed)).toBe(5);
      expect(validatePageSize(50, customAllowed)).toBe(5);
      expect(validatePageSize(200, customAllowed)).toBe(5);
    });

    it("returns first custom value when value is not a number", () => {
      expect(validatePageSize("15", customAllowed)).toBe(5);
      expect(validatePageSize(null, customAllowed)).toBe(5);
      expect(validatePageSize(undefined, customAllowed)).toBe(5);
    });
  });

  describe("edge cases", () => {
    it("returns 10 when allowed sizes array is empty", () => {
      expect(validatePageSize(20, [])).toBe(10);
      expect(validatePageSize(50, [])).toBe(10);
    });

    it("handles single allowed value", () => {
      expect(validatePageSize(30, [30])).toBe(30);
      expect(validatePageSize(20, [30])).toBe(30);
    });

    it("handles negative numbers correctly", () => {
      expect(validatePageSize(-10, [5, 10, 20])).toBe(5);
      expect(validatePageSize(-5, [-5, 10, 20])).toBe(-5);
    });

    it("handles zero correctly", () => {
      expect(validatePageSize(0, [0, 10, 20])).toBe(0);
      expect(validatePageSize(0, [5, 10, 20])).toBe(5);
    });

    it("handles floating point numbers", () => {
      expect(validatePageSize(10.5, [10, 20, 50])).toBe(10);
      expect(validatePageSize(10.5, [10.5, 20, 50])).toBe(10.5);
    });
  });
});
