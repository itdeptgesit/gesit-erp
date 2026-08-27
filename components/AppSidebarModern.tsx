"use client"

import * as React from "react"
import { useLocation } from "react-router-dom"
import {
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavGroup, type NavItem } from "@/components/nav-group"
import { NavUser } from "@/components/nav-user"
import { APP_MENU_STRUCTURE } from "../constants"
import { UserAccount, UserGroup } from "../types"
import { useLanguage } from "../translations"

// LUCIDE ICONS — native SVG, fully compatible with Shadcn's [&>svg]:size-4
import {
  Home,
  HelpCircle,
  Activity,
  Calendar,
  ShoppingCart,
  Package,
  Server,
  FolderOpen,
  Shield,
  Users,
  Building2,
  Briefcase,
  Layers,
  Zap,
  Phone,
  Settings,
  Megaphone,
  Key,
  User,
  LayoutGrid,
  Receipt,
  ArrowLeftRight,
  FileCheck,
  Fingerprint,
  History,
  Scale,
  BriefcaseBusiness,
  CheckSquare,
  FileText,
  BarChart2,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard: Home,
  LifeBuoy: HelpCircle,
  Activity: Activity,
  Calendar: Calendar,
  ShoppingCart: ShoppingCart,
  Cpu: Package,
  Network: Server,
  FolderOpen: FolderOpen,
  Shield: Shield,
  Users: Users,
  Building2: Building2,
  Briefcase: Briefcase,
  Layers: Layers,
  Zap: Zap,
  Phone: Phone,
  Settings: Settings,
  Megaphone: Megaphone,
  Key: Key,
  User: User,
  Receipt: Receipt,
  ArrowLeftRight: ArrowLeftRight,
  FileCheck: FileCheck,
  Fingerprint: Fingerprint,
  History: History,
  Scale: Scale,
  BriefcaseBusiness: BriefcaseBusiness,
  CheckSquare: CheckSquare,
  FileText: FileText,
  BarChart2: BarChart2,
}

interface AppSidebarProps {
  currentUser: UserAccount | null
  groupDefinitions: UserGroup[]
  onLogout: () => void
  onNavigate?: (view: string) => void
  appName?: string
  logoUrl?: string
}

export function AppSidebarModern({
  currentUser,
  groupDefinitions,
  onLogout,
  onNavigate,
  appName = "Gesit Portal",
  logoUrl = "/image/logo.png",
}: AppSidebarProps) {
  const { t } = useLanguage()
  const location = useLocation()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const allowedMenuIds = React.useMemo(() => {
    const allowed = new Set<string>()
    const role = currentUser?.role?.toLowerCase() || ""
    const userGroups = currentUser?.groups || []

    if (role.includes("admin") || role.includes("owner")) {
      APP_MENU_STRUCTURE.forEach((m) => allowed.add(m.id))
      return allowed
    }

    if (userGroups.length === 0) {
      ;["helpdesk", "asset-loan", "extension-directory", "profile"].forEach((id) =>
        allowed.add(id)
      )
      return allowed
    }

    userGroups.forEach((groupId) => {
      const groupConfig = groupDefinitions?.find((g) => g.id === groupId)
      if (groupConfig && Array.isArray(groupConfig.allowedMenus)) {
        groupConfig.allowedMenus.forEach((menuId) => allowed.add(menuId))
      }
    })

    APP_MENU_STRUCTURE.forEach((menu) => {
      if (menu.parentId && allowed.has(menu.id)) allowed.add(menu.parentId)
    })

    return allowed
  }, [currentUser, groupDefinitions])

  const mainItems: NavItem[] = React.useMemo(() => {
    const allMenus = APP_MENU_STRUCTURE
    return allMenus
      .filter((m) => !m.parentId && m.id !== "admin" && allowedMenuIds.has(m.id))
      .map((m) => ({
        title:
          t(
            m.id.replace(/-(.)/g, (_: string, c: string) =>
              c.toUpperCase()
            ) as any
          ) || m.label,
        url: m.id === "dashboard" ? "/" : `/${m.id}`,
        icon: ICON_MAP[m.iconName] || LayoutGrid,
        isActive: location.pathname === (m.id === "dashboard" ? "/" : `/${m.id}`),
        items: allMenus
          .filter((c) => c.parentId === m.id && allowedMenuIds.has(c.id))
          .map((c) => ({
            title:
              t(
                c.id.replace(/-(.)/g, (_: string, ch: string) =>
                  ch.toUpperCase()
                ) as any
              ) || c.label,
            url: `/${c.id}`,
            icon: ICON_MAP[c.iconName] || LayoutGrid,
          })),
      }))
  }, [allowedMenuIds, t, location.pathname])

  const adminItems: NavItem[] = React.useMemo(() => {
    const allMenus = APP_MENU_STRUCTURE
    const adminNode = allMenus.find((m) => m.id === "admin")
    if (!adminNode || !allowedMenuIds.has("admin")) return []
    
    return [
      {
        title: t('settingsAndSetup'),
        url: "/admin",
        icon: ICON_MAP[adminNode.iconName] || LayoutGrid,
        isActive: false,
        items: allMenus
          .filter((c) => c.parentId === "admin" && allowedMenuIds.has(c.id))
          .map((c) => ({
            title:
              t(
                c.id.replace(/-(.)/g, (_: string, ch: string) =>
                  ch.toUpperCase()
                ) as any
              ) || c.label,
            url: `/${c.id}`,
            icon: ICON_MAP[c.iconName] || LayoutGrid,
          })),
      },
    ]
  }, [allowedMenuIds, t])

  const userData = currentUser
    ? {
        name: currentUser.fullName,
        email: currentUser.email,
        avatar: currentUser.avatarUrl || "/avatars/default.jpg",
      }
    : {
        name: "Guest",
        email: "",
        avatar: "/avatars/default.jpg",
      }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center">
                <img src={logoUrl} alt={appName} className="size-8 object-contain" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">{appName}</span>
                <span className="truncate text-xs text-muted-foreground">{t('enterprisePlatform')}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup title={t('mainMenu')} items={mainItems} />
        {adminItems.length > 0 && <NavGroup title={t('administrationGroup')} items={adminItems} />}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} onLogout={onLogout} onNavigate={onNavigate} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
