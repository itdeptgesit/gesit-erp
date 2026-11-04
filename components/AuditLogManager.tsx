'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    Search, RefreshCcw, Clock, Shield, RotateCcw, Eye, User,
    ChevronLeft, ChevronRight, Cpu, FileText, Trash2,
    ArrowRightLeft, Download, Copy, Check, Sparkles, Key, Lock, Settings,
    Layers, Terminal, BarChart3, X, AlertTriangle, Globe, Monitor,
    LogIn, ShoppingCart, Network, Headphones
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
import { AuditLog, UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from './ToastProvider';

interface AuditLogManagerProps {
    currentUser: UserAccount | null;
}

type ActionCategory = 'CREATE' | 'UPDATE' | 'DELETE' | 'SECURITY' | 'OTHER';
type CategoryFilter = 'ALL' | Exclude<ActionCategory, 'OTHER'>;
type TimeRange = 'ALL' | '24H' | '7D' | '30D';

const FETCH_LIMIT = 1000;
const POLL_INTERVAL_MS = 30000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Urutan pengecekan penting: Login/Logout/Password masuk SECURITY sebelum
// kata kunci create/update, supaya "Login" tidak jatuh ke kategori lain.
const classifyAction = (actionStr: string): ActionCategory => {
    const a = (actionStr || '').toLowerCase();
    if (/(delete|remove|terminate|drop|purge|hapus)/.test(a)) return 'DELETE';
    if (/(login|logout|password|token|credential|auth|permission|role|group)/.test(a)) return 'SECURITY';
    if (/(create|add|register|insert|upload|import|tambah)/.test(a)) return 'CREATE';
    if (/(update|change|edit|modify|approve|reject|assign|ubah)/.test(a)) return 'UPDATE';
    return 'OTHER';
};

const CATEGORY_STYLE: Record<ActionCategory, { badge: string; dot: string; label: string }> = {
    DELETE: {
        badge: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        dot: 'bg-rose-500', label: 'Delete'
    },
    CREATE: {
        badge: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
        dot: 'bg-emerald-500', label: 'Create'
    },
    UPDATE: {
        badge: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
        dot: 'bg-blue-500', label: 'Update'
    },
    SECURITY: {
        badge: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
        dot: 'bg-amber-500', label: 'Security'
    },
    OTHER: {
        badge: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
        dot: 'bg-slate-400', label: 'Other'
    }
};

const getModuleMeta = (module: string): { icon: React.ReactNode; color: string } => {
    const m = (module || '').toLowerCase();
    if (m.includes('user')) return { icon: <User size={13} />, color: 'border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' };
    if (m.includes('asset')) return { icon: <Cpu size={13} />, color: 'border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' };
    if (m.includes('helpdesk') || m.includes('ticket')) return { icon: <Headphones size={13} />, color: 'border bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800' };
    if (m.includes('purchase')) return { icon: <ShoppingCart size={13} />, color: 'border bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' };
    if (m.includes('network')) return { icon: <Network size={13} />, color: 'border bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800' };
    if (m.includes('auth')) return { icon: <LogIn size={13} />, color: 'border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' };
    if (m.includes('credential') || m.includes('security')) return { icon: <Lock size={13} />, color: 'border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' };
    if (m.includes('setting') || m.includes('system')) return { icon: <Settings size={13} />, color: 'border bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' };
    if (m.includes('document') || m.includes('file')) return { icon: <FileText size={13} />, color: 'border bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800' };
    return { icon: <Layers size={13} />, color: 'border bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700' };
};

const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('super')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    if (r.includes('admin')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (r.includes('staff')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';
};

const isFailedStatus = (status?: string) => {
    const s = (status || '').toLowerCase();
    return s === 'failed' || s === 'failure' || s === 'error' || s === 'denied';
};

const shortId = (id: number | string) => `#${String(id).replace(/-/g, '').slice(0, 8).toUpperCase()}`;

const getRelativeTime = (iso: string) => {
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (sec < 60) return 'Baru saja';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} mnt lalu`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} jam lalu`;
    const day = Math.floor(hr / 24);
    if (day === 1) return 'Kemarin';
    if (day < 7) return `${day} hari lalu`;
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const parseUserAgent = (ua?: string) => {
    if (!ua) return null;
    let browser = 'Unknown';
    if (/edg\//i.test(ua)) browser = 'Edge';
    else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
    else if (/chrome\//i.test(ua)) browser = 'Chrome';
    else if (/firefox\//i.test(ua)) browser = 'Firefox';
    else if (/safari\//i.test(ua)) browser = 'Safari';
    let os = 'Unknown';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS';
    else if (/mac os/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    return `${browser} · ${os}`;
};

const mapRow = (l: any): AuditLog => ({
    id: l.id,
    userName: l.user_name || 'System',
    userRole: l.user_role || 'System',
    action: l.action || 'Unknown Action',
    module: l.module || 'System',
    details: l.details || '',
    ipAddress: l.ip_address || '',
    userAgent: l.user_agent || '',
    status: l.status || '',
    createdAt: l.created_at
});

export const AuditLogManager: React.FC<AuditLogManagerProps> = ({ currentUser }) => {
    const { showToast } = useToast();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState('All');
    const [actorFilter, setActorFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
    const [onlyFailed, setOnlyFailed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [isLive, setIsLive] = useState(true);
    const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
    const [showTelemetry, setShowTelemetry] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const knownIdsRef = useRef<Set<string>>(new Set());

    const fetchLogs = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(FETCH_LIMIT);

            if (error) {
                console.error('Supabase error fetching audit logs:', error);
                setLoadError(error.code === '42P01'
                    ? 'Tabel user_activity_logs belum ada di database Supabase.'
                    : `Gagal memuat log audit: ${error.message}`);
                return;
            }

            setLoadError(null);
            const mapped = (data || []).map(mapRow);

            // Tandai baris yang baru muncul sejak fetch sebelumnya (bukan fetch pertama).
            if (knownIdsRef.current.size > 0) {
                const fresh = mapped.filter(l => !knownIdsRef.current.has(String(l.id))).map(l => String(l.id));
                if (fresh.length > 0) {
                    setFreshIds(new Set(fresh));
                    setTimeout(() => setFreshIds(new Set()), 6000);
                }
            }
            knownIdsRef.current = new Set(mapped.map(l => String(l.id)));
            setLogs(mapped);
        } catch (err) {
            console.error('Unexpected error fetching audit logs:', err);
            setLoadError('Terjadi kesalahan tak terduga saat memuat log audit.');
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Realtime lewat Supabase channel; polling sebagai cadangan kalau
    // Realtime belum diaktifkan untuk tabel ini.
    useEffect(() => {
        if (!isLive) return;

        const channel = supabase
            .channel('audit_log_stream')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_activity_logs' }, () => {
                fetchLogs(true);
            })
            .subscribe();

        const timer = window.setInterval(() => fetchLogs(true), POLL_INTERVAL_MS);

        return () => {
            window.clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, [isLive, fetchLogs]);

    useEffect(() => {
        if (!selectedLog) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedLog(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedLog]);

    const availableModules = useMemo(
        () => Array.from(new Set(logs.map(l => l.module).filter(Boolean))).sort(),
        [logs]
    );
    const availableActors = useMemo(
        () => Array.from(new Set(logs.map(l => l.userName).filter(Boolean))).sort(),
        [logs]
    );

    const filteredLogs = useMemo(() => {
        const now = Date.now();
        const windowMs = timeRange === '24H' ? DAY_MS : timeRange === '7D' ? 7 * DAY_MS : timeRange === '30D' ? 30 * DAY_MS : 0;
        const q = searchTerm.trim().toLowerCase();

        return logs.filter(log => {
            if (windowMs && now - new Date(log.createdAt).getTime() > windowMs) return false;
            if (categoryFilter !== 'ALL' && classifyAction(log.action) !== categoryFilter) return false;
            if (moduleFilter !== 'All' && log.module !== moduleFilter) return false;
            if (actorFilter !== 'All' && log.userName !== actorFilter) return false;
            if (onlyFailed && !isFailedStatus(log.status)) return false;
            if (q) {
                const haystack = [
                    String(log.id), log.userName, log.userRole, log.action,
                    log.module, log.details, log.ipAddress
                ].join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [logs, searchTerm, moduleFilter, actorFilter, categoryFilter, timeRange, onlyFailed]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, moduleFilter, actorFilter, categoryFilter, timeRange, onlyFailed, itemsPerPage]);

    const stats = useMemo(() => {
        const now = Date.now();
        const counts: Record<ActionCategory, number> = { CREATE: 0, UPDATE: 0, DELETE: 0, SECURITY: 0, OTHER: 0 };
        let last24h = 0;
        let failed = 0;
        logs.forEach(l => {
            counts[classifyAction(l.action)] += 1;
            if (now - new Date(l.createdAt).getTime() <= DAY_MS) last24h += 1;
            if (isFailedStatus(l.status)) failed += 1;
        });
        return {
            total: logs.length,
            counts,
            last24h,
            failed,
            activeUsers: new Set(logs.map(l => l.userName)).size,
            activeModules: new Set(logs.map(l => l.module)).size
        };
    }, [logs]);

    // Grafik 14 hari memakai tanggal lokal supaya cocok dengan tampilan tabel.
    const timelineData = useMemo(() => {
        const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const map: Record<string, { label: string; total: number; critical: number }> = {};
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            map[toKey(d)] = { label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), total: 0, critical: 0 };
        }
        logs.forEach(l => {
            const bucket = map[toKey(new Date(l.createdAt))];
            if (!bucket) return;
            bucket.total += 1;
            if (classifyAction(l.action) === 'DELETE') bucket.critical += 1;
        });
        return Object.values(map);
    }, [logs]);

    const topOperators = useMemo(() => {
        const acc: Record<string, { count: number; role: string }> = {};
        logs.forEach(l => {
            if (!acc[l.userName]) acc[l.userName] = { count: 0, role: l.userRole };
            acc[l.userName].count += 1;
        });
        return Object.entries(acc)
            .map(([name, v]) => ({ name, ...v }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [logs]);

    const topModules = useMemo(() => {
        const acc: Record<string, number> = {};
        logs.forEach(l => { acc[l.module] = (acc[l.module] || 0) + 1; });
        return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [logs]);

    const copyText = (key: string, text: string, message: string) => {
        navigator.clipboard.writeText(text).then(
            () => {
                setCopiedKey(key);
                setTimeout(() => setCopiedKey(k => (k === key ? null : k)), 1500);
                showToast(message, 'success');
            },
            () => showToast('Gagal menyalin ke clipboard.', 'error')
        );
    };

    const resetFilters = () => {
        setSearchTerm('');
        setModuleFilter('All');
        setActorFilter('All');
        setCategoryFilter('ALL');
        setTimeRange('ALL');
        setOnlyFailed(false);
    };

    const hasActiveFilter = searchTerm !== '' || moduleFilter !== 'All' || actorFilter !== 'All'
        || categoryFilter !== 'ALL' || timeRange !== 'ALL' || onlyFailed;

    const exportToExcel = () => {
        if (filteredLogs.length === 0) {
            showToast('Tidak ada data untuk diexport.', 'error');
            return;
        }
        try {
            const rows = filteredLogs.map(l => ({
                'Event ID': String(l.id),
                'Waktu': new Date(l.createdAt).toLocaleString('id-ID'),
                'Timestamp (ISO)': l.createdAt,
                'User': l.userName,
                'Role': l.userRole,
                'Action': l.action,
                'Kategori': CATEGORY_STYLE[classifyAction(l.action)].label,
                'Modul': l.module,
                'Status': l.status || '',
                'Detail': l.details || '',
                'IP Address': l.ipAddress || '',
                'User Agent': l.userAgent || ''
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [38, 22, 26, 22, 14, 24, 12, 18, 10, 60, 16, 50].map(wch => ({ wch }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
            XLSX.writeFile(wb, `Audit_Trail_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast(`${rows.length} log berhasil diexport ke Excel.`, 'success');
        } catch (err: any) {
            console.error('Export Excel error:', err);
            showToast(`Gagal export Excel: ${err?.message || 'unknown error'}`, 'error');
        }
    };

    const exportToJson = () => {
        if (filteredLogs.length === 0) {
            showToast('Tidak ada data untuk diexport.', 'error');
            return;
        }
        try {
            const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast(`${filteredLogs.length} log berhasil diexport ke JSON.`, 'success');
        } catch (err: any) {
            showToast(`Gagal export JSON: ${err?.message || 'unknown error'}`, 'error');
        }
    };

    const kpiCards = [
        { label: 'Total Event', value: stats.total, hint: `Maks. ${FETCH_LIMIT} terbaru dimuat`, icon: <Shield size={14} />, tone: 'blue' },
        { label: 'Aktivitas 24 Jam', value: stats.last24h, hint: 'Event dalam sehari terakhir', icon: <Clock size={14} />, tone: 'emerald' },
        { label: 'Aksi Delete', value: stats.counts.DELETE, hint: 'Penghapusan data tercatat', icon: <Trash2 size={14} />, tone: 'rose' },
        { label: 'Event Gagal', value: stats.failed, hint: 'Status failed / error / denied', icon: <AlertTriangle size={14} />, tone: 'amber' },
        { label: 'Operator Aktif', value: stats.activeUsers, hint: `${stats.activeModules} modul tersentuh`, icon: <User size={14} />, tone: 'purple' }
    ];
    const toneClass: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    };

    const pills: { key: CategoryFilter; label: string; count: number; icon: React.ReactNode; active: string; idle: string }[] = [
        { key: 'ALL', label: 'Semua', count: stats.total, icon: <Layers size={12} />, active: 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900', idle: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400' },
        { key: 'DELETE', label: 'Delete', count: stats.counts.DELETE, icon: <Trash2 size={12} />, active: 'bg-rose-600 text-white', idle: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' },
        { key: 'CREATE', label: 'Create', count: stats.counts.CREATE, icon: <Sparkles size={12} />, active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
        { key: 'UPDATE', label: 'Update', count: stats.counts.UPDATE, icon: <ArrowRightLeft size={12} />, active: 'bg-blue-600 text-white', idle: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' },
        { key: 'SECURITY', label: 'Security / Auth', count: stats.counts.SECURITY, icon: <Key size={12} />, active: 'bg-amber-600 text-white', idle: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' }
    ];

    const selectClass = 'px-3 py-2 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500/50';
    const selectedCategory = selectedLog ? classifyAction(selectedLog.action) : 'OTHER';

    return (
        <div className="space-y-5 animate-in fade-in duration-200 pb-10">
            <PageHeader
                title="System Tracking Log"
                description="Audit trail aktivitas sistem dengan analitik dan live monitoring"
            >
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsLive(v => !v)}
                        aria-pressed={isLive}
                        title={isLive ? 'Klik untuk jeda live sync' : 'Klik untuk menyalakan live sync'}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${isLive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400'}`}
                    >
                        <span className="relative flex h-2 w-2">
                            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </span>
                        {isLive ? 'Live' : 'Dijeda'}
                    </button>
                    <Button variant="outline" onClick={() => setShowTelemetry(v => !v)} className="text-xs font-semibold">
                        <BarChart3 size={13} className="mr-1.5 text-blue-500" />
                        {showTelemetry ? 'Sembunyikan Analitik' : 'Tampilkan Analitik'}
                    </Button>
                    <Button variant="outline" onClick={exportToExcel} className="text-xs font-semibold" title="Export hasil filter ke Excel">
                        <Download size={13} className="mr-1.5 text-emerald-600" /> Excel
                    </Button>
                    <Button variant="outline" onClick={exportToJson} className="text-xs font-semibold" title="Export hasil filter ke JSON">
                        <Terminal size={13} className="mr-1.5 text-indigo-500" /> JSON
                    </Button>
                    <Button variant="outline" onClick={() => fetchLogs()} disabled={isLoading} className="text-xs font-semibold">
                        <RefreshCcw size={13} className={`mr-1.5 ${isLoading ? 'animate-spin text-blue-500' : 'text-slate-500'}`} />
                        Refresh
                    </Button>
                </div>
            </PageHeader>

            {loadError && (
                <div role="alert" className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                    <div className="text-xs">
                        <p className="font-bold text-rose-700 dark:text-rose-300">Data log tidak bisa dimuat</p>
                        <p className="text-rose-600 dark:text-rose-400 mt-0.5">{loadError}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {kpiCards.map(card => (
                    <div key={card.label} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{card.label}</span>
                            <span className={`p-1.5 rounded-lg ${toneClass[card.tone]}`}>{card.icon}</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tabular-nums">{card.value}</div>
                        <p className="text-[10px] text-slate-400 mt-1">{card.hint}</p>
                    </div>
                ))}
            </div>

            {showTelemetry && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-start justify-between mb-3 gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Frekuensi Aktivitas 14 Hari</h3>
                                <p className="text-xs text-slate-400">Total event harian dan lonjakan aksi delete</p>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-semibold shrink-0">
                                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><span className="h-2 w-2 rounded-full bg-blue-500" />Total</span>
                                <span className="flex items-center gap-1.5 text-rose-500"><span className="h-2 w-2 rounded-full bg-rose-500" />Delete</span>
                            </div>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timelineData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="auditTotalGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="auditDeleteGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#88888822" vertical={false} />
                                    <XAxis dataKey="label" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} interval={1} />
                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 11 }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} fill="url(#auditTotalGrad)" />
                                    <Area type="monotone" dataKey="critical" name="Delete" stroke="#f43f5e" strokeWidth={2} fill="url(#auditDeleteGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Operator Teraktif</h3>
                            <div className="mt-2.5 space-y-1">
                                {topOperators.length === 0 && <p className="text-xs text-slate-400">Belum ada data.</p>}
                                {topOperators.map((op, idx) => (
                                    <button
                                        key={op.name}
                                        type="button"
                                        onClick={() => setActorFilter(op.name)}
                                        className="w-full flex items-center justify-between text-xs text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-lg px-1.5 py-1 transition-colors"
                                        title="Klik untuk filter operator ini"
                                    >
                                        <span className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-zinc-300 shrink-0">{idx + 1}</span>
                                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">{op.name}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0">{op.role}</span>
                                        </span>
                                        <span className="font-mono font-bold text-slate-600 dark:text-zinc-400 tabular-nums">{op.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Modul Terpadat</h3>
                            <div className="mt-2.5 space-y-2">
                                {topModules.map(([name, count]) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => setModuleFilter(name)}
                                        className="w-full text-left group"
                                        title="Klik untuk filter modul ini"
                                    >
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                                            <span>{name}</span>
                                            <span className="tabular-nums">{count}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                                            <div className="h-full rounded-full bg-blue-500 group-hover:bg-blue-600 transition-colors" style={{ width: `${(count / (stats.total || 1)) * 100}%` }} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            aria-label="Cari log audit"
                            placeholder="Cari user, aksi, modul, detail, IP, atau ID event..."
                            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button type="button" aria-label="Hapus pencarian" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select aria-label="Filter modul" className={selectClass} value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                            <option value="All">Semua Modul</option>
                            {availableModules.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select aria-label="Filter operator" className={selectClass} value={actorFilter} onChange={e => setActorFilter(e.target.value)}>
                            <option value="All">Semua Operator</option>
                            {availableActors.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select aria-label="Filter rentang waktu" className={selectClass} value={timeRange} onChange={e => setTimeRange(e.target.value as TimeRange)}>
                            <option value="ALL">Semua Waktu</option>
                            <option value="24H">24 Jam Terakhir</option>
                            <option value="7D">7 Hari Terakhir</option>
                            <option value="30D">30 Hari Terakhir</option>
                        </select>
                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={!hasActiveFilter}
                            title="Reset semua filter"
                            aria-label="Reset semua filter"
                            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all bg-white dark:bg-zinc-800"
                        >
                            <RotateCcw size={15} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    {pills.map(p => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => setCategoryFilter(p.key)}
                            aria-pressed={categoryFilter === p.key}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${categoryFilter === p.key ? `${p.active} shadow-sm` : p.idle}`}
                        >
                            {p.icon} {p.label} <span className="opacity-70 tabular-nums">({p.count})</span>
                        </button>
                    ))}
                    {stats.failed > 0 && (
                        <button
                            type="button"
                            onClick={() => setOnlyFailed(v => !v)}
                            aria-pressed={onlyFailed}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${onlyFailed ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}
                        >
                            <AlertTriangle size={12} /> Gagal saja ({stats.failed})
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-slate-50/70 dark:bg-zinc-800/50 hover:bg-slate-50/70 dark:hover:bg-zinc-800/50">
                                {['Event', 'Waktu', 'Operator', 'Aksi', 'Modul', 'Detail'].map(h => (
                                    <TableHead key={h} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3">{h}</TableHead>
                                ))}
                                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3 text-right pr-5">Inspect</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={7} className="py-20 text-center">
                                    <RefreshCcw className="animate-spin text-blue-500 mx-auto mb-2" size={22} />
                                    <p className="text-xs font-semibold text-slate-500">Memuat log audit...</p>
                                </TableCell></TableRow>
                            ) : paginatedLogs.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-20 text-center">
                                    <Shield className="text-slate-300 dark:text-zinc-600 mx-auto mb-2" size={30} />
                                    <p className="text-xs font-bold text-slate-500">
                                        {logs.length === 0 ? 'Belum ada aktivitas tercatat.' : 'Tidak ada log yang cocok dengan filter.'}
                                    </p>
                                    {hasActiveFilter && (
                                        <button type="button" onClick={resetFilters} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Reset filter</button>
                                    )}
                                </TableCell></TableRow>
                            ) : paginatedLogs.map(log => {
                                const cat = classifyAction(log.action);
                                const style = CATEGORY_STYLE[cat];
                                const mod = getModuleMeta(log.module);
                                const failed = isFailedStatus(log.status);
                                const isFresh = freshIds.has(String(log.id));
                                return (
                                    <TableRow
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className={`group cursor-pointer hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors text-xs ${isFresh ? 'bg-emerald-500/10' : ''}`}
                                    >
                                        <TableCell className="py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`w-1 h-8 rounded-full ${failed ? 'bg-rose-500' : style.dot}`} aria-hidden />
                                                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-zinc-400">{shortId(log.id)}</span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                                    {new Date(log.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                    {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    {' · '}{getRelativeTime(log.createdAt)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center font-bold text-[10px] uppercase border border-slate-200 dark:border-zinc-700 shrink-0">
                                                    {log.userName.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{log.userName}</span>
                                                    <span className={`inline-block px-1.5 text-[9px] font-bold rounded-md uppercase tracking-wider border w-fit mt-0.5 ${getRoleBadge(log.userRole)}`}>{log.userRole}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${style.badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                {log.action}
                                            </span>
                                            {failed && <span className="ml-1.5 text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400">Gagal</span>}
                                        </TableCell>
                                        <TableCell className="py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`p-1 rounded-md ${mod.color}`}>{mod.icon}</span>
                                                <span className="font-semibold text-slate-700 dark:text-zinc-300">{log.module}</span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-2 max-w-md">
                                                {log.details || <span className="text-slate-400 italic">Tanpa rincian tambahan</span>}
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-3 pr-5 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Lihat detail event ${shortId(log.id)}`}
                                                onClick={e => { e.stopPropagation(); setSelectedLog(log); }}
                                                className="h-7 px-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                            >
                                                <Eye size={13} className="mr-1" /> Detail
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <div className="px-5 py-3 bg-slate-50/60 dark:bg-zinc-800/40 border-t border-slate-200/70 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-zinc-400 font-medium">
                        <span>
                            <b>{filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</b> dari <b>{filteredLogs.length}</b> log
                        </span>
                        <label className="flex items-center gap-1.5">
                            <span>Per halaman</span>
                            <select
                                value={itemsPerPage}
                                onChange={e => setItemsPerPage(Number(e.target.value))}
                                className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 font-semibold text-slate-700 dark:text-zinc-200"
                            >
                                {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-600 dark:text-zinc-400 mr-1">Hal. {currentPage} / {totalPages}</span>
                        <button
                            type="button"
                            aria-label="Halaman sebelumnya"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-blue-600 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            type="button"
                            aria-label="Halaman berikutnya"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-600 dark:text-zinc-300 hover:text-blue-600 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {selectedLog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setSelectedLog(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Detail event audit"
                >
                    <div
                        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><Terminal size={18} /></span>
                                <div className="min-w-0">
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Detail Event Audit</h2>
                                    <p className="text-[11px] font-mono text-slate-400 truncate">{String(selectedLog.id)}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Tutup"
                                autoFocus
                                onClick={() => setSelectedLog(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-zinc-700 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                        {selectedLog.userName.substring(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate">{selectedLog.userName}</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getRoleBadge(selectedLog.userRole)}`}>{selectedLog.userRole}</span>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${CATEGORY_STYLE[selectedCategory].badge}`}>{selectedLog.action}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Modul</span>
                                    <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">{getModuleMeta(selectedLog.module).icon}{selectedLog.module}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Waktu</span>
                                    <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-1">{new Date(selectedLog.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Status</span>
                                    <p className={`font-semibold mt-1 ${isFailedStatus(selectedLog.status) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-200'}`}>{selectedLog.status || 'Tidak tercatat'}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Kategori</span>
                                    <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-1">{CATEGORY_STYLE[selectedCategory].label}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"><Globe size={11} />IP Address</span>
                                    <p className="font-mono font-semibold text-slate-800 dark:text-zinc-200 mt-1 break-all">{selectedLog.ipAddress || 'Tidak tercatat'}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"><Monitor size={11} />Perangkat</span>
                                    <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-1">{parseUserAgent(selectedLog.userAgent) || 'Tidak tercatat'}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">Rincian</h4>
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 text-xs leading-relaxed text-slate-800 dark:text-zinc-200 break-words whitespace-pre-wrap">
                                    {selectedLog.details || 'Tidak ada rincian tambahan.'}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">Raw JSON</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyText('json', JSON.stringify(selectedLog, null, 2), 'JSON event disalin.')}
                                        className="h-7 text-xs font-semibold"
                                    >
                                        {copiedKey === 'json' ? <Check size={12} className="text-emerald-500 mr-1" /> : <Copy size={12} className="mr-1" />}
                                        {copiedKey === 'json' ? 'Tersalin' : 'Copy JSON'}
                                    </Button>
                                </div>
                                <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-[11px] font-mono leading-relaxed overflow-x-auto border border-slate-800">
                                    {JSON.stringify(selectedLog, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap justify-between gap-2">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-semibold"
                                    onClick={() => { setActorFilter(selectedLog.userName); setSelectedLog(null); }}
                                >
                                    <User size={12} className="mr-1" /> Semua log user ini
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs font-semibold"
                                    onClick={() => { setModuleFilter(selectedLog.module); setSelectedLog(null); }}
                                >
                                    <Layers size={12} className="mr-1" /> Semua log modul ini
                                </Button>
                            </div>
                            <Button size="sm" className="text-xs font-semibold" onClick={() => setSelectedLog(null)}>Tutup</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
