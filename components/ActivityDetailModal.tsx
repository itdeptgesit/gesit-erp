
'use client';

import React from 'react';
import { X, User, Building2, Calendar, Clock, MapPin, ClipboardList, CheckSquare } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityLog | null;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ isOpen, onClose, activity }) => {
  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-xl animate-in fade-in zoom-in duration-200 overflow-hidden border border-white/20 dark:border-slate-800">
        <div className="flex justify-end pt-6 pr-6 bg-slate-50 dark:bg-slate-800/30">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="px-10 pb-10 pt-4 bg-slate-50 dark:bg-slate-800/30">
            <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1 tracking-tighter uppercase italic">{activity.itPersonnel}</h2>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{activity.activityName}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-6 uppercase font-black tracking-[0.2em]">{activity.category}</p>

            <div className="flex items-center justify-between mb-8">
                <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase border shadow-sm ${activity.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/50'}`}>
                    {activity.status}
                </span>
                <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase border ${activity.type === 'Critical' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'}`}>
                    {activity.type} Severity
                </span>
            </div>

             <div className="grid grid-cols-2 gap-y-8 gap-x-8 text-sm bg-white dark:bg-slate-900 p-8 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                 
                 <div>
                     <div className="flex items-center gap-2 mb-2">
                         <User size={14} className="text-blue-500" />
                         <p className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Requester</p>
                     </div>
                     <p className="text-slate-800 dark:text-slate-200 font-bold uppercase">{activity.requester || 'System Core'}</p>
                 </div>

                 <div>
                     <div className="flex items-center gap-2 mb-2">
                         <Building2 size={14} className="text-blue-500" />
                         <p className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Department</p>
                     </div>
                     <p className="text-slate-800 dark:text-slate-200 font-bold uppercase">{activity.department || 'General'}</p>
                 </div>

                 <div>
                     <div className="flex items-center gap-2 mb-2">
                         <Calendar size={14} className="text-blue-500" />
                         <p className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Start Date</p>
                     </div>
                     <p className="text-slate-800 dark:text-slate-200 font-bold font-mono">{activity.createdAt}</p>
                 </div>

                 <div>
                     <div className="flex items-center gap-2 mb-2">
                         <CheckSquare size={14} className="text-emerald-500" />
                         <p className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Completion</p>
                     </div>
                     <p className="text-slate-800 dark:text-slate-200 font-bold font-mono">{activity.completedAt || '-- : --'}</p>
                 </div>

                 <div>
                     <div className="flex items-center gap-2 mb-2">
                         <MapPin size={14} className="text-blue-500" />
                         <p className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Location</p>
                     </div>
                     <p className="text-slate-800 dark:text-slate-200 font-bold uppercase">{activity.location || 'Site Office'}</p>
                 </div>

                 <div>
                     <div className="flex items-center gap-2 mb-2">
                         <Clock size={14} className="text-blue-500" />
                         <p className="font-black text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Total Duration</p>
                     </div>
                     <p className="text-slate-800 dark:text-slate-200 font-bold uppercase">{activity.duration || 'N/A'}</p>
                 </div>

                 <div className="col-span-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                     <div className="flex items-center gap-2 mb-3">
                         <ClipboardList size={14} className="text-blue-500" />
                         <p className="font-black text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">Diagnostic Remarks</p>
                     </div>
                     <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 italic leading-relaxed text-[13px] shadow-inner">
                        "{activity.remarks || 'No additional notes provided.'}"
                     </div>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};
