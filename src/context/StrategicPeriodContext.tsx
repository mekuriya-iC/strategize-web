"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { StrategicPeriod } from "@/types/graphql";

interface StrategicPeriodState {
  period: StrategicPeriod | null;
  annualTimeline?: string; // e.g. "2025/26"
}

interface StrategicPeriodContextType {
  selected: StrategicPeriodState | null;
  setSelected: (val: StrategicPeriodState) => void;
}

const StrategicPeriodContext = createContext<
  StrategicPeriodContextType | undefined
>(undefined);

export function StrategicPeriodProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelectedState] = useState<StrategicPeriodState | null>(
    null
  );

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("selectedStrategicPeriod");
      if (stored) {
        const parsed = JSON.parse(stored);
        // If the stored object looks like a plain StrategicPeriod, wrap it
        if (parsed && parsed.strategicPeriodId) {
          setSelectedState({ period: parsed });
        } else {
          setSelectedState(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setSelected = (val: StrategicPeriodState) => {
    setSelectedState(val);
    sessionStorage.setItem("selectedStrategicPeriod", JSON.stringify(val));
  };

  return (
    <StrategicPeriodContext.Provider value={{ selected, setSelected }}>
      {children}
    </StrategicPeriodContext.Provider>
  );
}

export function useStrategicPeriod() {
  const ctx = useContext(StrategicPeriodContext);
  if (!ctx) throw new Error("useStrategicPeriod must be used within provider");
  return ctx;
}
