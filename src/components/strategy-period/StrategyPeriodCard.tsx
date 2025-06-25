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
      className={`bg-white border border-[#E2E8F0] rounded-xl shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col items-center p-8 transition-all gap-2 ${
        selected ? "ring-2 ring-[#3838EC]" : ""
      }`}
    >
      <div className="mb-5 text-5xl">{icon}</div>
      <div className="font-semibold text-lg  text-primary">{title}</div>
      <div className="text-sm text-[#09090B] mb-8">{date}</div>
      <Button
        onClick={onClick}
        className="w-full bg-primary cursor-pointer text-white"
      >
        Choose
      </Button>
    </Card>
  );
}
