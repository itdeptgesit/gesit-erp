'use client';

import React, { useState, useMemo } from 'react';
import {
    LayoutGrid, LifeBuoy, Activity, Calendar, ShoppingCart, Package,
    Network, Folder, Shield, ChevronDown, X, Users, Building2,
    Briefcase, Layers, Zap, PanelLeftClose, PanelLeft, Phone,
    Settings, Megaphone, Search, ChevronRight, Plus, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_MENU_STRUCTURE } from '../constants';
import { UserGroup } from '../types';
import { useLanguage } from '../translations';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

// SHADCN UI IMPORTS
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
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

interface SidebarProps {
    currentView: string;
    onClose: () => void;
    isMobileOpen: boolean;
    userGroups: string[];
    userName: string;
    userRole?: string;
    groupDefinitions: UserGroup[];
    isCollapsed: boolean;
    setIsCollapsed: (val: boolean) => void;
    appName?: string;
    logoUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentView, onClose, isMobileOpen,
    userGroups = [], userName, userRole, groupDefinitions = [],
    isCollapsed, setIsCollapsed, appName, logoUrl
}) => {
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['admin']);
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const allowedMenuIds = useMemo(() => {
        const allowed = new Set<string>();
        const role = userRole?.toLowerCase() || '';

        if (role.includes('admin') || role.includes('owner')) {
            APP_MENU_STRUCTURE.forEach(m => allowed.add(m.id));
            return allowed;
        }

        if (!userGroups || !Array.isArray(userGroups) || userGroups.length === 0) {
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
    }, [userGroups, groupDefinitions, userRole]);

    const menuItems = useMemo(() => {
        const allMenus = APP_MENU_STRUCTURE;
        const parents = allMenus.filter(m => !m.parentId);
        return parents.map(parent => {
            if (!allowedMenuIds.has(parent.id)) return null;
            const children = allMenus.filter(m => m.parentId === parent.id);
            const allowedChildren = children.filter(child => allowedMenuIds.has(child.id));

            const finalChildren = [...allowedChildren];
            const roleStr = userRole?.toLowerCase() || '';
            const isITorAdmin = roleStr.includes('admin') || roleStr.includes('staff') || userGroups.some(g => g.toLowerCase().includes('admin') || g.toLowerCase().includes('staff'));

            if (parent.id === 'dashboard' && allowedChildren.length > 0 && isITorAdmin) {
                finalChildren.unshift({ id: 'dashboard', label: 'Summary', iconName: 'LayoutGrid' });
            }

            const getLabel = (id: string) => {
                const key = id.replace(/-(.)/g, (_, c) => c.toUpperCase()) as any;
                return t(key) || parent.label;
            };
            return {
                id: parent.id,
                label: getLabel(parent.id),
                icon: ICON_MAP[parent.iconName] || LayoutGrid,
                subItems: finalChildren.length > 0 ? finalChildren.map(c => ({
                    id: c.id,
                    label: c.label === parent.label && c.id === parent.id ? 'Summary' : getLabel(c.id),
                    icon: ICON_MAP[c.iconName]
                })) : undefined
            };
        }).filter(Boolean);
    }, [allowedMenuIds, t, userRole, userGroups]);

    const toggleMenu = (menuId: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setTimeout(() => setExpandedMenus([menuId]), 200);
            return;
        }
        setExpandedMenus(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]);
    };

    const renderLink = (item: any) => {
        const hasSub = !!item.subItems;
        const isExpanded = expandedMenus.includes(item.id);
        const Icon = item.icon;
        const path = item.id === 'dashboard' ? '/' : `/${item.id}`;

        const isActive = location.pathname === path || (item.id === 'dashboard' && location.pathname === '/');

        if (hasSub) {
            const isSubItemActive = item.subItems?.some((s: any) => location.pathname === (s.id === 'dashboard' ? '/' : `/${s.id}`));

            return (
                <Collapsible
                    key={item.id}
                    open={isExpanded}
                    onOpenChange={() => toggleMenu(item.id)}
                    className="mb-1"
                >
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full flex items-center justify-between px-3 h-11 group relative transition-all duration-200",
                                isCollapsed && "justify-center px-0",
                                isSubItemActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/20 shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            {/* Indicator handled in text/icon color and background below */}
                            <div className="flex items-center gap-3 w-full">
                                <Icon
                                    size={18}
                                    className={cn(
                                        "shrink-0",
                                        isSubItemActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                    strokeWidth={isSubItemActive ? 2.5 : 2}
                                />
                                {!isCollapsed && (
                                    <span className={cn("truncate text-sm flex-1 text-left", isSubItemActive ? "font-bold" : "font-medium")}>
                                        {item.label}
                                    </span>
                                )}
                            </div>
                            {!isCollapsed && (
                                <ChevronDown
                                    size={14}
                                    className={cn(
                                        "shrink-0 transition-transform duration-200",
                                        isExpanded && "rotate-180",
                                        isSubItemActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                />
                            )}

                            {/* Elegant right indicator */}
                            {isSubItemActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
                            )}
                        </Button>
                    </CollapsibleTrigger>

                    {!isCollapsed && (
                        <CollapsibleContent className="CollapsibleContent px-3 pb-1 pt-1 ml-4 border-l border-border/10 dark:border-white/[0.03] mt-1">
                            <div className="flex flex-col gap-1">
                                {item.subItems?.map((sub: any) => {
                                    const subPath = sub.id === 'dashboard' ? '/' : `/${sub.id}`;
                                    const isSubActive = location.pathname === subPath;
                                    return (
                                        <Button
                                            key={sub.id}
                                            variant="ghost"
                                            asChild
                                            className={cn(
                                                "w-full justify-start h-9 px-3 text-xs relative transition-all duration-200",
                                                isSubActive
                                                    ? "text-primary font-bold bg-primary/5"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                                            )}
                                        >
                                            <NavLink to={subPath} onClick={onClose}>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-1 h-1 rounded-full transition-all",
                                                        isSubActive ? "bg-primary scale-125 shadow-[0_0_8px_rgba(59,130,246,0.4)]" : "bg-muted-foreground/30"
                                                    )} />
                                                    {sub.label}
                                                </div>
                                            </NavLink>
                                        </Button>
                                    );
                                })}
                            </div>
                        </CollapsibleContent>
                    )}
                </Collapsible>
            );
        }

        return (
            <div key={item.id} className="mb-1">
                <Button
                    variant="ghost"
                    asChild
                    className={cn(
                        "w-full flex items-center justify-start gap-3 h-11 px-3 relative group transition-all duration-200",
                        isCollapsed && "justify-center px-0",
                        isActive
                            ? "bg-primary/10 text-primary dark:bg-primary/20 shadow-sm font-bold"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground font-medium"
                    )}
                >
                    <NavLink to={path} onClick={onClose}>
                        {/* Elegant right indicator */}
                        {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
                        )}
                        <Icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={cn(
                                "shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )}
                        />
                        {!isCollapsed && (
                            <span className={cn("truncate text-sm", isActive ? "font-bold" : "font-medium")}>
                                {item.label}
                            </span>
                        )}

                        {/* Indicator removed here as it is moved above */}
                    </NavLink>
                </Button>
            </div>
        );
    };

    return (
        <>
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                animate={{ width: isCollapsed ? 80 : 260 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                    "fixed top-0 left-0 bottom-0 z-50 bg-card dark:bg-slate-950 border-r border-border/10 dark:border-slate-800/50 flex flex-col transition-all duration-300",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full",
                    "md:translate-x-0 md:static overflow-hidden shadow-sm dark:shadow-none"
                )}
            >
                {/* Brand Logo */}
                <div
                    className={cn(
                        "h-20 flex items-center shrink-0 transition-all cursor-pointer px-6 mb-2 border-b border-transparent dark:border-slate-800/30",
                        isCollapsed && "justify-center px-0"
                    )}
                    onClick={() => navigate('/')}
                >
                    <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
                        <img
                            src={logoUrl || "/image/logo.png"}
                            alt="Logo"
                            className="w-9 h-9 object-contain"
                        />
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col justify-center leading-tight min-w-0 ml-3">
                            <h1 className="flex items-baseline gap-1">
                                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                                    Gesit
                                </span>
                                <span className="text-xl font-bold tracking-tight text-[#4f46e5] dark:text-indigo-400 leading-none">
                                    Portal
                                </span>
                            </h1>
                            <p className="text-[7.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] whitespace-nowrap mt-1">
                                Enterprise Work Platform
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3">
                    <div className="mb-6">
                        {!isCollapsed && <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Main Menu</p>}
                        <div className="space-y-0.5">
                            {menuItems.filter((m: any) => m.id !== 'admin').map(renderLink)}
                        </div>
                    </div>

                    {menuItems.some((m: any) => m.id === 'admin') && (
                        <div className="mb-6 border-t border-border/10 dark:border-slate-800/50 pt-6">
                            {!isCollapsed && <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Administration</p>}
                            <div className="space-y-0.5">
                                {menuItems.filter((m: any) => m.id === 'admin').map(renderLink)}
                            </div>
                        </div>
                    )}
                </div>

            </motion.aside>
        </>
    );
};