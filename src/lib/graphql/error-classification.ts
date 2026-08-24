const EXPECTED_BUSINESS_ERROR_PATTERNS = [
  "task time overlaps",
  "task start date must be before task end date",
  "weekly task pool may contain at most",
  "session is locked",
  "task type (tasklinktype) cannot be changed",
  "logbook achievement cannot be submitted or approved while",
  "valid quarterly plan is required before this logbook achievement",
];

export function isExpectedGraphqlBusinessError(message: string): boolean {
  const normalized = message.toLowerCase();
  return EXPECTED_BUSINESS_ERROR_PATTERNS.some((pattern) =>
    normalized.includes(pattern),
  );
}
