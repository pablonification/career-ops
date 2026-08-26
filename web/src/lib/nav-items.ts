import {
  IconLayoutDashboard,
  IconCompass,
  IconListCheck,
  IconSend,
  IconRadar,
  IconChartBar,
  IconFileText,
  IconSettings,
} from "@tabler/icons-react";
import type { ComponentType, SVGProps } from "react";

// Single source of truth for the app's primary destinations — shared by the
// desktop sidebar and the mobile nav so they can never drift.
export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chip?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: IconLayoutDashboard },
  { href: "/explore", label: "Explore", icon: IconCompass, chip: "New" },
  { href: "/pipeline", label: "Pipeline", icon: IconListCheck },
  { href: "/followups", label: "Follow-ups", icon: IconSend },
  { href: "/portals", label: "Portals", icon: IconRadar },
  { href: "/analytics", label: "Analytics", icon: IconChartBar },
  { href: "/cv", label: "CV", icon: IconFileText },
  { href: "/config", label: "Config", icon: IconSettings },
];

export function isActivePath(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
