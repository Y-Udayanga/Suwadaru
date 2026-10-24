import type React from "react"

/**
 * NavItem — a single navigation destination used by AppShell sidebar and
 * mobile nav drawer. Frontend B must not change this interface.
 */
export interface NavItem {
  /** Absolute path or React Router `to` target */
  to: string
  /** Text label always shown — never icon-only in accessible nav */
  label: string
  /** Lucide icon component (rendered at aria-hidden) */
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>
  /** If true the NavLink match is exact (default false) */
  end?: boolean
  /** Visual group the item belongs to for sidebar section headers */
  group?: "main" | "child"
}

/**
 * ChildNavContext — provided by AppShell to child-scoped nav items.
 * Lets the child name appear dynamically in sidebar section labels.
 */
export interface ChildNavContext {
  childId: string
  childName: string
}

/**
 * AppShellProps — props accepted by the AppShell layout component.
 *
 * AppShell renders:
 *  - Desktop: 256 px collapsible sidebar + top bar + main area
 *  - Mobile (< 768 px): top bar + slide-in drawer + main area
 *
 * The <Outlet /> is rendered inside the "selected-child slot" (`<main>`).
 * Do not put page-level elements outside AppShell.
 */
export interface AppShellProps {
  /** Not needed as a prop — children come from <Outlet /> */
  _never?: never
}
