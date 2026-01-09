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
    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50 disabled:text-slate-400 text-sm font-medium";
    const labelClass = "text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block ml-1 uppercase tracking-wider";

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20 font-sans">
            {/* Profil Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                </div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row items-end gap-6 -mt-12 relative z-10">
                        <div className="w-28 h-28 rounded-3xl bg-white dark:bg-slate-900 p-1.5 shadow-xl border border-slate-100 dark:border-slate-800 relative group/avatar overflow-hidden">
                            <div className="w-full h-full rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    userInitial
                                )}

                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                                        <Loader2 size={24} className="text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white z-10">
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                                <Save size={18} className="mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Update Photo</span>
                            </label>
                        </div>

                        <div className="flex-1 mb-2">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{formData.fullName || 'User'}</h1>
                                <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-100 dark:border-blue-800 uppercase tracking-widest">
                                    {userRole}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" /> {userEmail}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-black dark:hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <User size={14} /> Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
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
                <div className="space-y-6">
                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <Building2 size={18} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight">Organization</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Company Name</label>
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
                            </div>
                            <div>
                                <label className={labelClass}>Department Cluster</label>
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
                            </div>
                            <div>
                                <label className={labelClass}>Job Designation</label>
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                                    className={inputClass}
                                    placeholder="e.g. Infrastructure Lead"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
                                <Key size={18} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight">Security Access</h3>
                        </div>
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Lock size={14} /> Reset Passcode
                        </button>
                    </section>
                </div>

                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <User size={18} />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight">Personnel Identity</h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Full Legal Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    disabled={!isEditing}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className={inputClass}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Primary Email</label>
                                <input type="text" value={userEmail} disabled className={inputClass} />
                            </div>

                            <div>
                                <label className={labelClass}>Mobile Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className={`${inputClass} pl-10`}
                                        placeholder="+62 ..."
                                    />
                                    <Phone size={14} className="absolute left-3.5 top-3.5 text-slate-300" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Site Office Address</label>
                                <div className="relative">
                                    <textarea
                                        rows={3}
                                        value={formData.address}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className={`${inputClass} pl-10 resize-none leading-relaxed`}
                                        placeholder="Detail location of current assignment"
                                    />
                                    <MapPin size={14} className="absolute left-3.5 top-3.5 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-between items-center px-4">
                        <p className="text-xs text-slate-400 font-medium">
                            Last Authentication Logged: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </p>
                        <button
                            onClick={onLogout}
                            className="text-rose-500 hover:text-rose-600 text-xs font-bold flex items-center gap-2 transition-colors px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl"
                        >
                            <LogOut size={14} /> Terminate Session
                        </button>
                    </div>
                </div>
            </div>

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </div>
    );
};
