"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
    Search,
    Phone,
    Building2,
    Info,
    PhoneOutgoing,
    PhoneIncoming,
    Globe,
    LayoutGrid,
    MapPin,
    Users,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Pencil,
    Loader2,
    X,
    Activity,
    Zap,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
    LayoutList,
    Share2,
    ExternalLink,
    FileDown,
    UploadCloud,
    Image as ImageIcon
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { trackActivity } from "../lib/auditLogger";
import { PhoneExtension, UserAccount } from "../types";
import { useLanguage } from "../translations";
import { UserAvatar } from "./UserAvatar";
import { StatCard } from "./StatCard";

/* ===========================
   Components
=========================== */

// 1. Instruction Panel
const InstructionPanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div
                className={`
          w-full bg-white dark:bg-slate-900 border transition-all duration-500 ease-in-out overflow-hidden
          ${isOpen ? 'rounded-[2rem] border-indigo-100 dark:border-indigo-500/20 shadow-2xl shadow-indigo-500/5' : 'rounded-2xl border-transparent bg-transparent'}
        `}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    className={`w-full flex items-center justify-between px-6 py-4 transition-all duration-300 rounded-2xl border ${!isOpen ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30' : 'border-transparent bg-slate-50/50 dark:bg-slate-800/50'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`
              p-2.5 rounded-xl transition-all duration-500 shadow-sm
              ${isOpen ? 'bg-indigo-600 text-white rotate-0' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 -rotate-12'}
            `}>
                            <Info className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <h3 className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${isOpen ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                Dialing Protocol
                            </h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Quick Reference Guide</p>
                        </div>
                    </div>
                    <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-white dark:bg-slate-900 text-indigo-600 rotate-180 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <ChevronDown className="w-4 h-4" strokeWidth={3} />
                    </div>
                </button>

                <div className={`
          grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
        `}>
                    <div className="overflow-hidden">
                        <div className="p-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 27th Floor Guide */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Building2 size={80} />
                                </div>
                                <h4 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                    Floor 27 - City Tower
                                </h4>
                                <div className="space-y-4 relative z-10">
                                    {[
                                        { label: 'Pickup Incoming', code: '#70 + Ext' },
                                        { label: 'Call to 26th Floor', code: '## + PIN + Ext lt.26' },
                                        { label: 'Outgoing Call', code: '* + PIN + 9 + PHONE NUMBER' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center group/item">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors">{item.label}</span>
                                            <kbd className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm group-hover/item:border-indigo-200 dark:group-hover/item:border-indigo-500/30 transition-all">{item.code}</kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 26th Floor Guide */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <MapPin size={80} />
                                </div>
                                <h4 className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Floor 26 - Gesit Resources
                                </h4>
                                <div className="space-y-4 relative z-10">
                                    {[
                                        { label: 'Pickup Incoming', code: '#41 + Ext' },
                                        { label: 'Call to 27th Floor', code: '88** + PIN + Ext lt.27' },
                                        { label: 'Outgoing Call', code: '81** + PIN + PHONE NUMBER' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center group/item">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">{item.label}</span>
                                            <kbd className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 shadow-sm group-hover/item:border-emerald-200 dark:group-hover/item:border-emerald-500/30 transition-all">{item.code}</kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. Extension Card
const ExtensionCard: React.FC<{
    ext: PhoneExtension;
    index: number;
    canEdit?: boolean;
    isAdmin?: boolean;
    isFocused?: boolean;
    onEdit?: (ext: PhoneExtension) => void;
    onDelete?: (id: number) => void;
}> = ({ ext, index, canEdit, isAdmin, isFocused, onEdit, onDelete }) => {
    const [copied, setCopied] = useState(false);
    const is27 = ext.floor === 27;

    const theme = is27 ? {
        border: 'border-slate-100 dark:border-slate-800',
        wrapper: 'hover:shadow-indigo-500/20',
        activeRing: 'ring-indigo-500/30',
        leftBg: 'bg-white dark:bg-slate-900',
        rightBg: 'group-hover:bg-indigo-600 bg-indigo-50 dark:bg-slate-800',
        rightText: 'text-indigo-600 dark:text-indigo-400 group-hover:text-white',
        badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
    } : {
        border: 'border-slate-100 dark:border-slate-800',
        wrapper: 'hover:shadow-emerald-500/20',
        activeRing: 'ring-emerald-500/30',
        leftBg: 'bg-white dark:bg-slate-900',
        rightBg: 'group-hover:bg-emerald-600 bg-emerald-50 dark:bg-slate-800',
        rightText: 'text-emerald-600 dark:text-emerald-400 group-hover:text-white',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(ext.ext);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const delay = Math.min(index * 30, 400);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay / 1000, duration: 0.3 }}
            className={`
                group relative flex w-full h-28 rounded-[1.5rem] overflow-hidden border transition-all duration-300
                hover:-translate-y-1 hover:shadow-2xl ${theme.wrapper} ${theme.border}
                ${isFocused ? `ring-2 ${theme.activeRing} shadow-lg` : 'shadow-sm'}
            `}
        >
            {/* Left Side: Info */}
            <div className={`flex-1 p-4 flex flex-col justify-between ${theme.leftBg} relative z-10`}>
                <div className="flex items-start gap-3">
                    <UserAvatar
                        name={ext.name}
                        url={ext.photo_url}
                        size="md"
                        className="shadow-sm ring-2 ring-white dark:ring-slate-800 shrink-0"
                    />
                    <div className="min-w-0 pr-1">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight mb-0.5" title={ext.name}>
                            {ext.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate leading-tight" title={ext.dept}>
                            {ext.dept}
                        </p>
                        {ext.role && (
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 italic truncate mt-0.5">
                                {ext.role}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${theme.badge}`}>
                        Floor {ext.floor}
                    </span>

                    {/* Admin Actions (Small, Bottom Left/Center) */}
                    {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button onClick={(e) => { e.stopPropagation(); onEdit?.(ext); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Pencil size={12} /></button>
                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete?.(ext.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Trash2 size={12} /></button>}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Extension Action Button */}
            <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                className={`
                    w-24 group/btn relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                    ${theme.rightBg} ${theme.rightText} border-l border-slate-100 dark:border-slate-800
                `}
                title="Click to copy"
            >
                <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5 group-hover/btn:text-white/80">
                        {copied ? 'Copied' : 'Ext'}
                    </span>
                    <span className="text-3xl font-black tracking-tighter transition-transform duration-300 group-hover/btn:scale-110 group-active/btn:scale-95">
                        {ext.ext}
                    </span>
                </div>

                {/* Background Icon Decoration */}
                <Phone className="absolute -bottom-4 -right-4 w-20 h-20 opacity-5 group-hover/btn:opacity-20 transition-opacity rotate-12" />

                {/* Copied Overlay Feedback */}
                <div className={`absolute inset-0 flex items-center justify-center bg-emerald-500 transition-all duration-300 ${copied ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <Check className="text-white w-8 h-8 animate-in zoom-in duration-300" strokeWidth={4} />
                </div>
            </button>
        </motion.div>
    );
};

// 3. Extension Table
const ExtensionTable: React.FC<{
    extensions: PhoneExtension[];
    canEdit?: boolean;
    isAdmin?: boolean;
    onEdit?: (ext: PhoneExtension) => void;
    onDelete?: (id: number) => void;
}> = ({ extensions, canEdit, isAdmin, onEdit, onDelete }) => {
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopy = (id: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="w-full overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-700">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center w-20">Identity</th>
                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Contact Details</th>
                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Extension Code</th>
                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Department</th>
                            <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Location</th>
                            {isAdmin && <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">PIN</th>}
                            {(canEdit || isAdmin) && <th className="px-6 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {extensions.map((ext) => (
                            <tr key={ext.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center">
                                        <UserAvatar
                                            name={ext.name}
                                            url={ext.photo_url}
                                            size="sm"
                                            className="ring-2 ring-white dark:ring-slate-800 shadow-sm group-hover:scale-110 transition-transform"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">{ext.name}</span>
                                        {ext.role && <span className="text-[10px] font-medium text-slate-400 italic mt-0.5">{ext.role}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => handleCopy(ext.id, ext.ext)}
                                        className="inline-flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-mono font-bold text-lg hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all active:scale-95 shadow-sm group/btn min-w-[100px] justify-center"
                                    >
                                        <span>{ext.ext}</span>
                                        {copiedId === ext.id ? <Check size={14} className="text-white" /> : <Copy size={14} className="opacity-0 group-hover/btn:opacity-50 transition-opacity" />}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                            {ext.dept}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm
                                        ${ext.floor === 27
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'}
                                    `}>
                                        Floor {ext.floor}
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono text-xs text-slate-400 dark:text-slate-600 select-all">
                                            {ext.pin || '---'}
                                        </span>
                                    </td>
                                )}
                                {(canEdit || isAdmin) && (
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex gap-1 opacity-20 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                            <button onClick={() => onEdit?.(ext)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"><Pencil size={14} /></button>
                                            {isAdmin && <button onClick={() => onDelete?.(ext.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"><Trash2 size={14} /></button>}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



// 5. Main Component
export const ExtensionDirectory = ({
    currentUser,
    variant = 'standalone',
    externalSearchTerm,
    externalFloorFilter
}: {
    currentUser?: UserAccount | null;
    variant?: 'standalone' | 'integrated';
    externalSearchTerm?: string;
    externalFloorFilter?: 'All' | 26 | 27;
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [floorFilter, setFloorFilter] = useState<'All' | 26 | 27>('All');
    const [extensions, setExtensions] = useState<PhoneExtension[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExt, setEditingExt] = useState<PhoneExtension | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // New state for upload status
    const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
        // Integrated variant (public) always uses grid, standalone uses table for admin
        if (variant === 'integrated') return 'grid';
        return currentUser?.role === 'Admin' ? 'table' : 'grid';
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== "undefined") {
            return document.documentElement.classList.contains("dark") ? "dark" : "light";
        }
        return "light";
    });

    const [formData, setFormData] = useState<Partial<PhoneExtension>>({
        name: '',
        dept: '',
        ext: '',
        floor: 27,
        role: '',
        pin: '',
        photo_url: ''
    });

    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canEdit = isAdmin || isStaff;
    const isPublic = !currentUser;

    // Use external search term if provided, otherwise use local state
    const activeSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : searchTerm;

    useEffect(() => {
        fetchExtensions();
    }, []);

    // Reset pagination when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, floorFilter]);

    const fetchExtensions = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('phone_extensions')
                .select('*')
                .order('name');

            if (error) throw error;
            setExtensions(data || []);
        } catch (error) {
            console.error('Error fetching extensions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleShare = () => {
        const url = window.location.origin + window.location.pathname + 'directory';
        navigator.clipboard.writeText(url);
        setIsSharing(true);
        setTimeout(() => setIsSharing(false), 2000);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingExt) {
                const { error } = await supabase
                    .from('phone_extensions')
                    .update({
                        name: formData.name,
                        dept: formData.dept,
                        ext: formData.ext,
                        floor: formData.floor,
                        role: formData.role,
                        pin: formData.pin,
                        photo_url: formData.photo_url
                    })
                    .eq('id', editingExt.id);
                if (error) throw error;
                await trackActivity(currentUser?.fullName || 'User', currentUser?.role || 'User', 'Update Extension', 'Extensions', `Updated extension ${formData.ext} for ${formData.name}`);
            } else {
                const { error } = await supabase
                    .from('phone_extensions')
                    .insert([formData]);
                if (error) throw error;
                await trackActivity(currentUser?.fullName || 'User', currentUser?.role || 'User', 'Create Extension', 'Extensions', `Created new extension ${formData.ext} for ${formData.name}`);
            }
            setIsModalOpen(false);
            fetchExtensions();
        } catch (error) {
            console.error('Error saving extension:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formDataUpload,
                }
            );

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setFormData({ ...formData, photo_url: data.secure_url });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again or use a URL.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this extension?')) return;
        try {
            const { error } = await supabase
                .from('phone_extensions')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await trackActivity(currentUser?.fullName || 'User', currentUser?.role || 'User', 'Delete Extension', 'Extensions', `Deleted extension with ID ${id}`);
            fetchExtensions();
        } catch (error) {
            console.error('Error deleting extension:', error);
        }
    };

    const openModal = (ext?: PhoneExtension) => {
        if (ext) {
            setEditingExt(ext);
            setFormData({
                name: ext.name,
                dept: ext.dept,
                ext: ext.ext,
                floor: ext.floor,
                role: ext.role,
                pin: ext.pin || '',
                photo_url: ext.photo_url || ''
            });
        } else {
            setEditingExt(null);
            setFormData({
                name: '',
                dept: '',
                ext: '',
                floor: 27,
                role: '',
                pin: '',
                photo_url: ''
            });
        }
        setIsModalOpen(true);
    };

    const seedData = async () => {
        if (!confirm('This will seed initial data. Continue?')) return;
        const INITIAL_DATA = [
            { name: "JSB", dept: "Board of Commissioners", ext: "101", floor: 27 },
            { name: "JSC", dept: "Board of Commissioners", ext: "102", floor: 27 },
            { name: "MSA", dept: "Board of Commissioners", ext: "103", floor: 27 },
            { name: "MSB", dept: "Board of Commissioners", ext: "104", floor: 27 },
            { name: "MSC", dept: "Board of Commissioners", ext: "105", floor: 27 },
            { name: "MSD", dept: "Board of Commissioners", ext: "106", floor: 27 },
            { name: "MSA Bed Room", dept: "Board of Commissioners", ext: "107", floor: 27 },
            { name: "Jones", dept: "Deputy CEO & President", ext: "502", floor: 27 },
            { name: "Asma", dept: "PA & Secretary", ext: "111", floor: 27 },
            { name: "Intan", dept: "PA & Secretary", ext: "112", floor: 27 },
            { name: "Dinny", dept: "PA & Secretary", ext: "113", floor: 27 },
            { name: "Ety", dept: "PA & Secretary", ext: "188", floor: 27 },
            { name: "Dwi", dept: "PA & Secretary", ext: "511", floor: 27 },
            { name: "Peng Tjoan", dept: "Corporate Affair", ext: "130", floor: 27 },
            { name: "Thomas", dept: "Corporate Affair", ext: "131", floor: 27 },
            { name: "Yudha", dept: "Corporate Affair", ext: "181", floor: 27 },
            { name: "Ruby", dept: "Corporate Affair", ext: "182", floor: 27 },
            { name: "Natalia", dept: "Corporate Secretary", ext: "140", floor: 27 },
            { name: "Yohan", dept: "Corporate Secretary", ext: "141", floor: 27 },
            { name: "Sylvia", dept: "Corporate Secretary", ext: "142", floor: 27 },
            { name: "Desi", dept: "Corporate Secretary", ext: "143", floor: 27 },
            { name: "Nancy", dept: "Corporate Secretary", ext: "152", floor: 27 },
            { name: "Nike", dept: "Corporate Secretary", ext: "504", floor: 27 },
            { name: "Yayan", dept: "Finance & Accounting", ext: "120", floor: 27 },
            { name: "Maradona", dept: "Finance & Accounting", ext: "154", floor: 27 },
            { name: "Vanesha", dept: "Finance & Accounting", ext: "161", floor: 27 },
            { name: "Stephanie Y.", dept: "Finance & Accounting", ext: "167", floor: 27 },
            { name: "Merly", dept: "Finance & Accounting", ext: "122", floor: 27 },
            { name: "Lisi", dept: "Finance & Accounting", ext: "163", floor: 27 },
            { name: "Parawinata", dept: "Finance & Accounting", ext: "170", floor: 27 },
            { name: "Novitasari", dept: "Finance & Accounting", ext: "171", floor: 27 },
            { name: "Mian", dept: "Finance & Accounting", ext: "169", floor: 27 },
            { name: "Evi", dept: "Finance & Accounting", ext: "168", floor: 27 },
            { name: "Rama", dept: "Finance & Accounting", ext: "172", floor: 27 },
            { name: "Winarti", dept: "Finance & Accounting", ext: "173", floor: 27 },
            { name: "Javier", dept: "HR & Logistic", ext: "195", floor: 27 },
            { name: "Sarah", dept: "HR & Logistic", ext: "115", floor: 27, role: "Sec. to Javier" },
            { name: "Rara", dept: "HR & Logistic", ext: "198", floor: 27 },
            { name: "Resti", dept: "HR & Logistic", ext: "185", floor: 27, role: "HR" },
            { name: "Nisa", dept: "HR & Logistic", ext: "187", floor: 27, role: "HR" },
            { name: "Bendry", dept: "HR & Logistic", ext: "197", floor: 27, role: "IT" },
            { name: "Rudi", dept: "HR & Logistic", ext: "196", floor: 27, role: "IT" },
            { name: "Noni", dept: "HR & Logistic", ext: "191", floor: 27, role: "GA" },
            { name: "Suryadi", dept: "HR & Logistic", ext: "189", floor: 27, role: "GA" },
            { name: "Susilo", dept: "HR & Logistic", ext: "162", floor: 27, role: "GA" },
            { name: "Jave", dept: "Business Development", ext: "201", floor: 27 },
            { name: "Corinna", dept: "Business Development", ext: "302", floor: 27 },
            { name: "Greg", dept: "Business Development", ext: "205", floor: 27 },
            { name: "Stefanini", dept: "Business Development", ext: "203", floor: 27 },
            { name: "Eliaanti", dept: "Business Development", ext: "204", floor: 27 },
            { name: "Donny T.", dept: "Business Development", ext: "202", floor: 27 },
            { name: "Petrus", dept: "Business Development", ext: "206", floor: 27 },
            { name: "Neysa", dept: "Business Development", ext: "207", floor: 27 },
            { name: "Katherine", dept: "Business Development", ext: "208", floor: 27 },
            { name: "Artika", dept: "Financial Investment", ext: "114", floor: 27, role: "Sec. to Jave" },
            { name: "Ita", dept: "Financial Investment", ext: "305", floor: 27 },
            { name: "Suryadi Hertanto", dept: "Trading", ext: "301", floor: 27 },
            { name: "Hilaluddin", dept: "Trading", ext: "303", floor: 27 },
            { name: "Harvey", dept: "Trading", ext: "304", floor: 27 },
            { name: "Ayu", dept: "Trading", ext: "306", floor: 27 },
            { name: "Kevin", dept: "Gesit Foundation", ext: "192", floor: 27 },
            { name: "Yuni", dept: "Gesit Foundation", ext: "186", floor: 27 },
            { name: "Widya", dept: "Receptionist", ext: "180/0", floor: 27 },
            { name: "Board Room 1", dept: "Common Areas", ext: "800", floor: 27 },
            { name: "Board Room 2", dept: "Common Areas", ext: "801", floor: 27 },
            { name: "Conference Room", dept: "Common Areas", ext: "802", floor: 27 },
            { name: "Meeting Room (Lobby)", dept: "Common Areas", ext: "803", floor: 27 },
            { name: "Sofa Room", dept: "Common Areas", ext: "805", floor: 27 },
            { name: "Pantry", dept: "Common Areas", ext: "190", floor: 27 },
            { name: "Fendra", dept: "Vice President", ext: "211", floor: 26 },
            { name: "Budhi", dept: "Vice President", ext: "210", floor: 26 },
            { name: "Husni", dept: "Vice President", ext: "212", floor: 26 },
            { name: "Yudha", dept: "Vice President", ext: "209", floor: 26 },
            { name: "Dwi", dept: "Office Management", ext: "213", floor: 26 },
            { name: "Dimas", dept: "Office Management", ext: "232", floor: 26 },
            { name: "Rahmat Hidayat", dept: "Permit & License", ext: "236", floor: 26 },
            { name: "Novita Sitorus", dept: "Permit & License", ext: "240", floor: 26 },
            { name: "Afif", dept: "Finance & Accounting", ext: "228", floor: 26 },
            { name: "Said", dept: "Finance & Accounting", ext: "226", floor: 26 },
            { name: "Yusup", dept: "Procurement", ext: "223", floor: 26 },
            { name: "Puji", dept: "Information Technology", ext: "232", floor: 26 },
            { name: "Tunggul", dept: "Engineering", ext: "215", floor: 26 },
            { name: "Lydia", dept: "Project", ext: "220", floor: 26 },
            { name: "Juni", dept: "HRGA", ext: "232", floor: 26 },
            { name: "Receptionist", dept: "Front Desk", ext: "200", floor: 26 }
        ];

        try {
            const { error } = await supabase.from('phone_extensions').insert(INITIAL_DATA);
            if (error) throw error;
            alert('Data seeded successfully!');
            fetchExtensions();
        } catch (error) {
            console.error('Error seeding data:', error);
            alert('Error seeding data. Check console.');
        }
    };

    const filteredExtensions = useMemo(() => {
        return extensions.filter((item) => {
            const activeFloorFilter = externalFloorFilter !== undefined ? externalFloorFilter : floorFilter;
            if (activeFloorFilter !== 'All' && item.floor !== activeFloorFilter) return false;

            const searchLower = activeSearchTerm.toLowerCase().trim();
            if (!searchLower) return true;

            const nameMatch = (item.name || "").toLowerCase().includes(searchLower);
            const deptMatch = (item.dept || "").toLowerCase().includes(searchLower);
            const extMatch = (item.ext || "").toLowerCase().includes(searchLower);
            const roleMatch = item.role ? item.role.toLowerCase().includes(searchLower) : false;

            return nameMatch || deptMatch || extMatch || roleMatch;
        }).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [extensions, activeSearchTerm, floorFilter, externalFloorFilter]);

    const totalPages = Math.ceil(filteredExtensions.length / itemsPerPage);
    const paginatedExtensions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredExtensions.slice(start, start + itemsPerPage);
    }, [filteredExtensions, currentPage, itemsPerPage]);

    const stats = useMemo(() => {
        return {
            total: extensions.length,
            floor27: extensions.filter(e => e.floor === 27).length,
            floor26: extensions.filter(e => e.floor === 26).length
        };
    }, [extensions]);

    const handleExportExcel = () => {
        try {
            const exportData = extensions.map(ext => ({
                'Name': ext.name,
                'Extension': ext.ext,
                'Floor': `${ext.floor}th Floor`,
                'Department': ext.dept,
                'Role': ext.role || '-'
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Extensions");
            XLSX.writeFile(wb, "DIRECTORY_EXTENSIONS.xlsx");

            if (currentUser) {
                trackActivity(
                    currentUser.fullName,
                    currentUser.role,
                    'Export Excel',
                    'Directory',
                    `Exported ${extensions.length} extensions to Excel`
                );
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Please try again.");
        }
    };

    return (
        <div className="flex flex-col pb-10 font-sans animate-in fade-in duration-700">
            {/* Dashboard Header (Admin/Standalone) */}
            {variant === 'standalone' && (
                <div className="mb-10 pt-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 px-2">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                                Directory <span style={{ color: 'var(--primary)' }}>Extensions</span>
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">The City Tower & Infrastructure Registry</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-emerald-500/20 active:scale-95 group"
                                onClick={handleExportExcel}
                            >
                                <FileDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                Export Excel
                            </button>
                            {canEdit && (
                                <button
                                    onClick={() => openModal()}
                                    className="flex items-center gap-2 px-6 py-3 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group"
                                    style={{ backgroundColor: 'var(--primary)', boxShadow: '0 10px 20px -10px var(--primary)' }}
                                >
                                    <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                    Add Extension
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            label="Total Extensions"
                            value={stats.total}
                            icon={Users}
                            colorClass="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-500/20"
                            subtext="Active Infrastructure Nodes"
                        />
                        <StatCard
                            label="27th Floor"
                            value={stats.floor27}
                            icon={Building2}
                            colorClass="bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-500/20"
                            subtext="City Tower Upper Deck"
                        />
                        <StatCard
                            label="26th Floor"
                            value={stats.floor26}
                            icon={MapPin}
                            colorClass="bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-500/20"
                            subtext="Infrastructure Base"
                        />
                    </div>
                </div>
            )}


            <InstructionPanel />

            {/* List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-600" />
                    <h2 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        Directory Registry
                    </h2>
                </div>

                <div className="flex items-center gap-4 flex-1 md:flex-initial bg-white dark:bg-slate-900 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    {/* Search Bar */}
                    {variant === 'standalone' && (
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search extensions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-200 transition-all outline-none"
                            />
                        </div>
                    )}

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    {/* View Mode Toggle */}
                    <div className="flex gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'grid'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'table'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            title="Table View"
                        >
                            <LayoutList size={18} />
                        </button>
                    </div>
                </div>

                {/* Pagination Controls */}
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {filteredExtensions.length} Active
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 min-w-[30px] text-center">
                            {currentPage}/{totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/30 rounded-2xl animate-pulse border border-slate-200/50 dark:border-slate-800"></div>
                    ))}
                </div>
            ) : filteredExtensions.length > 0 ? (
                <AnimatePresence mode="wait">
                    {viewMode === 'grid' ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {paginatedExtensions.map((ext, index) => (
                                <ExtensionCard
                                    key={`${ext.id}-${ext.ext}`}
                                    ext={ext}
                                    index={index}
                                    isAdmin={isAdmin}
                                    canEdit={canEdit}
                                    isFocused={searchTerm.length > 0}
                                    onEdit={openModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        >
                            <ExtensionTable
                                extensions={paginatedExtensions}
                                isAdmin={isAdmin}
                                canEdit={canEdit}
                                onEdit={openModal}
                                onDelete={handleDelete}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
                >
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                        <Search size={40} className="text-slate-300 dark:text-slate-700 mx-auto" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No Extension Found</h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Verify the search name or extension number</p>
                    </div>
                </motion.div>
            )}

            {/* Admin Migration Hint */}
            {isAdmin && extensions.length === 0 && !isLoading && (
                <div className="mt-12 p-8 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900/40 border-2 border-amber-100/50 dark:border-amber-500/20 rounded-[2.5rem] text-center animate-in fade-in zoom-in duration-700 shadow-xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/30 animate-bounce">
                            <Zap size={24} aria-hidden="true" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">System Initialization Required</h4>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-bold">No records found. Sync with provided TGC parameters?</p>
                        </div>
                        <button
                            onClick={seedData}
                            className="mt-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/30 active:scale-95"
                        >
                            Sync Data Environment
                        </button>
                    </div>
                </div>
            )}

            {/* Admin Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                                    {editingExt ? <Pencil size={18} /> : <Plus size={18} />}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {editingExt ? 'Edit Record' : 'Create Record'}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} aria-label="Close modal" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            <div>
                                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Identity Name</label>
                                <input
                                    required
                                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-700/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    value={formData.name}
                                    placeholder="Full name..."
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Photo Upload Section */}
                            <div>
                                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Profile Photo</label>
                                <div className="flex gap-4 items-start">
                                    <div className="relative group shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                            {formData.photo_url ? (
                                                <img
                                                    src={formData.photo_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="text-slate-400" size={24} />
                                            )}
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader2 className="animate-spin text-white" size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="photo-upload"
                                                disabled={isUploading}
                                            />
                                            <label
                                                htmlFor="photo-upload"
                                                className={`
                                                    flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer
                                                    ${isUploading
                                                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                                        : 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:hover:bg-indigo-500/20 dark:text-indigo-400'}
                                                `}
                                            >
                                                <UploadCloud size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {isUploading ? 'Uploading...' : 'Upload Image'}
                                                </span>
                                            </label>
                                        </div>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white dark:bg-slate-900 px-2 text-[9px] font-bold text-slate-400">Or use URL</span>
                                            </div>
                                        </div>

                                        <input
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-700/50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.photo_url || ''}
                                            placeholder="https://..."
                                            onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Extension Code</label>
                                    <input
                                        required
                                        className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                        value={formData.ext}
                                        placeholder="Ext"
                                        onChange={e => setFormData({ ...formData, ext: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Floor Level</label>
                                    <select
                                        className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                        value={formData.floor}
                                        onChange={e => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                                    >
                                        <option value={26}>26th Floor</option>
                                        <option value={27}>27th Floor</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Departmental Cluster</label>
                                <input
                                    required
                                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    value={formData.dept}
                                    placeholder="Cluster..."
                                    onChange={e => setFormData({ ...formData, dept: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Role Designation</label>
                                <input
                                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Pin Code</label>
                                <input
                                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner font-mono"
                                    value={formData.pin}
                                    placeholder="Enter pin..."
                                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-4 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    {editingExt ? 'Save Changes' : 'Create Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Theme Toggle and Back Button (Public Only) */}
            {
                isPublic && (
                    <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                        <button
                            onClick={toggleTheme}
                            aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
                            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-all hover:scale-110 active:scale-90 group"
                        >
                            {theme === 'light' ? <Moon size={24} className="group-hover:rotate-12 transition-transform" /> : <Sun size={24} className="group-hover:rotate-90 transition-transform" />}
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            aria-label="Back to Portal"
                            className="w-14 h-14 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all hover:scale-110 active:scale-90 group"
                            title="Back to Portal"
                        >
                            <ExternalLink size={24} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                )
            }
        </div >
    );
};
