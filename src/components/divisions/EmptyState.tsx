import EmptyState from "@/components/shared/EmptyState";

interface DivisionsEmptyStateProps {
  onAddDivision: () => void;
}

export default function DivisionsEmptyState({
  onAddDivision,
}: DivisionsEmptyStateProps) {
  return (
    <EmptyState
      title="It seems you don't have added any divisions yet"
      description="Start organizing your company by creating divisions."
      actionLabel="Add Division"
      onAction={onAddDivision}
    />
  );
}
