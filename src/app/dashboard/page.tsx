import AnalyticsSummary from "@/components/dashboard/AnalyticsSummary";
import ChartsSection from "@/components/dashboard/ChartsSection";
import AdvancedKPIDashboard from "@/components/dashboard/AdvancedKPIDashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
       <AnalyticsSummary />
      <AdvancedKPIDashboard />
      <ChartsSection />
    </div>
  );
}
