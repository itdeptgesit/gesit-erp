'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Calendar, Plus, ChevronLeft, ChevronRight, RefreshCcw,
    Loader2, Pencil, Trash2, CalendarRange, LayoutList, X,
    Clock, User, Tag, AlertCircle, CheckCircle2
} from 'lucide-react';
import { WeeklyPlan, UserAccount } from '../types';
import { WeeklyTaskModal } from './WeeklyTaskModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastProvider';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const INDONESIAN_HOLIDAYS: { [key: string]: string } = {
    // 2025 — National Holidays
    '2025-01-01': 'Tahun Baru Masehi',
    '2025-01-27': 'Isra Mi\'raj',
    '2025-01-29': 'Tahun Baru Imlek',
    '2025-03-29': 'Hari Raya Nyepi',
    '2025-03-31': 'Idul Fitri',
    '2025-04-01': 'Idul Fitri',
    '2025-04-18': 'Wafat Yesus Kristus',
    '2025-05-01': 'Hari Buruh Internasional',
    '2025-05-12': 'Hari Raya Waisak',
    '2025-05-29': 'Kenaikan Yesus Kristus',
    '2025-06-01': 'Hari Lahir Pancasila',
    '2025-06-06': 'Idul Adha',
    '2025-06-27': 'Tahun Baru Islam',
    '2025-08-17': 'Hari Kemerdekaan RI',
    '2025-09-05': 'Maulid Nabi Muhammad',
    '2025-12-25': 'Hari Raya Natal',
    // 2025 — Cuti Bersama
    '2025-01-28': 'Cuti Bersama Isra Mikraj',
    '2025-01-30': 'Cuti Bersama Imlek',
    '2025-03-28': 'Cuti Bersama Nyepi',
    '2025-04-02': 'Cuti Bersama Idul Fitri',
    '2025-04-03': 'Cuti Bersama Idul Fitri',
    '2025-04-04': 'Cuti Bersama Idul Fitri',
    '2025-04-07': 'Cuti Bersama Idul Fitri',
    '2025-05-13': 'Cuti Bersama Waisak',
    '2025-05-30': 'Cuti Bersama Kenaikan Yesus',
    '2025-12-26': 'Cuti Bersama Natal',
    // 2026 — National Holidays
    '2026-01-01': 'Tahun Baru Masehi',
    '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW',
    '2026-02-17': 'Tahun Baru Imlek 2577',
    '2026-03-19': 'Hari Raya Nyepi',
    '2026-03-21': 'Idul Fitri 1447 H',
    '2026-03-22': 'Idul Fitri 1447 H',
    '2026-04-03': 'Wafat Yesus Kristus',
    '2026-04-05': 'Kebangkitan Yesus Kristus',
    '2026-05-01': 'Hari Buruh Internasional',
    '2026-05-14': 'Kenaikan Yesus Kristus',
    '2026-05-27': 'Idul Adha 1447 H',
    '2026-05-31': 'Hari Raya Waisak',
    '2026-06-01': 'Hari Lahir Pancasila',
    '2026-06-16': 'Tahun Baru Islam 1448 H',
    '2026-08-17': 'Hari Kemerdekaan RI',
    '2026-08-25': 'Maulid Nabi Muhammad SAW',
    '2026-12-25': 'Hari Raya Natal',
    // 2026 — Cuti Bersama
    '2026-02-16': 'Cuti Bersama Imlek',
    '2026-03-18': 'Cuti Bersama Nyepi',
    '2026-03-20': 'Cuti Bersama Idul Fitri',
    '2026-03-23': 'Cuti Bersama Idul Fitri',
    '2026-03-24': 'Cuti Bersama Idul Fitri',
    '2026-05-15': 'Cuti Bersama Kenaikan Yesus',
    '2026-05-28': 'Cuti Bersama Idul Adha',
    '2026-12-24': 'Cuti Bersama Natal',
};

// Cuti Bersama get amber styling instead of red
const isCutiBersamaDate = (dateStr: string) =>
    !!INDONESIAN_HOLIDAYS[dateStr]?.toLowerCase().includes('cuti bersama');

// Category color mapping (vibrant, like reference image)
const CATEGORY_COLORS: { [key: string]: { bg: string; text: string; dot: string } } = {
    'Meeting': { bg: 'bg-indigo-600', text: 'text-white', dot: 'bg-indigo-500' },
    'Maintenance': { bg: 'bg-amber-500', text: 'text-white', dot: 'bg-amber-500' },
    'Project': { bg: 'bg-violet-600', text: 'text-white', dot: 'bg-violet-500' },
    'Support': { bg: 'bg-emerald-500', text: 'text-white', dot: 'bg-emerald-500' },
    'Default': { bg: 'bg-slate-500', text: 'text-white', dot: 'bg-slate-400' },
};

// Priority badges
const PRIORITY_STYLE: { [key: string]: string } = {
    'High': 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    'Medium': 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    'Low': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

// Status badge
const STATUS_STYLE: { [key: string]: string } = {
    'Done': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'To Do': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

interface WeeklyPlanManagerProps {
    currentUser: UserAccount | null;
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const parseDate = (str: string) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const WeeklyPlanManager: React.FC<WeeklyPlanManagerProps> = ({ currentUser }) => {
    const { showToast } = useToast();
    const [tasks, setTasks] = useState<WeeklyPlan[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'Month' | 'List'>('Month');
    const [editingTask, setEditingTask] = useState<WeeklyPlan | null>(null);
    const [deleteTask, setDeleteTask] = useState<WeeklyPlan | null>(null);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<WeeklyPlan | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('weekly_plans')
                .select('id, task, description, assignee, priority, status, due_date, start_date, week, category, related_purchase_id, start_time');
            if (error) throw error;
            if (data) {
                setTasks(data.map(t => ({
                    id: t.id,
                    task: t.task,
                    description: t.description,
                    remarks: t.description,
                    assignee: t.assignee,
                    priority: t.priority,
                    status: t.status,
                    dueDate: (t.due_date && t.due_date.toLowerCase() !== 'nan' && t.due_date !== '-') ? t.due_date : null,
                    startDate: t.start_date || null,
                    startTime: t.start_time || '09:00',
                    week: t.week,
                    category: t.category,
                    relatedPurchaseId: t.related_purchase_id
                })));
            }
        } catch (err: any) {
            console.error("Fetch tasks error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    // Close popover on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setSelectedTask(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleEdit = (task: WeeklyPlan) => {
        setEditingTask(task);
        setSelectedTask(null);
        setIsModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteTask) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('weekly_plans').delete().eq('id', deleteTask.id);
            if (error) throw error;
            await fetchTasks();
            setDeleteTask(null);
            showToast("Task deleted", "success");
        } catch (err: any) {
            showToast("Delete failed: " + (err.message || "Unknown error"), 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const navigate = (direction: number) => {
        const next = new Date(viewDate);
        next.setMonth(next.getMonth() + direction);
        setViewDate(next);
    };

    const getCategoryStyle = (category: string) =>
        CATEGORY_COLORS[category] || CATEGORY_COLORS['Default'];

    // Build month calendar grid (Sun–Sat columns)
    const monthGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        const grid: { date: Date; currentMonth: boolean }[] = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            grid.push({ date: new Date(year, month - 1, prevMonthDays - i), currentMonth: false });
        }
        for (let i = 1; i <= totalDays; i++) {
            grid.push({ date: new Date(year, month, i), currentMonth: true });
        }
        const remaining = 42 - grid.length;
        for (let i = 1; i <= remaining; i++) {
            grid.push({ date: new Date(year, month + 1, i), currentMonth: false });
        }
        return grid;
    }, [viewDate]);

    // Get tasks that appear on a given date (multi-day spanning)
    const getTasksForDate = (date: Date): WeeklyPlan[] => {
        const dateStr = formatDate(date);
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const start = task.startDate || task.dueDate;
            const end = task.dueDate;
            return dateStr >= start && dateStr <= end;
        });
    };

    // Check if a task starts on this specific date
    const isTaskStart = (task: WeeklyPlan, date: Date) => {
        const dateStr = formatDate(date);
        return (task.startDate || task.dueDate) === dateStr;
    };

    // Check if a task ends on this specific date
    const isTaskEnd = (task: WeeklyPlan, date: Date) => {
        const dateStr = formatDate(date);
        return task.dueDate === dateStr;
    };

    // Check if it's a multi-day task
    const isMultiDay = (task: WeeklyPlan) => {
        return task.startDate && task.startDate !== task.dueDate;
    };

    // Count total events for current month
    const totalEventsThisMonth = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstStr = formatDate(new Date(year, month, 1));
        const lastStr = formatDate(new Date(year, month + 1, 0));
        return tasks.filter(t => {
            if (!t.dueDate) return false;
            const start = t.startDate || t.dueDate;
            return start <= lastStr && t.dueDate >= firstStr;
        }).length;
    }, [tasks, viewDate]);

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in duration-700 pb-8">
            {/* ── PAGE HEADER ── */}
            <PageHeader
                title={viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                description="Assignment Planner & Operational Schedule"
            >
                <div className="flex items-center gap-3">
                    {/* Event count badge */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <CalendarRange size={14} className="text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{totalEventsThisMonth} events</span>
                    </div>

                    {/* Date range display */}
                    <div className="hidden md:flex items-center text-[11px] font-medium text-slate-400 gap-1">
                        {viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' – '}
                        {new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        {[
                            { id: 'Month', icon: CalendarRange, label: 'Grid' },
                            { id: 'List', icon: LayoutList, label: 'List' },
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => setViewMode(v.id as any)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all",
                                    viewMode === v.id
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                )}
                            >
                                <v.icon size={13} />
                                {v.label}
                            </button>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 border-r border-slate-200 dark:border-slate-700 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setViewDate(new Date())} className="px-3 text-[11px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors h-full">
                            Today
                        </button>
                        <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 border-l border-slate-200 dark:border-slate-700 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {canManage && (
                        <Button
                            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                            className="bg-slate-900 dark:bg-blue-600 text-white h-9 px-4 text-xs font-bold rounded-lg hover:bg-black dark:hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
                        >
                            <Plus size={14} />
                            Add Event
                        </Button>
                    )}
                </div>
            </PageHeader>

            {/* ── MAIN CALENDAR CONTAINER ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 overflow-hidden flex flex-col relative">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <RefreshCcw className="animate-spin text-blue-500" size={28} />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Synchronizing Schedule...</p>
                    </div>
                ) : viewMode === 'Month' ? (
                    <>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                            {DAY_HEADERS.map(day => (
                                <div key={day} className={cn(
                                    "py-3 text-center text-[11px] font-bold uppercase tracking-widest",
                                    (day === 'Sat' || day === 'Sun') ? 'text-rose-400 dark:text-rose-500' : 'text-slate-400 dark:text-slate-500'
                                )}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <div className="grid grid-cols-7 min-w-[800px]" style={{ gridAutoRows: 'minmax(120px, 1fr)' }}>
                                {monthGrid.map((cell, idx) => {
                                    const dateStr = formatDate(cell.date);
                                    const dayTasks = getTasksForDate(cell.date);
                                    const holidayName = INDONESIAN_HOLIDAYS[dateStr];
                                    const isCutiBersama = isCutiBersamaDate(dateStr);
                                    const isNationalHoliday = !!holidayName && !isCutiBersama;
                                    const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
                                    const isToday = cell.date.toDateString() === new Date().toDateString();
                                    const visible = dayTasks.slice(0, 3);
                                    const overflow = dayTasks.length - 3;

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "border-r border-b border-slate-100 dark:border-slate-800 p-2 flex flex-col gap-1 min-h-[120px] relative group",
                                                !cell.currentMonth && "bg-slate-50/40 dark:bg-slate-800/10",
                                                // Cuti bersama → amber tint
                                                cell.currentMonth && isCutiBersama && "bg-amber-50/40 dark:bg-amber-900/10",
                                                // National holiday or weekend → rose tint
                                                cell.currentMonth && !isCutiBersama && (isNationalHoliday || isWeekend) && "bg-rose-50/20 dark:bg-rose-900/5",
                                                "hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-colors"
                                            )}
                                        >
                                            {/* Top row: date number + holiday label */}
                                            <div className="flex items-start justify-between mb-1">
                                                <span className={cn(
                                                    "w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold shrink-0 transition-all",
                                                    isToday
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : isCutiBersama
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : (isNationalHoliday || isWeekend)
                                                                ? 'text-rose-500 dark:text-rose-400'
                                                                : 'text-slate-500 dark:text-slate-400',
                                                    !cell.currentMonth && "opacity-30"
                                                )}>
                                                    {cell.date.getDate()}
                                                </span>
                                                {holidayName && cell.currentMonth && (
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase leading-tight text-right max-w-[80px] truncate px-1 py-0.5 rounded",
                                                        isCutiBersama
                                                            ? 'text-amber-600 dark:text-amber-400 border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                                                            : 'text-rose-500 dark:text-rose-400'
                                                    )}>
                                                        {holidayName}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Add button on hover (empty day) */}
                                            {canManage && cell.currentMonth && (
                                                <button
                                                    onClick={() => {
                                                        setEditingTask(null);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white rounded-full items-center justify-center text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity flex z-10 shadow-sm"
                                                >
                                                    +
                                                </button>
                                            )}

                                            {/* Task pills */}
                                            <div className="flex flex-col gap-0.5 flex-1">
                                                {visible.map(task => {
                                                    const style = getCategoryStyle(task.category);
                                                    const isStart = isTaskStart(task, cell.date);
                                                    const isEnd = isTaskEnd(task, cell.date);
                                                    const multi = isMultiDay(task);

                                                    // Determine pill shape based on span position
                                                    const roundClass = multi
                                                        ? isStart && isEnd ? 'rounded'
                                                            : isStart ? 'rounded-l rounded-r-none'
                                                                : isEnd ? 'rounded-r rounded-l-none'
                                                                    : 'rounded-none'
                                                        : 'rounded';

                                                    // Hide left padding for middle days
                                                    const pl = (!isStart && multi) ? 'pl-1' : 'pl-2';

                                                    return (
                                                        <button
                                                            key={task.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTask(task);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left py-0.5 pr-2 text-[10px] font-bold text-white truncate cursor-pointer transition-opacity hover:opacity-80 flex items-center gap-1 leading-relaxed",
                                                                style.bg,
                                                                roundClass,
                                                                pl,
                                                                !cell.currentMonth && "opacity-40"
                                                            )}
                                                            title={task.task}
                                                        >
                                                            {isStart && (
                                                                <span className="truncate">{task.task}</span>
                                                            )}
                                                            {!isStart && multi && (
                                                                <span className="truncate opacity-0 select-none">{task.task}</span>
                                                            )}
                                                            {!multi && (
                                                                <>
                                                                    <span className="truncate flex-1">{task.task}</span>
                                                                    {task.startTime && (
                                                                        <span className="opacity-70 shrink-0">{task.startTime}</span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                                {overflow > 0 && (
                                                    <button
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-[9px] font-bold text-blue-500 dark:text-blue-400 hover:text-blue-700 text-left px-1"
                                                    >
                                                        {overflow} more...
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    /* ── LIST VIEW ── */
                    <div className="flex-1 overflow-auto custom-scrollbar p-6">
                        {tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 opacity-30">
                                <Calendar size={48} className="text-slate-400 mb-4" />
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">No tasks scheduled</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {[...tasks]
                                    .sort((a, b) => (a.startDate || a.dueDate || '').localeCompare(b.startDate || b.dueDate || ''))
                                    .map(task => {
                                        const style = getCategoryStyle(task.category);
                                        const multi = isMultiDay(task);
                                        return (
                                            <div key={task.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                                                <div className={cn("w-1 self-stretch rounded-full shrink-0", style.bg)} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded text-white", style.bg)}>{task.category}</span>
                                                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", PRIORITY_STYLE[task.priority])}>{task.priority}</span>
                                                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", STATUS_STYLE[task.status])}>{task.status}</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{task.task}</h4>
                                                    {task.description && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 text-right space-y-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 justify-end">
                                                        <Calendar size={11} />
                                                        {multi
                                                            ? `${task.startDate} → ${task.dueDate}`
                                                            : task.dueDate
                                                        }
                                                    </div>
                                                    {task.assignee && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 justify-end">
                                                            <User size={11} />
                                                            {task.assignee}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    {canManage && (
                                                        <button onClick={() => handleEdit(task)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                                            <Pencil size={13} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button onClick={() => setDeleteTask(task)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TASK DETAIL POPOVER ── */}
                {selectedTask && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
                        <div
                            ref={popoverRef}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
                        >
                            {/* Color header bar */}
                            <div className={cn("h-1.5 w-full", getCategoryStyle(selectedTask.category).bg)} />
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded text-white", getCategoryStyle(selectedTask.category).bg)}>
                                            {selectedTask.category}
                                        </span>
                                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", PRIORITY_STYLE[selectedTask.priority])}>
                                            {selectedTask.priority}
                                        </span>
                                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", STATUS_STYLE[selectedTask.status])}>
                                            {selectedTask.status}
                                        </span>
                                    </div>
                                    <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                        <X size={16} />
                                    </button>
                                </div>

                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug">{selectedTask.task}</h3>

                                {selectedTask.description && (
                                    <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 border-t border-slate-100 dark:border-slate-800 pt-3">{selectedTask.description}</p>
                                )}

                                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                        <CalendarRange size={13} className="text-slate-400 shrink-0" />
                                        {isMultiDay(selectedTask)
                                            ? <span>{selectedTask.startDate} <span className="text-slate-300 dark:text-slate-600">→</span> {selectedTask.dueDate}</span>
                                            : <span>{selectedTask.dueDate}</span>
                                        }
                                    </div>
                                    {selectedTask.startTime && !isMultiDay(selectedTask) && (
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <Clock size={13} className="text-slate-400 shrink-0" />
                                            {selectedTask.startTime}
                                        </div>
                                    )}
                                    {selectedTask.assignee && (
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <User size={13} className="text-slate-400 shrink-0" />
                                            {selectedTask.assignee}
                                        </div>
                                    )}
                                </div>

                                {(canManage || canDelete) && (
                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        {canManage && (
                                            <button
                                                onClick={() => handleEdit(selectedTask)}
                                                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[11px] font-bold bg-slate-900 dark:bg-slate-700 text-white hover:bg-black dark:hover:bg-slate-600 transition-all"
                                            >
                                                <Pencil size={13} /> Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => { setDeleteTask(selectedTask); setSelectedTask(null); }}
                                                className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/30"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODALS ── */}
            <WeeklyTaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                initialData={editingTask}
                onSubmit={async (newTask) => {
                    try {
                        if (!newTask.task) return;
                        const dateObj = newTask.dueDate ? new Date(newTask.dueDate) : new Date();
                        const payload = {
                            task: newTask.task,
                            description: newTask.description || newTask.remarks || '',
                            assignee: newTask.assignee || 'IT',
                            status: newTask.status || 'To Do',
                            due_date: newTask.dueDate,
                            start_date: newTask.startDate || newTask.dueDate,
                            category: newTask.category || 'Maintenance',
                            priority: newTask.priority || 'Medium',
                            week: `W${Math.ceil(dateObj.getDate() / 7)}`
                        };
                        if (editingTask) {
                            await supabase.from('weekly_plans').update(payload).eq('id', editingTask.id);
                        } else {
                            await supabase.from('weekly_plans').insert([payload]);
                        }
                        setIsModalOpen(false);
                        setEditingTask(null);
                        await fetchTasks();
                        showToast(editingTask ? "Task updated" : "Task created", "success");
                    } catch (err: any) {
                        showToast("Failed: " + (err.message || "Database error"), "error");
                    }
                }}
                currentUserName={currentUser?.fullName}
            />

            <DangerConfirmModal
                isOpen={!!deleteTask}
                onClose={() => setDeleteTask(null)}
                onConfirm={executeDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${deleteTask?.task}"?`}
                isLoading={isActionLoading}
            />
        </div>
    );
};
