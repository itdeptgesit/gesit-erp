'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, Building2, User, Calendar, Tag, CheckCircle2, AlertCircle, Save, ShieldCheck, Plus, Trash2, Receipt, ShoppingCart } from 'lucide-react';
import { PurchaseRecord } from '../types';
import { useLanguage } from '../translations';
import { supabase } from '../lib/supabaseClient';

// SHADCN UI IMPORTS
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[1400px] w-[95vw] max-h-[90vh] p-0 overflow-hidden rounded-xl border shadow-2xl bg-background flex flex-col">
                <DialogHeader className="px-8 py-6 border-b shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center border border-primary/10">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                Purchase Record
                            </DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5 opacity-60">Add or edit purchase details and documentation</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    <form id="recordForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* --- LEFT COLUMN: PROCUREMENT DETAILS (7/12) --- */}
                            <div className="lg:col-span-7 space-y-8">
                                {/* Section 1: Core Identification */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b pb-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Basic Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Description</Label>
                                            <Textarea
                                                className="min-h-[120px] resize-none font-medium text-sm bg-muted/20 border-muted-foreground/10 focus:border-primary focus:bg-background rounded-xl p-4 transition-all"
                                                value={formData.description || ''}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                required
                                                placeholder="Enter purchase description..."
                                            />
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Reference ID</Label>
                                                <Input
                                                    className={cn("font-mono font-bold h-11 bg-muted/20 border-muted-foreground/10 rounded-xl text-primary", isGeneratingId && "animate-pulse")}
                                                    value={formData.transactionId || ''}
                                                    onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                                                    required
                                                    readOnly={isGeneratingId}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Company</Label>
                                                    <Select value={formData.company || ''} onValueChange={val => setFormData({ ...formData, company: val })}>
                                                        <SelectTrigger className="font-bold h-11 border-muted-foreground/10 rounded-xl bg-muted/20">
                                                            <SelectValue placeholder={`- ${t('pilih')} -`} />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            {companies.map(c => <SelectItem key={c.name} value={c.name} className="font-bold">{c.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Status</Label>
                                                    <Select value={formData.status || 'Pending'} onValueChange={val => setFormData({ ...formData, status: val as any })}>
                                                        <SelectTrigger className="font-bold h-11 border-muted-foreground/10 rounded-xl bg-muted/20">
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="Pending" className="font-bold text-amber-600">Pending</SelectItem>
                                                            <SelectItem value="Paid" className="font-bold text-emerald-600">Paid</SelectItem>
                                                            <SelectItem value="Rejected" className="font-bold text-rose-600">Rejected</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Stakeholders & Sourcing */}
                                <div className="space-y-6 p-6 bg-muted/5 rounded-xl border">
                                    <div className="flex items-center gap-3 border-b pb-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground/70">Purchase Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Requester</Label>
                                            <Input className="font-medium h-10 border-muted-foreground/10 rounded-lg bg-background" value={formData.user || ''} onChange={e => setFormData({ ...formData, user: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Department</Label>
                                            <Select value={formData.department || ''} onValueChange={val => setFormData({ ...formData, department: val })}>
                                                <SelectTrigger className="font-medium h-10 border-muted-foreground/10 rounded-lg bg-background">
                                                    <SelectValue placeholder={`- ${t('pilih')} -`} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg">
                                                    {departments.map(d => <SelectItem key={d.name} value={d.name} className="font-medium">{d.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Vendor</Label>
                                            <Input className="font-medium h-10 border-muted-foreground/10 rounded-lg bg-background" value={formData.vendor || ''} onChange={e => setFormData({ ...formData, vendor: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Payment Method</Label>
                                            <Select value={formData.paymentMethod || ''} onValueChange={val => setFormData({ ...formData, paymentMethod: val as any })}>
                                                <SelectTrigger className="font-medium h-10 border-muted-foreground/10 rounded-lg bg-background">
                                                    <SelectValue placeholder={`- ${t('pilih')} -`} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg">
                                                    <SelectItem value="Transfer" className="font-medium">Transfer</SelectItem>
                                                    <SelectItem value="VA" className="font-medium">VA</SelectItem>
                                                    <SelectItem value="Debit/CC" className="font-medium">Debit/CC</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Technical Categorization & Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Category</Label>
                                            <Select value={formData.category || ''} onValueChange={val => setFormData({ ...formData, category: val })}>
                                                <SelectTrigger className="font-medium h-10 border-muted-foreground/10 rounded-lg bg-muted/5">
                                                    <SelectValue placeholder={`- ${t('pilih')} -`} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg">
                                                    {['Hardware', 'Accessories', 'Cloud & Hosting', 'Subscription', 'Maintenance & Support', 'IT Services'].map(cat => (
                                                        <SelectItem key={cat} value={cat} className="font-medium">{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Evidence Link</Label>
                                            <Input
                                                type="url"
                                                className="font-medium h-10 border-muted-foreground/10 rounded-lg bg-muted/5"
                                                value={formData.evidenceLink || ''}
                                                onChange={e => setFormData({ ...formData, evidenceLink: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Purchase Date</Label>
                                            <Input type="date" className="font-bold h-10 rounded-lg border-muted-foreground/10 bg-muted/5 text-sm" value={formData.purchaseDate || ''} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Payment Date</Label>
                                            <Input type="date" className="font-bold h-10 rounded-lg border-primary/20 bg-primary/5 text-primary text-sm" value={formData.paymentDate || ''} onChange={e => {
                                                const newDate = e.target.value;
                                                setFormData(prev => ({ ...prev, paymentDate: newDate, transactionId: 'Generating...' }));
                                                generateNextTransactionId(newDate);
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Remarks / Notes</Label>
                                    <Textarea
                                        rows={2}
                                        className="resize-none font-medium text-sm bg-muted/5 border-muted-foreground/10 rounded-lg p-3"
                                        value={formData.remarks || ''}
                                        onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                        placeholder="Optional notes..."
                                    />
                                </div>
                            </div>

                            {/* --- RIGHT COLUMN: FINANCIALS & DOCUMENTS (5/12) --- */}
                            <div className="lg:col-span-5 space-y-8">
                                {/* Financial Ledger Section */}
                                <div className="bg-slate-950 p-8 rounded-xl text-white shadow-xl relative overflow-hidden group border border-slate-800">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                        <Receipt size={80} />
                                    </div>
                                    <div className="relative space-y-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/20 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                                                <Calculator size={18} />
                                            </div>
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/70">Financial Summary</h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Price</Label>
                                                <div className="relative">
                                                    <Input
                                                        className="font-bold h-10 rounded-lg bg-white/5 border-white/10 pl-10 text-white text-base focus:bg-white/10"
                                                        value={formatNumber(formData.price)}
                                                        onChange={e => setFormData({ ...formData, price: parseNumber(e.target.value) })}
                                                        disabled={formData.items && formData.items.length > 0}
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">Rp</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold uppercase tracking-wider opacity-40">Qty</Label>
                                                <Input
                                                    className="font-bold text-center h-10 rounded-lg bg-white/5 border-white/10 text-white text-base focus:bg-white/10"
                                                    value={formatNumber(formData.qty)}
                                                    onChange={e => setFormData({ ...formData, qty: parseNumber(e.target.value) })}
                                                    disabled={formData.items && formData.items.length > 0}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Total Amount</p>
                                                <p className="text-3xl font-mono font-bold text-primary tracking-tighter">Rp {new Intl.NumberFormat('id-ID').format(formData.subtotal || 0)}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                                <ShieldCheck className="text-primary" size={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Item Breakdown */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <h3 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                            <ShoppingCart size={14} className="text-primary" /> Items
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const currentItems = formData.items || [];
                                                setFormData({ ...formData, items: [...currentItems, { description: '', vendor: '', qty: 1, price: 0, deliveryFee: 0, insuranceFee: 0, itemDiscount: 0, shippingDiscount: 0 }] });
                                            }}
                                            className="h-7 text-[9px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5 rounded-lg"
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Item
                                        </Button>
                                    </div>

                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {(formData.items || []).length === 0 ? (
                                            <div className="text-center py-10 bg-muted/5 rounded-xl border border-dashed border-muted-foreground/10">
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase opacity-50">No items added</p>
                                            </div>
                                        ) : (
                                            (formData.items || []).map((item, idx) => (
                                                <Card key={idx} className="rounded-xl border border-muted shadow-sm group relative overflow-hidden">
                                                    <div className="p-4 space-y-3">
                                                        <Input
                                                            className="font-bold h-8 bg-muted/30 border-none rounded-lg text-[10px] uppercase"
                                                            value={item.description}
                                                            placeholder="Item name..."
                                                            onChange={e => {
                                                                const newItems = [...(formData.items || [])];
                                                                newItems[idx].description = e.target.value;
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <Input
                                                                className="font-bold text-center h-8 bg-muted/30 border-none rounded-lg text-[10px]"
                                                                value={formatNumber(item.qty)}
                                                                onChange={e => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx].qty = parseNumber(e.target.value);
                                                                    setFormData({ ...formData, items: newItems });
                                                                }}
                                                            />
                                                            <div className="relative">
                                                                <Input
                                                                    className="font-bold h-8 bg-muted/30 border-none rounded-lg pl-8 text-[10px]"
                                                                    value={formatNumber(item.price)}
                                                                    onChange={e => {
                                                                        const newItems = [...(formData.items || [])];
                                                                        newItems[idx].price = parseNumber(e.target.value);
                                                                        setFormData({ ...formData, items: newItems });
                                                                    }}
                                                                />
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground/40">Rp</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newItems = (formData.items || []).filter((_, i) => i !== idx);
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:bg-rose-50 p-1 rounded"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Documentation Matrix */}
                                <div className="bg-emerald-500/5 p-5 rounded-xl border border-emerald-500/10 space-y-3">
                                    <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 size={14} /> Checklist / Documents
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries({
                                            prForm: 'PR Form',
                                            checkout: 'Checkout',
                                            paymentSlip: 'Slip',
                                            invoice: 'Invoice',
                                            checkByRara: 'Audited'
                                        }).map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleDocToggle(key as any)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all",
                                                    formData.docs?.[key as keyof PurchaseRecord['docs']]
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                        : 'bg-background text-muted-foreground border-muted-foreground/10 hover:bg-emerald-50/50'
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-3 h-3 rounded flex items-center justify-center border",
                                                    formData.docs?.[key as keyof PurchaseRecord['docs']] ? 'bg-white text-emerald-600 border-white' : 'bg-muted/50 border-muted'
                                                )}>
                                                    {formData.docs?.[key as keyof PurchaseRecord['docs']] && <CheckCircle2 size={8} strokeWidth={4} />}
                                                </div>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="px-8 py-4 border-t shrink-0 gap-3 sm:justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 transition-all">
                        Cancel
                    </Button>
                    <Button type="submit" form="recordForm" className="rounded-xl h-10 px-8 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <Save size={14} className="mr-2" /> Save Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

