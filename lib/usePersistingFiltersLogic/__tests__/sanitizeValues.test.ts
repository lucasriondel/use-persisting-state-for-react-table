import { describe, expect, it } from "vitest";
import {
  sanitizeMultiSelectValue,
  sanitizeSelectValue,
  sanitizeTextValue,
  sanitizeNumberValue,
  sanitizeDateValue,
  sanitizeDateRangeValue,
  sanitizeNumberRangeValue,
  sanitizeValue,
} from "../sanitizeValues";

describe("sanitizeMultiSelectValue", () => {
  const basicConfig = {
    variant: "multiSelect" as const,
    options: [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
      { label: "Option 3", value: "opt3" },
    ],
  };

  it("filters array values to only allowed options", () => {
    const result = sanitizeMultiSelectValue(basicConfig, ["opt1", "opt3", "invalid"]);
    expect(result).toEqual(["opt1", "opt3"]);
  });

  it("converts single value to array if allowed", () => {
    const result = sanitizeMultiSelectValue(basicConfig, "opt1");
    expect(result).toEqual(["opt1"]);
  });

  it("converts number to string and validates", () => {
    const configWithNumbers = {
      variant: "multiSelect" as const,
      options: [
        { label: "One", value: 1 },
        { label: "Two", value: 2 },
      ],
    };
    const result = sanitizeMultiSelectValue(configWithNumbers, [1, 3]);
    expect(result).toEqual(["1"]);
  });

  it("converts boolean to string", () => {
    const configWithBooleans = {
      variant: "multiSelect" as const,
      options: [
        { label: "True", value: "true" },
        { label: "False", value: "false" },
      ],
    };
    const result = sanitizeMultiSelectValue(configWithBooleans, true);
    expect(result).toEqual(["true"]);
  });

  it("returns undefined for empty filtered array", () => {
    const result = sanitizeMultiSelectValue(basicConfig, ["invalid1", "invalid2"]);
    expect(result).toBeUndefined();
  });

  it("returns undefined for empty array input", () => {
    const result = sanitizeMultiSelectValue(basicConfig, []);
    expect(result).toBeUndefined();
  });

  it("handles config with no options", () => {
    const emptyConfig = { variant: "multiSelect" as const, options: [] };
    const result = sanitizeMultiSelectValue(emptyConfig, ["anything", "goes"]);
    expect(result).toEqual(["anything", "goes"]);
  });

  it("handles config with undefined options", () => {
    const undefinedConfig = { variant: "multiSelect" as const, options: undefined };
    const result = sanitizeMultiSelectValue(undefinedConfig, ["test"]);
    expect(result).toEqual(["test"]);
  });

  it("returns undefined for invalid input types", () => {
    expect(sanitizeMultiSelectValue(basicConfig, {})).toBeUndefined();
    expect(sanitizeMultiSelectValue(basicConfig, null)).toBeUndefined();
    expect(sanitizeMultiSelectValue(basicConfig, undefined)).toBeUndefined();
  });
});

describe("sanitizeSelectValue", () => {
  const basicConfig = {
    variant: "select" as const,
    options: [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
    ],
  };

  it("returns valid string value", () => {
    const result = sanitizeSelectValue(basicConfig, "opt1");
    expect(result).toBe("opt1");
  });

  it("converts number to string if valid", () => {
    const configWithNumbers = {
      variant: "select" as const,
      options: [{ label: "One", value: 1 }],
    };
    const result = sanitizeSelectValue(configWithNumbers, 1);
    expect(result).toBe("1");
  });

  it("converts boolean to string if valid", () => {
    const configWithBooleans = {
      variant: "select" as const,
      options: [{ label: "True", value: true }],
    };
    const result = sanitizeSelectValue(configWithBooleans, true);
    expect(result).toBe("true");
  });

  it("returns undefined for invalid options", () => {
    const result = sanitizeSelectValue(basicConfig, "invalid");
    expect(result).toBeUndefined();
  });

  it("returns undefined for array input", () => {
    const result = sanitizeSelectValue(basicConfig, ["opt1"]);
    expect(result).toBeUndefined();
  });

  it("handles config with no options", () => {
    const emptyConfig = { variant: "select" as const, options: [] };
    const result = sanitizeSelectValue(emptyConfig, "anything");
    expect(result).toBe("anything");
  });

  it("returns undefined for invalid input types", () => {
    expect(sanitizeSelectValue(basicConfig, {})).toBeUndefined();
    expect(sanitizeSelectValue(basicConfig, null)).toBeUndefined();
    expect(sanitizeSelectValue(basicConfig, undefined)).toBeUndefined();
  });
});

describe("sanitizeTextValue", () => {
  it("returns string values as-is", () => {
    expect(sanitizeTextValue("hello")).toBe("hello");
    expect(sanitizeTextValue("")).toBe("");
    expect(sanitizeTextValue("  spaces  ")).toBe("  spaces  ");
  });

  it("converts numbers to strings", () => {
    expect(sanitizeTextValue(42)).toBe("42");
    expect(sanitizeTextValue(0)).toBe("0");
    expect(sanitizeTextValue(-1.5)).toBe("-1.5");
  });

  it("converts booleans to strings", () => {
    expect(sanitizeTextValue(true)).toBe("true");
    expect(sanitizeTextValue(false)).toBe("false");
  });

  it("returns undefined for other types", () => {
    expect(sanitizeTextValue(null)).toBeUndefined();
    expect(sanitizeTextValue(undefined)).toBeUndefined();
    expect(sanitizeTextValue({})).toBeUndefined();
    expect(sanitizeTextValue([])).toBeUndefined();
    expect(sanitizeTextValue(new Date())).toBeUndefined();
  });
});

describe("sanitizeNumberValue", () => {
  it("returns valid numbers as-is", () => {
    expect(sanitizeNumberValue(42)).toBe(42);
    expect(sanitizeNumberValue(0)).toBe(0);
    expect(sanitizeNumberValue(-1.5)).toBe(-1.5);
  });

  it("converts valid string numbers", () => {
    expect(sanitizeNumberValue("42")).toBe(42);
    expect(sanitizeNumberValue("0")).toBe(0);
    expect(sanitizeNumberValue("-1.5")).toBe(-1.5);
    expect(sanitizeNumberValue("3.14")).toBe(3.14);
  });

  it("returns undefined for invalid numbers", () => {
    expect(sanitizeNumberValue(NaN)).toBeUndefined();
    expect(sanitizeNumberValue(Infinity)).toBeUndefined();
    expect(sanitizeNumberValue(-Infinity)).toBeUndefined();
  });

  it("returns undefined for invalid string numbers", () => {
    expect(sanitizeNumberValue("abc")).toBeUndefined();
    expect(sanitizeNumberValue("12abc")).toBeUndefined();
  });

  it("handles edge case string numbers", () => {
    expect(sanitizeNumberValue("")).toBe(0); // Number("") === 0
    expect(sanitizeNumberValue("  ")).toBe(0); // Number("  ") === 0
  });

  it("returns undefined for other types", () => {
    expect(sanitizeNumberValue(null)).toBeUndefined();
    expect(sanitizeNumberValue(undefined)).toBeUndefined();
    expect(sanitizeNumberValue(true)).toBeUndefined();
    expect(sanitizeNumberValue({})).toBeUndefined();
    expect(sanitizeNumberValue([])).toBeUndefined();
  });
});

describe("sanitizeDateValue", () => {
  const basicConfig = { variant: "date" as const };
  const configWithBounds = {
    variant: "date" as const,
    fromDate: new Date("2020-01-01"),
    toDate: new Date("2025-12-31"),
  };

  it("returns valid Date objects as-is", () => {
    const date = new Date("2022-06-15");
    const result = sanitizeDateValue(basicConfig, date);
    expect(result).toBe(date);
  });

  it("returns null for explicit null input", () => {
    const result = sanitizeDateValue(basicConfig, null);
    expect(result).toBe(null);
  });

  it("converts valid date strings", () => {
    const result = sanitizeDateValue(basicConfig, "2022-06-15");
    expect(result).toEqual(new Date("2022-06-15"));
  });

  it("converts valid timestamps", () => {
    const timestamp = Date.now();
    const result = sanitizeDateValue(basicConfig, timestamp);
    expect(result).toEqual(new Date(timestamp));
  });

  it("clamps dates to minimum bound", () => {
    const result = sanitizeDateValue(configWithBounds, "2019-01-01");
    expect(result).toEqual(new Date("2020-01-01"));
  });

  it("clamps dates to maximum bound", () => {
    const result = sanitizeDateValue(configWithBounds, "2026-01-01");
    expect(result).toEqual(new Date("2025-12-31"));
  });

  it("returns undefined for invalid dates", () => {
    expect(sanitizeDateValue(basicConfig, "invalid-date")).toBeUndefined();
    expect(sanitizeDateValue(basicConfig, "")).toBeUndefined();
    expect(sanitizeDateValue(basicConfig, NaN)).toBeUndefined();
  });

  it("returns undefined for other types", () => {
    expect(sanitizeDateValue(basicConfig, {})).toBeUndefined();
    expect(sanitizeDateValue(basicConfig, [])).toBeUndefined();
    expect(sanitizeDateValue(basicConfig, true)).toBeUndefined();
  });
});

describe("sanitizeDateRangeValue", () => {
  const basicConfig = { variant: "dateRange" as const };
  const configWithBounds = {
    variant: "dateRange" as const,
    fromDate: new Date("2020-01-01"),
    toDate: new Date("2025-12-31"),
  };

  it("handles array format [start, end]", () => {
    const start = new Date("2022-01-01");
    const end = new Date("2022-12-31");
    const result = sanitizeDateRangeValue(basicConfig, [start, end]);
    expect(result).toEqual([start, end]);
  });

  it("handles object format {from, to}", () => {
    const start = new Date("2022-01-01");
    const end = new Date("2022-12-31");
    const result = sanitizeDateRangeValue(basicConfig, { from: start, to: end });
    expect(result).toEqual([start, end]);
  });

  it("handles mixed null values", () => {
    const date = new Date("2022-06-15");
    expect(sanitizeDateRangeValue(basicConfig, [null, date])).toEqual([null, date]);
    expect(sanitizeDateRangeValue(basicConfig, [date, null])).toEqual([date, null]);
  });

  it("returns undefined for both null values", () => {
    const result = sanitizeDateRangeValue(basicConfig, [null, null]);
    expect(result).toBeUndefined();
  });

  it("swaps dates if start > end", () => {
    const start = new Date("2022-12-31");
    const end = new Date("2022-01-01");
    const result = sanitizeDateRangeValue(basicConfig, [start, end]);
    expect(result).toEqual([end, start]);
  });

  it("clamps dates to bounds", () => {
    const result = sanitizeDateRangeValue(configWithBounds, [
      new Date("2019-01-01"),
      new Date("2026-01-01")
    ]);
    expect(result).toEqual([
      new Date("2020-01-01"),
      new Date("2025-12-31")
    ]);
  });

  it("converts string dates", () => {
    const result = sanitizeDateRangeValue(basicConfig, ["2022-01-01", "2022-12-31"]);
    expect(result).toEqual([new Date("2022-01-01"), new Date("2022-12-31")]);
  });

  it("returns undefined for invalid input", () => {
    expect(sanitizeDateRangeValue(basicConfig, "not-array")).toBeUndefined();
    expect(sanitizeDateRangeValue(basicConfig, [])).toBeUndefined();
    expect(sanitizeDateRangeValue(basicConfig, [1, 2, 3])).toBeUndefined();
    expect(sanitizeDateRangeValue(basicConfig, {})).toBeUndefined();
  });

  it("handles invalid dates in range", () => {
    const result = sanitizeDateRangeValue(basicConfig, ["invalid", "2022-01-01"]);
    expect(result).toEqual([null, new Date("2022-01-01")]);
  });
});

describe("sanitizeNumberRangeValue", () => {
  const basicConfig = { variant: "numberRange" as const };
  const configWithBounds = {
    variant: "numberRange" as const,
    min: 0,
    max: 100,
  };

  it("returns valid number ranges", () => {
    const result = sanitizeNumberRangeValue(basicConfig, [10, 20]);
    expect(result).toEqual([10, 20]);
  });

  it("swaps numbers if first > second", () => {
    const result = sanitizeNumberRangeValue(basicConfig, [20, 10]);
    expect(result).toEqual([10, 20]);
  });

  it("converts string numbers", () => {
    const result = sanitizeNumberRangeValue(basicConfig, ["10", "20"]);
    expect(result).toEqual([10, 20]);
  });

  it("clamps to minimum bound", () => {
    const result = sanitizeNumberRangeValue(configWithBounds, [-10, 50]);
    expect(result).toEqual([0, 50]);
  });

  it("clamps to maximum bound", () => {
    const result = sanitizeNumberRangeValue(configWithBounds, [50, 150]);
    expect(result).toEqual([50, 100]);
  });

  it("clamps both values when out of bounds", () => {
    const result = sanitizeNumberRangeValue(configWithBounds, [-10, 150]);
    expect(result).toEqual([0, 100]);
  });

  it("returns undefined for invalid input", () => {
    expect(sanitizeNumberRangeValue(basicConfig, "not-array")).toBeUndefined();
    expect(sanitizeNumberRangeValue(basicConfig, [])).toBeUndefined();
    expect(sanitizeNumberRangeValue(basicConfig, [1, 2, 3])).toBeUndefined();
    expect(sanitizeNumberRangeValue(basicConfig, [1])).toBeUndefined();
  });

  it("returns undefined for invalid numbers", () => {
    expect(sanitizeNumberRangeValue(basicConfig, [NaN, 10])).toBeUndefined();
    expect(sanitizeNumberRangeValue(basicConfig, [10, Infinity])).toBeUndefined();
    expect(sanitizeNumberRangeValue(basicConfig, ["abc", "def"])).toBeUndefined();
  });
});

describe("sanitizeValue", () => {
  it("delegates to correct sanitizer for multiSelect", () => {
    const filterMeta = {
      variant: "multiSelect" as const,
      options: [{ label: "Test", value: "test" }],
    };
    const result = sanitizeValue(filterMeta, ["test"]);
    expect(result).toEqual(["test"]);
  });

  it("delegates to correct sanitizer for select", () => {
    const filterMeta = {
      variant: "select" as const,
      options: [{ label: "Test", value: "test" }],
    };
    const result = sanitizeValue(filterMeta, "test");
    expect(result).toBe("test");
  });

  it("delegates to correct sanitizer for text", () => {
    const filterMeta = { variant: "text" as const };
    const result = sanitizeValue(filterMeta, "hello");
    expect(result).toBe("hello");
  });

  it("delegates to correct sanitizer for number", () => {
    const filterMeta = { variant: "number" as const };
    const result = sanitizeValue(filterMeta, "42");
    expect(result).toBe(42);
  });

  it("delegates to correct sanitizer for date", () => {
    const filterMeta = { variant: "date" as const };
    const date = new Date("2022-01-01");
    const result = sanitizeValue(filterMeta, date);
    expect(result).toBe(date);
  });

  it("delegates to correct sanitizer for dateRange", () => {
    const filterMeta = { variant: "dateRange" as const };
    const range = [new Date("2022-01-01"), new Date("2022-12-31")];
    const result = sanitizeValue(filterMeta, range);
    expect(result).toEqual(range);
  });

  it("delegates to correct sanitizer for numberRange", () => {
    const filterMeta = { variant: "numberRange" as const };
    const result = sanitizeValue(filterMeta, [10, 20]);
    expect(result).toEqual([10, 20]);
  });

  it("returns value as-is for unknown variants", () => {
    const filterMeta = { variant: "unknown" as any };
    const value = { custom: "data" };
    const result = sanitizeValue(filterMeta, value);
    expect(result).toBe(value);
  });

  it("handles undefined variant", () => {
    const filterMeta = {} as any;
    const value = "test";
    const result = sanitizeValue(filterMeta, value);
    expect(result).toBe(value);
  });
});