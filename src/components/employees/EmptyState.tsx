import EmptyState from "@/components/shared/EmptyState";

interface EmployeesEmptyStateProps {
  onAddEmployee: () => void;
}

export default function EmployeesEmptyState({
  onAddEmployee,
}: EmployeesEmptyStateProps) {
  return (
    <EmptyState
      title="It seems you don't have added any employees yet"
      description="Start building your team by adding employees."
      actionLabel="Add Employee"
      onAction={onAddEmployee}
    />
  );
}
