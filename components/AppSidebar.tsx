import * as React from "react"
import {
    LayoutGrid, LifeBuoy, Activity, Calendar, ShoppingCart, Package,
    Network, Folder, Shield, ChevronDown, X, Users, Building2,
    Briefcase, Layers, Zap, PanelLeftClose, PanelLeft, Phone,
    Settings, Megaphone, Search, ChevronRight, Plus, Key,
    ChevronsUpDown, LogOut, User as UserIcon, Sparkles, BadgeCheck, Bell, CreditCard
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { APP_MENU_STRUCTURE } from '../constants';
import { UserAccount, UserGroup } from '../types';
import { useLanguage } from '../translations';
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
    LayoutDashboard: LayoutGrid,
    LifeBuoy: LifeBuoy,
    Activity: Activity,
    Calendar: Calendar,
    ShoppingCart: ShoppingCart,
    Cpu: Package,
    Network: Network,
    FolderOpen: Folder,
    Shield: Shield,
    Users: Users,
    Building2: Building2,
    Briefcase: Briefcase,
    Layers: Layers,
    Zap: Zap,
    Phone: Phone,
    Settings: Settings,
    Megaphone: Megaphone,
    Key: Key
};

interface AppSidebarProps {
    currentUser: UserAccount | null;
    groupDefinitions: UserGroup[];
    onLogout: () => void;
    appName?: string;
    logoUrl?: string;
}

export function AppSidebar({
    currentUser,
    groupDefinitions,
    onLogout,
    appName = "GESIT PORTAL",
    logoUrl = "/image/logo.png"
}: AppSidebarProps) {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const { state, isMobile } = useSidebar();

    const allowedMenuIds = React.useMemo(() => {
        const allowed = new Set<string>();
        const role = currentUser?.role?.toLowerCase() || '';
        const userGroups = currentUser?.groups || [];

        if (role.includes('admin') || role.includes('owner')) {
            APP_MENU_STRUCTURE.forEach(m => allowed.add(m.id));
            return allowed;
        }

        if (userGroups.length === 0) {
            ['helpdesk', 'asset-loan', 'extension-directory', 'profile'].forEach(id => allowed.add(id));
            return allowed;
        }

        userGroups.forEach(groupId => {
            const groupConfig = groupDefinitions?.find(g => g.id === groupId);
            if (groupConfig && Array.isArray(groupConfig.allowedMenus)) {
                groupConfig.allowedMenus.forEach(menuId => allowed.add(menuId));
            }
        });

        APP_MENU_STRUCTURE.forEach(menu => {
            if (menu.parentId && allowed.has(menu.id)) allowed.add(menu.parentId);
        });

        return allowed;
    }, [currentUser, groupDefinitions]);

    const navMain = React.useMemo(() => {
        const allMenus = APP_MENU_STRUCTURE;
        const parents = allMenus.filter(m => !m.parentId && m.id !== 'admin');
        
        return parents.map(parent => {
            if (!allowedMenuIds.has(parent.id)) return null;
            const children = allMenus.filter(m => m.parentId === parent.id);
            const allowedChildren = children.filter(child => allowedMenuIds.has(child.id));

            return {
                title: t(parent.id.replace(/-(.)/g, (_, c) => c.toUpperCase()) as any) || parent.label,
                url: parent.id === 'dashboard' ? '/' : `/${parent.id}`,
                icon: ICON_MAP[parent.iconName] || LayoutGrid,
                isActive: location.pathname === (parent.id === 'dashboard' ? '/' : `/${parent.id}`) || allowedChildren.some(c => location.pathname === `/${c.id}`),
                items: allowedChildren.length > 0 ? allowedChildren.map(c => ({
                    title: t(c.id.replace(/-(.)/g, (_, c) => c.toUpperCase()) as any) || c.label,
                    url: `/${c.id}`,
                })) : undefined
            };
        }).filter(Boolean);
    }, [allowedMenuIds, t, location.pathname]);

    const navAdmin = React.useMemo(() => {
        const allMenus = APP_MENU_STRUCTURE;
        const adminMenu = allMenus.find(m => m.id === 'admin');
        if (!adminMenu || !allowedMenuIds.has('admin')) return null;

        const children = allMenus.filter(m => m.parentId === 'admin');
        const allowedChildren = children.filter(child => allowedMenuIds.has(child.id));

        return {
            title: t('administration' as any) || "Administration",
            url: "/admin",
            icon: Shield,
            isActive: location.pathname.startsWith('/admin') || allowedChildren.some(c => location.pathname === `/${c.id}`),
            items: allowedChildren.map(c => ({
                title: t(c.id.replace(/-(.)/g, (_, c) => c.toUpperCase()) as any) || c.label,
                url: `/${c.id}`,
            }))
        };
    }, [allowedMenuIds, t, location.pathname]);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            onClick={() => navigate('/')}
                        >
                            <div className="flex ml-1 items-center justify-center">
                                <img src={logoUrl} alt="Logo" className="size-8 object-contain" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                                <span className="truncate font-black tracking-tight text-lg">
                                    Gesit Portal
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                
                {/* QUICK SEARCH BAR */}
                <div className="px-3 mt-4 mb-2">
                    <div className="relative group/search">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground/50 group-hover/search:text-primary transition-colors">
                            <Search size={16} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search for..." 
                            className="w-full bg-muted/40 dark:bg-slate-900 border border-border/50 rounded-xl h-11 pl-10 pr-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all group-hover/search:bg-muted/60"
                        />
                        <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none">
                            <div className="flex items-center gap-1 bg-background dark:bg-slate-800 border border-border/50 rounded px-1.5 py-0.5 shadow-sm">
                                <span className="text-[10px] font-black opacity-50">⌘</span>
                                <span className="text-[10px] font-black opacity-50">K</span>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="px-3 pt-4 custom-scrollbar">
                <SidebarGroup className="px-0">
                    <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground/30 mb-3 px-2">Main Menu</SidebarGroupLabel>
                    <SidebarMenu className="gap-1.5">
                        {navMain.map((item: any) => (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={item.isActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    {item.items ? (
                                        <>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton 
                                                    tooltip={item.title} 
                                                    isActive={item.isActive}
                                                    size="lg"
                                                    className={cn(
                                                        "transition-all duration-300 rounded-xl h-11 px-4 border-transparent border",
                                                        item.isActive 
                                                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-lg shadow-primary/25 border-primary/20" 
                                                            : "text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground"
                                                    )}
                                                >
                                                    {item.icon && <item.icon size={18} strokeWidth={item.isActive ? 2.5 : 2} />}
                                                    <span className={cn("font-bold text-sm tracking-tight", !item.isActive && "opacity-80")}>{item.title}</span>
                                                    <ChevronRight className={cn(
                                                        "ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90",
                                                        item.isActive ? "text-primary-foreground" : "text-muted-foreground/30"
                                                    )} />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="CollapsibleContent mt-1 ml-4 border-l border-border/50 pl-2">
                                                <SidebarMenuSub className="gap-1 border-none ml-0 pl-0">
                                                    {item.items.map((subItem: any) => {
                                                        const isSubActive = location.pathname === subItem.url;
                                                        return (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton 
                                                                    asChild 
                                                                    isActive={isSubActive}
                                                                    className={cn(
                                                                        "transition-all duration-200 rounded-lg h-9 px-4",
                                                                        isSubActive 
                                                                            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm font-extrabold" 
                                                                            : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 font-bold"
                                                                    )}
                                                                >
                                                                    <NavLink to={subItem.url}>
                                                                        <span className="text-xs">{subItem.title}</span>
                                                                    </NavLink>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </>
                                    ) : (
                                        <SidebarMenuButton 
                                            asChild 
                                            tooltip={item.title} 
                                            isActive={item.isActive}
                                            size="lg"
                                            className={cn(
                                                "transition-all duration-300 rounded-xl h-11 px-4 border-transparent border",
                                                item.isActive 
                                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-lg shadow-primary/25 border-primary/20" 
                                                    : "text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground"
                                            )}
                                        >
                                            <NavLink to={item.url}>
                                                {item.icon && <item.icon size={18} strokeWidth={item.isActive ? 2.5 : 2} />}
                                                <span className={cn("font-bold text-sm tracking-tight", !item.isActive && "opacity-80")}>{item.title}</span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            </Collapsible>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {navAdmin && (
                    <SidebarGroup className="group-data-[collapsible=icon]:hidden px-0">
                        <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.25em] font-black text-muted-foreground/30 mt-8 mb-3 px-2">Administration</SidebarGroupLabel>
                        <SidebarMenu className="gap-1.5">
                            <Collapsible
                                asChild
                                defaultOpen={navAdmin.isActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton 
                                            tooltip={navAdmin.title} 
                                            isActive={navAdmin.isActive}
                                            size="lg"
                                            className={cn(
                                                "transition-all duration-300 rounded-xl h-11 px-4 border-transparent border",
                                                navAdmin.isActive 
                                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-lg shadow-primary/25 border-primary/20" 
                                                    : "text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground"
                                            )}
                                        >
                                            <navAdmin.icon size={18} strokeWidth={navAdmin.isActive ? 2.5 : 2} />
                                            <span className={cn("font-bold text-sm tracking-tight", !navAdmin.isActive && "opacity-80")}>{navAdmin.title}</span>
                                            <ChevronRight className={cn(
                                                "ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90",
                                                navAdmin.isActive ? "text-primary-foreground" : "text-muted-foreground/30"
                                            )} />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="CollapsibleContent mt-1 ml-4 border-l border-border/50 pl-2">
                                        <SidebarMenuSub className="gap-1 border-none ml-0 pl-0">
                                            {navAdmin.items.map((subItem) => {
                                                const isAdminSubActive = location.pathname === subItem.url;
                                                return (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton 
                                                            asChild 
                                                            isActive={isAdminSubActive}
                                                            className={cn(
                                                                "transition-all duration-200 rounded-lg h-9 px-4",
                                                                isAdminSubActive 
                                                                    ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm font-extrabold" 
                                                                    : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 font-bold"
                                                            )}
                                                        >
                                                            <NavLink to={subItem.url}>
                                                                <span className="text-xs">{subItem.title}</span>
                                                            </NavLink>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="p-4 pt-0 gap-4 mt-auto">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-xl border border-transparent hover:border-border/50 transition-all h-14"
                                >
                                    <Avatar className="h-10 w-10 rounded-lg overflow-hidden border border-white/10 dark:border-slate-800 shadow-sm">
                                        <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.fullName || ""} className="aspect-square object-cover" />
                                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                                            {(currentUser?.fullName || "U").substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                                        <span className="truncate font-black tracking-tight">{currentUser?.fullName}</span>
                                        <span className="truncate text-[10px] font-black text-muted-foreground uppercase opacity-60">{currentUser?.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 opacity-30" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl shadow-2xl"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                                        <Avatar className="h-9 w-9 rounded-lg overflow-hidden shrink-0">
                                            <AvatarImage src={currentUser?.avatarUrl} alt={currentUser?.fullName || ""} className="aspect-square object-cover" />
                                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                                                {(currentUser?.fullName || "U").substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-bold">{currentUser?.fullName}</span>
                                            <span className="truncate text-xs text-muted-foreground">{currentUser?.email}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                                        <BadgeCheck className="mr-2 size-4" />
                                        Account
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/system-settings')}>
                                        <Settings className="mr-2 size-4" />
                                        Settings
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onLogout}>
                                    <LogOut className="mr-2 size-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* THEME SELECTOR - JEFF SU STYLE */}
                <div className="flex bg-muted/40 dark:bg-slate-900 border border-border/50 rounded-xl p-1 gap-1">
                    <button 
                        onClick={() => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }}
                        className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all hover:bg-background/80 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground"
                    >
                        <span className="flex items-center justify-center gap-2">
                             Light
                        </span>
                    </button>
                    <button 
                        onClick={() => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }}
                        className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all bg-background dark:bg-slate-800 shadow-sm text-foreground"
                    >
                        <span className="flex items-center justify-center gap-2">
                             Dark
                        </span>
                    </button>
                    <button 
                        className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all hover:bg-background/80 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground"
                    >
                        <span className="flex items-center justify-center gap-2">
                             Auto
                        </span>
                    </button>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
