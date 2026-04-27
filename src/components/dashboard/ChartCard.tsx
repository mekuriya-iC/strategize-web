import { Card } from "@/components/ui/card";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { ReactNode } from "react";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

interface ChartCardProps {
  title: string;
  chartType: "doughnut" | "bar";
  data: {
    labels?: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      [key: string]: unknown;
    }>;
  };
  legend?: ReactNode;
}

export default function ChartCard({
  title,
  chartType,
  data,
  legend,
}: ChartCardProps) {
  return (
    <Card className="p-3 rounded-xl border border-[#E2E8F0] dark:border-gray-800 shadow-[0_3.6px_90px_4.5px_rgba(0,0,0,0.07)] flex flex-col gap-3 min-w-[180px] min-h-[160px] bg-white dark:bg-[#18181b]">
      <div className="font-semibold text-base mb-1 text-gray-900 dark:text-gray-100">
        {title}
      </div>
      <div className="flex-1 flex items-center justify-center h-28">
        {chartType === "doughnut" ? (
          <Doughnut
            data={data}
            options={{
              plugins: { legend: { display: false } },
              maintainAspectRatio: false,
            }}
          />
        ) : (
          <Bar
            data={data}
            options={{
              plugins: { legend: { display: false } },
              maintainAspectRatio: false,
            }}
          />
        )}
      </div>
      {legend && <div className="mt-2">{legend}</div>}
    </Card>
  );
}
