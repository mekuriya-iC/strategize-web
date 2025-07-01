import React from "react";

interface ObjectiveDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ObjectiveDetailPage({
  params,
}: ObjectiveDetailPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6 px-2 md:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-4xl text-[#3F3F46] font-bold tracking-tight">
          Objective Details
        </h1>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">
          Viewing objective with ID: <span className="font-mono">{id}</span>
        </p>
        <p className="text-gray-500 mt-2">
          This page is under development. Objective details will be implemented
          here.
        </p>
      </div>
    </div>
  );
}
