import Logo from "@/components/Logo";
import AddNewStrategyForm from "@/components/strategy-period/AddNewStrategyForm";

export default function AddNewStrategyPage() {
  return (
    <div className="min-h-screen bg-white p-4 flex flex-col">
      {/* Logo at the top left */}
      <div className="w-full flex items-center mb-2">
        <Logo />
      </div>
      {/* Centered form section */}
      <div className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-10">
          Choose New Strategy Period
        </h1>
        <AddNewStrategyForm />
      </div>
    </div>
  );
}
