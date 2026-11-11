'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
    Search, Filter, Plus, FileText, CheckCircle2, Clock,
    AlertTriangle, X, ChevronLeft, ChevronRight, ChevronDown, Check, MoreHorizontal,
    Download, Trash2, Edit, Eye, User, Calendar,
    Presentation, XCircle, Play, Maximize2, Minimize2,
    Zap, RefreshCcw, BarChart3, Sun, Moon, ArrowUpRight,
    TrendingUp, Activity, LayoutDashboard, Globe, Database,
    FileSpreadsheet, SlidersHorizontal, ChevronsLeft, ChevronsRight,
    ClipboardList, AlertCircle, Loader2, Mic, Bell, Info, FilterX, ArrowUpDown
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
import { ModalWrapper } from './ui/ModalWrapper';

// ─── Stat Card Component (lndev/ui Taskplus Style) ─────────────────────────────

// Removed local ActivityStatCard in favor of global StatCard

// ─── Status Badge Component (Shadcn Style) ──────────────────────────────────
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/PageHeader';


const getCategoryConfig = (category: string) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('procure') || cat.includes('beli') || cat.includes('keuangan') || cat.includes('pembelian')) {
        return {
            icon: <FileSpreadsheet className="w-[15px] h-[15px] text-emerald-500 dark:text-emerald-400" />,
            color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20'
        };
    }
    if (cat.includes('web') || cat.includes('dev') || cat.includes('soft') || cat.includes('code')) {
        return {
            icon: <Globe className="w-[15px] h-[15px] text-indigo-500 dark:text-indigo-400" />,
            color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20'
        };
    }
    if (cat.includes('it') || cat.includes('network') || cat.includes('sys') || cat.includes('infra') || cat.includes('tech')) {
        return {
            icon: <Zap className="w-[15px] h-[15px] text-amber-500 dark:text-amber-400" />,
            color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20'
        };
    }
    if (cat.includes('hr') || cat.includes('people') || cat.includes('recru') || cat.includes('logis') || cat.includes('admin')) {
        return {
            icon: <User className="w-[15px] h-[15px] text-violet-500 dark:text-violet-400" />,
            color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/20 border-violet-500/20'
        };
    }
    // Fallback
    return {
        icon: <FileText className="w-[15px] h-[15px] text-slate-500 dark:text-zinc-400" />,
        color: 'text-slate-600 dark:text-zinc-400 bg-slate-500/10 dark:bg-slate-500/20 border-slate-500/20'
    };
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'Completed':
            return (
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-none bg-emerald-500/10 dark:bg-emerald-500/15 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 flex items-center gap-1.5 w-fit rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    {status}
                </Badge>
            );
        case 'In Progress':
            return (
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-none bg-blue-500/10 dark:bg-blue-500/15 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 flex items-center gap-1.5 w-fit rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                    {status}
                </Badge>
            );
        case 'Pending':
            return (
                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-none bg-amber-500/10 dark:bg-amber-500/15 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 flex items-center gap-1.5 w-fit rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                    {status}
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="text-slate-600 dark:text-slate-400 border-none bg-slate-500/10 dark:bg-slate-500/15 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 flex items-center gap-1.5 w-fit rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
                    {status}
                </Badge>
            );
    }
};

// ─── Category Badge ────────────────────────────────────────────────────────────

const CategoryBadge = ({ category }: { category: string }) => {
    const config = getCategoryConfig(category);
    return (
        <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm border", config.color)}>
            {category}
        </span>
    );
};

// ─── Clean Enterprise Filter Dropdown (Replaces NativeSelect) ─────────────────

const FilterDropdown = ({
    value,
    onChange,
    options,
    icon,
    className
}: {
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    icon?: React.ReactNode;
    className?: string;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const currentLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className={cn(
                    "h-9 w-full px-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-2 transition-all cursor-pointer select-none",
                    open
                        ? "border-slate-400 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 ring-2 ring-slate-900/5 dark:ring-white/10"
                        : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/70 text-slate-700 dark:text-zinc-200"
                )}
            >
                <span className="flex items-center gap-1.5 truncate">
                    {icon && <span className="text-slate-400 dark:text-zinc-500 shrink-0">{icon}</span>}
                    <span className="truncate">{currentLabel}</span>
                </span>
                <ChevronDown size={14} className={cn("text-slate-400 dark:text-zinc-500 shrink-0 transition-transform duration-150", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 min-w-[190px] w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-0.5">
                        {options.map(opt => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer",
                                        isSelected
                                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold"
                                            : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                                    )}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Interactive Date Range Calendar Picker ───────────────────────────────────

const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAY_HEADERS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const DateRangeCalendarPicker = ({
    startDate,
    endDate,
    dateFilterType,
    onSelectPreset,
    onSelectCustomRange,
    onShiftDays,
    formatShortRange,
}: {
    startDate: string;
    endDate: string;
    dateFilterType: string;
    onSelectPreset: (preset: string) => void;
    onSelectCustomRange: (start: string, end: string) => void;
    onShiftDays: (days: number) => void;
    formatShortRange: (s: string, e: string) => string;
}) => {
    const [open, setOpen] = useState(false);
    const [selectingStart, setSelectingStart] = useState<string | null>(null);
    const [hoverDate, setHoverDate] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Base month shown on the left calendar (right calendar shows baseMonth + 1)
    const [baseMonth, setBaseMonth] = useState<Date>(() => {
        if (endDate) {
            const d = new Date(endDate + 'T00:00:00');
            return new Date(d.getFullYear(), d.getMonth() - 1, 1);
        }
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    });

    useEffect(() => {
        if (!open) {
            setSelectingStart(null);
            setHoverDate(null);
            return;
        }
        const onClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const todayStr = useMemo(() => toYMD(new Date()), []);

    const presets = [
        { key: 'Last7Days', label: '7 Hari Terakhir', desc: '1 minggu ke belakang' },
        { key: 'LastWeek', label: 'Minggu Lalu', desc: 'Senin s/d Minggu lalu' },
        { key: 'Week', label: 'Minggu Ini', desc: 'Senin s/d Minggu ini' },
        { key: 'Today', label: 'Hari Ini', desc: 'Aktivitas hari ini' },
        { key: 'Month', label: 'Bulan Ini', desc: '1 bulan berjalan' },
        { key: 'All', label: 'Semua Waktu', desc: 'Tampilkan seluruh log' },
    ];

    const presetBadgeLabel: Record<string, string> = {
        Last7Days: '7 Hari',
        LastWeek: 'Minggu Lalu',
        Week: 'Minggu Ini',
        Today: 'Hari Ini',
        Month: 'Bulan Ini',
        All: 'Semua',
        Custom: 'Custom',
    };

    const handleDayClick = (dateStr: string) => {
        if (!selectingStart) {
            setSelectingStart(dateStr);
            onSelectCustomRange(dateStr, dateStr);
        } else {
            const s = dateStr < selectingStart ? dateStr : selectingStart;
            const e = dateStr < selectingStart ? selectingStart : dateStr;
            onSelectCustomRange(s, e);
            setSelectingStart(null);
            setHoverDate(null);
        }
    };

    const effectiveRange = useMemo(() => {
        if (selectingStart && hoverDate) {
            return {
                start: hoverDate < selectingStart ? hoverDate : selectingStart,
                end: hoverDate < selectingStart ? selectingStart : hoverDate,
            };
        }
        return { start: startDate, end: endDate };
    }, [selectingStart, hoverDate, startDate, endDate]);

    const dayCount = useMemo(() => {
        if (!effectiveRange.start || !effectiveRange.end) return 0;
        const s = new Date(effectiveRange.start + 'T00:00:00');
        const e = new Date(effectiveRange.end + 'T00:00:00');
        return Math.max(Math.round((e.getTime() - s.getTime()) / 86400000) + 1, 1);
    }, [effectiveRange]);

    const buildMonthCells = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        // Monday-based index (0 = Mon ... 6 = Sun)
        const startOffset = (firstDay.getDay() + 6) % 7;

        const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

        // Previous month trailing days
        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthLast - i);
            cells.push({ dateStr: toYMD(d), dayNum: d.getDate(), isCurrentMonth: false });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            cells.push({ dateStr: toYMD(dateObj), dayNum: d, isCurrentMonth: true });
        }

        // Next month leading days to fill 42 cells (6 rows)
        const remaining = 42 - cells.length;
        for (let d = 1; d <= remaining; d++) {
            const dateObj = new Date(year, month + 1, d);
            cells.push({ dateStr: toYMD(dateObj), dayNum: d, isCurrentMonth: false });
        }

        return cells;
    };

    const leftYear = baseMonth.getFullYear();
    const leftMonth = baseMonth.getMonth();
    const rightDate = new Date(leftYear, leftMonth + 1, 1);
    const rightYear = rightDate.getFullYear();
    const rightMonth = rightDate.getMonth();

    const monthsToRender = [
        { year: leftYear, month: leftMonth, cells: buildMonthCells(leftYear, leftMonth) },
        { year: rightYear, month: rightMonth, cells: buildMonthCells(rightYear, rightMonth) },
    ];

    return (
        <div ref={containerRef} className="relative inline-flex items-center">
            {/* Connected Control Group: [ < ] [ Calendar Range Trigger ] [ > ] */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <button
                    type="button"
                    onClick={() => onShiftDays(-7)}
                    title="Mundur 1 minggu"
                    aria-label="Mundur 1 minggu"
                    className="h-9 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-l-lg border-r border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
                >
                    <ChevronLeft size={14} />
                </button>

                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className={cn(
                        "h-9 px-3 flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer select-none",
                        open
                            ? "bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/70"
                    )}
                >
                    <Calendar size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold tracking-tight whitespace-nowrap">
                        {formatShortRange(startDate, endDate)}
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                        {presetBadgeLabel[dateFilterType] || 'Periode'}
                    </span>
                    <ChevronDown size={13} className={cn("text-slate-400 transition-transform duration-150", open && "rotate-180")} />
                </button>

                <button
                    type="button"
                    onClick={() => onShiftDays(7)}
                    title="Maju 1 minggu"
                    aria-label="Maju 1 minggu"
                    className="h-9 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-r-lg border-l border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
                >
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Floating Calendar Popover */}
            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[calc(100vw-2rem)] sm:w-[680px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex flex-col sm:flex-row">
                        {/* Left Sidebar: Quick Presets */}
                        <div className="sm:w-44 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-zinc-800 p-2.5 bg-slate-50/60 dark:bg-zinc-950/40 flex flex-row sm:flex-col gap-1 overflow-x-auto">
                            <div className="hidden sm:block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                                Preset Periode
                            </div>
                            {presets.map(p => {
                                const active = dateFilterType === p.key;
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => {
                                            setSelectingStart(null);
                                            onSelectPreset(p.key);
                                            const now = new Date();
                                            setBaseMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
                                        }}
                                        className={cn(
                                            "px-2.5 py-2 rounded-lg text-left transition-all shrink-0 sm:w-full cursor-pointer",
                                            active
                                                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs"
                                                : "text-slate-700 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-800/70"
                                        )}
                                    >
                                        <div className="text-xs font-semibold leading-tight">{p.label}</div>
                                        <div className={cn("hidden sm:block text-[10px] mt-0.5", active ? "text-slate-300 dark:text-zinc-600" : "text-slate-400 dark:text-zinc-500")}>
                                            {p.desc}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Area: 2-Month Interactive Calendar */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                                {/* Calendar Navigation Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setBaseMonth(new Date(leftYear, leftMonth - 1, 1))}
                                        className="h-7 w-7 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                        aria-label="Bulan sebelumnya"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                                        {selectingStart ? (
                                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                                Pilih tanggal akhir pada kalender...
                                            </span>
                                        ) : (
                                            <span>Klik tanggal di kalender untuk pilih rentang custom</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setBaseMonth(new Date(leftYear, leftMonth + 1, 1))}
                                        className="h-7 w-7 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                        aria-label="Bulan berikutnya"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>

                                {/* Two Month Grids */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {monthsToRender.map((m, idx) => (
                                        <div key={`${m.year}-${m.month}`} className={cn(idx === 0 && "hidden sm:block")}>
                                            <div className="text-center text-xs font-bold text-slate-800 dark:text-zinc-100 mb-2.5">
                                                {MONTH_NAMES_ID[m.month]} {m.year}
                                            </div>
                                            <div className="grid grid-cols-7 mb-1">
                                                {DAY_HEADERS_ID.map(d => (
                                                    <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-zinc-500 py-1">
                                                        {d}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-y-0.5">
                                                {m.cells.map((cell, cIdx) => {
                                                    const isStart = effectiveRange.start === cell.dateStr;
                                                    const isEnd = effectiveRange.end === cell.dateStr;
                                                    const isSelectedEdge = isStart || isEnd;
                                                    const isInRange =
                                                        effectiveRange.start &&
                                                        effectiveRange.end &&
                                                        cell.dateStr > effectiveRange.start &&
                                                        cell.dateStr < effectiveRange.end;
                                                    const isToday = cell.dateStr === todayStr;

                                                    return (
                                                        <button
                                                            key={`${cell.dateStr}-${cIdx}`}
                                                            type="button"
                                                            onClick={() => handleDayClick(cell.dateStr)}
                                                            onMouseEnter={() => {
                                                                if (selectingStart) setHoverDate(cell.dateStr);
                                                            }}
                                                            className={cn(
                                                                "h-8 w-full text-xs relative flex items-center justify-center transition-colors select-none cursor-pointer",
                                                                !cell.isCurrentMonth && !isSelectedEdge && !isInRange && "text-slate-300 dark:text-zinc-700",
                                                                cell.isCurrentMonth && !isSelectedEdge && !isInRange && "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg",
                                                                isInRange && "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 font-semibold",
                                                                isStart && effectiveRange.end && effectiveRange.start !== effectiveRange.end && "rounded-l-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-xs",
                                                                isEnd && effectiveRange.start && effectiveRange.start !== effectiveRange.end && "rounded-r-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-xs",
                                                                isSelectedEdge && effectiveRange.start === effectiveRange.end && "rounded-lg bg-slate-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-xs"
                                                            )}
                                                        >
                                                            <span>{cell.dayNum}</span>
                                                            {isToday && !isSelectedEdge && (
                                                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Popover Footer: Direct Inputs + Summary + Apply */}
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-1.5 text-xs">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => onSelectCustomRange(e.target.value, endDate || e.target.value)}
                                        aria-label="Tanggal mulai"
                                        className="h-7 px-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/70 text-[11px] font-medium text-slate-700 dark:text-zinc-200 outline-none focus:border-blue-500"
                                    />
                                    <span className="text-slate-400 text-[11px]">s/d</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => onSelectCustomRange(startDate || e.target.value, e.target.value)}
                                        aria-label="Tanggal akhir"
                                        className="h-7 px-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/70 text-[11px] font-medium text-slate-700 dark:text-zinc-200 outline-none focus:border-blue-500"
                                    />
                                    {dayCount > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                                            {dayCount} hari
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectingStart(null);
                                            onSelectPreset('Last7Days');
                                        }}
                                        className="h-7 px-2.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                    >
                                        Reset 7 Hari
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setOpen(false)}
                                        className="h-7 px-3 text-xs font-semibold"
                                    >
                                        Selesai
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const ActivityDetailModal = ({
    isOpen,
    onClose,
    activity,
    userAvatars,
    canEdit,
    canDelete,
    onEdit,
    onDelete
}: {
    isOpen: boolean;
    onClose: () => void;
    activity: ActivityLog | null;
    userAvatars: any;
    canEdit?: boolean;
    canDelete?: boolean;
    onEdit?: (act: ActivityLog) => void;
    onDelete?: (act: ActivityLog) => void;
}) => {
    const { language, t } = useLanguage();

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            {activity && (
                <>
                    {/* Modal Header */}
                    <div className="p-5 sm:p-9 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-start bg-slate-50/50 dark:bg-zinc-900/50">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <StatusBadge status={activity.status} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">{activity.activityName}</h2>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-zinc-400 mt-2 uppercase tracking-[0.2em]">{activity.category} · {activity.location}</p>
                        </div>
                        <button onClick={onClose} className="p-2 sm:p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-9 space-y-6 sm:space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2.5">Fulfillment Status</p>
                                <StatusBadge status={activity.status} />
                            </div>
                            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2.5">Resolution Duration</p>
                                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base sm:text-lg">
                                    <Clock size={16} className="text-blue-500" />
                                    {activity.duration || '-'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3.5">Request Initiator</p>
                                <div className="flex items-center gap-3">
                                    <UserAvatar name={activity.requester} url={userAvatars[activity.requester] || activity.avatarUrl} size="sm" className="border-2 border-white dark:border-zinc-700 shadow-sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight truncate">{activity.requester}</p>
                                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider truncate">{activity.department}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-3.5">Handling Personnel</p>
                                <div className="flex items-center gap-3">
                                    <UserAvatar name={activity.itPersonnel} url={userAvatars[activity.itPersonnel]} size="sm" className="border-2 border-white dark:border-zinc-700 shadow-sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight truncate">{activity.itPersonnel}</p>
                                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider truncate">IT Solutions Group</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {activity.remarks && (
                            <div className="p-6 sm:p-9 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/20">
                                <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.3em] mb-3">Fulfillment Remarks</p>
                                <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic pr-4">
                                    "{activity.remarks}"
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between pt-6 sm:pt-9 border-t border-slate-50 dark:border-zinc-800/40">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-2">Logged On</p>
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400">
                                    <Calendar size={13} />
                                    {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="px-5 sm:px-9 py-4 sm:py-6 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                            {canEdit && onEdit && (
                                <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(activity); }} className="rounded-xl font-bold text-xs">
                                    <Edit size={14} className="mr-1.5" /> Edit
                                </Button>
                            )}
                            {canDelete && onDelete && (
                                <Button variant="outline" size="sm" onClick={() => { onClose(); onDelete(activity); }} className="rounded-xl font-bold text-xs text-rose-500 hover:text-rose-600">
                                    <Trash2 size={14} className="mr-1.5" /> Delete
                                </Button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
                        >
                            Close View
                        </button>
                    </div>
                </>
            )}
        </ModalWrapper>
    );
};

// ─── Danger Modal ─────────────────────────────────────────────────────────────
// (Using global DangerConfirmModal)

// ─── Main Component ────────────────────────────────────────────────────────────

const FALLBACK_ACTIVITIES: ActivityLog[] = [
    {
        id: 101,
        activityName: "Progress Doc Replacement Copier HP",
        category: "Procurement",
        requester: "Rudi",
        department: "IT",
        itPersonnel: "Bendry",
        type: "Minor",
        status: "Completed",
        duration: "45m",
        remarks: "Kordinasi dokumen kontrak penggantian printer HP E786",
        location: "Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
        id: 102,
        activityName: "Develop Absen Gesit (Mobile Presensi & Geofencing)",
        category: "Development",
        requester: "Rudi Siarudin",
        department: "IT",
        itPersonnel: "Rudi",
        type: "Major",
        status: "In Progress",
        duration: "3h 30m",
        remarks: "Implementasi integrasi koordinat GPS dan deteksi wajah",
        location: "Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
        id: 103,
        activityName: "Arrange Visit CCTV Vendor Sircon73",
        category: "Infrastructure",
        requester: "Desi",
        department: "Finance & GA",
        itPersonnel: "Bendry",
        type: "Minor",
        status: "In Progress",
        duration: "1h",
        remarks: "Pemeriksaan 8 titik kamera koridor dan ruang server",
        location: "Lt. 26 & 27",
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    {
        id: 104,
        activityName: "Kordinasi Dokumen Kontrak Copier HP (Replacement E786)",
        category: "Procurement",
        requester: "Sylvia",
        department: "BOC",
        itPersonnel: "Rudi",
        type: "Minor",
        status: "Completed",
        duration: "1h 15m",
        remarks: "Review SLA dan addendum perjanjian sewa unit baru",
        location: "Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
        id: 105,
        activityName: "Concall dengan PT Galva untuk Replace Unit Copier",
        category: "Procurement",
        requester: "Rudi",
        department: "IT",
        itPersonnel: "Rudi",
        type: "Minor",
        status: "Completed",
        duration: "30m",
        remarks: "Konfirmasi jadwal pengiriman dan teknisi instalasi",
        location: "Google Meet",
        createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 25).toISOString(),
    },
    {
        id: 106,
        activityName: "Develop System CSL Operations & Portal",
        category: "Development",
        requester: "Puji",
        department: "CSL",
        itPersonnel: "Rudi",
        type: "Major",
        status: "Completed",
        duration: "4h",
        remarks: "Rilis fitur ticketing CSL dan form budget approval",
        location: "Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 44).toISOString(),
    },
    {
        id: 107,
        activityName: "Reset Password Email & Konfigurasi Microsoft 365",
        category: "IT Support",
        requester: "Desi Rahmuni",
        department: "Finance",
        itPersonnel: "Bendry",
        type: "Minor",
        status: "Completed",
        duration: "15m",
        remarks: "Reset kredensial dan aktivasi MFA authenticator",
        location: "Lt. 27",
        createdAt: new Date(Date.now() - 3600000 * 52).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 51).toISOString(),
    },
    {
        id: 108,
        activityName: "Maintenance Core Router MikroTik RB1100AHx4",
        category: "Infrastructure",
        requester: "Sistem",
        department: "IT Infrastructure",
        itPersonnel: "Rudi",
        type: "Major",
        status: "Completed",
        duration: "45m",
        remarks: "Backup RouterOS config dan verifikasi firewall rule gateway 103.28.160.42",
        location: "Server Room Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 71).toISOString(),
    },
    {
        id: 109,
        activityName: "Segmentasi Subnet & Alokasi DHCP VLAN 20 Staff",
        category: "Infrastructure",
        requester: "Bendry",
        department: "IT",
        itPersonnel: "Rudi",
        type: "Minor",
        status: "Completed",
        duration: "30m",
        remarks: "Perluasan lease pool IP untuk 64 host workstation",
        location: "Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 95).toISOString(),
    },
    {
        id: 110,
        activityName: "Inspeksi Fiber Optic Link ISP CBN Cyber 1",
        category: "Infrastructure",
        requester: "Rudi",
        department: "IT",
        itPersonnel: "Bendry",
        type: "Critical",
        status: "Completed",
        duration: "1h",
        remarks: "Uji latensi 4ms dan bandwidth 1 Gbps symmetrical dedicated",
        location: "MDF Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 119).toISOString(),
    },
    {
        id: 111,
        activityName: "Setup TV Meeting Room Display & Wireless Casting",
        category: "IT Support",
        requester: "Rara",
        department: "Admin",
        itPersonnel: "Bendry",
        type: "Minor",
        status: "Completed",
        duration: "40m",
        remarks: "Kalibrasi display meeting room Lt. 26 dan sambungan HDMI wireless",
        location: "Ruang Meeting Lt. 26",
        createdAt: new Date(Date.now() - 3600000 * 144).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 143).toISOString(),
    },
    {
        id: 112,
        activityName: "Penggantian Toner Cartridge Printer HP Lantai 27",
        category: "IT Support",
        requester: "K. Nisa Oktafiani",
        department: "Finance",
        itPersonnel: "Bendry",
        type: "Minor",
        status: "Completed",
        duration: "20m",
        remarks: "Pemasangan toner black cartridge original dan test print",
        location: "Lt. 27",
        createdAt: new Date(Date.now() - 3600000 * 168).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 167).toISOString(),
    },
];

export const ActivityLogManager = ({ currentUser }: { currentUser: any }) => {
    const { language, setLanguage, t } = useLanguage();
    const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');

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
    const roleLower = (currentUser?.role || '').toLowerCase();
    const isAdmin = roleLower === 'admin' || roleLower === 'super admin' || roleLower === 'super_admin' || currentUser?.groups?.includes('admin') || currentUser?.groups?.includes('ADMIN') || currentUser?.groups?.includes('MANAGEMENT');
    const isStaff = roleLower === 'staff' || isAdmin || currentUser?.groups?.includes('it') || currentUser?.groups?.includes('it_staff');
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

            if (!error && data && data.length > 0) {
                const formattedData: ActivityLog[] = data.map((item: any) => ({
                    id: item.id,
                    activityName: item.activity_name || item.title || item.name || 'Aktivitas IT',
                    category: item.category || 'General',
                    requester: item.requester || 'User',
                    department: item.department || 'IT',
                    itPersonnel: item.it_personnel || 'IT Team',
                    type: item.type || 'Minor',
                    status: item.status || 'Completed',
                    duration: item.duration || '-',
                    remarks: item.remarks || '',
                    location: item.location || 'Office',
                    createdAt: item.created_at || new Date().toISOString(),
                    completedAt: item.completed_at || null,
                    avatarUrl: item.avatar_url || null
                }));
                setActivities(formattedData);
            } else {
                setActivities(FALLBACK_ACTIVITIES);
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
            console.warn('Gagal memuat activity_logs dari Supabase, menggunakan data operasional:', error.message);
            setActivities(FALLBACK_ACTIVITIES);
        } finally {
            setIsLoading(false);
        }
    };

    const toLocalDateStr = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const getLast7DaysRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { start: toLocalDateStr(start), end: toLocalDateStr(end) };
    };

    const [startDate, setStartDate] = useState(() => getLast7DaysRange().start);
    const [endDate, setEndDate] = useState(() => getLast7DaysRange().end);
    const [dateFilterType, setDateFilterType] = useState('Last7Days');
    const [isWeeklyMeetingMode, setIsWeeklyMeetingMode] = useState(true);
    const [picFilter, setPicFilter] = useState('All');
    const [priorityFocusOnly, setPriorityFocusOnly] = useState(false);
    const [sortOngoingFirst, setSortOngoingFirst] = useState(true);

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

    // Base activities matching date range (for Weekly Meeting Summary breakdown)
    const dateFilteredActivities = useMemo(() => {
        return activities.filter(activity => {
            if (!startDate || !endDate) return true;
            const activityDate = toLocalDateStr(new Date(activity.createdAt));
            return activityDate >= startDate && activityDate <= endDate;
        });
    }, [activities, startDate, endDate]);

    const filteredActivities = useMemo(() => {
        const list = dateFilteredActivities.filter(activity => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                activity.activityName?.toLowerCase().includes(term) ||
                activity.requester?.toLowerCase().includes(term) ||
                activity.itPersonnel?.toLowerCase().includes(term) ||
                activity.department?.toLowerCase().includes(term) ||
                activity.category?.toLowerCase().includes(term) ||
                activity.location?.toLowerCase().includes(term) ||
                activity.remarks?.toLowerCase().includes(term);

            const matchesStatus =
                statusFilter === 'All'
                    ? true
                    : statusFilter === 'Ongoing'
                        ? (activity.status === 'In Progress' || activity.status === 'Pending')
                        : activity.status === statusFilter;

            const matchesCategory = categoryFilter === 'All' || activity.category === categoryFilter;
            const matchesPic = picFilter === 'All' || activity.itPersonnel === picFilter;
            const matchesPriority = !priorityFocusOnly || (activity.type === 'Critical' || activity.type === 'Major');

            return matchesSearch && matchesStatus && matchesCategory && matchesPic && matchesPriority;
        });

        if (isWeeklyMeetingMode && sortOngoingFirst) {
            const statusOrder: Record<string, number> = { 'In Progress': 0, 'Pending': 1, 'Completed': 2 };
            const priorityOrder: Record<string, number> = { 'Critical': 0, 'Major': 1, 'Minor': 2 };
            return [...list].sort((a, b) => {
                const sA = statusOrder[a.status] ?? 3;
                const sB = statusOrder[b.status] ?? 3;
                if (sA !== sB) return sA - sB;
                const pA = priorityOrder[a.type] ?? 3;
                const pB = priorityOrder[b.type] ?? 3;
                if (pA !== pB) return pA - pB;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }

        return list;
    }, [dateFilteredActivities, searchTerm, statusFilter, categoryFilter, picFilter, priorityFocusOnly, isWeeklyMeetingMode, sortOngoingFirst]);

    const handleExportExcel = () => {
        if (filteredActivities.length === 0) return;
        const dataToExport = filteredActivities
            .filter(act => !act.remarks?.includes("Auto-generated purchase record from Requisition") && !act.activityName?.includes("Auto-generated purchase record from Requisition"))
            .map(act => ({
                "Activity Name": act.activityName,
                "Created At": act.createdAt ? new Date(act.createdAt).toLocaleString() : "-",
                "Completed At": act.completedAt ? new Date(act.completedAt).toLocaleString() : "-",
                "Category": act.category,
                "Requester": act.requester,
                "Department": act.department,
                "IT Personnel": act.itPersonnel,
                "Priority": act.type,
                "Status": act.status,
                "Duration": act.duration || "-",
                "Location": act.location,
                "Remarks": act.remarks || "-"
            }));
        exportToExcel(dataToExport, `GESIT-ACTIVITY-${toLocalDateStr(new Date())}`);
    };

    const [isPresenting, setIsPresenting] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const stats = useMemo(() => {
        const total = filteredActivities.length;
        const complete = filteredActivities.filter(a => a.status === 'Completed').length;
        const active = filteredActivities.filter(a => a.status === 'In Progress' || a.status === 'Pending').length;
        const highAlerts = filteredActivities.filter(a => a.type === 'Critical' || a.type === 'Major').length;

        // Calculate real week-over-week comparison (previous 7-day window)
        let prevTotal = 0, prevComplete = 0, prevActive = 0, prevHigh = 0;
        if (startDate && endDate) {
            const s = new Date(startDate + 'T00:00:00');
            const e = new Date(endDate + 'T23:59:59');
            const diffDays = Math.max(Math.round((e.getTime() - s.getTime()) / 86400000), 1);
            const prevEnd = new Date(s.getTime() - 86400000);
            const prevStart = new Date(prevEnd.getTime() - (diffDays - 1) * 86400000);
            const pStartStr = toLocalDateStr(prevStart);
            const pEndStr = toLocalDateStr(prevEnd);
            const prevList = activities.filter(a => {
                const d = toLocalDateStr(new Date(a.createdAt));
                return d >= pStartStr && d <= pEndStr;
            });
            prevTotal = prevList.length;
            prevComplete = prevList.filter(a => a.status === 'Completed').length;
            prevActive = prevList.filter(a => a.status === 'In Progress' || a.status === 'Pending').length;
            prevHigh = prevList.filter(a => a.type === 'Critical' || a.type === 'Major').length;
        }

        const calcPct = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        return {
            total,
            complete,
            active,
            highAlerts,
            totalPct: calcPct(total, prevTotal),
            completePct: calcPct(complete, prevComplete),
            activePct: calcPct(active, prevActive),
            highPct: calcPct(highAlerts, prevHigh),
        };
    }, [filteredActivities, activities, startDate, endDate]);

    const weeklyDigest = useMemo(() => {
        const total = dateFilteredActivities.length;
        const completed = dateFilteredActivities.filter(a => a.status === 'Completed').length;
        const ongoing = dateFilteredActivities.filter(a => a.status === 'In Progress' || a.status === 'Pending').length;
        const criticalMajor = dateFilteredActivities.filter(a => a.type === 'Critical' || a.type === 'Major').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const byCategory: Record<string, number> = {};
        const byPic: Record<string, { total: number; completed: number; ongoing: number }> = {};

        dateFilteredActivities.forEach(a => {
            const cat = a.category || 'General';
            byCategory[cat] = (byCategory[cat] || 0) + 1;

            const pic = a.itPersonnel || 'IT Team';
            if (!byPic[pic]) byPic[pic] = { total: 0, completed: 0, ongoing: 0 };
            byPic[pic].total += 1;
            if (a.status === 'Completed') byPic[pic].completed += 1;
            else byPic[pic].ongoing += 1;
        });

        return {
            total,
            completed,
            ongoing,
            criticalMajor,
            completionRate,
            categories: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
            pics: Object.entries(byPic).sort((a, b) => b[1].total - a[1].total),
        };
    }, [dateFilteredActivities]);

    const uniqueCategories = useMemo(() => {
        const cats = [...new Set(activities.map(a => a.category).filter(Boolean))];
        return cats.sort();
    }, [activities]);

    const hasActiveFilters = searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || picFilter !== 'All' || priorityFocusOnly || dateFilterType !== 'All';

    const resetAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setCategoryFilter('All');
        setPicFilter('All');
        setPriorityFocusOnly(false);
        setDateFilterType('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const shiftDateWindow = (days: number) => {
        const baseStart = startDate ? new Date(startDate + 'T00:00:00') : new Date(Date.now() - 6 * 86400000);
        const baseEnd = endDate ? new Date(endDate + 'T00:00:00') : new Date();
        baseStart.setDate(baseStart.getDate() + days);
        baseEnd.setDate(baseEnd.getDate() + days);
        setStartDate(toLocalDateStr(baseStart));
        setEndDate(toLocalDateStr(baseEnd));
        setDateFilterType('Custom');
        setCurrentPage(1);
    };

    const applyLast7DaysPreset = () => {
        const range = getLast7DaysRange();
        setStartDate(range.start);
        setEndDate(range.end);
        setDateFilterType('Last7Days');
        setCurrentPage(1);
    };

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

    useEffect(() => {
        if (isPresenting) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isPresenting]);

    // Keyboard navigation for Live Presentation
    useEffect(() => {
        if (!isPresenting) return;
        const totalSlides = filteredActivities.length + 1; // Slide 0 = Executive Summary
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                setCurrentSlideIndex(p => (p + 1) % totalSlides);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentSlideIndex(p => (p - 1 + totalSlides) % totalSlides);
            } else if (e.key === 'Escape') {
                setIsPresenting(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isPresenting, filteredActivities.length]);

    const totalPages = Math.max(Math.ceil(filteredActivities.length / rowsPerPage), 1);
    const paginatedActivities = filteredActivities.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const startItem = (currentPage - 1) * rowsPerPage + 1;
    const endItem = Math.min(currentPage * rowsPerPage, filteredActivities.length);

    const handleDateFilterTypeChange = (type: string) => {
        setDateFilterType(type);
        setCurrentPage(1);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();
        const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        if (type === 'All') {
            setStartDate('');
            setEndDate('');
        } else if (type === 'Today') {
            const todayStr = toLocalDateStr(new Date(year, month, day));
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (type === 'Last7Days') {
            const range = getLast7DaysRange();
            setStartDate(range.start);
            setEndDate(range.end);
        } else if (type === 'Week') {
            const first = new Date(year, month, day + mondayOffset);
            const last = new Date(year, month, day + mondayOffset + 6);
            setStartDate(toLocalDateStr(first));
            setEndDate(toLocalDateStr(last));
        } else if (type === 'LastWeek') {
            const first = new Date(year, month, day + mondayOffset - 7);
            const last = new Date(year, month, day + mondayOffset - 1);
            setStartDate(toLocalDateStr(first));
            setEndDate(toLocalDateStr(last));
        } else if (type === 'Month') {
            setStartDate(toLocalDateStr(new Date(year, month, 1)));
            setEndDate(toLocalDateStr(new Date(year, month + 1, 0)));
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatShortRange = (s: string, e: string) => {
        if (!s || !e) return 'Semua Waktu';
        const d1 = new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const d2 = new Date(e + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${d1} – ${d2}`;
    };

    // ─── Presenter Overlay ────────────────────────────────────────────────────

    const renderSlideshowOverlay = () => {
        if (!isPresenting) return null;
        const presentationActivities = [...filteredActivities];
        const totalSlides = presentationActivities.length + 1; // Slide 0 = Executive Weekly Summary
        const isSummarySlide = currentSlideIndex === 0;
        const currentActivity = !isSummarySlide ? presentationActivities[currentSlideIndex - 1] : null;
        const ongoingItems = presentationActivities.filter(a => a.status === 'In Progress' || a.status === 'Pending');

        return (
            <div className={`fixed inset-0 w-full h-full z-[5000] ${isDarkTheme ? 'bg-[#0f0f17] dark' : 'bg-[#f8fafc]'} flex flex-col items-center justify-center overflow-hidden m-0 p-0`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[160px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-emerald-600/5 rounded-full blur-[160px]" />
                </div>

                <div className="absolute top-0 left-0 right-0 p-8 sm:p-10 flex justify-between items-center z-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Activity className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <span className="block text-2xl font-black text-slate-900 dark:text-white leading-none">Weekly IT Activity Review</span>
                            <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mt-1 block">
                                Periode: {formatShortRange(startDate, endDate)} · {isSummarySlide ? 'Executive Summary' : `Item ${currentSlideIndex} dari ${presentationActivities.length}`}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setCurrentSlideIndex(0)} className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider border transition-all ${isSummarySlide ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-blue-500'}`}>
                            Ringkasan Mingguan
                        </button>
                        <button onClick={() => setIsDarkTheme(!isDarkTheme)} aria-label="Toggle Theme" className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                            {isDarkTheme ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                        </button>
                        <button onClick={toggleFullScreen} aria-label="Toggle Fullscreen" className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                            {isFullScreen ? <Minimize2 size={20} strokeWidth={2.5} /> : <Maximize2 size={20} strokeWidth={2.5} />}
                        </button>
                        <button onClick={() => setIsPresenting(false)} className="px-6 py-4 rounded-xl bg-rose-500 text-white font-black text-[13px] hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2">
                            <XCircle size={18} strokeWidth={2.5} /> End Session
                        </button>
                    </div>
                </div>

                {isSummarySlide ? (
                    <motion.div key="summary-slide" initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative z-40 w-full max-w-6xl px-6 sm:px-10">
                        <div className="bg-white dark:bg-[#1a1d23] rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xl p-8 sm:p-10 overflow-hidden relative flex flex-col max-h-[76vh]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                                <div>
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-widest mb-2">
                                        <Calendar size={13} /> Rekap Weekly Meeting IT ({presentationActivities.length} Aktivitas)
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {formatShortRange(startDate, endDate)}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">Tuntas</span>
                                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{presentationActivities.filter(a => a.status === 'Completed').length}</span>
                                    </div>
                                    <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">Ongoing</span>
                                        <span className="text-xl font-black text-amber-600 dark:text-amber-400">{ongoingItems.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Table of Judul Activity, Handling Personnel, and Remark */}
                            <div className="mt-4 flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-slate-200/70 dark:border-zinc-800">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 z-10">
                                        <tr>
                                            <th className="py-3 pl-4 pr-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 w-10">#</th>
                                            <th className="py-3 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 w-[34%]">Judul Activity</th>
                                            <th className="py-3 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 w-[18%]">Handling Personnel</th>
                                            <th className="py-3 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 w-[36%]">Remark / Progress</th>
                                            <th className="py-3 pl-2 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 w-[12%] text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                                        {presentationActivities.map((item, idx) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => setCurrentSlideIndex(idx + 1)}
                                                className="hover:bg-blue-50/50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                                            >
                                                <td className="py-3.5 pl-4 pr-2 text-xs font-black text-slate-400 align-top">{idx + 1}</td>
                                                <td className="py-3.5 px-3 align-top">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{item.activityName}</p>
                                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5 block">
                                                        {formatDate(item.createdAt)} · {item.category}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-3 align-top">
                                                    <div className="flex items-center gap-2.5">
                                                        <UserAvatar name={item.itPersonnel} url={userAvatars[item.itPersonnel]} size="xs" />
                                                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.itPersonnel}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-3 align-top">
                                                    <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 leading-relaxed">
                                                        {item.remarks || <span className="italic text-slate-400">Tidak ada catatan</span>}
                                                    </p>
                                                </td>
                                                <td className="py-3.5 pl-2 pr-4 align-top text-right">
                                                    <div className="inline-flex justify-end">
                                                        <StatusBadge status={item.status} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : currentActivity && (
                    <motion.div key={currentActivity.id} initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative z-40 w-full max-w-6xl px-12">
                        <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-slate-100 dark:border-zinc-800 shadow-2xl p-16 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-6 transition-all duration-700">
                                <Activity size={300} strokeWidth={1} />
                            </div>

                            <div className="grid grid-cols-12 gap-14 items-center relative z-10">
                                <div className="col-span-4 flex flex-col items-center text-center border-r border-slate-100 dark:border-zinc-800/60 pr-12">
                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-5">
                                        Handling Personnel
                                    </span>
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                                        <UserAvatar name={currentActivity.itPersonnel} url={userAvatars[currentActivity.itPersonnel]} size="xl" className="w-48 h-48 border-8 border-white dark:border-zinc-800 shadow-xl relative z-10" />
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 leading-tight tracking-tight">{currentActivity.itPersonnel}</div>
                                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">IT Solutions Group</span>
                                    <div className="mt-6 flex flex-col gap-2.5 w-full">
                                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal & Lokasi</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatDate(currentActivity.createdAt)} · {currentActivity.location}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pemohon (Requester)</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{currentActivity.requester} ({currentActivity.department})</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-8">
                                    <div className="flex items-center gap-3 mb-5">
                                        <StatusBadge status={currentActivity.status} />
                                        <CategoryBadge category={currentActivity.category} />
                                    </div>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Judul Activity</p>
                                    <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-8 leading-[1.15] tracking-tight">{currentActivity.activityName}</h2>

                                    <div className="p-8 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-800/40 relative">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                                            <FileText size={15} /> Remark / Keterangan
                                        </p>
                                        <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                            {currentActivity.remarks || "Tidak ada catatan tambahan."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="absolute bottom-10 flex items-center gap-8">
                    <button onClick={() => setCurrentSlideIndex(p => (p - 1 + totalSlides) % totalSlides)} aria-label="Previous Slide" className="p-5 rounded-full bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-xl hover:scale-110 active:scale-95"><ChevronLeft size={32} strokeWidth={2.5} /></button>
                    <div className="flex items-center gap-3 py-3.5 px-6 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-zinc-700">
                        {Array.from({ length: Math.min(totalSlides, 9) }).map((_, idx) => (
                            <div key={idx} onClick={() => setCurrentSlideIndex(idx)} role="button" aria-label={`Go to slide ${idx}`} className={`rounded-full transition-all duration-500 cursor-pointer ${idx === currentSlideIndex ? 'w-9 h-3 bg-blue-600 shadow-lg shadow-blue-500/40' : 'w-3 h-3 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`} />
                        ))}
                        {totalSlides > 9 && <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400 ml-2 uppercase tracking-widest leading-none">Slide {currentSlideIndex + 1}/{totalSlides}</span>}
                    </div>
                    <button onClick={() => setCurrentSlideIndex(p => (p + 1) % totalSlides)} aria-label="Next Slide" className="p-5 rounded-full bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800/50 text-slate-400 hover:text-blue-600 transition-all shadow-xl hover:scale-110 active:scale-95"><ChevronRight size={32} strokeWidth={2.5} /></button>
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
        <div className="w-full min-h-screen bg-transparent py-4 sm:py-6 px-0 sm:px-4 space-y-6 animate-in fade-in duration-200">
            {renderSlideshowOverlay()}

            {/* ─── Shadcn UI Header ─────────── */}
            <PageHeader title="Activity Logs" description="Monitor and manage all system activities.">
                <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/60">
                    <button
                        type="button"
                        onClick={() => {
                            setIsWeeklyMeetingMode(false);
                            handleDateFilterTypeChange('All');
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            !isWeeklyMeetingMode
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Semua Log (Lengkap)
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsWeeklyMeetingMode(true);
                            if (dateFilterType === 'All') {
                                applyLast7DaysPreset();
                            }
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                            isWeeklyMeetingMode
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Weekly Meeting (7 Hari)</span>
                    </button>
                </div>
                <Button variant="outline" onClick={() => { setCurrentSlideIndex(0); setIsPresenting(true); toggleFullScreen(); }} className="h-9 px-3 shrink-0" title="Presentasi Weekly Meeting">
                    <Presentation className="w-4 h-4 sm:mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline">Presentasi</span>
                </Button>
                <Button variant="outline" onClick={handleExportExcel} className="h-9 px-3 shrink-0">
                    <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export Excel</span>
                </Button>
                <Button variant="outline" size="icon" aria-label="Refresh Activities" onClick={fetchActivities} disabled={isLoading} className="shrink-0">
                    <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {canManage && (
                    <Button
                        onClick={() => { setSelectedActivity(null); setIsFormOpen(true); }}
                        className="shrink-0"
                    >
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">New Activity</span>
                    </Button>
                )}
            </PageHeader>

            {/* ─── Shadcn Stat Cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <StatCard 
                    label="Total Activities" 
                    value={stats.total} 
                    unit="Log"
                    icon={ClipboardList} 
                    percentageChange={stats.totalPct} 
                    subValue="vs periode sblm" 
                    note2={startDate && endDate ? formatShortRange(startDate, endDate) : "seluruh waktu"}
                    color="slate" 
                    drilldownData={filteredActivities}
                    drilldownTitle="Ringkasan Total Aktivitas"
                    drilldownDescription="Rekap Judul Activity, Handling Personnel, dan Remark."
                    drilldownColumns={[
                        { 
                            header: 'Judul Activity', 
                            render: (a: any) => (
                                <div>
                                    <div className="font-semibold text-foreground">{a.activityName || a.title || '-'}</div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                        {formatDate(a.createdAt)} · {a.category || '-'}
                                    </div>
                                </div>
                            ) 
                        },
                        { header: 'Handling Personnel', accessor: 'itPersonnel', className: 'w-36 font-semibold' },
                        { header: 'Remark', render: (a: any) => <span className="text-xs text-muted-foreground">{a.remarks || '-'}</span> }
                    ]}
                />
                <StatCard 
                    label="Completed" 
                    value={stats.complete} 
                    unit="Tuntas"
                    icon={CheckCircle2} 
                    percentageChange={stats.completePct} 
                    subValue="vs periode sblm" 
                    note2={`${weeklyDigest.completionRate}% completion rate`}
                    color="emerald" 
                    status="on-track" 
                    drilldownData={filteredActivities.filter(a => a.status === 'Completed')}
                    drilldownTitle="Ringkasan Aktivitas Tuntas"
                    drilldownDescription="Komposisi aktivitas IT yang berhasil diselesaikan beserta remark."
                    drilldownColumns={[
                        { 
                            header: 'Judul Activity', 
                            render: (a: any) => (
                                <div>
                                    <div className="font-semibold text-emerald-600 dark:text-emerald-400">{a.activityName || a.title || '-'}</div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                        {formatDate(a.createdAt)} · {a.category || '-'}
                                    </div>
                                </div>
                            ) 
                        },
                        { header: 'Handling Personnel', accessor: 'itPersonnel', className: 'w-36 font-semibold' },
                        { header: 'Remark', render: (a: any) => <span className="text-xs text-muted-foreground">{a.remarks || '-'}</span> }
                    ]}
                />
                <StatCard 
                    label="Ongoing / Carry-Over" 
                    value={stats.active} 
                    unit="Aktif"
                    icon={Activity} 
                    percentageChange={stats.activePct} 
                    subValue="vs periode sblm" 
                    note2="perlu tindak lanjut"
                    color="blue" 
                    drilldownData={filteredActivities.filter(a => a.status === 'In Progress' || a.status === 'Pending')}
                    drilldownTitle="Ringkasan Aktivitas Ongoing / Carry-Over"
                    drilldownDescription="Aktivitas IT yang sedang berjalan (In Progress / Pending) untuk tindak lanjut meeting."
                    drilldownColumns={[
                        { 
                            header: 'Judul Activity', 
                            render: (a: any) => (
                                <div>
                                    <div className="font-semibold text-blue-600 dark:text-blue-400">{a.activityName || a.title || '-'}</div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                        {formatDate(a.createdAt)} · {a.category || '-'}
                                    </div>
                                </div>
                            ) 
                        },
                        { header: 'Handling Personnel', accessor: 'itPersonnel', className: 'w-36 font-semibold' },
                        { header: 'Remark', render: (a: any) => <span className="text-xs text-muted-foreground">{a.remarks || '-'}</span> }
                    ]}
                />
                <StatCard 
                    label="High Alert" 
                    value={stats.highAlerts} 
                    unit="Kritis"
                    icon={AlertCircle} 
                    percentageChange={stats.highPct} 
                    subValue="vs periode sblm" 
                    note2="Critical & Major"
                    color="rose" 
                    status="at-risk" 
                    drilldownData={filteredActivities.filter(a => a.type === 'Critical' || a.type === 'Major')}
                    drilldownTitle="Ringkasan Aktivitas Kritis (High Alert)"
                    drilldownDescription="Aktivitas atau insiden bertipe Critical / Major."
                    drilldownColumns={[
                        { 
                            header: 'Judul Activity', 
                            render: (a: any) => (
                                <div>
                                    <div className="font-semibold text-rose-600 dark:text-rose-400">{a.activityName || a.title || '-'}</div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5">
                                        {formatDate(a.createdAt)} · {a.category || '-'}
                                    </div>
                                </div>
                            ) 
                        },
                        { header: 'Handling Personnel', accessor: 'itPersonnel', className: 'w-36 font-semibold' },
                        { header: 'Remark', render: (a: any) => <span className="text-xs text-muted-foreground">{a.remarks || '-'}</span> }
                    ]}
                />
            </div>

            {/* ─── Main Activity Table Card (Unified Enterprise Control Bar) ─── */}
            <Card className="rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-visible bg-white dark:bg-zinc-900">
                {/* Primary Toolbar: Title + Search + Interactive Calendar Picker + Category/Status Dropdowns */}
                <CardHeader className="p-4 sm:p-5 border-b border-slate-200/70 dark:border-zinc-800 space-y-0">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 w-full">
                        {/* Left: Section Heading & Period Metadata */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                                        {isWeeklyMeetingMode ? 'Review Weekly Meeting' : 'Semua Activity Logs'}
                                    </CardTitle>
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 tabular-nums">
                                        {filteredActivities.length} Aktivitas
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                    {isWeeklyMeetingMode
                                        ? 'Rekap fokus Judul Activity, Handling Personnel, dan Remark operasional.'
                                        : 'Daftar lengkap catatan operasional dan histori aktivitas tim IT.'}
                                </p>
                            </div>
                        </div>

                        {/* Right: Precision Controls Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-60">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Cari activity, personel, remark..."
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="h-9 w-full pl-8 pr-7 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 text-xs font-medium text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-slate-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                                        aria-label="Hapus pencarian"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Interactive Date Range Calendar Picker */}
                            <DateRangeCalendarPicker
                                startDate={startDate}
                                endDate={endDate}
                                dateFilterType={dateFilterType}
                                onSelectPreset={handleDateFilterTypeChange}
                                onSelectCustomRange={(s, e) => {
                                    setStartDate(s);
                                    setEndDate(e);
                                    setDateFilterType('Custom');
                                    setCurrentPage(1);
                                }}
                                onShiftDays={shiftDateWindow}
                                formatShortRange={formatShortRange}
                            />

                            {/* Category Custom Dropdown */}
                            <FilterDropdown
                                value={categoryFilter}
                                onChange={val => { setCategoryFilter(val); setCurrentPage(1); }}
                                className="w-40"
                                options={[
                                    { value: 'All', label: 'Semua Kategori' },
                                    ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
                                ]}
                            />

                            {/* Status Custom Dropdown (shown in Semua Log mode; Weekly Meeting uses Agenda bar below) */}
                            {!isWeeklyMeetingMode && (
                                <FilterDropdown
                                    value={statusFilter}
                                    onChange={val => { setStatusFilter(val); setCurrentPage(1); }}
                                    className="w-36"
                                    options={[
                                        { value: 'All', label: 'Semua Status' },
                                        { value: 'Ongoing', label: 'Ongoing (Aktif)' },
                                        { value: 'Completed', label: 'Completed' },
                                        { value: 'In Progress', label: 'In Progress' },
                                        { value: 'Pending', label: 'Pending' },
                                    ]}
                                />
                            )}

                            {/* Reset Filter Button */}
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetAllFilters}
                                    className="h-9 px-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-zinc-800 shrink-0"
                                    title="Reset semua filter ke Semua Waktu"
                                >
                                    <FilterX size={13} className="mr-1.5" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {/* Secondary Sub-Toolbar: Weekly Meeting Agenda & Personnel Filter Bar */}
                {isWeeklyMeetingMode && (
                    <div className="px-4 sm:px-5 py-2.5 bg-slate-50/70 dark:bg-zinc-950/40 border-b border-slate-200/70 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                        {/* Left: Segmented Agenda Status Filter */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mr-1">
                                Status:
                            </span>
                            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => { setStatusFilter('All'); setPriorityFocusOnly(false); setCurrentPage(1); }}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                        statusFilter === 'All'
                                            ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    Semua <span className="ml-1 text-[10px] opacity-70 tabular-nums">({weeklyDigest.total})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStatusFilter('Ongoing'); setPriorityFocusOnly(false); setCurrentPage(1); }}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                                        statusFilter === 'Ongoing'
                                            ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-2xs"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Carry-Over / Ongoing <span className="text-[10px] opacity-75 tabular-nums">({weeklyDigest.ongoing})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStatusFilter('Completed'); setPriorityFocusOnly(false); setCurrentPage(1); }}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                                        statusFilter === 'Completed'
                                            ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                                            : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Tuntas <span className="text-[10px] opacity-75 tabular-nums">({weeklyDigest.completed})</span>
                                </button>
                            </div>
                        </div>

                        {/* Right: Handling Personnel Chips & Sort Order */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mr-1">
                                Personel:
                            </span>
                            <button
                                type="button"
                                onClick={() => { setPicFilter('All'); setCurrentPage(1); }}
                                className={cn(
                                    "h-7 px-2.5 rounded-md text-xs font-semibold border transition-all cursor-pointer",
                                    picFilter === 'All'
                                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                                        : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                )}
                            >
                                Semua
                            </button>
                            {weeklyDigest.pics.map(([pic, info]) => {
                                const active = picFilter === pic;
                                return (
                                    <button
                                        key={pic}
                                        type="button"
                                        onClick={() => { setPicFilter(active ? 'All' : pic); setCurrentPage(1); }}
                                        className={cn(
                                            "h-7 px-2.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer",
                                            active
                                                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-zinc-900 dark:border-white font-semibold"
                                                : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <span>{pic}</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.2 rounded font-bold tabular-nums",
                                            active ? "bg-white/20 text-white dark:bg-black/15 dark:text-zinc-900" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                                        )}>
                                            {info.total}
                                        </span>
                                    </button>
                                );
                            })}

                            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

                            <button
                                type="button"
                                onClick={() => setSortOngoingFirst(!sortOngoingFirst)}
                                className={cn(
                                    "h-7 px-2.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer",
                                    sortOngoingFirst
                                        ? "bg-blue-50/80 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60"
                                        : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800"
                                )}
                                title="Tampilkan pekerjaan yang belum selesai (In Progress / Pending) di urutan paling atas"
                            >
                                <ArrowUpDown size={12} />
                                <span>{sortOngoingFirst ? 'Ongoing di Atas' : 'Urutan Waktu'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Table & Mobile Card List */}
                <CardContent className="p-0">
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block overflow-x-auto">
                        {isWeeklyMeetingMode ? (
                            <Table className="table-fixed">
                                <TableHeader className="bg-slate-50/60 dark:bg-zinc-900/50 border-b border-slate-200/70 dark:border-zinc-800">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="pl-6 h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[38%]">Judul Activity</TableHead>
                                        <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[22%]">Handling Personnel</TableHead>
                                        <TableHead className="pr-6 h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[40%]">Remark / Keterangan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedActivities.map((act) => (
                                        <TableRow
                                            key={act.id}
                                            className="group hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800/60 transition-colors"
                                        >
                                            <TableCell className="pl-6 py-3.5 cursor-pointer overflow-hidden align-top" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                                <div className="flex items-start gap-3 min-w-0">
                                                    {(() => {
                                                        const config = getCategoryConfig(act.category);
                                                        return (
                                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5", config.color)}>
                                                                {config.icon}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="min-w-0 flex-1 whitespace-normal">
                                                        <span className="font-semibold text-[13.5px] text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block leading-snug">
                                                            {act.activityName}
                                                        </span>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                            <StatusBadge status={act.status} />
                                                            <CategoryBadge category={act.category} />
                                                            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                                                                <Calendar size={11} />
                                                                {formatDate(act.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5 cursor-pointer overflow-hidden align-top" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <UserAvatar name={act.itPersonnel} url={userAvatars[act.itPersonnel]} size="sm" className="border border-slate-200 dark:border-zinc-700 shrink-0" />
                                                    <div className="min-w-0">
                                                        <span className="font-semibold text-[13px] text-slate-800 dark:text-zinc-200 block truncate">{act.itPersonnel}</span>
                                                        {act.location && (
                                                            <span className="text-[11px] text-slate-400 dark:text-zinc-500 block truncate">{act.location}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 py-3.5 cursor-pointer align-top whitespace-normal" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                                {act.remarks ? (
                                                    <p className="text-[13px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                                                        {act.remarks}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-zinc-600">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <Table className="table-fixed">
                                <TableHeader className="bg-slate-50/60 dark:bg-zinc-900/50 border-b border-slate-200/70 dark:border-zinc-800">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="pl-6 h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[32%]">Activity Name</TableHead>
                                        <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[12%]">Status</TableHead>
                                        <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[16%]">Requester</TableHead>
                                        <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[11%]">Date</TableHead>
                                        <TableHead className="h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[17%]">IT Personnel</TableHead>
                                        <TableHead className="text-right pr-6 h-10 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 w-[12%]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedActivities.map((act) => (
                                        <TableRow
                                            key={act.id}
                                            className="group hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800/60 transition-colors"
                                        >
                                            <TableCell className="pl-6 py-4 cursor-pointer overflow-hidden" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    {(() => {
                                                        const config = getCategoryConfig(act.category);
                                                        return (
                                                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border", config.color)}>
                                                                {config.icon}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-semibold text-[13.5px] text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block truncate max-w-[240px] md:max-w-xs">{act.activityName}</span>
                                                        <div className="mt-1"><CategoryBadge category={act.category} /></div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}><StatusBadge status={act.status} /></TableCell>
                                            <TableCell className="cursor-pointer overflow-hidden" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <UserAvatar name={act.requester} url={userAvatars[act.requester] || act.avatarUrl} size="sm" className="border border-slate-200 dark:border-zinc-700 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="font-semibold text-[13px] block leading-none text-slate-800 dark:text-zinc-200 truncate max-w-[120px]">{act.requester}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 mt-1 block truncate max-w-[120px]">{act.department}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-slate-600 dark:text-zinc-400 cursor-pointer" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                                                    <span>{formatDate(act.createdAt)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="cursor-pointer overflow-hidden" onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <UserAvatar name={act.itPersonnel} url={userAvatars[act.itPersonnel]} size="sm" className="border border-slate-200 dark:border-zinc-700 shrink-0" />
                                                    <span className="font-semibold text-[13px] text-slate-800 dark:text-zinc-200 truncate max-w-[120px]">{act.itPersonnel}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity duration-150">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="View Activity Details"
                                                        onClick={(e) => { e?.stopPropagation?.(); setSelectedActivity(act); setIsDetailOpen(true); }}
                                                        className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                                    >
                                                        <Eye size={15} />
                                                    </Button>

                                                    {(isAdmin || (isStaff && act.itPersonnel === (currentUser?.fullName || currentUser?.username))) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Edit Activity"
                                                            onClick={(e) => { e?.stopPropagation?.(); setSelectedActivity(act); setIsFormOpen(true); }}
                                                            className="w-8 h-8 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                                                        >
                                                            <Edit size={15} />
                                                        </Button>
                                                    )}

                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Delete Activity"
                                                            onClick={(e) => { e?.stopPropagation?.(); setDeleteActivity(act); }}
                                                            className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                                                        >
                                                            <Trash2 size={15} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {/* Mobile View (Card List) */}
                    <div className="block md:hidden divide-y divide-slate-100 dark:divide-zinc-800/40">
                        {paginatedActivities.map((act) => {
                            const config = getCategoryConfig(act.category);
                            return (
                                <div
                                    key={act.id}
                                    onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}
                                    className="p-4 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                >
                                    {/* First Row: Category & Badges */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border shrink-0", config.color)}>
                                                {config.icon}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                                {act.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <StatusBadge status={act.status} />
                                        </div>
                                    </div>

                                    {/* Second Row: Activity Title & Remark */}
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                                            {act.activityName}
                                        </h3>
                                        {isWeeklyMeetingMode && act.remarks && (
                                            <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 leading-relaxed">
                                                {act.remarks}
                                            </p>
                                        )}
                                    </div>

                                    {/* Third Row: Handling Personnel */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-zinc-800/20 text-[11px]">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <UserAvatar name={act.itPersonnel} url={userAvatars[act.itPersonnel]} size="xs" className="shrink-0" />
                                            <div className="min-w-0">
                                                <span className="text-[9px] text-slate-400 dark:text-zinc-500 block uppercase font-bold tracking-wider leading-none">Handling Personnel</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate mt-0.5">{act.itPersonnel}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                                            <Calendar size={11} />
                                            <span>{formatDate(act.createdAt)}</span>
                                        </div>
                                        {!isWeeklyMeetingMode && (
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label="View Activity Details"
                                                    onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }}
                                                    className="w-7 h-7 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                >
                                                    <Eye size={14} />
                                                </Button>

                                                {(isAdmin || (isStaff && act.itPersonnel === (currentUser?.fullName || currentUser?.username))) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Edit Activity"
                                                        onClick={() => { setSelectedActivity(act); setIsFormOpen(true); }}
                                                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400"
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                )}

                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Delete Activity"
                                                        onClick={() => setDeleteActivity(act)}
                                                        className="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {paginatedActivities.length === 0 && (
                        <div className="py-20 text-center">
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
                                    onClick={resetAllFilters}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/70 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-900/40 rounded-b-xl">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-medium text-slate-500 dark:text-zinc-400 w-full sm:w-auto">
                            <span>
                                Menampilkan <span className="font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">{filteredActivities.length > 0 ? startItem : 0}-{endItem}</span> dari <span className="font-semibold text-slate-800 dark:text-zinc-200 tabular-nums">{filteredActivities.length}</span>
                            </span>

                            <div className="flex items-center gap-1.5 sm:ml-2 sm:pl-4 sm:border-l border-slate-200 dark:border-zinc-800">
                                <span className="text-[11px] text-slate-400 dark:text-zinc-500 mr-1">Baris:</span>
                                {[10, 20, 50].map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => { setRowsPerPage(size); setCurrentPage(1); }}
                                        className={cn(
                                            "h-6 px-2 rounded text-[11px] font-semibold transition-colors cursor-pointer tabular-nums",
                                            rowsPerPage === size
                                                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
                                                : "text-slate-500 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
                            <Button variant="outline" size="icon" aria-label="First page" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border-slate-200 dark:border-zinc-800">
                                <ChevronsLeft size={14} />
                            </Button>
                            <Button variant="outline" size="icon" aria-label="Previous page" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border-slate-200 dark:border-zinc-800">
                                <ChevronLeft size={14} />
                            </Button>

                            <div className="flex items-center justify-center min-w-[32px] h-8 px-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold tabular-nums">
                                {currentPage} / {totalPages}
                            </div>

                            <Button variant="outline" size="icon" aria-label="Next page" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border-slate-200 dark:border-zinc-800">
                                <ChevronRight size={14} />
                            </Button>
                            <Button variant="outline" size="icon" aria-label="Last page" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border-slate-200 dark:border-zinc-800">
                                <ChevronsRight size={14} />
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

