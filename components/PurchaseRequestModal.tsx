'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, ShoppingBag, ShieldCheck, Info } from 'lucide-react';
import { PurchasePlan, UserAccount } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PurchaseRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<PurchasePlan>) => void;
    currentUserName?: string;
    currentUser?: UserAccount | null;
}

export const PurchaseRequestModal: React.FC<PurchaseRequestModalProps> = ({ isOpen, onClose, onSubmit, currentUserName, currentUser }) => {
    const [formData, setFormData] = useState<Partial<PurchasePlan>>({
        requester: currentUser?.username || currentUserName || 'Staff',
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Approved',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
    });

    useEffect(() => {
        if (isOpen && currentUser) {
            // Smart Routing Logic: Determine starting status based on hierarchy
            let initialStatus = 'Approved'; // Default jika tidak ada hierarki
            if (currentUser.supervisorId) {
                initialStatus = 'Pending Supervisor';
            } else if (currentUser.managerId) {
                initialStatus = 'Pending Manager';
            }

            setFormData(prev => ({
                ...prev,
                requester: currentUser.username,
                status: initialStatus as any
            }));
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleChange = (field: keyof PurchasePlan, value: string | number) => {
        let newData = { ...formData, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
            const qty = field === 'quantity' ? Number(value) : (formData.quantity || 0);
            const price = field === 'unitPrice' ? Number(value) : (formData.unitPrice || 0);
            newData.totalPrice = qty * price;
        }
        setFormData(newData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all font-bold placeholder:text-slate-400 shadow-none";
    const labelClass = "block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Procurement Request</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authorization Terminal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="purchaseForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-inner">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400" />
                                <div>
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Routing Status</p>
                                    <p className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">{formData.status}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Requester Account</p>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{formData.requester}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Item Identity</label>
                                <Input className={inputClass} value={formData.item || ''} onChange={(e) => handleChange('item', e.target.value)} placeholder="e.g. Dell PowerEdge R750 Server" required />
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Technical Requirements</label>
                                <Textarea rows={3} className={`${inputClass} resize-none min-h-[5rem]`} value={formData.specs || ''} onChange={(e) => handleChange('specs', e.target.value)} placeholder="Hardware configuration, CPU, RAM, Storage, Model number..." required />
                            </div>

                            <div>
                                <label className={labelClass}>Market Vendor</label>
                                <Input className={inputClass} value={formData.vendor || ''} onChange={(e) => handleChange('vendor', e.target.value)} placeholder="Preferred supplier" />
                            </div>

                            <div>
                                <label className={labelClass}>Timeline</label>
                                <div className="relative">
                                    <Input type="date" className={`${inputClass} pr-10`} value={formData.requestDate || ''} readOnly />
                                    <Calendar size={14} className="absolute right-3 top-4 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Unit Count</label>
                                <Input type="number" min="1" className={inputClass} value={formData.quantity || 1} onChange={(e) => handleChange('quantity', e.target.value)} required />
                            </div>

                            <div>
                                <label className={labelClass}>Estimated Unit Value (IDR)</label>
                                <Input type="number" min="0" className={inputClass} value={formData.unitPrice || ''} onChange={(e) => handleChange('unitPrice', e.target.value)} required placeholder="0" />
                            </div>

                            <div className="md:col-span-2 bg-slate-900 dark:bg-slate-950 p-6 rounded-xl border border-white/5 flex justify-between items-center shadow-lg">
                                <div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1">Total Commitment</span>
                                    <span className="text-2xl font-black text-blue-500 tracking-tighter italic">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(formData.totalPrice || 0)}
                                    </span>
                                </div>
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                    <ShoppingBag size={20} className="text-slate-600" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Strategic Justification</label>
                                <Textarea rows={3} className={`${inputClass} resize-none italic min-h-[5rem]`} value={formData.justification || ''} onChange={(e) => handleChange('justification', e.target.value)} placeholder="Why is this investment necessary for operations?..." required />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 shadow-inner">
                            <Info size={16} className="text-slate-400 mt-1 shrink-0" />
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                Requests are routed strictly based on organizational hierarchy. Supervisors and Managers authorize the procurement node directly.
                            </p>
                        </div>
                    </form>
                </div>

                <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" form="purchaseForm" className="min-w-[150px]">
                        Commit Request
                    </Button>
                </div>
            </div>
        </div>
    );
};
