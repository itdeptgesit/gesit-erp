'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Loader2, Target, Info, CalendarRange } from 'lucide-react';
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

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<WeeklyPlan>>({
    task: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    category: 'Maintenance',
    assignee: currentUserName ? currentUserName.split(' ')[0] : 'IT',
    startDate: today,
    dueDate: today,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          description: initialData.description || initialData.remarks || '',
          startDate: initialData.startDate || initialData.dueDate || today,
          dueDate: initialData.dueDate || today,
        });
      } else {
        setFormData({
          task: '',
          description: '',
          priority: 'Medium',
          status: 'To Do',
          category: 'Maintenance',
          assignee: currentUserName ? currentUserName.split(' ')[0] : 'IT',
          startDate: today,
          dueDate: today,
        });
      }
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, currentUserName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task) return;

    // Ensure endDate >= startDate
    if (formData.startDate && formData.dueDate && formData.startDate > formData.dueDate) {
      alert('End date must be after start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      console.error("Submission error:", error?.message || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600";
  const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest";

  const isMultiDay = formData.startDate && formData.dueDate && formData.startDate !== formData.dueDate;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Target size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Event' : 'Add Event'}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                {initialData ? 'Update task parameters' : 'Create a new calendar event'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="taskForm" onSubmit={handleSubmit} className="space-y-5">

            {/* Task Title */}
            <div>
              <label className={labelClass}>Event Title *</label>
              <input
                type="text"
                className={inputClass}
                value={formData.task || ''}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                placeholder="What needs to be done?"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Details / Notes</label>
              <textarea
                rows={3}
                className={`${inputClass} resize-none leading-relaxed`}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional context, steps, or requirements..."
              />
            </div>

            {/* Date Range */}
            <div>
              <label className={cn(labelClass, "flex items-center gap-1.5 mb-1")}>
                <CalendarRange size={11} />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 pl-1">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className={`${inputClass} pl-10 mt-0`}
                      value={formData.startDate || ''}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          startDate: newStart,
                          // Auto-adjust end date if it's before new start
                          dueDate: prev.dueDate && prev.dueDate < newStart ? newStart : prev.dueDate
                        }));
                      }}
                      required
                    />
                    <Calendar size={13} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 pl-1">End Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className={`${inputClass} pl-10 mt-0`}
                      value={formData.dueDate || ''}
                      min={formData.startDate || undefined}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                    <Calendar size={13} className="absolute left-3 top-3 text-slate-400" />
                  </div>
                </div>
              </div>
              {isMultiDay && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                  <CalendarRange size={11} />
                  Multi-day event: {formData.startDate} → {formData.dueDate}
                </div>
              )}
            </div>

            {/* Assignee + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Assignee</label>
                <div className="relative">
                  <input
                    type="text"
                    className={`${inputClass} pl-9`}
                    value={formData.assignee || ''}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    placeholder="Name"
                    required
                  />
                  <User size={13} className="absolute left-3 top-3.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select
                  className={inputClass}
                  value={formData.priority || 'Medium'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High / Urgent</option>
                </select>
              </div>
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <div className="relative">
                  <select
                    className={`${inputClass} pl-9`}
                    value={formData.category || 'Maintenance'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Project">Project</option>
                    <option value="Support">Support</option>
                    <option value="Meeting">Meeting</option>
                  </select>
                  <Tag size={13} className="absolute left-3 top-3.5 text-slate-400" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={formData.status || 'To Do'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="taskForm"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
            {initialData ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper (inline cn since it's used in JSX)
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}