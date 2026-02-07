'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Plus, Clock, CheckCircle2,
    ChevronLeft, ChevronRight, RefreshCcw, X, Loader2, Zap, LayoutGrid, CalendarRange, ListTodo, User, Tag, Pencil, Trash2
} from 'lucide-react';
import { WeeklyPlan, UserAccount } from '../types';
import { WeeklyTaskModal } from './WeeklyTaskModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';

const INDONESIAN_HOLIDAYS: { [key: string]: string } = {
    // 2025
    '2025-01-01': 'Tahun Baru Masehi',
    '2025-01-27': 'Isra Mi\'raj',
    '2025-01-29': 'Tahun Baru Imlek',
    '2025-03-29': 'Hari Raya Nyepi',
    '2025-03-31': 'Idul Fitri',
    '2025-04-01': 'Idul Fitri',
    '2025-04-18': 'Wafat Yesus Kristus',
    '2025-05-01': 'Hari Buruh Internasional',
    '2025-05-12': 'Hari Raya Waisak',
    '2025-05-29': 'Kenaikan Yesus Kristus',
    '2025-06-01': 'Hari Lahir Pancasila',
    '2025-06-06': 'Idul Adha',
    '2025-06-27': 'Tahun Baru Islam',
    '2025-08-17': 'Hari Kemerdekaan RI',
    '2025-09-05': 'Maulid Nabi Muhammad',
    '2025-12-25': 'Hari Raya Natal',

    // 2026
    '2026-01-01': 'Tahun Baru Masehi',
    '2026-02-15': 'Isra Mi\'raj',
    '2026-02-17': 'Tahun Baru Imlek',
    '2026-03-19': 'Hari Raya Nyepi',
    '2026-03-20': 'Idul Fitri',
    '2026-03-21': 'Idul Fitri',
    '2026-04-03': 'Wafat Yesus Kristus',
    '2026-05-01': 'Hari Buruh Internasional',
    '2026-05-14': 'Kenaikan Yesus Kristus',
    '2026-05-31': 'Hari Raya Waisak',
    '2026-06-01': 'Hari Lahir Pancasila',
    '2026-05-27': 'Idul Adha',
    '2026-07-16': 'Tahun Baru Islam',
    '2026-08-17': 'Hari Kemerdekaan RI',
    '2026-09-25': 'Maulid Nabi Muhammad',
    '2026-12-25': 'Hari Raya Natal',
};

interface WeeklyPlanManagerProps {
    currentUser: UserAccount | null;
}

export const WeeklyPlanManager: React.FC<WeeklyPlanManagerProps> = ({ currentUser }) => {
    const { t } = useLanguage();
    const [tasks, setTasks] = useState<WeeklyPlan[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'Week' | 'Month' | 'Day'>('Month');
    const [editingTask, setEditingTask] = useState<WeeklyPlan | null>(null);
    const [deleteTask, setDeleteTask] = useState<WeeklyPlan | null>(null);
    const [viewDate, setViewDate] = useState(new Date());

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('weekly_plans')
                .select('id, task, description, assignee, priority, status, due_date, week, category, related_purchase_id, start_time');

            if (error) throw error;
            if (data) {
                setTasks(data.map(t => ({
                    id: t.id,
                    task: t.task,
                    description: t.description,
                    remarks: t.description,
                    assignee: t.assignee,
                    priority: t.priority,
                    status: t.status,
                    dueDate: t.due_date,
                    startTime: t.start_time || '09:00',
                    week: t.week,
                    category: t.category,
                    relatedPurchaseId: t.related_purchase_id
                })));
            }
        } catch (err: any) {
            console.error("Fetch tasks error:", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleEdit = (task: WeeklyPlan) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteTask) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('weekly_plans').delete().eq('id', deleteTask.id);
            if (error) throw error;
            await fetchTasks();
            setDeleteTask(null);
        } catch (err: any) {
            alert("Delete failed: " + (err.message || "Unknown error"));
        } finally {
            setIsActionLoading(false);
        }
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => {
        const d = new Date(year, month, 1).getDay();
        return d === 0 ? 6 : d - 1;
    };

    const monthGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const grid = [];
        const prevMonthDays = daysInMonth(year, month - 1);
        for (let i = startDay - 1; i >= 0; i--) {
            grid.push({ date: new Date(year, month - 1, prevMonthDays - i), currentMonth: false });
        }
        for (let i = 1; i <= totalDays; i++) {
            grid.push({ date: new Date(year, month, i), currentMonth: true });
        }
        const remaining = 42 - grid.length;
        for (let i = 1; i <= remaining; i++) {
            grid.push({ date: new Date(year, month + 1, i), currentMonth: false });
        }
        return grid;
    }, [viewDate]);

    const weekGrid = useMemo(() => {
        const current = new Date(viewDate);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(current.setDate(diff));
        const grid = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            grid.push(d);
        }
        return grid;
    }, [viewDate]);

    const navigate = (direction: number) => {
        const next = new Date(viewDate);
        if (viewMode === 'Day') next.setDate(next.getDate() + direction);
        else if (viewMode === 'Week') next.setDate(next.getDate() + (direction * 7));
        else next.setMonth(next.getMonth() + direction);
        setViewDate(next);
    };

    const getTaskColor = (category: string) => {
        switch (category) {
            case 'Meeting': return 'bg-blue-600';
            case 'Maintenance': return 'bg-amber-500';
            case 'Project': return 'bg-purple-600';
            case 'Support': return 'bg-emerald-500';
            default: return 'bg-slate-400';
        }
    };

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const isRedDay = (date: Date) => {
        const day = date.getDay();
        const dateStr = formatDate(date);
        return day === 0 || day === 6 || !!INDONESIAN_HOLIDAYS[dateStr];
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700 pb-10">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><Calendar size={20} /></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase leading-none">
                            {viewMode === 'Day' ? viewDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Assignment Planner</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                    {[{ id: 'Day', icon: Zap }, { id: 'Week', icon: LayoutGrid }, { id: 'Month', icon: CalendarRange }].map(m => (
                        <button key={m.id} onClick={() => setViewMode(m.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${viewMode === m.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><m.icon size={12} /> {m.id}</button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400"><ChevronLeft size={16} /></button>
                        <button onClick={() => setViewDate(new Date())} className="px-4 text-[10px] font-bold uppercase hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">Today</button>
                        <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400"><ChevronRight size={16} /></button>
                    </div>
                    {canManage && (
                        <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-black dark:hover:bg-blue-700 shadow-lg">
                            <Plus size={16} /> Assign
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex-1 overflow-hidden flex flex-col min-h-[600px]">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4"><RefreshCcw className="animate-spin text-blue-500" size={32} /><p className="text-xs font-bold text-slate-400 uppercase">Synchronizing Schedule...</p></div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {viewMode === 'Month' && (
                            <div className="grid grid-cols-7 h-full min-w-[900px]">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="py-4 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">{day}</div>
                                ))}
                                {monthGrid.map((cell, idx) => {
                                    const dateStr = formatDate(cell.date);
                                    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
                                    const isHoliday = !!INDONESIAN_HOLIDAYS[dateStr];
                                    const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
                                    const isToday = cell.date.toDateString() === new Date().toDateString();

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => { setViewDate(cell.date); setViewMode('Day'); }}
                                            className={`min-h-[120px] border-r border-b border-slate-50 dark:border-slate-800 p-4 transition-all cursor-pointer 
                                                ${!cell.currentMonth ? 'opacity-20 bg-slate-50/10 dark:bg-slate-800/5' : 'bg-white dark:bg-slate-900'} 
                                                hover:bg-blue-50/30 dark:hover:bg-blue-900/10 
                                                ${(isHoliday || isWeekend) && cell.currentMonth ? 'bg-rose-50/20 dark:bg-rose-900/5' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-lg 
                                                    ${isToday ? 'bg-blue-600 text-white shadow-md' : (isHoliday || isWeekend) ? 'text-rose-600 dark:text-rose-500' : 'text-slate-400'}`}>
                                                    {cell.date.getDate()}
                                                </span>
                                                {isHoliday && cell.currentMonth && (
                                                    <span className="text-[9px] font-black text-rose-500 uppercase leading-tight text-right max-w-[80px] line-clamp-2">
                                                        {INDONESIAN_HOLIDAYS[dateStr]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                {dayTasks.slice(0, 3).map(task => (
                                                    <div key={task.id} className={`px-2 py-1 rounded text-[9px] font-bold text-white truncate uppercase ${getTaskColor(task.category)}`}>
                                                        {task.task}
                                                    </div>
                                                ))}
                                                {dayTasks.length > 3 && (
                                                    <div className="text-[8px] font-bold text-blue-500 uppercase">+ {dayTasks.length - 3} More</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {viewMode === 'Week' && (
                            <div className="grid grid-cols-7 h-full min-w-[900px] divide-x divide-slate-50 dark:divide-slate-800">
                                {weekGrid.map((dayDate, idx) => {
                                    const dateStr = formatDate(dayDate);
                                    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
                                    const isToday = dayDate.toDateString() === new Date().toDateString();
                                    const isHoliday = !!INDONESIAN_HOLIDAYS[dateStr];
                                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                                    return (
                                        <div key={idx} className="flex flex-col h-full bg-slate-50/10 dark:bg-slate-900/10">
                                            <div className={`p-4 border-b border-slate-50 dark:border-slate-800 text-center ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : (isHoliday || isWeekend) ? 'bg-rose-50/20 dark:bg-rose-900/10' : ''}`}>
                                                <p className={`text-[10px] font-bold uppercase mb-1 ${isHoliday || isWeekend ? 'text-rose-500' : 'text-slate-400'}`}>
                                                    {dayDate.toLocaleDateString('en-GB', { weekday: 'short' })}
                                                </p>
                                                <p className={`text-xl font-bold ${isToday ? 'text-blue-600' : (isHoliday || isWeekend) ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                                    {dayDate.getDate()}
                                                </p>
                                                {isHoliday && (
                                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter mt-1 block">
                                                        {INDONESIAN_HOLIDAYS[dateStr]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">{dayTasks.length === 0 ? (<div className="h-20 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl opacity-30 text-[9px] font-bold uppercase text-slate-400">Clear</div>) : dayTasks.map(task => (
                                                <div key={task.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-blue-500 transition-all cursor-pointer">
                                                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${getTaskColor(task.category)}`}></div><span className="text-[8px] font-bold text-slate-400 uppercase">{task.category}</span></div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {canManage && <button onClick={(e) => { e.stopPropagation(); handleEdit(task); }} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={12} /></button>}
                                                            {canDelete && <button onClick={(e) => { e.stopPropagation(); setDeleteTask(task); }} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={12} /></button>}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-600">{task.task}</h4>
                                                    <div className="mt-3 flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-2"><div className="flex items-center gap-1"><User size={10} className="text-slate-400" /><span className="text-[9px] font-bold text-slate-500 uppercase">{task.assignee ? task.assignee.split(' ')[0] : 'IT'}</span></div><span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${task.priority === 'High' ? 'text-rose-500' : 'text-slate-400'}`}>{task.priority}</span></div>
                                                </div>
                                            ))}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {viewMode === 'Day' && (
                            <div className="p-8 max-w-4xl mx-auto space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6"><div><h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{viewDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', weekday: 'long' })}</h3><p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Selected timeline activities</p></div><div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-blue-600 font-bold text-xs"><ListTodo size={16} /> {tasks.filter(t => t.dueDate === formatDate(viewDate)).length} Tasks planned</div></div>
                                <div className="space-y-4">{tasks.filter(t => t.dueDate === formatDate(viewDate)).length === 0 ? (<div className="py-20 text-center opacity-30"><Calendar size={48} className="mx-auto text-slate-400 mb-4" /><p className="text-[10px] font-bold uppercase tracking-[0.2em]">No activities scheduled for today</p></div>) : tasks.filter(t => t.dueDate === formatDate(viewDate)).map(task => (
                                    <div key={task.id} className="flex gap-6 group"><div className="w-20 shrink-0 text-right pt-4"><p className="text-sm font-black text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors font-mono">{task.startTime || '09:00'}</p></div><div className="relative pb-8 flex-1"><div className="absolute left-[-1.85rem] top-5 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-full z-10 group-hover:border-blue-500 transition-colors"></div><div className="absolute left-[-1.5rem] top-8 bottom-0 w-px bg-slate-100 dark:bg-slate-800"></div><div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:shadow-md group-hover:border-blue-100 dark:group-hover:border-blue-900/50 transition-all flex justify-between items-start"><div className="space-y-3"><div className="flex items-center gap-3"><span className={`px-2 py-0.5 rounded text-[8px] font-black text-white uppercase ${getTaskColor(task.category)}`}>{task.category}</span><h4 className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{task.task}</h4></div><p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">{task.description || "No additional technical context provided for this task node."}</p><div className="flex items-center gap-6 pt-2"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">{task.assignee ? task.assignee.substring(0, 1) : 'I'}</div><span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{task.assignee ? task.assignee.split(' ')[0] : 'Engineer'}</span></div><div className="flex items-center gap-2"><Zap size={12} className={task.priority === 'High' ? 'text-rose-500' : 'text-slate-400'} /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.priority} Priority</span></div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canManage && <button onClick={() => handleEdit(task)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all"><Pencil size={14} /></button>}
                                            {canDelete && <button onClick={() => setDeleteTask(task)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-lg transition-all"><Trash2 size={14} /></button>}
                                        </div>
                                    </div></div><div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${task.status === 'Done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{task.status}</div></div></div></div>
                                ))}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <WeeklyTaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} initialData={editingTask} onSubmit={async (newTask) => {
                try {
                    if (!newTask.task) return;
                    const dateObj = newTask.dueDate ? new Date(newTask.dueDate) : new Date();
                    const payload = { task: newTask.task, description: newTask.description || newTask.remarks || '', assignee: newTask.assignee || 'IT', status: newTask.status || 'To Do', due_date: newTask.dueDate, category: newTask.category || 'Maintenance', priority: newTask.priority || 'Medium', week: `W${Math.ceil(dateObj.getDate() / 7)}` };
                    if (editingTask) { await supabase.from('weekly_plans').update(payload).eq('id', editingTask.id); }
                    else { await supabase.from('weekly_plans').insert([payload]); }
                    setIsModalOpen(false); setEditingTask(null); await fetchTasks();
                } catch (err: any) { alert("Commencing failed:\n" + (err.message || "Database synchronization error")); }
            }} currentUserName={currentUser?.fullName} />

            <DangerConfirmModal isOpen={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={executeDelete} title="Purge Task Node" message={`Are you sure you want to delete "${deleteTask?.task}"?`} isLoading={isActionLoading} />
        </div>
    );
};
