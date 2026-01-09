'use client';

import React, { useState, useEffect } from 'react';
import { Save, Settings, Globe, Shield, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SystemSettings {
    appName: string;
    logoUrl: string;
    maintenanceMode: boolean;
    primaryColor: string;
}

export const SystemSettings: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings>({
        appName: 'Gesit ERP',
        logoUrl: 'https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png',
        maintenanceMode: false,
        primaryColor: '#2563eb'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('system_settings').select('*').single();
                if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for "no results"
                if (data) {
                    setSettings({
                        appName: data.app_name || 'Gesit ERP',
                        logoUrl: data.logo_url || 'https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png',
                        maintenanceMode: data.maintenance_mode || false,
                        primaryColor: data.primary_color || '#2563eb'
                    });
                }
            } catch (err: any) {
                console.warn("Settings fetch error:", err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setStatusMsg(null);
        try {
            const payload = {
                app_name: settings.appName,
                logo_url: settings.logoUrl,
                maintenance_mode: settings.maintenanceMode,
                primary_color: settings.primaryColor,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from('system_settings').upsert({ id: 1, ...payload });
            if (error) throw error;

            setStatusMsg({ text: 'Settings updated successfully!', type: 'success' });
            // In a real app, you'd trigger a global state refresh here
        } catch (err: any) {
            setStatusMsg({ text: `Failed to save: ${err.message}. (Make sure 'system_settings' table exists)`, type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMsg(null), 5000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <div className="animate-spin text-blue-500"><Settings size={32} /></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">Global Configuration</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Settings className="animate-spin" size={14} /> : <Save size={14} />}
                    Save Protocol
                </button>
            </div>

            {statusMsg && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/20' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/20'}`}>
                    {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="font-bold text-[10px] uppercase tracking-widest">{statusMsg.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Globe size={18} className="text-blue-500" />
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Identity</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Application Name</label>
                            <input
                                type="text"
                                value={settings.appName}
                                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Logo URL</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={settings.logoUrl}
                                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                />
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full h-auto" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Control */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield size={18} className="text-rose-500" />
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">System Control</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Maintenance Mode</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Redirect all non-admin users to a dynamic splash page.</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Primary Branding Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={settings.primaryColor}
                                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{settings.primaryColor.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-md">
                        <h3 className="text-xl font-bold tracking-tight mb-2">Protocol Deployment</h3>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed opacity-80 uppercase tracking-widest">
                            These settings are global and will affect all instances of the application. Changes are synchronized in real-time.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-white text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 shadow-lg"
                    >
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
