/** Editing achievements must never move an entry to the dashboard's period. */
export function getLogbookPeriodFields(
  isEditing: boolean,
  selectedPeriodId?: string,
): { strategicPeriodId?: string } {
  return isEditing ? {} : { strategicPeriodId: selectedPeriodId };
}
