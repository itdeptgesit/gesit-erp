'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, ShieldCheck, Tag, Info, CheckCircle2, MapPin, Building2 } from 'lucide-react';
import { ActivityLog } from '../types';
import { supabase } from '../lib/supabaseClient';

interface ActivityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<ActivityLog>) => void;
    initialData?: ActivityLog | null;
    currentUserName?: string;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, currentUserName }) => {
    const [formData, setFormData] = useState<Partial<ActivityLog>>({});
    const [departments, setDepartments] = useState<string[]>([]);
    const [isLoadingDepts, setIsLoadingDepts] = useState(false);

    useEffect(() => {
        const fetchDepts = async () => {
            setIsLoadingDepts(true);
            try {
                const { data } = await supabase.from('departments').select('name').order('name', { ascending: true });
                if (data) setDepartments(data.map(d => d.name));
            } catch (err) {
                console.error("Error fetching departments:", err);
            } finally {
                setIsLoadingDepts(false);
            }
        };

        if (isOpen) fetchDepts();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                itPersonnel: initialData.itPersonnel || currentUserName || 'IT Staff',
                updatedAt: initialData.updatedAt || new Date().toISOString().split('T')[0],
                status: initialData.status || 'Completed',
                department: initialData.department || '',
                location: initialData.location || ''
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                status: 'Completed',
                type: 'Minor',
                itPersonnel: currentUserName || 'IT Admin',
                requester: '',
                location: 'Head Office TCT 27',
                department: '',
                category: 'Troubleshooting',
                remarks: '',
                duration: '',
                createdAt: today,
                updatedAt: today,
                completedAt: today
            });
        }
    }, [initialData, isOpen, currentUserName]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit = {
            ...formData,
            location: formData.location?.trim() || 'Head Office TCT 27'
        };
        onSubmit(dataToSubmit);
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 appearance-none";
    const lockedInputClass = "w-full border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm mt-1 bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-semibold cursor-not-allowed border-dashed";
    const labelClass = "block text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border border-white/20 dark:border-slate-800">
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {initialData ? 'Update Activity Record' : 'New Activity Log Entry'}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Registry of engineering maintenance and technical support</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form id="activityForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Activity Name / Job Description</label>
                            <input
                                type="text"
                                className={`${inputClass} !text-blue-600 dark:!text-blue-400 !text-base !font-bold !border-blue-100 dark:!border-blue-900/30 bg-blue-50/10`}
                                value={formData.activityName || ''}
                                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                                required
                                placeholder="What was fixed? (e.g. Setup new laptop for finance)"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Engineer (IT Personnel)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={lockedInputClass}
                                        value={formData.itPersonnel || ''}
                                        readOnly
                                        tabIndex={-1}
                                    />
                                    <ShieldCheck size={14} className="absolute right-3 top-3.5 text-slate-300" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Requester (User)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formData.requester || ''}
                                        onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                                        placeholder="Employee name"
                                    />
                                    <User size={14} className="absolute right-3 top-4 text-slate-300" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Department</label>
                                <div className="relative">
                                    <select
                                        className={inputClass}
                                        value={formData.department || ''}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                        {departments.length === 0 && !isLoadingDepts && <option value="Other">Other</option>}
                                    </select>
                                    <Building2 size={14} className="absolute right-3 top-4 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Location / Room</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formData.location || ''}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g. Server Room, Finance Hall"
                                    />
                                    <MapPin size={14} className="absolute right-3 top-4 text-slate-300" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Start Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className={`${inputClass} cursor-pointer`}
                                        onClick={(e) => e.currentTarget.showPicker()}
                                        value={formData.createdAt || ''}
                                        onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {formData.status === 'Completed' ? (
                                <div>
                                    <label className={labelClass}>Completion Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className={`${inputClass} border-emerald-200 dark:border-emerald-900/50 cursor-pointer`}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            value={formData.completedAt || ''}
                                            onChange={(e) => setFormData({ ...formData, completedAt: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className={labelClass}>Update Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className={`${inputClass} border-blue-200 dark:border-blue-900/50 cursor-pointer`}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            value={formData.updatedAt || ''}
                                            onChange={(e) => setFormData({ ...formData, updatedAt: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Status</label>
                                <div className="relative">
                                    <select
                                        className={inputClass}
                                        value={formData.status || 'Completed'}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        required
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                    <CheckCircle2 size={14} className="absolute right-3 top-4 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Severity / Priority</label>
                                <div className="relative">
                                    <select className={inputClass} value={formData.type || 'Minor'} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} required>
                                        <option value="Minor">Minor</option>
                                        <option value="Major">Major</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                    <Tag size={14} className="absolute right-3 top-4 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Category</label>
                                <div className="relative">
                                    <select className={inputClass} value={formData.category || 'Troubleshooting'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                                        <option value="Troubleshooting">Troubleshooting</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Creative & Design">Creative & Design</option>
                                        <option value="Software & Licensing">Software & Licensing</option>
                                        <option value="Infrastructure & Network">Infrastructure & Network</option>
                                        <option value="Procurement & Assets">Procurement & Assets</option>
                                        <option value="Technical Support">Technical Support</option>
                                        <option value="Web Development">Web Development</option>
                                        <option value="Installation">Installation</option>
                                        <option value="Other">Other/General</option>
                                    </select>
                                    <Info size={14} className="absolute right-3 top-4 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Work Duration</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputClass}
                                        value={formData.duration || ''}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="e.g. 1h, 15m"
                                    />
                                    <Clock size={14} className="absolute right-3 top-4 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Remarks / Technical Resolution</label>
                            <textarea
                                rows={4}
                                className={`${inputClass} resize-none leading-relaxed italic`}
                                value={formData.remarks || ''}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="Explain the technical resolution and issue root cause..."
                            />
                        </div>
                    </form>
                </div>

                <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-white dark:bg-slate-900 text-slate-500 font-semibold rounded-xl text-sm transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50">Cancel</button>
                    <button type="submit" form="activityForm" className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 active:scale-95">Save Changes</button>
                </div>
            </div>
        </div>
    );
};