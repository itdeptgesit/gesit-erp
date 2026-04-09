'use client';

import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import {
  Bell, LogOut, Sun, Moon, Mail,
  Sparkles, BadgeCheck, CreditCard
} from 'lucide-react';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';
import { cn } from "@/lib/utils";
import { NotificationItem, UserGroup } from '../types';
import { useTheme } from "next-themes";

// SHADCN UI IMPORTS
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  onMenuClick?: () => void;
  onLogout?: () => void;
  onNavigate?: (view: string) => void;
  currentView?: string;
  userGroups?: string[];
  userRole?: string;
  groupDefinitions?: UserGroup[];
  user?: {
    id?: string | number;
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
  user,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  const userName = user?.name || 'User';

  const toggleTheme = (e: React.MouseEvent) => {
    const isDarkCurrent = resolvedTheme === 'dark';

    if (!document.startViewTransition) {
      setTheme(isDarkCurrent ? 'light' : 'dark');
      return;
    }

    document.documentElement.style.setProperty('--click-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--click-y', `${e.clientY}px`);

    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(isDarkCurrent ? 'light' : 'dark');
      });
    });
  };

  useEffect(() => {
    if (!user?.email) return;

    const userEmail = user.email.toLowerCase();

    const mapNotification = (n: any): NotificationItem => ({
      id: n.id,
      userId: n.user_id || n.user_email,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read ?? false,
      createdAt: n.created_at,
      link: n.link
    });

    const fetchNotifications = async () => {
      let query = supabase.from('notifications').select('*');
      if (user?.id && userEmail) {
        query = query.or(`user_id.eq.${user.id},user_email.ilike.${userEmail}`);
      } else if (user?.id) {
        query = query.eq('user_id', user.id);
      } else if (userEmail) {
        query = query.ilike('user_email', userEmail);
      } else {
        return;
      }
      const { data } = await query.order('created_at', { ascending: false }).limit(20);
      if (data) setNotifications(data.map(mapNotification));
    };

    fetchNotifications();

    const channel = supabase.channel(`notifications:${user?.id || userEmail}`).on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const n = payload.new;
        if (n.user_id === user?.id || (userEmail && n.user_email?.toLowerCase() === userEmail)) {
          const mapped = mapNotification(n);
          setNotifications(prev => [mapped, ...prev].slice(0, 20));
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.email]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const email = user.email?.toLowerCase();
    let query = supabase.from('notifications').update({ is_read: true });
    if (user.id && email) query = query.or(`user_id.eq.${user.id},user_email.ilike.${email}`);
    else if (user.id) query = query.eq('user_id', user.id);
    else if (email) query = query.ilike('user_email', email);
    else return;
    const { error } = await query.eq('is_read', false);
    if (!error) setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex items-center gap-1">
      {/* Mail Icon */}
      <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-transparent">
        <Mail size={17} strokeWidth={1.5} />
        <span className="absolute top-0.5 right-0.5 block h-[7px] w-[7px] rounded-full bg-rose-500" />
      </Button>

      {/* Notifications Popover */}
      <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-transparent">
            <Bell size={17} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 block h-[7px] w-[7px] rounded-full bg-rose-500" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[320px] p-0 rounded-lg overflow-hidden border border-border/40 shadow-xl bg-background/95 backdrop-blur-md">
          <div className="px-4 py-3 flex justify-between items-center border-b border-border/10 bg-muted/20">
            <h3 className="text-[13px] font-medium text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">Everything caught up!</div>
            ) : (
              <div className="flex flex-col">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); if (n.link) onNavigate?.(n.link); setIsNotificationOpen(false); }}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-accent/30 cursor-pointer transition-colors border-b border-border/5 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 border border-border/10">
                      <span className="text-[10px] font-bold text-foreground">
                        {n.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-normal text-foreground truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-normal">{n.message}</p>
                    </div>
                    {!n.isRead && <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground/60 hover:text-foreground hover:bg-transparent"
        onClick={toggleTheme}
      >
        {/* Crescent moon for light mode (click to go dark), Sun for dark mode */}
        <Moon size={17} strokeWidth={1.5} className="block dark:hidden" />
        <Sun size={17} strokeWidth={1.5} className="hidden dark:block" />
      </Button>

      {/* User Avatar */}
      <div className="pl-1.5 ml-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 border border-border/20 shadow-sm cursor-pointer hover:ring-2 hover:ring-muted transition-all">
                <AvatarImage src={user?.avatarUrl} alt={userName} />
                <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl shadow-xl border border-border/50" align="end" sideOffset={8}>
            {/* User info */}
            <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border/30">
              <Avatar className="h-8 w-8 rounded-lg shrink-0">
                <AvatarImage src={user?.avatarUrl} alt={userName} />
                <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-[11px] font-semibold">
                  {userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-[13px] font-medium text-foreground">{userName}</span>
                <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <DropdownMenuItem className="cursor-pointer text-[13px] py-2 px-3 font-normal gap-2.5">
                <Sparkles className="size-4 text-muted-foreground shrink-0" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="my-0" />
            <div className="py-1">
              <DropdownMenuItem className="cursor-pointer text-[13px] py-2 px-3 font-normal gap-2.5" onClick={() => onNavigate?.('profile')}>
                <BadgeCheck className="size-4 text-muted-foreground shrink-0" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[13px] py-2 px-3 font-normal gap-2.5">
                <CreditCard className="size-4 text-muted-foreground shrink-0" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-[13px] py-2 px-3 font-normal gap-2.5">
                <Bell className="size-4 text-muted-foreground shrink-0" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="my-0" />
            <div className="py-1">
              <DropdownMenuItem className="cursor-pointer text-[13px] py-2 px-3 font-normal gap-2.5" onClick={onLogout}>
                <LogOut className="size-4 text-muted-foreground shrink-0" />
                <span>Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
