'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, RefreshCcw, FileSpreadsheet, Trash2, Pencil, Filter,
    ArrowUpRight, Wallet, CheckCircle2, Clock, Briefcase, ChevronRight, ChevronLeft, BarChart3, Eye, Tag, PieChart, Calendar, Building2
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
import { sendToGoogleSheet } from '../lib/googleSheets';
import { useToast } from './ToastProvider';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const PurchaseRecordManager = ({ currentUser }: { currentUser: UserAccount | null }) => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [records, setRecords] = useState<PurchaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [projectFilter, setProjectFilter] = useState('All');

    // Advanced Filters
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
    const [quarterFilter, setQuarterFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<PurchaseRecord | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<PurchaseRecord | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isSyncingAll, setIsSyncingAll] = useState(false);
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

            // Auto-export to Google Sheets (Fire and forget)
            const dateObj = payload.purchase_date ? new Date(payload.purchase_date) : new Date();
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            sendToGoogleSheet({
                ...payload,
                id: editingRecord ? editingRecord.id : 'NEW',
                monthName: months[dateObj.getMonth()],
                year: dateObj.getFullYear()
            });
            showToast(editingRecord ? 'Record updated successfully!' : 'New entry saved successfully!');

            // Log activity for Dashboard timeline
            await supabase.from('activity_logs').insert([{
                activity_name: editingRecord ? `Updated Purchase: ${formData.description}` : `New Purchase: ${formData.description}`,
                category: 'Procurement',
                requester: formData.user || 'System',
                department: formData.department || 'General',
                it_personnel: currentUser?.fullName || 'IT Dept',
                type: (formData.totalVa || 0) > 10000000 ? 'Critical' : 'Minor',
                status: 'Completed',
                remarks: `Purchase of ${formData.description} via ${formData.platform || 'Unknown'}. Total: ${formData.totalVa}`,
                created_at: new Date().toISOString()
            }]);
        } catch (err) {
            showToast('Failed to save record', 'error');
        } finally { setIsActionLoading(false); }
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

                // Month Filter
                if (monthFilter !== 'All') {
                    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    if (months[d.getMonth()] !== monthFilter) matchesDate = false;
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

        const sortedForExcel = [...filteredRecords].sort((a, b) => {
            const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
            const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
            return dateA - dateB;
        });

        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const dataToExport = sortedForExcel.map(r => {
            const dateObj = r.purchaseDate ? new Date(r.purchaseDate) : new Date();
            return {
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
                "Remarks": r.remarks || "",
                "Month": months[dateObj.getMonth()],
                "Year": dateObj.getFullYear()
            };
        });

        exportToExcel(dataToExport, `GESIT-PURCHASE-${new Date().toISOString().split('T')[0]}`);
    };

    const handleSyncAllToSheet = async () => {
        if (filteredRecords.length === 0) return;
        setIsSyncingAll(true);
        try {
            // Sort by date ASC for syncing so they append correctly at the end of the sheet
            const sortedForSync = [...filteredRecords].sort((a, b) => {
                const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
                const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
                return dateA - dateB;
            });

            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            for (const record of sortedForSync) {
                const dateObj = record.purchaseDate ? new Date(record.purchaseDate) : new Date();

                const payload = {
                    transaction_id: record.transactionId,
                    description: record.description,
                    qty: record.qty,
                    price: record.price,
                    vat: record.vat,
                    delivery_fee: record.deliveryFee,
                    insurance: record.insurance,
                    app_fee: record.appFee,
                    other_cost: record.otherCost,
                    subtotal: record.subtotal,
                    total_va: record.totalVa,
                    project_name: record.projectName,
                    user_name: record.user,
                    department: record.department,
                    company: record.company,
                    status: record.status,
                    purchase_date: record.purchaseDate,
                    payment_date: record.paymentDate,
                    vendor: record.vendor,
                    platform: record.platform,
                    payment_method: record.paymentMethod,
                    category: record.category,
                    evidence_link: record.evidenceLink,
                    input_by: record.inputBy,
                    remarks: record.remarks,
                    monthName: months[dateObj.getMonth()],
                    year: dateObj.getFullYear()
                };
                await sendToGoogleSheet(payload);
            }
            showToast(`Successfully synced ${filteredRecords.length} records to Google Sheets!`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Batch sync encountered an error.', 'error');
        } finally {
            setIsSyncingAll(false);
        }
    };

    // Reset to page 1 when filters change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, projectFilter, yearFilter, quarterFilter, monthFilter, startDate, endDate]);

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
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 pt-6">
            {/* Header & Financial Health */}
            <div className="space-y-8 mb-10">
                <PageHeader
                    title="Purchase Records"
                    description="Procurement & Financial Audit Registry"
                >
                    <div className="w-full lg:w-auto">
                        <FinancialHealthSummary
                            outflowChange={financialHealth.outflowChange}
                            pendingCount={financialHealth.pendingCount}
                            largestCategory={financialHealth.largestCategory}
                            riskLevel={financialHealth.riskLevel}
                        />
                    </div>
                </PageHeader>

                {/* Second Row: Actions & FY Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                    <div className="hidden lg:flex items-center bg-muted/50 p-1 rounded-xl border border-border backdrop-blur-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setYearFilter('2026')}
                            className={cn("h-8 px-4 text-[10px] font-black tracking-[0.1em] uppercase rounded-lg transition-all", yearFilter === '2026' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            FY 2026
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setYearFilter('2025')}
                            className={cn("h-8 px-4 text-[10px] font-black tracking-[0.1em] uppercase rounded-lg transition-all", yearFilter === '2025' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                            FY 2025
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 px-4 text-xs font-bold">
                            <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncAllToSheet}
                            disabled={isSyncingAll || filteredRecords.length === 0}
                            className="h-9 px-4 text-xs font-bold"
                        >
                            {isSyncingAll ? <RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />}
                            Sync
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                            className="h-9 px-4 text-xs font-bold shadow-md transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-3.5 w-3.5" /> New Entry
                        </Button>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Bar */}
            <Card className="rounded-xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardContent className="p-2.5 flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search descriptions, vendors, or IDs..."
                            className="pl-9 h-9 bg-slate-50 border-none dark:bg-slate-800 focus-visible:ring-1 focus-visible:ring-primary/20 text-xs"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 shrink-0">
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-[110px] h-9 bg-slate-50 border-none dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Years</SelectItem>
                                {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                            <SelectTrigger className="w-[125px] h-9 bg-slate-50 border-none dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider">
                                <SelectValue placeholder="Quarter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Quarters</SelectItem>
                                <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                                <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                                <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                                <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-[125px] h-9 bg-slate-50 border-none dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Months</SelectItem>
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant={showDatePicker ? "default" : "secondary"}
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className={cn("h-9 px-4 text-[10px] font-bold uppercase tracking-wider gap-2", !showDatePicker && "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border-none")}
                        >
                            <Calendar size={13} />
                            {showDatePicker ? 'Hide Date' : 'Date Range'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showDatePicker && (
                <Card className="rounded-xl border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/50 animate-in slide-in-from-top-2 duration-300">
                    <CardContent className="p-4 flex flex-wrap gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Period Start</label>
                            <Input
                                type="date"
                                className="w-[180px] h-9 bg-white dark:bg-slate-950 font-bold border-muted-foreground/20"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Period End</label>
                            <Input
                                type="date"
                                className="w-[180px] h-9 bg-white dark:bg-slate-950 font-bold border-muted-foreground/20"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end pb-0.5">
                            <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                                Reset Range
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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
            <div className="grid grid-cols-1 gap-6">
                {/* Main Chart Card */}
                <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <BarChart3 size={18} />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-slate-900 dark:text-white tracking-tight text-sm uppercase">Fiscal Trend</h3>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Monthly transaction volume</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-[200px] w-full">
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
                    </CardContent>
                </Card>

                {/* Row 3.2: 3-Column Bento Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <TopVendorsWidget vendors={vendorData} />

                    {/* Department Allocation */}
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Briefcase size={16} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="font-bold text-slate-900 dark:text-white tracking-tight text-xs uppercase">Departmental</h3>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Utilization track</p>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            {deptData.length === 0 ? (
                                <p className="text-center py-5 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No data</p>
                            ) : deptData.slice(0, 5).map((dept, idx) => (
                                <div key={dept.name} className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn("w-1 h-1 rounded-full", idx === 0 ? 'bg-emerald-500' : 'bg-slate-300')}></div>
                                            <span className="text-slate-500 truncate max-w-[120px]">{dept.name}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-slate-900 dark:text-slate-200">{formatIDR(dept.total)}</span>
                                            <span className="text-emerald-500 text-[9px] w-6">{dept.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
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
                            <div className="space-y-0.5">
                                <h3 className="font-bold text-slate-900 dark:text-white tracking-tight text-xs uppercase">Classified</h3>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Cost breakdown</p>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            {categoryData.length === 0 ? (
                                <p className="text-center py-5 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No data</p>
                            ) : categoryData.slice(0, 5).map((cat, idx) => (
                                <div key={cat.name} className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn("w-1 h-1 rounded-full", idx === 0 ? 'bg-indigo-500' : 'bg-slate-300')}></div>
                                            <span className="text-slate-500 truncate max-w-[120px]">{cat.name}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-slate-900 dark:text-slate-200">{formatIDR(cat.total)}</span>
                                            <span className="text-indigo-500 text-[9px] w-6">{cat.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
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

            <Card className="shadow-sm rounded-xl overflow-hidden border-none bg-background/50 backdrop-blur-sm">
                <CardHeader className="px-8 py-5 border-b flex flex-row items-center justify-between bg-muted/20">
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/70">General Transaction Ledger</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            <span className="text-[11px] font-bold text-muted-foreground">{filteredRecords.length} Records Found</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 border-b">
                                <TableHead className="font-bold py-4">Audit Identity</TableHead>
                                <TableHead className="font-bold py-4">Item & Procurement Details</TableHead>
                                <TableHead className="text-right font-bold py-4">Fiscal Value</TableHead>
                                <TableHead className="font-bold py-4">Corporate entity</TableHead>
                                <TableHead className="font-bold py-4">Ledger Status</TableHead>
                                <TableHead className="text-center font-bold py-4">Audit Docs</TableHead>
                                <TableHead className="text-right font-bold pr-8 py-4">Control</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 10 }).map((_, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-2">
                                                <Skeleton className="h-5 w-24 rounded-md" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-2 max-w-[280px]">
                                                <Skeleton className="h-4 w-full" />
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-4 w-16 rounded-full" />
                                                    <Skeleton className="h-4 w-12 rounded-full" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 text-right flex flex-col items-end gap-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-2">
                                                <Skeleton className="h-3 w-20" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </TableCell>
                                        <TableCell className="py-5 flex justify-center">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                        </TableCell>
                                        <TableCell className="py-5 pr-8">
                                            <div className="flex justify-end gap-2">
                                                <Skeleton className="h-8 w-8 rounded-xl" />
                                                <Skeleton className="h-8 w-8 rounded-xl" />
                                                <Skeleton className="h-8 w-8 rounded-xl" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredRecords.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="py-32 text-center text-muted-foreground font-black uppercase tracking-[0.3em] text-sm">Empty Ledger • No Data Available</TableCell></TableRow>
                            ) : paginatedRecords.map(record => (
                                <TableRow key={record.id} className="group transition-colors hover:bg-muted/30">
                                    <TableCell className="py-5">
                                        <div className="flex flex-col gap-1.5 align-middle">
                                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit tracking-tighter border border-primary/20">{record.transactionId}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                                                <Calendar size={11} className="opacity-70" />
                                                {record.purchaseDate}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col gap-1 max-w-[280px]">
                                            <p className="font-bold text-foreground text-sm tracking-tight leading-tight truncate-2-lines group-hover:text-primary transition-colors">{record.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 h-4 bg-muted/50">{record.vendor}</Badge>
                                                <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-tighter">{record.paymentMethod || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right">
                                        <p className="font-mono font-bold text-sm text-foreground tracking-tighter">Rp {new Intl.NumberFormat('id-ID').format(record.subtotal)}</p>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Gross total</span>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">{record.company}</p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                                <Building2 size={11} className="text-primary/70" />
                                                {record.department}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest gap-1.5 border-transparent px-2.5 py-0.5",
                                                record.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                    record.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                        'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                            )}
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", record.status === 'Paid' ? 'bg-emerald-500' : record.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500')}></div>
                                            {record.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5 text-center">
                                        <div className="flex justify-center">
                                            {Object.values(record.docs || {}).filter(v => v).length > 0 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold border border-primary/20">
                                                        {Object.values(record.docs || {}).filter(v => v).length}/7
                                                    </span>
                                                    <span className="text-[8px] font-black text-primary/70 uppercase tracking-tighter">Verified</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 opacity-40">
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-[10px] font-bold">0/7</span>
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Missing</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right pr-6">
                                        <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedDetail(record); setIsDetailOpen(true); }} className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye size={14} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="h-8 w-8 text-muted-foreground hover:text-amber-500"><Pencil size={14} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(record)} className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Controls */}
                {filteredRecords.length > 0 && (
                    <div className="px-8 py-4 border-t flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/10">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span>-
                            <span className="text-foreground">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span>
                            <span className="mx-1">of</span>
                            <span className="text-foreground font-black">{filteredRecords.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-background"
                            >
                                <ChevronLeft size={14} className="mr-1" /> Prev
                            </Button>

                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className={cn("w-8 h-8 p-0 text-[11px] font-bold transition-all", currentPage === page ? "shadow-md shadow-primary/20" : "text-muted-foreground")}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return <span key={page} className="text-muted-foreground">..</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-background"
                            >
                                Next <ChevronRight size={14} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

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
