'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Loader2, Target, Info } from 'lucide-react';
import { WeeklyPlan } from '../types';

interface WeeklyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<WeeklyPlan>) => Promise<void>;
  initialData?: WeeklyPlan | null;
  currentUserName?: string;
}

export const WeeklyTaskModal: React.FC<WeeklyTaskModalProps> = ({ isOpen, onClose, onSubmit, initialData, currentUserName }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<WeeklyPlan>>({
    task: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    category: 'Maintenance',
    assignee: currentUserName ? currentUserName.split(' ')[0] : 'IT',
    dueDate: new Date().toISOString().split('T')[0],
  });

  // Reset or fill form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
            ...initialData,
            // Ensure description is used even if coming from remarks
            description: initialData.description || initialData.remarks || ''
        });
      } else {
        setFormData({
          task: '',
          description: '',
          priority: 'Medium',
          status: 'To Do',
          category: 'Maintenance',
          assignee: currentUserName ? currentUserName.split(' ')[0] : 'IT',
          dueDate: new Date().toISOString().split('T')[0],
        });
      }
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, currentUserName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Parent handles closure on success
    } catch (error: any) {
      const errorMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error));
      console.error("Submission error in modal detail:", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600";
  const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border border-white/10 dark:border-slate-800">
        <div className="flex justify-between items-center px-10 py-8 border-b border-slate-50 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    {initialData ? 'Modify Operation' : 'Assign Operation'}
                </h2>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-6">
                {initialData ? 'Update existing task parameters' : 'Initialize New Project / Maintenance Node'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <form id="taskForm" onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <label className={labelClass}>Objective Title</label>
                    <input 
                      type="text" 
                      className={inputClass} 
                      value={formData.task || ''} 
                      onChange={(e) => setFormData({...formData, task: e.target.value})} 
                      placeholder="What needs to be accomplished?"
                      required 
                    />
                </div>
                
                <div>
                    <label className={labelClass}>Technical Scope / Details</label>
                    <textarea 
                      rows={4} 
                      className={`${inputClass} resize-none`} 
                      value={formData.description || ''} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Outline specific steps or requirements for this task..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className={labelClass}>Lead Assignee</label>
                        <div className="relative">
                            <input 
                              type="text" 
                              className={`${inputClass} pl-10`} 
                              value={formData.assignee || ''} 
                              onChange={(e) => setFormData({...formData, assignee: e.target.value})} 
                              placeholder="Engineer name"
                              required 
                            />
                            <User size={14} className="absolute left-3.5 top-4 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Priority Level</label>
                        <select 
                          className={inputClass} 
                          value={formData.priority || 'Medium'} 
                          onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                        >
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority / Urgent</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Execution Date</label>
                        <div className="relative">
                            <input 
                              type="date" 
                              className={`${inputClass} pl-10`} 
                              value={formData.dueDate || ''} 
                              onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                              required 
                            />
                            <Calendar size={14} className="absolute left-3.5 top-4 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Project Category</label>
                        <div className="relative">
                            <select 
                              className={`${inputClass} pl-10`} 
                              value={formData.category || 'Maintenance'} 
                              onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="Maintenance">Maintenance</option>
                                <option value="Project">Project / Deployment</option>
                                <option value="Support">Support Request</option>
                                <option value="Meeting">Meeting / Sync</option>
                            </select>
                            <Tag size={14} className="absolute left-3.5 top-4 text-slate-400" />
                        </div>
                    </div>
                    {initialData && (
                        <div>
                            <label className={labelClass}>Current Status</label>
                            <select 
                              className={inputClass} 
                              value={formData.status || 'To Do'} 
                              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending">Pending</option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                    <span className="shrink-0 mt-0.5">
                      <Info size={16} className="text-blue-600" />
                    </span>
                    <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                        Task nodes committed to the planner are synchronized across the engineering team dashboard and recorded in the audit history upon completion.
                    </p>
                </div>
            </form>
        </div>

        <div className="px-10 py-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2.5rem] flex justify-end gap-3">
            <button 
                type="button" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="px-8 py-3 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                form="taskForm" 
                disabled={isSubmitting}
                className="px-10 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {initialData ? 'Update Node' : 'Commit Node'}
            </button>
        </div>
      </div>
    </div>
  );
};