import StrategyPeriodCard from "./StrategyPeriodCard";
import { Wrench, BadgeCheck, Crown } from "lucide-react";

const periods = [
  {
    icon: <Wrench size={48} strokeWidth={1.5} />,
    title: "Past",
    date: "July 2023 - 2026",
  },
  {
    icon: <BadgeCheck size={48} strokeWidth={1.5} />,
    title: "Current",
    date: "July 2023 - 2026",
  },
  {
    icon: <Crown size={48} strokeWidth={1.5} />,
    title: "Future",
    date: "July 2023 - 2026",
  },
];

export default function StrategyPeriodGrid() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-4xl mx-auto">
        {periods.map((period, idx) => (
          <StrategyPeriodCard
            key={period.title}
            icon={period.icon}
            title={period.title}
            date={period.date}
            onClick={() => alert(`Selected: ${period.title}`)}
          />
        ))}
      </div>
    </div>
  );
}
