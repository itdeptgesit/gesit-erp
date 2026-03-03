import React, { useState, useEffect, useMemo } from 'react';
import {
    FolderKanban, ListChecks, Eye, CheckCircle2,
    Search, SlidersHorizontal, MoreVertical, Plus,
    Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    TrendingUp, Calendar, Zap, ArrowUpRight,
    Database, Activity, Filter, Upload, MoreHorizontal, Megaphone,
    ShoppingCart, Users, Target, MousePointer2, Briefcase, RefreshCcw,
    ClipboardList, MessageSquare, Box, Shield, ArrowDownRight, LayoutDashboard,
    Loader2, Bell, Info, Moon, Sun, LogOut, Settings, Phone
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
    ResponsiveContainer, Area, AreaChart, BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { UserAccount, Announcement } from '../types';
import { StatCard } from './StatCard';
import { UserAvatar } from './UserAvatar';
import { useLanguage } from '../translations';

// SHADCN UI IMPORTS
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";


// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskItem {
    id: number;
    task: string;
    category: string;
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
    status: string;
}

interface ProjectItem {
    id: number;
    name: string;
    status: 'Completed' | 'In Progress' | 'On Hold' | 'Pending';
    progress: number;
    totalTasks: number;
    completedTasks: number;
    dueDate: string;
    owner: string;
    ownerAvatar?: string;
}

interface PerformanceData {
    day: string;
    value: number;
    value2?: number;
}

interface TaskplusDashboardProps {
    onNavigate: (view: string) => void;
    userName?: string;
    userRole?: string;
    currentUser?: UserAccount | null;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", bg?: string, dot: string }> = {
        'Completed': { variant: 'outline', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
        'In Progress': { variant: 'outline', bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50', dot: 'bg-blue-500' },
        'On Hold': { variant: 'outline', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50', dot: 'bg-amber-500' },
        'Pending': { variant: 'outline', bg: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-400' },
        'Done': { variant: 'outline', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50', dot: 'bg-emerald-500' },
        'To Do': { variant: 'outline', bg: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50', dot: 'bg-slate-400' },
    };
    const c = config[status] || config['Pending'];
    return (
        <Badge variant={c.variant} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${c.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {status}
        </Badge>
    );
};

// ─── Component ────────────────────────────────────────────────────────────

export const TaskplusDashboard: React.FC<TaskplusDashboardProps> = ({ onNavigate, userName, userRole = 'User', currentUser }) => {
    const { language, setLanguage, t } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [projectSearch, setProjectSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState('10');
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'ORGANIZATION'>('ORGANIZATION');
    const [viewDate, setViewDate] = useState(new Date());

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // Data states
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    // Stats
    const isITStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Staff' || currentUser?.isHelpdeskSupport;

    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTickets: 0,
        pendingProcurement: 0,
        totalAssets: 0,
        myActiveTickets: 0,
        myActiveLoans: 0,
        successRate: '0%',
        projectsChange: '+0%',
        tasksChange: '+0%',
        reviewsChange: '+0%',
    });

    const [sourceData, setSourceData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [
                { data: weeklyPlans },
                { data: purchasePlans },
                { data: helpTickets },
                { data: activityLogs },
                { data: itAssets },
                { data: announcementsData },
            ] = await Promise.all([
                supabase.from('weekly_plans').select('*').order('due_date', { ascending: true }),
                supabase.from('purchase_plans').select('status, justification, item, request_date, requester'),
                supabase.from('helpdesk_tickets').select('status, created_at'),
                supabase.from('activity_logs').select('id, category, status, created_at, activity_name, requester').order('created_at', { ascending: false }),
                supabase.from('it_assets').select('id, status'),
                supabase.from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(5),
            ]);

            // Tasks
            const taskItems: TaskItem[] = (weeklyPlans || []).map((wp: any) => ({
                id: wp.id,
                task: wp.task,
                category: wp.category || 'General',
                dueDate: wp.due_date,
                priority: wp.priority || 'Medium',
                status: wp.status || 'To Do',
            }));
            setTasks(taskItems);

            // Projects simulation
            const categoryProjects: Record<string, { plans: any[]; }> = {};
            (purchasePlans || []).forEach((pp: any) => {
                const projectName = pp.justification?.split(' ').slice(0, 3).join(' ') || pp.item || 'Unnamed Project';
                if (!categoryProjects[projectName]) categoryProjects[projectName] = { plans: [] };
                categoryProjects[projectName].plans.push(pp);
            });

            const projectItems: ProjectItem[] = Object.entries(categoryProjects).map(([name, data], index) => {
                const total = data.plans.length;
                const approved = data.plans.filter(p => p.status === 'Approved').length;
                const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
                return {
                    id: index + 1,
                    name: name.length > 30 ? name.substring(0, 30) + '...' : name,
                    status: (progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Pending') as any,
                    progress,
                    totalTasks: total,
                    completedTasks: approved,
                    dueDate: data.plans[0]?.request_date || new Date().toISOString(),
                    owner: data.plans[0]?.requester || 'System',
                };
            });
            setProjects(projectItems);

            // Performance
            const dayNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
            setPerformanceData(dayNames.map(day => ({
                day,
                value: 40 + Math.floor(Math.random() * 40),
                value2: 30 + Math.floor(Math.random() * 40),
            })));

            const openTickets = (helpTickets || []).filter((t: any) => t.status === 'Open' || t.status === 'In Progress').length;
            const myTickets = (helpTickets || []).filter((t: any) => (t.status === 'Open' || t.status === 'In Progress') && t.requester_name === currentUser?.fullName).length;
            const myLoans = (itAssets || []).filter((a: any) => a.status === 'Used' && a.user_assigned === currentUser?.fullName).length;
            const pendingProcurement = (purchasePlans || []).filter((p: any) => p.status === 'In Review' || p.status === 'Draft').length;
            const completedCount = taskItems.filter(t => t.status === 'Done' || t.status === 'Completed').length;

            setStats({
                totalProjects: projectItems.length,
                totalTickets: openTickets,
                myActiveTickets: myTickets,
                myActiveLoans: myLoans,
                pendingProcurement,
                totalAssets: (itAssets || []).length,
                successRate: taskItems.length > 0 ? `${Math.round((completedCount / taskItems.length) * 100)}%` : '0%',
                projectsChange: `+${Math.floor(Math.random() * 8)}%`,
                tasksChange: `+${Math.floor(Math.random() * 12)}%`,
                reviewsChange: `+${openTickets}`,
            });

            setAnnouncements(announcementsData || []);

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
    }, [projects, projectSearch]);

    const rpp = parseInt(rowsPerPage);
    const paginatedProjects = filteredProjects.slice((currentPage - 1) * rpp, currentPage * rpp);
    const totalPages = Math.max(Math.ceil(filteredProjects.length / rpp), 1);

    if (isLoading) {
        return (
            <div className="space-y-5 animate-pulse min-h-screen">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-8 bg-muted rounded-lg w-64" />
                        <div className="h-5 bg-muted rounded-lg w-80" />
                    </div>
                    <div className="h-10 bg-muted rounded-lg w-48" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">

            {!isITStaff ? (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-[80px] -ml-30 -mb-30" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-3">
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/20 text-blue-300 bg-white/5 px-4 py-1">Personal Workspace</Badge>
                            <h2 className="text-4xl font-black italic tracking-tight">Bonjour, {userName?.split(' ')[0] || 'Champion'}!</h2>
                            <p className="text-sm text-slate-300 font-medium max-w-lg leading-relaxed">
                                Welcome to your central productivity hub. Your equipment, support, and company updates are all in one place.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Assets</span>
                                <span className="text-2xl font-black">{stats.myActiveLoans}</span>
                            </div>
                            <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Open Tickets</span>
                                <span className="text-2xl font-black">{stats.myActiveTickets}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <PageHeader
                    title="Control Center"
                    description={`Systems operational. Welcome back, ${userName?.split(' ')[0] || 'Admin'}.`}
                />
            )}

            <div className="flex items-center gap-6 border-b border-border/50 pb-px">
                {(['PERSONAL', 'ORGANIZATION'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative
                                ${activeTab === tab
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="dashboard-tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(59,130,246,0.5)]" />
                        )}
                    </button>
                ))}
                <div className="flex-1" />
                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest border-primary/30 text-primary/70 bg-primary/5 px-3 py-1 animate-pulse">Live Data</Badge>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {isITStaff ? (
                    <>
                        <StatCard label="Live Helpdesk" value={stats.totalTickets} icon={MessageSquare} percentageChange={Number(stats.reviewsChange.replace('+', '')) || 0} subValue="Tickets Active" color="blue" status="on-track" />
                        <StatCard label="Procurement" value={stats.pendingProcurement} icon={ShoppingCart} percentageChange={3} subValue="Pending Review" color="amber" />
                        <StatCard label="Total Assets" value={stats.totalAssets} icon={Box} percentageChange={5} subValue="IT Inventory" color="purple" />
                        <StatCard label="Task Health" value={stats.successRate} icon={Zap} percentageChange={2} subValue="Overall Rate" color="emerald" status="on-track" />
                    </>
                ) : (
                    <>
                        <StatCard label="My Tickets" value={stats.myActiveTickets} icon={MessageSquare} subValue="Waiting support" color="blue" />
                        <StatCard label="My Loans" value={stats.myActiveLoans} icon={Box} subValue="Active equipment" color="purple" />
                        <StatCard label="Work Progress" value={stats.successRate} icon={Target} subValue="Tasks completed" color="emerald" />
                        <StatCard label="System Health" value="100%" icon={Shield} subValue="All services online" color="blue" />
                    </>
                )}
            </div>

            {
                !isITStaff && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Card className="md:col-span-2 shadow-sm rounded-xl">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Bell className="text-primary" size={20} /> Announcements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {announcements.length > 0 ? (
                                    announcements.map((ann) => {
                                        const borderColor = {
                                            info: 'border-blue-500',
                                            warning: 'border-amber-500',
                                            error: 'border-rose-500',
                                            success: 'border-emerald-500'
                                        }[ann.type || 'info'];
                                        return (
                                            <div key={ann.id} className={`p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border-l-4 ${borderColor}`}>
                                                <h4 className="font-bold text-sm uppercase text-slate-900 dark:text-slate-100">{ann.title}</h4>
                                                <p className="text-xs text-muted-foreground mt-1">{ann.content}</p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-10 text-center border-2 border-dashed rounded-xl border-muted/20">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Megaphone className="opacity-20" size={32} />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">No active communications</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm rounded-xl overflow-hidden border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                <Button className="w-full justify-start gap-3 h-11" variant="outline" onClick={() => onNavigate('helpdesk')}>
                                    <MessageSquare size={18} /> Submit New Ticket
                                </Button>
                                <Button className="w-full justify-start gap-3 h-11" variant="outline" onClick={() => onNavigate('asset-loan')}>
                                    <Box size={18} /> Request Equipment
                                </Button>
                                <Button className="w-full justify-start gap-3 h-11" variant="outline" onClick={() => onNavigate('extension-directory')}>
                                    <Phone size={18} /> Search Phone Directory
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <Card className="lg:col-span-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-border/10 dark:border-white/[0.03] rounded-2xl bg-card dark:bg-slate-900/40 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <Badge variant="secondary" className="mb-2 bg-secondary text-secondary-foreground"><Calendar className="w-3 h-3 mr-1" />This month</Badge>
                            <CardTitle className="text-3xl font-bold">$37.5K</CardTitle>
                            <p className="text-sm text-muted-foreground flex items-center">
                                Total Spent <span className="text-emerald-500 ml-2 font-bold">+2.45%</span>
                            </p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                            <TrendingUp size={24} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[240px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceData}>
                                    <defs>
                                        <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4318FF" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4318FF" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAzure" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2BB2FE" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2BB2FE" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <ReTooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                                    />
                                    <XAxis dataKey="day" hide />
                                    <YAxis hide />
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorBrand)" />
                                    <Area type="monotone" dataKey="value2" stroke="#2BB2FE" strokeWidth={3} fillOpacity={1} fill="url(#colorAzure)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-4 flex flex-col gap-5">
                    <Card className="shadow-sm rounded-2xl flex-1 bg-card dark:bg-slate-900/40 border-border/10 dark:border-white/[0.03]">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Weekly Revenue</CardTitle>
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <TrendingUp size={20} />
                            </div>
                        </CardHeader>
                        <CardContent className="h-[180px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm rounded-2xl bg-card dark:bg-slate-900/40 border-border/10 dark:border-white/[0.03]">
                        <CardHeader className="pb-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Daily Traffic</p>
                                    <div className="flex items-baseline gap-2">
                                        <CardTitle className="text-2xl font-bold">2.579</CardTitle>
                                        <span className="text-xs font-medium text-muted-foreground">Visitors</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10"><ArrowUpRight size={14} className="mr-1" /> +2.45%</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[100px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData.slice(0, 7)}>
                                    <Bar dataKey="value2" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Check Table with Shadcn UI - Only for IT Staff */}
            {
                isITStaff && (
                    <Card className="shadow-sm rounded-2xl overflow-hidden bg-card dark:bg-slate-900/40 border-border/10 dark:border-white/[0.03]">
                        <CardHeader className="flex flex-row items-center justify-between p-6">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">Project Overview</CardTitle>
                                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Global Task & Milestone Tracking</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-secondary">
                                        <MoreHorizontal size={18} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Export Data</DropdownMenuItem>
                                    <DropdownMenuItem>Settings</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto custom-scrollbar">
                                <Table>
                                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                                        <TableRow className="border-border/10 dark:border-white/[0.03]">
                                            <TableHead className="w-[300px] whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-muted-foreground/70 pl-6">NAME</TableHead>
                                            <TableHead className="whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-muted-foreground/70">PROGRESS</TableHead>
                                            <TableHead className="text-center whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-muted-foreground/70">QUANTITY</TableHead>
                                            <TableHead className="text-right pr-6 whitespace-nowrap font-black text-[10px] uppercase tracking-widest text-muted-foreground/70">DATE</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedProjects.map((project) => (
                                            <TableRow key={project.id} className="border-border/10 dark:border-white/[0.03] hover:bg-primary/5 cursor-pointer transition-colors">
                                                <TableCell className="font-black whitespace-nowrap py-4">
                                                    <div className="flex items-center gap-3 pl-4">
                                                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${project.progress === 100 ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 dark:border-slate-700'}`}>
                                                            {project.progress === 100 && <CheckCircle2 size={12} className="text-primary" />}
                                                        </div>
                                                        <span className="text-sm tracking-tight uppercase">{project.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[11px] font-black w-10 tabular-nums">{project.progress}%</span>
                                                        <div className="flex-1 h-1.5 bg-secondary dark:bg-slate-800 rounded-full overflow-hidden w-24">
                                                            <div
                                                                className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                                style={{ width: `${project.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-black text-sm whitespace-nowrap py-4 tabular-nums">
                                                    {(project.totalTasks * 123 + 2458).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 tabular-nums uppercase font-black text-[11px] whitespace-nowrap py-4 text-muted-foreground">
                                                    {new Date(project.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {paginatedProjects.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                    No projects found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>

                        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-border bg-muted/20">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span><span className="font-bold text-foreground">{filteredProjects.length}</span> initiatives</span>
                                <div className="flex items-center gap-2">
                                    <span>Rows per page</span>
                                    <Select value={rowsPerPage} onValueChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="w-[70px] h-8 text-xs font-bold bg-secondary">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="20">20</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8"><ChevronsLeft size={16} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-8 w-8"><ChevronLeft size={16} /></Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        const page = i + 1;
                                        return (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "ghost"}
                                                size="icon"
                                                className="h-8 w-8 text-xs font-bold"
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="h-8 w-8"><ChevronRight size={16} /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8"><ChevronsRight size={16} /></Button>
                            </div>
                        </div>
                    </Card>
                )
            }
        </div >
    );
};
