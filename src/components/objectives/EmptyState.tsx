import Image from "next/image";
import AddObjectiveButton from "./AddObjectiveButton";
import { useUser } from "@/context/UserContext";

export default function EmptyState() {
  const { user } = useUser();

  // Only show Add Objective button for admin and super admin users
  const showAddButton = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Image
        src="/images/dashboard/objective-empty.png"
        alt="No objectives"
        width={320}
        height={240}
        className="mb-12"
        priority
      />
      <h2 className="text-2xl font-semibold text-[#3F3F46] dark:text-gray-100 mb-4 max-w-xl">
        It seems you don&apos;t have added any objectives yet
      </h2>
      <p className="text-[#BABABA] dark:text-gray-400 mb-8 md:mb-12 text-lg max-w-sm">
        {showAddButton
          ? "Start adding objectives with the button below."
          : "Contact your administrator to add objectives."}
      </p>
      {showAddButton && <AddObjectiveButton />}
    </div>
  );
}
