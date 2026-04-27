"use client";
import OrganizationTemplateCard from "./OrganizationTemplateCard";
import { useRouter } from "next/navigation";
import { Network, Building2, Grid3x3 } from "lucide-react";
import { toast } from "sonner";

const templates = [
  {
    id: "classic-top-down",
    title: "Classic Top-Down",
    description: "CEO → Departments → Teams",
    icon: <Network size={48} strokeWidth={1.5} />,
  },
  {
    id: "multi-department",
    title: "Multi-Department",
    description: "CEO → Strategy/Operations/Finance, etc",
    icon: <Building2 size={48} strokeWidth={1.5} />,
  },
  {
    id: "matrix-team",
    title: "Matrix Team",
    description: "Cross-functional organization structure",
    icon: <Grid3x3 size={48} strokeWidth={1.5} />,
  },
];

export default function OrganizationTemplateGrid() {
  const router = useRouter();

  const handleTemplateSelect = (templateId: string) => {
    // Store the selected template in sessionStorage
    sessionStorage.setItem("selectedOrgTemplate", templateId);
    
    const selectedTemplate = templates.find(t => t.id === templateId);
    toast.success(`${selectedTemplate?.title} template selected!`);
    
    // Navigate to strategy period selection
    router.push("/strategy-period");
  };

  return (
    <div className="w-full flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
        {templates.map((template) => (
          <OrganizationTemplateCard
            key={template.id}
            icon={template.icon}
            title={template.title}
            description={template.description}
            onClick={() => handleTemplateSelect(template.id)}
          />
        ))}
      </div>
    </div>
  );
}
