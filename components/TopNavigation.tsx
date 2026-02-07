'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Bell, Menu, ChevronDown, LogOut, User, Sun, Moon, Check,
    Info, AlertTriangle, AlertCircle, LayoutGrid,
    LifeBuoy, Activity, Calendar, ShoppingCart, Package, Network, Folder,
    Shield, Users, Building2, Briefcase, Layers, Zap, Phone, Megaphone,
    Search, X, Share2
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';
import { NotificationItem, UserGroup } from '../types';
import { APP_MENU_STRUCTURE } from '../constants';

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
    Settings: Megaphone,
    Megaphone: Megaphone
};

interface TopNavigationProps {
    onMenuClick: () => void;
    onLogout?: () => void;
    userGroups?: string[];
    userRole?: string;
    groupDefinitions?: UserGroup[];
    user?: {
        name: string;
        role: string;
        email?: string;
        jobTitle?: string;
        avatarUrl?: string;
    };
    appName?: string;
    logoUrl?: string;
    variant?: 'admin' | 'public';
    searchProps?: {
        value: string;
        onChange: (val: string) => void;
    };
    floorFilter?: 'All' | 26 | 27;
    onFloorFilterChange?: (floor: 'All' | 26 | 27) => void;
    onShare?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
    onMenuClick, onLogout,
    userGroups = [], userRole, groupDefinitions = [],
    user, appName = 'GESIT WORK', logoUrl,
    variant = 'admin', searchProps,
    floorFilter = 'All', onFloorFilterChange, onShare
}) => {
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const { language, setLanguage, t } = useLanguage();

    const navigate = useNavigate();
    const location = useLocation();
    const currentView = location.pathname.substring(1) || 'dashboard';

    const navRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const userName = user?.name || 'User';
    const LOGO_URL = "/image/logo.png";

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
            if (navRef.current && !navRef.current.contains(event.target as Node)) setActiveSubMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!user?.email) return;
        const fetchNotifications = async () => {
            const { data } = await supabase.from('notifications').select('*').eq('user_email', user.email).order('created_at', { ascending: false }).limit(10);
            if (data) setNotifications(data.map((n: any) => ({
                id: n.id, userId: n.user_email, title: n.title, message: n.message, type: n.type, isRead: n.is_read, createdAt: n.created_at, link: n.link
            })));
        };
        fetchNotifications();
    }, [user?.email]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const allowedMenuIds = useMemo(() => {
        const allowed = new Set<string>();
        const role = userRole?.toLowerCase() || '';

        // Public/Default allowed menus
        allowed.add('extension-directory');
        allowed.add('helpdesk');

        if (role.includes('admin') || role.includes('owner')) {
            APP_MENU_STRUCTURE.forEach(m => allowed.add(m.id));
            return allowed;
        }

        if (!user || (!userGroups || userGroups.length === 0)) {
            // Unauthenticated or user without groups only gets public menus
            return allowed;
        }

        userGroups.forEach(groupId => {
            const groupConfig = groupDefinitions?.find(g => g.id === groupId);
            if (groupConfig?.allowedMenus) groupConfig.allowedMenus.forEach(menuId => allowed.add(menuId));
        });

        APP_MENU_STRUCTURE.forEach(menu => {
            if (menu.parentId && allowed.has(menu.id)) allowed.add(menu.parentId);
        });

        return allowed;
    }, [user, userGroups, groupDefinitions, userRole]);

    const menuItems = useMemo(() => {
        const parents = APP_MENU_STRUCTURE.filter(m => !m.parentId);
        return parents.map(parent => {
            if (!allowedMenuIds.has(parent.id)) return null;
            const children = APP_MENU_STRUCTURE.filter(m => m.parentId === parent.id);
            const allowedChildren = children.filter(child => allowedMenuIds.has(child.id));
            const formatLabel = (text: string) => {
                // Convert camelCase or kebab-case to Title Case
                return text
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim();
            };

            const getLabel = (id: string, defaultLabel: string) => {
                const key = id.replace(/-(.)/g, (_, c) => c.toUpperCase()) as any;
                const translated = t(key);
                if (translated && translated !== key) return translated;
                return formatLabel(defaultLabel || id);
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
        <div className="sticky top-0 z-50 flex flex-col w-full">
            {/* HEADER - Different layout for public vs admin */}
            {variant === 'public' ? (
                // PUBLIC VARIANT - Modern TGC Directory Style
                <header className="relative z-20 h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 md:px-12 flex items-center justify-between transition-all">
                    {/* Logo & Title - Left */}
                    <NavLink to="/" className="flex items-center gap-4 group shrink-0">
                        <div className="w-12 h-12 flex items-center justify-center transition-all group-hover:scale-105">
                            <img src="/image/logo.png" alt="Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110 object-contain" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                TGC Directory
                            </h1>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-bold tracking-wider uppercase">Internal Extensions</p>
                        </div>
                    </NavLink>

                    {/* Search Bar - Center */}
                    {searchProps && (
                        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                            <div className="relative group">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors pointer-events-none ${searchProps.value ? 'text-primary' : 'text-slate-400'}`} />
                                <input
                                    type="text"
                                    placeholder="Search extensions..."
                                    className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-primary outline-none transition-all"
                                    value={searchProps.value}
                                    onChange={(e) => searchProps.onChange(e.target.value)}
                                />
                                {searchProps.value && (
                                    <button
                                        onClick={() => searchProps.onChange("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                        aria-label="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Right Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Floor Filter Buttons */}
                        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => onFloorFilterChange?.('All')}
                                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${floorFilter === 'All' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                ALL
                            </button>
                            <button
                                onClick={() => onFloorFilterChange?.(27)}
                                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${floorFilter === 27 ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                27F
                            </button>
                            <button
                                onClick={() => onFloorFilterChange?.(26)}
                                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${floorFilter === 26 ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                26F
                            </button>
                        </div>

                        {/* Share Button */}
                        <button
                            onClick={onShare}
                            className="p-3 text-slate-500 hover:text-primary transition-all hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            title="Share"
                        >
                            <Share2 size={18} />
                        </button>

                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} aria-label="Toggle light/dark theme" className="p-3 text-slate-500 hover:text-primary transition-all hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </header>
            ) : (
                // ADMIN VARIANT - Original layout
                <header className="relative z-20 h-14 bg-white/95 dark:bg-[#020617]/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 md:px-8 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-4">
                        <button onClick={onMenuClick} aria-label="Open sidebar menu" className="md:hidden p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
                            <Menu size={20} />
                        </button>
                        <NavLink to="/" className="flex items-center gap-3 group">
                            <img src={logoUrl || LOGO_URL} alt="Logo" className="h-8 w-8 transition-transform duration-300 group-hover:scale-110 object-contain" />
                            <div className="flex flex-col leading-tight">
                                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                                    <span>{appName.split(' ')[0]}</span>
                                    <span className="text-primary">{appName.split(' ').slice(1).join(' ')}</span>
                                </h1>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 tracking-[0.2em] mt-0.5 hidden md:block uppercase">Enterprise Work Platform</p>
                            </div>
                        </NavLink>
                    </div>

                    <div className="flex items-center gap-3 pl-4">
                        {/* Language Toggle */}
                        <div className="hidden sm:flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                            <button onClick={() => setLanguage('en')} className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}>EN</button>
                            <button onClick={() => setLanguage('id')} className={`px-2 py-0.5 text-[9px] font-black rounded transition-all ${language === 'id' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}>ID</button>
                        </div>

                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} aria-label="Toggle light/dark theme" className="p-2 text-slate-400 hover:text-primary transition-all">
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {user ? (
                            <>
                                <div className="relative" ref={notificationRef}>
                                    <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} aria-label="View notifications" className={`p-2 rounded-lg transition-all ${isNotificationOpen ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-primary'}`}>
                                        <Bell size={18} />
                                        {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-[#020617]"></span>}
                                    </button>
                                    <AnimatePresence>
                                        {isNotificationOpen && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100]">
                                                <div className="px-4 py-2 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Notifications</h3>
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto">
                                                    {notifications.length === 0 ? <div className="py-6 text-center text-[10px] text-slate-400">All caught up!</div> : notifications.map(n => (
                                                        <div key={n.id} onClick={() => { markAsRead(n.id); if (n.link) navigate(n.link); setIsNotificationOpen(false); }} className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b last:border-0 dark:border-slate-700 ${!n.isRead ? 'bg-primary/5' : ''}`}>
                                                            <p className="text-[11px] font-bold mb-1">{n.title}</p>
                                                            <p className="text-[10px] text-slate-500 line-clamp-1">{n.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="relative ml-2" ref={dropdownRef}>
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 pl-3 border-l dark:border-slate-700">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-medium text-slate-500 leading-none mb-1">Welcome,</p>
                                            <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200 leading-none">{userName}</p>
                                        </div>
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center text-white text-[10px] font-black overflow-hidden">
                                                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                        </div>
                                        <ChevronDown size={12} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-4 w-56 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-[100] ring-1 ring-black/5 overflow-hidden"
                                            >
                                                <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800/50 mb-1 bg-slate-50/30 dark:bg-white/[0.02]">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{user?.role || 'Staff Member'}</p>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{userName}</p>
                                                </div>
                                                <div className="px-2 space-y-0.5">
                                                    <button onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all tracking-wide group">
                                                        <User size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        Account Profile
                                                    </button>
                                                    <button onClick={() => { onLogout?.(); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all tracking-wide group">
                                                        <LogOut size={14} className="text-rose-400 group-hover:text-rose-500 transition-colors" />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <NavLink
                                to="/login"
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
                            >
                                <Zap size={14} fill="currentColor" />
                                Sign In
                            </NavLink>
                        )}
                    </div>
                </header>
            )}

            {/* ROW 2: PRIMARY NAVIGATION (Pill-style Navbar) - Hidden for public variant */}
            {variant !== 'public' && (
                <nav className="relative z-10 h-12 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 hidden md:flex items-center justify-center px-4" ref={navRef}>
                    <LayoutGroup>
                        <div className="flex items-center justify-center gap-1 w-full max-w-screen-2xl">
                            {menuItems.map((item: any) => {
                                const hasSub = !!item.subItems;
                                const Icon = item.icon;
                                const isSubActive = item.subItems?.some((s: any) => currentView === s.id);
                                const path = item.id === 'dashboard' ? '/' : `/${item.id}`;

                                if (hasSub) {
                                    return (
                                        <div key={item.id} className="relative">
                                            <motion.button
                                                onClick={() => setActiveSubMenu(activeSubMenu === item.id ? null : item.id)}
                                                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all z-10
                            ${isSubActive ? 'text-primary bg-primary/10 ring-1 ring-primary/10' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                            >
                                                <Icon size={18} className={isSubActive ? 'text-primary' : 'opacity-70'} />
                                                <span className="ml-2 overflow-hidden whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                                <ChevronDown size={10} className={`ml-1 transition-transform ${activeSubMenu === item.id ? 'rotate-180' : ''}`} />
                                            </motion.button>
                                            <AnimatePresence>
                                                {activeSubMenu === item.id && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 left-0 w-56 bg-white dark:bg-[#0f172a] rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-[60]">
                                                        {item.subItems.map((sub: any) => (
                                                            <NavLink key={sub.id} to={`/${sub.id}`} onClick={() => setActiveSubMenu(null)} className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold transition-all ${isActive ? 'text-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                                {sub.icon && <sub.icon size={14} className="opacity-50" />}
                                                                {sub.label}
                                                            </NavLink>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                }

                                return (
                                    <NavLink
                                        key={item.id}
                                        to={path}
                                        className={({ isActive }) => `relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all z-10
                                            ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && (
                                                    <motion.div layoutId="nav-pill" className="absolute inset-0 bg-primary/10 ring-1 ring-primary/20 rounded-xl z-[-1]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                                )}
                                                <Icon size={18} className={isActive ? 'text-primary' : 'opacity-70'} />
                                                <span className="ml-2 overflow-hidden whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </LayoutGroup>
                </nav>
            )}
        </div>
    );
};
