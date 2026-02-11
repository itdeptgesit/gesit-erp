'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, RefreshCcw, FileSpreadsheet, Trash2, Pencil, Filter,
    ArrowUpRight, Wallet, CheckCircle2, Clock, Briefcase, ChevronRight, BarChart3, Eye, Tag, PieChart, Calendar, Building2
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
import { exportToExcel } from '../lib/excelExport';

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
    const handleExportExcel = () => {
        if (filteredRecords.length === 0) return;

        const dataToExport = filteredRecords.map(r => ({
            "Transaction ID": r.transactionId,
            "Description": r.description,
            "Date": r.purchaseDate || "-",
            "Vendor": r.vendor || "-",
            "Category": r.category || "-",
            "Company": r.company,
            "Department": r.department || "-",
            "User": r.user || "-",
            "Project": r.projectName || "-",
            "Status": r.status,
            "Payment Method": r.paymentMethod || "-",
            "Payment Date": r.paymentDate || "-",
            "Price": r.price,
            "Qty": r.qty,
            "Subtotal": r.subtotal,
            "VAT": r.vat,
            "Delivery": r.deliveryFee,
            "Insurance": r.insurance,
            "App Fee": r.appFee,
            "Other": r.otherCost,
            "Total VA": r.totalVa,
            "Platform": r.platform || "-",
            "Evidence": r.evidenceLink || "-",
            "Remarks": r.remarks || ""
        }));

        exportToExcel(dataToExport, `GESIT-PURCHASE-${new Date().toISOString().split('T')[0]}`);
    };

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


    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header & Financial Health */}
            <div className="space-y-8 mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10 shrink-0">
                            <Wallet size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">Financial <span className="text-blue-600">Control</span></h1>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Enterprise Ledger & Fiscal Audit</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                            <button onClick={() => setYearFilter('2026')} className={`px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${yearFilter === '2026' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}>FY 2026</button>
                            <button onClick={() => setYearFilter('2025')} className={`px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${yearFilter === '2025' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}>FY 2025</button>
                        </div>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                        >
                            <FileSpreadsheet size={16} /> Export Excel
                        </button>
                        <button
                            onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                            className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={16} /> New Entry
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
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search by TR-ID, description, or vendor name..." className="w-full pl-14 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 shrink-0">
                    <select className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 min-w-[140px] cursor-pointer" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                        <option value="All">All Years</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 min-w-[140px] cursor-pointer" value={quarterFilter} onChange={e => setQuarterFilter(e.target.value)}>
                        <option value="All">All Quarters</option>
                        <option value="Q1">Q1 (Jan-Mar)</option>
                        <option value="Q2">Q2 (Apr-Jun)</option>
                        <option value="Q3">Q3 (Jul-Sep)</option>
                        <option value="Q4">Q4 (Oct-Dec)</option>
                    </select>
                    <button onClick={() => setShowDatePicker(!showDatePicker)} className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border transition-all ${showDatePicker ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100'}`}>
                        <Clock size={16} /> Date Range
                    </button>
                </div>
            </div>

            {showDatePicker && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex gap-4 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">Start Date</label>
                        <input type="date" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase text-slate-400 ml-1">End Date</label>
                        <input type="date" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                <StatCard label="Disbursed Funds" value={formatIDR(financialHealth.totalDisbursed)} subValue="Verified & Settled" icon={CheckCircle2} color="emerald" />
                <StatCard
                    label="Liability Exposure"
                    value={formatIDR(financialHealth.liability)}
                    subValue={`${financialHealth.pendingCount} Pending Approval`}
                    icon={Clock}
                    color={financialHealth.riskLevel === 'High' ? 'rose' : financialHealth.riskLevel === 'Medium' ? 'amber' : 'blue'}
                />
                <StatCard
                    label="Budget Efficiency"
                    value={`${Math.min(100, Math.round((financialHealth.totalDisbursed / (financialHealth.totalDisbursed * 1.25 || 1)) * 100))}%`}
                    subValue="Utilization Rate"
                    icon={PieChart}
                    color="violet"
                />
                <StatCard label="Fiscal Volume" value={formatIDR(financialHealth.fiscalVolume)} subValue="Gross Transaction Value" icon={Wallet} color="indigo" />
            </div>

            {/* Optimized Layout: Fiscal Trend & Breakdown Grid */}
            <div className="flex flex-col gap-6">
                {/* Row 3.1: Main Chart Full Width but Slimmer */}
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-inner">
                                <BarChart3 size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white tracking-tight text-sm leading-none">Fiscal Trend</h3>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Audit volume track</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[160px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(val)} />
                                <Tooltip
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', padding: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                                    itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    formatter={(val: number) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val), 'AUDIT VALUE']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={4} />
                                <Bar dataKey="total" barSize={30} radius={[6, 6, 0, 0]} fill="#3b82f6" opacity={0.1} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Row 3.2: 3-Column Bento Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    {/* Top Vendors - Now integrated in bottom tier */}
                    <TopVendorsWidget vendors={vendorData} />

                    {/* Department Allocation */}
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Briefcase size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-xs leading-none">Departmental</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Utilization track</p>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            {deptData.length === 0 ? (
                                <p className="text-center py-5 text-slate-300 text-[11px] font-bold uppercase tracking-widest">No data</p>
                            ) : deptData.slice(0, 5).map((dept, idx) => (
                                <div key={dept.name} className="space-y-1">
                                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1 h-1 rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <span className="text-slate-500 truncate max-w-[120px]">{dept.name}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-slate-900 dark:text-slate-300">{formatIDR(dept.total)}</span>
                                            <span className="text-emerald-500 text-[11px] w-6">{dept.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${dept.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Tag size={16} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-xs leading-none">Classified</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cost breakdown</p>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            {categoryData.length === 0 ? (
                                <p className="text-center py-5 text-slate-300 text-[11px] font-bold uppercase tracking-widest">No data</p>
                            ) : categoryData.slice(0, 5).map((cat, idx) => (
                                <div key={cat.name} className="space-y-1">
                                    <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1 h-1 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                            <span className="text-slate-500 truncate max-w-[120px]">{cat.name}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-slate-900 dark:text-slate-300">{formatIDR(cat.total)}</span>
                                            <span className="text-indigo-500 text-[11px] w-6">{cat.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
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
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">General Transaction Ledger</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[11px] font-bold text-slate-500">{filteredRecords.length} Records Found</span>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-5">Audit Identity</th>
                                <th className="px-8 py-5">Item & Procurement Details</th>
                                <th className="px-8 py-5 text-right">Fiscal Value</th>
                                <th className="px-8 py-5">Corporate entity</th>
                                <th className="px-8 py-5">Ledger Status</th>
                                <th className="px-8 py-5 text-center">Audit Docs</th>
                                <th className="px-8 py-5 text-center">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={7} className="py-24 text-center"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={32} /></td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan={7} className="py-32 text-center text-slate-300 dark:text-slate-700 font-black uppercase tracking-[0.3em] text-sm">Empty Ledger • No Data Available</td></tr>
                            ) : paginatedRecords.map(record => (
                                <tr key={record.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-all group border-b border-transparent">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30 w-fit tracking-tighter shadow-sm">{record.transactionId}</span>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                                                <Calendar size={12} className="opacity-50" />
                                                {record.purchaseDate}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1 max-w-sm">
                                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight leading-tight truncate-2-lines group-hover:text-blue-600 transition-colors">{record.description}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{record.vendor}</span>
                                                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">{record.paymentMethod || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="font-mono font-black text-sm text-slate-900 dark:text-slate-100 tracking-tighter">Rp {new Intl.NumberFormat('id-ID').format(record.subtotal)}</p>
                                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Gross total</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">{record.company}</p>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase">
                                                <Building2 size={10} className="text-blue-500 opacity-60" />
                                                {record.department}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] border inline-flex items-center gap-2 shadow-sm ${record.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/40' :
                                            record.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/40' :
                                                'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/40'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'Paid' ? 'bg-emerald-500' : record.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                            {record.status}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex justify-center">
                                            {Object.values(record.docs).filter(v => v).length > 0 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[11px] font-black shadow-sm shadow-emerald-500/20">
                                                        {Object.values(record.docs).filter(v => v).length}/7
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Verified</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 opacity-40">
                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[11px] font-black">0/7</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Missing Docs</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                            <button onClick={() => { setSelectedDetail(record); setIsDetailOpen(true); }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm" title="View Detail"><Eye size={16} /></button>
                                            <button onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-amber-600 hover:border-amber-200 dark:hover:border-amber-800 transition-all shadow-sm"><Pencil size={16} /></button>
                                            <button onClick={() => setDeleteRecord(record)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800 transition-all shadow-sm"><Trash2 size={16} /></button>
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
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="text-slate-900 dark:text-slate-200">{filteredRecords.length}</span> entries
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
                                            className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${currentPage === page
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
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
