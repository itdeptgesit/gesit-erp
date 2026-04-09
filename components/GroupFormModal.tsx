
'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { UserGroup } from '../types';
import { APP_MENU_STRUCTURE } from '../constants';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserGroup) => void;
  initialData?: UserGroup | null;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<UserGroup>({
      id: '',
      name: '',
      description: '',
      allowedMenus: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ id: '', name: '', description: '', allowedMenus: ['dashboard'] });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple ID generation if empty
    const submission = {
        ...formData,
        id: formData.id || formData.name.replace(/\s+/g, '-').toUpperCase()
    };
    onSubmit(submission);
    onClose();
  };

  const toggleMenu = (menuId: string) => {
      setFormData(prev => {
          const current = prev.allowedMenus;
          if (current.includes(menuId)) {
              return { ...prev, allowedMenus: current.filter(id => id !== menuId) };
          } else {
              return { ...prev, allowedMenus: [...current, menuId] };
          }
      });
  };

  const parentMenus = APP_MENU_STRUCTURE.filter(m => !m.parentId);
  
  const inputClass = "w-full border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 mt-1 bg-white dark:bg-slate-800 dark:text-white";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-800">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {initialData ? 'Edit Access Group' : 'New Access Group'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Define menu visibility and access policies</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className={labelClass}>Group Name <span className="text-red-500">*</span></label>
                    <input 
                        type="text" required className={inputClass} 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. IT Support"
                    />
                </div>
                <div>
                    <label className={labelClass}>Description</label>
                    <input 
                        type="text" className={inputClass} 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Purpose of this group"
                    />
                </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-widest text-[10px]">Menu Access Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {parentMenus.map(parent => {
                        const children = APP_MENU_STRUCTURE.filter(m => m.parentId === parent.id);
                        const isParentChecked = formData.allowedMenus.includes(parent.id);

                        return (
                            <div key={parent.id} className="border border-gray-200 dark:border-slate-800 rounded-xl p-3 bg-gray-50/50 dark:bg-slate-800/40">
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isParentChecked ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600'}`}>
                                        {isParentChecked && <Check size={14} />}
                                    </div>
                                    <input type="checkbox" className="hidden" 
                                        checked={isParentChecked}
                                        onChange={() => toggleMenu(parent.id)}
                                    />
                                    <span className="font-bold text-gray-800 dark:text-slate-200 text-xs uppercase">{parent.label}</span>
                                </label>

                                {children.length > 0 && (
                                    <div className="ml-7 space-y-2 border-l-2 border-gray-200 dark:border-slate-700 pl-3">
                                        {children.map(child => {
                                            const isChildChecked = formData.allowedMenus.includes(child.id);
                                            return (
                                                <label key={child.id} className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChildChecked ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600'}`}>
                                                        {isChildChecked && <Check size={10} />}
                                                    </div>
                                                    <input type="checkbox" className="hidden"
                                                        checked={isChildChecked}
                                                        onChange={() => toggleMenu(child.id)}
                                                    />
                                                    <span className="text-[11px] font-medium text-gray-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">{child.label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 text-sm font-bold transition-all">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-bold shadow-lg shadow-brand-500/20 transition-all">Save Group Policy</button>
            </div>
        </form>
      </div>
    </div>
  );
};
