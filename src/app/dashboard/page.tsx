import AnalyticsSummary from "@/components/dashboard/AnalyticsSummary";
import ChartsSection from "@/components/dashboard/ChartsSection";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <AnalyticsSummary />
      <ChartsSection />
    </div>
  );
}
