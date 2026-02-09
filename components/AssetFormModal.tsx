'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, Shield, Building2, User, MapPin, Hash, Briefcase, Info, RefreshCw, Camera as CameraIcon } from 'lucide-react';
import { ITAsset, AssetCategory } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (asset: Partial<ITAsset>) => void;
    initialData?: ITAsset | null;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<Partial<ITAsset>>({});
    const [specs, setSpecs] = useState({ storage: '', ram: '', vga: '', processor: '' });
    const [companyList, setCompanyList] = useState<{ id: number, name: string, code: string }[]>([]);
    const [categoryList, setCategoryList] = useState<AssetCategory[]>([]);
    const [departmentList, setDepartmentList] = useState<{ id: number, name: string }[]>([]);

    // Ref untuk menyimpan suffix unik agar tidak berubah-ubah saat ganti company/cat dalam satu sesi edit
    const idSuffixRef = useRef<string>('');

    useEffect(() => {
        const fetchData = async () => {
            const { data: companies } = await supabase.from('companies').select('id, name, code').order('name');
            if (companies) setCompanyList(companies);

            const { data: categories } = await supabase.from('asset_categories').select('*').order('name');
            if (categories) setCategoryList(categories);

            const { data: depts } = await supabase.from('departments').select('id, name').order('name');
            if (depts) setDepartmentList(depts);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setSpecs({
                storage: initialData.specs?.storage || '',
                ram: initialData.specs?.ram || '',
                vga: initialData.specs?.vga || '',
                processor: initialData.specs?.processor || ''
            });
            // Keep existing ID for edits
            const parts = initialData.assetId?.split('-');
            idSuffixRef.current = parts && parts.length > 1 ? parts[parts.length - 1] : '???';
        } else {
            setFormData({
                status: 'Active',
                condition: 'New',
                company: '',
                category: '',
                department: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                location: '',
                vendor: '',
                price: 0
            });
            setSpecs({ storage: '', ram: '', vga: '', processor: '' });
            idSuffixRef.current = ''; // Will be populated by effect
        }
    }, [initialData, isOpen]);

    // Logic Otomatis Update Asset ID
    useEffect(() => {
        if (!isOpen || !formData.company || !formData.category) return;

        const isContextChanged = initialData && (
            formData.company !== initialData.company ||
            formData.category !== initialData.category
        );

        const currentId = formData.assetId || '';
        const isBadId = currentId.startsWith('GEN-') || !currentId;

        // Jika dalam mode edit, konteks belum berubah, dan ID sudah benar -> pertahankan ID original
        if (initialData && !isContextChanged && !isBadId) {
            if (formData.assetId !== initialData.assetId) {
                setFormData(prev => ({ ...prev, assetId: initialData.assetId }));
            }
            return;
        }

        const generateSequentialId = async () => {
            const companyObj = companyList.find(c => c.name === formData.company);
            const categoryObj = categoryList.find(c => c.name === formData.category);

            const compCode = companyObj?.code || formData.company.substring(0, 3).toUpperCase();
            const catCode = categoryObj?.code || formData.category.substring(0, 3).toUpperCase();
            const prefix = `${compCode}-${catCode}-`;

            // Query existing to find next number
            const { data: existing } = await supabase
                .from('it_assets')
                .select('asset_id')
                .eq('company', formData.company)
                .eq('category', formData.category);

            let nextNum = 1;
            if (existing && existing.length > 0) {
                const numbers = existing
                    .map(a => {
                        const parts = (a.asset_id || '').split('-');
                        const last = parts[parts.length - 1];
                        return parseInt(last, 10);
                    })
                    .filter(n => !isNaN(n));

                if (numbers.length > 0) {
                    nextNum = Math.max(...numbers) + 1;
                }
            }

            const suffix = nextNum.toString().padStart(3, '0');
            idSuffixRef.current = suffix;
            const newAssetId = `${prefix}${suffix}`;

            if (formData.assetId !== newAssetId) {
                setFormData(prev => ({ ...prev, assetId: newAssetId }));
            }
        };

        generateSequentialId();
    }, [formData.company, formData.category, companyList, categoryList, isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...formData, specs });
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 mt-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600";
    const labelClass = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1";

    const categoryName = formData.category?.toLowerCase() || '';
    const needsSpecs = categoryName.includes('laptop') ||
        categoryName.includes('computer') ||
        categoryName.includes('server') ||
        categoryName.includes('pc') ||
        categoryName.includes('workstation');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-4xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border border-white/20 dark:border-slate-800">
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                            {initialData ? t('editAsset') : t('addAsset')}
                        </h2>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Asset Lifecycle Registration</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form onSubmit={handleSubmit} id="assetForm" className="space-y-8">

                        {/* Asset ID Preview Banner */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-1">Generated Asset Identity</p>
                                <div className="flex items-center gap-3">
                                    <h2 className={`text-2xl font-black ${formData.assetId?.startsWith('GEN-') ? 'text-amber-500' : 'text-blue-100'} tracking-tight`}>{formData.assetId || 'Wait...'}</h2>
                                    {formData.assetId?.startsWith('GEN-') && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, assetId: '' }))}
                                            className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[9px] font-bold uppercase rounded-lg hover:bg-amber-500 hover:text-white transition-all"
                                        >
                                            Fix ID Format
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-right max-w-[200px]">
                                <Info size={16} className="text-blue-400/50 shrink-0" />
                                <p className="text-[10px] font-medium text-blue-300/60 leading-relaxed">ID updates automatically based on company and category selection.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Image Upload Section */}
                            <div className="lg:col-span-3 flex justify-center mb-4">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-all">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <CameraIcon size={20} className="mx-auto text-slate-400 mb-1" />
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Add Photo</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                // Simple Cloudinary Upload Logic (Same as Profile)
                                                const getEnv = (key: string, fallback: string): string => {
                                                    try {
                                                        // @ts-ignore
                                                        return (window.process?.env?.[key] || process?.env?.[key] || (import.meta as any).env?.[key] || fallback);
                                                    } catch (e) {
                                                        return fallback;
                                                    }
                                                };

                                                const cloudName = getEnv('VITE_CLOUDINARY_CLOUD_NAME', 'dmr8bxdos');
                                                const uploadPreset = getEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'gesit_erp_preset');
                                                const data = new FormData();
                                                data.append('file', file);
                                                data.append('upload_preset', uploadPreset);

                                                try {
                                                    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
                                                    const json = await res.json();
                                                    if (json.secure_url) {
                                                        setFormData({ ...formData, image_url: json.secure_url });
                                                    } else if (json.error) {
                                                        console.error("Cloudinary error:", json.error);
                                                        alert(`Upload failed: ${json.error.message}`);
                                                    }
                                                } catch (err) {
                                                    console.error("Upload failed", err);
                                                    alert("Failed to upload image. Protocol interrupted.");
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <label className={labelClass}>Item Name</label>
                                <input type="text" className={inputClass} value={formData.item || ''} onChange={(e) => setFormData({ ...formData, item: e.target.value })} required placeholder="e.g. ThinkPad X1 Carbon Gen 10" />
                            </div>
                            <div>
                                <label className={labelClass}>Category</label>
                                <select className={inputClass} value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                                    <option value="">- {t('pilih')} -</option>
                                    {categoryList.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                            <div>
                                <label className={labelClass}>Serial Number (S/N)</label>
                                <input type="text" className={inputClass} value={formData.serialNumber || ''} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="Unique hardware ID" />
                            </div>
                            <div>
                                <label className={labelClass}>Brand / Manufacturer</label>
                                <input type="text" className={inputClass} value={formData.brand || ''} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Lenovo, Dell, HP" />
                            </div>
                            <div>
                                <label className={labelClass}>Condition</label>
                                <select className={inputClass} value={formData.condition || 'New'} onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })} required>
                                    <option value="New">New</option>
                                    <option value="Used">Used</option>
                                    <option value="Refurbished">Refurbished</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Poor">Poor</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select className={inputClass} value={formData.status || 'Active'} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} required>
                                    <option value="Active">Active</option>
                                    <option value="Used">Used</option>
                                    <option value="Idle">Idle</option>
                                    <option value="Broken">Broken</option>
                                    <option value="Repair">In Repair</option>
                                    <option value="Disposed">Disposed</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                            <div>
                                <label className={labelClass}>Company Entity</label>
                                <select className={inputClass} value={formData.company || ''} onChange={(e) => setFormData({ ...formData, company: e.target.value })} required>
                                    <option value="">- {t('pilih')} -</option>
                                    {companyList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Department Affiliation</label>
                                <select className={inputClass} value={formData.department || ''} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                                    <option value="">- {t('pilih')} -</option>
                                    {departmentList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Purchase Date</label>
                                <input type="date" className={inputClass} value={formData.purchaseDate || ''} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100/50 dark:border-blue-900/20">
                            <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Shield size={12} /> PROCUREMENT & LIFECYCLE
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className={labelClass}>Vendor / Supplier</label>
                                    <input type="text" className={inputClass} value={formData.vendor || ''} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="Store or vendor name" />
                                </div>
                                <div>
                                    <label className={labelClass}>Purchase Price (IDR)</label>
                                    <input type="number" className={inputClass} value={formData.price || 0} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} placeholder="0" />
                                </div>
                                <div>
                                    <label className={labelClass}>Warranty Expiration</label>
                                    <input type="date" className={inputClass} value={formData.warrantyExp || ''} onChange={(e) => setFormData({ ...formData, warrantyExp: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                            <div>
                                <label className={labelClass}>Site Location</label>
                                <input type="text" className={inputClass} value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required placeholder="Floor, Room, or Data Center Rack" />
                            </div>
                            <div>
                                <label className={labelClass}>Current User / Custodian</label>
                                <input type="text" className={inputClass} value={formData.user || ''} onChange={(e) => setFormData({ ...formData, user: e.target.value })} placeholder="Name of employee assigned" />
                            </div>
                        </div>

                        {needsSpecs && (
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Shield size={12} /> Hardware Architecture Specs
                                </p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div><label className={labelClass}>Processor</label><input type="text" className={inputClass} value={specs.processor} onChange={(e) => setSpecs({ ...specs, processor: e.target.value })} placeholder="i7-12700H" /></div>
                                    <div><label className={labelClass}>Memory (RAM)</label><input type="text" className={inputClass} value={specs.ram} onChange={(e) => setSpecs({ ...specs, ram: e.target.value })} placeholder="32GB DDR5" /></div>
                                    <div><label className={labelClass}>Storage</label><input type="text" className={inputClass} value={specs.storage} onChange={(e) => setSpecs({ ...specs, storage: e.target.value })} placeholder="1TB NVMe" /></div>
                                    <div><label className={labelClass}>Graphic (VGA)</label><input type="text" className={inputClass} value={specs.vga} onChange={(e) => setSpecs({ ...specs, vga: e.target.value })} placeholder="RTX 3060" /></div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                            <label className={labelClass}>Administrative Remarks / Notes</label>
                            <textarea
                                rows={3} className={`${inputClass} resize-none`}
                                value={formData.remarks || ''}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="Condition, warranty info, or historical deployment notes..."
                            />
                        </div>
                    </form>
                </div>

                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2rem] flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">{t('cancel')}</button>
                    <button type="submit" form="assetForm" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};