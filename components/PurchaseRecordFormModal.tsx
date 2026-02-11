
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, Building2, User, Calendar, Tag, CheckCircle2, AlertCircle, Save, ShieldCheck } from 'lucide-react';
import { PurchaseRecord } from '../types';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';

interface PurchaseRecordFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<PurchaseRecord>) => void;
    initialData?: PurchaseRecord | null;
}

const formatNumber = (val: number | string | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
};

const parseNumber = (val: string) => {
    return parseInt(val.replace(/\D/g, ''), 10) || 0;
};

export const PurchaseRecordFormModal: React.FC<PurchaseRecordFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
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
                const lastNumber = parseInt(lastId.split('-').pop() || '0');
                nextNumber = lastNumber + 1;
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
            const { data: comp } = await supabase.from('companies').select('name');
            if (comp) setCompanies(comp);
            const { data: dept } = await supabase.from('departments').select('name');
            if (dept) setDepartments(dept);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                transactionId: 'Generating...',
                status: 'Pending',
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
                    prForm: false, cashAdvance: false, checkout: false, paymentSlip: false, invoice: false, expenseApproval: false, checkByRara: false
                }
            });
            generateNextTransactionId(today);
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        const items = formData.items || [];
        const itemsTotal = items.reduce((sum, item) => {
            const rowSubtotal = (Number(item.price) * Number(item.qty))
                + (Number(item.deliveryFee) || 0)
                + (Number(item.insuranceFee) || 0);
            const rowDiscounts = (Number(item.itemDiscount) || 0) + (Number(item.shippingDiscount) || 0);
            return sum + (rowSubtotal - rowDiscounts);
        }, 0);

        // Fallback to price/qty if items is empty (for backward compatibility)
        const baseTotal = items.length > 0 ? itemsTotal : (Number(formData.price) || 0) * (Number(formData.qty) || 1);

        const vat = Number(formData.vat) || 0;
        const delivery = Number(formData.deliveryFee) || 0;
        const insurance = Number(formData.insurance) || 0;
        const appFee = Number(formData.appFee) || 0;

        const otherCost = delivery + insurance + appFee;
        const subtotal = baseTotal + vat + otherCost;

        if (formData.subtotal !== subtotal || formData.otherCost !== otherCost) {
            setFormData(prev => ({ ...prev, otherCost, subtotal, totalVa: subtotal }));
        }
    }, [formData.price, formData.qty, formData.vat, formData.deliveryFee, formData.insurance, formData.appFee, formData.items]);

    if (!isOpen) return null;

    const handleDocToggle = (key: keyof PurchaseRecord['docs']) => {
        setFormData(prev => ({
            ...prev,
            docs: { ...prev.docs!, [key]: !prev.docs![key] }
        }));
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 mt-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm";
    const labelClass = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] border border-white/20 dark:border-slate-800">
                <div className="flex justify-between items-center px-10 py-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Purchase Audit Entry
                            </h2>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Certified Document Traceability</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form id="recordForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8">

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Descriptive Overview</label>
                                <textarea rows={2} className={`${inputClass} resize-none h-[54px]`} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} required placeholder="Enter primary procurement description..." />
                            </div>
                            <div>
                                <label className={labelClass}>Reference ID(s)</label>
                                <input
                                    type="text"
                                    className={`${inputClass} ${isGeneratingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={formData.transactionId || ''}
                                    onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                                    required
                                    readOnly={isGeneratingId}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Company</label>
                                <select className={inputClass} value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })}>
                                    <option value="">- {t('pilih')} -</option>
                                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className={labelClass}>Requester Name</label>
                                <input type="text" className={inputClass} value={formData.user || ''} onChange={e => setFormData({ ...formData, user: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Department</label>
                                <select className={inputClass} value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                    <option value="">- {t('pilih')} -</option>
                                    {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Vendor(s)</label>
                                <input type="text" className={inputClass} value={formData.vendor || ''} onChange={e => setFormData({ ...formData, vendor: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Payment Method</label>
                                <select
                                    className={inputClass}
                                    value={formData.paymentMethod || ''}
                                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                >
                                    <option value="">- {t('pilih')} -</option>
                                    <option value="Transfer">Transfer</option>
                                    <option value="VA">VA</option>
                                    <option value="Debit/CC">Debit/CC</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className={labelClass}>Category</label>
                                <select className={inputClass} value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                                    <option value="">- {t('pilih')} -</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software & License">Software & License</option>
                                    <option value="Cloud & Hosting">Cloud & Hosting</option>
                                    <option value="Network & Internet">Network & Internet</option>
                                    <option value="Maintenance & Support">Maintenance & Support</option>
                                    <option value="IT Services">IT Services</option>
                                    <option value="Security">Security</option>
                                    <option value="Subscription">Subscription</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Platform</label>
                                <div className="flex items-center gap-4 mt-2 h-[38px]">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="platform"
                                            value="Vendor"
                                            checked={formData.platform === 'Vendor'}
                                            onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors uppercase">Vendor</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="platform"
                                            value="Market Place"
                                            checked={formData.platform === 'Market Place'}
                                            onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors uppercase">Market</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Evidence / Drive Link</label>
                                <input
                                    type="url"
                                    className={inputClass}
                                    value={formData.evidenceLink || ''}
                                    onChange={e => setFormData({ ...formData, evidenceLink: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                    <option value="Paid">Paid (Verified)</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                <Calculator size={14} /> Financial Data Entry
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                                <div>
                                    <label className={labelClass}>Base Price</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formatNumber(formData.price)}
                                        onChange={e => setFormData({ ...formData, price: parseNumber(e.target.value) })}
                                        disabled={formData.items && formData.items.length > 0}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Qty/Items</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formatNumber(formData.qty)}
                                        onChange={e => setFormData({ ...formData, qty: parseNumber(e.target.value) })}
                                        disabled={formData.items && formData.items.length > 0}
                                        placeholder="1"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>VAT Fee (PPN)</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formatNumber(formData.vat)}
                                        onChange={e => setFormData({ ...formData, vat: parseNumber(e.target.value) })}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Delivery Fee</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formatNumber(formData.deliveryFee)}
                                        onChange={e => setFormData({ ...formData, deliveryFee: parseNumber(e.target.value) })}
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Service Fee</label>
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formatNumber(formData.appFee)}
                                        onChange={e => setFormData({ ...formData, appFee: parseNumber(e.target.value) })}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="md:col-span-5 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 mt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Tag size={12} /> Transaction Items / Invoices
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentItems = formData.items || [];
                                                setFormData({
                                                    ...formData, items: [...currentItems, {
                                                        description: '', vendor: '', qty: 1, price: 0,
                                                        deliveryFee: 0, insuranceFee: 0,
                                                        itemDiscount: 0, shippingDiscount: 0
                                                    }]
                                                });
                                            }}
                                            className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-[9px] font-bold uppercase transition-all hover:bg-blue-100"
                                        >
                                            + Add Item/Invoice
                                        </button>
                                    </div>

                                    {(formData.items || []).length > 0 ? (
                                        <div className="space-y-6">
                                            {(formData.items || []).map((item, idx) => (
                                                <div key={idx} className="p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Item/Invoice #</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. WD Caviar PURPLE PRO 10"
                                                                className={inputClass}
                                                                value={item.description}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].description = e.target.value;
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Shop/Vendor</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. WD Official Store"
                                                                className={inputClass}
                                                                value={item.vendor || ''}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].vendor = e.target.value;
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                                        <div>
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Qty</label>
                                                            <input
                                                                type="text"
                                                                placeholder="1"
                                                                className={inputClass}
                                                                value={formatNumber(item.qty)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].qty = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Unit Price</label>
                                                            <input
                                                                type="text"
                                                                placeholder="0"
                                                                className={inputClass}
                                                                value={formatNumber(item.price)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].price = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Ongkir</label>
                                                            <input
                                                                type="text"
                                                                placeholder="0"
                                                                className={inputClass}
                                                                value={formatNumber(item.deliveryFee)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].deliveryFee = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Asuransi</label>
                                                            <input
                                                                type="text"
                                                                placeholder="0"
                                                                className={inputClass}
                                                                value={formatNumber(item.insuranceFee)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].insuranceFee = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Row Diskon */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                        <div className="bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100/50 dark:border-rose-900/20">
                                                            <label className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1.5 block">Kupon Diskon Barang (-)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="0"
                                                                className={`${inputClass} !bg-white/50 border-rose-200/50 text-rose-600 font-bold`}
                                                                value={formatNumber(item.itemDiscount)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].itemDiscount = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                                                            <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 block">Gratis Ongkir (-)</label>
                                                            <input
                                                                type="text"
                                                                placeholder="0"
                                                                className={`${inputClass} !bg-white/50 border-emerald-200/50 text-emerald-600 font-bold`}
                                                                value={formatNumber(item.shippingDiscount)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].shippingDiscount = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newItems = (formData.items || []).filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, items: newItems });
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md text-rose-500 hover:text-rose-600 transition-all p-1.5 rounded-full opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 font-medium italic">No split items added. Using Base Price & Qty above.</p>
                                    )}
                                </div>

                                <div className="md:col-span-5 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-4 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Calculation</p>
                                            <p className="text-[10px] md:text-sm font-bold text-slate-600 dark:text-slate-400">Sum of all entered fields</p>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-2xl md:text-3xl font-black text-blue-600">Rp {new Intl.NumberFormat('id-ID').format(formData.subtotal || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Purchase Date</label>
                                <input type="date" className={inputClass} value={formData.purchaseDate || ''} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>Payment Date</label>
                                <input type="date" className={inputClass} value={formData.paymentDate || ''} onChange={e => {
                                    const newDate = e.target.value;
                                    setFormData(prev => ({ ...prev, paymentDate: newDate, transactionId: 'Generating...' }));
                                    generateNextTransactionId(newDate);
                                }} />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <CheckCircle2 size={14} /> Document Checklist
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries({
                                    prForm: 'PR Form',
                                    cashAdvance: 'Cash Advance',
                                    checkout: 'Checkout SS',
                                    paymentSlip: 'Payment Slip',
                                    invoice: 'Invoice(s)',
                                    expenseApproval: 'Expense Appr.',
                                    checkByRara: 'Checked By Rara'
                                }).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleDocToggle(key as any)}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${formData.docs?.[key as keyof PurchaseRecord['docs']] ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${formData.docs?.[key as keyof PurchaseRecord['docs']] ? 'bg-white text-emerald-600' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            {formData.docs?.[key as keyof PurchaseRecord['docs']] && <CheckCircle2 size={12} />}
                                        </div>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Remarks</label>
                            <textarea rows={3} className={`${inputClass} resize-none`} value={formData.remarks || ''} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="Additional record notes..." />
                        </div>
                    </form>
                </div>

                <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2.5rem] flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-8 py-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95">Discard</button>
                    <button type="submit" form="recordForm" className="px-12 py-3 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3">
                        <Save size={18} /> Commit Record
                    </button>
                </div>
            </div >
        </div >
    );
};
