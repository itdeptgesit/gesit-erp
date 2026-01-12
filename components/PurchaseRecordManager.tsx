
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, RefreshCcw, FileSpreadsheet, Trash2, Pencil, Filter,
    ArrowUpRight, Wallet, CheckCircle2, Clock, Briefcase, ChevronRight, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { PurchaseRecord } from '../types';
import { PurchaseRecordFormModal } from './PurchaseRecordFormModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';
import { StatCard } from './MainDashboard';

export const PurchaseRecordManager: React.FC = () => {
    const { t } = useLanguage();
    const [records, setRecords] = useState<PurchaseRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<PurchaseRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<PurchaseRecord | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('purchase_records').select('*').order('purchase_date', { ascending: false });
            if (data) {
                setRecords(data.map((r: any) => ({
                    id: r.id, transactionId: r.transaction_id, description: r.description,
                    qty: r.qty, price: r.price, vat: r.vat, deliveryFee: r.delivery_fee,
                    insurance: r.insurance, appFee: r.app_fee, otherCost: r.other_cost,
                    subtotal: r.subtotal, totalVa: r.total_va, projectName: r.project_name,
                    user: r.user_name, department: r.department, company: r.company,
                    status: r.status, purchaseDate: r.purchase_date, paymentDate: r.payment_date,
                    vendor: r.vendor, platform: r.platform, remarks: r.remarks, docs: r.docs || {},
                    items: r.items || []
                })));
            }
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchRecords(); }, []);

    const handleFormSubmit = async (formData: Partial<PurchaseRecord>) => {
        setIsActionLoading(true);
        try {
            const payload = {
                transaction_id: formData.transactionId, description: formData.description,
                qty: formData.qty, price: formData.price, vat: formData.vat, delivery_fee: formData.deliveryFee,
                insurance: formData.insurance, app_fee: formData.appFee, other_cost: formData.otherCost,
                subtotal: formData.subtotal, total_va: formData.totalVa, project_name: formData.projectName,
                user_name: formData.user, department: formData.department, company: formData.company,
                status: formData.status, purchase_date: formData.purchaseDate, payment_date: formData.paymentDate,
                vendor: formData.vendor, platform: formData.platform, remarks: formData.remarks, docs: formData.docs,
                items: formData.items
            };

            if (editingRecord) {
                await supabase.from('purchase_records').update(payload).eq('id', editingRecord.id);
            } else {
                await supabase.from('purchase_records').insert([payload]);
            }
            setIsModalOpen(false);
            setEditingRecord(null);
            await fetchRecords();
        } catch (err) { alert('Save failed'); } finally { setIsActionLoading(false); }
    };

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true : r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [records, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const paid = records.filter(r => r.status === 'Paid').reduce((sum, r) => sum + (r.subtotal || 0), 0);
        const pending = records.filter(r => r.status !== 'Paid').reduce((sum, r) => sum + (r.subtotal || 0), 0);
        return { paid, pending, total: paid + pending };
    }, [records]);

    const chartData = useMemo(() => {
        const monthlyData: Record<string, number> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
            monthlyData[key] = 0;
        }

        records.forEach(r => {
            if (!r.purchaseDate) return;
            const d = new Date(r.purchaseDate);
            const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
            if (monthlyData.hasOwnProperty(key)) {
                monthlyData[key] += r.subtotal || 0;
            }
        });

        return Object.entries(monthlyData).map(([name, total]) => ({ name, total }));
    }, [records]);

    const deptData = useMemo(() => {
        const data: Record<string, number> = {};
        records.forEach(r => {
            const dept = r.department || 'Unknown';
            data[dept] = (data[dept] || 0) + (r.subtotal || 0);
        });
        return Object.entries(data)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [records]);

    const handleExport = () => {
        const headers = ["TR-ID", "Description", "Project", "Qty", "Subtotal", "Company", "Vendor", "Platform", "Date", "Status"];
        const csvData = filteredRecords.map(r => [
            r.transactionId, r.description, r.projectName, r.qty, r.subtotal, r.company, r.vendor, r.platform, r.purchaseDate, r.status
        ]);
        const csvContent = [headers.join(","), ...csvData.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Purchase-Records-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Purchase Record</h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">Transaction history & Document audit</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                        <FileSpreadsheet size={16} /> Export CSV
                    </button>
                    <button onClick={() => { setEditingRecord(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                        <Plus size={16} /> Add Record
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="TOTAL DISBURSED" value={formatIDR(stats.paid)} subValue="Completed payments" icon={CheckCircle2} color="emerald" />
                <StatCard label="LIABILITY" value={formatIDR(stats.pending)} subValue="Pending" icon={Clock} color="amber" />
                <StatCard label="FISCAL VOLUME" value={formatIDR(stats.total)} subValue="Total record value" icon={Wallet} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-sm">Monthly Expense Trend</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Disbursement over 6 months</p>
                        </div>
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => new Intl.NumberFormat('id-ID', { notation: 'standard', maximumFractionDigits: 0 }).format(val)} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', padding: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
                                    formatter={(val: number) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val), 'Total']}
                                />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={30}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563eb' : '#94a3b8'} fillOpacity={index === chartData.length - 1 ? 1 : 0.2} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-sm">By Department</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top 5 spending units</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {deptData.length === 0 ? (
                            <p className="text-center py-10 text-slate-300 text-[10px] font-bold uppercase tracking-widest">No data available</p>
                        ) : deptData.map((dept, idx) => (
                            <div key={dept.name} className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                    <span className="text-slate-500 truncate max-w-[120px]">{dept.name}</span>
                                    <span className="text-slate-900 dark:text-slate-300">{formatIDR(dept.total)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${(dept.total / (deptData[0]?.total || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30 dark:bg-slate-800/30">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search transaction or item..." className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <select className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="All">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                        </select>
                        <button onClick={fetchRecords} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4">Identity</th>
                                <th className="px-6 py-4">Transaction Details</th>
                                <th className="px-6 py-4 text-right">Value (IDR)</th>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Docs</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={7} className="py-20 text-center"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr><td colSpan={7} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No transaction records found.</td></tr>
                            ) : filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 w-fit">{record.transactionId}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1.5">{record.purchaseDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col max-w-xs">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight leading-none truncate">{record.description}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate uppercase">{record.vendor} • {record.platform}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">Rp {new Intl.NumberFormat('id-ID').format(record.subtotal)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">{record.company}</p>
                                            <p className="text-[9px] text-slate-400 font-medium uppercase">{record.department}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${record.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100' :
                                            record.status === 'Pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100' :
                                                'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-1">
                                            {Object.values(record.docs).filter(v => v).length > 0 ? (
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black border border-emerald-100">
                                                    {Object.values(record.docs).filter(v => v).length}/7
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-300 rounded text-[9px] font-black border border-slate-100">0/7</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Pencil size={14} /></button>
                                            <button onClick={() => setDeleteRecord(record)} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PurchaseRecordFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingRecord} />

            <DangerConfirmModal
                isOpen={!!deleteRecord} onClose={() => setDeleteRecord(null)}
                onConfirm={async () => {
                    await supabase.from('purchase_records').delete().eq('id', deleteRecord!.id);
                    setDeleteRecord(null);
                    fetchRecords();
                }}
                title="Delete Record" message={`Purge transaction record "${deleteRecord?.transactionId}"?`}
                isLoading={isActionLoading}
            />
        </div>
    );
};
