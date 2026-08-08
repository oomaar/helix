import type { SVGProps } from "react";

/**
 * Line-style icon set for Helix. Paths mirror the ones used in the approved
 * design so icon shapes stay consistent across the product.
 */

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type IconComponent = (props: IconProps) => React.JSX.Element;

/** Factory for stroke-based icons. */
function icon(paths: readonly string[]): IconComponent {
  return function Icon({ size = 16, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

// Navigation icons (from design nav definitions)
export const DashboardIcon = icon([
  "M3 3h8v8H3zM13 3h8v8h-8zM13 13h8v8h-8zM3 13h8v8H3z",
]);
export const AnalyticsIcon = icon(["M3 3v18h18M8 14v4M13 9v9M18 5v13"]);
export const ResourcesIcon = icon([
  "M4 5h16v6H4zM4 13h16v6H4zM8 8h.01M8 16h.01",
]);
export const OperationsIcon = icon(["M3 12h4l3 8 4-16 3 8h4"]);
export const InvestigationIcon = icon([
  "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.3-4.3M11 8v3M11 14h.01",
]);
export const AnomaliesIcon = icon(["M12 3l9 16H3zM12 9v4M12 17h.01"]);
export const BudgetsIcon = icon([
  "M3 7h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V6a2 2 0 0 1 2-2h11M17 12h.01",
]);
export const AuditIcon = icon(["M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 8v4l3 2"]);
export const UsersIcon = icon([
  "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
]);
export const FlagsIcon = icon([
  "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
]);
export const IntegrationsIcon = icon([
  "M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5",
]);
export const PoliciesIcon = icon([
  "M12 3l8 3v6c0 4.4-3.2 8.2-8 9-4.8-.8-8-4.6-8-9V6z",
  "M9 12l2 2 4-4",
]);
export const AlertRulesIcon = icon([
  "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9",
  "M13.7 21a2 2 0 0 1-3.4 0",
  "M12 8v3",
]);

// Utility icons
export const SearchIcon = icon([
  "M21 21l-4-4",
  "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z",
]);
export const BellIcon = icon([
  "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9",
  "M13.7 21a2 2 0 0 1-3.4 0",
]);
export const SunIcon = icon([
  "M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
]);
export const MoonIcon = icon(["M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"]);
export const PlusIcon = icon(["M12 5v14", "M5 12h14"]);
export const MenuIcon = icon(["M3 6h18M3 12h18M3 18h18"]);
export const CloseIcon = icon(["M6 6l12 12M18 6L6 18"]);
export const CheckIcon = icon(["M20 6L9 17l-5-5"]);
export const SettingsIcon = icon([
  "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
]);
export const ChevronDownIcon = icon(["M6 9l6 6 6-6"]);
export const ChevronLeftIcon = icon(["M15 6l-6 6 6 6"]);
export const ChevronRightIcon = icon(["M9 6l6 6-6 6"]);
export const ChevronUpDownIcon = icon(["M8 9l4-4 4 4M8 15l4 4 4-4"]);
export const DownloadIcon = icon(["M12 3v12M8 11l4 4 4-4M4 21h16"]);
export const InfoIcon = icon([
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  "M12 11v5M12 8h.01",
]);
export const HelpIcon = icon([
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  "M9.6 9.2a2.5 2.5 0 1 1 3.2 3.1c-.6.3-.8.7-.8 1.4v.3",
  "M12 17h.01",
]);
export const TrashIcon = icon([
  "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  "M10 11v6M14 11v6",
]);
export const PencilIcon = icon(["M4 20h4L20 8l-4-4L4 16z", "M14 6l4 4"]);
export const CopyIcon = icon(["M9 9h11v11H9z", "M15 5H4v11"]);
export const GripIcon = icon([
  "M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01",
]);
export const HelixLogoIcon = icon([
  "M7 4c5 3 5 5 10 8M17 4c-5 3-5 5-10 8M7 12c5 3 5 5 10 8M17 12c-5 3-5 5-10 8",
]);
