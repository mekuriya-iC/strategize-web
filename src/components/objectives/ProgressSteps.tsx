// components/dashboard/ProgressSteps.tsx
import { CheckCircle, Circle } from "lucide-react";

const steps = [
  { label: "Adding Objectives", status: "completed" },
  { label: "Objectives Approval", status: "in-progress" },
  { label: "Adding Target", status: "pending" },
  { label: "Target Approval", status: "pending" },
];

export function ProgressSteps({ currentStep = 1 }) {
  return (
    <div className="flex items-center justify-center w-full py-8">
      <div className="flex w-full max-w-3xl items-center">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={step.label}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${
                    isCompleted
                      ? "bg-primary border-primary text-white"
                      : isCurrent
                      ? "bg-white border-primary text-primary"
                      : "bg-white border-gray-300 text-gray-400"
                  }
                  transition-all duration-300`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-bold">{idx + 1}</span>
                )}
              </div>
              {/* Step Label */}
              <div className="mt-2 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide">
                  Step {idx + 1}
                </div>
                <div className="text-sm font-medium">{step.label}</div>
                <div
                  className={`text-xs mt-1 ${
                    isCompleted
                      ? "text-green-500"
                      : isCurrent
                      ? "text-primary"
                      : "text-gray-400"
                  }`}
                >
                  {isCompleted
                    ? "Completed"
                    : isCurrent
                    ? "In Progress"
                    : "Pending"}
                </div>
              </div>
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-full w-full h-1
                    ${isCompleted ? "bg-primary" : "bg-gray-200"}
                    z-0`}
                  style={{ width: "100px", left: "50%", right: "-50%" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
