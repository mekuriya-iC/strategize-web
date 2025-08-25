"use client";
import Logo from "@/components/Logo";
import StrategyPeriodGrid from "@/components/strategy-period/StrategyPeriodGrid";
import NewStrategyButton from "@/components/strategy-period/NewStrategyButton";
import { StrategicPeriodProvider } from "@/context/StrategicPeriodContext";
import { UserProvider } from "@/context/UserContext";
import { useUser } from "@/context/UserContext";

function StrategyPeriodContent() {
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <StrategicPeriodProvider>
      <div className="min-h-screen bg-white p-4 flex flex-col items-center">
        <div className="w-full flex items-center mb-24">
          <Logo />
        </div>
        <div className="w-full max-w-6xl mx-auto">
          {/* Logo at the top left */}

          <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#11181C]">
            Choose Strategy Period
          </h1>
          <StrategyPeriodGrid />
          {isAdmin && (
            <div className="flex justify-center mt-24">
              <NewStrategyButton />
            </div>
          )}
        </div>
      </div>
    </StrategicPeriodProvider>
  );
}

export default function StrategyPeriodPage() {
  return (
    <UserProvider>
      <StrategyPeriodContent />
    </UserProvider>
  );
}
