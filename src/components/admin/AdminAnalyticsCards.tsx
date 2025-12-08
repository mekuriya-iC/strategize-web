"use client";

import { Users, UserCheck, UserX } from "lucide-react";
import { Employee } from "@/types/graphql";

interface AdminAnalyticsCardsProps {
  admins: Employee[];
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  color: "purple" | "green" | "gray";
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    purple: {
      bg: "bg-white",
      iconBg: "bg-[#3838EC]/10",
      iconColor: "text-[#3838EC]",
      valueColor: "text-[#3838EC]",
    },
    green: {
      bg: "bg-white",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
    },
    gray: {
      bg: "bg-white",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      valueColor: "text-gray-600",
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`${classes.bg} rounded-2xl p-6 border border-gray-100 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${classes.iconBg}`}>
              <span className={classes.iconColor}>{icon}</span>
            </div>
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          <p className={`text-4xl font-bold ${classes.valueColor}`}>{value}</p>
          {trend !== undefined && (
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 text-[10px] flex items-center justify-center">
                ↑
              </span>
              {trend}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
          <div className="w-16 h-10 bg-gray-200 rounded mt-2" />
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsCards({
  admins,
  loading,
}: AdminAnalyticsCardsProps) {
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === "ACTIVE").length;
  const inactiveAdmins = admins.filter((a) => a.status !== "ACTIVE").length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="All Admins"
        value={totalAdmins}
        icon={<Users className="w-5 h-5" />}
        trend={12}
        color="purple"
      />
      <StatCard
        title="Active Admins"
        value={activeAdmins}
        icon={<UserCheck className="w-5 h-5" />}
        trend={8}
        color="green"
      />
      <StatCard
        title="Inactive Admins"
        value={inactiveAdmins}
        icon={<UserX className="w-5 h-5" />}
        color="gray"
      />
    </div>
  );
}
