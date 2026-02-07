'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Plus, Pencil, QrCode, RefreshCcw, Trash2, Package, CheckCircle2, History,
  Download, FileSpreadsheet, ChevronLeft, ChevronRight, Clock, AlertCircle, XCircle, RotateCcw
} from 'lucide-react';
import { AssetFormModal } from './AssetFormModal';
import { AssetQRModal } from './AssetQRModal';
import { AssetDetailModal } from './AssetDetailModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { ITAsset, UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';
import { trackActivity } from '../lib/auditLogger';
import * as XLSX from 'xlsx';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

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
          remarks: item.remarks, company: item.company, department: item.department,
          purchaseDate: (item.purchase_date && item.purchase_date !== 'NaN') ? item.purchase_date : null,
          specs: item.specs || {},
          image_url: item.image_url,
          condition: item.condition,
          vendor: item.vendor,
          price: item.price,
          warrantyExp: (item.warranty_exp && item.warranty_exp !== 'NaN') ? item.warranty_exp : null
        })));
      }
    } catch (error) { console.error('Error fetching assets:', error); } finally { setIsLoading(false); }
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

  const handleExportExcel = () => {
    if (filteredAssets.length === 0) return;

    const exportData = filteredAssets.map(a => ({
      "Asset ID": a.assetId,
      "Item Name": a.item,
      "Category": a.category,
      "Brand": a.brand || "",
      "S/N": a.serialNumber || "",
      "Status": a.status,
      "Condition": a.condition || "New",
      "Location": a.location,
      "User Assigned": a.user || "Unassigned",
      "Department": a.department || "",
      "Company": a.company,
      "Purchase Date": a.purchaseDate || "-",
      "Warranty Exp": a.warrantyExp || "-",
      "Vendor": a.vendor || "",
      "Price": a.price || 0,
      "Barcode URL": `https://it.gesit.co.id/asset?id=${a.assetId}`,
      "Remarks": a.remarks || ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");

    // Auto-size columns
    const wscols = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 },
      { wch: 40 }, { wch: 30 }
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `GESIT-ASSETS-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Item": "Contoh: Laptop Thinkpad X1",
        "Category": "Laptop",
        "Company": "Gesit Alumas",
        "Brand": "Lenovo",
        "Serial Number": "SN123456",
        "Status": "Active",
        "Custodian": "Rudi",
        "Location": "Office A",
        "Department": "IT",
        "Purchase Date": "2024-01-20",
        "Remarks": "Catatan tambahan",
        "Asset ID": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");

    // Auto-size columns
    const wscols = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 30 }, { wch: 20 }
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, "GESIT_ASSET_TEMPLATE.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setNotification({ text: 'Starting bulk import...', type: 'success' });

    try {
      const reader = new FileReader();
      const loadFile = () => new Promise<ArrayBuffer>((resolve) => {
        reader.onload = (evt) => resolve(evt.target?.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      });

      const buffer = await loadFile();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      if (rawData.length === 0) throw new Error('Excel file is empty');

      // 1. Fetch metadata for ID generation
      const { data: companies } = await supabase.from('companies').select('name, code');
      const { data: categories } = await supabase.from('asset_categories').select('name, code');
      const { data: existingAssets } = await supabase.from('it_assets').select('asset_id, company, category');

      const companyMap = new Map(companies?.map(c => [c.name.toLowerCase().trim(), c.code]));
      const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase().trim(), c.code]));

      // 2. Build current counters for sequential IDs
      const counters: Record<string, number> = {};
      existingAssets?.forEach(a => {
        const parts = (a.asset_id || '').split('-');
        if (parts.length >= 3) {
          const prefix = `${parts[0]}-${parts[1]}`;
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) {
            counters[prefix] = Math.max(counters[prefix] || 0, num);
          }
        }
      });

      const validRecords = rawData.map((rawRow: any) => {
        // Normalize keys
        const row: any = {};
        Object.keys(rawRow).forEach(key => {
          if (rawRow[key] !== null && rawRow[key] !== undefined) {
            row[key.toLowerCase().trim()] = rawRow[key];
          }
        });

        if (Object.keys(row).length === 0) return null;

        const itemName = (row.item || row.itemname || row['item name'] || row.name || row.produk || row.barang || row.item_name || '').toString().trim();
        const category = (row.category || row.kategori || '').toString().trim();
        const company = (row.company || row.perusahaan || row.pt || '').toString().trim();

        if (!itemName || !category || !company) return null;

        // Generate Professional ID: COMP-CAT-001
        let finalAssetId = (row.assetid || row.asset_id || row['asset id'] || '').toString().trim();

        if (!finalAssetId) {
          const compCode = companyMap.get(company.toLowerCase()) || company.substring(0, 3).toUpperCase();
          const catCode = categoryMap.get(category.toLowerCase()) || category.substring(0, 3).toUpperCase();
          const prefix = `${compCode}-${catCode}`;

          counters[prefix] = (counters[prefix] || 0) + 1;
          const suffix = counters[prefix].toString().padStart(3, '0');
          finalAssetId = `${prefix}-${suffix}`;
        }

        return {
          item_name: itemName,
          category: category,
          brand: (row.brand || row.merk || '').toString().trim(),
          serial_number: (row.serialnumber || row.serial_number || row['serial number'] || row.sn || '').toString().trim(),
          status: (row.status || 'Active').toString().trim(),
          location: (row.location || row.lokasi || '').toString().trim(),
          user_assigned: (row.user || row.custodian || row.pemakai || '').toString().trim(),
          remarks: (row.remarks || row.notes || row.keterangan || '').toString().trim(),
          company: company,
          department: (row.department || row.departemen || row.dept || '').toString().trim(),
          purchase_date: row.purchasedate || row.purchase_date || row['purchase date'] || row.tanggal || null,
          asset_id: finalAssetId,
          image_url: row.image_url || row.image || null
        };
      }).filter((r): r is any => r !== null);

      if (validRecords.length === 0) {
        const foundHeaders = rawData.length > 0 ? Object.keys(rawData[0]).join(', ') : 'None';
        throw new Error(`Data tidak terbaca atau kolom utama (Item, Category, Company) tidak ditemukan. Judul kolom yang terbaca: [${foundHeaders}]`);
      }

      const { error } = await supabase.from('it_assets').insert(validRecords);
      if (error) throw error;

      await trackActivity(
        currentUser?.fullName || 'User',
        currentUser?.role || 'User',
        'Bulk Import',
        'Assets',
        `Imported ${validRecords.length} assets from Excel`
      );

      setNotification({ text: `Successfully imported ${validRecords.length} assets`, type: 'success' });
      fetchAssets();
    } catch (err: any) {
      console.error('Import error:', err);
      setNotification({ text: `Import failed: ${err.message}`, type: 'error' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Asset Manager</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Managed Asset Company</p></div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls, .csv"
            onChange={handleImportExcel}
          />
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                title="Download Blank Template"
              >
                <Download size={14} /> Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
              >
                <FileSpreadsheet size={16} className={isImporting ? 'animate-bounce' : ''} /> {isImporting ? 'Processing...' : 'Import Data'}
              </button>
            </div>
          )}
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"><Download size={16} /> EXPORT EXCEL</button>
        </div>
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
          if (!formData.assetId) throw new Error("Asset ID could not be generated. Please select Company and Category.");

          const sanitizeDate = (date: string | null | undefined) => {
            if (!date || date === '-' || date === 'NaN') return null;
            return date;
          };

          const payload = {
            item_name: formData.item,
            category: formData.category,
            brand: formData.brand,
            serial_number: formData.serialNumber,
            status: formData.status,
            location: formData.location,
            user_assigned: formData.user,
            remarks: formData.remarks,
            company: formData.company,
            department: formData.department,
            purchase_date: sanitizeDate(formData.purchaseDate),
            specs: formData.specs,
            asset_id: formData.assetId,
            image_url: formData.image_url,
            condition: formData.condition,
            vendor: formData.vendor,
            price: formData.price,
            warranty_exp: sanitizeDate(formData.warrantyExp)
          };

          let error;
          if (editingAsset) {
            const result = await supabase.from('it_assets').update(payload).eq('id', editingAsset.id);
            error = result.error;
          } else {
            const result = await supabase.from('it_assets').insert([payload]);
            error = result.error;
          }


          if (error) throw error;

          await trackActivity(
            currentUser?.fullName || 'User',
            currentUser?.role || 'User',
            editingAsset ? 'Update Asset' : 'Create Asset',
            'Assets',
            `${editingAsset ? 'Updated' : 'Created'} asset ${payload.asset_id} (${payload.item_name})`
          );

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
      <DangerConfirmModal isOpen={!!deleteAsset} onClose={() => setDeleteAsset(null)} onConfirm={async () => {
        if (!deleteAsset) return;
        const { error } = await supabase.from('it_assets').delete().eq('id', deleteAsset.id);
        if (!error) {
          await trackActivity(
            currentUser?.fullName || 'User',
            currentUser?.role || 'User',
            'Delete Asset',
            'Assets',
            `Deleted asset ${deleteAsset.assetId} (${deleteAsset.item})`
          );
        }
        setDeleteAsset(null);
        await fetchAssets();
      }} title="Purge Record" message={`Irreversibly remove "${deleteAsset?.item}" node?`} />
    </div>
  );
};
