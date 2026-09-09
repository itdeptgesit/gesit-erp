'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Calculator, Building2, User, Calendar, Tag,
    CheckCircle2, AlertCircle, Save, ShieldCheck, Plus,
    Trash2, Receipt, ShoppingCart, DollarSign, Package,
    Layers, CreditCard, ExternalLink, FileText, Check, Clock,
    Sparkles, ArrowRight, Link2, Info
} from 'lucide-react';
import { PurchaseRecord } from '../types';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PurchaseRecordFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<PurchaseRecord>) => void;
    initialData?: PurchaseRecord | null;
}

const formatNumber = (val: number | string | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(/,/g, '.')) : val;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
};

const parseNumber = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/[^0-9]/g, '');
    return parseInt(clean, 10) || 0;
};

const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(num || 0);
};

export const PurchaseRecordFormModal: React.FC<PurchaseRecordFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData
}) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<Partial<PurchaseRecord>>({});
    const [companies, setCompanies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isGeneratingId, setIsGeneratingId] = useState(false);

    const generateNextTransactionId = async (date: string) => {
        if (!date) return;
        setIsGeneratingId(true);
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return;

            const yy = dateObj.getFullYear().toString().slice(-2);
            const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const dd = dateObj.getDate().toString().padStart(2, '0');
            const prefix = `TR-${yy}${mm}${dd}-`;

            const { data } = await supabase
                .from('purchase_records')
                .select('transaction_id')
                .like('transaction_id', `${prefix}%`)
                .order('transaction_id', { ascending: false })
                .limit(1);

            let nextNumber = 1;
            if (data && data.length > 0) {
                const lastId = data[0].transaction_id;
                const lastNumber = parseInt(lastId.split('-').pop() || '0', 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }

            const nextId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
            setFormData(prev => ({ ...prev, transactionId: nextId }));
        } catch (err) {
            console.error('Error generating transaction ID:', err);
        } finally {
            setIsGeneratingId(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const { data: comp } = await supabase.from('companies').select('name').order('name');
            if (comp) setCompanies(comp);
            const { data: dept } = await supabase.from('departments').select('name').order('name');
            if (dept) setDepartments(dept);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            let parsedItems = initialData.items;
            if (typeof parsedItems === 'string') {
                try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
            }
            let parsedDocs = initialData.docs;
            if (typeof parsedDocs === 'string') {
                try { parsedDocs = JSON.parse(parsedDocs); } catch { parsedDocs = undefined as any; }
            }

            const defaultDocs = {
                prForm: false,
                cashAdvance: false,
                checkout: false,
                paymentSlip: false,
                invoice: false,
                expenseApproval: false,
                checkByRara: false
            };

            setFormData({
                ...initialData,
                company: initialData.company || 'THE GESIT COMPANIES',
                items: Array.isArray(parsedItems) ? parsedItems : [],
                docs: { ...defaultDocs, ...(parsedDocs || {}) }
            });
        } else if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                transactionId: 'Generating...',
                status: 'Paid',
                company: 'THE GESIT COMPANIES',
                department: 'IT',
                category: 'Hardware',
                paymentMethod: 'Transfer',
                platform: 'Shopee',
                qty: 1,
                price: 0,
                vat: 0,
                deliveryFee: 0,
                insurance: 0,
                appFee: 0,
                otherCost: 0,
                purchaseDate: today,
                paymentDate: today,
                docs: {
                    prForm: true,
                    cashAdvance: false,
                    checkout: false,
                    paymentSlip: false,
                    invoice: false,
                    expenseApproval: false,
                    checkByRara: false
                },
                items: []
            });
            generateNextTransactionId(today);
        }
    }, [initialData, isOpen]);

    // Calculate item total helper
    const calculateItemTotal = () => {
        const items = formData.items || [];
        const itemsTotal = items.reduce((sum, item) => {
            const rowSubtotal = (Number(item.price) * Number(item.qty))
                + (Number(item.deliveryFee) || 0)
                + (Number(item.insuranceFee) || 0);
            const rowDiscounts = (Number(item.itemDiscount) || 0) + (Number(item.shippingDiscount) || 0);
            return sum + (rowSubtotal - rowDiscounts);
        }, 0);

        const baseTotal = items.length > 0 ? itemsTotal : (Number(formData.price) || 0) * (Number(formData.qty) || 1);
        const vat = Number(formData.vat) || 0;
        const delivery = Number(formData.deliveryFee) || 0;
        const insurance = Number(formData.insurance) || 0;
        const appFee = Number(formData.appFee) || 0;

        const otherCost = delivery + insurance + appFee;
        const subtotal = baseTotal + vat + otherCost;
        return { subtotal, otherCost, itemsTotal };
    };

    // Only auto-recalculate for brand new records without initialData
    useEffect(() => {
        if (!initialData) {
            const { subtotal, otherCost } = calculateItemTotal();
            if (formData.subtotal !== subtotal || formData.otherCost !== otherCost) {
                setFormData(prev => ({ ...prev, otherCost, subtotal, totalVa: subtotal }));
            }
        }
    }, [formData.price, formData.qty, formData.vat, formData.deliveryFee, formData.insurance, formData.appFee, formData.items, initialData]);

    const handleDocToggle = (key: keyof NonNullable<PurchaseRecord['docs']>) => {
        setFormData(prev => ({
            ...prev,
            docs: {
                ...(prev.docs || {
                    prForm: false, cashAdvance: false, checkout: false, paymentSlip: false,
                    invoice: false, expenseApproval: false, checkByRara: false
                }),
                [key]: !prev.docs?.[key]
            }
        }));
    };

    if (!isOpen) return null;

    const docItemsList = [
        { key: 'prForm', label: 'PR Form' },
        { key: 'cashAdvance', label: 'Cash Advance' },
        { key: 'checkout', label: 'Checkout' },
        { key: 'paymentSlip', label: 'Payment Slip' },
        { key: 'invoice', label: 'Invoice' },
        { key: 'expenseApproval', label: 'Expense Approval' },
        { key: 'checkByRara', label: 'Audited (Rara)' }
    ];

    const isEdit = !!initialData?.id;
    const hasItems = (formData.items || []).length > 0;

    return createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto no-print">
            <div className="bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 backdrop-blur shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                            <Receipt size={22} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
                                    {isEdit ? 'Edit Purchase Record' : 'New Purchase Record'}
                                </h2>
                                <span className={cn(
                                    "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 shadow-sm",
                                    formData.status === 'Paid' 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                                        : formData.status === 'Rejected'
                                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800"
                                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                                )}>
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        formData.status === 'Paid' ? "bg-emerald-500" : formData.status === 'Rejected' ? "bg-rose-500" : "bg-amber-500"
                                    )} />
                                    {formData.status || 'Pending'}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                Financial Registry & Procurement Ledger
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right hidden sm:block">
                            <div className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Reference ID</div>
                            <div className="text-base font-mono font-black text-blue-600 dark:text-blue-400 tracking-tight bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                {formData.transactionId}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            type="button"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
                    <form id="recordForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                            
                            {/* --- LEFT COLUMN: PROCUREMENT & BASIC INFO (7 COLS) --- */}
                            <div className="lg:col-span-7 space-y-6">

                                {/* Section 1: Informasi Dasar Transaksi */}
                                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                            <FileText size={15} />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                                            Informasi Dasar Transaksi
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Deskripsi / Judul Pengadaan <span className="text-rose-500">*</span>
                                            </Label>
                                            <Textarea
                                                rows={2}
                                                className="resize-none font-medium text-xs bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                                value={formData.description || ''}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                required
                                                placeholder="Contoh: Peripheral Support IT, Laptop Upgrade, Lisensi Software..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                    Perusahaan / Company <span className="text-rose-500">*</span>
                                                </Label>
                                                <select
                                                    className="w-full h-10 px-3 font-semibold text-xs bg-slate-50/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                                    value={formData.company || ''}
                                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                                    required
                                                >
                                                    <option value="">- Pilih Perusahaan -</option>
                                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                                    <option value="THE GESIT COMPANIES">THE GESIT COMPANIES</option>
                                                    <option value="GESIT ALUMAS">GESIT ALUMAS</option>
                                                    <option value="GESIT PROPERTIES">GESIT PROPERTIES</option>
                                                </select>
                                            </div>

                                            <div>
                                                <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                    Status Pembayaran
                                                </Label>
                                                <select
                                                    className="w-full h-10 px-3 font-bold text-xs bg-slate-50/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                                    value={formData.status || 'Pending'}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                                >
                                                    <option value="Paid">PAID (Lunas)</option>
                                                    <option value="Pending">PENDING (Menunggu)</option>
                                                    <option value="Rejected">REJECTED (Ditolak)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Detail Pemohon, Vendor & Metode */}
                                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                            <User size={15} />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                                            Detail Pemohon, Vendor & Metode
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Nama Pemohon / Requester
                                            </Label>
                                            <Input
                                                className="h-10 text-xs font-semibold bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.user || ''}
                                                onChange={e => setFormData({ ...formData, user: e.target.value })}
                                                placeholder="Nama pemohon..."
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Departemen
                                            </Label>
                                            <select
                                                className="w-full h-10 px-3 font-semibold text-xs bg-slate-50/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.department || ''}
                                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            >
                                                <option value="">- Pilih Departemen -</option>
                                                {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                                <option value="IT">IT</option>
                                                <option value="Finance">Finance</option>
                                                <option value="HR">HR</option>
                                                <option value="GA">GA</option>
                                                <option value="Legal">Legal</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Nama Vendor / Toko
                                            </Label>
                                            <Input
                                                className="h-10 text-xs font-semibold bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.vendor || ''}
                                                onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                                                placeholder="Contoh: TITON Shopee, Tokopedia, PT Surya..."
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Metode Pembayaran
                                            </Label>
                                            <select
                                                className="w-full h-10 px-3 font-semibold text-xs bg-slate-50/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.paymentMethod || 'Transfer'}
                                                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                            >
                                                <option value="Transfer">Transfer Bank</option>
                                                <option value="VA">Virtual Account (VA)</option>
                                                <option value="Debit/CC">Debit / Kartu Kredit</option>
                                                <option value="Cash">Cash / Kasbon</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Kategori Barang / Jasa
                                            </Label>
                                            <select
                                                className="w-full h-10 px-3 font-semibold text-xs bg-slate-50/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.category || 'Hardware'}
                                                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                            >
                                                <option value="Hardware">Hardware (Perangkat Keras)</option>
                                                <option value="Accessories">Accessories (Aksesoris IT)</option>
                                                <option value="Cloud & Hosting">Cloud & Hosting</option>
                                                <option value="Subscription">Subscription / Lisensi</option>
                                                <option value="Maintenance & Support">Maintenance & Support</option>
                                                <option value="IT Services">IT Services</option>
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Platform / Sumber
                                            </Label>
                                            <Input
                                                className="h-10 text-xs font-semibold bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.platform || ''}
                                                onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                                placeholder="Shopee, Tokopedia, Direct Offline..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Tanggal, Link Bukti & Remarks */}
                                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                            <Calendar size={15} />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                                            Jadwal & Tautan Bukti Transaksi
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Tanggal Pembelian
                                            </Label>
                                            <Input
                                                type="date"
                                                className="h-10 text-xs font-bold bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.purchaseDate || ''}
                                                onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Tanggal Pembayaran (Ledger)
                                            </Label>
                                            <Input
                                                type="date"
                                                className="h-10 text-xs font-bold bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl text-blue-600 dark:text-blue-400 focus:bg-white"
                                                value={formData.paymentDate || ''}
                                                onChange={e => {
                                                    const newDate = e.target.value;
                                                    setFormData(prev => ({ ...prev, paymentDate: newDate, transactionId: 'Generating...' }));
                                                    generateNextTransactionId(newDate);
                                                }}
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                                                <Link2 size={12} className="text-blue-500" />
                                                Link Bukti / Google Drive Invoice
                                            </Label>
                                            <Input
                                                type="url"
                                                className="h-10 text-xs font-medium bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white"
                                                value={formData.evidenceLink || ''}
                                                onChange={e => setFormData({ ...formData, evidenceLink: e.target.value })}
                                                placeholder="https://drive.google.com/drive/folders/..."
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 block">
                                                Catatan Tambahan (Remarks)
                                            </Label>
                                            <Textarea
                                                rows={2}
                                                className="resize-none font-medium text-xs bg-slate-50/60 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-xl p-3 focus:bg-white"
                                                value={formData.remarks || ''}
                                                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                                placeholder="Catatan operasional / no referensi PR / catatan pengiriman..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- RIGHT COLUMN: FINANCIALS & ITEMS LIST (5 COLS) --- */}
                            <div className="lg:col-span-5 space-y-6">

                                {/* Financial Summary Card */}
                                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl border border-slate-800/80 space-y-5 relative overflow-hidden">
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                                                <Calculator size={16} />
                                            </div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                                                Ringkasan Finansial
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold bg-white/10 text-blue-300 px-2.5 py-0.5 rounded-full">
                                            IDR
                                        </span>
                                    </div>

                                    {/* Direct Price & Qty Inputs (Active only if NO items in list) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                                                Harga Satuan
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                                                <Input
                                                    className={cn(
                                                        "h-10 pl-9 font-bold text-xs rounded-xl transition-all",
                                                        hasItems 
                                                            ? "bg-white/5 border-white/5 text-slate-400 cursor-not-allowed" 
                                                            : "bg-white/10 border-white/10 text-white focus:bg-white/20"
                                                    )}
                                                    value={formatNumber(formData.price)}
                                                    onChange={e => setFormData({ ...formData, price: parseNumber(e.target.value) })}
                                                    disabled={hasItems}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                                                Total Qty
                                            </label>
                                            <Input
                                                className={cn(
                                                    "h-10 font-bold text-center text-xs rounded-xl transition-all",
                                                    hasItems 
                                                        ? "bg-white/5 border-white/5 text-slate-400 cursor-not-allowed" 
                                                        : "bg-white/10 border-white/10 text-white focus:bg-white/20"
                                                )}
                                                value={formData.qty || 1}
                                                onChange={e => setFormData({ ...formData, qty: parseInt(e.target.value, 10) || 1 })}
                                                disabled={hasItems}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                                                    Total Realisasi Belanja (Gross / Aktual)
                                                </span>
                                                <p className="text-[10px] text-slate-400/80">
                                                    Disesuaikan dengan Expense Approval / Aktual
                                                </p>
                                            </div>
                                            {hasItems && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const { subtotal, otherCost } = calculateItemTotal();
                                                        setFormData(prev => ({ ...prev, otherCost, subtotal, totalVa: subtotal }));
                                                    }}
                                                    className="text-[10px] font-bold px-2.5 py-1 bg-white/10 hover:bg-white/20 text-cyan-300 rounded-lg border border-cyan-400/30 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Calculator size={11} />
                                                    Sync dari Rincian
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-mono font-bold text-sm">Rp</span>
                                            <Input
                                                className="h-12 pl-11 font-mono font-black text-lg bg-white/10 border-white/15 text-white focus:bg-white/20 rounded-xl tracking-tight"
                                                value={formatNumber(formData.subtotal || 0)}
                                                onChange={e => {
                                                    const val = parseNumber(e.target.value);
                                                    setFormData(prev => ({ ...prev, subtotal: val, totalVa: val }));
                                                }}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Items Breakdown */}
                                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                                <ShoppingCart size={15} />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                                                Rincian Barang / Items ({(formData.items || []).length})
                                            </h3>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                const currentItems = formData.items || [];
                                                setFormData({
                                                    ...formData,
                                                    items: [
                                                        ...currentItems,
                                                        { description: '', vendor: '', qty: 1, price: 0, deliveryFee: 0, insuranceFee: 0, itemDiscount: 0, shippingDiscount: 0 }
                                                    ]
                                                });
                                            }}
                                            className="text-[10px] font-black uppercase tracking-wider gap-1 h-7.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                                        >
                                            <Plus size={12} /> Tambah Item
                                        </Button>
                                    </div>

                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                        {(formData.items || []).length === 0 ? (
                                            <div className="text-center py-6 px-4 bg-slate-50/50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
                                                <Package className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                                                <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">
                                                    Belum ada rincian item
                                                </p>
                                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                                    Nominal menggunakan Harga Satuan × Qty pada ringkasan finansial di atas.
                                                </p>
                                            </div>
                                        ) : (
                                            (formData.items || []).map((item, idx) => (
                                                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/60 dark:bg-zinc-800/40 space-y-2.5 relative group hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 font-mono w-4">#{idx + 1}</span>
                                                        <Input
                                                            className="h-8.5 text-xs font-bold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-lg"
                                                            value={item.description}
                                                            placeholder="Nama barang / spesifikasi..."
                                                            onChange={e => {
                                                                const newItems = [...(formData.items || [])];
                                                                newItems[idx].description = e.target.value;
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = (formData.items || []).filter((_, i) => i !== idx);
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors shrink-0"
                                                            title="Hapus Item"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Qty</label>
                                                            <Input
                                                                className="h-8 text-xs font-bold text-center bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-lg"
                                                                value={item.qty}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].qty = parseInt(e.target.value, 10) || 1;
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Harga Satuan (Rp)</label>
                                                            <Input
                                                                className="h-8 text-xs font-bold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 rounded-lg font-mono"
                                                                value={formatNumber(item.price)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].price = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Checklist Documents */}
                                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                            <ShieldCheck size={15} />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                                            Checklist Dokumen Audit ({Object.values(formData.docs || {}).filter(Boolean).length}/7)
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {docItemsList.map((doc) => {
                                            const isChecked = !!formData.docs?.[doc.key as keyof typeof formData.docs];
                                            return (
                                                <button
                                                    key={doc.key}
                                                    type="button"
                                                    onClick={() => handleDocToggle(doc.key as any)}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-left",
                                                        isChecked
                                                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 shadow-sm"
                                                            : "bg-slate-50/60 border-slate-200/80 text-slate-400 dark:bg-zinc-850/40 dark:border-zinc-800 dark:text-zinc-500 opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 transition-colors",
                                                        isChecked ? "bg-emerald-600 text-white" : "border border-slate-300 dark:border-zinc-700"
                                                    )}>
                                                        {isChecked && <Check size={11} strokeWidth={3} />}
                                                    </div>
                                                    <span className="truncate">{doc.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </form>
                </div>

                {/* Sticky Footer */}
                <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 backdrop-blur shrink-0 flex flex-row justify-between items-center no-print">
                    <Button type="button" variant="outline" onClick={onClose} className="text-xs font-bold rounded-xl h-10 px-5">
                        Batal
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Transaksi</span>
                            <span className="text-sm font-mono font-black text-slate-900 dark:text-zinc-100">{formatIDR(formData.subtotal || 0)}</span>
                        </div>
                        <Button
                            type="submit"
                            form="recordForm"
                            className="text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 rounded-xl h-10 px-6"
                        >
                            <Save size={15} /> Simpan Perubahan
                        </Button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};
;
