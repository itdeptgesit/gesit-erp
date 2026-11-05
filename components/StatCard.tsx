import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronRight, Search, X, Layers, Database, BarChart3, ListFilter, PieChart, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface DrilldownColumn {
    header: string;
    accessor?: string;
    render?: (row: any, index: number) => React.ReactNode;
    className?: string;
}

export interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    subtext?: string; // Alias for subValue
    unit?: string; // e.g. "Open", "Tuntas", "Jam", "Log", "Unit"
    note2?: string; // Secondary tail text (e.g. "target 90%", "dari 3 tiket")
    accent?: string; // Hex or CSS color for the primary note
    icon: any;
    color?: string; // "blue", "emerald", "amber", "rose", "indigo", "purple", "slate", "violet", "sky", "orange"
    colorClass?: string; // Custom Tailwind classes
    trend?: number;
    onClick?: () => void;
    children?: React.ReactNode;
    trendData?: number[];
    percentageChange?: number;
    target?: number;
    comparisonPeriod?: 'MTD' | 'QTD' | 'YTD' | 'vs Last Month' | 'vs Last Week';
    previousValue?: number;
    showSparkline?: boolean;
    status?: 'on-track' | 'at-risk' | 'delayed';
    // Drilldown capabilities
    drilldownData?: any[];
    drilldownTitle?: string;
    drilldownDescription?: string;
    drilldownColumns?: DrilldownColumn[];
    drilldownEmptyMessage?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    subValue,
    subtext,
    unit,
    note2,
    accent,
    icon: Icon,
    color = "blue",
    colorClass,
    trend,
    onClick,
    children,
    trendData,
    percentageChange,
    target,
    comparisonPeriod,
    previousValue,
    showSparkline = true,
    status,
    drilldownData,
    drilldownTitle,
    drilldownDescription,
    drilldownColumns,
    drilldownEmptyMessage = "Tidak ada data rincian untuk indikator ini."
}) => {
    const [isDrillOpen, setIsDrillOpen] = useState(false);
    const [drillSearch, setDrillSearch] = useState('');
    const [viewMode, setViewMode] = useState<'summary' | 'list'>('summary');
    const [visibleCount, setVisibleCount] = useState(50);

    // Reset viewMode and scroll limit when modal opens or closes
    const handleOpenChange = (open: boolean) => {
        setIsDrillOpen(open);
        if (open) {
            setViewMode('summary');
            setVisibleCount(50);
            setDrillSearch('');
        }
    };

    // Color mapping consistent with DashboardIT
    const colorMap: Record<string, { bg: string; text: string; border: string; accent: string }> = {
        blue: {
            bg: 'bg-blue-50/90 dark:bg-blue-950/40',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-100/80 dark:border-blue-900/40',
            accent: '#2f6bff'
        },
        emerald: {
            bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-100/80 dark:border-emerald-900/40',
            accent: '#12b76a'
        },
        green: {
            bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-100/80 dark:border-emerald-900/40',
            accent: '#12b76a'
        },
        amber: {
            bg: 'bg-amber-50/90 dark:bg-amber-950/40',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-100/80 dark:border-amber-900/40',
            accent: '#f79009'
        },
        orange: {
            bg: 'bg-orange-50/90 dark:bg-orange-950/40',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-100/80 dark:border-orange-900/40',
            accent: '#f79009'
        },
        rose: {
            bg: 'bg-rose-50/90 dark:bg-rose-950/40',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-100/80 dark:border-rose-900/40',
            accent: '#f04438'
        },
        red: {
            bg: 'bg-rose-50/90 dark:bg-rose-950/40',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-100/80 dark:border-rose-900/40',
            accent: '#f04438'
        },
        indigo: {
            bg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-100/80 dark:border-indigo-900/40',
            accent: '#6366f1'
        },
        purple: {
            bg: 'bg-purple-50/90 dark:bg-purple-950/40',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-100/80 dark:border-purple-900/40',
            accent: '#9333ea'
        },
        violet: {
            bg: 'bg-purple-50/90 dark:bg-purple-950/40',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-100/80 dark:border-purple-900/40',
            accent: '#8b5cf6'
        },
        sky: {
            bg: 'bg-sky-50/90 dark:bg-sky-950/40',
            text: 'text-sky-600 dark:text-sky-400',
            border: 'border-sky-100/80 dark:border-sky-900/40',
            accent: '#0ea5e9'
        },
        slate: {
            bg: 'bg-slate-100/80 dark:bg-zinc-800/80',
            text: 'text-slate-700 dark:text-slate-300',
            border: 'border-slate-200/80 dark:border-zinc-700/80',
            accent: '#64748b'
        }
    };

    const c = colorMap[color] || colorMap.blue;
    const finalSubText = subValue || subtext;
    const effectiveAccent = accent || c.accent;

    // Split subtext if it contains dot separator " · "
    let primaryNote = finalSubText;
    let secondaryNote = note2;

    if (finalSubText && finalSubText.includes('·') && !secondaryNote) {
        const parts = finalSubText.split('·');
        primaryNote = parts[0].trim();
        secondaryNote = parts.slice(1).join('·').trim();
    }

    const calculatedChange = percentageChange !== undefined
        ? percentageChange
        : (previousValue && typeof value === 'number')
            ? ((value - previousValue) / previousValue) * 100
            : undefined;

    const trendDirection = calculatedChange !== undefined
        ? calculatedChange > 0 ? 'up' : calculatedChange < 0 ? 'down' : 'neutral'
        : undefined;

    const hasDrilldown = Array.isArray(drilldownData) && drilldownData.length > 0;
    const isInteractive = Boolean(onClick || hasDrilldown);

    const handleCardClick = () => {
        if (onClick) {
            onClick();
        }
        if (hasDrilldown) {
            setIsDrillOpen(true);
        }
    };

    // Filter drilldown data by search term
    const filteredDrilldownData = useMemo(() => {
        if (!drilldownData) return [];
        if (!drillSearch.trim()) return drilldownData;
        const q = drillSearch.toLowerCase();
        return drilldownData.filter(item => {
            if (typeof item === 'string' || typeof item === 'number') {
                return String(item).toLowerCase().includes(q);
            }
            if (typeof item === 'object' && item !== null) {
                return Object.values(item).some(val =>
                    val !== null && val !== undefined && String(val).toLowerCase().includes(q)
                );
            }
            return false;
        });
    }, [drilldownData, drillSearch]);

    // Auto-detect columns if not explicitly provided
    const resolvedColumns: DrilldownColumn[] = useMemo(() => {
        if (drilldownColumns && drilldownColumns.length > 0) return drilldownColumns;
        if (!drilldownData || drilldownData.length === 0) return [];
        const sample = drilldownData[0];
        if (typeof sample !== 'object' || sample === null) {
            return [{ header: 'Data', render: (val: any) => String(val) }];
        }
        // Exclude system fields
        const excludedKeys = new Set(['created_at', 'updated_at', 'id', 'user_id', 'avatar_url', 'image_url']);
        const keys = Object.keys(sample).filter(k => !excludedKeys.has(k)).slice(0, 5);
        return keys.map(k => ({
            header: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            accessor: k
        }));
    }, [drilldownColumns, drilldownData]);

    // Palette for breakdown items
    const PALETTE = [
        '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', 
        '#ec4899', '#f97316', '#64748b', '#14b8a6', '#6366f1'
    ];

    // Compute automatic executive breakdown of drilldown data
    const breakdown = useMemo(() => {
        if (!drilldownData || drilldownData.length === 0) return null;

        const totalCount = drilldownData.length;

        // Detect financial / numerical total key
        const amountKey = ['grandTotal', 'totalPrice', 'total_price', 'amount', 'price', 'nilai', 'cost', 'budget'].find(k =>
            drilldownData.some(item => item && typeof item[k] === 'number' && !isNaN(item[k]))
        );
        const totalAmount = amountKey
            ? drilldownData.reduce((acc, curr) => acc + (Number(curr[amountKey]) || 0), 0)
            : undefined;

        // Helper to group by a key
        const groupByKey = (targetKey?: string) => {
            if (!targetKey) return [];
            const map = new Map<string, { count: number; amount: number }>();
            for (const item of drilldownData) {
                if (!item || typeof item !== 'object') continue;
                const raw = item[targetKey];
                const label = raw !== undefined && raw !== null && String(raw).trim() !== '' ? String(raw).trim() : 'Lainnya';
                const cur = map.get(label) || { count: 0, amount: 0 };
                cur.count += 1;
                if (amountKey) cur.amount += Number(item[amountKey]) || 0;
                map.set(label, cur);
            }
            return Array.from(map.entries())
                .map(([name, data], idx) => ({
                    name,
                    count: data.count,
                    percent: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0,
                    amount: amountKey ? data.amount : undefined,
                    color: PALETTE[idx % PALETTE.length]
                }))
                .sort((a, b) => b.count - a.count);
        };

        // Detect category key
        const categoryKey = ['category', 'kategori', 'type', 'tipe', 'group', 'classification'].find(k =>
            drilldownData.some(item => item && item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '')
        );

        // Detect status key
        const statusKey = ['status', 'state', 'condition', 'kondisi'].find(k =>
            drilldownData.some(item => item && item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '')
        );

        // Detect secondary key (department/requester/vendor)
        const secondaryKey = ['department', 'departemen', 'requester', 'vendor', 'supplier', 'assigned_to', 'itPersonnel'].find(k =>
            k !== categoryKey && drilldownData.some(item => item && item[k] !== undefined && item[k] !== null && String(item[k]).trim() !== '')
        );

        const categories = groupByKey(categoryKey);
        const statuses = groupByKey(statusKey);
        const secondary = groupByKey(secondaryKey);

        return {
            totalCount,
            totalAmount,
            amountKey,
            categoryKey,
            categories,
            statusKey,
            statuses,
            secondaryKey,
            secondary
        };
    }, [drilldownData]);

    const displayedData = useMemo(() => {
        return filteredDrilldownData.slice(0, visibleCount);
    }, [filteredDrilldownData, visibleCount]);

    // Infinite scroll listener inside modal
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
            setVisibleCount(prev => Math.min(prev + 50, filteredDrilldownData.length));
        }
    };

    return (
        <>
            <motion.div
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                onClick={isInteractive ? handleCardClick : undefined}
                className={`
                    relative flex flex-col justify-between p-4 sm:p-5
                    bg-white/90 dark:bg-[#0f1011] text-card-foreground 
                    border border-slate-200/80 dark:border-[#23252a]
                    rounded-[16px] min-h-[112px] shadow-sm hover:shadow-md
                    transition-all duration-200 
                    ${isInteractive ? 'cursor-pointer group hover:border-slate-300 dark:hover:border-zinc-700' : ''}
                    ${colorClass || ''}
                `}
                title={isInteractive ? (hasDrilldown ? `Klik untuk melihat rincian data ${label}` : `Klik untuk filter ${label}`) : undefined}
            >
                {/* Header (Icon + Label + Action Indicator) */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {typeof Icon === 'string' ? (
                            <div className="w-8 h-8 rounded-[9px] bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700 flex items-center justify-center p-1 shrink-0">
                                <img src={Icon} className="w-full h-full object-contain" alt="" />
                            </div>
                        ) : (
                            Icon && (
                                <div className={`w-8 h-8 rounded-[9px] ${c.bg} ${c.text} border ${c.border} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                                    <Icon size={16} strokeWidth={2.2} />
                                </div>
                            )
                        )}
                        <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 tracking-tight truncate">
                            {label}
                        </span>
                    </div>

                    {/* Right side: Interactive Indicator or Percentage Badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {calculatedChange !== undefined && (
                            <div className={`flex items-center gap-0.5 font-bold text-[11px] px-1.5 py-0.5 rounded-full ${
                                trendDirection === 'up'
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>
                                {trendDirection === 'up' ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
                                {Math.abs(calculatedChange).toFixed(0)}%
                            </div>
                        )}

                        {isInteractive && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                                <ChevronRight size={14} strokeWidth={2.2} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Primary Metric Value */}
                <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                            {unit}
                        </span>
                    )}
                </div>

                {/* Footer Subtext / Delta / Notes */}
                {(primaryNote || secondaryNote) && (
                    <div className="mt-2 text-[11.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                        {primaryNote && (
                            <span style={{ color: effectiveAccent }} className="font-semibold shrink-0">
                                {primaryNote}
                            </span>
                        )}
                        {primaryNote && secondaryNote && (
                            <span className="text-slate-300 dark:text-zinc-600">·</span>
                        )}
                        {secondaryNote && (
                            <span className="text-slate-400 dark:text-slate-500 truncate">
                                {secondaryNote}
                            </span>
                        )}
                    </div>
                )}

                {children}
            </motion.div>

            {/* Drilldown Modal: Ringkasan & Rincian Data Indikator */}
            {hasDrilldown && (
                <Dialog open={isDrillOpen} onOpenChange={handleOpenChange}>
                    <DialogContent showCloseButton={false} className="sm:max-w-3xl max-h-[85vh] p-0 overflow-hidden border bg-background shadow-2xl rounded-2xl outline-none">
                        <div className="flex flex-col h-full max-h-[85vh]">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0 bg-muted/20">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.text} border ${c.border} flex items-center justify-center shrink-0`}>
                                        {typeof Icon === 'string' ? (
                                            <img src={Icon} className="w-5 h-5 object-contain" alt="" />
                                        ) : Icon ? (
                                            <Icon size={18} strokeWidth={2.2} />
                                        ) : (
                                            <Layers size={18} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <DialogTitle className="text-sm font-bold text-foreground">
                                                {drilldownTitle || `Ringkasan Indikator: ${label}`}
                                            </DialogTitle>
                                            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {drilldownData?.length || 0} Total
                                            </Badge>
                                        </div>
                                        <DialogDescription className="text-xs text-muted-foreground font-normal normal-case mt-0.5">
                                            {drilldownDescription || (primaryNote ? `${primaryNote} ${secondaryNote ? `· ${secondaryNote}` : ''}` : `Ringkasan komposisi pembentuk angka pada metrik ${label}.`)}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsDrillOpen(false)}
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X size={16} />
                                </Button>
                            </div>

                            {/* View Switcher Tabs: Ringkasan (Default) vs Rincian Data */}
                            <div className="px-6 py-2.5 border-b bg-muted/10 flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('summary')}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                                            viewMode === 'summary'
                                                ? 'bg-background text-foreground shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <PieChart size={13} className={viewMode === 'summary' ? 'text-primary' : ''} />
                                        Ringkasan Komposisi
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                                            viewMode === 'list'
                                                ? 'bg-background text-foreground shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <ListFilter size={13} className={viewMode === 'list' ? 'text-primary' : ''} />
                                        Rincian Data ({filteredDrilldownData.length})
                                    </button>
                                </div>

                                {viewMode === 'list' && (
                                    <div className="relative flex-1 max-w-xs">
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={drillSearch}
                                            onChange={(e) => {
                                                setDrillSearch(e.target.value);
                                                setVisibleCount(50);
                                            }}
                                            placeholder={`Cari item...`}
                                            className="h-7 pl-7 pr-3 text-xs bg-muted/30 rounded-lg border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Modal Content with Native Reliable Smooth Scroll */}
                            <div onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto w-full p-6">
                                {viewMode === 'summary' ? (
                                    /* ───────── TAB 1: EXECUTIVE SUMMARY / BREAKDOWN ───────── */
                                    <div className="space-y-6">
                                        {/* Value Highlight Banner */}
                                        <div className="p-4 rounded-xl border bg-gradient-to-r from-muted/40 via-muted/20 to-transparent flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <div className="text-[11px] font-semibold text-muted-foreground">
                                                    Nilai Metrik Saat Ini
                                                </div>
                                                <div className="flex items-baseline gap-2 mt-1">
                                                    <span className="text-3xl font-black tracking-tight text-foreground">
                                                        {value}
                                                    </span>
                                                    {unit && (
                                                        <span className="text-sm font-semibold text-muted-foreground">
                                                            {unit}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Terdiri dari total <b>{breakdown?.totalCount || 0} entri</b> yang membentuk capaian ini.
                                                </p>
                                            </div>

                                            {breakdown?.totalAmount !== undefined && (
                                                <div className="text-right">
                                                    <div className="text-[11px] font-semibold text-muted-foreground">
                                                        Akumulasi Nilai Rupiah
                                                    </div>
                                                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                                        {formatDrilldownCurrency(breakdown.totalAmount)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Proportion Multi-Segment Bar */}
                                        {breakdown?.categories && breakdown.categories.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-2">
                                                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                        <BarChart3 size={14} className="text-primary" />
                                                        Distribusi Porsi Kategori
                                                    </span>
                                                    <span className="text-muted-foreground text-[11px]">
                                                        {breakdown.categories.length} Kelompok
                                                    </span>
                                                </div>
                                                <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden flex shadow-inner">
                                                    {breakdown.categories.map((cat, i) => (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                width: `${Math.max(cat.percent, 3)}%`,
                                                                backgroundColor: cat.color
                                                            }}
                                                            title={`${cat.name}: ${cat.count} (${cat.percent}%)`}
                                                            className="h-full transition-all hover:brightness-110"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Breakdown Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Category / Type Composition Card */}
                                            {breakdown?.categories && breakdown.categories.length > 0 && (
                                                <div className="p-4 rounded-xl border bg-card/60 space-y-3">
                                                    <div className="text-xs font-bold text-foreground flex items-center justify-between border-b pb-2">
                                                        <span>Komposisi Kategori / Tipe</span>
                                                        <span className="text-[10px] text-muted-foreground font-normal">
                                                            {breakdown.totalCount} Total
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {breakdown.categories.slice(0, 6).map((cat, idx) => (
                                                            <div key={idx} className="space-y-1">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <div className="flex items-center gap-2 truncate max-w-[200px]">
                                                                        <span
                                                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                            style={{ backgroundColor: cat.color }}
                                                                        />
                                                                        <span className="font-medium text-foreground truncate" title={cat.name}>
                                                                            {cat.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right shrink-0 flex items-center gap-1.5">
                                                                        <span className="font-bold text-foreground">{cat.count}</span>
                                                                        <span className="text-[10px] text-muted-foreground">({cat.percent}%)</span>
                                                                        {cat.amount !== undefined && (
                                                                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ml-1">
                                                                                {formatDrilldownCurrency(cat.amount)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            width: `${cat.percent}%`,
                                                                            backgroundColor: cat.color
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {breakdown.categories.length > 6 && (
                                                            <div className="text-[11px] text-muted-foreground text-center pt-1 italic">
                                                                + {breakdown.categories.length - 6} kategori lainnya
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status / State Composition Card */}
                                            {breakdown?.statuses && breakdown.statuses.length > 0 && (
                                                <div className="p-4 rounded-xl border bg-card/60 space-y-3">
                                                    <div className="text-xs font-bold text-foreground flex items-center justify-between border-b pb-2">
                                                        <span>Status Eksekusi</span>
                                                        <span className="text-[10px] text-muted-foreground font-normal">
                                                            Kondisi Terkini
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {breakdown.statuses.map((st, idx) => (
                                                            <div key={idx} className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    {renderCellValue(st.name)}
                                                                </div>
                                                                <div className="text-right flex items-center gap-1.5">
                                                                    <span className="text-xs font-bold text-foreground">{st.count}</span>
                                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                                                        {st.percent}%
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Secondary Breakdown (e.g. Department or Requester) */}
                                                    {breakdown?.secondary && breakdown.secondary.length > 0 && (
                                                        <div className="pt-2 border-t mt-3">
                                                            <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                                                                Departemen / Pemohon Teratas:
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {breakdown.secondary.slice(0, 4).map((sec, sIdx) => (
                                                                    <Badge key={sIdx} variant="outline" className="text-[10px] py-0.5 px-2 bg-muted/30">
                                                                        {sec.name}: <b className="ml-1 text-foreground">{sec.count}</b>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* ───────── TAB 2: DETAILED TABLE / DATA LIST ───────── */
                                    filteredDrilldownData.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                            <Database size={36} className="opacity-20 mb-2" />
                                            <p className="text-xs font-semibold">{drilldownEmptyMessage}</p>
                                            {drillSearch && (
                                                <p className="text-[11px] opacity-70 mt-1">
                                                    Tidak ada hasil yang cocok dengan kata kunci "{drillSearch}"
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3 pb-2">
                                            <div className="rounded-xl border border-border/70 overflow-hidden shadow-xs bg-card">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead className="sticky top-0 bg-background/95 backdrop-blur z-20 shadow-xs border-b">
                                                        <tr className="border-b bg-muted/60 text-muted-foreground font-semibold">
                                                            <th className="py-2.5 px-3.5 w-12 text-center">#</th>
                                                            {resolvedColumns.map((col, idx) => (
                                                                <th key={idx} className={`py-2.5 px-3.5 ${col.className || ''}`}>
                                                                    {col.header}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/60">
                                                        {displayedData.map((row, rowIdx) => (
                                                            <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                                                                <td className="py-2.5 px-3.5 text-center text-muted-foreground font-mono text-[11px]">
                                                                    {rowIdx + 1}
                                                                </td>
                                                                {resolvedColumns.map((col, colIdx) => (
                                                                    <td key={colIdx} className={`py-2.5 px-3.5 ${col.className || ''}`}>
                                                                        {col.render ? (
                                                                            col.render(row, rowIdx)
                                                                        ) : col.accessor ? (
                                                                            renderCellValue(row[col.accessor])
                                                                        ) : (
                                                                            '-'
                                                                        )}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Scroll / Load Controls */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1 pt-1">
                                                <span>
                                                    Menampilkan <b>{displayedData.length}</b> dari <b>{filteredDrilldownData.length}</b> baris (scroll ke bawah untuk muat otomatis)
                                                </span>
                                                {displayedData.length < filteredDrilldownData.length ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setVisibleCount(c => Math.min(c + 50, filteredDrilldownData.length))}
                                                            className="h-7 text-xs px-2.5 rounded-lg"
                                                        >
                                                            Muat +50 Lagi
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => setVisibleCount(filteredDrilldownData.length)}
                                                            className="h-7 text-xs px-2.5 font-medium rounded-lg"
                                                        >
                                                            Tampilkan Semua ({filteredDrilldownData.length})
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                        ✓ Seluruh {filteredDrilldownData.length} data telah dimuat
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground shrink-0">
                                <span>
                                    {viewMode === 'summary' ? (
                                        <>Ringkasan pembentuk indikator <b>{label}</b></>
                                    ) : (
                                        <>Total <b>{filteredDrilldownData.length}</b> data ditemukan</>
                                    )}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setViewMode(v => v === 'summary' ? 'list' : 'summary')}
                                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        {viewMode === 'summary' ? 'Lihat Semua Baris' : 'Kembali ke Ringkasan'}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setIsDrillOpen(false)} className="h-7 text-xs rounded-lg">
                                        Tutup
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

// Helper to format table cells cleanly
function renderCellValue(val: any): React.ReactNode {
    if (val === null || val === undefined || val === '') return <span className="text-muted-foreground/50">-</span>;
    if (typeof val === 'boolean') {
        return (
            <Badge variant={val ? 'default' : 'secondary'} className="text-[10px] h-5">
                {val ? 'Ya' : 'Tidak'}
            </Badge>
        );
    }
    // Check if status-like string
    if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (['active', 'used', 'resolved', 'closed', 'completed', 'paid', 'approved', 'done'].includes(lower)) {
            return <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">{val}</Badge>;
        }
        if (['pending', 'waiting', 'waiting approval', 'in progress', 'open', 'idle'].includes(lower)) {
            return <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">{val}</Badge>;
        }
        if (['broken', 'overdue', 'cancelled', 'rejected', 'high', 'critical'].includes(lower)) {
            return <Badge variant="outline" className="text-[10px] text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30">{val}</Badge>;
        }
    }
    return <span>{String(val)}</span>;
}

// Helper to format currency inside drilldown summary
function formatDrilldownCurrency(val: number): string {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}
