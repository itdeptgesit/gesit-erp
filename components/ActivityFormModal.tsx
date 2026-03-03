'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    X, Calendar, Clock, User, ShieldCheck, Tag,
    Info, CheckCircle2, MapPin, Building2, Search,
    ChevronDown, AlertTriangle, Zap, Pencil, Plus,
    RefreshCcw, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityLog } from '../types';
import { UserAvatar } from './UserAvatar';

interface UserOption {
    name: string;
    department: string;
    avatarUrl?: string;
}

interface ActivityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<ActivityLog>) => void;
    initialData?: ActivityLog | null;
    currentUserName?: string;
    users?: UserOption[];
    departments?: string[];
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
    isOpen, onClose, onSubmit, initialData, currentUserName,
    users = [], departments = []
}) => {
    const [formData, setFormData] = useState<Partial<ActivityLog>>({});

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
                setCreatedAt(initialData.createdAt.split('T')[0]);
                setCompletedAt(initialData.completedAt ? initialData.completedAt.split('T')[0] : '');
                setUpdatedAt(initialData.updatedAt ? initialData.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0]);

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
        return users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()));
    }, [users, userSearch]);

    const handleUserSelect = (user: UserOption) => {
        const matchedDept = departments.find(d => d.toLowerCase() === user.department.toLowerCase()) || user.department;
        setFormData(prev => ({ ...prev, requester: user.name, department: matchedDept || prev.department }));
        setUserSearch(user.name);
        setShowUserDropdown(false);
    };

    const handleManualEntry = () => {
        setFormData(prev => ({ ...prev, requester: userSearch }));
        setShowUserDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit = {
            ...formData,
            requester: userSearch,
            createdAt: `${createdAt}T00:00:00`,
            completedAt: formData.status === 'Completed' ? `${completedAt}T00:00:00` : null,
            updatedAt: `${updatedAt}T00:00:00`,
            location: formData.location?.trim() || 'Head Office TCT 27'
        };
        onSubmit(dataToSubmit);
    };

    const labelClass = "block text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider";
    const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all placeholder:text-slate-400";
    const selectClass = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all appearance-none cursor-pointer";
    const inputLockedClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed";

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 overflow-y-auto" onClick={onClose}>
                    <motion.div
                        initial={{ scale: 0.95, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 30, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {initialData ? 'Edit Activity' : 'Create New Activity'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Fill in the details for the activity log entry</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <form id="activityForm" onSubmit={handleSubmit} className="space-y-6">
                                {/* Activity Name */}
                                <div className="p-5 rounded-xl bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20">
                                    <label className={labelClass}>Activity Name</label>
                                    <input
                                        type="text"
                                        className={`${inputClass} !bg-white dark:!bg-slate-900 !text-base focus:ring-blue-100`}
                                        value={formData.activityName || ''}
                                        onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                                        required
                                        placeholder="What was done?"
                                        autoFocus
                                    />
                                </div>

                                {/* Requester & Department */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1a1d23] rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto z-50 custom-scrollbar p-2"
                                                    >
                                                        {filteredUsers.map((user, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => handleUserSelect(user)}
                                                                className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 transition-all rounded-xl group"
                                                            >
                                                                <UserAvatar name={user.name} url={user.avatarUrl} size="md" className="border-2 border-white dark:border-slate-700 shadow-sm" />
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{user.name}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-0.5">{user.department}</p>
                                                                </div>
                                                            </button>
                                                        ))}

                                                        {userSearch.trim() && !filteredUsers.some(u => u.name.toLowerCase() === userSearch.toLowerCase()) && (
                                                            <button
                                                                type="button"
                                                                onClick={handleManualEntry}
                                                                className="w-full text-left p-4 bg-blue-50/50 dark:bg-blue-900/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/50 flex items-center gap-4 transition-all rounded-xl mt-1"
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                                    <Plus size={16} strokeWidth={3} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">Add "{userSearch}"</p>
                                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual entry session</p>
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
                                                <option value="" disabled>Select Department</option>
                                                {departments.map((dept, idx) => (
                                                    <option key={idx} value={dept}>{dept}</option>
                                                ))}
                                                {formData.department && !departments.includes(formData.department) && (
                                                    <option value={formData.department}>{formData.department}</option>
                                                )}
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Start Date</label>
                                        <input
                                            type="date"
                                            className={`${inputClass} cursor-pointer`}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            value={createdAt}
                                            onChange={(e) => setCreatedAt(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>{formData.status === 'Completed' ? 'Completed Date' : 'Updated Date'}</label>
                                        <input
                                            type="date"
                                            className={`${inputClass} cursor-pointer`}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            value={formData.status === 'Completed' ? completedAt : updatedAt}
                                            onChange={(e) => formData.status === 'Completed' ? setCompletedAt(e.target.value) : setUpdatedAt(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Duration & Location */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                                                placeholder="e.g. Head Office"
                                            />
                                            <MapPin size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Category & Priority */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Category</label>
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
                                                <option value="Infrastructure & Network">Infra & Network</option>
                                                <option value="Procurement & Assets">Assets Log</option>
                                                <option value="Technical Support">Support</option>
                                                <option value="Web Development">Development</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Priority</label>
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
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* IT Personnel & Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>IT Personnel</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={inputLockedClass}
                                                value={formData.itPersonnel || ''}
                                                readOnly
                                            />
                                            <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Status</label>
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
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className={labelClass}>Remarks</label>
                                    <textarea
                                        rows={3}
                                        className={`${inputClass} resize-none`}
                                        value={formData.remarks || ''}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="activityForm"
                                className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-blue-500 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <CheckCircle2 size={16} />
                                {initialData ? 'Update Record' : 'Save Entry'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};