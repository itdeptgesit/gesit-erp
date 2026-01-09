
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Layers, Pencil, Trash2, RefreshCcw, Tag, FileText } from 'lucide-react';
import { CategoryFormModal } from './CategoryFormModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { AssetCategory } from '../types';
import { supabase } from '../lib/supabaseClient';

export const MasterCategory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<AssetCategory | null>(null);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('asset_categories').select('*').order('name', { ascending: true });
    if (!error && data) {
        setCategories(data as AssetCategory[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: AssetCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteCategory) return;
    setIsProcessing(true);
    try {
        const { error } = await supabase.from('asset_categories').delete().eq('id', deleteCategory.id);
        if (error) throw error;
        await fetchCategories();
        setDeleteCategory(null);
    } catch (err: any) {
        alert("Failed to delete record: " + err.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSubmit = async (data: Partial<AssetCategory>) => {
    if (editingCategory) {
        await supabase.from('asset_categories').update(data).eq('id', editingCategory.id);
    } else {
        await supabase.from('asset_categories').insert([data]);
    }
    fetchCategories();
  };

  return (
    <div className="animate-in fade-in duration-300 pb-10 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Master Categories</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Classification Hierarchy Management</p>
        </div>
        <div className="flex gap-2">
            <button onClick={fetchCategories} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all">
                <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button 
                onClick={handleAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-blue-700 transition-all shadow-sm active:scale-95"
            >
                <Plus size={16} /> New Category
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
             <div className="relative max-w-md">
                <input 
                    type="text" 
                    placeholder="Search classification..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 font-medium transition-all text-slate-900 dark:text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
             </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 w-12 text-center">ID</th>
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Category Name</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {isLoading ? (
                        <tr><td colSpan={5} className="text-center py-20"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
                    ) : filteredCategories.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-20 text-slate-300 dark:text-slate-700 text-xs font-medium uppercase tracking-widest">No entries found.</td></tr>
                    ) : filteredCategories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all group">
                            <td className="px-6 py-4 text-slate-300 dark:text-slate-700 font-mono text-xs text-center">{cat.id}</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700 uppercase tracking-tighter">
                                    {cat.code || 'N/A'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                                        <Layers size={16} />
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">{cat.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed truncate max-w-xs">{cat.description || '-'}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"><Pencil size={16} /></button>
                                    <button onClick={() => setDeleteCategory(cat)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <CategoryFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} initialData={editingCategory} />
      <DangerConfirmModal isOpen={!!deleteCategory} onClose={() => setDeleteCategory(null)} onConfirm={executeDelete} title="Purge Category" message={`Erase classification registry for "${deleteCategory?.name}"?`} isLoading={isProcessing} />
    </div>
  );
};
