import AnalyticsSummary from "@/components/dashboard/AnalyticsSummary";
import ChartsSection from "@/components/dashboard/ChartsSection";

export default function DashboardPage() {
  return (
    <div className="p-8 overflow-y-auto ">
      <AnalyticsSummary />
      <ChartsSection />
    </div>
  );
}
