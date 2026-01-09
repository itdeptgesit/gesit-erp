
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, ChevronDown, LogOut, User, Settings, Sun, Moon, Check, Info, AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';
import { NotificationItem } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
  user?: {
    name: string;
    role: string;
    email?: string;
    jobTitle?: string;
    avatarUrl?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onLogout, onNavigate, user }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userName = user?.name || 'User';

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
      const { data, error } = await supabase
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
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (!user?.email) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_email', user.email)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
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
    <header className="glass-header flex items-center justify-between px-6 py-3 sticky top-0 z-30 transition-all dark:bg-slate-900/80 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-900"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Language Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('id')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${language === 'id' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
          >
            ID
          </button>
        </div>

        {/* Notification Icon */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`p-2 rounded-xl transition-all ${isNotificationOpen ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
              <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{unreadCount} unread system logs</p>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest">Clear All</button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto mb-3">
                      <Bell size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Silence Protocol</p>
                    <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1 uppercase">No active notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-slate-700">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer group ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link && onNavigate) onNavigate(n.link);
                          setIsNotificationOpen(false);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <p className={`text-xs font-bold truncate ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                              {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {n.link && <ExternalLink size={10} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-50 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30 text-center">
                  <button className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-[0.2em] transition-all">View Protocol Archive</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px] text-white overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">{userName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{user?.jobTitle || user?.role || 'Staff'}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-300 dark:text-slate-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in zoom-in-95 duration-200 z-[100]">
              <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{userName}</p>
              </div>

              <button
                onClick={() => { if (onNavigate) onNavigate('profile'); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <User size={16} className="text-slate-400 dark:text-slate-500" />
                <span>{t('profile')}</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>

              <button
                onClick={() => { if (onLogout) onLogout(); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all font-semibold"
              >
                <LogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
