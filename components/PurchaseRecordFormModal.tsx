
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

export const PurchaseRecordFormModal: React.FC<PurchaseRecordFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<PurchaseRecord>>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

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
    } else {
      setFormData({
        transactionId: `TR-${Date.now().toString().slice(-5)}`,
        status: 'Unpaid',
        qty: 1,
        price: 0,
        vat: 0,
        deliveryFee: 0,
        insurance: 0,
        appFee: 0,
        otherCost: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        docs: {
            prForm: false, cashAdvance: false, checkout: false, paymentSlip: false, invoice: false, expenseApproval: false, checkByRara: false
        }
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
      const price = Number(formData.price) || 0;
      const qty = Number(formData.qty) || 1;
      const vat = Number(formData.vat) || 0;
      const delivery = Number(formData.deliveryFee) || 0;
      const insurance = Number(formData.insurance) || 0;
      const appFee = Number(formData.appFee) || 0;
      
      const otherCost = delivery + insurance + appFee;
      const subtotal = (price * qty) + vat + otherCost;
      
      if (formData.subtotal !== subtotal || formData.otherCost !== otherCost) {
          setFormData(prev => ({ ...prev, otherCost, subtotal, totalVa: subtotal }));
      }
  }, [formData.price, formData.qty, formData.vat, formData.deliveryFee, formData.insurance, formData.appFee]);

  if (!isOpen) return null;

  const handleDocToggle = (key: keyof PurchaseRecord['docs']) => {
      setFormData(prev => ({
          ...prev,
          docs: { ...prev.docs!, [key]: !prev.docs![key] }
      }));
  };

  const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all font-medium";
  const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] border border-white/20 dark:border-slate-800">
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Purchase Audit Terminal
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Document Verification</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <form id="recordForm" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Summary Description</label>
                        <textarea rows={2} className={`${inputClass} resize-none`} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Enter purchase details..." />
                    </div>
                    <div>
                        <label className={labelClass}>Reference ID(s)</label>
                        <input type="text" className={inputClass} value={formData.transactionId || ''} onChange={e => setFormData({...formData, transactionId: e.target.value})} required />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <label className={labelClass}>Requester Name</label>
                        <input type="text" className={inputClass} value={formData.user || ''} onChange={e => setFormData({...formData, user: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClass}>Department</label>
                        <select className={inputClass} value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>
                            <option value="">- {t('pilih')} -</option>
                            {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Vendor(s)</label>
                        <input type="text" className={inputClass} value={formData.vendor || ''} onChange={e => setFormData({...formData, vendor: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClass}>Platform</label>
                        <input type="text" className={inputClass} value={formData.platform || ''} onChange={e => setFormData({...formData, platform: e.target.value})} />
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Calculator size={14} /> Financial Data Entry
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className={labelClass}>Base Price</label>
                            <input type="number" className={inputClass} value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className={labelClass}>Qty/Items</label>
                            <input type="number" className={inputClass} value={formData.qty || 1} onChange={e => setFormData({...formData, qty: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className={labelClass}>Delivery Fee</label>
                            <input type="number" className={inputClass} value={formData.deliveryFee || 0} onChange={e => setFormData({...formData, deliveryFee: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className={labelClass}>Service Fee</label>
                            <input type="number" className={inputClass} value={formData.appFee || 0} onChange={e => setFormData({...formData, appFee: Number(e.target.value)})} />
                        </div>
                        <div className="md:col-span-4 flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-4">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center">
                                     <ShieldCheck size={24} />
                                 </div>
                                 <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Calculation</p>
                                     <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Sum of all entered fields</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-3xl font-black text-blue-600">Rp {new Intl.NumberFormat('id-ID').format(formData.subtotal || 0)}</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>Status</label>
                        <select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="Paid">Paid (Verified)</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Purchase Date</label>
                        <input type="date" className={inputClass} value={formData.purchaseDate || ''} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClass}>Payment Date</label>
                        <input type="date" className={inputClass} value={formData.paymentDate || ''} onChange={e => setFormData({...formData, paymentDate: e.target.value})} />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <CheckCircle2 size={14} /> Document Checklist
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    <textarea rows={3} className={`${inputClass} resize-none`} value={formData.remarks || ''} onChange={e => setFormData({...formData, remarks: e.target.value})} placeholder="Additional record notes..." />
                </div>
            </form>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2.5rem] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">Cancel</button>
            <button type="submit" form="recordForm" className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2">
                <Save size={16} /> Save Record
            </button>
        </div>
      </div>
    </div>
  );
};
