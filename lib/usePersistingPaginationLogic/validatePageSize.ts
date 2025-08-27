/**
 * Validates if a page size value is allowed and returns a valid page size.
 * If the value is not in the allowed list, returns the first allowed value.
 *
 * @param value The page size value to validate
 * @param allowedPageSizes Array of allowed page size values
 * @returns A valid page size from the allowed list
 */
export function validatePageSize(
  value: unknown,
  allowedPageSizes: number[] = [10, 20, 50]
): number {
  // Default to first allowed value if allowedPageSizes is empty
  if (allowedPageSizes.length === 0) {
    return 10;
  }

  // Check if value is a valid number and in the allowed list
  if (typeof value === "number" && allowedPageSizes.includes(value)) {
    return value;
  }

  // Fallback to first allowed value
  return allowedPageSizes[0]!;
}
