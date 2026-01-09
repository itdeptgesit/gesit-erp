
'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Company } from '../types';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Company>) => void;
  initialData?: Company | null;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Company>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ code: '', name: '', address: '', phone: '', website: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 mt-1 bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Company' : 'Add New Company'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1">
                    <label className={labelClass}>Code <span className="text-red-500">*</span></label>
                    <input 
                        type="text" required className={inputClass} 
                        value={formData.code || ''} 
                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="e.g. GST"
                        maxLength={8}
                    />
                </div>
                <div className="col-span-2">
                    <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
                    <input 
                        type="text" required className={inputClass} 
                        value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. PT Gesit ERP Indonesia"
                    />
                </div>
            </div>
            
            <div>
                <label className={labelClass}>Address</label>
                <textarea 
                    required rows={3} className={inputClass} 
                    value={formData.address || ''} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                />
            </div>
            <div>
                <label className={labelClass}>Phone</label>
                <input 
                    type="text" className={inputClass} 
                    value={formData.phone || ''} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                />
            </div>
            <div>
                <label className={labelClass}>Website</label>
                <input 
                    type="text" className={inputClass} 
                    value={formData.website || ''} 
                    onChange={e => setFormData({...formData, website: e.target.value})}
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 text-sm font-medium">Save Company</button>
            </div>
        </form>
      </div>
    </div>
  );
};
