'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, Clock, User, ShieldCheck, Tag, Info, CheckCircle2, MapPin, Building2, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { ActivityLog } from '../types';
import { supabase } from '../lib/supabaseClient';

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

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, currentUserName, users = [], departments = [] }) => {
    const [formData, setFormData] = useState<Partial<ActivityLog>>({});

    // Date State (No Time)
    const [createdAt, setCreatedAt] = useState('');
    const [completedAt, setCompletedAt] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');

    // User Search State
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const userDropdownRef = useRef<HTMLDivElement>(null);

    // Initial Load Logic
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
                // New Entry Defaults
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

    // Click outside to close user dropdown
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
        // Try to match the user's department to one in our master list
        const matchedDept = departments.find(d => d.toLowerCase() === user.department.toLowerCase()) || user.department;
        setFormData(prev => ({ ...prev, requester: user.name, department: matchedDept || prev.department }));
        setUserSearch(user.name);
        setShowUserDropdown(false);
    };

    const handleManualEntry = () => {
        setFormData(prev => ({ ...prev, requester: userSearch }));
        setShowUserDropdown(false);
    };

    if (!isOpen) return null;

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

    // Styling Constants (Glassmorphism)
    const overlayClass = "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto";
    const modalClass = "bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border border-white/20 dark:border-slate-800 relative overflow-hidden";
    const headerClass = "flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative z-10";

    // Input Styles
    const inputGroupClass = "space-y-1.5 relative";
    const labelClass = "block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1";
    const inputBaseClass = "w-full px-4 py-3 text-sm font-semibold rounded-xl outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600";
    const inputDefaultClass = `${inputBaseClass} bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10`;
    const inputLockedClass = `${inputBaseClass} bg-slate-100 dark:bg-slate-900 border border-transparent text-slate-400 cursor-not-allowed`;

    return (
        <div className={overlayClass}>
            <div className={modalClass}>
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className={headerClass}>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            {initialData ? <PencilIcon className="text-blue-500" /> : <PlusIcon className="text-blue-500" />}
                            {initialData ? 'Update Activity' : 'New Activity Entry'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Engineering & Technical Support Registry</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-rose-500 hover:rotate-90 duration-300"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
                    <form id="activityForm" onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Main Activity Info */}
                        <div className={inputGroupClass}>
                            <label className={labelClass}>Activity / Job Description</label>
                            <input
                                type="text"
                                className={`${inputDefaultClass} !text-lg !py-4 shadow-sm`}
                                value={formData.activityName || ''}
                                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                                required
                                placeholder="Describe the task..."
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 2. Requester (Searchable) */}
                            <div className={inputGroupClass} ref={userDropdownRef}>
                                <label className={labelClass}>Requester (User)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputDefaultClass}
                                        value={userSearch}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            setShowUserDropdown(true);
                                        }}
                                        onFocus={() => setShowUserDropdown(true)}
                                        placeholder="Search user..."
                                    />
                                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />

                                    {/* Dropdown */}
                                    {showUserDropdown && (userSearch.trim().length > 0 || filteredUsers.length > 0) && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto z-50 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                            {filteredUsers.map((user, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleUserSelect(user)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{user.department}</p>
                                                    </div>
                                                </button>
                                            ))}

                                            {/* Manual Entry Option */}
                                            {userSearch.trim() && !filteredUsers.some(u => u.name.toLowerCase() === userSearch.toLowerCase()) && (
                                                <button
                                                    type="button"
                                                    onClick={handleManualEntry}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-slate-800"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Use Custom: "{userSearch}"</p>
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Manual Entry</p>
                                                    </div>
                                                </button>
                                            )}

                                            {filteredUsers.length === 0 && !userSearch.trim() && (
                                                <div className="p-4 text-center text-xs text-slate-400 font-medium italic">Type to search or enter name...</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Department (Master Dropdown) */}
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Department</label>
                                <div className="relative">
                                    <select
                                        className={inputDefaultClass}
                                        value={formData.department || ''}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {departments.length > 0 ? (
                                            departments.map((dept, idx) => (
                                                <option key={idx} value={dept}>{dept}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="IT">IT</option>
                                                <option value="HRGA">HRGA</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Trading">Trading</option>
                                                <option value="Legal">Legal</option>
                                                <option value="Marketing">Marketing</option>
                                                <option value="Business Development">Business Development</option>
                                            </>
                                        )}
                                        {/* Fallback option if current department isn't in master list */}
                                        {formData.department && !departments.includes(formData.department) && (
                                            <option value={formData.department}>{formData.department}</option>
                                        )}
                                    </select>
                                    <Building2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* 4. Dates Only (Replaced Time Rows) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Start Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        className={`${inputDefaultClass} cursor-pointer`}
                                        onClick={(e) => e.currentTarget.showPicker()}
                                        value={createdAt}
                                        onChange={(e) => setCreatedAt(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {formData.status === 'Completed' ? (
                                <div className={inputGroupClass}>
                                    <label className={labelClass}>Completion Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className={`${inputDefaultClass} border-emerald-200 dark:border-emerald-900/50 cursor-pointer`}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            value={completedAt}
                                            onChange={(e) => setCompletedAt(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className={inputGroupClass}>
                                    <label className={labelClass}>Update Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className={`${inputDefaultClass} border-blue-200 dark:border-blue-900/50 cursor-pointer`}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            value={updatedAt}
                                            onChange={(e) => setUpdatedAt(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 5. Duration (Manual) */}
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Duration (Manual)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputDefaultClass}
                                        value={formData.duration || ''}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="e.g. 1h 30m"
                                    />
                                    <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>

                            {/* Location */}
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Location</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputDefaultClass}
                                        value={formData.location || ''}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g. Server Room"
                                    />
                                    <MapPin size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category & Type */}
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Category</label>
                                <select className={inputDefaultClass} value={formData.category || 'Troubleshooting'} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
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
                            </div>
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Severity</label>
                                <select className={inputDefaultClass} value={formData.type || 'Minor'} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} required>
                                    <option value="Minor">Minor</option>
                                    <option value="Major">Major</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Engineer (Locked) & Status */}
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Engineer</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={inputLockedClass}
                                        value={formData.itPersonnel || ''}
                                        readOnly
                                    />
                                    <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </div>
                            <div className={inputGroupClass}>
                                <label className={labelClass}>Status</label>
                                <select className={inputDefaultClass} value={formData.status || 'Completed'} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} required>
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className={inputGroupClass}>
                            <label className={labelClass}>Technical Remarks</label>
                            <textarea
                                rows={4}
                                className={`${inputDefaultClass} resize-none leading-relaxed italic`}
                                value={formData.remarks || ''}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="Explain resolution details..."
                            />
                        </div>

                    </form>
                </div>

                <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md rounded-b-[2rem] flex justify-end gap-3 relative z-10">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-500 font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm">Cancel</button>
                    <button type="submit" form="activityForm" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Save Record
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Icons
const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
const PencilIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
);