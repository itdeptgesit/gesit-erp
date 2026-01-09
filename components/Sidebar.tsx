'use client';

import React, { useState, useMemo } from 'react';
import {
    LayoutGrid, LifeBuoy, Activity, Calendar, ShoppingCart, Package,
    Network, Folder, Shield, ChevronDown, ChevronRight, X, Users, Building2,
    Briefcase, Layers, Zap, ChevronLeft, PanelLeftClose, PanelLeft, Phone,
    Settings, Megaphone
} from 'lucide-react';
import { APP_MENU_STRUCTURE } from '../constants';
import { UserGroup } from '../types';
import { useLanguage } from '../translations';

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
    Megaphone: Megaphone
};

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    isMobileOpen: boolean;
    onClose: () => void;
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
    currentView, onNavigate, isMobileOpen, onClose,
    userGroups = [], userName, userRole, groupDefinitions = [],
    isCollapsed, setIsCollapsed, appName, logoUrl
}) => {
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['admin']);
    const { t } = useLanguage();

    const LOGO_URL = "https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png";

    const allowedMenuIds = useMemo(() => {
        const allowed = new Set<string>();
        if (userRole === 'Admin') {
            APP_MENU_STRUCTURE.forEach(m => allowed.add(m.id));
            return allowed;
        }
        if (!userGroups || !Array.isArray(userGroups) || userGroups.length === 0) {
            allowed.add('dashboard');
            return allowed;
        }
        userGroups.forEach(groupId => {
            const groupConfig = groupDefinitions?.find(g => g.id === groupId);
            if (groupConfig && Array.isArray(groupConfig.allowedMenus)) {
                groupConfig.allowedMenus.forEach(menuId => allowed.add(menuId));
            }
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
            const getLabel = (id: string) => {
                const key = id.replace(/-(.)/g, (_, c) => c.toUpperCase()) as any;
                return t(key) || parent.label;
            };
            return {
                id: parent.id,
                label: getLabel(parent.id),
                icon: ICON_MAP[parent.iconName] || LayoutGrid,
                subItems: allowedChildren.length > 0 ? allowedChildren.map(c => ({
                    id: c.id,
                    label: getLabel(c.id),
                    icon: ICON_MAP[c.iconName]
                })) : undefined
            };
        }).filter(Boolean);
    }, [allowedMenuIds, t]);

    const toggleMenu = (menuId: string) => {
        if (isCollapsed) {
            setIsCollapsed(false);
            setExpandedMenus([menuId]);
            return;
        }
        setExpandedMenus(prev => prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]);
    };

    const renderLink = (item: any) => {
        const hasSub = !!item.subItems;
        const isExpanded = expandedMenus.includes(item.id);
        const isActive = currentView === item.id || (hasSub && item.subItems?.some((s: any) => s.id === currentView));
        const Icon = item.icon;

        return (
            <div key={item.id} className="px-3 mb-1">
                <button
                    onClick={() => hasSub ? toggleMenu(item.id) : onNavigate(item.id)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all group ${isActive && !hasSub
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    title={isCollapsed ? item.label : ''}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={20} className={isActive && !hasSub ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500'} strokeWidth={2} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {hasSub && !isCollapsed && <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-slate-300`} />}
                </button>

                {hasSub && isExpanded && !isCollapsed && (
                    <div className="flex flex-col gap-1 mt-1 ml-4 border-l border-slate-100 dark:border-slate-800 pl-2 animate-in slide-in-from-top-1 duration-200">
                        {item.subItems?.map((sub: any) => {
                            const isSubItemActive = currentView === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    onClick={() => onNavigate(sub.id)}
                                    className={`w-full text-left pl-6 pr-4 py-2 rounded-lg text-xs font-semibold transition-all ${isSubItemActive
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50'
                                        : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/50'
                                        }`}
                                >
                                    {sub.label}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {isMobileOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm transition-all" onClick={onClose} />}
            <aside className={`fixed top-0 left-0 bottom-0 z-50 bg-white dark:bg-[#0f172a] border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className={`px-6 py-8 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <img src={logoUrl || LOGO_URL} alt="Logo" className="h-8 w-auto min-w-[32px]" />
                    {!isCollapsed && (
                        <div className="flex flex-col animate-in fade-in duration-300">
                            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                                {appName ? appName.split(' ')[0] : 'Gesit'} <span className="text-blue-600">{appName ? appName.split(' ').slice(1).join(' ') : 'ERP'}</span>
                            </h1>
                            <p className="text-[10px] font-semibold text-slate-300 mt-1 tracking-widest uppercase">System</p>
                        </div>
                    )}
                    <button onClick={onClose} className="md:hidden ml-auto p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 no-scrollbar">
                    <div className="mb-6">
                        {!isCollapsed && <p className="px-8 text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Core</p>}
                        {menuItems.filter((m: any) => !['admin'].includes(m.id)).map(renderLink)}
                    </div>
                    <div>
                        {!isCollapsed && <p className="px-8 text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4">Admin</p>}
                        {menuItems.filter((m: any) => m.id === 'admin').map(renderLink)}
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-slate-50 dark:border-slate-800/50">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all group`}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                        {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Hide Panel</span>}
                    </button>

                    {!isCollapsed && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mt-4 animate-in fade-in zoom-in duration-300">
                            <button onClick={() => onNavigate('profile')} className="w-full flex items-center gap-3.5 text-left group">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                                    {userName ? userName.substring(0, 2).toUpperCase() : 'GS'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-none mb-1">{userName || 'User'}</p>
                                    <p className="text-[10px] font-semibold text-slate-400 truncate tracking-widest uppercase">{userRole || 'Staff'}</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};