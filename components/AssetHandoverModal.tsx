'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, User, Building2, Phone, Calendar, Info, ShieldCheck } from 'lucide-react';
import { ITAsset, UserAccount } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportAssetHandoverBAST } from '../lib/handoverPdfExport';

interface AssetHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ITAsset | null;
  currentUser: UserAccount | null;
}

export const AssetHandoverModal: React.FC<AssetHandoverModalProps> = ({ isOpen, onClose, asset, currentUser }) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientDept, setRecipientDept] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [itSupportName, setItSupportName] = useState('');
  const [handoverDate, setHandoverDate] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      setRecipientName(asset.user || '');
      setRecipientDept(asset.department || '');
      setRecipientPhone('');
      setItSupportName(currentUser?.fullName || 'IT Support');
      
      // Default to today's local date (YYYY-MM-DD)
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      setHandoverDate(localToday.toISOString().split('T')[0]);
    }
  }, [isOpen, asset, currentUser]);

  if (!isOpen || !asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName) return;

    exportAssetHandoverBAST(asset, {
      recipientName,
      recipientDept,
      recipientPhone,
      itSupportName,
      handoverDate
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base leading-none">Form Serah Terima Aset</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Berita Acara (BAST) Generator</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            
            {/* Asset Summary Badge */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 rounded-xl flex items-start gap-3">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-0.5">DETAIL ASET YANG DISERAHKAN</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm block truncate">{asset.item}</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  <span>Tag: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{asset.assetId}</strong></span>
                  {asset.serialNumber && <span>S/N: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{asset.serialNumber}</strong></span>}
                  {asset.brand && <span>Brand: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{asset.brand}</strong></span>}
                </div>
              </div>
            </div>

            {/* Recipient Details Section */}
            <div className="space-y-4">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">IDENTITAS PENERIMA (PIHAK KEDUA)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Nama Penerima <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <Input 
                      placeholder="Masukkan nama penerima..."
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      required
                      className="pl-9 h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Departemen</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <Input 
                      placeholder="Masukkan departemen..."
                      value={recipientDept}
                      onChange={e => setRecipientDept(e.target.value)}
                      className="pl-9 h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Kontak / No HP</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <Input 
                    placeholder="Masukkan kontak penerima (opsional)..."
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    className="pl-9 h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 font-semibold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Handover Details Section */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">DETAIL PENYERAHAN (PIHAK PERTAMA)</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">IT Support / Penyerah <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <Input 
                      placeholder="Nama IT Support..."
                      value={itSupportName}
                      onChange={e => setItSupportName(e.target.value)}
                      required
                      className="pl-9 h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Tanggal Handover <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <Input 
                      type="date"
                      value={handoverDate}
                      onChange={e => setHandoverDate(e.target.value)}
                      required
                      className="pl-9 h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 font-semibold text-xs text-slate-700 dark:text-zinc-200"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 py-5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-bold uppercase text-[10px] tracking-widest h-11 px-5 border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!recipientName}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-lg shadow-blue-500/20"
            >
              <FileText size={14} className="mr-2" />
              Download BAST (PDF)
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
