import { Badge } from "@/components/ui/badge";
import { getTaskCompletionStatusPresentation } from "./analytics";
import type { TaskCompletionStatus } from "./types";

interface TaskCompletionStatusBadgeProps {
  status: TaskCompletionStatus;
}

export function TaskCompletionStatusBadge({
  status,
}: TaskCompletionStatusBadgeProps) {
  const presentation = getTaskCompletionStatusPresentation(status);

  return (
    <Badge
      variant="outline"
      className={presentation.className}
      role="status"
      aria-label={`${presentation.label}: ${presentation.description}`}
      title={presentation.description}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${presentation.dotClassName}`}
      />
      {presentation.label}
    </Badge>
  );
}
