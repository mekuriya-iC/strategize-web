"use client";
import ChartCard from "./ChartCard";

const donutData = {
  labels: [
    "Meal during trip",
    "Lodging",
    "Fuel",
    "Daily Allowance",
    "Car Rental",
    "Entertainment",
    "Office expenses",
  ],
  datasets: [
    {
      data: [120, 90, 70, 60, 50, 40, 30],
      backgroundColor: [
        "#3838EC",
        "#726BEA",
        "#5B5BFF",
        "#A3A3FF",
        "#C7C7FF",
        "#E0E0FF",
        "#F4F4FF",
      ],
      borderWidth: 0,
    },
  ],
};

const barData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [
    {
      label: "KPIs",
      data: [400, 300, 200, 278, 189],
      backgroundColor: "#3838EC",
      borderRadius: 8,
    },
  ],
};

export default function ChartsSection() {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-6">Charts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartCard title="KPIs Over Time" chartType="bar" data={barData} />
        <ChartCard
          title="KPIs by Category"
          chartType="doughnut"
          data={donutData}
        />
      </div>
    </section>
  );
}
