'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Search, Plus, Trash2, RefreshCcw, CheckCircle2, Clock,
    ClipboardList, Zap, Filter, Calendar, AlertCircle,
    ChevronLeft, ChevronRight, RotateCcw, Eye, Pencil, Presentation, LayoutList, BarChart3, User, MonitorPlay, ArrowLeft, ArrowRight, X, Sun, Moon
} from 'lucide-react';
import { ActivityLog, UserAccount } from '../types';
import { ActivityFormModal } from './ActivityFormModal';
import { ActivityDetailModal } from './ActivityDetailModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { StatCard } from './MainDashboard';

interface ActivityLogManagerProps {
    currentUser: UserAccount | null;
}

export const ActivityLogManager: React.FC<ActivityLogManagerProps> = ({ currentUser }) => {
    const [isPresenting, setIsPresenting] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [presentationSubMode, setPresentationSubMode] = useState<'board' | 'slideshow'>('board');
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
    const [deleteActivity, setDeleteActivity] = useState<ActivityLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase.from('activity_logs').select('*');
            if (data) {
                setActivities(data.map(a => ({
                    id: a.id,
                    activityName: a.activity_name,
                    category: a.category,
                    requester: a.requester,
                    department: a.department,
                    itPersonnel: a.it_personnel,
                    type: a.type,
                    status: a.status,
                    duration: a.duration,
                    remarks: a.remarks,
                    location: a.location,
                    createdAt: a.created_at,
                    completedAt: a.completed_at,
                    updatedAt: a.updated_at
                })));
            }
        } catch (err) { console.error("Fetch error", err); } finally { setIsLoading(false); }
    };

    useEffect(() => {
        fetchActivities();
        setIsDarkTheme(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleInternalTheme = () => {
        const newTheme = !isDarkTheme;
        setIsDarkTheme(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const filteredActivities = useMemo(() => {
        return activities.filter(a => {
            const matchesSearch =
                (a.activityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.itPersonnel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.requester || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
            const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
            let matchesDate = true;
            if (startDate) matchesDate = matchesDate && new Date(a.createdAt) >= new Date(startDate);
            if (endDate) matchesDate = matchesDate && new Date(a.createdAt) <= new Date(endDate);
            return matchesSearch && matchesCategory && matchesStatus && matchesDate;
        }).sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    }, [activities, searchTerm, categoryFilter, statusFilter, startDate, endDate]);

    const handleNextSlide = useCallback(() => {
        if (currentSlideIndex < filteredActivities.length - 1) {
            setDirection('next');
            setCurrentSlideIndex(prev => prev + 1);
        }
    }, [currentSlideIndex, filteredActivities.length]);

    const handlePrevSlide = useCallback(() => {
        if (currentSlideIndex > 0) {
            setDirection('prev');
            setCurrentSlideIndex(prev => prev - 1);
        }
    }, [currentSlideIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFullScreen) return;
            if (e.key === 'ArrowRight') handleNextSlide();
            if (e.key === 'ArrowLeft') handlePrevSlide();
            if (e.key === 'Escape') setIsFullScreen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen, handleNextSlide, handlePrevSlide]);

    const formatDateShort = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const renderSlideshowOverlay = () => {
        if (!isFullScreen || filteredActivities.length === 0) return null;
        const current = filteredActivities[currentSlideIndex];

        return (
            <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-between p-12 sm:p-16 transition-colors duration-500 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px]"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="w-full flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-1000 relative z-10">
                    <div className="flex items-center gap-5">
                        <img src="https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png" className="h-8 w-auto dark:brightness-200" />
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Activity Log</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">record of activities</p></div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleInternalTheme}
                            className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl transition-all active:scale-95 border border-slate-200 dark:border-slate-800 shadow-sm"
                            title="Toggle Presentation Vibe"
                        >
                            {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={() => setIsFullScreen(false)}
                            className="p-3 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 rounded-2xl transition-all active:scale-95 border border-slate-200 dark:border-slate-800 shadow-sm"
                            title="Close Presentation"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div
                    key={current.id}
                    className={`w-full max-w-5xl flex flex-col items-center flex-1 justify-center animate-in fade-in duration-1000 relative z-10 ${direction === 'next' ? 'slide-in-from-right-10' : 'slide-in-from-left-10'
                        }`}
                >
                    <div className="text-center space-y-4 mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold tracking-[0.2em] border border-blue-100 dark:border-blue-900/50 uppercase">
                            {current.category} Record
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
                            {current.activityName}
                        </h1>
                    </div>

                    <div className="w-full bg-white dark:bg-slate-900/40 rounded-[3rem] p-10 md:p-14 border border-slate-200 dark:border-white/5 shadow-2xl dark:shadow-none backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                            <div
                                className="h-full bg-blue-600 transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                style={{ width: `${((currentSlideIndex + 1) / filteredActivities.length) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex items-center justify-center gap-3 mb-8 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">
                            <Zap size={14} className="text-blue-500" /> Resolution Analysis
                        </div>
                        <p className="text-xl md:text-3xl text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed text-center px-4 md:px-8">
                            "{current.remarks || "Operation finalized and stabilized within standard operating protocols."}"
                        </p>
                    </div>

                    <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-4xl">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">Engineer</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">{current.itPersonnel}</p>
                        </div>
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">Requester</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">{current.requester || 'System Core'}</p>
                        </div>
                        <div className="flex flex-col items-center gap-3 text-center">
                            <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">Timeline</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{formatDateShort(current.updatedAt || current.createdAt)}</p>
                        </div>
                    </div>
                </div>

                <div className="w-full flex items-center justify-between mt-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 relative z-10">
                    <button
                        onClick={handlePrevSlide}
                        disabled={currentSlideIndex === 0}
                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-5 flex items-center justify-center active:scale-90 shadow-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">Registry</span>
                        <div className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-mono text-sm font-bold shadow-xl">
                            {currentSlideIndex + 1} <span className="opacity-30 mx-1">/</span> {filteredActivities.length}
                        </div>
                    </div>
                    <button
                        onClick={handleNextSlide}
                        disabled={currentSlideIndex === filteredActivities.length - 1}
                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-5 flex items-center justify-center active:scale-90 shadow-sm"
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        );
    };

    const paginatedActivities = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredActivities.slice(start, start + itemsPerPage);
    }, [filteredActivities, currentPage]);

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

    const stats = useMemo(() => ({
        total: filteredActivities.length,
        completed: filteredActivities.filter(a => a.status === 'Completed').length,
        troubleshooting: filteredActivities.filter(a => a.category === 'Troubleshooting').length,
        maintenance: filteredActivities.filter(a => a.category === 'Maintenance').length,
        critical: filteredActivities.filter(a => a.type === 'Critical').length
    }), [filteredActivities]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed':
                return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-full text-[10px] font-bold"><CheckCircle2 size={12} /> Done</div>;
            case 'In Progress':
                return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-full text-[10px] font-bold"><Clock size={12} /> In Progress</div>;
            case 'Pending':
                return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 rounded-full text-[10px] font-bold"><AlertCircle size={12} /> Pending</div>;
            default:
                return <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-bold">{status}</div>;
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setCategoryFilter('All');
        setStatusFilter('All');
        setStartDate('');
        setEndDate('');
        setShowDatePicker(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {renderSlideshowOverlay()}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Activity Log</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Record of activities</p></div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPresenting(!isPresenting)}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 border ${isPresenting ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
                    >
                        {isPresenting ? <LayoutList size={18} /> : <Presentation size={18} />}
                        {isPresenting ? 'Standard View' : 'Present Results'}
                    </button>
                    {!isPresenting && canManage && (
                        <button
                            onClick={() => { setSelectedActivity(null); setIsFormOpen(true); }}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/10"
                        >
                            <Plus size={18} /> New Log
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-500">
                <StatCard label={isPresenting ? "Stabilized nodes" : "Resolved tasks"} value={stats.completed} icon={CheckCircle2} color="emerald" />
                <StatCard label={isPresenting ? "Logic Repairs" : "Active process"} value={stats.troubleshooting} icon={BarChart3} color="blue" />
                <StatCard label={isPresenting ? "Infra Registry" : "Total registry"} value={stats.maintenance} icon={RefreshCcw} color="indigo" />
                <StatCard label={isPresenting ? "Critical Alerts" : "High alerts"} value={stats.critical} icon={Zap} color="rose" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                        <input type="text" placeholder="Search logs..." className="w-full h-10 pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-blue-500/20 rounded-xl text-sm font-medium dark:text-slate-200 outline-none transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="All">All Categories</option><option value="Troubleshooting">Troubleshooting</option><option value="Maintenance">Maintenance</option><option value="Installation">Installation</option><option value="Other">Other</option></select>
                        <select className="h-10 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="All">All Status</option><option value="Completed">Completed</option><option value="In Progress">In Progress</option><option value="Pending">Pending</option></select>
                        <button onClick={() => setShowDatePicker(!showDatePicker)} className={`h-10 w-10 shrink-0 rounded-xl border transition-all flex items-center justify-center ${showDatePicker ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600'}`}><Filter size={18} /></button>
                        <button onClick={resetFilters} className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm"><RotateCcw size={18} /></button>
                    </div>
                </div>
                {showDatePicker && (
                    <div className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Period start</label><div className="relative"><input type="date" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white cursor-pointer" onClick={(e) => e.currentTarget.showPicker()} value={startDate} onChange={e => setStartDate(e.target.value)} /></div></div>
                        <div className="space-y-1.5"><label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Period end</label><div className="relative"><input type="date" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white cursor-pointer" onClick={(e) => e.currentTarget.showPicker()} value={endDate} onChange={e => setEndDate(e.target.value)} /></div></div>
                    </div>
                )}
            </div>

            {!isPresenting ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-[11px] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Task Identity</th>
                                    <th className="px-6 py-4">Originator</th>
                                    <th className="px-6 py-4">Severity</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Timeline</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr><td colSpan={6} className="px-6 py-20 text-center"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={28} /></td></tr>
                                ) : paginatedActivities.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No logs found</td></tr>
                                ) : paginatedActivities.map((act) => (
                                    <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group align-top">
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col max-w-xs">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight mb-0.5 leading-tight">{act.itPersonnel} — {act.activityName}</span>
                                                <span className="text-[10px] font-semibold text-slate-400 italic">({act.category})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{act.requester || 'IT'}</span>
                                                <span className="text-[10px] font-medium text-slate-400 mt-0.5">{act.department || 'Global'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${act.type === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{act.type}</span>
                                        </td>
                                        <td className="px-6 py-6">{getStatusIcon(act.status)}</td>
                                        <td className="px-6 py-6 text-xs font-mono text-slate-400 font-bold">{formatDateShort(act.createdAt)}</td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"><Eye size={16} /></button>
                                                {canManage && <button onClick={() => { setSelectedActivity(act); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all"><Pencil size={16} /></button>}
                                                {canDelete && <button onClick={() => setDeleteActivity(act)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Trash2 size={16} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-slate-400">Page {currentPage} of {totalPages || 1}</p>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30"><ChevronLeft size={18} /></button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex border border-slate-200 dark:border-slate-700">
                            <button onClick={() => setPresentationSubMode('board')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${presentationSubMode === 'board' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Report Grid</button>
                            <button onClick={() => setPresentationSubMode('slideshow')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${presentationSubMode === 'slideshow' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Slide Preview</button>
                        </div>
                        {presentationSubMode === 'slideshow' && <button onClick={() => setIsFullScreen(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg hover:bg-black active:scale-95 transition-all"><MonitorPlay size={16} /> Open Cinema Mode</button>}
                    </div>

                    {filteredActivities.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-20 text-center border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-widest">No matching activities for presentation</div>
                    ) : presentationSubMode === 'board' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredActivities.slice(0, 8).map(act => (
                                <div key={act.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-6 relative overflow-hidden transition-all hover:shadow-xl hover:border-indigo-100">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                    <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">{act.category}</span><span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">{formatDateShort(act.updatedAt || act.createdAt)}</span></div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{act.activityName}</h2>
                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 italic text-sm text-slate-700 dark:text-slate-300 leading-relaxed">"{act.remarks || "No additional notes."}"</div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">{act.itPersonnel?.charAt(0)}</div><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{act.itPersonnel}</p></div><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner"><User size={14} /></div><p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{act.requester || 'Internal'}</p></div></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8 py-10 bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                            <div key={filteredActivities[currentSlideIndex].id} className={`w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 shadow-xl border border-slate-50 dark:border-slate-800 animate-in fade-in duration-500 ${direction === 'next' ? 'slide-in-from-right-10' : 'slide-in-from-left-10'}`}>
                                <div className="flex justify-between items-center mb-8"><span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">Report Slide {currentSlideIndex + 1}</span>{getStatusIcon(filteredActivities[currentSlideIndex].status)}</div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">{filteredActivities[currentSlideIndex].activityName}</h2>
                                <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-2xl mb-8 border border-slate-100 dark:border-white/5 italic"><p className="text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed">"{filteredActivities[currentSlideIndex].remarks || "Finalized."}"</p></div>
                                <div className="flex justify-between items-center pt-8 border-t border-slate-100 dark:border-slate-800 text-xs"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold">{filteredActivities[currentSlideIndex].itPersonnel?.charAt(0)}</div><div><p className="font-bold text-slate-800 dark:text-white">{filteredActivities[currentSlideIndex].itPersonnel}</p><p className="text-[9px] text-slate-400 uppercase tracking-widest">Engineer</p></div></div><div className="text-right"><p className="font-bold text-indigo-600 dark:text-indigo-400">{formatDateShort(filteredActivities[currentSlideIndex].updatedAt || filteredActivities[currentSlideIndex].createdAt)}</p><p className="text-[9px] text-slate-400 uppercase tracking-widest">Execution Date</p></div></div>
                            </div>
                            <div className="flex items-center gap-6"><button onClick={handlePrevSlide} disabled={currentSlideIndex === 0} className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center disabled:opacity-30 active:scale-90"><ArrowLeft size={20} /></button><div className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-indigo-500/20">{currentSlideIndex + 1} / {filteredActivities.length}</div><button onClick={handleNextSlide} disabled={currentSlideIndex === filteredActivities.length - 1} className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center disabled:opacity-30 active:scale-90"><ArrowRight size={20} /></button></div>
                        </div>
                    )}
                </div>
            )}

            <ActivityFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={async (formData) => {
                setIsActionLoading(true);
                try {
                    const payload = { activity_name: formData.activityName, category: formData.category, requester: formData.requester, department: formData.department, it_personnel: formData.itPersonnel, type: formData.type, status: formData.status, remarks: formData.remarks, location: formData.location, duration: formData.duration, created_at: formData.createdAt, updated_at: formData.updatedAt };
                    if (selectedActivity) await supabase.from('activity_logs').update(payload).eq('id', selectedActivity.id);
                    else await supabase.from('activity_logs').insert([payload]);
                    await fetchActivities();
                    setIsFormOpen(false);
                } catch (err) { console.error(err); } finally { setIsActionLoading(false); }
            }} initialData={selectedActivity} currentUserName={currentUser?.fullName} />

            <ActivityDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} activity={selectedActivity} />
            <DangerConfirmModal isOpen={!!deleteActivity} onClose={() => setDeleteActivity(null)} onConfirm={async () => { await supabase.from('activity_logs').delete().eq('id', deleteActivity!.id); setDeleteActivity(null); fetchActivities(); }} title="Delete Log Entry" message={`Are you sure you want to delete the log for "${deleteActivity?.activityName}"?`} isLoading={isActionLoading} />
        </div>
    );
};
