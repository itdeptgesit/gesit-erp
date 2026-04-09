
'use client';

import React, { useState, useEffect } from 'react';
import { X, Layers, Tag, Type } from 'lucide-react';
import { AssetCategory } from '../types';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<AssetCategory>) => void;
  initialData?: AssetCategory | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<AssetCategory>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', code: '', description: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600";
  const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-300 flex flex-col border border-white/20 dark:border-slate-800">
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                {initialData ? 'Update Category' : 'New Category'}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Classification Meta</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
                <label className={labelClass}>Category Name <span className="text-red-500">*</span></label>
                <div className="relative">
                    <input 
                        type="text" required className={`${inputClass} pl-10`} 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Workstation PC"
                    />
                    <Layers size={14} className="absolute left-3.5 top-4 text-slate-400" />
                </div>
            </div>
            
            <div>
                <label className={labelClass}>Cluster Code (Short)</label>
                <div className="relative">
                    <input 
                        type="text" className={`${inputClass} pl-10`} 
                        value={formData.code || ''} 
                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="e.g. WPC"
                        maxLength={5}
                    />
                    <Tag size={14} className="absolute left-3.5 top-4 text-slate-400" />
                </div>
            </div>

            <div>
                <label className={labelClass}>Brief Definition</label>
                <div className="relative">
                    <textarea 
                        rows={3} className={`${inputClass} pl-10 resize-none`} 
                        value={formData.description || ''} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Purpose of this category..."
                    />
                    <Type size={14} className="absolute left-3.5 top-4 text-slate-400" />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95">Save Registry</button>
            </div>
        </form>
      </div>
    </div>
  );
};
