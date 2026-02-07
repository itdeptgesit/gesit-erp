
'use client';

import React from 'react';
import { X, User, Building2, Calendar, Clock, MapPin, ClipboardList, CheckSquare, Zap, ShieldCheck, Target } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { ActivityLog } from '../types';

interface ActivityDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    activity: ActivityLog | null;
    userAvatarMap?: Record<string, string>;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ isOpen, onClose, activity, userAvatarMap = {} }) => {
    if (!isOpen || !activity) return null;

    const formatDate = (date: string | null | undefined) => {
        if (!date) return null;
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return date;
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return date;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl animate-in fade-in zoom-in duration-300 overflow-hidden border border-white/20 dark:border-slate-800 flex flex-col">
                <div className="flex justify-between items-center px-10 pt-10 pb-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
                    <div className="flex items-center gap-4">
                        <UserAvatar name={activity.itPersonnel} url={userAvatarMap[activity.itPersonnel]} size="lg" className="ring-offset-4 ring-offset-white dark:ring-offset-slate-900 ring-blue-500/20 shadow-xl" />
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-1">{activity.itPersonnel}</h2>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={12} className="text-blue-500" />
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-[0.2em]">IT Personnel</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-10 pb-10">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase leading-tight">{activity.activityName}</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                {activity.category}
                            </span>
                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${activity.type === 'Critical' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'}`}>
                                {activity.type} Severity
                            </span>
                            <div className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400`}>
                                <Zap size={10} className="fill-current" />
                                {activity.status}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <User size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-[0.2em] mb-0.5">Requester</p>
                                <p className="text-slate-900 dark:text-slate-100 font-black text-sm uppercase tracking-tight">{activity.requester || 'System Core'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <Building2 size={16} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-[0.2em] mb-0.5">Department</p>
                                <p className="text-slate-900 dark:text-slate-100 font-black text-sm uppercase tracking-tight">{activity.department || 'General'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <Calendar size={16} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-[0.2em] mb-0.5">Plan / Starts</p>
                                <p className="text-slate-900 dark:text-slate-100 font-black text-sm uppercase tracking-tight">{formatDate(activity.createdAt) || 'Not Set'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <CheckSquare size={16} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-[0.2em] mb-0.5">Completion</p>
                                <p className="text-slate-900 dark:text-slate-100 font-black text-sm uppercase tracking-tight">{formatDate(activity.completedAt) || 'In-Progress'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <MapPin size={16} className="text-rose-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-[0.2em] mb-0.5">Location</p>
                                <p className="text-slate-900 dark:text-slate-100 font-black text-sm uppercase tracking-tight">{activity.location || 'Site Office'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <Clock size={16} className="text-cyan-500" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-[0.2em] mb-0.5">Total Duration</p>
                                <p className="text-slate-900 dark:text-slate-100 font-black text-sm uppercase tracking-tight">{activity.duration || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="col-span-2 mt-2 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.3em]">Diagnostic Remarks</p>
                            </div>
                            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 italic leading-relaxed text-[15px] shadow-sm font-medium relative overflow-hidden group">
                                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500/40 transition-all"></div>
                                "{activity.remarks || 'No additional protocols recorded.'}"
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
