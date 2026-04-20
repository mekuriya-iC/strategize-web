"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import StrategySelector from "./StrategySelector";
import Image from "next/image";
import type { Permission } from "@/lib/rbac/permissions";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
}

const navLinks: NavLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    permission: "nav:dashboard",
    icon: (
      <Image
        src="/images/dashboard/sidebar/dashboard.png"
        alt="dashboard"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Structure",
    href: "/dashboard/structure",
    permission: "nav:dashboard",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        <path
          d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V14C17 15.1046 16.1046 16 15 16H5C3.89543 16 3 15.1046 3 14V6Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M6 8H14M6 11H11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Objectives",
    href: "/dashboard/objectives",
    permission: "nav:objectives",
    icon: (
      <Image
        src="/images/dashboard/sidebar/objective.png"
        alt="objective"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Divisions",
    href: "/dashboard/divisions",
    permission: "nav:divisions",
    icon: (
      <Image
        src="/images/dashboard/sidebar/divisions.png"
        alt="division"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Departments",
    href: "/dashboard/departments",
    permission: "nav:departments",
    icon: (
      <Image
        src="/images/dashboard/sidebar/departments.png"
        alt="department"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    permission: "nav:employees",
    icon: (
      <Image
        src="/images/dashboard/sidebar/employees.png"
        alt="employee"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    permission: "nav:reports",
    icon: (
      <Image
        src="/images/dashboard/sidebar/reports.png"
        alt="report"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Approvals",
    href: "/dashboard/approvals",
    permission: "nav:approvals",
    icon: (
      <Image
        src="/images/dashboard/sidebar/approvals.png"
        alt="approval"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Admin Panel",
    href: "/dashboard/admin",
    permission: "nav:admin",
    icon: (
      <Image
        src="/images/dashboard/sidebar/admin-panel.png"
        alt="admin"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    permission: "nav:settings",
    icon: (
      <Image
        src="/images/dashboard/sidebar/settings.png"
        alt="settings"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen: open, closeSidebar } = useUIStore();
  const { can } = usePermissions();

  // Filter navigation links based on user permissions
  const filteredNavLinks = navLinks.filter((link) => can(link.permission));

  // Helper function to determine if a navigation link is active
  const isLinkActive = (linkHref: string) => {
    // Exact match for dashboard home
    if (linkHref === "/dashboard") {
      return pathname === "/dashboard";
    }
    // For other links, check if pathname starts with the link href
    return pathname.startsWith(linkHref);
  };

  return (
    <>
      {/* Mobile/Tablet overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity lg:hidden ${open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
          }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Mobile/Tablet sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 z-50 bg-white dark:bg-[#18181b] border-r border-[#E2E8F0] dark:border-gray-800
          flex flex-col justify-between py-6 px-4
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:hidden
        `}
      >
        {/* Mobile/Tablet sidebar content */}
        <div className="overflow-y-auto">
          <div className="mb-10 pl-2">
            <Logo width={140} height={32} />
          </div>
          <nav className="flex flex-col gap-2">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex dark:text-gray-100 items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors text-base hover:bg-[#F4F6FA] dark:hover:bg-gray-800 ${isLinkActive(link.href)
                  ? "bg-[rgba(56,56,236,0.2)] text-[#09090B] dark:bg-[#212123] dark:text-white"
                  : "text-gray-700 dark:text-gray-300"
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

      {/* Desktop sidebar - responsive to toggle state */}
      <aside
        className={`
          hidden lg:flex lg:flex-col lg:h-full bg-white dark:bg-[#18181b] border-r border-[#E2E8F0] dark:border-gray-800 py-6
          transition-all duration-300 ease-in-out
          ${open ? "lg:w-64 px-4" : "lg:w-16 px-2"}
        `}
      >
        {/* Top section: Logo and nav */}
        <div className="flex-1 overflow-y-auto">
          <div
            className={`mb-10 transition-all duration-300 ${open ? "pl-2" : "pl-0"
              }`}
          >
            {open ? (
              <Logo width={140} height={32} />
            ) : (
              <div className="w-8 h-8 bg-[#3838EC] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-2">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex dark:text-gray-100 items-center rounded-lg font-medium transition-all duration-300 text-base hover:bg-[#F4F6FA] dark:hover:bg-gray-800
                  ${open ? "gap-3 px-3 py-2" : "gap-0 px-2 py-2 justify-center"}
                  ${isLinkActive(link.href)
                    ? "bg-[rgba(56,56,236,0.2)] text-[#09090B] dark:bg-[#212123] dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                  }
                `}
                title={!open ? link.label : undefined}
              >
                <div className="flex-shrink-0">{link.icon}</div>
                <span
                  className={`transition-all duration-300 ${open ? "opacity-100 block" : "opacity-0 hidden"
                    }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        {/* Bottom section: Strategy selector and powered by */}
        <div
          className={`flex flex-col gap-4 mt-6 transition-all duration-300 ${open ? "" : "items-center"
            }`}
        >
          {open && (
            <div>
              <StrategySelector />
            </div>
          )}
          <div
            className={`text-xs text-[#BDBDBD] text-center mt-2 transition-all duration-300 ${open ? "" : "hidden"
              }`}
          >
            Powered by{" "}
            <span className="font-semibold text-[#3F3F46] dark:text-gray-400">
              iCapital Africa
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
