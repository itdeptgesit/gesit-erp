
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Building2, MapPin, Phone, Globe, Pencil, Trash2, RefreshCcw, Tag } from 'lucide-react';
import { CompanyFormModal } from './CompanyFormModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { Company, UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';
import { trackActivity } from '../lib/auditLogger';
import { useToast } from './ToastProvider';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";

interface MasterCompanyProps {
    currentUser: UserAccount | null;
}

export const MasterCompany: React.FC<MasterCompanyProps> = ({ currentUser }) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchCompanies = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('companies').select('*').order('id', { ascending: true });
        if (!error && data) {
            setCompanies(data as Company[]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setEditingCompany(null);
        setIsModalOpen(true);
    };

    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteCompany) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase.from('companies').delete().eq('id', deleteCompany.id);
            if (error) throw error;

            await trackActivity(
                currentUser?.fullName || 'User',
                currentUser?.role || 'User',
                'Delete Company',
                'Master',
                `Deleted company ${deleteCompany.name} (${deleteCompany.code})`
            );

            await fetchCompanies();
            setDeleteCompany(null);
        } catch (err: any) {
            showToast("Failed to delete record: " + err.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (data: Partial<Company>) => {
        if (editingCompany) {
            await supabase.from('companies').update(data).eq('id', editingCompany.id);
        } else {
            await supabase.from('companies').insert([data]);
        }

        await trackActivity(
            currentUser?.fullName || 'User',
            currentUser?.role || 'User',
            editingCompany ? 'Update Company' : 'Create Company',
            'Master',
            `${editingCompany ? 'Updated' : 'Created'} company ${data.name} (${data.code})`
        );

        fetchCompanies();
    };

    return (
        <div className="animate-in fade-in duration-300 pb-10">
            <PageHeader
                title="Master Company"
                description="Manage your enterprise entities & organizational structure"
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchCompanies}
                        className="h-9 w-9 rounded-xl hover:bg-muted"
                    >
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                    <Button
                        onClick={handleAdd}
                        className="h-10 px-6 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/10"
                    >
                        <Plus size={14} className="mr-2" /> New Entity
                    </Button>
                </div>
            </PageHeader>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search records..."
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
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Company Name</th>
                                <th className="px-6 py-4">Address</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-20"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-20 text-slate-300 dark:text-slate-700 text-xs font-medium">No company records found.</td></tr>
                            ) : filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-all group">
                                    <td className="px-6 py-4 text-slate-300 dark:text-slate-700 font-mono text-xs text-center">{company.id}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700 uppercase">
                                            {company.code || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                                                <Building2 size={16} />
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed truncate max-w-xs">{company.address}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(company)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"><Pencil size={16} /></button>
                                            <button onClick={() => setDeleteCompany(company)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <CompanyFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} initialData={editingCompany} />
            <DangerConfirmModal isOpen={!!deleteCompany} onClose={() => setDeleteCompany(null)} onConfirm={executeDelete} title="Delete Company" message={`Permanently erase registry for "${deleteCompany?.name}"?`} isLoading={isProcessing} />
        </div>
    );
};
