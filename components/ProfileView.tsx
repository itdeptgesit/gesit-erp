'use client';

import React, { useState, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Shield, Key, Save,
    LogOut, Lock, Building2, Loader2, CheckCircle2,
    Briefcase, ShieldCheck, Globe, Camera, Edit3, X,
    Calendar, Trash2, Bell, Settings
} from 'lucide-react';
import { UserAccount } from '../types';
import { supabase } from '../lib/supabaseClient';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useLanguage } from '../translations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileViewProps {
    onLogout: () => void;
    user: UserAccount | null;
    onUpdateSuccess?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout, user, onUpdateSuccess }) => {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // State form
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        company: '',
        department: '',
        jobTitle: ''
    });

    const [avatarUrl, setAvatarUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [companyList, setCompanyList] = useState<{ id: number, name: string }[]>([]);
    const [departmentList, setDepartmentList] = useState<{ name: string }[]>([]);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Real Session Info State
    const [sessionInfo, setSessionInfo] = useState({
        device: 'Desktop',
        browser: 'Chrome',
        ip: '0.0.0.0',
        lastUpdated: ''
    });

    // Detect Current Session Metadata
    useEffect(() => {
        const detectSession = async () => {
            // IP Detection
            try {
                const response = await fetch('https://api.ipify.org?format=json');
                const data = await response.json();
                setSessionInfo(prev => ({ ...prev, ip: data.ip }));
            } catch (err) {
                setSessionInfo(prev => ({ ...prev, ip: '127.0.0.1' }));
            }

            // OS/Browser Detection
            const ua = navigator.userAgent;
            let device = "Windows PC";
            if (ua.includes("Mac OS X")) device = "Macintosh (macOS)";
            else if (ua.includes("iPhone")) device = "iPhone (iOS)";
            else if (ua.includes("Android")) device = "Smartphone (Android)";
            else if (ua.includes("Linux")) device = "Linux PC";

            let browser = "Chrome";
            if (ua.includes("Firefox")) browser = "Firefox";
            else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
            else if (ua.includes("Edg")) browser = "Edge";

            setSessionInfo(prev => ({
                ...prev,
                device,
                browser,
                lastUpdated: new Date().toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                })
            }));
        };
        detectSession();
    }, []);

    // Sinkronisasi data saat user prop berubah atau mode edit aktif
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                phone: user.phone || '',
                address: user.address || '',
                company: user.company || '',
                department: user.department || '',
                jobTitle: user.jobTitle || ''
            });
            setAvatarUrl(user.avatarUrl || '');
        }

        const fetchMasterData = async () => {
            try {
                const { data: companies } = await supabase.from('companies').select('id, name').order('name');
                if (companies) setCompanyList(companies);

                const { data: depts } = await supabase.from('departments').select('name').order('name');
                if (depts) setDepartmentList(depts);
            } catch (err) {
                console.error("Error fetching master data:", err);
            }
        };
        fetchMasterData();
    }, [user]);

    const userInitial = (formData.fullName || 'US').substring(0, 2).toUpperCase();
    const userRole = user?.role || 'Staff';
    const userEmail = user?.email || 'No Email';

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage(null);

        try {
            const { error } = await supabase
                .from('user_accounts')
                .update({
                    full_name: formData.fullName,
                    phone: formData.phone,
                    address: formData.address,
                    company: formData.company,
                    department: formData.department,
                    job_title: formData.jobTitle,
                    avatar_url: avatarUrl
                })
                .eq('id', user.id);

            if (error) throw error;

            setSaveMessage({ text: t('profileUpdated'), type: 'success' });
            setIsEditing(false);

            // Meminta App.tsx menyegarkan data currentUser
            if (onUpdateSuccess) onUpdateSuccess();

            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error: any) {
            console.error("Save error:", error);
            setSaveMessage({ text: t('profileUpdateFailed'), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        const cloudName = 'dmr8bxdos';
        const uploadPreset = 'gesit_erp_preset';

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: uploadData
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error?.message || 'Upload failed');

            if (data.secure_url) {
                setAvatarUrl(data.secure_url);

                await supabase
                    .from('user_accounts')
                    .update({ avatar_url: data.secure_url })
                    .eq('id', user.id);

                if (onUpdateSuccess) onUpdateSuccess();
                setSaveMessage({ text: 'Photo updated successfully', type: 'success' });
                setTimeout(() => setSaveMessage(null), 3000);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            setSaveMessage({ text: 'Upload failed', type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 font-sans">
            {/* 1. Header Card - Direct from Image */}
            <Card className="rounded-3xl border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-slate-900 overflow-hidden mb-6">
                <div className="p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    {/* Avatar with Camera Icon Overlay */}
                    <div className="relative group flex-shrink-0">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-lg relative bg-slate-100 dark:bg-slate-800">
                            <Avatar className="w-full h-full rounded-none">
                                <AvatarImage src={avatarUrl} className="object-cover" />
                                <AvatarFallback className="text-4xl font-black bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 capitalize">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-1 right-1 w-9 h-9 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center cursor-pointer shadow-md border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all z-10">
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                            <Camera size={16} className="text-slate-600 dark:text-white" />
                        </label>
                    </div>

                    {/* Identity Information */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none capitalize">
                                {formData.fullName || 'User Profile'}
                            </h1>
                            {userRole && (
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-3 py-1 font-bold text-[10px] rounded-lg">
                                    {userRole} Member
                                </Badge>
                            )}
                        </div>

                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            {formData.jobTitle || 'N/A Level Personnel'}
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <Mail size={16} className="text-slate-400" />
                                <span>{userEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-slate-400" />
                                <span>{formData.address || 'San Francisco, CA'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-slate-400" />
                                <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Edit Profile Button */}
                    <div className="flex-shrink-0">
                        <Button
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-8 py-6 rounded-xl font-bold transition-all shadow-sm"
                        >
                            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* 2. Custom Tabs - Direct from Image */}
            <Tabs defaultValue="account" className="w-full">
                <div className="bg-slate-100/80 dark:bg-white/5 p-1.5 rounded-2xl mb-8 flex justify-center">
                    <TabsList className="bg-transparent h-12 gap-2 w-full max-w-2xl px-1.5">
                        <TabsTrigger value="personal" className="rounded-xl flex-1 font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-8">Personal</TabsTrigger>
                        <TabsTrigger value="account" className="rounded-xl flex-1 font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-8">Account</TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl flex-1 font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-8">Security</TabsTrigger>
                        <TabsTrigger value="notifications" className="rounded-xl flex-1 font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-8">Notifications</TabsTrigger>
                    </TabsList>
                </div>

                {/* Account Tab Content - Primary Focus from Image */}
                <TabsContent value="account">
                    <Card className="rounded-3xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="p-8 sm:p-12 space-y-12">
                            {/* Section: Header */}
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Account Settings</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account preferences and security.</p>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            {/* Section: Account Status */}
                            <div className="flex items-center justify-between group">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Account Status</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Your account is currently active</p>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-none px-4 py-1.5 font-bold rounded-lg shadow-none">
                                    Active
                                </Badge>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            {/* Section: Account Visibility */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Account Visibility</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Make your profile visible to other users</p>
                                </div>
                                <Switch defaultChecked className="data-[state=checked]:bg-slate-900 dark:data-[state=checked]:bg-blue-600" />
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            {/* Section: Data Export */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Data Export</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Download a copy of your data</p>
                                </div>
                                <Button variant="outline" className="rounded-xl font-bold h-12 px-8 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5">
                                    Export Data
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Danger Zone Card */}
                    <Card className="mt-8 rounded-3xl border-rose-100 dark:border-rose-900/30 bg-white dark:bg-slate-900 overflow-hidden shadow-sm border">
                        <div className="p-8 sm:p-12 space-y-8">
                            <div>
                                <h3 className="text-xl font-bold text-rose-600 mb-1">Danger Zone</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Irreversible and destructive actions</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="space-y-1 text-center sm:text-left">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Delete Account</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Permanently delete your account and all data</p>
                                </div>
                                <Button variant="destructive" className="rounded-xl font-bold h-14 px-8 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-rose-900/10 flex items-center gap-2">
                                    <Trash2 size={18} /> Delete Account
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Personal Tab - Adapting previous fields into new UI style */}
                <TabsContent value="personal">
                    <Card className="rounded-3xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="p-8 sm:p-12 space-y-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Personal Details</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Update your identity and contact information.</p>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Full Name</Label>
                                    <Input
                                        value={formData.fullName}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="h-14 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 font-bold focus:ring-slate-900 focus:ring-offset-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Phone Terminal</Label>
                                    <Input
                                        value={formData.phone}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="h-14 rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 font-bold"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Worksite Address</Label>
                                    <Textarea
                                        value={formData.address}
                                        disabled={!isEditing}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="rounded-xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 py-4 font-bold min-h-[120px]"
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 dark:bg-blue-600 text-white px-10 h-14 rounded-xl font-bold flex items-center gap-2">
                                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Save Information
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card className="rounded-3xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="p-8 sm:p-12 space-y-10">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Security Protocols</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your passcode and accessibility keys.</p>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Change Passcode</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Update your security key for system access</p>
                                </div>
                                <Button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    variant="outline"
                                    className="rounded-xl font-bold h-14 px-8 border-slate-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-600 transition-all flex items-center gap-2"
                                >
                                    <Lock size={18} /> Update Key
                                </Button>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Session Control</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">Sign out from all active terminals</p>
                                </div>
                                <Button
                                    onClick={onLogout}
                                    variant="ghost"
                                    className="rounded-xl font-bold h-14 px-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-2"
                                >
                                    <LogOut size={18} /> Terminate All Sessions
                                </Button>
                            </div>

                            <Separator className="bg-slate-100 dark:bg-white/5" />

                            {/* Section: Active Sessions / Login Devices - Updated to Match Provided Image Style */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">Active Sessions</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs text-opacity-70 font-medium">Manage and secure your active login sessions across devices.</p>
                                </div>

                                <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-white/5 border-b-0">
                                            <TableRow className="hover:bg-transparent border-b">
                                                <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-1/4">Device</TableHead>
                                                <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">IP Address</TableHead>
                                                <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Updated</TableHead>
                                                <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Application</TableHead>
                                                <TableHead className="py-4 px-6 text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Real Session Row - Current Device */}
                                            <TableRow className="border-b border-slate-100/50 dark:border-white/5 bg-blue-50/20 dark:bg-blue-600/5 hover:bg-blue-50/30 dark:hover:bg-blue-600/10 transition-colors">
                                                <TableCell className="py-6 px-6">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{sessionInfo.device}</span>
                                                            <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm">Current</Badge>
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-medium">{sessionInfo.browser}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-6 font-medium text-slate-600 dark:text-slate-400 text-sm">{sessionInfo.ip}</TableCell>
                                                <TableCell className="py-6 px-6 font-medium text-slate-600 dark:text-slate-400 text-sm">{sessionInfo.lastUpdated}</TableCell>
                                                <TableCell className="py-6 px-6 font-medium text-slate-600 dark:text-slate-400 text-sm">GESIT WORK</TableCell>
                                                <TableCell className="py-6 px-6 text-right">
                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                                        Active Now
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="rounded-3xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="p-8 sm:p-12 space-y-10 text-center py-20">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Notification Configurer</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">This module is currently initializing. Alert synchronization preferences will be available shortly.</p>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </div>
    );
};
