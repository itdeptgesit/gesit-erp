
'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Department {
    id: number;
    name: string;
    head: string;
    memberCount: number;
    description: string;
}

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Department>) => void;
  initialData?: Department | null;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Department>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', head: '', description: '', memberCount: 0 });
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
          <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Department' : 'Add New Department'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className={labelClass}>Department Name</label>
                <input 
                    type="text" required className={inputClass} 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>
            <div>
                <label className={labelClass}>Head of Department</label>
                <input 
                    type="text" className={inputClass} 
                    value={formData.head || ''} 
                    onChange={e => setFormData({...formData, head: e.target.value})}
                />
            </div>
            <div>
                <label className={labelClass}>Member Count</label>
                <input 
                    type="number" className={inputClass} 
                    value={formData.memberCount || 0} 
                    onChange={e => setFormData({...formData, memberCount: Number(e.target.value)})}
                />
            </div>
            <div>
                <label className={labelClass}>Description</label>
                <textarea 
                    rows={3} className={inputClass} 
                    value={formData.description || ''} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 text-sm font-medium">Save Department</button>
            </div>
        </form>
      </div>
    </div>
  );
};
