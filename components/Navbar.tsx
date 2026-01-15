'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    LayoutGrid, LifeBuoy, Activity, Calendar, ShoppingCart, Package,
    Network, Folder, Shield, ChevronDown, Users, Building2,
    Briefcase, Layers, Zap, Phone, Settings, Megaphone
} from 'lucide-react';
import { APP_MENU_STRUCTURE } from '../constants';
import { UserGroup } from '../types';
import { useLanguage } from '../translations';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

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

interface NavbarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    userGroups: string[];
    userRole?: string;
    groupDefinitions: UserGroup[];
}

export const Navbar: React.FC<NavbarProps> = ({
    currentView, onNavigate, userGroups = [], userRole, groupDefinitions = []
}) => {
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
    const { t } = useLanguage();
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setActiveSubMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allowedMenuIds = useMemo(() => {
        const allowed = new Set<string>();
        if (userRole === 'Admin') {
            APP_MENU_STRUCTURE.forEach(m => allowed.add(m.id));
            return allowed;
        }
        if (!userGroups || userGroups.length === 0) {
            allowed.add('dashboard');
            return allowed;
        }
        userGroups.forEach(groupId => {
            const groupConfig = groupDefinitions?.find(g => g.id === groupId);
            if (groupConfig?.allowedMenus) {
                groupConfig.allowedMenus.forEach(menuId => allowed.add(menuId));
            }
        });
        return allowed;
    }, [userGroups, groupDefinitions, userRole]);

    const menuItems = useMemo(() => {
        const parents = APP_MENU_STRUCTURE.filter(m => !m.parentId);
        return parents.map(parent => {
            if (!allowedMenuIds.has(parent.id)) return null;
            const children = APP_MENU_STRUCTURE.filter(m => m.parentId === parent.id);
            const allowedChildren = children.filter(child => allowedMenuIds.has(child.id));

            const getLabel = (id: string, defaultLabel: string) => {
                const key = id.replace(/-(.)/g, (_, c) => c.toUpperCase()) as any;
                return t(key) || defaultLabel;
            };

            return {
                id: parent.id,
                label: getLabel(parent.id, parent.label),
                icon: ICON_MAP[parent.iconName] || LayoutGrid,
                subItems: allowedChildren.length > 0 ? allowedChildren.map(c => ({
                    id: c.id,
                    label: getLabel(c.id, c.label),
                    icon: ICON_MAP[c.iconName]
                })) : undefined
            };
        }).filter(Boolean);
    }, [allowedMenuIds, t]);

    return (
        <div
            className="w-full bg-white/70 dark:bg-[#020617]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-16 z-40 transition-all hidden md:flex justify-center py-3.5 px-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none"
            ref={navRef}
        >
            <nav className="flex items-center gap-3 max-w-[1400px] w-full">
                <LayoutGroup>
                    {menuItems.map((item: any) => {
                        const hasSub = !!item.subItems;
                        const isActive = currentView === item.id || (hasSub && item.subItems?.some((s: any) => s.id === currentView));
                        const Icon = item.icon;

                        return (
                            <div key={item.id} className="relative flex flex-col items-center shrink-0">
                                <motion.button
                                    onClick={() => {
                                        if (hasSub) setActiveSubMenu(activeSubMenu === item.id ? null : item.id);
                                        else { onNavigate?.(item.id); setActiveSubMenu(null); }
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-bold transition-colors duration-300 tracking-tight whitespace-nowrap z-10
                                        ${isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-blue-50/90 dark:bg-blue-900/40 shadow-[0_10px_20px_-5px_rgba(37,99,235,0.2)] ring-1 ring-blue-500/20 rounded-2xl z-[-1]"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}

                                    <Icon size={20} className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} transition-colors duration-300`} strokeWidth={isActive ? 2.5 : 2} />

                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}

                                    {hasSub && (
                                        <ChevronDown size={12} className={`transition-transform duration-300 ${activeSubMenu === item.id ? 'rotate-180' : ''} ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                                    )}
                                </motion.button>

                                {/* Active Indicator Dot */}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-dot"
                                        className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)] z-20"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}

                                <AnimatePresence>
                                    {hasSub && activeSubMenu === item.id && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                                            className="absolute top-[calc(100%+8px)] left-0 w-64 bg-white dark:bg-[#0f172a] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 py-3 z-50 overflow-hidden ring-1 ring-slate-900/5"
                                        >
                                            <div className="px-5 py-2 mb-2 border-b border-slate-50 dark:border-slate-800/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{item.label} Services</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5 px-1.5">
                                                {item.subItems.map((sub: any, idx: number) => (
                                                    <motion.button
                                                        key={sub.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        onClick={() => { onNavigate?.(sub.id); setActiveSubMenu(null); }}
                                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[11px] font-bold transition-all duration-200 tracking-tight
                                                            ${currentView === sub.id
                                                                ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-900/30'
                                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}`}
                                                    >
                                                        {sub.icon && <sub.icon size={16} className={currentView === sub.id ? 'text-blue-600' : 'opacity-40'} />}
                                                        {sub.label}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </LayoutGroup>
            </nav>
        </div>
    );
};
