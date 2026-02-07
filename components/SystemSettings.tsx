'use client';

import React, { useState, useEffect } from 'react';
import { Save, Settings, Globe, Shield, CheckCircle2, AlertCircle, Palette, RefreshCw, Mail, Phone, LayoutTemplate, Lock, Database, Download, Trash2, ShieldAlert, Building2, Sparkles, Eye } from 'lucide-react';
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
    fontFamily: string;
    appTagline: string;
    faviconUrl: string;
    companyAddress: string;
    companyWebsite: string;
}

const colorPresets = [
    { name: 'Default Blue', value: '#2563eb' },
    { name: 'Royal Indigo', value: '#4f46e5' },
    { name: 'Rose Red', value: '#e11d48' },
    { name: 'Emerald Green', value: '#059669' },
    { name: 'Violet Purple', value: '#7c3aed' },
];

const fontPresets = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Nunito', value: 'Nunito' },
    { name: 'Work Sans', value: 'Work Sans' },
    { name: 'Raleway', value: 'Raleway' },
    { name: 'Source Sans Pro', value: 'Source Sans Pro' },
    { name: 'Outfit', value: 'Outfit' },
    { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
    { name: 'DM Sans', value: 'DM Sans' },
    { name: 'Space Grotesk', value: 'Space Grotesk' },
    { name: 'Manrope', value: 'Manrope' },
    { name: 'Ubuntu', value: 'Ubuntu' },
    { name: 'Google Sans', value: 'Google Sans' },
];

type TabType = 'general' | 'appearance' | 'security' | 'system';

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<TabType>('general');
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
        requireSpecialChars: true,
        fontFamily: 'Inter',
        appTagline: '',
        faviconUrl: '/favicon.ico',
        companyAddress: '',
        companyWebsite: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('system_settings').select('*').single();
                if (error && error.code !== 'PGRST116') throw error;
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
                        requireSpecialChars: data.require_special_chars !== false,
                        fontFamily: data.font_family || 'Inter',
                        appTagline: data.app_tagline || '',
                        faviconUrl: data.favicon_url || '/favicon.ico',
                        companyAddress: data.company_address || '',
                        companyWebsite: data.company_website || ''
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

    useEffect(() => {
        document.documentElement.style.setProperty('--primary', settings.primaryColor);
        document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    }, [settings.primaryColor]);

    useEffect(() => {
        document.documentElement.style.setProperty('--font-sans', settings.fontFamily);
    }, [settings.fontFamily]);

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
                font_family: settings.fontFamily,
                app_tagline: settings.appTagline,
                favicon_url: settings.faviconUrl,
                company_address: settings.companyAddress,
                company_website: settings.companyWebsite,
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

            setStatusMsg({ text: 'Settings saved successfully!', type: 'success' });
        } catch (err: any) {
            setStatusMsg({ text: `Failed to save: ${err.message}`, type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMsg(null), 5000);
        }
    };

    const handleExportLogs = async () => {
        setIsExporting(true);
        try {
            const { data, error } = await supabase
                .from('user_activity_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("No logs found to export.");

            const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Details'];
            const csvRows = [
                headers.join(','),
                ...data.map(log => [
                    `"${log.created_at}"`,
                    `"${log.user_name}"`,
                    `"${log.user_role}"`,
                    `"${log.module}"`,
                    `"${log.action}"`,
                    `"${(log.details || '').replace(/"/g, '""')}"`
                ].join(','))
            ];

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `GESIT_AUDIT_LOGS_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            await trackActivity(
                currentUser?.fullName || 'User',
                currentUser?.role || 'User',
                'Export Logs',
                'System',
                'Successfully exported full audit trail to CSV'
            );

            setStatusMsg({ text: 'Audit trail exported!', type: 'success' });
        } catch (err: any) {
            setStatusMsg({ text: `Export failed: ${err.message}`, type: 'error' });
        } finally {
            setIsExporting(false);
            setTimeout(() => setStatusMsg(null), 5000);
        }
    };

    const handleClearCache = () => {
        setIsClearing(true);
        setTimeout(() => {
            try {
                localStorage.clear();
                sessionStorage.clear();
                setStatusMsg({ text: 'Cache purged. Reinitializing...', type: 'success' });
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (err) {
                setIsClearing(false);
            }
        }, 800);
    };

    if (isLoading) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <div className="animate-spin text-primary"><Settings size={32} /></div>
            </div>
        );
    }

    const tabs = [
        { id: 'general' as TabType, label: 'General', icon: Globe },
        { id: 'appearance' as TabType, label: 'Appearance', icon: Sparkles },
        { id: 'security' as TabType, label: 'Security', icon: Shield },
        { id: 'system' as TabType, label: 'System', icon: Settings },
    ];

    return (
        <div className="relative min-h-screen pb-32">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your application</p>
                        </div>
                        {statusMsg && (
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                                {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                <span className="text-sm font-medium">{statusMsg.text}</span>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* App Identity */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">App Identity</h3>
                                    <p className="text-sm text-slate-500">Application branding and identity</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">App Name</label>
                                    <input
                                        type="text"
                                        value={settings.appName}
                                        onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Tagline</label>
                                    <input
                                        type="text"
                                        value={settings.appTagline}
                                        onChange={(e) => setSettings({ ...settings, appTagline: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Logo URL</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={settings.logoUrl}
                                            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2">
                                            <img src={settings.logoUrl} alt="Logo" className="max-w-full h-auto" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Favicon URL</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={settings.faviconUrl}
                                            onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                                            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2">
                                            <img src={settings.faviconUrl} alt="Favicon" className="max-w-full h-auto" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/32")} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Organization</h3>
                                    <p className="text-sm text-slate-500">Company information and contact details</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Support Email</label>
                                    <input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                        placeholder="support@company.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Support Phone</label>
                                    <input
                                        type="text"
                                        value={settings.supportPhone}
                                        onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                                        placeholder="1001"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Website URL</label>
                                    <input
                                        type="text"
                                        value={settings.companyWebsite}
                                        onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                                        placeholder="https://company.com"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Office Address</label>
                                    <textarea
                                        value={settings.companyAddress}
                                        onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                                        rows={2}
                                        placeholder="Jl. Sudirman No. 1, Jakarta"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Theme Color */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Palette size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Theme Color</h3>
                                    <p className="text-sm text-slate-500">Customize your brand color</p>
                                </div>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {colorPresets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => setSettings({ ...settings, primaryColor: preset.value })}
                                        className={`w-16 h-16 rounded-xl transition-all hover:scale-110 border-4 ${settings.primaryColor === preset.value ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: preset.value }}
                                        title={preset.name}
                                    />
                                ))}
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="w-16 h-16 opacity-0 absolute inset-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                        <Palette size={24} className="text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                                    <LayoutTemplate size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Typography</h3>
                                    <p className="text-sm text-slate-500">Choose your font family</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {fontPresets.map(font => (
                                    <button
                                        key={font.value}
                                        onClick={() => setSettings({ ...settings, fontFamily: font.value })}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${settings.fontFamily === font.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <span className="text-xs font-medium text-slate-500 block mb-2">{font.name}</span>
                                        <span className="text-2xl text-slate-900 dark:text-white block" style={{ fontFamily: font.value }}>Aa</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl" style={{ fontFamily: settings.fontFamily }}>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Preview</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">The quick brown fox jumps over the lazy dog</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Login Settings */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                                    <Eye size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Login Interface</h3>
                                    <p className="text-sm text-slate-500">Customize login page</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Welcome Title</label>
                                    <input
                                        type="text"
                                        value={settings.loginTitle}
                                        onChange={(e) => setSettings({ ...settings, loginTitle: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Welcome Message</label>
                                    <textarea
                                        value={settings.loginMessage}
                                        onChange={(e) => setSettings({ ...settings, loginMessage: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Policies */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Security Policies</h3>
                                    <p className="text-sm text-slate-500">Access control and protection</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Session Timeout</label>
                                        <span className="text-sm font-bold text-primary">{settings.sessionTimeout}m</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={settings.sessionTimeout}
                                        onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                                        className="w-full accent-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Max Login Attempts</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSettings({ ...settings, maxLoginAttempts: Math.max(1, settings.maxLoginAttempts - 1) })}
                                            className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                                        >-</button>
                                        <div className="flex-1 text-center font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                            {settings.maxLoginAttempts}
                                        </div>
                                        <button
                                            onClick={() => setSettings({ ...settings, maxLoginAttempts: Math.min(10, settings.maxLoginAttempts + 1) })}
                                            className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Strong Passwords</h4>
                                        <p className="text-xs text-slate-500">Require special chars</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, requireSpecialChars: !settings.requireSpecialChars })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${settings.requireSpecialChars ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.requireSpecialChars ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* System Tab */}
                {activeTab === 'system' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* System Control */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">System Control</h3>
                                    <p className="text-sm text-slate-500">Global system state</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Maintenance Mode</h4>
                                    <p className="text-sm text-slate-500 mt-1">Lock system access for maintenance</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                    className={`w-14 h-8 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-rose-500 shadow-lg shadow-rose-500/40' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${settings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        {/* Data Management */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Database size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white">Data Management</h3>
                                    <p className="text-sm text-slate-500">System maintenance and logs</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">Export Audit Logs</h4>
                                            <p className="text-xs text-slate-500">Download CSV report</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleExportLogs}
                                        disabled={isExporting}
                                        className="w-full py-2.5 bg-white dark:bg-slate-900 border-2 border-emerald-500/20 rounded-lg text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                                        {isExporting ? 'Exporting...' : 'Download CSV'}
                                    </button>
                                </div>
                                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
                                            <RefreshCw size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">Clear System Cache</h4>
                                            <p className="text-xs text-slate-500">Remove temporary data</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClearCache}
                                        disabled={isClearing}
                                        className="w-full py-2.5 bg-white dark:bg-slate-900 border-2 border-rose-500/20 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Trash2 size={16} className={isClearing ? 'animate-bounce' : ''} />
                                        {isClearing ? 'Clearing...' : 'Clear & Reload'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                    {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};
