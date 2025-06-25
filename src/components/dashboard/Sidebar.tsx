"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import StrategySelector from "./StrategySelector";
import Image from "next/image";

const navLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <Image
        src="/images/dashboard/sidebar/dashboard.png"
        alt="dashboard"
        width={20}
        height={20}
      />
    ),
  },
  {
    label: "Objectives",
    href: "/dashboard/objectives",
    icon: (
      <Image
        src="/images/dashboard/sidebar/objective.png"
        alt="objective"
        width={20}
        height={20}
      />
    ),
  },
  {
    label: "Divisions",
    href: "/dashboard/divisions",
    icon: (
      <Image
        src="/images/dashboard/sidebar/divisions.png"
        alt="division"
        width={20}
        height={20}
      />
    ),
  },
  {
    label: "Departments",
    href: "/dashboard/departments",
    icon: (
      <Image
        src="/images/dashboard/sidebar/departments.png"
        alt="department"
        width={20}
        height={20}
      />
    ),
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: (
      <Image
        src="/images/dashboard/sidebar/employees.png"
        alt="employee"
        width={20}
        height={20}
      />
    ),
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: (
      <Image
        src="/images/dashboard/sidebar/reports.png"
        alt="report"
        width={20}
        height={20}
        className=""
      />
    ),
  },
  {
    label: "Approvals",
    href: "/dashboard/approvals",
    icon: (
      <Image
        src="/images/dashboard/sidebar/approvals.png"
        alt="approval"
        width={20}
        height={20}
      />
    ),
  },
  {
    label: "Admin Panel",
    href: "/dashboard/admin",
    icon: (
      <Image
        src="/images/dashboard/sidebar/admin-panel.png"
        alt="admin"
        width={20}
        height={20}
      />
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <Image
        src="/images/dashboard/sidebar/settings.png"
        alt="settings"
        width={20}
        height={20}
      />
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { open, closeSidebar } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 z-50 bg-white dark:bg-[#18181b] border-r border-[#E2E8F0]
          flex flex-col justify-between py-6 px-4
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:hidden
        `}
      >
        {/* Mobile sidebar content */}
        <div className="overflow-y-auto">
          <div className="mb-10 pl-2">
            <Logo width={140} height={32} />
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex dark:text-gray-100 items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-base hover:bg-[#F4F6FA] ${
                  pathname === link.href
                    ? "bg-[rgba(56,56,236,0.2)] text-[#09090B] dark:bg-[#212123]"
                    : "text-gray-700"
                }`}
                onClick={closeSidebar}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4 mt-10 md:mt-14">
          <div>
            <StrategySelector />
          </div>
          <div className="text-xs text-gray-400 text-center mt-2">
            Powered by <span className="font-semibold">iCapital Africa</span>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar - grid column */}
      <aside className="hidden md:flex md:flex-col md:h-full bg-white dark:bg-[#18181b] border-r border-[#E2E8F0] py-6 px-4">
        {/* Top section: Logo and nav */}
        <div className="flex-1 overflow-y-auto">
          <div className="mb-10 pl-2">
            <Logo width={140} height={32} />
          </div>
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex dark:text-gray-100 items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-base hover:bg-[#F4F6FA] ${
                  pathname === link.href
                    ? "bg-[rgba(56,56,236,0.2)] text-[#09090B] dark:bg-[#212123]"
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
        <div className="flex flex-col gap-4 mt-6">
          <div>
            <StrategySelector />
          </div>
          <div className="text-xs text-[#BDBDBD] text-center mt-2">
            Powered by{" "}
            <span className="font-semibold text-[#3F3F46]">
              iCapital Africa
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
