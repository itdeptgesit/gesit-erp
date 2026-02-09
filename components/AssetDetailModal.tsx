import React from 'react';
import {
    X, Package, Tag, Building2, Cpu, MapPin, ShieldCheck,
    Info, User, Calendar, FileText
} from 'lucide-react';
import { ITAsset } from '../types';

interface AssetDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: ITAsset | null;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ isOpen, onClose, asset }) => {
    if (!isOpen || !asset) return null;

    const statusConfig: Record<string, { color: string, label: string }> = {
        'Active': { color: 'bg-emerald-500', label: 'OPERATIONAL' },
        'Used': { color: 'bg-blue-600', label: 'IN PRODUCTION' },
        'Idle': { color: 'bg-amber-500', label: 'STANDBY' },
        'Broken': { color: 'bg-rose-500', label: 'OFFLINE' },
        'Disposed': { color: 'bg-slate-700', label: 'DECOMMISSIONED' }
    };

    const currentStatus = statusConfig[asset.status] || { color: 'bg-slate-500', label: asset.status.toUpperCase() };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-slate-800 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">Asset Intelligence</h3>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Detailed Node Specification</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-white text-[9px] font-bold uppercase tracking-widest ${currentStatus.color}`}>
                            {currentStatus.label}
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-full max-w-sm h-64 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner p-4">
                            {asset.image_url ? (
                                <img src={asset.image_url} alt={asset.item} className="w-full h-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 opacity-20">
                                    <Package size={64} className="text-slate-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">No Image Proxy</span>
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 uppercase">{asset.item}</h1>
                        <p className="text-blue-600 dark:text-blue-400 font-mono text-sm font-bold tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 mb-2">
                            {asset.assetId}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">S/N: {asset.serialNumber || 'N/A'}</p>
                    </div>

                    {/* Main Grid info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <InfoRow icon={Tag} label="Category" value={asset.category} />
                        <InfoRow icon={Building2} label="Company" value={asset.company} />
                        <InfoRow icon={Cpu} label="Brand" value={asset.brand} />
                        <InfoRow icon={MapPin} label="Location" value={asset.location} />
                        <InfoRow icon={ShieldCheck} label="Condition" value={asset.condition} />
                        <InfoRow icon={Calendar} label="Purchase Date" value={asset.purchaseDate} />
                        <InfoRow icon={Building2} label="Vendor" value={asset.vendor} />
                        <InfoRow icon={Calendar} label="Warranty Exp" value={asset.warrantyExp} />
                        <InfoRow icon={FileText} label="Remarks" value={asset.remarks} />
                    </div>

                    {/* Specs Section */}
                    {asset.specs && (Object.values(asset.specs).some(v => !!v)) && (
                        <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 mb-8">
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

                    {/* User Assignment */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="w-12 h-12 bg-slate-900 dark:bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {asset.user?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Assigned Personnel</p>
                                <p className="text-base font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{asset.user || 'POOL SYSTEM'}</p>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tighter">{asset.department}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="py-2.5 px-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                    >
                        Close View
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }: any) => (
    <div className="flex flex-col gap-1 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Icon size={10} /> {label}
        </span>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase truncate" title={value || '-'}>
            {(!value || value.toString().toLowerCase() === 'nan' || value === '-') ? '-' : value}
        </span>
    </div>
);

const SpecEntry = ({ label, value }: any) => (
    <div className="flex justify-between items-center text-[11px] border-b border-white/5 pb-2">
        <span className="text-slate-400 uppercase">{label}</span>
        <span className="font-bold text-white uppercase">{value || 'N/A'}</span>
    </div>
);
