import AnalyticsSummary from "@/components/dashboard/AnalyticsSummary";
import ChartsSection from "@/components/dashboard/ChartsSection";

export default function DashboardPage() {
  return (
    <div className="p-8 ">
      <AnalyticsSummary />
      <ChartsSection />
    </div>
  );
}
