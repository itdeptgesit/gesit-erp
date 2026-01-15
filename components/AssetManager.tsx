'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Pencil, QrCode, RefreshCcw, Trash2, Package, CheckCircle2, History,
  Download, FileSpreadsheet, ChevronLeft, ChevronRight, Clock, AlertCircle, XCircle, RotateCcw
} from 'lucide-react';
import { ITAsset, UserAccount } from '../types';
import { AssetFormModal } from './AssetFormModal';
import { AssetQRModal } from './AssetQRModal';
import { AssetDetailModal } from './AssetDetailModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';
import { StatCard } from './MainDashboard';

interface AssetManagerProps {
  currentUser: UserAccount | null;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ITAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<ITAsset | null>(null);
  const [qrAsset, setQrAsset] = useState<ITAsset | null>(null);
  const [detailAsset, setDetailAsset] = useState<ITAsset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // RBAC Logic
  const isAdmin = currentUser?.role === 'Admin';
  const isStaff = currentUser?.role === 'Staff';
  const canManage = isAdmin || isStaff;
  const canDelete = isAdmin;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const { data: assetData } = await supabase.from('it_assets').select('*').order('id', { ascending: true });
      if (assetData) {
        setAssets(assetData.map((item: any) => ({
          id: item.id, assetId: item.asset_id, item: item.item_name, category: item.category, brand: item.brand,
          serialNumber: item.serial_number, status: item.status, location: item.location, user: item.user_assigned,
          remarks: item.remarks, company: item.company, department: item.department, purchaseDate: item.purchase_date, specs: item.specs || {},
          image_url: item.image_url
        })));
      }
    } catch (error) { console.error('Error fetching assets:', error); } finally { setIsLoading(false); }
  };

  const reIndexAllAssets = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      // 1. Fetch all needed data
      const { data: allAssets } = await supabase.from('it_assets').select('*').order('id', { ascending: true });
      const { data: companies } = await supabase.from('companies').select('name, code');
      const { data: categories } = await supabase.from('asset_categories').select('name, code');

      if (!allAssets) return;

      const companyMap = new Map(companies?.map(c => [c.name, c.code]));
      const categoryMap = new Map(categories?.map(c => [c.name, c.code]));

      // 2. Group assets
      const groups: Record<string, any[]> = {};
      allAssets.forEach(a => {
        const key = `${a.company}|${a.category}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
      });

      // 3. Process each group
      for (const key in groups) {
        const [compName, catName] = key.split('|');
        const compCode = companyMap.get(compName) || compName.substring(0, 3).toUpperCase();
        const catCode = categoryMap.get(catName) || catName.substring(0, 3).toUpperCase();

        const assetsInGroup = groups[key];
        for (let i = 0; i < assetsInGroup.length; i++) {
          const suffix = (i + 1).toString().padStart(3, '0');
          const newAssetId = `${compCode}-${catCode}-${suffix}`;

          await supabase
            .from('it_assets')
            .update({ asset_id: newAssetId })
            .eq('id', assetsInGroup[i].id);
        }
      }

      setNotification({ text: 'All assets have been re-indexed sequentially.', type: 'success' });
      await fetchAssets();
    } catch (error: any) {
      console.error('Re-indexing failed:', error);
      setNotification({ text: `Failed to re-index: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const filteredAssets = useMemo(() => assets.filter(asset => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (asset.item || '').toLowerCase().includes(searchLower) || (asset.user || '').toLowerCase().includes(searchLower) || (asset.assetId || '').toLowerCase().includes(searchLower);
    let matchesStatus = statusFilter === 'All' ? true : asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [assets, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(start, start + itemsPerPage);
  }, [filteredAssets, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Used':
        return <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[9px] uppercase"><CheckCircle2 size={12} /> Live</div>;
      case 'Idle':
        return <div className="flex items-center gap-1.5 text-blue-500 font-bold text-[9px] uppercase"><Clock size={12} /> Stock</div>;
      case 'Repair':
        return <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[9px] uppercase"><RefreshCcw size={12} /> Maint</div>;
      case 'Broken':
        return <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[9px] uppercase"><AlertCircle size={12} /> Fail</div>;
      case 'Disposed':
        return <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase"><XCircle size={12} /> Out</div>;
      default:
        return <span className="text-[8px] font-bold text-slate-400 uppercase">{status}</span>;
    }
  };

  const handleExportCSV = () => {
    if (filteredAssets.length === 0) return;
    const headers = ["Asset ID", "Item Name", "Category", "Brand", "S/N", "Status", "Location", "User Assigned", "Company", "Department", "Purchase Date", "Remarks"];
    const rows = filteredAssets.map(a => [a.assetId, a.item, a.category, a.brand || "", a.serialNumber || "", a.status, a.location, a.user || "Unassigned", a.company, a.department || "", a.purchaseDate || "", `"${(a.remarks || "").replace(/"/g, '""')}"`]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GESIT-ASSETS-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Asset Manager</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Managed Asset Company</p></div>
        <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"><FileSpreadsheet size={16} /> {t('exportData')}</button>
      </div>

      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total assets" value={assets.length} subValue="Total entries" icon={Package} color="blue" />
        <StatCard label="In production" value={assets.filter(a => a.status === 'Used' || a.status === 'Active').length} icon={CheckCircle2} color="emerald" />
        <StatCard label="Standby stock" value={assets.filter(a => a.status === 'Idle').length} icon={History} color="indigo" />
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4 transition-all">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
          <input type="text" placeholder="Filter item name or custodian..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-4 focus:ring-blue-500/5 transition-all font-semibold dark:text-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Used">Used</option>
            <option value="Idle">Idle</option>
            <option value="Broken">Broken</option>
            <option value="Repair">In Repair</option>
            <option value="Disposed">Disposed</option>
          </select>
          <button
            onClick={resetFilters}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center"
            title="Reset Filters"
          >
            <RotateCcw size={16} />
          </button>

          {canManage && (
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => { if (confirm('Re-index ALL existing asset codes sequentially? This will change existing IDs.')) reIndexAllAssets(); }}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl border border-blue-200 text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
                  title="Re-index Sequential IDs"
                >
                  <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                </button>
              )}
              <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 dark:shadow-none whitespace-nowrap">
                <Plus size={14} /> Add Asset
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Node Profile</th>
                <th className="px-6 py-4">Cluster</th>
                <th className="px-6 py-4">Assignment / Site</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center"><RefreshCcw className="animate-spin text-blue-500 mx-auto" size={24} /></td></tr>
              ) : paginatedAssets.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 dark:text-slate-600 text-[10px] font-bold tracking-widest uppercase">No entries detected.</td></tr>
              ) : paginatedAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => { setDetailAsset(asset); setIsDetailOpen(true); }}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:shadow-lg transition-all active:scale-95 border-dashed"
                      >
                        {asset.image_url ? (
                          <img src={asset.image_url} alt={asset.item} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center opacity-20 group-hover:opacity-40 transition-opacity">
                            <Package size={14} className="text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm tracking-tight leading-none">{asset.item}</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1.5 tracking-wider uppercase">{asset.assetId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-slate-600 dark:text-slate-400 text-[10px] font-semibold">{asset.category}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{asset.user || 'Unassigned'}</span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{asset.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusIcon(asset.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setQrAsset(asset); setIsQROpen(true); }} className="p-2 text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all" title="Label"><QrCode size={16} /></button>

                      {canManage && (
                        <button onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }} className="p-2 text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all" title="Edit">
                          <Pencil size={16} />
                        </button>
                      )}

                      {canDelete && (
                        <button onClick={() => setDeleteAsset(asset)} className="p-2 text-slate-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Page {currentPage} of {totalPages || 1} ({filteredAssets.length} assets)</p>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <AssetFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingAsset(null); }} onSubmit={async (formData) => {
        try {
          const payload = { item_name: formData.item, category: formData.category, brand: formData.brand, serial_number: formData.serialNumber, status: formData.status, location: formData.location, user_assigned: formData.user, remarks: formData.remarks, company: formData.company, department: formData.department, purchase_date: formData.purchaseDate, specs: formData.specs, asset_id: formData.assetId || `GEN-${Date.now().toString().substring(7)}`, image_url: formData.image_url };

          let error;
          if (editingAsset) {
            const result = await supabase.from('it_assets').update(payload).eq('id', editingAsset.id);
            error = result.error;
          } else {
            const result = await supabase.from('it_assets').insert([payload]);
            error = result.error;
          }

          if (error) throw error;

          setNotification({ text: editingAsset ? 'Asset updated successfully' : 'Asset added successfully', type: 'success' });
          setTimeout(() => setNotification(null), 3000);

          setIsModalOpen(false);
          setEditingAsset(null);
          await fetchAssets();
        } catch (error: any) {
          console.error('Submission error:', error);
          setNotification({ text: `Failed to save asset: ${error.message || 'Unknown error'}`, type: 'error' });
          setTimeout(() => setNotification(null), 5000);
        }
      }} initialData={editingAsset} />
      <AssetQRModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} asset={qrAsset} />
      <AssetDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} asset={detailAsset} />
      <DangerConfirmModal isOpen={!!deleteAsset} onClose={() => setDeleteAsset(null)} onConfirm={async () => { if (!deleteAsset) return; await supabase.from('it_assets').delete().eq('id', deleteAsset.id); setDeleteAsset(null); await fetchAssets(); }} title="Purge Record" message={`Irreversibly remove "${deleteAsset?.item}" node?`} />
    </div>
  );
};
