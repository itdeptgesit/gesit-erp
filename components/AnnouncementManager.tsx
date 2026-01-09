'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Save, Send, Clock, Calendar, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Announcement {
    id?: number;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'error' | 'success';
    is_active: boolean;
    created_at?: string;
    expires_at?: string;
}

export const AnnouncementManager: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState<Announcement>({
        title: '',
        content: '',
        type: 'info',
        is_active: true
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setAnnouncements(data);
        } catch (err: any) {
            console.warn("Announcement fetch error:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMsg(null);
        try {
            const { error } = await supabase.from('announcements').insert([formData]);
            if (error) throw error;

            setStatusMsg({ text: 'Broadcast deployment successful!', type: 'success' });
            setIsFormOpen(false);
            setFormData({ title: '', content: '', type: 'info', is_active: true });
            fetchData();
        } catch (err: any) {
            setStatusMsg({ text: `Deployment failed: ${err.message}. (Make sure 'announcements' table exists)`, type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMsg(null), 5000);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase.from('announcements').update({ is_active: !currentStatus }).eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const deleteAnnouncement = async (id: number) => {
        if (!confirm("Are you sure you want to terminate this broadcast?")) return;
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            alert("Failed to delete record");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Broadcasts</h1>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">Emergency & Info Center</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                    {isFormOpen ? 'Cancel Protocol' : <><Plus size={14} /> New Broadcast</>}
                </button>
            </div>

            {statusMsg && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/20' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20'}`}>
                    {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="font-bold text-[10px] uppercase tracking-widest">{statusMsg.text}</p>
                </div>
            )}

            {isFormOpen && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl animate-in zoom-in-95 duration-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Broadcast Title</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Identification of the message..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Signal Type</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="info">Info (Blue)</option>
                                        <option value="warning">Warning (Amber)</option>
                                        <option value="error">Critical (Rose)</option>
                                        <option value="success">Success (Emerald)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Message Content</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Enter full protocol details..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <Clock className="animate-spin" size={14} /> : <Send size={14} />}
                                Initiate Broadcast
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-10 text-center"><Clock className="animate-spin text-slate-300 mx-auto" size={24} /></div>
                ) : announcements.length === 0 ? (
                    <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                        <Megaphone size={32} className="opacity-20 mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No active communications</p>
                    </div>
                ) : announcements.map((ann) => (
                    <div key={ann.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ann.type === 'info' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        ann.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            ann.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    }`}>
                                    {ann.type} Signal
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => deleteAnnouncement(ann.id!)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight mb-2 uppercase">{ann.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3 font-medium">{ann.content}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Calendar size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-tighter">{ann.created_at ? new Date(ann.created_at).toLocaleDateString() : 'New'}</span>
                            </div>
                            <button
                                onClick={() => toggleStatus(ann.id!, ann.is_active)}
                                className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${ann.is_active ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {ann.is_active ? 'Online' : 'Dark'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
