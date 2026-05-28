'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Search, ShieldCheck, UserCheck, Plus, Trash2, Cpu, Info, Check, ChevronsUpDown, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ITAsset, UserAccount } from '../types';
import { exportAssetTransferForm, AssetTransferInfo } from '../lib/handoverPdfExport';
import { useLanguage } from '../translations';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface AssetHandoverManagerProps {
  currentUser: UserAccount | null;
}

export const AssetHandoverManager: React.FC<AssetHandoverManagerProps> = ({ currentUser }) => {
  const { t } = useLanguage();

  // 1. Core States
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ITAsset | null>(null);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handoverAssets = useMemo(() => {
    return assets.filter(a => a.user && (a.remarks || '').includes('[BAST]'));
  }, [assets]);

  // 1b. Master Data States
  const [masterCompanies, setMasterCompanies] = useState<Array<{ id: number; name: string; code?: string }>>([]);
  const [masterDepartments, setMasterDepartments] = useState<Array<{ id: number; name: string }>>([]);

  // 2. Originator Details States (Prefilled with currently logged-in user details)
  const [originatorCompany, setOriginatorCompany] = useState('PT Gesit Alumas');
  const [originatorName, setOriginatorName] = useState('');
  const [originatorPosition, setOriginatorPosition] = useState('IT Specialist');
  const [originatorDept, setOriginatorDept] = useState('IT');

  // 3. Recipient Details States
  const [recipientName, setRecipientName] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [recipientPosition, setRecipientPosition] = useState('');
  const [recipientDivision, setRecipientDivision] = useState('');
  const [recipientDept, setRecipientDept] = useState('');
  const [recipientLocation, setRecipientLocation] = useState('Head Office - The City Tower');

  // 4. Document & Handover Info States
  const [handoverDate, setHandoverDate] = useState('');
  const [docSequence, setDocSequence] = useState('001');
  const [customDocNo, setCustomDocNo] = useState('');
  const [isManualDocNo, setIsManualDocNo] = useState(false);

  // 5. Equipment States
  const [includeBag, setIncludeBag] = useState(true);
  const [includeCharger, setIncludeCharger] = useState(true);
  const [includeMouse, setIncludeMouse] = useState(true);
  const [mouseModel, setMouseModel] = useState('Mouse Wireless Logitech B170');
  const [customEquipments, setCustomEquipments] = useState<Array<{ name: string; serialNo: string; remarks: string }>>([]);
  const [note, setNote] = useState('');

  // Fetch all assets from Supabase
  const fetchAssets = async () => {
    setIsLoadingAssets(true);
    try {
      const { data: assetData, error } = await supabase
        .from('it_assets')
        .select('*')
        .order('item_name', { ascending: true });

      if (error) throw error;

      if (assetData) {
        setAssets(
          assetData.map((item: any) => ({
            id: item.id,
            assetId: item.asset_id,
            item: item.item_name,
            category: item.category,
            brand: item.brand,
            serialNumber: item.serial_number,
            status: item.status,
            location: item.location,
            user: item.user_assigned,
            remarks: item.remarks,
            company: item.company,
            department: item.department,
            purchaseDate: item.purchase_date,
            specs: item.specs || {},
            image_url: item.image_url,
            condition: item.condition,
            vendor: item.vendor,
            price: item.price,
            warrantyExp: item.warranty_exp,
          }))
        );
      }

      // Fetch companies from master DB table
      const { data: companyData } = await supabase.from('companies').select('id, name, code').order('name');
      if (companyData) setMasterCompanies(companyData);

      // Fetch departments from master DB table
      const { data: deptData } = await supabase.from('departments').select('id, name').order('name');
      if (deptData) setMasterDepartments(deptData);

    } catch (err) {
      console.error('Error fetching assets:', err);
      showNotification('Failed to fetch assets list.', 'error');
    } finally {
      setIsLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchAssets();

    // Default Dates Setup
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    setHandoverDate(localToday.toISOString().split('T')[0]);

    // Set default originator details from current logged-in user
    if (currentUser) {
      setOriginatorName(currentUser.fullName || '');
      setOriginatorCompany(currentUser.company || 'PT Gesit Alumas');
      setOriginatorPosition(currentUser.jobTitle || 'IT Specialist');
      setOriginatorDept(currentUser.department || 'IT');
    }
  }, [currentUser]);

  // Recalculate BAST Document Number dynamically
  const generatedDocNo = useMemo(() => {
    if (!handoverDate) return '';
    const dateObj = new Date(handoverDate);
    const year = dateObj.getFullYear();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const romanMonth = romanMonths[dateObj.getMonth()];
    
    let companyPrefix = 'GI';
    if (selectedAsset?.assetId) {
      const parts = selectedAsset.assetId.split('-');
      if (parts[0]) companyPrefix = parts[0].toUpperCase();
    } else if (recipientCompany) {
      // Fallback to recipient company initials if no asset selected
      const words = recipientCompany.split(' ');
      if (words.length > 1) {
        companyPrefix = words.map(w => w[0]).join('').toUpperCase();
      } else {
        companyPrefix = recipientCompany.substring(0, 3).toUpperCase();
      }
    }
    
    const paddedSeq = String(docSequence).padStart(3, '0');
    return `ATF-${companyPrefix}/${paddedSeq}/${romanMonth}/${year}`;
  }, [selectedAsset, recipientCompany, handoverDate, docSequence]);

  // Handle selected asset change
  const handleAssetSelect = (asset: ITAsset) => {
    setSelectedAsset(asset);
    setIsAssetDropdownOpen(false);
    
    // Auto-fill recipient details if asset has assigned user
    if (asset.user) setRecipientName(asset.user);
    if (asset.company) setRecipientCompany(asset.company);
    if (asset.department) setRecipientDept(asset.department);
    setRecipientPosition(asset.specs?.processor ? 'User Custodian' : 'User');
    setRecipientDivision('');
    setRecipientLocation(asset.location || 'Head Office - The City Tower');
    
    // Auto-generate elegant default note
    setNote(`New member ${asset.company || 'Gesit Company'} - ${asset.user || 'User'}`);
  };

  // Keep manual or auto document number aligned
  const finalDocNo = isManualDocNo ? customDocNo : generatedDocNo;

  // Add Custom Accessories Row
  const handleAddEquipment = () => {
    setCustomEquipments([...customEquipments, { name: '', serialNo: '-', remarks: '' }]);
  };

  const handleRemoveEquipment = (index: number) => {
    setCustomEquipments(customEquipments.filter((_, idx) => idx !== index));
  };

  const handleEquipmentChange = (index: number, field: 'name' | 'serialNo' | 'remarks', val: string) => {
    const updated = [...customEquipments];
    updated[index][field] = val;
    setCustomEquipments(updated);
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCetakBAST = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      showNotification('Please select an asset first.', 'error');
      return;
    }
    if (!recipientName) {
      showNotification('Please enter recipient name.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      // Assemble supporting equipments
      const supportingEquipment: Array<{ name: string; serialNo: string; remarks: string }> = [];
      if (includeBag) {
        supportingEquipment.push({
          name: 'Tas Laptop',
          serialNo: '-',
          remarks: 'Black'
        });
      }
      if (includeCharger) {
        supportingEquipment.push({
          name: 'Charger Laptop',
          serialNo: '-',
          remarks: 'Black'
        });
      }
      if (includeMouse) {
        supportingEquipment.push({
          name: mouseModel || 'Mouse Wireless Logitech B170',
          serialNo: '-',
          remarks: 'Black'
        });
      }
      customEquipments.forEach(eq => {
        if (eq.name.trim()) {
          supportingEquipment.push(eq);
        }
      });

      const info: AssetTransferInfo = {
        originatorCompany,
        originatorName,
        originatorPosition,
        originatorDept,
        recipientName,
        recipientCompany,
        recipientPosition,
        recipientDivision,
        recipientDept,
        recipientLocation,
        handoverDate,
        docNo: finalDocNo,
        supportingEquipment,
        note
      };

      // Automatically update the asset custodian details in Supabase database!
      if (selectedAsset) {
        let newRemarks = (note || '').trim();
        if (!newRemarks.includes('[BAST]')) {
          newRemarks = (newRemarks + ' [BAST]').trim();
        }

        const { error: updateError } = await supabase
          .from('it_assets')
          .update({
            user_assigned: recipientName,
            company: recipientCompany,
            department: recipientDept,
            location: recipientLocation,
            remarks: newRemarks
          })
          .eq('id', selectedAsset.id);

        if (updateError) {
          console.error('Error updating asset assignment:', updateError);
        } else {
          // Re-fetch assets list to show updated details in the table instantly!
          await fetchAssets();
        }
      }

      await exportAssetTransferForm(selectedAsset, info);
      showNotification('Asset Transfer Form (BAST) PDF generated successfully!', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showNotification('Failed to generate BAST PDF.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtered Assets list for searchable dropdown
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const q = assetSearchTerm.toLowerCase();
      return (
        (asset.item || '').toLowerCase().includes(q) ||
        (asset.serialNumber || '').toLowerCase().includes(q) ||
        (asset.assetId || '').toLowerCase().includes(q) ||
        (asset.brand || '').toLowerCase().includes(q) ||
        (asset.user || '').toLowerCase().includes(q)
      );
    });
  }, [assets, assetSearchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Handover Form (BAST)"
        description="Generate beautiful, pixel-perfect official Asset Transfer Forms directly from selected inventory assets."
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-4.5 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          <span className="text-sm font-semibold">{notification.text}</span>
        </div>
      )}

      <form onSubmit={handleCetakBAST} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Asset Selector & Accessories */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Asset Selector Section */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              <Cpu size={16} className="text-blue-500" />
              SELECT ASSET
            </h3>

            {/* Custom Searchable Dropdown */}
            <div className="relative">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Search & Select Inventory Device</Label>
              <button
                type="button"
                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-background border border-border/80 hover:border-border rounded-xl text-left text-sm font-medium transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {selectedAsset ? (
                  <span className="truncate text-foreground font-semibold">
                    {selectedAsset.assetId} - {selectedAsset.item}
                  </span>
                ) : (
                  <span className="text-muted-foreground font-normal">Choose device from inventory...</span>
                )}
                <ChevronsUpDown size={15} className="text-muted-foreground" />
              </button>

              {isAssetDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 z-40 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden max-h-[320px] flex flex-col">
                  <div className="p-2 border-b border-border/60 bg-muted/30 flex items-center gap-2">
                    <Search size={14} className="text-muted-foreground/80 ml-1.5" />
                    <input
                      type="text"
                      placeholder="Search name, serial number, brand, user..."
                      value={assetSearchTerm}
                      onChange={(e) => setAssetSearchTerm(e.target.value)}
                      className="w-full bg-transparent border-0 p-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 custom-scrollbar max-h-[260px]">
                    {isLoadingAssets ? (
                      <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 size={13} className="animate-spin text-primary" />
                        Loading assets...
                      </div>
                    ) : filteredAssets.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">No matching assets found.</div>
                    ) : (
                      filteredAssets.map(asset => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => handleAssetSelect(asset)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-muted/60 border-b border-border/30 last:border-0 flex items-center justify-between text-xs transition-all ${
                            selectedAsset?.id === asset.id ? 'bg-primary/5 text-primary' : 'text-foreground'
                          }`}
                        >
                          <div className="space-y-0.5 max-w-[80%]">
                            <p className="font-bold truncate">{asset.item}</p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">
                              ID: <span className="font-bold text-foreground/80">{asset.assetId}</span> | S/N: {asset.serialNumber || '-'}
                            </p>
                            {asset.user && (
                              <p className="text-[9px] text-blue-500 font-semibold uppercase tracking-wider">
                                Assigned to: {asset.user}
                              </p>
                            )}
                          </div>
                          {selectedAsset?.id === asset.id && <Check size={14} className="text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Asset Details Card */}
            {selectedAsset && (
              <div className="mt-4 p-4 bg-muted/30 border border-border/40 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Cpu size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">{selectedAsset.item}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{selectedAsset.brand || 'No Brand'}</p>
                  </div>
                </div>
                <div className="h-[1px] bg-border/40" />
                <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                  <div>
                    <span className="text-muted-foreground block text-[9.5px]">Asset ID</span>
                    <span className="font-bold">{selectedAsset.assetId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9.5px]">Serial Number</span>
                    <span className="font-semibold truncate">{selectedAsset.serialNumber || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[9.5px]">Specifications</span>
                    <span className="font-medium text-foreground/80">
                      {selectedAsset.specs?.processor || ''} {selectedAsset.specs?.ram ? `| ${selectedAsset.specs.ram}` : ''} {selectedAsset.specs?.storage ? `| ${selectedAsset.specs.storage}` : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accessories Block */}
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              <Plus size={16} className="text-emerald-500" />
              SUPPORTING ACCESSORIES
            </h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-3 hover:bg-muted/20 border border-border/40 rounded-xl cursor-pointer transition-all select-none">
                <input
                  type="checkbox"
                  checked={includeBag}
                  onChange={(e) => setIncludeBag(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <p className="font-bold">Tas Laptop</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Standard laptop bag</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 hover:bg-muted/20 border border-border/40 rounded-xl cursor-pointer transition-all select-none">
                <input
                  type="checkbox"
                  checked={includeCharger}
                  onChange={(e) => setIncludeCharger(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <p className="font-bold">Charger Laptop</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Standard power adapter</p>
                </div>
              </label>

              <div className="p-3 hover:bg-muted/20 border border-border/40 rounded-xl transition-all select-none space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMouse}
                    onChange={(e) => setIncludeMouse(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <div className="text-xs">
                    <p className="font-bold">Mouse Wireless</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Specify mouse model below</p>
                  </div>
                </label>
                {includeMouse && (
                  <Input
                    value={mouseModel}
                    onChange={(e) => setMouseModel(e.target.value)}
                    placeholder="e.g. Mouse Wireless Logitech B170"
                    className="h-8 text-xs font-semibold rounded-lg mt-1"
                  />
                )}
              </div>
            </div>

            {/* Custom Extra Items */}
            {customEquipments.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">Additional Items</h4>
                {customEquipments.map((eq, idx) => (
                  <div key={idx} className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(idx)}
                      className="absolute top-2 right-2 text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="space-y-2 text-xs">
                      <div>
                        <Label className="text-[10px] mb-1">Item Name</Label>
                        <Input
                          value={eq.name}
                          onChange={(e) => handleEquipmentChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Laptop Sleeve"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] mb-1">S/N</Label>
                          <Input
                            value={eq.serialNo}
                            onChange={(e) => handleEquipmentChange(idx, 'serialNo', e.target.value)}
                            placeholder="-"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] mb-1">Remarks</Label>
                          <Input
                            value={eq.remarks}
                            onChange={(e) => handleEquipmentChange(idx, 'remarks', e.target.value)}
                            placeholder="Black"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddEquipment}
              className="w-full h-9 text-xs rounded-xl flex items-center justify-center gap-1.5 border-dashed border-border/80"
            >
              <Plus size={13} />
              Add Custom Accessory
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Handover Form & Info */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            
            {/* Header Document Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Handover Date</Label>
                <Input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="rounded-xl h-10 text-sm font-medium"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block flex items-center justify-between">
                  <span>Document Number (BAST)</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isManualDocNo) setCustomDocNo(generatedDocNo);
                      setIsManualDocNo(!isManualDocNo);
                    }}
                    className="text-[9.5px] font-bold text-blue-500 hover:underline uppercase"
                  >
                    {isManualDocNo ? 'Auto-Generate' : 'Manual Edit'}
                  </button>
                </Label>
                {isManualDocNo ? (
                  <Input
                    value={customDocNo}
                    onChange={(e) => setCustomDocNo(e.target.value)}
                    className="rounded-xl h-10 text-sm font-semibold border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  />
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={docSequence}
                      onChange={(e) => setDocSequence(e.target.value)}
                      placeholder="Seq"
                      className="w-20 rounded-xl h-10 text-center font-bold text-sm"
                    />
                    <div className="flex-1 flex items-center px-3.5 bg-muted/40 border border-border/60 rounded-xl font-bold text-[12.5px] text-foreground/80 select-none overflow-hidden truncate">
                      {generatedDocNo}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-[1px] bg-border/40" />

            {/* DATA ORIGINATOR */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-500" />
                1. Data Originator (IT Manager / Staff)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Full Name</Label>
                  <Input
                    value={originatorName}
                    onChange={(e) => setOriginatorName(e.target.value)}
                    placeholder="Enter originator name..."
                    className="rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Company</Label>
                  <select
                    value={originatorCompany}
                    onChange={(e) => setOriginatorCompany(e.target.value)}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring h-10 bg-background text-foreground transition-all"
                  >
                    <option value="">- Select Company -</option>
                    {masterCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Position</Label>
                  <Input
                    value={originatorPosition}
                    onChange={(e) => setOriginatorPosition(e.target.value)}
                    placeholder="e.g. IT Specialist"
                    className="rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Department</Label>
                  <select
                    value={originatorDept}
                    onChange={(e) => setOriginatorDept(e.target.value)}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring h-10 bg-background text-foreground transition-all"
                  >
                    <option value="">- Select Department -</option>
                    {masterDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-border/40" />

            {/* DATA RECIPIENT */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <UserCheck size={14} className="text-emerald-500" />
                2. Data Recipient (Asset Receiver / User)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Recipient Name</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Enter recipient full name..."
                    className="rounded-xl h-10 text-sm font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Company</Label>
                  <select
                    value={recipientCompany}
                    onChange={(e) => setRecipientCompany(e.target.value)}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring h-10 bg-background text-foreground transition-all"
                  >
                    <option value="">- Select Company -</option>
                    {masterCompanies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Position</Label>
                  <Input
                    value={recipientPosition}
                    onChange={(e) => setRecipientPosition(e.target.value)}
                    placeholder="e.g. User Custodian"
                    className="rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Division</Label>
                  <Input
                    value={recipientDivision}
                    onChange={(e) => setRecipientDivision(e.target.value)}
                    placeholder="e.g. Procurement / Support"
                    className="rounded-xl h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Department</Label>
                  <select
                    value={recipientDept}
                    onChange={(e) => setRecipientDept(e.target.value)}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring h-10 bg-background text-foreground transition-all"
                  >
                    <option value="">- Select Department -</option>
                    {masterDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Location</Label>
                  <Input
                    value={recipientLocation}
                    onChange={(e) => setRecipientLocation(e.target.value)}
                    placeholder="e.g. Head Office - The City Tower"
                    className="rounded-xl h-10 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-border/40" />

            {/* NOTES */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                <Info size={14} className="text-amber-500" />
                3. Additional Notes
              </h4>
              <div>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. New member Gesit Intrade - Hilalludin"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isGenerating || !selectedAsset || !recipientName}
                className="rounded-2xl h-12 px-8 font-black uppercase tracking-wider text-xs shadow-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    GENERATING BAST...
                  </>
                ) : (
                  <>
                    <FileText size={15} />
                    CETAK BAST (PDF)
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>

      </form>

      {/* Handover List / History Table */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            DAFTAR SERAH TERIMA ASET (HANDOVER LIST)
          </h3>
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest bg-muted/40 px-3 py-1 rounded-full">
            {handoverAssets.length} Active Custodians
          </span>
        </div>

        <div className="overflow-x-auto border border-border/40 rounded-2xl">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="font-bold text-xs">Asset ID</TableHead>
                <TableHead className="font-bold text-xs">Device Name</TableHead>
                <TableHead className="font-bold text-xs">Custodian (Penerima)</TableHead>
                <TableHead className="font-bold text-xs">Company / Dept</TableHead>
                <TableHead className="font-bold text-xs">Location</TableHead>
                <TableHead className="font-bold text-xs text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {handoverAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    Belum ada aset yang pernah dicetak BAST nya di sini.
                  </TableCell>
                </TableRow>
              ) : (
                handoverAssets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-muted/10">
                    <TableCell className="font-bold text-xs text-blue-600 dark:text-blue-400">{asset.assetId}</TableCell>
                    <TableCell className="font-semibold text-xs">{asset.item}</TableCell>
                    <TableCell className="font-bold text-xs text-foreground/90">{asset.user}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold">{asset.company}</div>
                      <div className="text-[10px] text-muted-foreground">{asset.department || '-'}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{asset.location}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setRecipientName(asset.user || '');
                          setRecipientCompany(asset.company || '');
                          setRecipientDept(asset.department || '');
                          setRecipientLocation(asset.location || 'Head Office - The City Tower');
                          if (asset.specs?.processor) {
                            setRecipientPosition('User Custodian');
                          } else {
                            setRecipientPosition('');
                          }
                          const cleanedRemarks = asset.remarks ? asset.remarks.replace('[BAST]', '').trim() : '';
                          setNote(cleanedRemarks);
                          // Scroll to form smoothly
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold text-xs gap-1.5"
                      >
                        <FileText size={14} /> Cetak BAST
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
