import type { IconComponent } from "@/shared/icons";
import {
  AnalyticsIcon,
  AnomaliesIcon,
  AuditIcon,
  BudgetsIcon,
  DashboardIcon,
  FlagsIcon,
  IntegrationsIcon,
  InvestigationIcon,
  OperationsIcon,
  ResourcesIcon,
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
        activeWhen: ["/resources"],
      },
      {
        id: "operations",
        label: "Operations",
        href: "/operations",
        icon: OperationsIcon,
      },
      {
        id: "investigations",
        label: "Investigation",
        href: "/investigations",
        icon: InvestigationIcon,
        activeWhen: ["/investigations"],
      },
      {
        id: "anomalies",
        label: "Cost anomalies",
        href: "/anomalies",
        icon: AnomaliesIcon,
      },
    ],
  },
  {
    label: "Govern",
    items: [
      { id: "budgets", label: "Budgets", href: "/budgets", icon: BudgetsIcon },
      { id: "audit", label: "Audit log", href: "/audit", icon: AuditIcon },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "users", label: "Users & roles", href: "/users", icon: UsersIcon },
      { id: "flags", label: "Feature flags", href: "/flags", icon: FlagsIcon },
      {
        id: "integrations",
        label: "Integrations",
        href: "/integrations",
        icon: IntegrationsIcon,
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
  "/budgets": ["Govern", "Budgets"],
  "/audit": ["Govern", "Audit log"],
  "/users": ["Administration", "Users & roles"],
  "/flags": ["Administration", "Feature flags"],
  "/integrations": ["Administration", "Integrations"],
};

export function resolveCrumb(pathname: string): readonly [string, string] {
  const key = Object.keys(CRUMB_MAP)
    .filter((k) => pathname === k || pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  return key ? CRUMB_MAP[key]! : ["Overview", "Dashboard"];
}
