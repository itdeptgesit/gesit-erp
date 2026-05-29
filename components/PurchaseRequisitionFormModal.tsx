'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, FileText, Plus, Trash2, Shield, Info, DollarSign } from 'lucide-react';
import { PurchaseRequisition, PurchaseRequisitionItem, ITRecommendationItem, UserAccount } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface PurchaseRequisitionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<PurchaseRequisition>) => void;
    currentUser: UserAccount | null;
    allUsers: UserAccount[];
}

export const PurchaseRequisitionFormModal: React.FC<PurchaseRequisitionFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    currentUser,
    allUsers
}) => {
    // Local form states
    const [department, setDepartment] = useState('');
    const [paidTo, setPaidTo] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [notes, setNotes] = useState('');
    const [category, setCategory] = useState('');
    
    // Requested items list
    const [reqItems, setReqItems] = useState<PurchaseRequisitionItem[]>([
        { no: 1, description: '', qty: 1 }
    ]);
    
    // IT Recommendation items list
    const [recItems, setRecItems] = useState<ITRecommendationItem[]>([
        { no: 1, description: '', qty: 1, vendor: '', price: 0 }
    ]);

    // Approver selections
    const [supervisorId, setSupervisorId] = useState('');
    const [vpId, setVpId] = useState('');
    const [financeId, setFinanceId] = useState('');
    const [accountingId, setAccountingId] = useState('');

    useEffect(() => {
        if (isOpen && currentUser) {
            setDepartment(currentUser.department || 'IT');
            setPaidTo('');
            setBankAccount('');
            setNotes('');
            setCategory('');
            setReqItems([{ no: 1, description: '', qty: 1 }]);
            setRecItems([{ no: 1, description: '', qty: 1, vendor: '', price: 0 }]);

            // Pre-select Supervisor
            if (currentUser.supervisorId) {
                setSupervisorId(currentUser.supervisorId);
            } else if (currentUser.managerId) {
                setSupervisorId(currentUser.managerId);
            } else {
                // Default supervisor to first management/admin user
                const defaultSpv = allUsers.find(u => u.groups.includes('MANAGEMENT') || u.role === 'Admin');
                setSupervisorId(defaultSpv ? String(defaultSpv.id) : '');
            }

            // Pre-select VP based on Department
            const deptLower = (currentUser.department || '').toLowerCase().trim();
            const isOperations = deptLower.includes('it') || deptLower.includes('gnr') || deptLower.includes('trading') || deptLower.includes('prop') || deptLower.includes('rheem') || deptLower.includes('aams') || deptLower.includes('foundation');
            
            if (isOperations) {
                // Target VP Logistic
                // Look for admin or management user in IT
                const vpLogisticUser = allUsers.find(u => (u.department || '').toLowerCase().includes('it') && (u.groups.includes('MANAGEMENT') || u.role === 'Admin'));
                setVpId(vpLogisticUser ? String(vpLogisticUser.id) : '');
            } else {
                // Target VP HR
                // Look for user in HRL
                const vpHrUser = allUsers.find(u => (u.department || '').toLowerCase().includes('hrl') && (u.groups.includes('MANAGEMENT') || u.role === 'Admin' || u.jobTitle === 'Manager'));
                setVpId(vpHrUser ? String(vpHrUser.id) : '');
            }

            // Pre-select Finance (users in Finance Accounting department)
            const financeUser = allUsers.find(u => (u.department || '').toLowerCase().includes('finance') || (u.jobTitle || '').toLowerCase().includes('finance'));
            setFinanceId(financeUser ? String(financeUser.id) : '');

            // Pre-select Accounting (users in Finance Accounting department)
            const accountingUser = allUsers.find(u => (u.department || '').toLowerCase().includes('accounting') || (u.jobTitle || '').toLowerCase().includes('accounting'));
            setAccountingId(accountingUser ? String(accountingUser.id) : (financeUser ? String(financeUser.id) : ''));
        }
    }, [isOpen, currentUser, allUsers]);

    if (!isOpen) return null;

    // Requested Items Helpers
    const handleAddReqItem = () => {
        setReqItems(prev => [...prev, { no: prev.length + 1, description: '', qty: 1 }]);
    };

    const handleRemoveReqItem = (idx: number) => {
        if (reqItems.length === 1) return;
        const newItems = reqItems.filter((_, i) => i !== idx).map((item, i) => ({ ...item, no: i + 1 }));
        setReqItems(newItems);
    };

    const handleReqItemChange = (idx: number, field: keyof PurchaseRequisitionItem, value: any) => {
        const newItems = [...reqItems];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setReqItems(newItems);
    };

    // IT Recommendation Helpers
    const handleAddRecItem = () => {
        setRecItems(prev => [...prev, { no: prev.length + 1, description: '', qty: 1, vendor: '', price: 0 }]);
    };

    const handleRemoveRecItem = (idx: number) => {
        if (recItems.length === 1) return;
        const newItems = recItems.filter((_, i) => i !== idx).map((item, i) => ({ ...item, no: i + 1 }));
        setRecItems(newItems);
    };

    const handleRecItemChange = (idx: number, field: keyof ITRecommendationItem, value: any) => {
        const newItems = [...recItems];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setRecItems(newItems);
    };

    // Calculate Grand Total
    const grandTotal = recItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Filter out empty rows
        const filteredReqItems = reqItems.filter(item => item.description.trim() !== '');
        const filteredRecItems = recItems.filter(item => item.description.trim() !== '');

        if (!category) {
            alert('Please select a category first.');
            return;
        }

        if (filteredReqItems.length === 0) {
            alert('Please add at least one requested item.');
            return;
        }

        const payload: Partial<PurchaseRequisition> = {
            requesterUsername: currentUser?.username || 'Staff',
            requesterFullname: currentUser?.fullName || 'IT Staff',
            department: department,
            requestDate: new Date().toISOString().split('T')[0],
            paidTo: paidTo,
            bankAccount: bankAccount,
            requestedItems: filteredReqItems,
            itRecommendations: filteredRecItems,
            notes: notes,
            grandTotal: grandTotal,
            status: 'Pending Supervisor',
            category: category,
            supervisorId: supervisorId || null,
            supervisorName: allUsers.find(u => String(u.id) === supervisorId)?.fullName || null,
            vpId: vpId || null,
            vpName: allUsers.find(u => String(u.id) === vpId)?.fullName || null,
            financeId: financeId || null,
            financeName: allUsers.find(u => String(u.id) === financeId)?.fullName || null,
            accountingId: accountingId || null,
            accountingName: allUsers.find(u => String(u.id) === accountingId)?.fullName || null
        };

        onSubmit(payload);
    };

    const labelClass = "block text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5";
    const inputClass = "w-full bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-1 focus-visible:ring-primary/20 text-xs";

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-4xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] border border-slate-200 dark:border-zinc-800">
                
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 text-white rounded-md shadow-lg">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Formulir PR Material Support IT</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Create Purchase Requisition Document</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form id="prFormSubmit" onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* Requester Metadata Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className={labelClass}>Nama Pemohon</label>
                                <Input className={inputClass} value={currentUser?.fullName || ''} disabled />
                            </div>
                            <div>
                                <label className={labelClass}>Departemen</label>
                                <Input className={inputClass} value={department} onChange={e => setDepartment(e.target.value)} required />
                            </div>
                            <div>
                                <label className={labelClass}>Tanggal Request</label>
                                <Input className={inputClass} value={new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} disabled />
                            </div>
                            <div>
                                <label className={labelClass}>Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 h-9 text-xs">
                                        <SelectValue placeholder="Select an item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Hardware">Hardware</SelectItem>
                                        <SelectItem value="Accessories">Accessories</SelectItem>
                                        <SelectItem value="Cloud & Hosting">Cloud & Hosting</SelectItem>
                                        <SelectItem value="Subscription">Subscription</SelectItem>
                                        <SelectItem value="Maintenance & Support">Maintenance & Support</SelectItem>
                                        <SelectItem value="IT Services">IT Services</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Payment Target Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-zinc-800/30 p-5 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                            <div>
                                <label className={labelClass}>Paid To (Penerima Dana)</label>
                                <Input className={inputClass} placeholder="e.g. Bendry (Tokopedia)" value={paidTo} onChange={e => setPaidTo(e.target.value)} required />
                            </div>
                            <div>
                                <label className={labelClass}>No. Rekening / Bank</label>
                                <Input className={inputClass} placeholder="e.g. 3080 277 368 – BCA" value={bankAccount} onChange={e => setBankAccount(e.target.value)} required />
                            </div>
                        </div>

                        {/* TABLE 1: Permohonan dari Pengguna */}
                        <div>
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-zinc-800 pb-2">
                                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">1. Permohonan dari Pengguna</h3>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddReqItem} className="text-[10px] h-7 font-bold uppercase tracking-wider">
                                    <Plus size={12} className="mr-1" /> Add Row
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {reqItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="w-8 text-center text-xs font-bold text-slate-400 font-mono">{idx + 1}</div>
                                        <div className="flex-1">
                                            <Input
                                                className={inputClass}
                                                placeholder="Deskripsi Barang / Asset"
                                                value={item.description}
                                                onChange={e => handleReqItemChange(idx, 'description', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                min="1"
                                                className={inputClass}
                                                placeholder="Qty"
                                                value={item.qty}
                                                onChange={e => handleReqItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveReqItem(idx)}
                                            disabled={reqItems.length === 1}
                                            className="h-8 w-8 text-slate-400 hover:text-rose-500"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TABLE 2: Rekomendasi oleh IT */}
                        <div>
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-zinc-800 pb-2">
                                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest">2. Rekomendasi oleh IT (Untuk Purchase)</h3>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddRecItem} className="text-[10px] h-7 font-bold uppercase tracking-wider">
                                    <Plus size={12} className="mr-1" /> Add Row
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {recItems.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-3 items-center animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="col-span-1 text-center text-xs font-bold text-slate-400 font-mono">{idx + 1}</div>
                                        
                                        <div className="col-span-4">
                                            <Input
                                                className={inputClass}
                                                placeholder="Rekomendasi Barang / Spesifikasi"
                                                value={item.description}
                                                onChange={e => handleRecItemChange(idx, 'description', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-1.5 col-span-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                className={inputClass}
                                                placeholder="Qty"
                                                value={item.qty}
                                                onChange={e => handleRecItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                className={inputClass}
                                                placeholder="Vendor"
                                                value={item.vendor}
                                                onChange={e => handleRecItemChange(idx, 'vendor', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                className={inputClass}
                                                placeholder="Harga Satuan"
                                                value={item.price || ''}
                                                onChange={e => handleRecItemChange(idx, 'price', parseInt(e.target.value, 10) || 0)}
                                                required
                                            />
                                        </div>
                                        <div className="col-span-1 text-right text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
                                            {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format((item.price || 0) * (item.qty || 1))}
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveRecItem(idx)}
                                                disabled={recItems.length === 1}
                                                className="h-8 w-8 text-slate-400 hover:text-rose-500"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Catatan / Notes */}
                        <div>
                            <label className={labelClass}>Catatan Tambahan</label>
                            <Textarea
                                rows={3}
                                className="w-full bg-slate-50/50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 focus-visible:ring-1 focus-visible:ring-primary/20 text-xs resize-none"
                                placeholder="Tulis catatan, e.g. Kabel Cat5 & Cat6 Dahua 305m : untuk Line Telepon & Data (F&A)..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Grand Total Commit */}
                        <div className="bg-slate-900 dark:bg-zinc-950 p-6 rounded-xl border border-white/5 flex justify-between items-center shadow-lg">
                            <div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1">Grand Total Commitment</span>
                                <span className="text-2xl font-black text-blue-500 tracking-tighter italic font-mono">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)}
                                </span>
                            </div>
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                <DollarSign size={20} className="text-blue-500" />
                            </div>
                        </div>

                        {/* Workflow Approvers Routing Options */}
                        <div className="border-t border-slate-100 dark:border-zinc-800 pt-6">
                            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield size={14} className="text-blue-600" /> Approval Routing Tree
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50/30 dark:bg-zinc-900/30 p-5 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                                
                                {/* 1. Atasan Langsung */}
                                <div>
                                    <label className={labelClass}>Atasan Langsung</label>
                                    <Select value={supervisorId} onValueChange={setSupervisorId}>
                                        <SelectTrigger className="w-full h-8 text-[11px] font-medium border-none bg-slate-100 dark:bg-zinc-800">
                                            <SelectValue placeholder="Select Supervisor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allUsers.filter(u => u.role !== 'User' || u.groups.includes('MANAGEMENT')).map(u => (
                                                <SelectItem key={u.id} value={String(u.id)} className="text-[11px] font-medium">
                                                    {u.fullName} ({u.jobTitle || 'SPV'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 2. VP HR / Logistic */}
                                <div>
                                    <label className={labelClass}>VP HR & Logistic</label>
                                    <Select value={vpId} onValueChange={setVpId}>
                                        <SelectTrigger className="w-full h-8 text-[11px] font-medium border-none bg-slate-100 dark:bg-zinc-800">
                                            <SelectValue placeholder="Select VP" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allUsers.filter(u => u.groups.includes('MANAGEMENT') || u.role === 'Admin').map(u => (
                                                <SelectItem key={u.id} value={String(u.id)} className="text-[11px] font-medium">
                                                    {u.fullName} (VP / {u.department || 'MGMT'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 3. Finance */}
                                <div>
                                    <label className={labelClass}>Finance</label>
                                    <Select value={financeId} onValueChange={setFinanceId}>
                                        <SelectTrigger className="w-full h-8 text-[11px] font-medium border-none bg-slate-100 dark:bg-zinc-800">
                                            <SelectValue placeholder="Select Finance" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allUsers.map(u => (
                                                <SelectItem key={u.id} value={String(u.id)} className="text-[11px] font-medium">
                                                    {u.fullName} ({u.department || 'Finance'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 4. Accounting */}
                                <div>
                                    <label className={labelClass}>Accounting</label>
                                    <Select value={accountingId} onValueChange={setAccountingId}>
                                        <SelectTrigger className="w-full h-8 text-[11px] font-medium border-none bg-slate-100 dark:bg-zinc-800">
                                            <SelectValue placeholder="Select Accounting" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allUsers.map(u => (
                                                <SelectItem key={u.id} value={String(u.id)} className="text-[11px] font-medium">
                                                    {u.fullName} ({u.department || 'Accounting'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>
                        </div>

                        {/* Notice Box */}
                        <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-lg border border-slate-100 dark:border-zinc-800 flex items-start gap-4 shadow-inner">
                            <Info size={16} className="text-slate-400 mt-1 shrink-0" />
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                                Submitting this request initiates the multi-stage electronic approval flow. The workflow runs sequentially: Atasan Langsung → VP HR/Logistic → Finance → Accounting. You can track status and download the formal signed PDF at any time.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer Buttons */}
                <div className="px-8 py-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" form="prFormSubmit" className="min-w-[150px]">
                        Submit Request
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
