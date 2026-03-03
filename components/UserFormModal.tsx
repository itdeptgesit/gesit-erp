'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Building2, UserCheck, Layers, Briefcase, MapPin, Loader2, Image as ImageIcon, Camera, LifeBuoy } from 'lucide-react';
import { UserAccount, UserGroup, Company } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastProvider';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<UserAccount>) => void;
    initialData?: UserAccount | null;
    availableGroups: UserGroup[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, availableGroups }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState<Partial<UserAccount>>({});
    const [userOptions, setUserOptions] = useState<{ id: string, name: string }[]>([]);
    const [companyList, setCompanyList] = useState<Company[]>([]);
    const [departmentList, setDepartmentList] = useState<{ name: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchResources = async () => {
            const { data: users } = await supabase.from('user_accounts').select('id, full_name').order('full_name');
            if (users) setUserOptions(users.map((u: any) => ({ id: u.id.toString(), name: u.full_name })));

            const { data: companies } = await supabase.from('companies').select('*').order('name');
            if (companies) setCompanyList(companies);

            const { data: depts } = await supabase.from('departments').select('name').order('name');
            if (depts) setDepartmentList(depts);
        };
        if (isOpen) fetchResources();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                username: '',
                fullName: '',
                email: '',
                role: 'User',
                groups: [],
                status: 'Active',
                company: '',
                department: '',
                jobTitle: '',
                supervisorId: '',
                managerId: '',
                isHelpdeskSupport: false
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmr8bxdos';
        const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gesit_erp_preset';

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: uploadData
            });
            const data = await response.json();
            if (data.secure_url) {
                setFormData(prev => ({ ...prev, avatarUrl: data.secure_url }));
            }
        } catch (error) {
            console.error('Upload Error:', error);
            showToast('Upload failed', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    const toggleGroup = (groupId: string) => {
        setFormData(prev => {
            const currentGroups = prev.groups || [];
            if (currentGroups.includes(groupId)) {
                return { ...prev, groups: currentGroups.filter(g => g !== groupId) };
            } else {
                return { ...prev, groups: [...currentGroups, groupId] };
            }
        });
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all";
    const labelClass = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 ml-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh] border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                            {initialData ? 'Edit User Identity' : 'Register New User'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-widest">Identity & Corporate Hierarchy</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-all"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Full Identity Name</label>
                            <input type="text" required className={`${inputClass} !text-base !font-bold`} value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g. John Doe" />
                        </div>

                        <div>
                            <label className={labelClass}>Username</label>
                            <input type="text" required className={inputClass} value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })} />
                        </div>

                        <div>
                            <label className={labelClass}>Official Email</label>
                            <input type="email" required className={inputClass} value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>User Avatar</label>
                            <div className="flex items-center gap-4 mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center text-slate-300">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={24} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Cloudinary Secured Upload</p>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-all shadow-sm">
                                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                            {isUploading ? 'Uploading...' : 'Choose Photo'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                                        </label>
                                        {formData.avatarUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                                                className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg text-xs font-bold transition-all"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
                        <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                            <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest">Corporate Assignment</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Company Entity</label>
                                <select className={inputClass} value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} required>
                                    <option value="">-- Select Company --</option>
                                    {companyList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Department Cluster</label>
                                <select className={inputClass} value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })} required>
                                    <option value="">-- Select Dept --</option>
                                    {departmentList.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Job Title / Position</label>
                                <div className="relative">
                                    <input type="text" className={`${inputClass} pl-10`} value={formData.jobTitle || ''} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="e.g. Senior Network Engineer" />
                                    <Briefcase size={14} className="absolute left-3.5 top-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Access Role</label>
                            <select className={inputClass} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })}>
                                <option value="Admin">Administrator</option>
                                <option value="Staff">Operations Staff</option>
                                <option value="User">Standard User</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Terminal Status</label>
                            <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                <option value="Active">Active</option>
                                <option value="Disabled">Disabled</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between mb-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                            <div className="flex items-center gap-2">
                                <LifeBuoy size={18} className="text-indigo-600 dark:text-indigo-400" />
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest">Helpdesk Access</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.isHelpdeskSupport || false}
                                    onChange={(e) => setFormData({ ...formData, isHelpdeskSupport: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-500"></div>
                                <span className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Support Staff Status</span>
                            </label>
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
                            Enable this to grant this account access to the Helpdesk Management view and allow them to be assigned to support tickets.
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center gap-2 mb-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                            <Layers size={18} className="text-brand-600 dark:text-blue-500" />
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest">Group Membership</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {availableGroups.map(group => (
                                <label key={group.id} className={`flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-3 py-2.5 rounded-lg border transition-all ${formData.groups?.includes(group.id) ? 'border-brand-500 dark:border-blue-500 bg-brand-50 dark:bg-blue-900/20 ring-1 ring-brand-500 dark:ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'}`}>
                                    <input type="checkbox" checked={formData.groups?.includes(group.id)} onChange={() => toggleGroup(group.id)} className="w-4 h-4 rounded text-brand-600" />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{group.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                        <div className="flex items-center gap-2 mb-2 border-b border-blue-200 dark:border-blue-900/50 pb-3">
                            <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs tracking-widest">Approval Hierarchy</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Direct Supervisor (SPV)</label>
                                <select className={inputClass} value={formData.supervisorId || ''} onChange={e => setFormData({ ...formData, supervisorId: e.target.value })}>
                                    <option value="">- No SPV -</option>
                                    {userOptions.filter(u => u.id !== initialData?.id?.toString()).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Department Manager</label>
                                <select className={inputClass} value={formData.managerId || ''} onChange={e => setFormData({ ...formData, managerId: e.target.value })}>
                                    <option value="">- No Manager -</option>
                                    {userOptions.filter(u => u.id !== initialData?.id?.toString()).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                        <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-xs font-bold uppercase tracking-widest transition-all active:scale-95">Commit Identity</button>
                    </div>
                </form>
            </div>
        </div>
    );
};