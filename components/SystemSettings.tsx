'use client';

import React, { useState, useEffect } from 'react';
import { Save, Settings, Globe, Shield, Image as ImageIcon, CheckCircle2, AlertCircle, Palette, RefreshCw, Mail, Phone, LayoutTemplate, MessageSquare, Lock, Database, Download, Trash2, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { trackActivity } from '../lib/auditLogger';
import { UserAccount } from '../types';

interface SystemSettingsProps {
    currentUser: UserAccount | null;
}

interface SystemSettings {
    appName: string;
    logoUrl: string;
    maintenanceMode: boolean;
    primaryColor: string;
    supportEmail: string;
    supportPhone: string;
    loginTitle: string;
    loginMessage: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireSpecialChars: boolean;
}

const colorPresets = [
    { name: 'Default Blue', value: '#2563eb' },
    { name: 'Royal Indigo', value: '#4f46e5' },
    { name: 'Rose Red', value: '#e11d48' },
    { name: 'Emerald Green', value: '#059669' },
    { name: 'Amber Orange', value: '#d97706' },
    { name: 'Violet Purple', value: '#7c3aed' },
];

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
    const [settings, setSettings] = useState<SystemSettings>({
        appName: 'GESIT WORK',
        logoUrl: '/image/logo.png',
        maintenanceMode: false,
        primaryColor: '#2563eb',
        supportEmail: '',
        supportPhone: '',
        loginTitle: 'Welcome back',
        loginMessage: 'Please enter your credentials to access your account.',
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        requireSpecialChars: true
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
                        appName: data.app_name || 'GESIT WORK',
                        logoUrl: data.logo_url || '/image/logo.png',
                        maintenanceMode: data.maintenance_mode || false,
                        primaryColor: data.primary_color || '#2563eb',
                        supportEmail: data.support_email || '',
                        supportPhone: data.support_phone || '',
                        loginTitle: data.login_title || 'Welcome back',
                        loginMessage: data.login_message || 'Please enter your credentials to access your account.',
                        sessionTimeout: data.session_timeout || 30,
                        maxLoginAttempts: data.max_login_attempts || 5,
                        requireSpecialChars: data.require_special_chars !== false
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

    // Live preview effect
    useEffect(() => {
        document.documentElement.style.setProperty('--primary', settings.primaryColor);
        document.documentElement.style.setProperty('--color-primary', settings.primaryColor);

        // Cleanup function to reset to saved state if unmounted without saving? 
        // Ideally no, because that might cause flickering if we just navigated away. 
        // But for live preview, let's keep it simple.
    }, [settings.primaryColor]);

    const handleSave = async () => {
        setIsSaving(true);
        setStatusMsg(null);
        try {
            const payload = {
                app_name: settings.appName,
                logo_url: settings.logoUrl,
                maintenance_mode: settings.maintenanceMode,
                primary_color: settings.primaryColor,
                support_email: settings.supportEmail,
                support_phone: settings.supportPhone,
                login_title: settings.loginTitle,
                login_message: settings.loginMessage,
                session_timeout: settings.sessionTimeout,
                max_login_attempts: settings.maxLoginAttempts,
                require_special_chars: settings.requireSpecialChars,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase.from('system_settings').upsert({ id: 1, ...payload });
            if (error) throw error;

            await trackActivity(
                currentUser?.fullName || 'User',
                currentUser?.role || 'User',
                'Update Settings',
                'System',
                `Updated global system configurations (AppName: ${settings.appName})`
            );

            setStatusMsg({ text: 'Protocol synchronized successfully!', type: 'success' });
        } catch (err: any) {
            setStatusMsg({ text: `Failed to save: ${err.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMsg(null), 5000);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <div className="animate-spin text-primary"><Settings size={32} /></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="flex justify-between items-center sticky top-0 py-4 z-20 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Settings className="text-primary" size={24} />
                        System Settings
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest pl-9">Global Configuration</p>
                </div>
                <div className="flex items-center gap-3">
                    {statusMsg && (
                        <div className={`px-4 py-2 rounded-xl flex items-center gap-2 animate-in slide-in-from-right-5 fade-in duration-300 ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400'}`}>
                            {statusMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            <span className="text-[10px] font-bold uppercase tracking-widest">{statusMsg.text}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* General Settings */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Identity</h3>
                            <p className="text-[10px] text-slate-400">Application branding and details</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 group-focus-within:text-primary transition-colors">Application Name</label>
                            <input
                                type="text"
                                value={settings.appName}
                                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700 dark:text-slate-200"
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 group-focus-within:text-primary transition-colors">Logo URL</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={settings.logoUrl}
                                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-xs text-slate-600 dark:text-slate-400"
                                />
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                                    <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full h-auto p-1" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Control */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">System Control</h3>
                            <p className="text-[10px] text-slate-400">Core functionality and access</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Maintenance Mode</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Redirect all non-admin users to splash page.</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Palette size={12} /> Primary Branding Color
                                </label>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{settings.primaryColor.toUpperCase()}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                                {/* Color Presets */}
                                <div className="flex gap-2 flex-wrap">
                                    {colorPresets.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => setSettings({ ...settings, primaryColor: preset.value })}
                                            className={`w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95 border-2 ${settings.primaryColor === preset.value ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent'}`}
                                            style={{ backgroundColor: preset.value }}
                                            title={preset.name}
                                        />
                                    ))}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                            className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer"
                                        />
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                            <Settings size={14} />
                                        </div>
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div className="pt-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Live Preview</p>
                                    <div className="flex gap-2 items-center">
                                        <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 transition-all uppercase tracking-wider">Button</button>
                                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">Badge</div>
                                        <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
                                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Organization Profile */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Phone size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Organization Profile</h3>
                            <p className="text-[10px] text-slate-400">Support contact details</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                                <Mail size={12} /> Helpdesk Email
                            </label>
                            <input
                                type="email"
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                placeholder="support@company.com"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-slate-700 dark:text-slate-200"
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                                <Phone size={12} /> Support Phone (Ext)
                            </label>
                            <input
                                type="text"
                                value={settings.supportPhone}
                                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                                placeholder="1001"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-slate-700 dark:text-slate-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Login Customization */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                            <LayoutTemplate size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Login Interface</h3>
                            <p className="text-[10px] text-slate-400">Customize the login experience</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2 group-focus-within:text-violet-500 transition-colors">
                                <LayoutTemplate size={12} /> Welcome Title
                            </label>
                            <input
                                type="text"
                                value={settings.loginTitle}
                                onChange={(e) => setSettings({ ...settings, loginTitle: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 transition-all text-slate-700 dark:text-slate-200"
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2 group-focus-within:text-violet-500 transition-colors">
                                <MessageSquare size={12} /> Welcome Message
                            </label>
                            <textarea
                                value={settings.loginMessage}
                                onChange={(e) => setSettings({ ...settings, loginMessage: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-500/20 transition-all text-slate-700 dark:text-slate-200 resize-none"
                            />
                        </div>
                    </div>
                </div>


                {/* Security Policies */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Security Policies</h3>
                            <p className="text-[10px] text-slate-400">Access control & protection</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="group">
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block group-focus-within:text-red-500 transition-colors">Session Timeout (Min)</label>
                                <span className="text-[10px] font-bold text-slate-900 dark:text-white">{settings.sessionTimeout}m</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="120"
                                step="5"
                                value={settings.sessionTimeout}
                                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                                className="w-full accent-red-500 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 group-focus-within:text-red-500 transition-colors">Max Login Attempts</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSettings({ ...settings, maxLoginAttempts: Math.max(1, settings.maxLoginAttempts - 1) })}
                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                                >-</button>
                                <div className="flex-1 text-center font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    {settings.maxLoginAttempts}
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, maxLoginAttempts: Math.min(10, settings.maxLoginAttempts + 1) })}
                                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                                >+</button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Strong Passwords</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Require special characters.</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, requireSpecialChars: !settings.requireSpecialChars })}
                                className={`w-12 h-6 rounded-full transition-all relative ${settings.requireSpecialChars ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings.requireSpecialChars ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Database size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Data Management</h3>
                            <p className="text-[10px] text-slate-400">System maintenance & logs</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/30 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-emerald-600">
                                    <ShieldAlert size={16} />
                                </div>
                                <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md">LOGS</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">Export Audit Logs</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                                Download a complete CSV report of all system activities and security events.
                            </p>
                            <button className="w-full py-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all flex items-center justify-center gap-2">
                                <Download size={12} /> Download CSV
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800/30 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-rose-500">
                                    <RefreshCw size={16} />
                                </div>
                                <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md">CACHE</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">Clear System Cache</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                                Remove local temporary data. This enables you to fix UI glitches without logging out.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={12} /> Clear & Reload
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Floating Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-4 rounded-3xl flex items-center justify-between gap-4 ring-1 ring-slate-900/5 dark:ring-white/10">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <RefreshCw size={18} className={isSaving ? "animate-spin" : ""} />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Protocol Deployment</p>
                            <p className="text-[10px] text-slate-500">Syncs changes across all instances</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/25 disabled:opacity-50 disabled:shadow-none min-w-[140px] flex justify-center"
                    >
                        {isSaving ? 'Syncing...' : 'Deploy Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
