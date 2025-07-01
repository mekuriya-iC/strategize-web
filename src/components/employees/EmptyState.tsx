import Image from "next/image";
import AddEmployeeButton from "./AddEmployeeButton";

interface EmptyStateProps {
  onAddEmployee: () => void;
}

export default function EmptyState({ onAddEmployee }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Image
        src="/images/dashboard/objective-empty.png"
        alt="No employees"
        width={320}
        height={240}
        className="mb-12"
        priority
      />
      <h2 className="text-2xl font-semibold text-[#3F3F46] dark:text-gray-100 mb-4 max-w-xl">
        It seems you don&apos;t have added any employees yet
      </h2>
      <p className="text-[#BABABA] dark:text-gray-400 mb-8 md:mb-12 text-lg max-w-sm">
        Start building your team by adding employees.
      </p>
      <AddEmployeeButton onClick={onAddEmployee} />
    </div>
  );
}
