import EmptyState from "@/components/shared/EmptyState";

interface DepartmentsEmptyStateProps {
  onAddDepartment: () => void;
}

export default function DepartmentsEmptyState({
  onAddDepartment,
}: DepartmentsEmptyStateProps) {
  return (
    <EmptyState
      title="It seems you don't have added any departments yet"
      description="Start organizing your company by creating departments."
      actionLabel="Add Department"
      onAction={onAddDepartment}
    />
  );
}
