'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ITAsset } from '../types';
import {
    Cpu, MapPin, Tag, Building2, AlertTriangle, ExternalLink,
    ShieldCheck, Zap, Server, Calendar, HardDrive, Smartphone,
    Sun, Moon, QrCode, FileCheck, Hash, Copy, Check
} from 'lucide-react';

interface AssetPublicDetailProps {
    assetId: string;
}

// ----------------------------------------------------------------------
// Helper Components: "Spec Sheet" Style
// ----------------------------------------------------------------------

const DataRow = ({ label, value, mono = false, copyable = false }: { label: string, value: string | null | undefined, mono?: boolean, copyable?: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="grid grid-cols-12 border-b border-slate-200 dark:border-slate-800 last:border-0 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors px-4 group">
            <div className="col-span-5 md:col-span-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{label}</span>
            </div>
            <div className="col-span-7 md:col-span-8 flex items-center justify-between">
                <span className={`text-sm ${mono ? 'font-mono' : 'font-semibold'} text-slate-900 dark:text-slate-100 uppercase truncate`}>
                    {value || '-'}
                </span>
                {copyable && value && (
                    <button
                        onClick={handleCopy}
                        className="text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                )}
            </div>
        </div>
    );
};

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-900 dark:border-slate-100 mt-8">
        <Icon size={16} className="text-slate-900 dark:text-slate-100" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
);

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const AssetPublicDetail: React.FC<AssetPublicDetailProps> = ({ assetId }) => {
    const [asset, setAsset] = useState<ITAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Default to light for document feel

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }

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

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    if (!mounted) return null;

    if (loading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0B1120]`}>
                <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-slate-900 dark:bg-slate-100 animate-[shimmer_1s_infinite]"></div>
                </div>
                <p className="mt-4 text-[10px] font-mono uppercase text-slate-400">Retrieving Record...</p>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${theme === 'dark' ? 'bg-[#0B1120] text-white' : 'bg-slate-50 text-slate-900'}`}>
                <AlertTriangle size={32} className="mb-4 text-red-600" />
                <h1 className="text-xl font-bold uppercase tracking-wide">Record Not Found</h1>
                <p className="text-sm font-mono mt-2 opacity-60">{error}</p>
                <button onClick={toggleTheme} className="mt-8 text-[10px] uppercase font-bold tracking-widest opacity-50 hover:opacity-100">
                    Switch Theme
                </button>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        'Active': 'text-emerald-600 border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-400',
        'Used': 'text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-400',
        'Idle': 'text-amber-600 border-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-400',
        'Broken': 'text-rose-600 border-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-400',
        'Disposed': 'text-slate-600 border-slate-600 bg-slate-50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-400'
    };

    const statusStyle = statusColors[asset.status] || statusColors['Disposed'];

    return (
        <div className={`${theme} min-h-screen transition-colors duration-300`}>
            {/* Background Layer */}
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050911] text-slate-900 dark:text-slate-100 font-sans md:py-12">

                {/* Document Container */}
                <div className="w-full max-w-3xl bg-white dark:bg-[#0B1120] md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-none min-h-[calc(100vh-6rem)] md:min-h-auto relative animate-in slide-in-from-bottom-8 duration-1000 ease-out fade-in fill-mode-backwards">

                    {/* Watermark Background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.05] select-none">
                        <div className="transform -rotate-45 border-8 border-current p-8 rounded-3xl">
                            <span className="text-5xl md:text-7xl font-black uppercase text-slate-900 dark:text-white whitespace-nowrap tracking-widest">
                                Property of Gesit
                            </span>
                        </div>
                    </div>

                    {/* Top Accent Line */}
                    <div className="h-1.5 w-full bg-slate-900 dark:bg-blue-600" />

                    {/* Header Section */}
                    <header className="px-6 py-6 md:px-10 md:py-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                                Gesit<span className="text-blue-600">Assets</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                Digital Verification System
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={toggleTheme} className="opacity-40 hover:opacity-100 transition-opacity">
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                            <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xl rounded-lg">
                                <QrCode size={24} />
                            </div>
                        </div>
                    </header>

                    {/* Content Body */}
                    <main className="px-6 py-8 md:px-10">

                        {/* Identity Block */}
                        <div className="flex flex-col items-center text-center gap-6 mb-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-mono font-bold text-slate-500 mb-4 border border-slate-200 dark:border-white/10 mx-auto">
                                    <Hash size={12} />
                                    {asset.assetId}
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-[0.9] mb-2">
                                    {asset.item}
                                </h2>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                    {asset.category} • {asset.brand}
                                </p>
                            </div>

                            {/* Status "Stamp" - Centered */}
                            <div className={`relative px-10 py-3 border-4 border-double rounded-lg text-center transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-default group shadow-sm ${statusStyle}`}>
                                <div className="absolute inset-0 opacity-10 bg-current"></div>
                                <span className="text-[10px] uppercase font-black tracking-[0.3em] opacity-80 block mb-1">Status Verified</span>
                                <span className="text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Courier New, monospace' }}>{asset.status}</span>

                                {/* Decorative stars in corners */}
                                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-current rounded-full opacity-40"></div>
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-current rounded-full opacity-40"></div>
                                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-current rounded-full opacity-40"></div>
                                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-current rounded-full opacity-40"></div>
                            </div>
                        </div>

                        {/* Hero Image Section */}
                        <div className="w-full bg-white border border-slate-200 dark:border-slate-800 p-4 mb-10 flex justify-center items-center relative overflow-hidden rounded-sm group">
                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
                            {asset.image_url ? (
                                <img
                                    src={asset.image_url}
                                    alt={asset.item}
                                    className="relative z-10 w-auto h-64 md:h-80 object-contain drop-shadow-xl"
                                />
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center opacity-20">
                                    <Server size={64} />
                                    <span className="text-xs uppercase font-bold mt-4">No Image Record</span>
                                </div>
                            )}

                            {/* Watermark-style brand */}
                            <div className="absolute bottom-4 right-4 z-10 opacity-10 font-black text-6xl uppercase tracking-tighter pointer-events-none select-none">
                                Gesit
                            </div>
                        </div>

                        {/* Specifications Grid */}
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">

                            {/* Column 1: Asset Data */}
                            <div>
                                <SectionHeader title="Assignment Data" icon={FileCheck} />
                                <div className="border-t border-slate-200 dark:border-slate-800">
                                    <DataRow label="Custodian" value={asset.user || 'Unassigned'} />
                                    <DataRow label="Department" value={asset.department} />
                                    <DataRow label="Company" value={asset.company} />
                                    <DataRow label="Location" value={asset.location} />
                                </div>
                            </div>

                            {/* Column 2: Tech Specs */}
                            <div>
                                <SectionHeader title="Technical Specs" icon={Cpu} />
                                <div className="border-t border-slate-200 dark:border-slate-800">
                                    <DataRow label="Serial Number" value={asset.serialNumber} mono copyable />
                                    <DataRow label="Purchased" value={asset.purchaseDate} mono />
                                    {asset.specs?.processor && <DataRow label="Processor" value={asset.specs.processor} />}
                                    {asset.specs?.ram && <DataRow label="Memory" value={asset.specs.ram} />}
                                    {asset.specs?.storage && <DataRow label="Storage" value={asset.specs.storage} />}
                                    {asset.specs?.os && <DataRow label="OS" value={asset.specs.os} />}
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-12 pt-8 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-center">
                            <a
                                href={`mailto:it@gesit.co.id?subject=Report: ${asset.assetId}`}
                                className="group flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-400 hover:text-white transition-colors"
                            >
                                <ExternalLink size={14} />
                                Report an Issue
                            </a>
                        </div>

                    </main>

                    {/* Document Footer */}
                    <footer className="bg-slate-50 dark:bg-slate-800/30 px-6 py-4 md:px-10 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400">
                        <span>System Gen. v2.4</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </footer>
                </div>
            </div>
        </div>
    );
};