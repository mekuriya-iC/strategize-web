"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  LayoutDashboard,
  Target,
  Building2,
  Users,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StrategySelector from "./StrategySelector";

const navLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Objectives",
    href: "/dashboard/objectives",
    icon: <Target size={20} />,
  },
  {
    label: "Divisions",
    href: "/dashboard/divisions",
    icon: <Building2 size={20} />,
  },
  {
    label: "Departments",
    href: "/dashboard/departments",
    icon: <Building2 size={20} />,
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: <Users size={20} />,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: <FileText size={20} />,
  },
  {
    label: "Approvals",
    href: "/dashboard/approvals",
    icon: <CheckCircle2 size={20} />,
  },
  {
    label: "Admin Panel",
    href: "/dashboard/admin",
    icon: <ShieldCheck size={20} />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings size={20} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, closeSidebar } = useSidebar();

 

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 z-40 bg-white dark:bg-[#18181b] border-r border-[#E2E8F0]
          flex flex-col justify-between py-6 px-4
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:block
        `}
      >
        {/* Top section: Logo and nav */}
        <div>
          <div className="mb-10 pl-2">
            <Logo width={140} height={32} />
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex dark:text-gray-100 items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-sm hover:bg-[#F4F6FA] ${
                  pathname === link.href
                    ? "bg-[#F4F6FA] text-[#3838EC] dark:bg-[#212123]"
                    : "text-gray-700"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* Bottom section: Strategy selector and powered by */}
        <div className="flex flex-col gap-4  mt-10 md:mt-14">
          <div>
            <StrategySelector />
          </div>
          <div className="text-xs text-gray-400 text-center mt-2">
            Powered by <span className="font-semibold">iCapital Africa</span>
          </div>
        </div>
      </aside>
    </>
  );
}
