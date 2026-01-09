
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, UserCircle, Pencil, Trash2, RefreshCcw, UserPlus, AlertCircle } from 'lucide-react';
import { DepartmentFormModal } from './DepartmentFormModal';
import { DepartmentMembersModal } from './DepartmentMembersModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';

interface Department {
    id: number;
    name: string;
    head: string;
    memberCount: number;
    description: string;
}

export const MasterDepartment: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [selectedDeptForMembers, setSelectedDeptForMembers] = useState<Department | null>(null);
    const [deleteDept, setDeleteDept] = useState<Department | null>(null);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDepartments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: deptData, error: deptError } = await supabase.from('departments').select('*').order('id', { ascending: true });
            if (deptError) throw deptError;

            const { data: userData, error: userError } = await supabase.from('user_accounts').select('department');
            if (userError) throw userError;

            if (deptData) {
                const mapped = deptData.map(d => {
                    const count = userData ? userData.filter((u: any) => {
                        const depts = (u.department || '').split(',').map((name: string) => name.trim().toLowerCase());
                        return depts.includes(d.name.trim().toLowerCase());
                    }).length : 0;

                    return {
                        id: d.id,
                        name: d.name,
                        head: d.head,
                        memberCount: count,
                        description: d.description
                    };
                });
                setDepartments(mapped);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchDepartments(); }, []);

    const filteredDepts = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.head || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setEditingDept(null);
        setIsModalOpen(true);
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setIsModalOpen(true);
    };

    const handleManageMembers = (dept: Department) => {
        setSelectedDeptForMembers(dept);
        setIsMembersModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteDept) return;
        setIsProcessing(true);
        try {
            const { error: deleteError } = await supabase.from('departments').delete().eq('id', deleteDept.id);
            if (deleteError) throw deleteError;
            await fetchDepartments();
            setDeleteDept(null);
        } catch (err: any) {
            setError("Failed to delete record: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (data: Partial<Department>) => {
        const payload = {
            name: data.name,
            head: data.head,
            description: data.description
        };

        try {
            if (editingDept) {
                const { error: updateError } = await supabase.from('departments').update(payload).eq('id', editingDept.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('departments').insert([payload]);
                if (insertError) throw insertError;
            }
            fetchDepartments();
        } catch (err: any) {
            alert("Failed to save department: " + err.message);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 pb-10">
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Master Department</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Manage your company's department</p></div>
                <div className="flex gap-2">
                    <button onClick={fetchDepartments} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all">
                        <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-blue-700 shadow-sm active:scale-95 transition-all"
                    >
                        <Plus size={16} /> New Dept
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search departments..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 font-medium transition-all text-slate-900 dark:text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">ID</th>
                                <th className="px-6 py-4">Department Name</th>
                                <th className="px-6 py-4">Head / Leader</th>
                                <th className="px-6 py-4 text-center">Personnel</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-20"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
                            ) : filteredDepts.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-20 text-slate-300 dark:text-slate-700 text-xs font-medium">No department records found.</td></tr>
                            ) : filteredDepts.map((dept) => (
                                <tr key={dept.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all group">
                                    <td className="px-6 py-4 text-slate-300 dark:text-slate-700 font-mono text-xs text-center">{dept.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                                                <Users size={16} />
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">{dept.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{dept.head || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleManageMembers(dept)} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase border border-blue-100 dark:border-blue-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition-all">
                                            {dept.memberCount} Members
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(dept)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"><Pencil size={16} /></button>
                                            <button onClick={() => setDeleteDept(dept)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <DepartmentFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} initialData={editingDept} />
            <DepartmentMembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} department={selectedDeptForMembers} onUpdate={fetchDepartments} />
            <DangerConfirmModal isOpen={!!deleteDept} onClose={() => setDeleteDept(null)} onConfirm={executeDelete} title="Delete Department" message="Remove department from registry?" isLoading={isProcessing} />
        </div>
    );
};
