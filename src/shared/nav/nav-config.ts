import type { PermissionScope } from "@/lib/backend";
import type { IconComponent } from "@/shared/icons";
import {
  AlertRulesIcon,
  AnalyticsIcon,
  AnomaliesIcon,
  AuditIcon,
  BudgetsIcon,
  DashboardIcon,
  FlagsIcon,
  IntegrationsIcon,
  InvestigationIcon,
  OperationsIcon,
  PoliciesIcon,
  ResourcesIcon,
  SettingsIcon,
  UsersIcon,
} from "@/shared/icons";

export type NavBadgeKind = "neutral" | "danger" | "warn";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: IconComponent;
  badge?: string;
  badgeKind?: NavBadgeKind;
  /** Route prefixes considered "active" in addition to exact match. */
  activeWhen?: readonly string[];
  /** Hidden from the sidebar when the role can't view this scope. */
  scope?: PermissionScope;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: DashboardIcon,
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/analytics",
        icon: AnalyticsIcon,
        scope: "budgets",
      },
    ],
  },
  {
    label: "Operate",
    items: [
      {
        id: "resources",
        label: "Resources",
        href: "/resources",
        icon: ResourcesIcon,
        scope: "resources",
        activeWhen: ["/resources"],
      },
      {
        id: "operations",
        label: "Operations",
        href: "/operations",
        icon: OperationsIcon,
        scope: "incidents",
      },
      {
        id: "investigations",
        label: "Investigation",
        href: "/investigations",
        icon: InvestigationIcon,
        scope: "incidents",
        activeWhen: ["/investigations"],
      },
      {
        id: "anomalies",
        label: "Cost anomalies",
        href: "/anomalies",
        icon: AnomaliesIcon,
        scope: "budgets",
      },
      {
        id: "alerts",
        label: "Alert rules",
        href: "/alerts",
        icon: AlertRulesIcon,
        scope: "alerts",
      },
    ],
  },
  {
    label: "Govern",
    items: [
      {
        id: "budgets",
        label: "Budgets",
        href: "/budgets",
        icon: BudgetsIcon,
        scope: "budgets",
      },
      {
        id: "policies",
        label: "Policies",
        href: "/policies",
        icon: PoliciesIcon,
        scope: "policies",
      },
      {
        id: "audit",
        label: "Audit log",
        href: "/audit",
        icon: AuditIcon,
        scope: "audit",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        id: "users",
        label: "Users & roles",
        href: "/users",
        icon: UsersIcon,
        scope: "users",
      },
      {
        id: "flags",
        label: "Feature flags",
        href: "/flags",
        icon: FlagsIcon,
        scope: "flags",
      },
      {
        id: "integrations",
        label: "Integrations",
        href: "/integrations",
        icon: IntegrationsIcon,
        scope: "integrations",
      },
      {
        id: "settings",
        label: "Organization",
        href: "/settings",
        icon: SettingsIcon,
        scope: "users",
      },
    ],
  },
];

/** Breadcrumb map: pathname prefix → [group, page]. */
export const CRUMB_MAP: Record<string, readonly [string, string]> = {
  "/dashboard": ["Overview", "Dashboard"],
  "/analytics": ["Overview", "Analytics"],
  "/resources": ["Operate", "Resources"],
  "/operations": ["Operate", "Operations Center"],
  "/investigations": ["Operate", "Investigation"],
  "/anomalies": ["Operate", "Cost anomalies"],
  "/alerts": ["Operate", "Alert rules"],
  "/budgets": ["Govern", "Budgets"],
  "/policies": ["Govern", "Policies"],
  "/audit": ["Govern", "Audit log"],
  "/users": ["Administration", "Users & roles"],
  "/flags": ["Administration", "Feature flags"],
  "/integrations": ["Administration", "Integrations"],
  "/settings": ["Administration", "Organization"],
};

export function resolveCrumb(pathname: string): readonly [string, string] {
  const key = Object.keys(CRUMB_MAP)
    .filter((k) => pathname === k || pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  return key ? CRUMB_MAP[key]! : ["Overview", "Dashboard"];
}
