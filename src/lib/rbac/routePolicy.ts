export const ROLE_HIERARCHY: Record<string, number> = {
  NORMAL: 0,
  COORDINATOR: 1,
  MANAGER: 2,
  DIRECTOR: 3,
  HR: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
};

type RoutePolicy =
  | { minimumRole: string }
  | { allowedRoles: readonly string[] };

const ROUTE_POLICIES: Record<string, RoutePolicy> = {
  "/dashboard/admin": { minimumRole: "ADMIN" },
  "/dashboard/employees": { minimumRole: "MANAGER" },
  "/dashboard/positions": { allowedRoles: ["HR", "SUPER_ADMIN"] },
  "/dashboard/teams": { allowedRoles: ["HR", "SUPER_ADMIN"] },
  "/dashboard/divisions": { minimumRole: "DIRECTOR" },
  "/dashboard/departments": { minimumRole: "DIRECTOR" },
  "/dashboard/approvals": { minimumRole: "COORDINATOR" },
  "/dashboard/structure": { minimumRole: "NORMAL" },
  "/strategy-period/new": { allowedRoles: ["SUPER_ADMIN"] },
  "/strategy-period": { minimumRole: "NORMAL" },
  "/organization-template": { allowedRoles: ["SUPER_ADMIN"] },
  "/org-structure": { allowedRoles: ["SUPER_ADMIN"] },
  "/dashboard": { minimumRole: "NORMAL" },
};

const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/strategy-period",
  "/organization-template",
  "/org-structure",
];

function getRoutePolicy(pathname: string): RoutePolicy | null {
  const matchingRoute = Object.keys(ROUTE_POLICIES)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname === route || pathname.startsWith(`${route}/`));

  return matchingRoute ? ROUTE_POLICIES[matchingRoute] : null;
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canRoleAccessRoute(
  userRole: string | undefined,
  pathname: string,
): boolean {
  if (!userRole) return false;
  if (userRole === 'CEO') return canCeoAccessRoute(pathname);

  const policy = getRoutePolicy(pathname);
  if (!policy) return true;

  if ("allowedRoles" in policy) {
    return policy.allowedRoles.includes(userRole);
  }

  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[policy.minimumRole] ?? Number.MAX_SAFE_INTEGER;
  return userLevel >= requiredLevel;
}

/** Deliberate observer surface, independent from the administrator hierarchy. */
export function canCeoAccessRoute(path: string): boolean {
  const [pathname, query] = path.split('?');
  if (new URLSearchParams(query).get('tab') === 'submissions') return false;
  const exact = [
    '/dashboard', '/dashboard/structure', '/dashboard/task-completion',
    '/dashboard/performance', '/dashboard/kpi-scorecard', '/dashboard/kpi-weight',
    '/dashboard/flagged-kpis', '/dashboard/reports', '/dashboard/approvals', '/dashboard/logbook',
    '/dashboard/admin', '/dashboard/admin/permissions', '/dashboard/admin/system-config',
    '/dashboard/admin/logs', '/dashboard/settings',
  ];
  return exact.includes(pathname) || /^\/dashboard\/(kpis|objectives)\/[0-9a-f-]{36}$/.test(pathname);
}

export function getRouteRoleRequirement(pathname: string): string | null {
  const policy = getRoutePolicy(pathname);
  if (!policy) return null;

  return "allowedRoles" in policy
    ? policy.allowedRoles.join("_OR_")
    : policy.minimumRole;
}
