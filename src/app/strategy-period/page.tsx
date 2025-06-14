"use client";
import Logo from "@/components/Logo";
import StrategyPeriodGrid from "@/components/strategy-period/StrategyPeriodGrid";
import NewStrategyButton from "@/components/strategy-period/NewStrategyButton";

export default function StrategyPeriodPage() {
  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center">
      <div className="w-full flex items-center mb-24">
        <Logo />
      </div>
      <div className="w-full max-w-6xl mx-auto">
        {/* Logo at the top left */}

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Choose Strategy Period
        </h1>
        <StrategyPeriodGrid />
        <div className="flex justify-center mt-10">
          <NewStrategyButton />
        </div>
      </div>
    </div>
  );
}
