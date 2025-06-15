import AnalyticsCard from "./AnalyticsCard";
import { Button } from "@/components/ui/button";
import {
  Target,
  BarChart2,
  Flag,
  Building2,
  Users,
  User,
  Filter,
} from "lucide-react";

const analyticsData = [
  {
    title: "Objectives",
    value: 67,
    change: "-2.1%",
    isPositive: false,
    icon: <Target size={20} />,
  },
  {
    title: "KPIs",
    value: 209,
    change: "+2.3%",
    isPositive: true,
    icon: <BarChart2 size={20} />,
  },
  {
    title: "Initiatives",
    value: 67,
    change: "-2.1%",
    isPositive: false,
    icon: <Flag size={20} />,
  },
  {
    title: "Divisions",
    value: 89,
    change: "-2.1%",
    isPositive: false,
    icon: <Building2 size={20} />,
  },
  {
    title: "Departments",
    value: 43,
    change: "+2.3%",
    isPositive: true,
    icon: <Building2 size={20} />,
  },
  {
    title: "Individuals",
    value: 67,
    change: "-2.1%",
    isPositive: false,
    icon: <Users size={20} />,
  },
];

export default function AnalyticsSummary() {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Analytics</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {analyticsData.map((item) => (
          <AnalyticsCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}
