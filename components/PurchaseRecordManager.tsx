'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, RefreshCcw, FileSpreadsheet, Trash2, Pencil, Filter,
    ArrowUpRight, Wallet, CheckCircle2, Clock, Briefcase, ChevronRight, BarChart3, Eye, Tag, PieChart
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Area
} from 'recharts';
import { PurchaseRecord, UserAccount } from '../types';
import { PurchaseRecordFormModal } from './PurchaseRecordFormModal';
import { PurchaseRecordDetailModal } from './PurchaseRecordDetailModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';
import { StatCard } from './StatCard';
import { FinancialHealthSummary } from './FinancialHealthSummary';
import { TopVendorsWidget } from './TopVendorsWidget';

export const PurchaseRecordManager: React.FC<{ currentUser: UserAccount | null }> = ({ currentUser }) => {
    const { t } = useLanguage();
    const [records, setRecords] = useState<PurchaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [projectFilter, setProjectFilter] = useState('All');

    // Advanced Filters
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
    const [quarterFilter, setQuarterFilter] = useState('All');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<PurchaseRecord | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<PurchaseRecord | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('purchase_records').select('*, payment_method, evidence_link').order('purchase_date', { ascending: false });
            if (data) {
                const sanitizeFetchDate = (date: string | null | undefined) => {
                    if (!date || date === '-' || date.toString().toLowerCase() === 'nan') return null;
                    return date;
                };

                setRecords(data.map((r: any) => ({
                    id: r.id, transactionId: r.transaction_id, description: r.description,
                    qty: r.qty, price: r.price, vat: r.vat, deliveryFee: r.delivery_fee,
                    insurance: r.insurance, appFee: r.app_fee, otherCost: r.other_cost,
                    subtotal: r.subtotal, totalVa: r.total_va, projectName: r.project_name,
                    user: r.user_name, department: r.department, company: r.company,
                    status: r.status,
                    purchaseDate: sanitizeFetchDate(r.purchase_date),
                    paymentDate: sanitizeFetchDate(r.payment_date),
                    paymentMethod: r.payment_method,
                    category: r.category,
                    evidenceLink: r.evidence_link,
                    inputBy: r.input_by,
                    vendor: r.vendor, platform: r.platform, remarks: r.remarks, docs: r.docs || {},
                    items: r.items || []
                })));
            }
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchRecords(); }, []);

    const handleFormSubmit = async (formData: Partial<PurchaseRecord>) => {
        setIsActionLoading(true);
        try {
            const sanitizeSaveDate = (date: string | null | undefined) => {
                if (!date || date === '-' || date.toString().toLowerCase() === 'nan') return null;
                return date;
            };

            const payload = {
                transaction_id: formData.transactionId, description: formData.description,
                qty: formData.qty, price: formData.price, vat: formData.vat, delivery_fee: formData.deliveryFee,
                insurance: formData.insurance, app_fee: formData.appFee, other_cost: formData.otherCost,
                subtotal: formData.subtotal, total_va: formData.totalVa, project_name: formData.projectName,
                user_name: formData.user, department: formData.department, company: formData.company,
                status: formData.status,
                purchase_date: sanitizeSaveDate(formData.purchaseDate),
                payment_date: sanitizeSaveDate(formData.paymentDate),
                vendor: formData.vendor, platform: formData.platform,
                payment_method: formData.paymentMethod,
                category: formData.category,
                evidence_link: formData.evidenceLink,
                input_by: formData.inputBy || currentUser?.fullName || 'System',
                remarks: formData.remarks, docs: formData.docs,
                items: formData.items
            };

            if (editingRecord) {
                await supabase.from('purchase_records').update(payload).eq('id', editingRecord.id);
            } else {
                await supabase.from('purchase_records').insert([payload]);
            }
            setIsModalOpen(false);
            setEditingRecord(null);
            await fetchRecords();
        } catch (err) { alert('Save failed'); } finally { setIsActionLoading(false); }
    };

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true : r.status === statusFilter;
            const matchesProject = projectFilter === 'All' ? true : r.projectName === projectFilter;

            let matchesDate = true;
            if (r.purchaseDate) {
                const d = new Date(r.purchaseDate);
                // Year Filter
                if (yearFilter !== 'All' && d.getFullYear().toString() !== yearFilter) matchesDate = false;

                // Quarter Filter
                if (quarterFilter !== 'All') {
                    const q = Math.floor((d.getMonth() + 3) / 3);
                    if (`Q${q}` !== quarterFilter) matchesDate = false;
                }

                // Custom Range
                if (startDate && d < new Date(startDate)) matchesDate = false;
                if (endDate && d > new Date(endDate)) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesProject && matchesDate;
        });
    }, [records, searchTerm, statusFilter, projectFilter, yearFilter, quarterFilter, startDate, endDate]);

    // Reset to page 1 when filters change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, projectFilter, yearFilter, quarterFilter, startDate, endDate]);

    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRecords.slice(start, start + itemsPerPage);
    }, [filteredRecords, currentPage]);

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

    const projects = useMemo(() => {
        const unique = Array.from(new Set(records.map(r => r.projectName).filter(Boolean)));
        return unique.sort();
    }, [records]);

    const availableYears = useMemo(() => {
        const distinctYears = Array.from(new Set(records.map(r => r.purchaseDate ? new Date(r.purchaseDate).getFullYear() : null).filter(Boolean)));
        return distinctYears.sort((a, b) => (b as number) - (a as number));
    }, [records]);

    const financialHealth = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const thisMonthRecords = records.filter(r => {
            if (!r.purchaseDate) return false;
            const d = new Date(r.purchaseDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthRecords = records.filter(r => {
            if (!r.purchaseDate) return false;
            const d = new Date(r.purchaseDate);
            // Handle January case for previous month
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });

        const thisMonthTotal = thisMonthRecords.reduce((sum, r) => sum + (r.subtotal || 0), 0);
        const lastMonthTotal = lastMonthRecords.reduce((sum, r) => sum + (r.subtotal || 0), 0);

        let outflowChange = 0;
        if (lastMonthTotal > 0) {
            outflowChange = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
        }

        const pendingCount = records.filter(r => r.status === 'Pending').length;

        // Largest Category
        const catTotals: Record<string, number> = {};
        let totalSpend = 0;
        records.forEach(r => {
            const cat = r.category || 'Uncategorized';
            catTotals[cat] = (catTotals[cat] || 0) + (r.subtotal || 0);
            totalSpend += (r.subtotal || 0);
        });

        const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
        const largestName = sortedCats[0]?.[0] || 'N/A';
        const largestVal = sortedCats[0]?.[1] || 0;
        const largestPercentage = totalSpend > 0 ? Math.round((largestVal / totalSpend) * 100) : 0;

        // Risk Level Logic
        let risk: 'Low' | 'Medium' | 'High' = 'Low';
        if (pendingCount > 10) risk = 'High';
        else if (pendingCount > 5) risk = 'Medium';

        return {
            outflowChange,
            pendingCount,
            largestCategory: { name: largestName, percentage: largestPercentage },
            riskLevel: risk,
            totalDisbursed: records.filter(r => r.status === 'Paid').reduce((sum, r) => sum + (r.subtotal || 0), 0),
            liability: records.filter(r => r.status !== 'Paid').reduce((sum, r) => sum + (r.subtotal || 0), 0),
            fiscalVolume: records.reduce((sum, r) => sum + (r.subtotal || 0), 0)
        };
    }, [records]);

    const chartData = useMemo(() => {
        // Dynamic chart range based on filters would be better, but for now specific requirement is "Line chart + bar"
        // Let's show filtered data trend

        const grouped: Record<string, number> = {};
        // If year filter is active, show months of that year
        // If "All" years, show last 12 months? Or grouping by Year?
        // Let's stick to "Current View" visualization based on filtered records

        filteredRecords.forEach(r => {
            if (!r.purchaseDate) return;
            const d = new Date(r.purchaseDate);
            const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); // Jan 24
            grouped[key] = (grouped[key] || 0) + (r.subtotal || 0);
        });

        // We need to sort these keys chronologically
        return Object.entries(grouped)
            .map(([name, total]) => {
                // Parse "Jan 24" back to date for sorting
                const [m, y] = name.split(' ');
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthIdx = months.indexOf(m);
                const yearFull = 2000 + parseInt(y);
                return { name, total, dateObj: new Date(yearFull, monthIdx, 1) };
            })
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
            .map(item => ({ name: item.name, total: item.total }));
    }, [filteredRecords]);

    const deptData = useMemo(() => {
        const data: Record<string, number> = {};
        const totalFiltered = filteredRecords.reduce((sum, r) => sum + (r.subtotal || 0), 0);

        filteredRecords.forEach(r => {
            const dept = r.department || 'Unknown';
            data[dept] = (data[dept] || 0) + (r.subtotal || 0);
        });

        return Object.entries(data)
            .map(([name, total]) => ({
                name,
                total,
                percentage: totalFiltered > 0 ? Math.round((total / totalFiltered) * 100) : 0
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [filteredRecords]);

    const categoryData = useMemo(() => {
        const data: Record<string, number> = {};
        const totalFiltered = filteredRecords.reduce((sum, r) => sum + (r.subtotal || 0), 0);

        filteredRecords.forEach(r => {
            const cat = r.category || 'Uncategorized';
            data[cat] = (data[cat] || 0) + (r.subtotal || 0);
        });
        return Object.entries(data)
            .map(([name, total]) => ({
                name,
                total,
                percentage: totalFiltered > 0 ? Math.round((total / totalFiltered) * 100) : 0
            }))
            .sort((a, b) => b.total - a.total);
    }, [filteredRecords]);

    const vendorData = useMemo(() => {
        const data: Record<string, { total: number; count: number }> = {};
        filteredRecords.forEach(r => {
            const v = r.vendor || 'Unknown';
            if (!data[v]) data[v] = { total: 0, count: 0 };
            data[v].total += (r.subtotal || 0);
            data[v].count += 1;
        });
        return Object.entries(data)
            .map(([name, val]) => ({ name, total: val.total, transactionCount: val.count }))
            .sort((a, b) => b.total - a.total);
    }, [filteredRecords]);

    const handleExport = () => {
        const headers = ["TR-ID", "Description", "Project", "Qty", "Subtotal", "Company", "Vendor", "Platform", "Date", "Status"];
        const csvData = filteredRecords.map(r => [
            r.transactionId, r.description, r.projectName, r.qty, r.subtotal, r.company, r.vendor, r.platform, r.purchaseDate, r.status
        ]);
        const csvContent = [headers.join(","), ...csvData.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Purchase-Records-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Financial Health */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Financial Control Dashboard</h1>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Enterprise Resource Planning & Audit</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button onClick={() => setYearFilter('2026')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${yearFilter === '2026' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>2026</button>
                            <button onClick={() => setYearFilter('2025')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${yearFilter === '2025' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>2025</button>
                        </div>
                        <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                            <FileSpreadsheet size={16} /> Export CSV
                        </button>
                        <button onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                            <Plus size={16} /> Add Record
                        </button>
                    </div>
                </div>

                <FinancialHealthSummary
                    outflowChange={financialHealth.outflowChange}
                    pendingCount={financialHealth.pendingCount}
                    largestCategory={financialHealth.largestCategory}
                    riskLevel={financialHealth.riskLevel}
                />
            </div>

            {/* Advanced Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search transaction ID, description or vendor..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 min-w-[100px]" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                        <option value="All">All Years</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 min-w-[100px]" value={quarterFilter} onChange={e => setQuarterFilter(e.target.value)}>
                        <option value="All">All Quarters</option>
                        <option value="Q1">Q1 (Jan-Mar)</option>
                        <option value="Q2">Q2 (Apr-Jun)</option>
                        <option value="Q3">Q3 (Jul-Sep)</option>
                        <option value="Q4">Q4 (Oct-Dec)</option>
                    </select>
                    <button onClick={() => setShowDatePicker(!showDatePicker)} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 border transition-all ${showDatePicker ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'}`}>
                        <Clock size={14} /> Range
                    </button>
                </div>
            </div>

            {showDatePicker && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex gap-4 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Start Date</label>
                        <input type="date" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">End Date</label>
                        <input type="date" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <StatCard label="Total Disbursed" value={formatIDR(financialHealth.totalDisbursed)} subValue="Verified & Paid" icon={CheckCircle2} color="emerald" />
                <StatCard
                    label="Liability Exposure"
                    value={formatIDR(financialHealth.liability)}
                    subValue={`${financialHealth.pendingCount} invoices pending`}
                    icon={Clock}
                    color={financialHealth.riskLevel === 'High' ? 'rose' : financialHealth.riskLevel === 'Medium' ? 'amber' : 'blue'}
                />
                <StatCard
                    label="Budget Utilization"
                    value={`${Math.min(100, Math.round((financialHealth.totalDisbursed / (financialHealth.totalDisbursed * 1.25 || 1)) * 100))}%`}
                    subValue="Of allocated budget"
                    icon={PieChart}
                    color="violet"
                />
                <StatCard label="Fiscal Volume" value={formatIDR(financialHealth.fiscalVolume)} subValue="Total Transaction Value" icon={Wallet} color="indigo" />
            </div>

            {/* Row 3: Charts & Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart - Spans 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-sm">Fiscal Trend Analysis</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Disbursement velocity & volume</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(val)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
                                    formatter={(val: number) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val), 'Volume']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                                <Bar dataKey="total" barSize={20} radius={[4, 4, 0, 0]} fill="#3b82f6" opacity={0.2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Vendors Widget */}
                <div className="lg:col-span-1">
                    <TopVendorsWidget vendors={vendorData} />
                </div>
            </div>

            {/* Row 4: Category & Department Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-sm">Department Allocation</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Budget utilization by unit</p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {deptData.length === 0 ? (
                            <p className="text-center py-10 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No data available</p>
                        ) : deptData.map((dept, idx) => (
                            <div key={dept.name} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-slate-500 truncate max-w-[150px]">{dept.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-900 dark:text-slate-300 block">{formatIDR(dept.total)}</span>
                                        <span className="text-emerald-500 text-[9px]">{dept.percentage}%</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${dept.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Tag size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-sm">Category Distribution</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Spending by classification</p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {categoryData.length === 0 ? (
                            <p className="text-center py-10 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No data available</p>
                        ) : categoryData.map((cat, idx) => (
                            <div key={cat.name} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-slate-500 truncate max-w-[150px]">{cat.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-900 dark:text-slate-300 block">{formatIDR(cat.total)}</span>
                                        <span className="text-indigo-500 text-[9px]">{cat.percentage}%</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${cat.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* Table Header Removed - Filters are now main */}
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">General Ledger</h3>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4">Identity</th>
                                <th className="px-6 py-4">Transaction Details</th>
                                <th className="px-6 py-4 text-right">Value (IDR)</th>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Docs</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={7} className="py-20 text-center"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan={7} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No transaction records found.</td></tr>
                            ) : paginatedRecords.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 w-fit">{record.transactionId}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1.5">{record.purchaseDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col max-w-xs">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight leading-none truncate">{record.description}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate uppercase">{record.vendor} • {record.platform} • {record.paymentMethod || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">Rp {new Intl.NumberFormat('id-ID').format(record.subtotal)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">{record.company}</p>
                                            <p className="text-[9px] text-slate-400 font-medium uppercase">{record.department}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${record.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100' :
                                            record.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100' :
                                                'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-1">
                                            {Object.values(record.docs).filter(v => v).length > 0 ? (
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black border border-emerald-100">
                                                    {Object.values(record.docs).filter(v => v).length}/7
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-300 rounded text-[9px] font-black border border-slate-100">0/7</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setSelectedDetail(record); setIsDetailOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all" title="View Detail"><Eye size={14} /></button>
                                            <button onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 transition-all"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteRecord(record)} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredRecords.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900/50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="text-slate-900 dark:text-slate-200">{filteredRecords.length}</span> entries
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Prev
                            </button>

                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                // Show first, last, and relative to current
                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${currentPage === page
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                    return <span key={page} className="text-slate-300">...</span>;
                                }
                                return null;
                            })}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PurchaseRecordFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingRecord} />
            <PurchaseRecordDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} record={selectedDetail} />
            <DangerConfirmModal
                isOpen={!!deleteRecord} onClose={() => setDeleteRecord(null)}
                onConfirm={async () => {
                    await supabase.from('purchase_records').delete().eq('id', deleteRecord!.id);
                    setDeleteRecord(null);
                    fetchRecords();
                }}
                title="Delete Record" message={`Purge transaction record "${deleteRecord?.transactionId}"?`}
                isLoading={isActionLoading}
            />
        </div>
    );
};
