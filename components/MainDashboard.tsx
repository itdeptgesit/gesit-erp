'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Activity, ShoppingCart, RefreshCcw, Network, Box, Zap,
    ListTodo, LifeBuoy, ChevronRight, Users, Wallet, ShieldCheck, AlertCircle, Database,
    Sun, CloudSun, Moon, Megaphone, CheckCircle2, X, Calendar, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ActivityLog, PortStatus, Announcement } from '../types';

interface DashboardStats {
    totalAssets: number;
    activeAssets: number;
    openTickets: number;
    resolvedTickets: number;
    plannedTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    pendingPurchases: number;
    activePorts: number;
    totalPorts: number;
    errorPorts: number;
    totalUsers: number;
    totalDepts: number;
    pendingBudget: number;
    approvedBudget: number;
    activeLoans: number;
    recentActivities: ActivityLog[];
    assetCategories: Record<string, number>;
    assetStatuses: {
        operational: number;
        maintenance: number;
        retired: number;
    };
    personalTasks: any[];
    upcomingLoans: any[];
    activeAnnouncements: Announcement[];
}

interface MainDashboardProps {
    onNavigate: (view: string) => void;
    userName?: string;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigate, userName }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState<number>(1);
    const [stats, setStats] = useState<DashboardStats>({
        totalAssets: 0,
        activeAssets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        plannedTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
        pendingPurchases: 0,
        activePorts: 0,
        totalPorts: 0,
        errorPorts: 0,
        totalUsers: 0,
        totalDepts: 0,
        pendingBudget: 0,
        approvedBudget: 0,
        activeLoans: 0,
        recentActivities: [],
        assetCategories: {},
        assetStatuses: { operational: 0, maintenance: 0, retired: 0 },
        personalTasks: [],
        upcomingLoans: [],
        activeAnnouncements: []
    });

    const [closedAnnouncements, setClosedAnnouncements] = useState<number[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Parallel Fetching for better performance (LCP)
            const [
                { data: assets },
                { count: openTickets },
                { count: resolvedTickets },
                { data: tasks },
                { data: ports },
                { data: purchases },
                { count: userCount, data: allUsers },
                { count: deptCount },
                { count: activeLoans },
                { data: activities },
                { data: pTasks },
                { data: loans },
                { data: announcements }
            ] = await Promise.all([
                supabase.from('it_assets').select('status, category'),
                supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
                supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).in('status', ['Resolved', 'Closed']),
                supabase.from('weekly_plans').select('status'),
                supabase.from('switch_ports').select('status'),
                supabase.from('purchase_plans').select('status, total_price'),
                supabase.from('user_accounts').select('full_name, avatar_url', { count: 'exact' }),
                supabase.from('departments').select('*', { count: 'exact', head: true }),
                supabase.from('it_asset_loans').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
                supabase.from('activity_logs').select('*').order('id', { ascending: false }).limit(5),
                supabase.from('weekly_plans').select('*').eq('assignee', userName || 'IT Support').neq('status', 'Done').order('due_date', { ascending: true }).limit(3),
                supabase.from('it_asset_loans').select('*, it_assets(item_name)').eq('status', 'Active').gte('expected_return_date', new Date().toISOString().split('T')[0]).lte('expected_return_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]).order('expected_return_date', { ascending: true }).limit(3),
                supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false })
            ]);

            const totalAssets = assets?.length || 0;
            const activeAssets = assets?.filter((a: any) => a.status === 'Active' || a.status === 'Used').length || 0;
            const categories = (assets || []).reduce((acc: any, curr: any) => {
                acc[curr.category] = (acc[curr.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const assetStatuses = {
                operational: assets?.filter((a: any) => ['Active', 'Used', 'Deployed'].includes(a.status)).length || 0,
                maintenance: assets?.filter((a: any) => ['Repair', 'Maintenance', 'In Stock'].includes(a.status)).length || 0,
                retired: assets?.filter((a: any) => ['Broken', 'Disposed', 'Sold', 'Lost'].includes(a.status)).length || 0,
            };

            const completedTasks = tasks?.filter((t: any) => t.status === 'Done').length || 0;
            const inProgressTasks = tasks?.filter((t: any) => t.status === 'In Progress').length || 0;
            const todoTasks = tasks?.filter((t: any) => t.status === 'To Do' || t.status === 'Pending').length || 0;

            const activePortsCount = ports?.filter((p: any) => p.status === PortStatus.ACTIVE).length || 0;
            const errorPortsCount = ports?.filter((p: any) => p.status === PortStatus.ERROR).length || 0;

            const pendingBudget = purchases?.filter(p => p.status.includes('Pending')).reduce((sum, p) => sum + (p.total_price || 0), 0) || 0;
            const approvedBudget = purchases?.filter(p => p.status === 'Approved').reduce((sum, p) => sum + (p.total_price || 0), 0) || 0;

            const userMap = new Map((allUsers || []).map((u: any) => [u.full_name, u.avatar_url]));

            setStats({
                totalAssets, activeAssets, openTickets: openTickets || 0, resolvedTickets: resolvedTickets || 0,
                plannedTasks: tasks?.length || 0, completedTasks, inProgressTasks, todoTasks,
                pendingPurchases: purchases?.filter(p => p.status.includes('Pending')).length || 0,
                activePorts: activePortsCount, totalPorts: ports?.length || 0, errorPorts: errorPortsCount, totalUsers: userCount || 0, totalDepts: deptCount || 0,
                pendingBudget, approvedBudget, activeLoans: activeLoans || 0,
                recentActivities: (activities || []).map((a: any) => ({
                    ...a,
                    activityName: a.activity_name,
                    itPersonnel: a.it_personnel,
                    department: a.department || 'General',
                    createdAt: a.created_at,
                    avatarUrl: userMap.get(a.it_personnel) || null
                })),
                assetCategories: categories,
                assetStatuses,
                personalTasks: pTasks || [],
                upcomingLoans: loans || [],
                activeAnnouncements: announcements || []
            });
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: userName || 'Anonymous',
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                setOnlineCount(count);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [userName]);

    const networkHealth = stats.totalPorts > 0 ? Math.round((stats.activePorts / stats.totalPorts) * 100) : 0;
    const taskProgress = stats.plannedTasks > 0 ? Math.round((stats.completedTasks / stats.plannedTasks) * 100) : 0;

    const getGreetingDetails = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good Morning', icon: Sun, color: 'text-amber-500' };
        if (hour < 18) return { text: 'Good Afternoon', icon: CloudSun, color: 'text-orange-500' };
        return { text: 'Good Evening', icon: Moon, color: 'text-indigo-500' };
    };

    const greeting = getGreetingDetails();
    const GreetingIcon = greeting.icon;

    return (
        <div className="space-y-8 pb-10">
            {/* LCP Element: Render Greeting Immediately */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3 min-h-[40px]">
                        {greeting.text}, {userName ? userName.split(' ')[0] : 'User'}
                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            <GreetingIcon size={28} className={greeting.color} />
                        </div>
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        <p className="text-sm font-medium text-slate-400">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • All systems operational
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                        <RefreshCcw size={16} /> Sync records
                    </button>
                </div>
            </div>

            {/* Announcement Widget */}
            {isLoading ? (
                <SkeletonAnnouncement />
            ) : stats.activeAnnouncements.length > 0 && stats.activeAnnouncements.map(ann => !closedAnnouncements.includes(ann.id) && (
                <div key={ann.id} className={`relative overflow-hidden rounded-[1.5rem] border p-6 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500 ${ann.type === 'info' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20' :
                    ann.type === 'warning' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/20' :
                        ann.type === 'error' ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/20' :
                            'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/20'
                    }`}>
                    <div className={`p-3 rounded-xl shrink-0 ${ann.type === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        ann.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                            ann.type === 'error' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                        <Megaphone size={20} />
                    </div>
                    <div className="flex-1 pt-1">
                        <h3 className={`font-bold text-sm uppercase tracking-widest mb-1 ${ann.type === 'info' ? 'text-blue-700 dark:text-blue-400' :
                            ann.type === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                                ann.type === 'error' ? 'text-rose-700 dark:text-rose-400' :
                                    'text-emerald-700 dark:text-emerald-400'
                            }`}>{ann.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{ann.content}</p>
                    </div>
                    <button
                        onClick={() => setClosedAnnouncements(prev => [...prev, ann.id])}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}

            {/* Quick Actions Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 flex flex-wrap gap-3 shadow-sm transition-all hover:shadow-md">
                <p className="w-full text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Quick Actions</p>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => onNavigate('assets')} aria-label="Create New Asset" className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all border border-blue-100 dark:border-blue-900/50 active:scale-95">
                        <Box size={14} /> + New Asset
                    </button>
                    <button onClick={() => onNavigate('helpdesk')} aria-label="Open New Ticket" className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all border border-rose-100 dark:border-rose-900/50 active:scale-95">
                        <LifeBuoy size={14} /> Open Ticket
                    </button>
                    <button onClick={() => onNavigate('purchase')} aria-label="Add Purchase Request" className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all border border-amber-100 dark:border-amber-900/50 active:scale-95">
                        <ShoppingCart size={14} /> Add Purchase
                    </button>
                    <button onClick={() => onNavigate('activity')} aria-label="Log Work Activity" className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-100 dark:border-emerald-900/50 active:scale-95">
                        <Activity size={14} /> Log Work
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 min-h-[188px]">
                {isLoading ? (
                    Array(7).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    <>
                        <StatCard label="Service desk" value={stats.openTickets} subValue={`${stats.resolvedTickets} resolved`} icon={LifeBuoy} color="rose" onClick={() => onNavigate('helpdesk')} />
                        <StatCard label="IT assets" value={stats.totalAssets} subValue={`${stats.activeAssets} operational`} icon={Box} color="blue" onClick={() => onNavigate('assets')} />
                        <StatCard label="Asset loans" value={stats.activeLoans} subValue="Active borrowing" icon={Zap} color="indigo" onClick={() => onNavigate('asset-loans')} />
                        <StatCard label="Network health" value={`${networkHealth}%`} subValue={`${stats.activePorts} active ports`} icon={Network} color="emerald" onClick={() => onNavigate('network')} />
                        <StatCard label="Productivity" value={`${taskProgress}%`} subValue={`${stats.completedTasks} of ${stats.plannedTasks} task(s) done`} icon={ListTodo} color="blue" onClick={() => onNavigate('weekly')}>
                            <div className="mt-4 space-y-2">
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${taskProgress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{stats.todoTasks} To Do</span>
                                    <span>{stats.inProgressTasks} Active</span>
                                </div>
                            </div>
                        </StatCard>
                        <StatCard label="Personnel" value={stats.totalUsers} subValue={`${stats.totalDepts} units`} icon={Users} color="blue" onClick={() => onNavigate('users')} />
                        <StatCard label="Finance" value={stats.pendingPurchases} subValue={formatCurrency(stats.pendingBudget)} icon={ShoppingCart} color="amber" onClick={() => onNavigate('purchase')} />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap size={18} className="text-blue-500" />
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 tracking-tight">Recent activities</h3>
                            </div>
                            <button onClick={() => onNavigate('activity')} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors flex items-center gap-1">
                                View History <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800 min-h-[380px]">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="px-8 py-4 flex items-center justify-between animate-pulse">
                                        <div className="flex items-center gap-5">
                                            <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"></div>
                                            <div className="space-y-2">
                                                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="h-2 w-24 bg-slate-50 dark:bg-slate-800/50 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-6 w-16 bg-slate-50 dark:bg-slate-800 rounded-xl"></div>
                                    </div>
                                ))
                            ) : (!stats.recentActivities || stats.recentActivities.length === 0) ? (
                                <div className="py-20 text-center text-slate-300 text-sm font-medium italic">No activity logs recorded.</div>
                            ) : (
                                stats.recentActivities.map((act: any) => (
                                    <div key={act.id} className="px-8 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-between group h-[76px]">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {act.avatarUrl ? (
                                                        <img
                                                            src={act.avatarUrl}
                                                            alt={act.itPersonnel || 'User'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : (
                                                        <span>{act.itPersonnel ? act.itPersonnel.substring(0, 2).toUpperCase() : 'IT'}</span>
                                                    )}
                                                    <span className={`hidden absolute inset-0 flex items-center justify-center text-xs font-bold ${act.avatarUrl ? 'bg-slate-50 text-slate-400' : ''}`}>
                                                        {act.itPersonnel ? act.itPersonnel.substring(0, 2).toUpperCase() : 'IT'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors tracking-tight">{act.activityName}</h4>
                                                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                                    {act.itPersonnel ? act.itPersonnel.split(' ')[0] : 'IT'} • {act.department} • {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : 'Just now'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all ${act.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                            {act.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 flex flex-col h-[350px] md:col-span-2">
                            <h3 className="font-bold text-xs text-slate-400 tracking-widest mb-6 uppercase flex items-center justify-between">
                                Upcoming Schedule
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800/50"><ListTodo size={10} /> TASKS</span>
                                    <span className="flex items-center gap-1 text-[9px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-800/50"><Zap size={10} /> LOANS</span>
                                </div>
                            </h3>
                            <div className="space-y-0 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[240px]">
                                {isLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex gap-4 animate-pulse mb-3">
                                            <div className="w-12 text-right space-y-2 pt-1">
                                                <div className="h-3 w-8 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div>
                                                <div className="h-2 w-6 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div>
                                            </div>
                                            <div className="w-0.5 h-16 bg-slate-100 dark:bg-slate-800"></div>
                                            <div className="flex-1 space-y-2 pt-1">
                                                <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (stats.personalTasks.length === 0 && stats.upcomingLoans.length === 0) ? (
                                    <div className="flex h-full items-center justify-center text-[10px] font-bold text-slate-300 uppercase italic">No upcoming schedule.</div>
                                ) : (() => {
                                    const timeline = [
                                        ...stats.personalTasks.map(t => ({ ...t, type: 'task', date: t.due_date, title: t.task, subtitle: t.category })),
                                        ...stats.upcomingLoans.map(l => ({ ...l, type: 'loan', date: l.expected_return_date, title: l.it_assets?.item_name || 'Asset', subtitle: `Borrower: ${l.borrower_name}` }))
                                    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                    return timeline.map((item, idx) => (
                                        <div key={`${item.type}-${item.id}`} className="flex gap-4 group cursor-pointer" onClick={() => onNavigate(item.type === 'task' ? 'weekly' : 'asset-loans')}>
                                            <div className="w-14 text-right pt-2 shrink-0">
                                                <p className="text-sm font-black text-slate-700 dark:text-slate-300 leading-none">{new Date(item.date).getDate()}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                            </div>
                                            <div className="relative flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full border-2 z-10 mt-2 transition-all group-hover:scale-125 ${item.type === 'task' ? 'bg-white dark:bg-slate-900 border-blue-500' : 'bg-white dark:bg-slate-900 border-rose-500'}`}></div>
                                                {idx !== timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800 my-1 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors"></div>}
                                            </div>
                                            <div className={`flex-1 p-3 rounded-xl border mb-3 transition-all ${item.type === 'task'
                                                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20 group-hover:border-blue-300 dark:group-hover:border-blue-700 group-hover:shadow-sm'
                                                : 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/20 group-hover:border-rose-300 dark:group-hover:border-rose-700 group-hover:shadow-sm'
                                                }`}>
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`text-xs font-bold line-clamp-1 ${item.type === 'task' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>{item.title}</h4>
                                                    {item.type === 'task' ? <ListTodo size={14} className="text-blue-400 group-hover:text-blue-600 transition-colors" /> : <Zap size={14} className="text-rose-400 group-hover:text-rose-600 transition-colors" />}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.type === 'task' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                                        {item.type === 'task' ? 'TASK' : 'RETURN'}
                                                    </span>
                                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 flex flex-col h-[400px]">
                            <h3 className="font-bold text-xs text-slate-400 tracking-widest mb-6 uppercase">Asset distribution</h3>
                            <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {isLoading ? (
                                    Array(6).fill(0).map((_, i) => (
                                        <div key={i} className="space-y-2 animate-pulse">
                                            <div className="flex justify-between">
                                                <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                                <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full"></div>
                                        </div>
                                    ))
                                ) : Object.entries(stats.assetCategories).map(([cat, count]) => (
                                    <div key={cat} className="space-y-1.5 cursor-pointer group/bar" onClick={() => onNavigate('assets')}>
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-500 group-hover/bar:text-blue-600 transition-colors">{cat}</span>
                                            <span className="text-slate-900 dark:text-white">{count} units</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.2)] group-hover/bar:bg-blue-500"
                                                style={{ width: `${(Number(count) / (stats.totalAssets || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8 flex flex-col h-[400px]">
                            <h3 className="font-bold text-xs text-slate-400 tracking-widest mb-6 uppercase">Infrastructure Status</h3>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                {isLoading ? (
                                    <div className="w-full space-y-8 animate-pulse">
                                        <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
                                            <div className="absolute inset-0 rounded-full border-[12px] border-slate-50 dark:border-slate-800"></div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded"></div>
                                            <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded"></div>
                                            <div className="h-3 w-full bg-slate-50 dark:bg-slate-800 rounded"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                            <div className="absolute inset-0 rounded-full border-[12px] border-slate-50 dark:border-slate-800"></div>
                                            <div className="absolute inset-0 rounded-full border-[12px] border-emerald-500 border-l-transparent border-t-transparent -rotate-45" style={{ background: `conic-gradient(from 0deg, #10b981 ${(stats.assetStatuses.operational / (stats.totalAssets || 1)) * 100}%, transparent 0%)`, mask: 'radial-gradient(transparent 55%, black 56%)' }}></div>
                                            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#10b981 ${(stats.assetStatuses.operational / (stats.totalAssets || 1)) * 100}%, transparent 0%)`, mask: 'radial-gradient(transparent 55%, black 56%)' }}></div>

                                            <div className="text-center z-10">
                                                <h4 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">{Math.round((stats.assetStatuses.operational / (stats.totalAssets || 1)) * 100)}%</h4>
                                                <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Healthy</p>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-3">
                                            <PlanBar label="Operational" count={stats.assetStatuses.operational} total={stats.totalAssets} color="bg-emerald-500" />
                                            <PlanBar label="Maintenance" count={stats.assetStatuses.maintenance} total={stats.totalAssets} color="bg-amber-500" />
                                            <PlanBar label="Retired / Broken" count={stats.assetStatuses.retired} total={stats.totalAssets} color="bg-rose-500" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0f172a] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <span className="text-[10px] font-bold text-blue-400 tracking-widest mb-8 block uppercase">Network health</span>
                            {isLoading ? (
                                <div className="space-y-6 animate-pulse">
                                    <div className="flex items-end justify-between">
                                        <div className="h-16 w-32 bg-slate-800 rounded"></div>
                                        <div className="h-4 w-16 bg-slate-800 rounded"></div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-16 bg-white/5 rounded-xl border border-white/5"></div>
                                        <div className="h-16 bg-white/5 rounded-xl border border-white/5"></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-end justify-between mb-6">
                                        <h3 className="text-6xl font-bold tracking-tight">{networkHealth}%</h3>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-500 tracking-widest mb-1 uppercase">Load integrity</p>
                                            <p className="text-sm font-bold text-emerald-400">Stable</p>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-8">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${networkHealth}%` }}></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                                            <p className="text-xl font-bold text-white leading-none">{stats.activePorts}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Active</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                                            <p className="text-xl font-bold text-rose-400 leading-none">{stats.errorPorts}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">Alerts</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="font-bold text-xs text-slate-400 tracking-widest mb-6 uppercase">Procurement summary</h3>
                        <div className="space-y-4">
                            {isLoading ? (
                                <>
                                    <div className="h-24 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                                    <div className="h-24 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                                </>
                            ) : (
                                <>
                                    <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                        <p className="text-[10px] font-bold text-emerald-600 tracking-widest mb-2 uppercase">Approved funds</p>
                                        <h5 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(stats.approvedBudget)}</h5>
                                    </div>
                                    <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                        <p className="text-[10px] font-bold text-blue-600 tracking-widest mb-2 uppercase">Pending requests</p>
                                        <h5 className="text-xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(stats.pendingBudget)}</h5>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="font-bold text-xs text-slate-400 tracking-widest mb-6 uppercase">System Health & Personnel</h3>
                        <div className="space-y-5">
                            {isLoading ? (
                                <>
                                    <div className="h-14 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                                    <div className="h-4 w-full bg-slate-50 dark:bg-slate-800 rounded animate-pulse"></div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Users size={16} className="text-emerald-600" />
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Team availability</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-600">{onlineCount} Online</span>
                                    </div>
                                    {stats.errorPorts > 0 && (
                                        <VitalsRow icon={AlertCircle} label="Active threats" status="Detected" color="text-rose-600" />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const formatCurrency = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

const SkeletonAnnouncement = () => (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-100 dark:border-slate-800 p-6 flex items-start gap-4 shadow-sm animate-pulse bg-white dark:bg-slate-900 mb-6">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"></div>
        <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-1/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-3/4 bg-slate-50 dark:bg-slate-800/50 rounded"></div>
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[188px] animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="space-y-3">
            <div className="h-8 w-12 bg-slate-100 dark:bg-slate-800 rounded mt-2"></div>
            <div className="h-2 w-24 bg-slate-50 dark:bg-slate-800/50 rounded mt-4 leading-none"></div>
        </div>
    </div>
);

const PlanBar = ({ label, count, total, color }: any) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                <span>{label}</span>
                <span className="text-slate-800 dark:text-slate-200">{count}</span>
            </div>
            <div className="h-1 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

const VitalsRow = ({ icon: Icon, label, status, color }: any) => (
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <Icon size={16} className="text-slate-300" />
            <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
        <span className={`text-xs font-bold ${color}`}>{status}</span>
    </div>
);

export const StatCard = ({ label, value, subValue, icon: Icon, color, onClick, children }: any) => {
    const colorMap: any = {
        blue: { text: 'text-blue-600', bg: 'bg-blue-600' },
        rose: { text: 'text-rose-600', bg: 'bg-rose-600' },
        emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600' },
        indigo: { text: 'text-indigo-600', bg: 'bg-indigo-600' },
        amber: { text: 'text-amber-600', bg: 'bg-amber-500' },
    };

    const theme = colorMap[color] || colorMap.blue;

    return (
        <button
            onClick={onClick}
            aria-label={`${label}: ${value}. ${subValue}`}
            className="w-full text-left cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[188px] transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group"
        >
            <div className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                    <div className={`p-2 rounded-xl ${theme.bg} text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                        <Icon size={16} strokeWidth={2.5} />
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">{value}</h3>
                {children}
            </div>

            <div className="mt-auto">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest leading-none uppercase">{subValue}</p>
            </div>
        </button>
    );
};