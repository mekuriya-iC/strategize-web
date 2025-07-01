// components/dashboard/ProgressSteps.tsx
import React from "react";
import { Check } from "lucide-react";

const steps = [
  { label: "Adding Objectives", status: "completed" },
  { label: "Objectives Approval", status: "in-progress" },
  { label: "Adding Target", status: "pending" },
  { label: "Target Approval", status: "pending" },
];

interface ProgressStepsProps {
  currentStep?: number;
}

export function ProgressSteps({ currentStep = 1 }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-8">
      <div className="relative">
        {/* Steps */}
        <div className="flex justify-between items-start">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isPending = idx > currentStep;
            const isLastStep = idx === steps.length - 1;

            return (
              <React.Fragment key={step.label}>
                {/* Step Container */}
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? "border-[#3838EC] text-white"
                        : isCurrent
                        ? "border-[#3838EC] text-white"
                        : "bg-[#E5E7EB] border-[#E5E7EB] text-gray-400"
                    }`}
                    style={{
                      backgroundColor:
                        isCompleted || isCurrent ? "#3838EC" : "#E5E7EB",
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {isCurrent || isPending ? idx + 1 : ""}
                      </span>
                    )}
                  </div>

                  {/* Step Details */}
                  <div className="mt-3 text-center max-w-[140px]">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      STEP {idx + 1}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {step.label}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          isCompleted
                            ? "bg-green-100 text-green-800"
                            : isCurrent
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isCompleted
                          ? "Completed"
                          : isCurrent
                          ? "In Progress"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Line between steps */}
                {!isLastStep && (
                  <div className="flex-1 flex items-center px-2 mt-5">
                    <div
                      className="h-1 rounded-full transition-all duration-500 w-full"
                      style={{
                        backgroundColor: isCompleted ? "#3838EC" : "#3838EC80",
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
