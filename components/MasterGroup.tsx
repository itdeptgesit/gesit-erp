
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Layers, Pencil, Trash2, ShieldCheck, RefreshCcw } from 'lucide-react';
import { UserAccount, UserGroup } from '../types';
import { GroupFormModal } from './GroupFormModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { trackActivity } from '../lib/auditLogger';
import { useToast } from './ToastProvider';

interface MasterGroupProps {
    currentUser: UserAccount | null;
}

export const MasterGroup: React.FC<MasterGroupProps> = ({ currentUser }) => {
    const { showToast } = useToast();
    const [groups, setGroups] = useState<UserGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
    const [deleteGroup, setDeleteGroup] = useState<UserGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchGroups = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('user_groups').select('*');
        if (data) {
            const mapped = data.map(g => ({
                id: g.id,
                name: g.name,
                description: g.description,
                allowedMenus: g.allowed_menus || []
            }));
            setGroups(mapped);
        }
        setIsLoading(false);
    };

    useEffect(() => { fetchGroups(); }, []);

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setEditingGroup(null);
        setIsModalOpen(true);
    };

    const handleEdit = (group: UserGroup) => {
        setEditingGroup(group);
        setIsModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteGroup) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('user_groups').delete().eq('id', deleteGroup.id);
            if (error) throw error;

            await trackActivity(
                currentUser?.fullName || 'User',
                currentUser?.role || 'User',
                'Delete Group',
                'Security',
                `Deleted group ${deleteGroup.name}`
            );

            await fetchGroups();
            setDeleteGroup(null);
        } catch (err: any) {
            showToast("Failed to delete group: " + err.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (data: UserGroup) => {
        const payload = {
            id: data.id,
            name: data.name,
            description: data.description,
            allowed_menus: data.allowedMenus
        };

        if (editingGroup) {
            await supabase.from('user_groups').update(payload).eq('id', editingGroup.id);
        } else {
            await supabase.from('user_groups').insert([payload]);
        }

        await trackActivity(
            currentUser?.fullName || 'User',
            currentUser?.role || 'User',
            editingGroup ? 'Update Group' : 'Create Group',
            'Security',
            `${editingGroup ? 'Updated' : 'Created'} group ${data.name}`
        );

        fetchGroups();
    };

    return (
        <div className="animate-in fade-in duration-300 pb-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Master Group & Menu Access</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Configure user groups and their visible menus.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchGroups} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all">
                        <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-black dark:hover:bg-blue-700 shadow-sm active:scale-95 transition-all"
                    >
                        <Plus size={18} /> Add Group
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search group..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 font-medium transition-all text-slate-900 dark:text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">ID</th>
                                <th className="px-6 py-4">Group Name</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Accessible Menus</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-20"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
                            ) : filteredGroups.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-20 text-slate-300 dark:text-slate-700 text-xs font-medium">No group records found.</td></tr>
                            ) : filteredGroups.map((group) => (
                                <tr key={group.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all group">
                                    <td className="px-6 py-4 text-slate-300 dark:text-slate-700 font-mono text-xs text-center">{group.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                                                <Layers size={16} />
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">{group.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">{group.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {group.allowedMenus.slice(0, 4).map(m => (
                                                <span key={m} className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded-lg text-[9px] uppercase font-black">
                                                    {m}
                                                </span>
                                            ))}
                                            {group.allowedMenus.length > 4 && (
                                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold">
                                                    +{group.allowedMenus.length - 4} More
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(group)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit Permissions">
                                                <ShieldCheck size={16} />
                                            </button>
                                            <button onClick={() => setDeleteGroup(group)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <GroupFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                initialData={editingGroup}
            />

            <DangerConfirmModal
                isOpen={!!deleteGroup}
                onClose={() => setDeleteGroup(null)}
                onConfirm={executeDelete}
                title="Delete Access Group"
                message={`Delete group "${deleteGroup?.name}"? Users in this group will lose access rights defined by this policy.`}
                isLoading={isProcessing}
            />
        </div>
    );
};
