'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell, Menu, ChevronDown, LogOut, User, Settings, Sun, Moon, Check,
  Info, AlertTriangle, AlertCircle, ExternalLink, LayoutGrid,
  LifeBuoy, Activity, Calendar, ShoppingCart, Package, Network, Folder,
  Shield, Users, Building2, Briefcase, Layers, Zap, Phone, Megaphone
} from 'lucide-react';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';
import { cn } from "@/lib/utils";
import { NotificationItem, UserGroup } from '../types';

// SHADCN UI IMPORTS
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
  onMenuClick?: () => void;
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
  forceShowLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick, onLogout, onNavigate,
  user, appName = 'GESIT PORTAL', logoUrl, forceShowLogo
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { language, setLanguage, t } = useLanguage();

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
    if (!user?.email) return;

    const userEmail = user.email.toLowerCase();

    const mapNotification = (n: any): NotificationItem => ({
      id: n.id,
      userId: n.user_email,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read ?? false,
      createdAt: n.created_at,
      link: n.link
    });

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .ilike('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data.map(mapNotification));
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userEmail}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_email=eq.${userEmail}`
      }, (payload) => {
        const mapped = mapNotification(payload.new);
        setNotifications(prev => [mapped, ...prev].slice(0, 20));
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
      case 'Alert': return <AlertCircle className="text-destructive" size={14} />;
      default: return <Info className="text-primary" size={14} />;
    }
  };

  return (
    <header className="glass-header flex items-center justify-between px-3 md:px-8 h-16 sticky top-0 z-50 transition-all dark:bg-slate-950/90 dark:border-slate-800/50 backdrop-blur-xl border-b border-border shadow-sm">
      {/* BRANDING */}
      <div className="flex items-center gap-1 md:gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="md:hidden"
          >
            <Menu size={20} />
          </Button>
        )}

        <div
          className={`flex items-center gap-2 sm:gap-3 cursor-pointer group ${!forceShowLogo ? 'md:hidden' : ''}`}
          onClick={() => onNavigate?.('dashboard')}
        >
          <div className="relative">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center bg-white dark:bg-slate-800/80 rounded-lg shadow-sm border border-border/10 dark:border-slate-700/50 overflow-hidden">
              <img src={logoUrl || LOGO_URL} alt="Logo" className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm object-contain" />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="text-xs sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none truncate">
              {(appName || 'GESIT PORTAL').split(' ')[0]}<span className="text-primary dark:text-blue-400 font-black ml-0.5 hidden xs:inline sm:inline">{(appName || 'GESIT PORTAL').split(' ').slice(1).join(' ')}</span>
            </h1>
          </div>
        </div>
      </div>

      {/* HEADER TOOLS */}
      <div className="flex items-center gap-1 md:gap-4">
        {/* Language Selection */}
        <div className="flex items-center bg-muted/30 dark:bg-slate-800/60 p-0.5 rounded-full border border-border/10 dark:border-slate-700/50" role="group" aria-label="Language selection">
          <Button
            variant={language === 'en' ? "secondary" : "ghost"}
            size="sm"
            className={`h-5 sm:h-7 px-1.5 sm:px-2.5 text-[8px] sm:text-[10px] font-black rounded-full transition-all ${language === 'en' ? 'shadow-sm bg-white dark:bg-slate-600 text-primary dark:text-blue-400' : 'text-muted-foreground hover:text-foreground dark:hover:text-slate-200'}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </Button>
          <Button
            variant={language === 'id' ? "secondary" : "ghost"}
            size="sm"
            className={`h-5 sm:h-7 px-1.5 sm:px-2.5 text-[8px] sm:text-[10px] font-black rounded-full transition-all ${language === 'id' ? 'shadow-sm bg-white dark:bg-slate-600 text-primary dark:text-blue-400' : 'text-muted-foreground hover:text-foreground dark:hover:text-slate-200'}`}
            onClick={() => setLanguage('id')}
          >
            ID
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground dark:text-slate-400 dark:hover:text-slate-200 h-8 w-8 sm:h-10 sm:w-10"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* Notifications Popover */}
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground dark:text-slate-400 dark:hover:text-slate-200 h-8 w-8 sm:h-10 sm:w-10">
              <Bell size={16} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 rounded-xl overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <div className="px-4 py-3 flex justify-between items-center bg-muted/50 dark:bg-slate-800/50 border-b border-border dark:border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground dark:text-slate-200">Alerts</h3>
              {unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-[10px] uppercase font-bold text-primary">
                  Clear All
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-[300px]">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">No active alerts</div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { markAsRead(n.id); if (n.link) onNavigate?.(n.link); setIsNotificationOpen(false); }}
                      className={`p-3 flex gap-3 hover:bg-muted/50 cursor-pointer border-b border-border transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Profile Dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2.5 px-1 sm:px-2 h-10 sm:h-12 hover:bg-muted/50 dark:hover:bg-slate-800/50 transition-all group rounded-xl">
                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground tracking-tight leading-none">{userName}</span>
                    <Badge
                      variant={(user?.role || '').includes('Admin') ? 'destructive' : 'secondary'}
                      className="h-4 px-1.5 py-0 text-[7px] font-black uppercase tracking-widest rounded-full"
                    >
                      {(user?.role || 'User').includes('Admin') ? 'Admin' : 'Personal'}
                    </Badge>
                  </div>
                  {user?.jobTitle && <span className="text-[9px] font-medium text-muted-foreground mt-1 opacity-60 uppercase tracking-wider">{user.jobTitle}</span>}
                </div>
                <div className="relative">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-primary dark:text-blue-400 overflow-hidden shadow-sm border border-border dark:border-slate-700 group-hover:border-primary/50 transition-all">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      userName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background shadow-sm"></div>
                </div>
                <ChevronDown size={12} className="text-muted-foreground/50 dark:text-slate-500 group-hover:text-foreground transition-colors" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl dark:bg-slate-900 dark:border-slate-800">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs tracking-widest text-muted-foreground uppercase font-black">{user?.role || 'Staff'}</p>
                  <p className="text-sm font-bold leading-none">{userName}</p>
                  {user?.email && <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onNavigate?.('profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onLogout?.()} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

      </div>
    </header>
  );
};
