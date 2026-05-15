'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Filter, Plus, FileText, CheckCircle2, Clock,
    AlertTriangle, X, ChevronLeft, ChevronRight, MoreHorizontal,
    Download, Trash2, Edit, Eye, User, Calendar,
    Presentation, XCircle, Play, Maximize2, Minimize2,
    Zap, RefreshCcw, BarChart3, Sun, Moon, ArrowUpRight,
    TrendingUp, Activity, LayoutDashboard, Globe, Database,
    FileSpreadsheet, SlidersHorizontal, ChevronsLeft, ChevronsRight,
    ClipboardList, AlertCircle, Loader2, Mic, Bell, Info, FilterX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';
import { ActivityLog } from '../types';
import { ActivityFormModal } from './ActivityFormModal';
import { UserAvatar } from './UserAvatar';
import { exportToExcel } from '../lib/excelExport';
import { StatCard } from './StatCard';
import { DangerConfirmModal } from './DangerConfirmModal';

// ─── Stat Card Component (lndev/ui Taskplus Style) ─────────────────────────────

// Removed local ActivityStatCard in favor of global StatCard

// ─── Status Badge Component (Shadcn Style) ──────────────────────────────────
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/PageHeader';


const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'Completed': return <Badge variant="outline" className="text-emerald-500 border-emerald-500 bg-emerald-500/10"><CheckCircle2 className="w-3 h-3 mr-1" />{status}</Badge>;
        case 'In Progress': return <Badge variant="outline" className="text-blue-500 border-blue-500 bg-blue-500/10"><Activity className="w-3 h-3 mr-1" />{status}</Badge>;
        case 'Pending': return <Badge variant="outline" className="text-orange-500 border-orange-500 bg-orange-500/10"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

// ─── Category Badge ────────────────────────────────────────────────────────────

const CategoryBadge = ({ category }: { category: string }) => (
    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{category}</Badge>
);

// ─── Priority Badge ────────────────────────────────────────────────────────────

const PriorityBadge = ({ type }: { type: string }) => {
    switch (type) {
        case 'Critical': return <Badge variant="destructive">{type}</Badge>;
        case 'Major': return <Badge variant="outline" className="text-rose-500 border-rose-500 bg-rose-500/10">{type}</Badge>;
        case 'Minor': return <Badge variant="outline" className="text-blue-500 border-blue-500 bg-blue-500/10">{type}</Badge>;
        default: return <Badge variant="outline">{type}</Badge>;
    }
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const ActivityDetailModal = ({ isOpen, onClose, activity, userAvatars }: { isOpen: boolean; onClose: () => void; activity: ActivityLog | null; userAvatars: any }) => {
    const { language, t } = useLanguage();

    return (
        <AnimatePresence>
            {isOpen && activity && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 10, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="p-9 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-start bg-slate-50/50 dark:bg-zinc-900/50">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <PriorityBadge type={activity.type} />
                                    <StatusBadge status={activity.status} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">{activity.activityName}</h2>
                                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">{activity.category} · {activity.location}</p>
                            </div>
                            <button onClick={onClose} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-9 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Fulfillment Status</p>
                                    <StatusBadge status={activity.status} />
                                </div>
                                <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Resolution Duration</p>
                                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-lg">
                                        <Clock size={16} className="text-blue-500" />
                                        {activity.duration || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Request Initiator</p>
                                    <div className="flex items-center gap-4">
                                        <UserAvatar name={activity.requester} url={userAvatars[activity.requester] || activity.avatarUrl} size="md" className="border-2 border-white dark:border-zinc-700 shadow-sm" />
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight">{activity.requester}</p>
                                            <p className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">{activity.department}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Handling Personnel</p>
                                    <div className="flex items-center gap-4">
                                        <UserAvatar name={activity.itPersonnel} url={userAvatars[activity.itPersonnel]} size="md" className="border-2 border-white dark:border-zinc-700 shadow-sm" />
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight">{activity.itPersonnel}</p>
                                            <p className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">IT Solutions Group</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {activity.remarks && (
                                <div className="p-9 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/20">
                                    <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.3em] mb-4">Fulfillment Remarks</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic pr-4">
                                        "{activity.remarks}"
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-between pt-9 border-t border-slate-50 dark:border-zinc-800/40">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2">Logged On</p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
                                        <Calendar size={14} />
                                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-9 py-6 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 flex justify-end shrink-0">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                            >
                                Close View
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ─── Danger Modal ─────────────────────────────────────────────────────────────
// (Using global DangerConfirmModal)

// ─── Main Component ────────────────────────────────────────────────────────────

export const ActivityLogManager = ({ currentUser }: { currentUser: any }) => {
    const { language, setLanguage, t } = useLanguage();
    const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [deleteActivity, setDeleteActivity] = useState<ActivityLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedData: ActivityLog[] = data.map((item: any) => ({
                    id: item.id,
                    activityName: item.activity_name,
                    category: item.category,
                    requester: item.requester,
                    department: item.department,
                    itPersonnel: item.it_personnel,
                    type: item.type,
                    status: item.status,
                    duration: item.duration,
                    remarks: item.remarks,
                    location: item.location,
                    createdAt: item.created_at,
                    completedAt: item.completed_at,
                    avatarUrl: item.avatar_url
                }));
                setActivities(formattedData);
            }

            const [extDataRes, deptDataRes, userDataRes] = await Promise.all([
                supabase.from('phone_extensions').select('name, dept, photo_url'),
                supabase.from('departments').select('name').order('name'),
                supabase.from('user_accounts').select('username, full_name, avatar_url')
            ]);

            const avatarMap: Record<string, string> = {};
            const userList: any[] = [];

            if (extDataRes.data) {
                extDataRes.data.forEach((u: any) => {
                    userList.push({
                        name: u.name,
                        department: u.dept || 'Staff',
                        avatarUrl: u.photo_url
                    });
                    if (u.photo_url) {
                        avatarMap[u.name] = u.photo_url;
                    }
                });
            }

            if (userDataRes.data) {
                userDataRes.data.forEach((u: any) => {
                    if (u.avatar_url) {
                        avatarMap[u.username] = u.avatar_url;
                        if (u.full_name) {
                            avatarMap[u.full_name] = u.avatar_url;
                        }
                    }
                });
            }

            setUserAvatars(avatarMap);
            setUsers(userList);

            if (deptDataRes.data) {
                setDepartments(deptDataRes.data.map((d: any) => d.name));
            }

        } catch (error: any) {
            console.error('Error fetching activities:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateFilterType, setDateFilterType] = useState('All');

    useEffect(() => {
        fetchActivities();
        const subscription = supabase
            .channel('activity_logs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
                fetchActivities();
            })
            .subscribe();
        return () => { subscription.unsubscribe(); };
    }, []);

    const filteredActivities = activities.filter(activity => {
        const matchesSearch =
            activity.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.itPersonnel.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || activity.status === statusFilter;

        let matchesDate = true;
        if (startDate && endDate) {
            const activityDate = new Date(activity.createdAt).toISOString().split('T')[0];
            matchesDate = activityDate >= startDate && activityDate <= endDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleExportExcel = () => {
        if (filteredActivities.length === 0) return;
        const dataToExport = filteredActivities.map(act => ({
            "Activity Name": act.activityName,
            "Category": act.category,
            "Requester": act.requester,
            "Department": act.department,
            "IT Personnel": act.itPersonnel,
            "Priority": act.type,
            "Status": act.status,
            "Duration": act.duration || "-",
            "Location": act.location,
            "Remarks": act.remarks || "-",
            "Created At": act.createdAt ? new Date(act.createdAt).toLocaleString() : "-",
            "Completed At": act.completedAt ? new Date(act.completedAt).toLocaleString() : "-"
        }));
        exportToExcel(dataToExport, `GESIT-ACTIVITY-${new Date().toISOString().split('T')[0]}`);
    };

    const [isPresenting, setIsPresenting] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const stats = useMemo(() => {
        const total = filteredActivities.length;
        const complete = filteredActivities.filter(a => a.status === 'Completed').length;
        const active = filteredActivities.filter(a => a.status === 'In Progress').length;
        const highAlerts = filteredActivities.filter(a => a.type === 'Critical' || a.type === 'Major').length;
        return { total, complete, active, highAlerts };
    }, [filteredActivities]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    const totalPages = Math.max(Math.ceil(filteredActivities.length / rowsPerPage), 1);
    const paginatedActivities = filteredActivities.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const startItem = (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, filteredActivities.length);

    const handleDateFilterTypeChange = (type: string) => {
        setDateFilterType(type);
        const today = new Date();
        if (type === 'All') { setStartDate(''); setEndDate(''); }
        else if (type === 'Today') { setStartDate(today.toISOString().split('T')[0]); setEndDate(today.toISOString().split('T')[0]); }
        else if (type === 'Week') {
            const first = new Date(today.setDate(today.getDate() - today.getDay()));
            const last = new Date(today.setDate(today.getDate() - today.getDay() + 6));
            setStartDate(first.toISOString().split('T')[0]); setEndDate(last.toISOString().split('T')[0]);
        } else if (type === 'Month') {
            setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
            setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]);
        } else if (type === 'Custom') {
            // Keep existing dates if any, or leave empty for user to fill
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

    // ─── Presenter Overlay ────────────────────────────────────────────────────

    const renderSlideshowOverlay = () => {
        if (!isPresenting) return null;
        const currentActivity = filteredActivities[currentSlideIndex];
        return (
            <div className={`fixed inset-0 z-[5000] ${isDarkTheme ? 'bg-[#0f0f17]' : 'bg-[#f8fafc]'} flex flex-col items-center justify-center overflow-hidden`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[160px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-emerald-600/5 rounded-full blur-[160px]" />
                </div>

                <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-center z-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Activity className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="block text-2xl font-black text-slate-900 dark:text-white leading-none">Activity Report</span>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Presentation Engine</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsDarkTheme(!isDarkTheme)} className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                            {isDarkTheme ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                        </button>
                        <button onClick={toggleFullScreen} className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                            {isFullScreen ? <Minimize2 size={20} strokeWidth={2.5} /> : <Maximize2 size={20} strokeWidth={2.5} />}
                        </button>
                        <button onClick={() => setIsPresenting(false)} className="px-6 py-4 rounded-xl bg-rose-500 text-white font-black text-[13px] hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2">
                            <XCircle size={18} strokeWidth={2.5} /> End Session
                        </button>
                    </div>
                </div>

                {currentActivity && (
                    <motion.div key={currentActivity.id} initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative z-40 w-full max-w-6xl px-12">
                        <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-slate-100 dark:border-zinc-800 shadow-2xl p-20 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-6 transition-all duration-700">
                                <Activity size={300} strokeWidth={1} />
                            </div>

                            <div className="grid grid-cols-12 gap-16 items-center relative z-10">
                                <div className="col-span-4 flex flex-col items-center text-center border-r border-slate-50 dark:border-zinc-800/60 pr-16">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                                        <UserAvatar name={currentActivity.requester} url={userAvatars[currentActivity.requester] || currentActivity.avatarUrl} size="xl" className="w-56 h-56 border-8 border-white dark:border-zinc-800 shadow-xl relative z-10" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 leading-tight tracking-tight">{currentActivity.requester}</h3>
                                    <span className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em]">{currentActivity.department}</span>
                                    <div className="mt-8 flex flex-col gap-3 w-full">
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Location Anchor</p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-200">{currentActivity.location}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-8">
                                    <div className="flex items-center gap-4 mb-8">
                                        <PriorityBadge type={currentActivity.type} />
                                        <StatusBadge status={currentActivity.status} />
                                        <CategoryBadge category={currentActivity.category} />
                                    </div>
                                    <h2 className="text-6xl font-black text-slate-900 dark:text-white mb-10 leading-[1.1] tracking-tighter">{currentActivity.activityName}</h2>
                                    {currentActivity.remarks && (
                                        <div className="p-10 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/30 mb-12 relative">
                                            <div className="absolute left-6 top-6 text-blue-200 dark:text-blue-900">
                                                <FileText size={40} strokeWidth={3} />
                                            </div>
                                            <p className="text-2xl font-bold text-slate-600 dark:text-slate-300 italic leading-relaxed pl-14">
                                                "{currentActivity.remarks}"
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-10 pt-10 border-t border-slate-50 dark:border-zinc-800/60">
                                        <div>
                                            <span className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Support Unit</span>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={currentActivity.itPersonnel} url={userAvatars[currentActivity.itPersonnel]} size="md" className="border-2 border-white dark:border-zinc-700" />
                                                <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">{currentActivity.itPersonnel}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Mission Duration</span>
                                            <div className="flex items-center gap-3 text-2xl font-black text-slate-900 dark:text-white">
                                                <Clock size={24} className="text-blue-500" strokeWidth={2.5} />
                                                {currentActivity.duration || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Logs Timestamp</span>
                                            <div className="flex items-center gap-3 text-2xl font-black text-emerald-500">
                                                <Calendar size={24} strokeWidth={2.5} />
                                                {formatDate(currentActivity.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="absolute bottom-16 flex items-center gap-10">
                    <button onClick={() => setCurrentSlideIndex(p => (p - 1 + filteredActivities.length) % filteredActivities.length)} className="p-6 rounded-full bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-xl hover:scale-110 active:scale-95"><ChevronLeft size={36} strokeWidth={2.5} /></button>
                    <div className="flex items-center gap-3 py-4 px-8 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-full border border-slate-200 dark:border-zinc-800/50">
                        {filteredActivities.slice(0, 8).map((_, idx) => (
                            <div key={idx} onClick={() => setCurrentSlideIndex(idx)} className={`rounded-full transition-all duration-500 cursor-pointer ${idx === currentSlideIndex ? 'w-10 h-3 bg-blue-600 shadow-lg shadow-blue-500/40' : 'w-3 h-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'}`} />
                        ))}
                        {filteredActivities.length > 8 && <span className="text-[11px] font-black text-slate-400 ml-2 uppercase tracking-widest leading-none">+{filteredActivities.length - 8} MORE</span>}
                    </div>
                    <button onClick={() => setCurrentSlideIndex(p => (p + 1) % filteredActivities.length)} className="p-6 rounded-full bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-xl hover:scale-110 active:scale-95"><ChevronRight size={36} strokeWidth={2.5} /></button>
                </div>
            </div>
        );
    };

    // ─── Loading State ────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="p-6 md:p-8 space-y-6 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-64" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
                </div>
                <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
        );
    }

    // ─── Main Render ──────────────────────────────────────────────────────────

    return (
        <div className="w-full min-h-screen bg-transparent p-6 space-y-6 animate-in fade-in duration-500">
            {renderSlideshowOverlay()}

            {/* ─── Shadcn UI Header ─────────── */}
            <PageHeader title="Activity Logs" description="Monitor and manage all system activities.">
                <Button variant="outline" size="icon" onClick={() => { setIsPresenting(true); toggleFullScreen(); }}>
                    <Presentation className="w-4" />
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                    <FileSpreadsheet className="mr-2 w-4" /> Export Excel
                </Button>
                <Button variant="outline" size="icon" onClick={fetchActivities} disabled={isLoading}>
                    <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {canManage && (
                    <Button
                        onClick={() => { setSelectedActivity(null); setIsFormOpen(true); }}
                        className="/90 dark:/90"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Activity
                    </Button>
                )}
            </PageHeader>

            {/* ─── Shadcn Stat Cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <StatCard label="Total Activities" value={stats.total} icon={ClipboardList} percentageChange={5} subValue="vs last week" color="slate" />
                <StatCard label="Completed" value={stats.complete} icon={CheckCircle2} percentageChange={12} subValue="vs last week" color="emerald" status="on-track" />
                <StatCard label="In Progress" value={stats.active} icon={Activity} percentageChange={2} subValue="vs last week" color="blue" />
                <StatCard label="High Alert" value={stats.highAlerts} icon={AlertCircle} percentageChange={-5} subValue="vs last week" color="rose" status="at-risk" />
            </div>

            {/* ─── Activity List Table ──────────────────────────────────────── */}
            <Card className="rounded-xl border-border/40 shadow-xl overflow-hidden bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm">
                {/* Table Header / Search & Filters */}
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
                    <div>
                        <CardTitle>Recent Activities</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Comprehensive audit trail of internal activities.</p>
                    </div>

                    <div className="flex items-center gap-2 flex-1 max-w-2xl justify-end px-2">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            <Input
                                type="text"
                                placeholder="Search activities..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 bg-muted/30 border-none rounded-xl text-xs font-medium placeholder:text-muted-foreground/40"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {dateFilterType === 'Custom' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-auto h-9"
                                    />
                                    <span className="text-muted-foreground text-sm">to</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-auto h-9"
                                    />
                                </motion.div>
                            )}

                            <select
                                className="h-9 px-3 py-1 border border-input rounded-md text-sm font-medium bg-background text-foreground hover:bg-accent cursor-pointer outline-none"
                                value={dateFilterType}
                                onChange={e => handleDateFilterTypeChange(e.target.value)}
                            >
                                <option value="All">All Time</option>
                                <option value="Today">Today</option>
                                <option value="Week">This Week</option>
                                <option value="Month">This Month</option>
                                <option value="Custom">Custom Period</option>
                            </select>
                        </div>

                        <Button
                            variant={statusFilter !== 'All' ? 'default' : 'outline'}
                            onClick={() => {
                                const statuses = ['All', 'Completed', 'In Progress', 'Pending'];
                                const currentIndex = statuses.indexOf(statusFilter);
                                setStatusFilter(statuses[(currentIndex + 1) % statuses.length]);
                                setCurrentPage(1);
                            }}
                            title="Filter by status"
                            className="border-border/50 bg-background/50 hover:bg-accent transition-all text-xs font-bold uppercase tracking-wider min-w-36 justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <Filter size={14} className="text-muted-foreground" />
                                {statusFilter === 'All' ? 'All Status' : statusFilter}
                            </span>
                        </Button>
                    </div>
                </CardHeader>

                {/* Table */}
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30 border-b border-border/50">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="pl-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Activity Name</TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Status</TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Priority</TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Requester</TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Date</TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">IT Personnel</TableHead>
                                    <TableHead className="w-12 text-right pr-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedActivities.map((act, idx) => (
                                    <TableRow
                                        key={act.id}
                                        className="group"
                                    >
                                        <TableCell className="pl-8 py-5 cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{act.activityName}</span>
                                                    <div className="mt-1"><CategoryBadge category={act.category} /></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}><StatusBadge status={act.status} /></TableCell>
                                        <TableCell className="cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}><PriorityBadge type={act.type} /></TableCell>
                                        <TableCell className="cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={act.requester} url={userAvatars[act.requester] || act.avatarUrl} size="sm" className="border-2 border-white dark:border-zinc-800 shadow-sm" />
                                                <div>
                                                    <span className="font-bold text-sm block leading-none text-slate-700 dark:text-slate-300">{act.requester}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 mt-1">{act.department}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-muted-foreground/60 cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>{formatDate(act.createdAt)}</TableCell>
                                        <TableCell className="cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={act.itPersonnel} url={userAvatars[act.itPersonnel]} size="sm" className="border-2 border-white dark:border-zinc-800 shadow-sm" />
                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{act.itPersonnel}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedActivity(act); setIsDetailOpen(true); }}
                                                    className="w-8 text-muted-foreground dark:"
                                                >
                                                    <Eye size={16} />
                                                </Button>

                                                {(isAdmin || (isStaff && act.itPersonnel === (currentUser?.fullName || currentUser?.username))) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedActivity(act); setIsFormOpen(true); }}
                                                        className="w-8 text-muted-foreground dark:"
                                                    >
                                                        <Edit size={16} />
                                                    </Button>
                                                )}

                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => { e.stopPropagation(); setDeleteActivity(act); }}
                                                        className="w-8 text-muted-foreground dark:"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedActivities.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shadow-inner border border-border">
                                                    <ClipboardList size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium text-lg leading-tight">No records found</p>
                                                    <p className="text-sm text-muted-foreground">We couldn't find any activities matching your current search or filters.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="mt-2"
                                                    onClick={() => { setSearchTerm(''); setStatusFilter('All'); setDateFilterType('All'); }}
                                                >
                                                    Clear all filters
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-border/40 bg-muted/20">
                        <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <span>Showing {filteredActivities.length > 0 ? startItem : 0} to {endItem} of {filteredActivities.length}</span>
 
                            <div className="flex items-center gap-4 ml-2 pl-6 border-l border-border/40">
                                <span>Rows per page</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="bg-transparent border-none outline-none text-primary font-black cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <Button variant="ghost" size="icon" className="w-7 hover:bg-background/80" onClick={fetchActivities} title="Refresh">
                                    <RefreshCcw size={12} className="text-muted-foreground/60" />
                                </Button>
                            </div>
                        </div>
 
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-9 border-border/50">
                                <ChevronsLeft size={16} />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-9 border-border/50">
                                <ChevronLeft size={16} />
                            </Button>
 
                            <div className="flex items-center justify-center min-w-[36px] h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black">
                                {currentPage}
                            </div>
 
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-9 border-border/50">
                                <ChevronRight size={16} />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-9 border-border/50">
                                <ChevronsRight size={16} />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Modals ──────────────────────────────────────────────────── */}
            <ActivityDetailModal 
                isOpen={isDetailOpen} 
                onClose={() => setIsDetailOpen(false)} 
                activity={selectedActivity} 
                userAvatars={userAvatars} 
            />
            <ActivityFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={async (data) => {
                    setIsActionLoading(true);
                    try {
                        const payload = {
                            activity_name: data.activityName,
                            category: data.category,
                            requester: data.requester,
                            department: data.department,
                            it_personnel: data.itPersonnel,
                            type: data.type,
                            status: data.status,
                            remarks: data.remarks,
                            location: data.location,
                            duration: data.duration,
                            created_at: data.createdAt,
                            updated_at: data.updatedAt,
                            completed_at: data.completedAt
                        };
                        if (selectedActivity) {
                            await supabase.from('activity_logs').update(payload).eq('id', selectedActivity.id);
                        } else {
                            await supabase.from('activity_logs').insert([payload]);
                        }
                        fetchActivities();
                        setIsFormOpen(false);
                    } catch (err) { console.error(err); }
                    finally { setIsActionLoading(false); }
                }}
                initialData={selectedActivity}
                currentUserName={currentUser?.fullName || currentUser?.username}
                users={users}
                departments={departments.length > 0 ? departments : ['IT', 'Finance', 'HR', 'Operations', 'Sales', 'Marketing', 'Production', 'Logistics', 'Security']}
            />
            <DangerConfirmModal
                isOpen={!!deleteActivity}
                onClose={() => setDeleteActivity(null)}
                title="Delete Activity"
                message={<>Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-100">{deleteActivity?.activityName}</span>? This action cannot be undone.</>}
                isLoading={isActionLoading}
                entityName={deleteActivity?.activityName}
                onConfirm={async () => {
                    if (!deleteActivity) return;
                    setIsActionLoading(true);
                    try {
                        await supabase.from('activity_logs').delete().eq('id', deleteActivity.id);
                        fetchActivities();
                        setDeleteActivity(null);
                    } catch (err) { console.error(err); }
                    finally { setIsActionLoading(false); }
                }}
            />
        </div>
    );
};

