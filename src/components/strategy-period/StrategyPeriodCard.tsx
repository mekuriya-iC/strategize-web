"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface StrategyPeriodCardProps {
  icon: ReactNode;
  title: string;
  date: string;
  onClick?: () => void;
  selected?: boolean;
}

export default function StrategyPeriodCard({
  icon,
  title,
  date,
  onClick,
  selected = false,
}: StrategyPeriodCardProps) {
  return (
    <Card
      className={`bg-white border border-[#E2E8F0] rounded-xl shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col items-center p-8 transition-all ${
        selected ? "ring-2 ring-[#3838EC]" : ""
      }`}
    >
      <div className="mb-4 text-5xl">{icon}</div>
      <div className="font-semibold text-lg mb-1">{title}</div>
      <div className="text-sm text-gray-500 mb-6">{date}</div>
      <Button
        onClick={onClick}
        className="w-full bg-[#3838EC] hover:bg-[#2e2ed6] text-white"
      >
        Choose
      </Button>
    </Card>
  );
}
