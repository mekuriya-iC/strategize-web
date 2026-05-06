"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import StrategySelector from "./StrategySelector";
import Image from "next/image";
import type { Permission } from "@/lib/rbac/permissions";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
}

interface NavCategory {
  label: string;
  icon: React.ReactNode;
  permission: Permission;
  links: NavLink[];
}

// Standalone links (not in categories)
const standaloneLinks: NavLink[] = [
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
];

// Categorized navigation
const navCategories: NavCategory[] = [
  {
    label: "Strategy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-current">
        <path d="M9 3L16 10L9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 10H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    permission: "nav:dashboard",
    links: [
      {
        label: "Strategic Plans",
        href: "/dashboard/strategic-plans",
        permission: "nav:dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M9 3L16 10L9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        label: "Objectives",
        href: "/dashboard/objectives",
        permission: "nav:objectives",
        icon: (
          <Image src="/images/dashboard/sidebar/objective.png" alt="objective" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
      {
        label: "Initiatives",
        href: "/dashboard/initiatives",
        permission: "nav:objectives",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M10 2L10 18M10 2L6 6M10 2L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Organization",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-current">
        <path d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V14C17 15.1046 16.1046 16 15 16H5C3.89543 16 3 15.1046 3 14V6Z" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    permission: "nav:dashboard",
    links: [
      {
        label: "Structure",
        href: "/dashboard/structure",
        permission: "nav:dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V14C17 15.1046 16.1046 16 15 16H5C3.89543 16 3 15.1046 3 14V6Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
      {
        label: "Divisions",
        href: "/dashboard/divisions",
        permission: "nav:divisions",
        icon: (
          <Image src="/images/dashboard/sidebar/divisions.png" alt="division" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
      {
        label: "Departments",
        href: "/dashboard/departments",
        permission: "nav:departments",
        icon: (
          <Image src="/images/dashboard/sidebar/departments.png" alt="department" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
      {
        label: "Positions",
        href: "/dashboard/positions",
        permission: "nav:dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "People",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-current">
        <path d="M13 7C13 8.65685 11.6569 10 10 10C8.34315 10 7 8.65685 7 7C7 5.34315 8.34315 4 10 4C11.6569 4 13 5.34315 13 7Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 16C5 13.7909 6.79086 12 9 12H11C13.2091 12 15 13.7909 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    permission: "nav:employees",
    links: [
      {
        label: "Employees",
        href: "/dashboard/employees",
        permission: "nav:employees",
        icon: (
          <Image src="/images/dashboard/sidebar/employees.png" alt="employee" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
      {
        label: "Teams",
        href: "/dashboard/teams",
        permission: "nav:employees",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M13 7C13 8.65685 11.6569 10 10 10C8.34315 10 7 8.65685 7 7C7 5.34315 8.34315 4 10 4C11.6569 4 13 5.34315 13 7Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Performance",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-current">
        <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    permission: "nav:dashboard",
    links: [
      {
        label: "Check-In/Out",
        href: "/dashboard/checkin",
        permission: "nav:checkin",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
      {
        label: "Logbook",
        href: "/dashboard/logbook",
        permission: "nav:logbook",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
      {
        label: "Evaluate",
        href: "/dashboard/evaluations",
        permission: "nav:dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        label: "Performance",
        href: "/dashboard/performance",
        permission: "nav:reports",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M3 17V11M10 17V7M17 17V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Reports",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-current">
        <path d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 6H13M7 10H13M7 14H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    permission: "nav:reports",
    links: [
      {
        label: "Reports",
        href: "/dashboard/reports",
        permission: "nav:reports",
        icon: (
          <Image src="/images/dashboard/sidebar/reports.png" alt="report" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
      {
        label: "Approvals",
        href: "/dashboard/approvals",
        permission: "nav:approvals",
        icon: (
          <Image src="/images/dashboard/sidebar/approvals.png" alt="approval" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
    ],
  },
  {
    label: "Administration",
    icon: (
      <Image src="/images/dashboard/sidebar/admin-panel.png" alt="admin" width={20} height={20} className="sidebar-icon-filter"/>
    ),
    permission: "nav:admin",
    links: [
      {
        label: "Admin Panel",
        href: "/dashboard/admin",
        permission: "nav:admin",
        icon: (
          <Image src="/images/dashboard/sidebar/admin-panel.png" alt="admin" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
      {
        label: "System Logs",
        href: "/dashboard/admin/logs",
        permission: "nav:admin",
        icon: (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-current">
            <path d="M9 5H7C5.89543 5 5 5.89543 5 7V15C5 16.1046 5.89543 17 7 17H13C14.1046 17 15 16.1046 15 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        permission: "nav:settings",
        icon: (
          <Image src="/images/dashboard/sidebar/settings.png" alt="settings" width={16} height={16} className="sidebar-icon-filter"/>
        ),
      },
    ],
  },
];

function CollapsibleCategory({ category, open: sidebarOpen, onLinkClick }: { category: NavCategory; open: boolean; onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter links based on permissions
  const filteredLinks = category.links.filter((link) => can(link.permission));
  
  if (filteredLinks.length === 0) return null;

  // Check if any link in this category is active
  const isCategoryActive = filteredLinks.some((link) => {
    if (link.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(link.href);
  });

  const isLinkActive = (linkHref: string) => {
    if (linkHref === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(linkHref);
  };

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center rounded-lg font-medium transition-all duration-300 text-base hover:bg-[#F4F6FA] dark:hover:bg-gray-800
          ${sidebarOpen ? "gap-3 px-3 py-2 justify-between" : "gap-0 px-2 py-2 justify-center"}
          ${isCategoryActive ? "bg-[rgba(56,56,236,0.1)] text-[#3838EC] dark:bg-[#212123] dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}
        `}
        title={!sidebarOpen ? category.label : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{category.icon}</div>
          {sidebarOpen && <span>{category.label}</span>}
        </div>
        {sidebarOpen && (
          <div className="flex-shrink-0">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>
      
      {sidebarOpen && isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg font-normal transition-colors text-sm hover:bg-[#F4F6FA] dark:hover:bg-gray-800
                ${isLinkActive(link.href)
                  ? "bg-[rgba(56,56,236,0.2)] text-[#09090B] dark:bg-[#212123] dark:text-white font-medium"
                  : "text-gray-600 dark:text-gray-400"
                }
              `}
              onClick={onLinkClick}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen: open, closeSidebar } = useUIStore();
  const { can } = usePermissions();

  // Filter standalone links based on permissions
  const filteredStandaloneLinks = standaloneLinks.filter((link) => can(link.permission));
  
  // Filter categories based on permissions
  const filteredCategories = navCategories.filter((category) => 
    can(category.permission) && category.links.some((link) => can(link.permission))
  );

  const isLinkActive = (linkHref: string) => {
    if (linkHref === "/dashboard") return pathname === "/dashboard";
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
        <div className="overflow-y-auto">
          <div className="mb-10 pl-2">
            <Logo width={140} height={32} />
          </div>
          <nav className="flex flex-col gap-2">
            {/* Standalone links */}
            {filteredStandaloneLinks.map((link) => (
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
            
            {/* Categorized links */}
            {filteredCategories.map((category) => (
              <CollapsibleCategory
                key={category.label}
                category={category}
                open={true}
                onLinkClick={closeSidebar}
              />
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

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:flex lg:flex-col lg:h-full bg-white dark:bg-[#18181b] border-r border-[#E2E8F0] dark:border-gray-800 py-6
          transition-all duration-300 ease-in-out
          ${open ? "lg:w-64 px-4" : "lg:w-16 px-2"}
        `}
      >
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
            {/* Standalone links */}
            {filteredStandaloneLinks.map((link) => (
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
            
            {/* Categorized links */}
            {filteredCategories.map((category) => (
              <CollapsibleCategory
                key={category.label}
                category={category}
                open={open}
              />
            ))}
          </nav>
        </div>
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
