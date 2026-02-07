'use client';

import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Shield, Key, Save,
    LogOut, Lock, Building2, Loader2, CheckCircle2,
    Briefcase, ShieldCheck, Globe
} from 'lucide-react';
import { UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useLanguage } from '../translations';

interface ProfileViewProps {
    onLogout: () => void;
    user: UserAccount | null;
    onUpdateSuccess?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout, user, onUpdateSuccess }) => {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // State form
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        company: '',
        department: '',
        jobTitle: ''
    });

    const [avatarUrl, setAvatarUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [companyList, setCompanyList] = useState<{ id: number, name: string }[]>([]);
    const [departmentList, setDepartmentList] = useState<{ name: string }[]>([]);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Sinkronisasi data saat user prop berubah atau mode edit aktif
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phone: user.phone || '',
                address: user.address || '',
                company: user.company || '',
                department: user.department || '',
                jobTitle: user.jobTitle || ''
            });
            setAvatarUrl(user.avatarUrl || '');
        }

        const fetchMasterData = async () => {
            try {
                const { data: companies } = await supabase.from('companies').select('id, name').order('name');
                if (companies) setCompanyList(companies);

                const { data: depts } = await supabase.from('departments').select('name').order('name');
                if (depts) setDepartmentList(depts);
            } catch (err) {
                console.error("Error fetching master data:", err);
            }
        };
        fetchMasterData();
    }, [user]);

    const userInitial = (formData.fullName || 'US').substring(0, 2).toUpperCase();
    const userRole = user?.role || 'Staff';
    const userEmail = user?.email || 'No Email';

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage(null);

        try {
            const { error } = await supabase
                .from('user_accounts')
                .update({
                    full_name: formData.fullName,
                    phone: formData.phone,
                    address: formData.address,
                    company: formData.company,
                    department: formData.department,
                    job_title: formData.jobTitle,
                    avatar_url: avatarUrl
                })
                .eq('id', user.id);

            if (error) throw error;

            setSaveMessage({ text: t('profileUpdated'), type: 'success' });
            setIsEditing(false);

            // Meminta App.tsx menyegarkan data currentUser
            if (onUpdateSuccess) onUpdateSuccess();

            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error: any) {
            console.error("Save error:", error);
            setSaveMessage({ text: t('profileUpdateFailed'), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

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

            if (!response.ok) {
                console.error('Cloudinary Error Detail:', data);
                throw new Error(data.error?.message || 'Upload failed');
            }

            if (data.secure_url) {
                setAvatarUrl(data.secure_url);

                // Auto sync to DB
                await supabase
                    .from('user_accounts')
                    .update({ avatar_url: data.secure_url })
                    .eq('id', user.id);

                if (onUpdateSuccess) onUpdateSuccess();
                setSaveMessage({ text: 'Photo updated successfully', type: 'success' });
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            setSaveMessage({ text: 'Upload failed', type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    // Styling Kelas Bawaan
    const inputClass = "w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-white/[0.02] text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-400 text-sm font-semibold shadow-sm";
    const labelClass = "text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 block ml-1 uppercase tracking-widest";

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
            {/* Profil Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.05] shadow-2xl shadow-blue-500/5 overflow-hidden mb-10 relative group">
                {/* Mesh Background */}
                <div className="h-48 bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 opacity-90"></div>
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] bg-blue-400 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[140%] bg-indigo-400 rounded-full blur-[100px] opacity-20"></div>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>

                <div className="px-10 pb-10">
                    <div className="flex flex-col md:flex-row items-end gap-8 -mt-16 relative z-10">
                        <div className="w-36 h-36 rounded-[2.5rem] bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-100 dark:border-white/[0.05] relative group/avatar overflow-hidden">
                            <div className="w-full h-full rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-5xl font-black text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-inner">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-110" />
                                ) : (
                                    userInitial
                                )}

                                {isUploading && (
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20">
                                        <Loader2 size={32} className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <label className="absolute inset-x-2 bottom-2 h-10 bg-slate-900/80 backdrop-blur-md rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-all transform translate-y-2 group-hover/avatar:translate-y-0 flex items-center justify-center cursor-pointer text-white z-10 border border-white/10">
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                                <Save size={16} className="mr-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                            </label>
                        </div>

                        <div className="flex-1 mb-2">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{formData.fullName || 'User'}</h1>
                                <div className="px-4 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 border border-blue-400/20">
                                    {userRole}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                    <Mail size={12} className="text-blue-500" /> {userEmail}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                    <ShieldCheck size={12} className="text-emerald-500" /> Document Verified
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-8 py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95"
                                >
                                    <User size={16} strokeWidth={3} /> Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-8 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95"
                                    >
                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={3} />}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {saveMessage && (
                <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${saveMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                    {saveMessage.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                    <span className="text-sm font-semibold">{saveMessage.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Organization Details */}
                <div className="space-y-8">
                    <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.05] p-8 shadow-2xl shadow-blue-500/5 transition-all hover:shadow-blue-500/10">
                        <div className="flex items-center gap-4 mb-8 border-b border-slate-50 dark:border-white/5 pb-6">
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner">
                                <Building2 size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-[0.2em]">Work Organization</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <label className={labelClass}>Company Name</label>
                                <div className="relative">
                                    <select
                                        className={inputClass}
                                        value={formData.company}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    >
                                        <option value="">-- Select Company --</option>
                                        {companyList.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                                </div>
                            </div>
                            <div className="relative">
                                <label className={labelClass}>Department Cluster</label>
                                <div className="relative">
                                    <select
                                        className={inputClass}
                                        value={formData.department}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option value="">-- Select Dept --</option>
                                        {departmentList.map((d, i) => (
                                            <option key={i} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                                </div>
                            </div>
                            <div className="relative">
                                <label className={labelClass}>Job Designation</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                        className={inputClass}
                                        placeholder="e.g. Infrastructure Lead"
                                    />
                                    <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.05] p-8 shadow-2xl shadow-blue-500/5">
                        <div className="flex items-center gap-4 mb-8 border-b border-slate-50 dark:border-white/5 pb-6">
                            <div className="p-3 bg-slate-50 dark:bg-white/5 text-slate-500 rounded-2xl">
                                <Key size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-[0.2em]">Security Access</h3>
                        </div>
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="w-full py-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-white/10 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
                        >
                            <Lock size={16} strokeWidth={2.5} /> Reset Passcode
                        </button>
                    </section>
                </div>

                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/[0.05] p-10 shadow-2xl shadow-blue-500/5">
                        <div className="flex items-center justify-between mb-10 border-b border-slate-50 dark:border-white/5 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner">
                                    <User size={20} strokeWidth={2.5} />
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-[0.2em]">Personnel Identity</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 relative">
                                <label className={labelClass}>Full Legal Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className={inputClass}
                                        placeholder="Enter full name"
                                    />
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                                </div>
                            </div>

                            <div className="relative">
                                <label className={labelClass}>Primary Email</label>
                                <div className="relative">
                                    <input type="text" value={userEmail} disabled className={inputClass} />
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>

                            <div className="relative">
                                <label className={labelClass}>Mobile Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className={inputClass}
                                        placeholder="+62 ..."
                                    />
                                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                                </div>
                            </div>

                            <div className="md:col-span-2 relative">
                                <label className={labelClass}>Site Office Address</label>
                                <div className="relative">
                                    <textarea
                                        rows={4}
                                        value={formData.address}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className={`${inputClass} pl-11 resize-none leading-relaxed`}
                                        placeholder="Detail location of current assignment"
                                    />
                                    <MapPin size={16} className="absolute left-4 top-6 text-slate-400 dark:text-slate-600" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4 py-8 bg-slate-50 dark:bg-white/[0.02] rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner group">
                                <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Authentication Logged</p>
                                <p className="text-xs text-slate-900 dark:text-white font-bold">
                                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Session Active'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 backdrop-blur-sm"
                        >
                            <LogOut size={16} /> Terminate Session
                        </button>
                    </div>
                </div>
            </div>

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </div>
    );
};
