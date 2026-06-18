"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useUIStore } from "@/stores";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import StrategySelector from "./StrategySelector";
import Image from "next/image";
import type { Permission } from "@/lib/rbac/permissions";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores";
import { usePendingApprovalsCount } from "@/hooks/submissions/usePendingApprovalsCount";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission: Permission;
  /** Shown only for division/department managers (not corporate admins) */
  managerOnly?: boolean;
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
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-current"
      >
        <path
          d="M9 3L16 10L9 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 10H3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    permission: "nav:dashboard",
    links: [
      {
        label: "Strategic Plans",
        href: "/dashboard/strategic-plans",
        permission: "nav:dashboard",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M9 3L16 10L9 17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
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
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
      {
        label: "Initiatives",
        href: "/dashboard/initiatives",
        permission: "nav:objectives",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M10 2L10 18M10 2L6 6M10 2L14 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Organization",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-current"
      >
        <path
          d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V14C17 15.1046 16.1046 16 15 16H5C3.89543 16 3 15.1046 3 14V6Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
    permission: "nav:dashboard",
    links: [
      {
        label: "Structure",
        href: "/dashboard/structure",
        permission: "nav:dashboard",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V14C17 15.1046 16.1046 16 15 16H5C3.89543 16 3 15.1046 3 14V6Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
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
            width={16}
            height={16}
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
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
      {
        label: "Positions",
        href: "/dashboard/positions",
        permission: "nav:dashboard",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <rect
              x="3"
              y="4"
              width="14"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: "People",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-current"
      >
        <path
          d="M13 7C13 8.65685 11.6569 10 10 10C8.34315 10 7 8.65685 7 7C7 5.34315 8.34315 4 10 4C11.6569 4 13 5.34315 13 7Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 16C5 13.7909 6.79086 12 9 12H11C13.2091 12 15 13.7909 15 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    permission: "nav:employees",
    links: [
      {
        label: "Employees",
        href: "/dashboard/employees",
        permission: "nav:employees",
        icon: (
          <Image
            src="/images/dashboard/sidebar/employees.png"
            alt="employee"
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
      {
        label: "Teams",
        href: "/dashboard/teams",
        permission: "nav:employees",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M13 7C13 8.65685 11.6569 10 10 10C8.34315 10 7 8.65685 7 7C7 5.34315 8.34315 4 10 4C11.6569 4 13 5.34315 13 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Performance",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-current"
      >
        <path
          d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    permission: "nav:dashboard",
    links: [
      {
        label: "Check-In/Out",
        href: "/dashboard/checkin",
        permission: "nav:checkin",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        ),
      },
      {
        label: "Logbook",
        href: "/dashboard/logbook",
        permission: "nav:logbook",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        ),
      },
      {
        label: "Evaluate",
        href: "/dashboard/evaluations",
        permission: "nav:dashboard",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: "KPI Scorecard",
        href: "/dashboard/kpi-scorecard",
        permission: "nav:dashboard",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M3 17V11M10 17V7M17 17V3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: "KPI Weight Achievement",
        href: "/dashboard/kpi-weight",
        permission: "nav:dashboard",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M10 3L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.2"
            />
          </svg>
        ),
      },
      {
        label: "Performance",
        href: "/dashboard/performance",
        permission: "nav:reports",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M3 17V11M10 17V7M17 17V3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Reports",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-current"
      >
        <path
          d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7 6H13M7 10H13M7 14H10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    permission: "nav:reports",
    links: [
      {
        label: "Performance Reports",
        href: "/dashboard/reports?tab=performance",
        permission: "nav:reports",
        icon: (
          <Image
            src="/images/dashboard/sidebar/reports.png"
            alt="report"
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
      {
        label: "Semi-Annual Report",
        href: "/dashboard/semi-annual-report",
        permission: "nav:reports",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M4 4C4 2.89543 4.89543 2 6 2H14C15.1046 2 16 2.89543 16 4V16C16 17.1046 15.1046 18 14 18H6C4.89543 18 4 17.1046 4 16V4Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M7 6H13M7 10H10M7 14H13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        label: "My Submissions",
        href: "/dashboard/reports?tab=my-submissions",
        permission: "nav:reports",
        icon: (
          <Image
            src="/images/dashboard/sidebar/approvals.png"
            alt="my submissions"
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
      {
        label: "Approve Requests",
        href: "/dashboard/approvals",
        permission: "nav:approvals",
        icon: (
          <Image
            src="/images/dashboard/sidebar/approvals.png"
            alt="approval"
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
    ],
  },
  {
    label: "Administration",
    icon: (
      <Image
        src="/images/dashboard/sidebar/admin-panel.png"
        alt="admin"
        width={20}
        height={20}
        className="sidebar-icon-filter"
      />
    ),
    permission: "nav:admin",
    links: [
      {
        label: "Admin Panel",
        href: "/dashboard/admin",
        permission: "nav:admin",
        icon: (
          <Image
            src="/images/dashboard/sidebar/admin-panel.png"
            alt="admin"
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
      {
        label: "Semi-Annual Config",
        href: "/dashboard/semi-annual-config",
        permission: "nav:admin",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15.5L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="10" r="3" fill="currentColor" fillOpacity="0.2" />
          </svg>
        ),
      },
      {
        label: "System Logs",
        href: "/dashboard/admin/logs",
        permission: "nav:admin",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className="text-current"
          >
            <path
              d="M9 5H7C5.89543 5 5 5.89543 5 7V15C5 16.1046 5.89543 17 7 17H13C14.1046 17 15 16.1046 15 15V13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
            width={16}
            height={16}
            className="sidebar-icon-filter"
          />
        ),
      },
    ],
  },
];

function CollapsibleCategory({
  category,
  open: sidebarOpen,
  onLinkClick,
  badgeCounts,
}: {
  category: NavCategory;
  open: boolean;
  onLinkClick?: () => void;
  badgeCounts?: Record<string, number>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const { openSidebar } = useUIStore();
  const user = useAuthStore((state) => state.user);

  const isManagerRole = user?.role === "DIRECTOR" || user?.role === "MANAGER";

  // Filter links based on permissions
  const filteredLinks = category.links
    .filter((link) => {
      if (!can(link.permission)) return false;
      if (link.managerOnly && !isManagerRole) return false;
      return true;
    })
    .map((link) =>
      link.href === "/dashboard/approvals" &&
      (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN")
        ? { ...link, label: "Approvals" }
        : link,
    );

  const isLinkActive = (linkHref: string) => {
    const url = new URL(linkHref, "http://localhost");
    const linkPath = url.pathname;
    const linkTab = url.searchParams.get("tab");

    if (linkPath === "/dashboard") return pathname === "/dashboard";
    if (linkPath === "/dashboard/admin") return pathname === "/dashboard/admin";

    const isPathMatch = pathname.startsWith(linkPath);
    if (!isPathMatch) return false;

    // If link has a tab requirement, check if it matches current searchParams
    if (linkTab) {
      return searchParams.get("tab") === linkTab;
    }

    return true;
  };

  const isCategoryActive = filteredLinks.some((link) =>
    isLinkActive(link.href),
  );

  const [isExpanded, setIsExpanded] = useState(isCategoryActive);

  // Sync expanded state with active state when category becomes active
  useEffect(() => {
    if (isCategoryActive) {
      setIsExpanded(true);
    }
  }, [isCategoryActive]);

  if (filteredLinks.length === 0) return null;

  const handleCategoryClick = () => {
    if (!sidebarOpen) {
      openSidebar();
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCategoryClick}
        className={`
          w-full flex items-center rounded-lg font-medium transition-all duration-300 text-base hover:bg-[#F4F6FA] dark:hover:bg-gray-800
          ${isCategoryActive ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-gray-600 dark:text-gray-400"}
          ${sidebarOpen ? "px-4 py-3" : "h-12 w-12 mx-auto justify-center"}
        `}
      >
        <span className={`${sidebarOpen ? "mr-3" : ""}`}>{category.icon}</span>
        {sidebarOpen && (
          <>
            <span className="flex-1 text-left">{category.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </>
        )}
      </button>

      {sidebarOpen && isExpanded && (
        <div className="mt-1 ml-4 pl-4 border-l border-gray-100 dark:border-gray-800 space-y-1">
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={`
                flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-300
                ${
                  isLinkActive(link.href)
                    ? "text-indigo-600 font-bold bg-indigo-50/50 dark:bg-indigo-900/10"
                    : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }
              `}
            >
              <span className="mr-3">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              {badgeCounts?.[link.href] != null && badgeCounts[link.href] > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold leading-none">
                  {badgeCounts[link.href] > 99 ? "99+" : badgeCounts[link.href]}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { sidebarOpen, openSidebar } = useUIStore();
  const { can } = usePermissions();
  const user = useAuthStore((state) => state.user);
  const { count: pendingApprovalsCount } = usePendingApprovalsCount();

  // Badge map: route → count (only "Approve Requests" for now)
  const badgeCounts: Record<string, number> = {
    "/dashboard/approvals": pendingApprovalsCount,
  };

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`
        flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300
        ${sidebarOpen ? "w-64" : "w-20"}
      `}
    >
      <div className={`p-6 mb-2 ${!sidebarOpen && "flex justify-center"}`}>
        <Logo className={sidebarOpen ? "w-40" : "w-10"} />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 space-y-1">
        {/* Standalone Links */}
        {standaloneLinks
          .filter((link) => can(link.permission))
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={`
                flex items-center rounded-lg font-medium transition-all duration-300 text-base
                ${
                  isLinkActive(link.href)
                    ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-[#F4F6FA] dark:hover:bg-gray-800"
                }
                ${sidebarOpen ? "px-4 py-3" : "h-12 w-12 mx-auto justify-center mb-1"}
              `}
            >
              <span className={`${sidebarOpen ? "mr-3" : ""}`}>
                {link.icon}
              </span>
              {sidebarOpen && link.label}
            </Link>
          ))}

        {/* Categorized Links */}
        {navCategories.map((category) => (
          <CollapsibleCategory
            key={category.label}
            category={category}
            open={sidebarOpen}
            onLinkClick={onLinkClick}
            badgeCounts={badgeCounts}
          />
        ))}
      </div>

      {/* Powered by iCapital Africa */}
      <div className="p-4 mt-auto border-t border-gray-50 dark:border-gray-800">
        <div
          className={`flex items-center ${sidebarOpen ? "gap-2" : "justify-center"}`}
        >
          <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
            {sidebarOpen ? "Powered by" : ""}{" "}
            <span className="text-indigo-600 font-bold">
              {sidebarOpen ? "iCapital Africa" : "iCA"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
