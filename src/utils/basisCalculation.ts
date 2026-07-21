import type {
  DirectBasisTargetInput,
  KpiCalculationBasisSource,
  KpiUnitType,
} from "@/types/graphql";

export interface BasisQuarterValues {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export const EMPTY_BASIS_QUARTERS: BasisQuarterValues = {
  q1: "",
  q2: "",
  q3: "",
  q4: "",
};

export const isRateLikeUnit = (unitType?: string | null): boolean =>
  unitType === "PERCENT" || unitType === "RATIO";

export const isBasisDriven = (
  source?: KpiCalculationBasisSource | null,
): boolean => source === "DIRECT_VALUE" || source === "LINKED_KPI";

export const getRateMultiplier = (unitType: KpiUnitType): 100 | 1 =>
  unitType === "PERCENT" ? 100 : 1;

const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/;

function decimalParts(value: string): { digits: bigint; precision: number } | null {
  const normalized = value.replace(/,/g, "").trim();
  if (!DECIMAL_PATTERN.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  return {
    digits: BigInt(`${whole}${fraction}`),
    precision: fraction.length,
  };
}

function scaledValue(value: string, precision: number): bigint | null {
  const parts = decimalParts(value);
  if (!parts) return null;
  return parts.digits * BigInt(10) ** BigInt(precision - parts.precision);
}

function formatScaled(value: bigint, precision: number): string {
  if (precision === 0) return value.toString();
  const padded = value.toString().padStart(precision + 1, "0");
  const whole = padded.slice(0, -precision);
  const fraction = padded.slice(-precision).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function splitBasisEvenly(annualBasis: string): BasisQuarterValues {
  const parts = decimalParts(annualBasis);
  if (!parts) return { ...EMPTY_BASIS_QUARTERS };

  // Two additional decimal places guarantee that any base-10 amount can be
  // divided by four and still reconcile exactly to the original string value.
  const precision = parts.precision + 2;
  const annualScaled = parts.digits * BigInt(100);
  const equalShare = annualScaled / BigInt(4);
  const finalShare = annualScaled - equalShare * BigInt(3);

  return {
    q1: formatScaled(equalShare, precision),
    q2: formatScaled(equalShare, precision),
    q3: formatScaled(equalShare, precision),
    q4: formatScaled(finalShare, precision),
  };
}

export function decimalValuesEqualTotal(
  total: string,
  values: string[],
): boolean {
  const parsed = [total, ...values].map(decimalParts);
  if (parsed.some((value) => value === null)) return false;

  const precision = Math.max(...parsed.map((value) => value!.precision));
  const expected = scaledValue(total, precision);
  const actual = values
    .map((value) => scaledValue(value, precision))
    .reduce<bigint | null>(
      (sum, value) => (sum === null || value === null ? null : sum + value),
      BigInt(0),
    );
  return expected !== null && actual !== null && expected === actual;
}

export function basisQuartersEqualAnnual(
  annualBasis: string,
  quarters: BasisQuarterValues,
): boolean {
  return decimalValuesEqualTotal(annualBasis, [
    quarters.q1,
    quarters.q2,
    quarters.q3,
    quarters.q4,
  ]);
}

export function multiplyBasisByPercent(
  basis: string,
  percent: string | number,
): string | null {
  const basisParts = decimalParts(basis);
  const percentParts = decimalParts(String(percent));
  if (!basisParts || !percentParts) return null;
  return formatScaled(
    basisParts.digits * percentParts.digits,
    basisParts.precision + percentParts.precision + 2,
  );
}

export function splitBasisAmong(annualBasis: string, count: number): string[] {
  const parts = decimalParts(annualBasis);
  if (!parts || count <= 0) return [];
  const extraPrecision = Math.max(2, String(count).length + 1);
  const precision = parts.precision + extraPrecision;
  const scaledAnnual = parts.digits * BigInt(10) ** BigInt(extraPrecision);
  const divisor = BigInt(count);
  const share = scaledAnnual / divisor;
  return Array.from({ length: count }, (_, index) =>
    formatScaled(
      index === count - 1 ? scaledAnnual - share * BigInt(count - 1) : share,
      precision,
    ),
  );
}

export function calculateRequiredNumerator(
  target: string | number,
  basis: string | number,
  unitType: KpiUnitType,
): number | null {
  const targetNumber = Number(target);
  const basisNumber = Number(basis);
  if (!Number.isFinite(targetNumber) || !Number.isFinite(basisNumber)) return null;
  
  // For RATIO: target is entered as a decimal (e.g., 0.333 for 1:3 or 3 for 3:1)
  // For PERCENT: divide by 100 to convert percentage to decimal
  return (targetNumber * basisNumber) / getRateMultiplier(unitType);
}

export function formatBasisNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function buildDirectBasisTargets(
  timeline: string,
  quarters: BasisQuarterValues,
): DirectBasisTargetInput[] {
  return (["q1", "q2", "q3", "q4"] as const).map((quarter, index) => ({
    timeline: `${timeline}-Q${index + 1}`,
    value: quarters[quarter],
  }));
}

export function directBasisTargetsToQuarters(
  targets?: Array<{ timeline: string; value: string }> | null,
): BasisQuarterValues {
  const quarters = { ...EMPTY_BASIS_QUARTERS };
  targets?.forEach((target) => {
    const match = target.timeline.match(/-Q([1-4])$/i);
    if (match) quarters[`q${match[1]}` as keyof BasisQuarterValues] = target.value;
  });
  return quarters;
}
