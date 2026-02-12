
'use client';

import React, { useState } from 'react';
import { X, Link, FileText, Folder, Type } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastProvider';

interface FileFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    folders: { id: string; name: string }[];
    initialData?: any | null;
}

export const FileFormModal: React.FC<FileFormModalProps> = ({ isOpen, onClose, onSubmit, folders, initialData }) => {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        gdriveUrl: '',
        type: 'pdf'
    });

    React.useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                category: initialData.category || '',
                gdriveUrl: initialData.gdriveUrl,
                type: initialData.type || 'pdf'
            });
        } else {
            setFormData({ name: '', category: '', gdriveUrl: '', type: 'pdf' });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                category: formData.category,
                gdrive_url: formData.gdriveUrl,
                type: formData.type,
                updated_at: new Date().toISOString()
            };

            if (initialData) {
                const { error } = await supabase.from('files').update(payload).eq('id', initialData.id);
                if (error) throw error;
            } else {
                const insertPayload = { ...payload, id: Date.now().toString() };
                const { error } = await supabase.from('files').insert([insertPayload]);
                if (error) throw error;
            }

            onSubmit(formData);
            onClose();
            setFormData({ name: '', category: '', gdriveUrl: '', type: 'pdf' });
        } catch (err: any) {
            showToast("Upload failed: " + err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600";
    const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border border-white/20 dark:border-slate-800">
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{initialData ? 'Update Document' : 'Register Document'}</h2>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Cloud Link Integration</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} id="fileForm" className="p-8 space-y-6">
                    <div>
                        <label className={labelClass}>Document Title</label>
                        <div className="relative">
                            <input
                                type="text" required className={`${inputClass} pl-10`}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Network Policy 2025"
                            />
                            <FileText size={14} className="absolute left-3.5 top-4 text-slate-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Classification</label>
                            <div className="relative">
                                <input
                                    type="text" required className={`${inputClass} pl-10`}
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g. Manual"
                                />
                                <Folder size={14} className="absolute left-3.5 top-4 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Data Modality</label>
                            <div className="relative">
                                <select
                                    className={`${inputClass} pl-10`}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="pdf">PDF Static</option>
                                    <option value="doc">Word Entry</option>
                                    <option value="sheet">Data Sheet</option>
                                    <option value="image">Diagram</option>
                                </select>
                                <Type size={14} className="absolute left-3.5 top-4 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Storage URI (Google Drive)</label>
                        <div className="relative">
                            <input
                                type="url" required className={`${inputClass} pl-10`}
                                value={formData.gdriveUrl}
                                onChange={e => setFormData({ ...formData, gdriveUrl: e.target.value })}
                                placeholder="https://drive.google.com/..."
                            />
                            <Link size={14} className="absolute left-3.5 top-4 text-slate-400" />
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-2 font-bold uppercase tracking-widest italic ml-1">Must be a shareable public or workspace link</p>
                    </div>
                </form>

                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2rem] flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">Cancel</button>
                    <button type="submit" form="fileForm" disabled={isSubmitting} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50">
                        {isSubmitting ? 'Processing...' : (initialData ? 'Update Document' : 'Commit to Library')}
                    </button>
                </div>
            </div>
        </div>
    );
};
