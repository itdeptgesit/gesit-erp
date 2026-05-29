'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, RefreshCcw, FileSpreadsheet, Trash2, Pencil, Filter,
    ArrowUpRight, Wallet, CheckCircle2, Clock, Briefcase, ChevronRight, ChevronLeft, BarChart3, Eye, Tag, PieChart, Calendar, Building2,
    Save, AlertTriangle, Database, LayoutGrid, TableProperties
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, Area
} from 'recharts';
import { PurchaseRecord, UserAccount, PurchaseBudget } from '../types';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 dark:bg-zinc-950/95 backdrop-blur-md text-white border border-slate-200/10 dark:border-white/10 rounded-2xl p-4 shadow-2xl w-[220px] pointer-events-none flex flex-col gap-2">
                <p className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-widest m-0 leading-none">{label}</p>
                <div className="flex flex-col gap-1">
                    {payload.map((pld: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs font-bold mt-1">
                            <span className="text-slate-400 dark:text-zinc-400 uppercase text-[9px] tracking-wider">Total Value</span>
                            <span className="text-white font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(pld.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

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

    // Budgeting Feature States
    const [viewMode, setViewMode] = useState<'ledger' | 'budgeting'>('ledger');
    const [budgetYear, setBudgetYear] = useState<number>(new Date().getFullYear());
    const [budgets, setBudgets] = useState<PurchaseBudget[]>([]);
    const [budgetSheetMode, setBudgetSheetMode] = useState<'budget' | 'actual' | 'variance'>('variance');
    const [isSavingBudget, setIsSavingBudget] = useState(false);
    const [isDbPersistent, setIsDbPersistent] = useState(true);
    const [budgetViewLayout, setBudgetViewLayout] = useState<'visual' | 'spreadsheet'>('visual');
    const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({});
    const [editedBudgets, setEditedBudgets] = useState<Record<string, Record<string, number>>>({});

    const handleCellChange = (category: string, monthKey: string, value: string) => {
        if (value === '') {
            setEditedBudgets(prev => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [monthKey]: 0
                }
            }));
            return;
        }
        const numValue = parseInt(value.replace(/\D/g, ''), 10) || 0;
        setEditedBudgets(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [monthKey]: numValue
            }
        }));
    };

    const STANDARD_CATEGORIES = ['Hardware', 'Accessories', 'Cloud & Hosting', 'Subscription', 'Maintenance & Support', 'IT Services'];
    const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

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

    const fetchBudgets = async (year: number) => {
        try {
            const { data, error } = await supabase
                .from('purchase_budgets')
                .select('*')
                .eq('year', year);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                setBudgets(data);
                setIsDbPersistent(true);
            } else {
                const local = localStorage.getItem(`purchase_budgets_${year}`);
                if (local) {
                    setBudgets(JSON.parse(local));
                } else {
                    const initial = STANDARD_CATEGORIES.map(cat => ({
                        year,
                        category: cat,
                        january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
                        july: 0, august: 0, september: 0, october: 0, november: 0, december: 0
                    }));
                    if (year === 2026) {
                        const seed = [
                            { category: 'Hardware', january: 10000000, february: 15000000, march: 2000000, april: 1000000, may: 20000000, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0 },
                            { category: 'Accessories', january: 500000, february: 500000, march: 500000, april: 500000, may: 500000, june: 500000, july: 500000, august: 500000, september: 500000, october: 500000, november: 500000, december: 500000 },
                            { category: 'Cloud & Hosting', january: 4000000, february: 4000000, march: 4000000, april: 4000000, may: 4000000, june: 4000000, july: 4000000, august: 4000000, september: 4000000, october: 4000000, november: 4000000, december: 4000000 },
                            { category: 'Subscription', january: 3500000, february: 4000000, march: 1000000, april: 1000000, may: 1000000, june: 1000000, july: 1000000, august: 1000000, september: 1000000, october: 1000000, november: 1000000, december: 1000000 },
                            { category: 'Maintenance & Support', january: 2000000, february: 500000, march: 500000, april: 500000, may: 500000, june: 500000, july: 500000, august: 500000, september: 500000, october: 500000, november: 500000, december: 500000 },
                            { category: 'IT Services', january: 15000000, february: 1000000, march: 1000000, april: 1000000, may: 2000000, june: 1000000, july: 1000000, august: 1000000, september: 1000000, october: 1000000, november: 1000000, december: 1000000 }
                        ].map(s => ({ year, ...s }));
                        setBudgets(seed);
                    } else {
                        setBudgets(initial);
                    }
                }
                setIsDbPersistent(true);
            }
        } catch (err: any) {
            console.error('Fetch budget database error:', err);
            setIsDbPersistent(false);
            const local = localStorage.getItem(`purchase_budgets_${year}`);
            if (local) {
                setBudgets(JSON.parse(local));
            } else {
                const initial = STANDARD_CATEGORIES.map(cat => ({
                    year,
                    category: cat,
                    january: 0, february: 0, march: 0, april: 0, may: 0, june: 0,
                    july: 0, august: 0, september: 0, october: 0, november: 0, december: 0
                }));
                if (year === 2026) {
                    const seed = [
                        { category: 'Hardware', january: 10000000, february: 15000000, march: 2000000, april: 1000000, may: 20000000, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0 },
                        { category: 'Accessories', january: 500000, february: 500000, march: 500000, april: 500000, may: 500000, june: 500000, july: 500000, august: 500000, september: 500000, october: 500000, november: 500000, december: 500000 },
                        { category: 'Cloud & Hosting', january: 4000000, february: 4000000, march: 4000000, april: 4000000, may: 4000000, june: 4000000, july: 4000000, august: 4000000, september: 4000000, october: 4000000, november: 4000000, december: 4000000 },
                        { category: 'Subscription', january: 3500000, february: 4000000, march: 1000000, april: 1000000, may: 1000000, june: 1000000, july: 1000000, august: 1000000, september: 1000000, october: 1000000, november: 1000000, december: 1000000 },
                        { category: 'Maintenance & Support', january: 2000000, february: 500000, march: 500000, april: 500000, may: 500000, june: 500000, july: 500000, august: 500000, september: 500000, october: 500000, november: 500000, december: 500000 },
                        { category: 'IT Services', january: 15000000, february: 1000000, march: 1000000, april: 1000000, may: 2000000, june: 1000000, july: 1000000, august: 1000000, september: 1000000, october: 1000000, november: 1000000, december: 1000000 }
                    ].map(s => ({ year, ...s }));
                    setBudgets(seed);
                } else {
                    setBudgets(initial);
                }
            }
        }
    };

    const actualSpentMap = useMemo(() => {
        const map: Record<string, Record<number, number>> = {};
        records.forEach(r => {
            if (r.status !== 'Paid' || !r.purchaseDate) return;
            const dateObj = new Date(r.purchaseDate);
            if (isNaN(dateObj.getTime())) return;
            const y = dateObj.getFullYear();
            if (y !== budgetYear) return;
            const m = dateObj.getMonth(); // 0-11
            const cat = r.category || 'Uncategorized';
            if (!map[cat]) {
                map[cat] = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0, 11:0 };
            }
            map[cat][m] = (map[cat][m] || 0) + (r.subtotal || 0);
        });
        return map;
    }, [records, budgetYear]);

    const allCategories = useMemo(() => {
        const cats = new Set(STANDARD_CATEGORIES);
        Object.keys(actualSpentMap).forEach(cat => cats.add(cat));
        return Array.from(cats);
    }, [actualSpentMap]);

    useEffect(() => {
        const initialEditMap: Record<string, Record<string, number>> = {};
        allCategories.forEach(cat => {
            const existing = budgets.find(b => b.category === cat);
            initialEditMap[cat] = {};
            MONTH_KEYS.forEach(m => {
                initialEditMap[cat][m] = existing ? (existing[m as keyof PurchaseBudget] as number || 0) : 0;
            });
        });
        setEditedBudgets(initialEditMap);
    }, [budgets, allCategories]);

    useEffect(() => {
        if (viewMode === 'budgeting') {
            fetchBudgets(budgetYear);
        }
    }, [viewMode, budgetYear]);

    const handleSaveBudget = async () => {
        setIsSavingBudget(true);
        try {
            const payloads = allCategories.map(cat => {
                const rowValues = editedBudgets[cat] || {};
                return {
                    year: budgetYear,
                    category: cat,
                    january: rowValues.january || 0,
                    february: rowValues.february || 0,
                    march: rowValues.march || 0,
                    april: rowValues.april || 0,
                    may: rowValues.may || 0,
                    june: rowValues.june || 0,
                    july: rowValues.july || 0,
                    august: rowValues.august || 0,
                    september: rowValues.september || 0,
                    october: rowValues.october || 0,
                    november: rowValues.november || 0,
                    december: rowValues.december || 0,
                    created_by: currentUser?.fullName || 'System'
                };
            });

            if (isDbPersistent) {
                const { error } = await supabase
                    .from('purchase_budgets')
                    .upsert(payloads, { onConflict: 'year,category' });
                
                if (error) throw error;
                showToast("Budget saved to database successfully!", "success");
            } else {
                localStorage.setItem(`purchase_budgets_${budgetYear}`, JSON.stringify(payloads));
                showToast("Budget saved to local storage fallback successfully!", "success");
            }
            
            await fetchBudgets(budgetYear);
        } catch (err: any) {
            console.error('Save budget error:', err);
            showToast("Failed to save budget: " + err.message, "error");
        } finally {
            setIsSavingBudget(false);
        }
    };

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

    const totals = useMemo(() => {
        const rowTotals: Record<string, { budget: number; actual: number; variance: number }> = {};
        const colTotals: Record<number, { budget: number; actual: number; variance: number }> = {};
        let grandBudget = 0;
        let grandActual = 0;

        for (let m = 0; m < 12; m++) {
            colTotals[m] = { budget: 0, actual: 0, variance: 0 };
        }

        allCategories.forEach(cat => {
            rowTotals[cat] = { budget: 0, actual: 0, variance: 0 };
            for (let m = 0; m < 12; m++) {
                const monthKey = MONTH_KEYS[m];
                const budgetVal = editedBudgets[cat]?.[monthKey] || 0;
                const actualVal = actualSpentMap[cat]?.[m] || 0;
                const varianceVal = budgetVal - actualVal;

                rowTotals[cat].budget += budgetVal;
                rowTotals[cat].actual += actualVal;
                rowTotals[cat].variance += varianceVal;

                colTotals[m].budget += budgetVal;
                colTotals[m].actual += actualVal;
                colTotals[m].variance += varianceVal;

                grandBudget += budgetVal;
                grandActual += actualVal;
            }
        });

        return { rowTotals, colTotals, grandBudget, grandActual, grandVariance: grandBudget - grandActual };
    }, [allCategories, editedBudgets, actualSpentMap]);

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
        <div className="space-y-8 animate-in fade-in duration-200 pb-10 pt-6">
            {/* Header & Financial Health */}
            <div className="space-y-8 mb-10">
                <PageHeader
                    title="Purchase Records"
                    description="Procurement & Financial Audit Registry"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
                        <FinancialHealthSummary
                            outflowChange={financialHealth.outflowChange}
                            pendingCount={financialHealth.pendingCount}
                            largestCategory={financialHealth.largestCategory}
                            riskLevel={financialHealth.riskLevel}
                        />
                    </div>
                </PageHeader>
            </div>

            {/* Main Tabs switcher (Ledger vs Budget Tracker) and Row Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-3 border-t border-b border-slate-100 dark:border-zinc-800/50 my-4 bg-slate-50/10 dark:bg-zinc-900/10">
                <div className="flex items-center gap-3">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-auto">
                        <TabsList className="bg-slate-50 dark:bg-zinc-800 border-none w-full sm:w-auto flex">
                            <TabsTrigger value="ledger" className="text-xs font-bold px-4">
                                <Briefcase size={14} className="mr-2" /> LEDGER
                            </TabsTrigger>
                            <TabsTrigger value="budgeting" className="text-xs font-bold px-4">
                                <FileSpreadsheet size={14} className="mr-2" /> BUDGET TRACKER
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {viewMode === 'ledger' && (
                        <Tabs value={yearFilter} onValueChange={setYearFilter} className="hidden lg:block">
                            <TabsList className="bg-slate-50 dark:bg-zinc-800 border-none">
                                <TabsTrigger value="2026" className="text-xs font-bold px-4">
                                    FY 2026
                                </TabsTrigger>
                                <TabsTrigger value="2025" className="text-xs font-bold px-4">
                                    FY 2025
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </div>

                {viewMode === 'ledger' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={handleExportExcel} className="text-[10px] sm:text-xs font-bold flex-1 sm:flex-none justify-center h-9">
                            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSyncAllToSheet}
                            disabled={isSyncingAll || filteredRecords.length === 0}
                            className="text-[10px] sm:text-xs font-bold flex-1 sm:flex-none justify-center h-9"
                        >
                            {isSyncingAll ? <RefreshCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />}
                            Sync
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
                            className="text-[10px] sm:text-xs font-bold flex-1 sm:flex-none justify-center h-9 transition-all active:scale-95"
                        >
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Entry
                        </Button>
                    </div>
                )}
            </div>

            {viewMode === 'ledger' ? (
                <>

            {/* Advanced Filters Bar */}
            <Card className="rounded-xl border-none shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
                <CardContent className="p-2.5 flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search descriptions, vendors, or IDs..."
                            className="pl-9 h-9 bg-slate-50 border-none dark:bg-zinc-800 focus-visible:ring-1 focus-visible:ring-primary/20 text-xs"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-auto shrink-0">
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-full sm:w-[110px] h-9 bg-slate-50 border-none dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Years</SelectItem>
                                {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                            <SelectTrigger className="w-full sm:w-[125px] h-9 bg-slate-50 border-none dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider">
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
                            <SelectTrigger className="w-full sm:w-[125px] h-9 bg-slate-50 border-none dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider">
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
                            className={cn("w-full sm:w-auto h-9 px-4 text-[10px] font-bold uppercase tracking-wider gap-2", !showDatePicker && "bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 border-none")}
                        >
                            <Calendar size={13} />
                            {showDatePicker ? 'Hide Date' : 'Date Range'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showDatePicker && (
                <Card className="border-dashed border-2 dark: animate-in slide-in-from-top-2 duration-300">
                    <CardContent className="p-4 flex flex-wrap gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Period Start</label>
                            <Input
                                type="date"
                                className="w-[180px] h-9 bg-white dark:bg-zinc-950 font-bold border-muted-foreground/20"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Period End</label>
                            <Input
                                type="date"
                                className="w-[180px] h-9 bg-white dark:bg-zinc-950 font-bold border-muted-foreground/20"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end pb-0.5">
                            <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] font-black uppercase tracking-widest dark:">
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
                <Card className="rounded-xl border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <BarChart3 size={18} />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="font-bold text-slate-900 dark:text-white tracking-tight text-sm uppercase">Fiscal Trend</h2>
                                    <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Monthly transaction volume</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                                        </linearGradient>
                                        <linearGradient id="strokeTotal" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(val)} />
                                    <Tooltip
                                        isAnimationActive={false}
                                        cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        content={<CustomTooltip />}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="url(#strokeTotal)" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3.5} />
                                    <Bar dataKey="total" barSize={32} radius={[6, 6, 0, 0]} fill="url(#strokeTotal)" opacity={0.08} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Row 3.2: 3-Column Bento Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <TopVendorsWidget vendors={vendorData} />

                    {/* Department Allocation */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Briefcase size={16} />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="font-bold text-slate-900 dark:text-white tracking-tight text-xs uppercase">Departmental</h2>
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Utilization track</p>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            {deptData.length === 0 ? (
                                <p className="text-center py-5 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No data</p>
                            ) : deptData.slice(0, 5).map((dept, idx) => (
                                <div key={dept.name} className="space-y-1.5 p-2 -mx-2 rounded-xl transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 hover:translate-x-1 hover:scale-[1.01] cursor-pointer group">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full transition-transform duration-300 group-hover:scale-125", idx === 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700')}></div>
                                            <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[120px]">{dept.name}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-slate-900 dark:text-slate-200 font-mono">{formatIDR(dept.total)}</span>
                                            <span className="text-emerald-500 text-[9px] w-6">{dept.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-full overflow-hidden shadow-inner border border-slate-100/50 dark:border-zinc-850/50">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${dept.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm p-5 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Tag size={16} />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="font-bold text-slate-900 dark:text-white tracking-tight text-xs uppercase">Classified</h2>
                                <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Cost breakdown</p>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            {categoryData.length === 0 ? (
                                <p className="text-center py-5 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No data</p>
                            ) : categoryData.slice(0, 5).map((cat, idx) => (
                                <div key={cat.name} className="space-y-1.5 p-2 -mx-2 rounded-xl transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 hover:translate-x-1 hover:scale-[1.01] cursor-pointer group">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full transition-transform duration-300 group-hover:scale-125", idx === 0 ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-zinc-700')}></div>
                                            <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[120px]">{cat.name}</span>
                                        </div>
                                        <div className="text-right flex items-center gap-1.5">
                                            <span className="text-slate-900 dark:text-slate-200 font-mono">{formatIDR(cat.total)}</span>
                                            <span className="text-indigo-500 text-[9px] w-6">{cat.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-full overflow-hidden shadow-inner border border-slate-100/50 dark:border-zinc-850/50">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
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
                        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/80">General Transaction Ledger</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            <span className="text-[11px] font-bold text-muted-foreground">{filteredRecords.length} Records Found</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Desktop View Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow className="bg-muted/50 border-b">
                                    <TableHead className="font-bold py-5 px-6 w-[15%]">Audit Identity</TableHead>
                                    <TableHead className="font-bold py-5 px-6 w-[27%]">Item & Procurement Details</TableHead>
                                    <TableHead className="text-right font-bold py-5 px-6 w-[14%]">Fiscal Value</TableHead>
                                    <TableHead className="font-bold py-5 px-6 w-[14%]">Corporate entity</TableHead>
                                    <TableHead className="font-bold py-5 px-6 w-[10%]">Ledger Status</TableHead>
                                    <TableHead className="text-center font-bold py-5 px-6 w-[8%]">Audit Docs</TableHead>
                                    <TableHead className="text-right font-bold pr-10 py-5 px-6 w-[12%]">Control</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 10 }).map((_, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="py-7 px-6">
                                                <div className="flex flex-col gap-2">
                                                    <Skeleton className="h-5 w-24 rounded-md" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 px-6">
                                                <div className="flex flex-col gap-2 max-w-[280px]">
                                                    <Skeleton className="h-4 w-full" />
                                                    <div className="flex gap-2">
                                                        <Skeleton className="h-4 w-16 rounded-full" />
                                                        <Skeleton className="h-4 w-12 rounded-full" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 px-6 text-right flex flex-col items-end gap-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </TableCell>
                                            <TableCell className="py-7 px-6">
                                                <div className="flex flex-col gap-2">
                                                    <Skeleton className="h-3 w-20" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-7 px-6">
                                                <Skeleton className="h-6 w-16 rounded-full" />
                                            </TableCell>
                                            <TableCell className="py-7 px-6 flex justify-center">
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                            </TableCell>
                                            <TableCell className="py-7 pr-10 px-6">
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
                                        <TableCell className="py-7 px-6">
                                            <div className="flex flex-col gap-2 align-middle">
                                                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md w-fit tracking-tighter border border-primary/20 shadow-sm">{record.transactionId}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                                                    <Calendar size={11} className="opacity-80" />
                                                    {record.purchaseDate}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-7 px-6">
                                            <div className="flex flex-col gap-1.5 max-w-[320px]">
                                                <p className="font-bold text-foreground text-[13px] tracking-tight leading-snug truncate-2-lines group-hover:text-primary transition-colors">{record.description}</p>
                                                <div className="flex items-center gap-2.5 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] font-bold px-2 py-0 h-4 bg-muted/50 border-muted-foreground/10">{record.vendor}</Badge>
                                                    <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-tighter">{record.paymentMethod || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-7 px-6 text-right">
                                            <p className="font-mono font-bold text-[13px] text-foreground tracking-tighter">Rp {new Intl.NumberFormat('id-ID').format(record.subtotal)}</p>
                                            <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Gross total</span>
                                        </TableCell>
                                        <TableCell className="py-7 px-6">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">{record.company}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-bold">
                                                    <Building2 size={11} className="text-primary" />
                                                    {record.department}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-7 px-6">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest gap-1.5 border-transparent px-3 py-1 shadow-sm",
                                                    record.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                        record.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                            'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                )}
                                            >
                                                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", record.status === 'Paid' ? 'bg-emerald-500' : record.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500')}></div>
                                                {record.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-7 px-6 text-center">
                                            <div className="flex justify-center">
                                                {Object.values(record.docs || {}).filter(v => v).length > 0 ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold border border-primary/20">
                                                            {Object.values(record.docs || {}).filter(v => v).length}/7
                                                        </span>
                                                        <span className="text-[8px] font-black text-primary uppercase tracking-tighter">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-zinc-500">
                                                        <span className="px-2.5 py-0.5 bg-muted text-muted-foreground rounded-md text-[10px] font-bold">0/7</span>
                                                        <span className="text-[8px] font-black uppercase tracking-tighter">Missing</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-7 text-right pr-10 px-6">
                                            <div className="inline-flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedDetail(record); setIsDetailOpen(true); }} className="w-9 text-muted-foreground hover:text-primary hover:bg-primary/5" aria-label="View Details"><Eye size={15} /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="w-9 text-muted-foreground" aria-label="Edit Entry"><Pencil size={15} /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(record)} className="w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5" aria-label="Delete Entry"><Trash2 size={15} /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View Card List */}
                    <div className="block lg:hidden divide-y divide-slate-100 dark:divide-zinc-800/60">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <div key={idx} className="p-5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-5 w-24 rounded-md" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                    <div className="flex justify-between items-center pt-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-8 w-24 rounded-lg" />
                                    </div>
                                </div>
                            ))
                        ) : filteredRecords.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">
                                Empty Ledger • No Data Available
                            </div>
                        ) : (
                            paginatedRecords.map(record => (
                                <div key={record.id} className="p-5 space-y-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md tracking-tighter border border-primary/20 shadow-sm w-fit">
                                                {record.transactionId}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                                                <Calendar size={11} className="opacity-80" />
                                                {record.purchaseDate}
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[9px] font-bold uppercase tracking-widest gap-1 border-transparent px-2.5 py-0.5 shadow-sm shrink-0",
                                                record.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                    record.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                        'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                            )}
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", record.status === 'Paid' ? 'bg-emerald-500' : record.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500')}></div>
                                            {record.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-bold text-foreground text-xs leading-snug">
                                            {record.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 bg-muted/50 border-muted-foreground/10">
                                                {record.vendor}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-tighter">
                                                {record.paymentMethod || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-bold">
                                            <Building2 size={11} className="text-primary" />
                                            <span>{record.company}</span>
                                            <span className="text-slate-300 dark:text-zinc-700/60">•</span>
                                            <span>{record.department}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-800/40">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Fiscal Value</span>
                                            <span className="font-mono font-black text-xs text-foreground">
                                                Rp {new Intl.NumberFormat('id-ID').format(record.subtotal)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center">
                                                {Object.values(record.docs || {}).filter(v => v).length > 0 ? (
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[9px] font-bold border border-primary/20">
                                                        {Object.values(record.docs || {}).filter(v => v).length}/7 Verified
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-[9px] font-bold">
                                                        0/7 Missing
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setSelectedDetail(record); setIsDetailOpen(true); }} className="w-8 h-8 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg" aria-label="View Details">
                                                    <Eye size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="w-8 h-8 text-muted-foreground hover:bg-muted rounded-lg" aria-label="Edit Entry">
                                                    <Pencil size={14} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteRecord(record)} className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg" aria-label="Delete Entry">
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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
                                className="text-[10px] font-black uppercase tracking-widest bg-background"
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
                                className="text-[10px] font-black uppercase tracking-widest bg-background"
                            >
                                Next <ChevronRight size={14} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {!isDbPersistent && (
                        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl mb-6">
                            <AlertTriangle size={18} className="shrink-0 animate-pulse" />
                            <div className="text-xs font-bold leading-normal">
                                <span className="uppercase font-black block mb-0.5">Local Fallback Active</span>
                                Database migration not yet applied. Budget data is currently saved to browser local storage.
                                To enable database synchronization, please run <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">migration_purchase_budgets.sql</code> in your Supabase SQL Editor.
                            </div>
                        </div>
                    )}

                    {/* Budget Controls Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl shadow-sm">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-wrap">
                            <Select value={budgetYear.toString()} onValueChange={(val) => setBudgetYear(parseInt(val, 10))}>
                                <SelectTrigger className="w-full sm:w-[120px] h-9 bg-slate-50 border-none dark:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2025, 2026, 2027, 2028].map(y => (
                                        <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            <Tabs value={budgetViewLayout} onValueChange={(v) => setBudgetViewLayout(v as any)} className="w-full sm:w-auto">
                                <TabsList className="bg-slate-50 dark:bg-zinc-800 border-none w-full sm:w-auto flex">
                                    <TabsTrigger value="visual" className="text-[10px] font-bold px-3 py-1 h-7 flex-1 sm:flex-none justify-center gap-1">
                                        <LayoutGrid size={11} /> VISUAL
                                    </TabsTrigger>
                                    <TabsTrigger value="spreadsheet" className="text-[10px] font-bold px-3 py-1 h-7 flex-1 sm:flex-none justify-center gap-1">
                                        <TableProperties size={11} /> SPREADSHEET
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <Tabs value={budgetSheetMode} onValueChange={(v) => setBudgetSheetMode(v as any)} className="w-full sm:w-auto">
                                <TabsList className="bg-slate-50 dark:bg-zinc-800 border-none w-full sm:w-auto flex">
                                    <TabsTrigger value="variance" className="text-[10px] font-bold px-3 py-1 h-7 flex-1 sm:flex-none justify-center">
                                        PERFORMANCE
                                    </TabsTrigger>
                                    <TabsTrigger value="budget" className="text-[10px] font-bold px-3 py-1 h-7 flex-1 sm:flex-none justify-center">
                                        TARGETS (EDIT)
                                    </TabsTrigger>
                                    <TabsTrigger value="actual" className="text-[10px] font-bold px-3 py-1 h-7 flex-1 sm:flex-none justify-center">
                                        ACTUAL SPEND
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            {isDbPersistent ? (
                                <Badge variant="outline" className="text-[9px] font-bold py-1 px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 shadow-sm">
                                    <Database size={11} /> SUPABASE
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[9px] font-bold py-1 px-3 bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 shadow-sm animate-pulse">
                                    <AlertTriangle size={11} /> LOCAL STORAGE
                                </Badge>
                            )}

                            {budgetSheetMode === 'budget' && (
                                <Button
                                    size="sm"
                                    onClick={handleSaveBudget}
                                    disabled={isSavingBudget}
                                    className="text-xs font-bold transition-all active:scale-95 bg-primary gap-1.5"
                                >
                                    {isSavingBudget ? <RefreshCcw size={13} className="animate-spin" /> : <Save size={13} />}
                                    Save targets
                                </Button>
                            )}
                        </div>
                    </div>

                    {budgetViewLayout === 'visual' ? (
                        /* Visual Card View Dashboard */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allCategories.map(cat => {
                                const rowTotal = totals.rowTotals[cat] || { budget: 0, actual: 0, variance: 0 };
                                const isExpanded = expandedBreakdown[cat] || false;
                                const utilizationRate = rowTotal.budget > 0 
                                    ? Math.round((rowTotal.actual / rowTotal.budget) * 100)
                                    : 0;
                                
                                return (
                                    <Card key={cat} className="rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden flex flex-col justify-between">
                                        <CardContent className="p-5 flex flex-col gap-4">
                                            {/* Header */}
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">{cat}</h3>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">Annual Budget Performance</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge className={cn(
                                                        "text-[9px] font-bold py-0.5 px-2",
                                                        utilizationRate > 100 
                                                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                            : utilizationRate >= 80
                                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    )} variant="outline">
                                                        {utilizationRate > 100 ? 'OVER BUDGET' : `${utilizationRate}% USED`}
                                                    </Badge>
                                                    {budgetSheetMode === 'budget' && (
                                                        <span className="text-[8px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded animate-pulse">
                                                            EDITING TARGETS
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                                    <span>Utilization Rate</span>
                                                    <span>{utilizationRate}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            utilizationRate > 100 
                                                                ? "bg-rose-500" 
                                                                : utilizationRate >= 80
                                                                    ? "bg-amber-500" 
                                                                    : "bg-emerald-500"
                                                        )}
                                                        style={{ width: `${Math.min(100, utilizationRate)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Annual Totals Grid */}
                                            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-zinc-850 p-3 rounded-lg border border-slate-100/50 dark:border-zinc-850">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Budget</span>
                                                    <span className="text-xs font-bold text-foreground mt-0.5 font-mono">{formatIDR(rowTotal.budget)}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-200 dark:border-zinc-800 pl-3">
                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Actual</span>
                                                    <span className="text-xs font-bold text-foreground mt-0.5 font-mono">{formatIDR(rowTotal.actual)}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-200 dark:border-zinc-800 pl-3">
                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                                                        {rowTotal.variance >= 0 ? 'Remaining' : 'Deficit'}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs font-black mt-0.5 font-mono",
                                                        rowTotal.variance >= 0 ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {formatIDR(Math.abs(rowTotal.variance))}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Expandable Monthly Breakdown */}
                                            {isExpanded && (
                                                <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 flex flex-col gap-2 mt-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                                                    <div className="grid grid-cols-4 text-[9px] font-bold text-muted-foreground uppercase tracking-wider pb-1 border-b border-slate-100/50 dark:border-zinc-800/50">
                                                        <span>Month</span>
                                                        <span className="text-right">Budget</span>
                                                        <span className="text-right">Actual</span>
                                                        <span className="text-right">Var</span>
                                                    </div>
                                                    {Array.from({ length: 12 }).map((_, mIdx) => {
                                                        const monthKey = MONTH_KEYS[mIdx];
                                                        const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mIdx];
                                                        
                                                        const budgetVal = editedBudgets[cat]?.[monthKey] || 0;
                                                        const actualVal = actualSpentMap[cat]?.[mIdx] || 0;
                                                        const varianceVal = budgetVal - actualVal;

                                                        if (budgetVal === 0 && actualVal === 0 && budgetSheetMode !== 'budget') return null;

                                                        return (
                                                            <div key={monthKey} className="grid grid-cols-4 items-center text-[11px] py-1 border-b border-slate-50 dark:border-zinc-850/30">
                                                                <span className="font-semibold text-foreground">{monthName}</span>
                                                                <span className="text-right font-mono">
                                                                    {budgetSheetMode === 'budget' ? (
                                                                        <Input
                                                                            type="text"
                                                                            value={editedBudgets[cat]?.[monthKey] ? new Intl.NumberFormat('id-ID').format(editedBudgets[cat][monthKey]) : ''}
                                                                            onChange={(e) => handleCellChange(cat, monthKey, e.target.value)}
                                                                            className="h-6 w-full text-right font-mono text-[10px] bg-slate-50 border border-muted-foreground/20 px-1 rounded shadow-inner"
                                                                            placeholder="0"
                                                                        />
                                                                    ) : (
                                                                        formatIDR(budgetVal)
                                                                    )}
                                                                </span>
                                                                <span className="text-right font-mono text-muted-foreground">{formatIDR(actualVal)}</span>
                                                                <span className={cn(
                                                                    "text-right font-bold font-mono",
                                                                    varianceVal >= 0 ? "text-emerald-500" : "text-rose-500"
                                                                )}>
                                                                    {varianceVal >= 0 ? '+' : '-'}{formatIDR(Math.abs(varianceVal))}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </CardContent>

                                        {/* Toggle Footer */}
                                        <div className="px-5 py-3 bg-slate-50/50 dark:bg-zinc-800/20 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setExpandedBreakdown(prev => ({ ...prev, [cat]: !isExpanded }))}
                                                className="text-[10px] font-bold tracking-wide uppercase h-7 text-primary hover:text-primary/80"
                                            >
                                                {isExpanded ? 'Hide Monthly Detail' : 'Show Monthly Detail'}
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        /* Grid Card */
                        <Card className="shadow-sm rounded-xl overflow-hidden border-none bg-background/50 backdrop-blur-sm">
                            <CardContent className="p-0 overflow-x-auto relative">
                                <Table className="min-w-[1500px]">
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-b">
                                            <TableHead className="font-bold py-4 px-4 w-[180px] text-xs uppercase tracking-wider sticky left-0 bg-muted/95 dark:bg-zinc-950/95 border-r border-slate-200 dark:border-zinc-850 shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-20">Category</TableHead>
                                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                                                <TableHead key={m} className="text-right font-bold py-4 px-3 text-xs uppercase tracking-wider w-[100px]">{m}</TableHead>
                                            ))}
                                            <TableHead className="text-right font-bold py-4 px-4 text-xs uppercase tracking-wider w-[140px]">Annual Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allCategories.map(cat => {
                                            const rowTotal = totals.rowTotals[cat] || { budget: 0, actual: 0, variance: 0 };
                                            return (
                                                <TableRow key={cat} className="group transition-colors hover:bg-muted/30">
                                                    {/* Category Name - Sticky Column */}
                                                    <TableCell className="py-4 px-4 font-bold text-foreground text-[11px] uppercase tracking-wider sticky left-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-10 group-hover:bg-slate-50 dark:group-hover:bg-zinc-800/80 transition-colors">
                                                        {cat}
                                                    </TableCell>
                                                    
                                                    {/* Monthly Cells */}
                                                    {Array.from({ length: 12 }).map((_, mIdx) => {
                                                        const monthKey = MONTH_KEYS[mIdx];
                                                        const budgetVal = editedBudgets[cat]?.[monthKey] || 0;
                                                        const actualVal = actualSpentMap[cat]?.[mIdx] || 0;
                                                        const varianceVal = budgetVal - actualVal;
                                                        
                                                        

                                                        return (
                                                            <TableCell key={mIdx} className="py-4 px-3 text-right">
                                                                {budgetSheetMode === 'budget' ? (
                                                                    <div className="flex justify-end">
                                                                        <Input
                                                                            type="text"
                                                                            value={editedBudgets[cat]?.[monthKey] ? new Intl.NumberFormat('id-ID').format(editedBudgets[cat][monthKey]) : ''}
                                                                            onChange={(e) => handleCellChange(cat, monthKey, e.target.value)}
                                                                            placeholder="0"
                                                                            className="h-8 w-24 text-right text-xs font-mono font-bold bg-background border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary hover:border-muted-foreground/40 shadow-inner transition-all duration-150"
                                                                        />
                                                                    </div>
                                                                ) : budgetSheetMode === 'actual' ? (
                                                                    <span className="font-mono font-bold text-xs text-foreground">
                                                                        {actualVal > 0 ? formatIDR(actualVal) : '-'}
                                                                    </span>
                                                                ) : (
                                                                    /* Performance comparison view */
                                                                    <div className="flex flex-col gap-1 text-[10px] font-mono leading-none">
                                                                        <div className="flex justify-between gap-1.5 text-muted-foreground/60 text-[9px]">
                                                                            <span>B:</span>
                                                                            <span>{budgetVal > 0 ? formatIDR(budgetVal) : '0'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between gap-1.5 font-bold text-foreground">
                                                                            <span>A:</span>
                                                                            <span>{actualVal > 0 ? formatIDR(actualVal) : '0'}</span>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "flex justify-between gap-1.5 font-black border-t border-muted-foreground/10 pt-0.5 mt-0.5",
                                                                            varianceVal > 0 ? "text-emerald-500" : varianceVal < 0 ? "text-rose-500" : "text-muted-foreground/40"
                                                                        )}>
                                                                            <span>{varianceVal > 0 ? 'Rem:' : varianceVal < 0 ? 'Over:' : 'Bal:'}</span>
                                                                            <span>{varianceVal !== 0 ? formatIDR(Math.abs(varianceVal)) : '0'}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    
                                                    {/* Row Total */}
                                                    <TableCell className="py-4 px-4 text-right bg-muted/10 font-bold">
                                                        {budgetSheetMode === 'budget' ? (
                                                            <span className="font-mono text-xs text-foreground font-black">
                                                                {formatIDR(rowTotal.budget)}
                                                            </span>
                                                        ) : budgetSheetMode === 'actual' ? (
                                                            <span className="font-mono text-xs text-foreground font-black">
                                                                {formatIDR(rowTotal.actual)}
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-col gap-1 text-[10px] font-mono leading-none text-right">
                                                                <div className="flex justify-between gap-1.5 text-muted-foreground/60 text-[9px]">
                                                                    <span>B:</span>
                                                                    <span>{formatIDR(rowTotal.budget)}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-1.5 font-bold text-foreground">
                                                                    <span>A:</span>
                                                                    <span>{formatIDR(rowTotal.actual)}</span>
                                                                </div>
                                                                <div className={cn(
                                                                    "flex justify-between gap-1.5 font-black border-t border-muted-foreground/10 pt-0.5 mt-0.5",
                                                                    rowTotal.variance > 0 ? "text-emerald-500" : rowTotal.variance < 0 ? "text-rose-500" : "text-muted-foreground/40"
                                                                )}>
                                                                    <span>{rowTotal.variance > 0 ? 'Rem:' : rowTotal.variance < 0 ? 'Over:' : 'Bal:'}</span>
                                                                    <span>{formatIDR(Math.abs(rowTotal.variance))}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        
                                        {/* Bottom Total Row */}
                                        <TableRow className="bg-muted/30 border-t border-b font-black">
                                            <TableCell className="py-4 px-4 font-black text-foreground text-xs uppercase tracking-wider sticky left-0 bg-muted/95 dark:bg-zinc-950/95 border-r border-slate-200 dark:border-zinc-800 shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-10">
                                                Total
                                            </TableCell>
                                            
                                            {Array.from({ length: 12 }).map((_, mIdx) => {
                                                const colTotal = totals.colTotals[mIdx] || { budget: 0, actual: 0, variance: 0 };
                                                return (
                                                    <TableCell key={mIdx} className="py-4 px-3 text-right">
                                                        {budgetSheetMode === 'budget' ? (
                                                            <span className="font-mono text-xs text-foreground">
                                                                {formatIDR(colTotal.budget)}
                                                            </span>
                                                        ) : budgetSheetMode === 'actual' ? (
                                                            <span className="font-mono text-xs text-foreground">
                                                                {formatIDR(colTotal.actual)}
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-col gap-1 text-[10px] font-mono leading-none text-right">
                                                                <div className="flex justify-between gap-1.5 text-muted-foreground/60 text-[9px]">
                                                                    <span>B:</span>
                                                                    <span>{formatIDR(colTotal.budget)}</span>
                                                                </div>
                                                                <div className="flex justify-between gap-1.5 text-foreground">
                                                                    <span>A:</span>
                                                                    <span>{formatIDR(colTotal.actual)}</span>
                                                                </div>
                                                                <div className={cn(
                                                                    "flex justify-between gap-1.5 border-t border-muted-foreground/10 pt-0.5 mt-0.5",
                                                                    colTotal.variance > 0 ? "text-emerald-500" : colTotal.variance < 0 ? "text-rose-500" : "text-muted-foreground/40"
                                                                )}>
                                                                    <span>{colTotal.variance > 0 ? 'Rem:' : colTotal.variance < 0 ? 'Over:' : 'Bal:'}</span>
                                                                    <span>{formatIDR(Math.abs(colTotal.variance))}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                            
                                            {/* Grand Total */}
                                            <TableCell className="py-4 px-4 text-right bg-muted/20 font-black">
                                                {budgetSheetMode === 'budget' ? (
                                                    <span className="font-mono text-xs text-primary font-black">
                                                        {formatIDR(totals.grandBudget)}
                                                    </span>
                                                ) : budgetSheetMode === 'actual' ? (
                                                    <span className="font-mono text-xs text-primary font-black">
                                                        {formatIDR(totals.grandActual)}
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col gap-1 text-[10px] font-mono leading-none text-right text-primary font-black">
                                                        <div className="flex justify-between gap-1.5 text-primary/60 text-[9px]">
                                                            <span>B:</span>
                                                            <span>{formatIDR(totals.grandBudget)}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-1.5 text-primary font-bold">
                                                            <span>A:</span>
                                                            <span>{formatIDR(totals.grandActual)}</span>
                                                        </div>
                                                        <div className={cn(
                                                            "flex justify-between gap-1.5 border-t border-primary/20 pt-0.5 mt-0.5 font-black",
                                                            totals.grandVariance > 0 ? "text-emerald-500" : totals.grandVariance < 0 ? "text-rose-500" : "text-primary/80"
                                                        )}>
                                                            <span>{totals.grandVariance > 0 ? 'Rem:' : totals.grandVariance < 0 ? 'Over:' : 'Bal:'}</span>
                                                            <span>{formatIDR(Math.abs(totals.grandVariance))}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

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

