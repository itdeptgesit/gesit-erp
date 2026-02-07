'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell, Menu, ChevronDown, LogOut, User, Settings, Sun, Moon, Check,
  Info, AlertTriangle, AlertCircle, ExternalLink, LayoutGrid,
  LifeBuoy, Activity, Calendar, ShoppingCart, Package, Network, Folder,
  Shield, Users, Building2, Briefcase, Layers, Zap, Phone, Megaphone
} from 'lucide-react';
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
  Settings: Settings,
  Megaphone: Megaphone
};

interface HeaderProps {
  onMenuClick: () => void;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
  currentView?: string;
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
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick, onLogout, onNavigate,
  user, appName = 'GESIT WORK', logoUrl
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { language, setLanguage, t } = useLanguage();

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          userId: n.user_email,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.is_read,
          createdAt: n.created_at,
          link: n.link
        })));
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${user.email}`
      }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user?.email) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_email', user.email).eq('is_read', false);
    if (!error) setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'Success': return <Check className="text-emerald-500" size={14} />;
      case 'Warning': return <AlertTriangle className="text-amber-500" size={14} />;
      case 'Alert': return <AlertCircle className="text-rose-500" size={14} />;
      default: return <Info className="text-blue-500" size={14} />;
    }
  };

  return (
    <header className="glass-header flex items-center justify-between px-4 md:px-8 h-16 sticky top-0 z-50 transition-all dark:bg-[#020617]/95 dark:border-slate-800/50 backdrop-blur-xl border-b border-slate-200/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]">
      {/* branding */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 md:gap-5 cursor-pointer group" onClick={() => onNavigate?.('dashboard')}>
          <div className="relative hidden md:block w-10 h-10">
            <img src={logoUrl || LOGO_URL} alt="Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm object-contain" />
            <div className="absolute -inset-1 bg-blue-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800/80 mx-1 hidden md:block"></div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                {appName.split(' ')[0]}
              </span>
              <span className="text-primary font-extrabold">
                {appName.split(' ').slice(1).join(' ')}
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.15em] mt-1 hidden md:block">Enterprise Work Platform</p>
          </div>
        </div>
      </div>

      {/* header tools */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* mobile menu toggle hidden - sidebar removed */}

        <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50" role="group" aria-label="Language selection">
          <button onClick={() => setLanguage('en')} aria-label="Switch to English" aria-pressed={language === 'en'} className={`px-2 py-0.5 text-[8px] font-black rounded transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}>EN</button>
          <button onClick={() => setLanguage('id')} aria-label="Switch to Indonesian" aria-pressed={language === 'id'} className={`px-2 py-0.5 text-[8px] font-black rounded transition-all ${language === 'id' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}>ID</button>
        </div>

        <button onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={isDark} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all">
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <div className="relative" ref={notificationRef}>
          <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} aria-label="View notifications" aria-haspopup="true" aria-expanded={isNotificationOpen} className={`p-1.5 rounded-lg transition-all ${isNotificationOpen ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}>
            <Bell size={16} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
              <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Alerts</h3>
                {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[9px] font-black text-primary uppercase hover:underline">Clear All</button>}
              </div>
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">No active alerts</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => { markAsRead(n.id); if (n.link) onNavigate?.(n.link); setIsNotificationOpen(false); }} className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-50 last:border-0 ${!n.isRead ? 'bg-primary/5' : ''}`}>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">{getIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                          <p className="text-[9px] text-slate-500 line-clamp-1">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User account menu"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 group transition-all py-1"
          >
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] font-bold text-slate-400 tracking-tight leading-none">Welcome,</span>
              <span className="text-[11px] font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">{userName}</span>
            </div>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center font-black text-xs text-white overflow-hidden shadow-[0_4px_15px_-4px_rgba(0,0,0,0.2)] border-2 border-white dark:border-slate-800 transition-all duration-300 group-hover:ring-4 group-hover:ring-blue-500/10">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userName.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
            </div>

            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 py-1.5 animate-in fade-in zoom-in-95 duration-200 z-[100]">
              <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{user?.role || 'Staff'}</p>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{userName}</p>
              </div>
              <button onClick={() => { onNavigate?.('profile'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all uppercase tracking-widest">
                <User size={14} className="opacity-50" /> <span>{t('profile')}</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              <button onClick={() => { onLogout?.(); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all uppercase tracking-widest">
                <LogOut size={14} className="opacity-70" /> <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
