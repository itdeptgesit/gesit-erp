'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ITAsset } from '../types';
import { Package, Cpu, MapPin, Tag, Building2, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, Zap, Info, ArrowLeft, Shield } from 'lucide-react';

interface AssetPublicDetailProps {
    assetId: string;
}

export const AssetPublicDetail: React.FC<AssetPublicDetailProps> = ({ assetId }) => {
    const [asset, setAsset] = useState<ITAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const { data, error } = await supabase
                    .from('it_assets')
                    .select('*')
                    .eq('asset_id', assetId)
                    .maybeSingle();

                if (error) throw error;
                if (!data) throw new Error('Asset ID not registered.');

                setAsset({
                    id: data.id,
                    assetId: data.asset_id,
                    item: data.item_name,
                    category: data.category,
                    brand: data.brand,
                    serialNumber: data.serial_number,
                    status: data.status,
                    location: data.location,
                    user: data.user_assigned,
                    remarks: data.remarks,
                    company: data.company,
                    department: data.department,
                    purchaseDate: data.purchase_date,
                    specs: data.specs,
                    image_url: data.image_url
                });
            } catch (err: any) {
                setError(err.message || 'Asset not found');
            } finally {
                setLoading(false);
            }
        };
        fetchAsset();
    }, [assetId]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-400 uppercase">Synchronizing...</p>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">AUTH FAILED</h1>
                <p className="text-slate-500 text-sm mb-8">{error || 'Record Corrupted'}</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Exit Protocol
                </button>
            </div>
        );
    }

    const statusConfig: Record<string, { color: string, label: string }> = {
        'Active': { color: 'bg-emerald-500', label: 'OPERATIONAL' },
        'Used': { color: 'bg-blue-600', label: 'IN PRODUCTION' },
        'Idle': { color: 'bg-amber-500', label: 'STANDBY' },
        'Broken': { color: 'bg-rose-500', label: 'OFFLINE' },
        'Disposed': { color: 'bg-slate-700', label: 'DECOMMISSIONED' }
    };

    const currentStatus = statusConfig[asset.status] || { color: 'bg-slate-500', label: asset.status.toUpperCase() };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                    <img src="https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png" alt="Logo" className="h-6 w-auto" />
                    <div className="h-4 w-px bg-slate-200"></div>
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-tighter">GESIT <span className="text-blue-600">CERTIFIED</span></h2>
                </div>
                <div className={`px-3 py-1 rounded-full text-white text-[9px] font-bold uppercase tracking-widest ${currentStatus.color}`}>
                    {currentStatus.label}
                </div>
            </header>

            <main className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-full max-w-sm h-64 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-slate-200 shadow-inner p-4">
                            {asset.image_url ? (
                                <img src={asset.image_url} alt={asset.item} className="w-full h-full object-contain mix-blend-multiply" />
                            ) : (
                                <Package size={40} className="text-blue-600" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2 uppercase">{asset.item}</h1>
                        <p className="text-blue-600 font-mono text-sm font-bold tracking-widest bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 mb-2">
                            {asset.assetId}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">S/N: {asset.serialNumber || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-10">
                        <InfoRow icon={Tag} label="Category" value={asset.category} />
                        <InfoRow icon={Building2} label="Company" value={asset.company} />
                        <InfoRow icon={Cpu} label="Brand" value={asset.brand} />
                        <InfoRow icon={MapPin} label="Location" value={asset.location} />
                    </div>

                    {asset.specs && (Object.values(asset.specs).some(v => !!v)) && (
                        <div className="bg-slate-900 rounded-xl p-6 text-white space-y-4">
                            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> System Vitals
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SpecEntry label="Processor" value={asset.specs.processor} />
                                <SpecEntry label="Memory" value={asset.specs.ram} />
                                <SpecEntry label="Storage" value={asset.specs.storage} />
                                <SpecEntry label="Visual" value={asset.specs.vga} />
                            </div>
                        </div>
                    )}

                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {asset.user?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assigned Personnel</p>
                                <p className="text-base font-bold text-slate-800 uppercase tracking-tight">{asset.user || 'POOL SYSTEM'}</p>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">{asset.department}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 py-4">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase hover:text-blue-600 transition-colors"
                    >
                        <ExternalLink size={14} /> Official Portal Access
                    </button>
                </div>
            </main>

            <footer className="p-10 text-center bg-white border-t border-slate-200 mt-auto">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2025 ALL RIGHTS RESERVED • CORE TECHNOLOGY OPERATIONS</p>
            </footer>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
            <Icon size={14} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-700 uppercase">{value}</span>
        </div>
    </div>
);

const SpecEntry = ({ label, value }: any) => (
    <div className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2">
        <span className="text-slate-400 uppercase">{label}</span>
        <span className="font-bold text-white uppercase">{value || 'N/A'}</span>
    </div>
);