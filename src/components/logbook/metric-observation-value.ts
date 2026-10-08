/**
 * Convert a user-facing exact decimal into the canonical value sent to the API.
 * Thousands separators are accepted only in valid groups so a typo such as
 * `12,34` cannot silently become a different number.
 */
export function normalizeMetricObservationValue(value: string): string | null {
  const input = value.trim().replace(/^\+/, "");
  const plainDecimal = /^-?\d+(?:\.\d+)?$/;
  const groupedDecimal = /^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;

  if (!plainDecimal.test(input) && !groupedDecimal.test(input)) return null;
  return input.replace(/,/g, "");
}
