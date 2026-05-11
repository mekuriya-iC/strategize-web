"use client";
import OrganizationTemplateCard from "./OrganizationTemplateCard";
import { useRouter } from "next/navigation";
import { Network, Building2, Grid3x3 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useOrgChartMutations } from "@/hooks/orgChart/useOrgChartMutations";
import { TEMPLATE_NODES } from "@/lib/orgChart/templateNodes";

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
  const { saveOrgChart, loading } = useOrgChartMutations();
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleTemplateSelect = async (templateId: string) => {
    const selectedTemplate = templates.find((t) => t.id === templateId);
    const rootNode = TEMPLATE_NODES[templateId];

    if (!rootNode) {
      toast.error("Template not found");
      return;
    }

    setSavingId(templateId);
    try {
      await saveOrgChart([rootNode]);
      sessionStorage.setItem("selectedOrgTemplate", templateId);
      toast.success(`${selectedTemplate?.title} structure created`);
      router.push("/strategy-period");
    } catch {
      // error already toasted by the hook
    } finally {
      setSavingId(null);
    }
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
            loading={savingId === template.id}
            disabled={loading && savingId !== template.id}
            onClick={() => handleTemplateSelect(template.id)}
          />
        ))}
      </div>
    </div>
  );
}
