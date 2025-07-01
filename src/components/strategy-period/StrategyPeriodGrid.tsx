import StrategyPeriodCard from "./StrategyPeriodCard";
import { Wrench, BadgeCheck, Crown } from "lucide-react";
import starIcon from "@/public/images/choose-strategy/stars.png";

import Image from "next/image";

const periods = [
  {
    icon: (
      <Image
        src="/images/choose-strategy/stars.png"
        alt="star"
        width={48}
        height={48}
      />
    ),
    title: "Past",
    date: "July 2023 - 2026",
  },
  {
    icon: (
      <Image
        src="/images/choose-strategy/award.png"
        alt="crown"
        width={48}
        height={48}
      />
    ),
    title: "Current",
    date: "July 2023 - 2026",
  },
  {
    icon: (
      <Image
        src="/images/choose-strategy/crown.png"
        alt="star"
        width={48}
        height={48}
      />
    ),
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
