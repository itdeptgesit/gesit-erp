'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    X, Calendar, Clock, User, ShieldCheck, Tag,
    Info, CheckCircle2, MapPin, Building2, Search,
    ChevronDown, AlertTriangle, Zap, Pencil, Plus,
    RefreshCcw, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityLog, UserAccount } from '../types';
import { UserAvatar } from './UserAvatar';
import { useLanguage } from '../translations';

interface ActivityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<ActivityLog>) => Promise<void>;
    initialData?: ActivityLog | null;
    currentUserName?: string;
    users?: any[];
    departments?: string[];
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
    isOpen, onClose, onSubmit, initialData, currentUserName,
    users = [], departments = []
}) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<Partial<ActivityLog>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Date State
    const [createdAt, setCreatedAt] = useState('');
    const [completedAt, setCompletedAt] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');

    // User Search State
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const userDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const dateOnly = (str: string | undefined | null) => str ? str.split('T')[0] : '';
                
                setCreatedAt(dateOnly(initialData.createdAt));
                setCompletedAt(dateOnly(initialData.completedAt));
                setUpdatedAt(dateOnly(initialData.updatedAt || new Date().toISOString()));

                setFormData({
                    ...initialData,
                    itPersonnel: initialData.itPersonnel || currentUserName || 'IT Staff',
                });
                setUserSearch(initialData.requester || '');
            } else {
                const today = new Date().toISOString().split('T')[0];
                setCreatedAt(today);
                setCompletedAt(today);
                setUpdatedAt(today);

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
                });
                setUserSearch('');
            }
        }
    }, [initialData, isOpen, currentUserName]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredUsers = useMemo(() => {
        if (!userSearch || userSearch.trim().length === 0) return [];
        const search = userSearch.toLowerCase();
        return users.filter(u => {
            const name = (u.fullName || u.name || '').toLowerCase();
            const dept = (u.department || '').toLowerCase();
            return name.includes(search) || dept.includes(search);
        });
    }, [users, userSearch]);

    const handleUserSelect = (user: any) => {
        const userName = user.fullName || user.name;
        const matchedDept = departments.find(d => d.toLowerCase() === (user.department || '').toLowerCase()) || user.department;
        setFormData(prev => ({ ...prev, requester: userName, department: matchedDept || prev.department }));
        setUserSearch(userName);
        setShowUserDropdown(false);
    };

    const handleManualEntry = () => {
        setFormData(prev => ({ ...prev, requester: userSearch }));
        setShowUserDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToSubmit = {
                ...formData,
                requester: userSearch,
                createdAt: `${createdAt}T00:00:00`,
                completedAt: formData.status === 'Completed' ? `${completedAt}T00:00:00` : null,
                updatedAt: `${updatedAt}T00:00:00`,
                location: formData.location?.trim() || 'Head Office TCT 27'
            };
            await onSubmit(dataToSubmit);
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1 uppercase tracking-[0.1em]";
    const inputClass = "w-full px-4 py-2 bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/50 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400";
    const selectClass = "w-full px-4 py-2 bg-white dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-700/50 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer";
    const inputLockedClass = "w-full px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/50 rounded-xl text-sm font-medium text-slate-400 dark:text-zinc-600 cursor-not-allowed";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/20 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/60 dark:border-zinc-800 flex flex-col max-h-[92vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {initialData ? 'Edit Activity' : 'New Activity Entry'}
                                </h2>
                                <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Activity documentation & records
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="activityForm" onSubmit={handleSubmit} className="space-y-6">
                                {/* Activity Name */}
                                <div className="p-5 rounded-xl bg-blue-50/20 dark:bg-blue-600/5 border border-blue-500/10 dark:border-blue-500/5">
                                    <label className={labelClass}>Activity Summary</label>
                                    <input
                                        type="text"
                                        className={`${inputClass} !bg-white dark:!bg-zinc-900 !text-base focus:ring-blue-100 dark:focus:ring-blue-900/10`}
                                        value={formData.activityName || ''}
                                        onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                                        required
                                        placeholder="What was done?"
                                        autoFocus
                                    />
                                </div>

                                {/* Requester & Department */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div ref={userDropdownRef}>
                                        <label className={labelClass}>Requester</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={inputClass}
                                                value={userSearch}
                                                onChange={(e) => {
                                                    setUserSearch(e.target.value);
                                                    setShowUserDropdown(true);
                                                }}
                                                onFocus={() => setShowUserDropdown(true)}
                                                placeholder="Search user..."
                                            />
                                            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                                            <AnimatePresence>
                                                {showUserDropdown && (userSearch.trim().length > 0 || filteredUsers.length > 0) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-slate-100 dark:border-zinc-700/50 max-h-60 overflow-y-auto z-50 custom-scrollbar p-2"
                                                    >
                                                        {filteredUsers.map((user, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => handleUserSelect(user)}
                                                                className="w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-4 transition-all rounded-xl group"
                                                            >
                                                                <UserAvatar name={user.fullName || user.name} url={user.avatarUrl} size="md" className="border-2 border-white dark:border-zinc-600 shadow-sm" />
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors tracking-tight">{user.fullName || user.name}</p>
                                                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{user.department}</p>
                                                                </div>
                                                            </button>
                                                        ))}

                                                        {userSearch.trim() && !filteredUsers.some(u => (u.fullName || u.name || '').toLowerCase() === userSearch.toLowerCase()) && (
                                                            <button
                                                                type="button"
                                                                onClick={handleManualEntry}
                                                                className="w-full text-left p-4 bg-blue-50/50 dark:bg-blue-900/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/50 flex items-center gap-4 transition-all rounded-xl mt-1"
                                                            >
                                                                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                                    <Plus size={16} strokeWidth={3} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none">Add "{userSearch}"</p>
                                                                    <p className="text-[10px] font-medium text-slate-400 mt-1">Manual entry</p>
                                                                </div>
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Department</label>
                                        <div className="relative">
                                            <select
                                                className={selectClass}
                                                value={formData.department || ''}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                required
                                            >
                                                <option value="" disabled>Select Sector</option>
                                                {departments.map((dept, idx) => (
                                                    <option key={idx} value={dept}>{dept}</option>
                                                ))}
                                                {formData.department && !departments.includes(formData.department) && (
                                                    <option value={formData.department}>{formData.department}</option>
                                                )}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>Start Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className={`${inputClass} cursor-pointer`}
                                                onClick={(e) => e.currentTarget.showPicker()}
                                                value={createdAt}
                                                onChange={(e) => setCreatedAt(e.target.value)}
                                                required
                                            />
                                            <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>{formData.status === 'Completed' ? 'Completed Date' : 'Updated Date'}</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className={`${inputClass} cursor-pointer border-blue-100 dark:border-blue-900/30`}
                                                onClick={(e) => e.currentTarget.showPicker()}
                                                value={formData.status === 'Completed' ? completedAt : updatedAt}
                                                onChange={(e) => formData.status === 'Completed' ? setCompletedAt(e.target.value) : setUpdatedAt(e.target.value)}
                                                required
                                            />
                                            <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/50 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Duration & Location */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>Duration</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={inputClass}
                                                value={formData.duration || ''}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                placeholder="e.g. 15m, 2h"
                                            />
                                            <Zap size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Location</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={inputClass}
                                                value={formData.location || ''}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="Site or Office"
                                            />
                                            <MapPin size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Category & Priority */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>Classification</label>
                                        <div className="relative">
                                            <select
                                                className={selectClass}
                                                value={formData.category || 'Troubleshooting'}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                required
                                            >
                                                <option value="Troubleshooting">Troubleshooting</option>
                                                <option value="Maintenance">Maintenance</option>
                                                <option value="Creative & Design">Creative & Design</option>
                                                <option value="Infrastructure & Network">Infrastructure & Network</option>
                                                <option value="Procurement & Assets">Procurement & Assets</option>
                                                <option value="Technical Support">Technical Support</option>
                                                <option value="Web Development">Web Development</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Priority Level</label>
                                        <div className="relative">
                                            <select
                                                className={selectClass}
                                                value={formData.type || 'Minor'}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                                required
                                            >
                                                <option value="Minor">Minor</option>
                                                <option value="Major">Major</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* IT Personnel & Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={labelClass}>Handled By</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={inputLockedClass}
                                                value={formData.itPersonnel || ''}
                                                readOnly
                                            />
                                            <ShieldCheck size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400/50 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Operational Status</label>
                                        <div className="relative">
                                            <select
                                                className={selectClass}
                                                value={formData.status || 'Completed'}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                required
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className={labelClass}>Documentation Details</label>
                                    <textarea
                                        rows={3}
                                        className={`${inputClass} resize-none min-h-[100px]`}
                                        value={formData.remarks || ''}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        placeholder="Additional notes or findings..."
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 py-6 border-t border-slate-100 dark:border-zinc-800/80 flex justify-end items-center gap-4 bg-white dark:bg-zinc-900 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="activityForm"
                                disabled={isSubmitting}
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 dark:hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                                {initialData ? 'Update Record' : 'Save Activity'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};