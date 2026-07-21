"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

export function normalizeFormattedNumberInput(value: string): string | null {
  const normalized = value.replace(/,/g, "").trim();

  if (normalized === "") return "";
  if (!/^-?(?:\d+\.?\d*|\.\d*)$/.test(normalized)) return null;

  return normalized;
}

export function formatNumberInputValue(value: string | number): string {
  const rawValue = String(value);
  if (!rawValue) return "";

  const [integerPart, ...fractionParts] = rawValue.split(".");
  const fractionPart = fractionParts.join("");
  const sign = integerPart.startsWith("-") ? "-" : "";
  const unsignedInteger = sign ? integerPart.slice(1) : integerPart;
  const groupedInteger = unsignedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formattedInteger = `${sign}${groupedInteger}`;

  return rawValue.includes(".")
    ? `${formattedInteger}.${fractionPart}`
    : formattedInteger;
}

interface FormattedNumberInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> {
  value: string | number;
  onValueChange: (value: string) => void;
  currency?: boolean;
}

export function FormattedNumberInput({
  value,
  onValueChange,
  currency = false,
  ...props
}: FormattedNumberInputProps) {
  if (!currency) {
    return (
      <Input
        {...props}
        type="number"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    );
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatNumberInputValue(value)}
      onChange={(event) => {
        const normalized = normalizeFormattedNumberInput(event.target.value);
        if (normalized !== null) onValueChange(normalized);
      }}
    />
  );
}
