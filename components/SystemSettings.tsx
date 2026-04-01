'use client';

import React, { useState, useEffect } from 'react';
import { Save, Settings, Globe, Shield, CheckCircle2, AlertCircle, Palette, RefreshCw, Mail, Phone, LayoutTemplate, Lock, Database, Download, Trash2, ShieldAlert, Building2, Sparkles, Eye } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { trackActivity } from '../lib/auditLogger';
import { UserAccount } from '../types';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";


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
        appName: 'GESIT PORTAL',
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
                        appName: data.app_name || 'GESIT PORTAL',
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
            <PageHeader
                title="System Settings"
                description="Configure your application environment & preferences"
            >
                <div className="flex items-center gap-3">
                    {statusMsg && (
                        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span className="text-xs font-bold uppercase tracking-wider">{statusMsg.text}</span>
                        </div>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="font-bold uppercase tracking-widest text-[10px] px-6"
                    >
                        {isSaving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </PageHeader>

            {/* Tabs & Content Container */}
            <div className="max-w-7xl mx-auto px-6 mb-32">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="space-y-8">
                    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b -mx-6 px-6 py-4 mb-2">
                        <TabsList className="h-11 p-1 bg-muted rounded-lg w-fit">
                            {tabs.map((tab) => (
                                <TabsTrigger 
                                    key={tab.id} 
                                    value={tab.id}
                                    className="px-6 rounded-md font-bold text-[10px] uppercase tracking-widest h-9"
                                >
                                    <tab.icon size={14} className="mr-2" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent value="general" className="space-y-6 animate-in fade-in duration-300">
                        {/* App Identity */}
                        <Card className="rounded-lg shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">App Identity</CardTitle>
                                        <CardDescription>Application branding and identity</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">App Name</Label>
                                        <Input
                                            value={settings.appName}
                                            onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                            className="bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tagline</Label>
                                        <Input
                                            value={settings.appTagline}
                                            onChange={(e) => setSettings({ ...settings, appTagline: e.target.value })}
                                            className="bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logo URL</Label>
                                        <div className="flex gap-3">
                                            <Input
                                                value={settings.logoUrl}
                                                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                                className="bg-muted/20"
                                            />
                                            <div className="w-10 h-10 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/40")} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Favicon URL</Label>
                                        <div className="flex gap-3">
                                            <Input
                                                value={settings.faviconUrl}
                                                onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                                                className="bg-muted/20"
                                            />
                                            <div className="w-10 h-10 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                                                <img src={settings.faviconUrl} alt="Favicon" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/32")} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organization */}
                        <Card className="rounded-lg shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Organization</CardTitle>
                                        <CardDescription>Company information and contact details</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Support Email</Label>
                                        <Input
                                            type="email"
                                            value={settings.supportEmail}
                                            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                            placeholder="support@company.com"
                                            className="bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Support Phone</Label>
                                        <Input
                                            value={settings.supportPhone}
                                            onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                                            placeholder="1001"
                                            className="bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Website URL</Label>
                                        <Input
                                            value={settings.companyWebsite}
                                            onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                                            placeholder="https://company.com"
                                            className="bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Office Address</Label>
                                        <Textarea
                                            value={settings.companyAddress}
                                            onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                                            rows={3}
                                            placeholder="Jl. Sudirman No. 1, Jakarta"
                                            className="bg-muted/20 resize-none"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-6 animate-in fade-in duration-300">
                        {/* Theme Color */}
                        <Card className="rounded-lg shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                        <Palette size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Theme Color</CardTitle>
                                        <CardDescription>Customize your brand color</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 flex-wrap">
                                    {colorPresets.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => setSettings({ ...settings, primaryColor: preset.value })}
                                            className={cn(
                                                "w-12 h-12 rounded-lg transition-all hover:scale-105 border-2 shadow-sm",
                                                settings.primaryColor === preset.value ? "border-primary scale-110 shadow-md ring-2 ring-primary/20 ring-offset-2" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: preset.value }}
                                            title={preset.name}
                                        />
                                    ))}
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                            className="w-12 h-12 opacity-0 absolute inset-0 cursor-pointer z-10"
                                        />
                                        <div className="w-12 h-12 rounded-lg bg-muted border-2 flex items-center justify-center transition-all group-hover:scale-105">
                                            <Palette size={20} className="text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Typography */}
                        <Card className="rounded-lg shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-500">
                                        <LayoutTemplate size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Typography</CardTitle>
                                        <CardDescription>Choose your font family</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {fontPresets.map(font => (
                                        <button
                                            key={font.value}
                                            onClick={() => setSettings({ ...settings, fontFamily: font.value })}
                                            className={cn(
                                                "p-4 rounded-lg border-2 text-left transition-all hover:bg-muted/50",
                                                settings.fontFamily === font.value ? "border-primary bg-primary/5" : "border-muted"
                                            )}
                                        >
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1 tracking-wider">{font.name}</span>
                                            <span className="text-2xl font-bold" style={{ fontFamily: font.value }}>Aa</span>
                                        </button>
                                    ))}
                                </div>
                                <Separator className="my-6" />
                                <div className="p-6 bg-muted/30 rounded-lg border border-dashed" style={{ fontFamily: settings.fontFamily }}>
                                    <h4 className="text-sm font-bold opacity-70 mb-3 uppercase tracking-widest">Global Font Preview</h4>
                                    <h1 className="text-3xl font-black mb-2 uppercase">The Enterprise Work Platform</h1>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Your digital asset ecosystem has never looked this professional. This preview uses the 
                                        <strong> {settings.fontFamily}</strong> type family which will be applied globally across the portal.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 animate-in fade-in duration-300">
                        {/* Login Settings */}
                        <Card className="rounded-lg shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-500">
                                        <Eye size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Login Interface</CardTitle>
                                        <CardDescription>Customize login page aesthetic</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Welcome Title</Label>
                                        <Input
                                            value={settings.loginTitle}
                                            onChange={(e) => setSettings({ ...settings, loginTitle: e.target.value })}
                                            className="bg-muted/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Welcome Message</Label>
                                        <Textarea
                                            value={settings.loginMessage}
                                            onChange={(e) => setSettings({ ...settings, loginMessage: e.target.value })}
                                            rows={2}
                                            className="bg-muted/20 resize-none"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Policies */}
                        <Card className="rounded-lg shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center text-red-500">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Security Policies</CardTitle>
                                        <CardDescription>Access control and registry protection</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Timeout</Label>
                                            <Badge variant="secondary" className="font-mono text-xs">{settings.sessionTimeout}m</Badge>
                                        </div>
                                        <Slider
                                            min={5}
                                            max={120}
                                            step={5}
                                            value={[settings.sessionTimeout]}
                                            onValueChange={(v) => setSettings({ ...settings, sessionTimeout: v[0] })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Login Attempts</Label>
                                        <div className="flex items-center gap-2 h-10 border rounded-md bg-muted/20 px-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-muted"
                                                onClick={() => setSettings({ ...settings, maxLoginAttempts: Math.max(1, settings.maxLoginAttempts - 1) })}
                                            >-</Button>
                                            <div className="flex-1 text-center font-bold">{settings.maxLoginAttempts}</div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-muted"
                                                onClick={() => setSettings({ ...settings, maxLoginAttempts: Math.min(10, settings.maxLoginAttempts + 1) })}
                                            >+</Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-md border">
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold uppercase tracking-tighter">Strong Passwords</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Require special chars</p>
                                        </div>
                                        <Switch 
                                            checked={settings.requireSpecialChars}
                                            onCheckedChange={(checked) => setSettings({ ...settings, requireSpecialChars: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="system" className="space-y-6 animate-in fade-in duration-300">
                        {/* System Control */}
                        <Card className="rounded-lg shadow-sm border-destructive/20">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-destructive/10 flex items-center justify-center text-destructive">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">System Control</CardTitle>
                                        <CardDescription>Global system state and accessibility</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-6 bg-destructive/[0.03] rounded-md border border-destructive/10">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-destructive">Maintenance Mode</h4>
                                        <p className="text-sm text-muted-foreground">Locks system access for all non-admin authorized nodes</p>
                                    </div>
                                    <Switch 
                                        checked={settings.maintenanceMode}
                                        onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                        className="data-[state=checked]:bg-destructive"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Management */}
                        <Card className="rounded-lg shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold">Data Management</CardTitle>
                                        <CardDescription>System maintenance and audit logging</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-md border space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-9 h-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <ShieldAlert size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold uppercase leading-none">Export Audit Logs</span>
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Full Transaction Trace</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleExportLogs}
                                            disabled={isExporting}
                                            className="w-full h-11 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50 font-bold uppercase tracking-widest text-[10px]"
                                        >
                                            {isExporting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
                                            {isExporting ? 'Exporting...' : 'Download CSV Registry'}
                                        </Button>
                                    </div>
                                    <div className="p-6 rounded-md border space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-9 h-9 rounded-md bg-destructive/10 flex items-center justify-center text-destructive">
                                                <RefreshCw size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold uppercase leading-none">Clear System Cache</span>
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Purge Local Data</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleClearCache}
                                            disabled={isClearing}
                                            className="w-full h-11 border-destructive/20 text-destructive hover:bg-destructive/5 font-bold uppercase tracking-widest text-[10px]"
                                        >
                                            <Trash2 size={16} className={cn("mr-2", isClearing && "animate-bounce")} />
                                            {isClearing ? 'Clearing...' : 'Clear & Hard Reload'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
