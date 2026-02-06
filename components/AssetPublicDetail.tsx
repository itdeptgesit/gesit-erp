'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { ITAsset } from '../types';
import {
    Cpu, MapPin, Tag, Building2, AlertTriangle, ExternalLink,
    ShieldCheck, Zap, Server, Calendar, HardDrive, Smartphone,
    Sun, Moon, QrCode, FileCheck, Hash, Copy, Check,
    User, Folder, Users, AlertCircle, Monitor, Printer, Wifi, Box
} from 'lucide-react';

interface AssetPublicDetailProps {
    assetId: string;
}

// ----------------------------------------------------------------------
// Helper Components: Premium Minimalist Style
// ----------------------------------------------------------------------

const DataCard = ({ label, value, icon: Icon, mono = false, copyable = false }: { label: string, value: string | null | undefined, icon: any, mono?: boolean, copyable?: boolean }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            whileHover={{ y: -1 }}
            className="flex items-center gap-3 p-3.5 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500/20 transition-all group"
        >
            <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-all">
                <Icon size={16} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-0.5">{label}</p>
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs md:text-sm ${mono ? 'font-mono' : 'font-bold'} text-slate-900 dark:text-white truncate`}>
                        {value || '-'}
                    </span>
                    {copyable && value && (
                        <button
                            onClick={handleCopy}
                            className="p-1 rounded-lg text-slate-300 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100"
                        >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
    <div className="flex items-center gap-2 mb-2 mt-10 opacity-60">
        <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
            <Icon size={14} strokeWidth={2} />
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white">{title}</h3>
    </div>
);

const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('laptop') || cat.includes('pc') || cat.includes('monitor')) return Monitor;
    if (cat.includes('server')) return Server;
    if (cat.includes('network') || cat.includes('router') || cat.includes('access point')) return Wifi;
    if (cat.includes('smartphone') || cat.includes('tablet')) return Smartphone;
    if (cat.includes('printer')) return Printer;
    if (cat.includes('part') || cat.includes('komponen')) return Cpu;
    if (cat.includes('furniture')) return Box;
    return QrCode;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const AssetPublicDetail: React.FC<AssetPublicDetailProps> = ({ assetId }) => {
    const [asset, setAsset] = useState<ITAsset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

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
            <div className={`${theme} min-h-screen bg-white dark:bg-[#020617] flex flex-col items-center justify-center p-6`}>
                <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-12 items-center">
                    <div className="aspect-square bg-slate-50 dark:bg-white/5 animate-pulse rounded-[3rem]"></div>
                    <div className="space-y-6">
                        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full"></div>
                        <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                        <div className="h-6 w-1/2 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-lg"></div>
                        <div className="pt-8 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-50 dark:bg-white/[0.02] animate-pulse rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${theme === 'dark' ? 'bg-[#0B1120] text-white' : 'bg-slate-50 text-slate-900'}`}>
                <AlertTriangle size={32} className="mb-4 text-rose-500 animate-bounce" />
                <h1 className="text-xl font-bold tracking-widest uppercase">Record Nullified</h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                    Re-initialize
                </button>
            </div>
        );
    }

    const statusConfigs: Record<string, { color: string, bg: string }> = {
        'Active': { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', bg: 'bg-emerald-500' },
        'Used': { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', bg: 'bg-blue-500' },
        'Idle': { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', bg: 'bg-amber-500' },
        'Broken': { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', bg: 'bg-rose-500' },
        'Disposed': { color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', bg: 'bg-slate-500' }
    };

    const config = statusConfigs[asset.status] || statusConfigs['Disposed'];
    const CategoryIcon = getCategoryIcon(asset.category);
    const hasImage = !!asset.image_url;

    return (
        <div className={`${theme} min-h-screen lg:h-screen lg:overflow-hidden transition-all duration-700 ease-in-out bg-white dark:bg-[#020617]`}>
            {/* Mesh Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-100 dark:bg-blue-900/10 rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-[100px] opacity-40"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col">

                {/* Header: Fixed Top */}
                <header className="flex items-center justify-between px-8 py-4 border-b border-slate-100 dark:border-white/[0.05] backdrop-blur-xl bg-white/50 dark:bg-[#020617]/50">
                    <div className="flex items-center gap-3">
                        <img src="https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xs font-black uppercase tracking-[0.1em]">Gesit Digital Registry</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Registry Version: v4.1.2
                        </div>
                        <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-500 transition-colors">
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                    </div>
                </header>

                {/* Main Content Area: 3 Columns on Desktop */}
                <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

                    {/* Column 1: Visual & Status */}
                    <div className="lg:w-[28%] flex flex-col p-6 lg:p-8 xl:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/20 dark:bg-white/[0.005]">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full aspect-square max-w-[280px] lg:max-w-none flex items-center justify-center group">
                                <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[60px] opacity-40 group-hover:opacity-60 transition-opacity"></div>

                                {hasImage ? (
                                    <img src={asset.image_url} alt={asset.item} className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="relative z-10 flex flex-col items-center text-blue-600/40 dark:text-blue-400/30">
                                        <CategoryIcon size={140} strokeWidth={0.5} />
                                        <span className="mt-6 text-[8px] font-black uppercase tracking-widest">Digital Record Only</span>
                                    </div>
                                )}

                                <div className={`absolute -bottom-2 right-4 flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-xl shadow-xl ${config.color}`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${config.bg}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{asset.status}</span>
                                </div>
                            </motion.div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/[0.05]">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Tracking Asset ID</p>
                            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">{asset.assetId}</h2>
                        </div>
                    </div>

                    {/* Column 2: Logistics & Ownership (Scrollable on Tablet/Mobile) */}
                    <div className="lg:w-[34%] flex flex-col p-6 lg:p-8 xl:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/[0.05] lg:overflow-y-auto custom-scrollbar">
                        <div className="mb-10">
                            <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-4 uppercase">{asset.item}</h1>
                            <div className="w-12 h-1 bg-blue-600 rounded-full"></div>
                        </div>

                        <SectionHeader title="Logistics & Ownership" icon={FileCheck} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            <DataCard label="USER ASSIGNED" value={asset.user} icon={User} />
                            <DataCard label="CATEGORY" value={asset.category} icon={Folder} />
                            <DataCard label="ENTITAS" value={asset.company} icon={Building2} />
                            <DataCard label="DEPARTMENT" value={asset.department} icon={Users} />
                            <DataCard label="LOCATION" value={asset.location} icon={MapPin} />
                            <DataCard label="BRAND" value={asset.brand} icon={Tag} />
                            <DataCard label="SERIAL NUMBER" value={asset.serialNumber} icon={Hash} mono copyable />
                            <DataCard label="PURCHASE DATE" value={asset.purchaseDate} icon={Calendar} mono />
                        </div>
                    </div>

                    {/* Column 3: Specs & Support */}
                    <div className="lg:w-[38%] flex flex-col p-6 lg:p-8 xl:p-12 lg:overflow-y-auto custom-scrollbar bg-slate-50/20 dark:bg-white/[0.005]">
                        {asset.specs && (Object.values(asset.specs).some(v => v)) ? (
                            <section>
                                <SectionHeader title="Technical Specifications" icon={Cpu} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {asset.specs.processor && <DataCard label="PROCESSOR" value={asset.specs.processor} icon={Cpu} />}
                                    {asset.specs.ram && <DataCard label="RAM" value={asset.specs.ram} icon={Zap} />}
                                    {asset.specs.storage && <DataCard label="STORAGE" value={asset.specs.storage} icon={HardDrive} />}
                                    {asset.specs.vga && <DataCard label="VGA / GPU" value={asset.specs.vga} icon={Sun} />}
                                    {asset.specs.os && <DataCard label="OPERATING SYSTEM" value={asset.specs.os} icon={Server} />}
                                </div>
                            </section>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/[0.03] rounded-[2rem] p-8 text-center">
                                <AlertTriangle size={32} className="text-slate-200 dark:text-slate-800 mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Non-Technical Asset Class</p>
                            </div>
                        )}

                        <div className="mt-auto pt-12">
                            <div className="p-6 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl shadow-blue-500/10">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">IT Support Hotline</span>
                                    <ShieldCheck size={16} />
                                </div>
                                <h4 className="text-lg font-bold mb-2 tracking-tight">Need assistance?</h4>
                                <p className="text-xs opacity-70 mb-6 leading-relaxed">Our infrastructure team is ready to help with technical validated data or maintenance requests.</p>
                                <a href={`mailto:it@gesit.co.id?subject=Support: ${asset.assetId}`} className="block text-center py-3 bg-blue-600 dark:bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors active:scale-95">
                                    Initialize Support Chat
                                </a>
                            </div>

                            <div className="mt-8 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <span>The Gesit Companies</span>
                                <span className="text-emerald-500">Document Verified</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};