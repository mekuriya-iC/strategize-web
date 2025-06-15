import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Image
        src="/images/dashboard/objective-empty.png"
        alt="No objectives"
        width={240}
        height={180}
        className="mb-8"
        priority
      />
      <h2 className="text-xl font-semibold mb-2">
        It seems you don’t have added any objectives yet
      </h2>
      <p className="text-gray-500 mb-6">
        Start adding objectives with the button below.
      </p>
      <Button className="px-6 py-3 text-base bg-[#3838EC] text-white cursor-pointer" onClick={onAdd}>
        + Add Objective
      </Button>
    </div>
  );
}
