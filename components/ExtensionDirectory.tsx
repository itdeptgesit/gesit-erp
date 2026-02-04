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
    ExternalLink
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { trackActivity } from "../lib/auditLogger";
import { PhoneExtension, UserAccount } from "../types";
import { useLanguage } from "../translations";

/* ===========================
   Components
=========================== */

// 1. Instruction Panel
const InstructionPanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div
                className={`
          w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border transition-all duration-500 ease-in-out
          ${isOpen ? 'border-indigo-200/50 dark:border-indigo-500/30 shadow-2xl shadow-indigo-500/10' : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm'}
        `}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Close dial instructions" : "View dial instructions"}
                    className="w-full flex items-center justify-between px-6 py-4 bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-300 rounded-2xl"
                >
                    <div className="flex items-center gap-4">
                        <div className={`
              p-2 rounded-xl transition-all duration-500
              ${isOpen ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
            `}>
                            <Info className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <h3 className={`text-sm font-bold transition-colors duration-300 tracking-tight ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            How to Dial
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {isOpen ? 'Close' : 'View'}
                        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                </button>

                <div className={`
          grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
        `}>
                    <div className="overflow-hidden">
                        <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 27th Floor Guide (TGC) */}
                            <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">Floor 27 - The City Tower (TGC)</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Pickup Incoming</span>
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">#70</kbd>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Call to 26th Floor</span>
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px) font-mono font-bold">## + Ext lt. 26</kbd>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/20">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Outgoing Call</span>
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">* + PIN + 9 + Ph#</kbd>
                                    </div>
                                </div>
                            </div>
                            {/* 26th Floor Guide (Gesit Resources) */}
                            <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">Floor 26 - Gesit Resources</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Pickup Incoming</span>
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">#41 + Ext</kbd>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Call to 27th Floor</span>
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">88** + PIN + Ext lt.27</kbd>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/20">
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Outgoing Call</span>
                                        <kbd className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">81** + PIN + Ph#</kbd>
                                    </div>
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
        border: 'border-slate-100 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50',
        dot: 'bg-indigo-500',
        badge: 'bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        focus: 'ring-4 ring-indigo-500/20 scale-[1.03] shadow-2xl shadow-indigo-500/10'
    } : {
        border: 'border-slate-100 dark:border-slate-800 hover:border-emerald-400/50 dark:hover:border-emerald-500/50',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        focus: 'ring-4 ring-emerald-500/20 scale-[1.03] shadow-2xl shadow-emerald-500/10'
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(ext.ext);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const delay = Math.min(index * 20, 300);

    return (
        <div
            className={`
        group relative bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl p-5 border ${theme.border}
        transition-all duration-500 ease-out hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-indigo-500/5
        animate-in fade-in slide-in-from-bottom-2 duration-500
        ${isFocused ? theme.focus : ''}
      `}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
                        {ext.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{ext.dept}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        aria-label={`Copy extension ${ext.ext}`}
                        className={`px-3 py-1.5 rounded-xl text-2xl font-mono font-black transition-all ${theme.badge} border border-transparent hover:border-current/20 active:scale-95 flex items-center gap-2`}
                    >
                        <span>{ext.ext}</span>
                        {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5 opacity-30" aria-hidden="true" />}
                    </button>
                    {canEdit && (
                        <div className="flex gap-1">
                            <button onClick={() => onEdit?.(ext)} aria-label="Edit extension" className="p-1.5 text-slate-400 hover:text-indigo-500 transition-colors"><Pencil size={12} /></button>
                            {isAdmin && <button onClick={() => onDelete?.(ext.id)} aria-label="Delete extension" className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>}
                        </div>
                    )}
                </div>
            </div>

            {ext.role && (
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic mb-4 line-clamp-1">{ext.role}</p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{ext.floor} Floor</span>
                </div>
                <div className="text-slate-200 dark:text-slate-700 group-hover:text-indigo-500/10 transition-colors">
                    <Phone size={12} />
                </div>
            </div>
        </div>
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
        <div className="w-full overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl lg:col-span-3 xl:col-span-4 animate-in fade-in duration-500">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center w-20">Initial</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Identify Name</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Extension</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Department Cluster</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Floor Level</th>
                            {isAdmin && <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">PIN</th>}
                            {isAdmin && <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {extensions.map((ext) => (
                            <tr key={ext.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-8 py-4">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm
                                        bg-gradient-to-br ${ext.floor === 27 ? 'from-indigo-500 to-indigo-700' : 'from-emerald-500 to-emerald-700'}
                                    `}>
                                        {ext.name.charAt(0).toUpperCase()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{ext.name}</span>
                                        {ext.role && <span className="text-[10px] font-medium text-slate-500 italic dark:text-slate-400">{ext.role}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleCopy(ext.id, ext.ext)}
                                        aria-label={`Copy extension ${ext.ext}`}
                                        className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-black text-2xl hover:shadow-md transition-all active:scale-95"
                                    >
                                        {ext.ext}
                                        {copiedId === ext.id ? <Check size={16} className="text-emerald-500" aria-hidden="true" /> : <Copy size={16} className="opacity-40" aria-hidden="true" />}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-slate-500" />
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{ext.dept}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-tight
                                        ${ext.floor === 27
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
                                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'}
                                    `}>
                                        {ext.floor}th Floor
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit border border-slate-200 dark:border-slate-700">
                                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                                                {ext.pin || '-'}
                                            </span>
                                        </div>
                                    </td>
                                )}
                                {canEdit && (
                                    <td className="px-8 py-4">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit?.(ext)}
                                                aria-label="Edit extension"
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => onDelete?.(ext.id)}
                                                    aria-label="Delete extension"
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
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

// 4. Main Component
export const ExtensionDirectory = ({ currentUser }: { currentUser?: UserAccount | null }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [floorFilter, setFloorFilter] = useState<'All' | 26 | 27>('All');
    const [extensions, setExtensions] = useState<PhoneExtension[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExt, setEditingExt] = useState<PhoneExtension | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
        // Default to table for admin, grid for public
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
        pin: ''
    });

    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canEdit = isAdmin || isStaff;
    const isPublic = !currentUser;

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
                        pin: formData.pin
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
                pin: ext.pin || ''
            });
        } else {
            setEditingExt(null);
            setFormData({
                name: '',
                dept: '',
                ext: '',
                floor: 27,
                role: '',
                pin: ''
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
            if (floorFilter !== 'All' && item.floor !== floorFilter) return false;
            const searchLower = searchTerm.toLowerCase();
            return (
                item.name.toLowerCase().includes(searchLower) ||
                item.dept.toLowerCase().includes(searchLower) ||
                item.ext.includes(searchLower) ||
                (item.role && item.role.toLowerCase().includes(searchLower))
            );
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [extensions, searchTerm, floorFilter]);

    const totalPages = Math.ceil(filteredExtensions.length / itemsPerPage);
    const paginatedExtensions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredExtensions.slice(start, start + itemsPerPage);
    }, [filteredExtensions, currentPage, itemsPerPage]);

    return (
        <div className="flex flex-col pb-10 font-sans animate-in fade-in duration-700">
            {/* Minimalist Dashboard Header */}
            <div className="relative mb-8 p-4 md:p-6 lg:p-8 rounded-3xl overflow-hidden bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Brand Info */}
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                TGC Directory
                            </h1>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Internal Grid</p>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:max-w-2xl">
                        {/* Search Bar */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="Search extensions..."
                                aria-label="Search phone extensions"
                                className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/50 outline-none transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter & Actions */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex p-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                                {(['All', 27, 26] as const).map((floor) => (
                                    <button
                                        key={floor}
                                        onClick={() => setFloorFilter(floor)}
                                        aria-pressed={floorFilter === floor}
                                        aria-label={`Filter by ${floor === 'All' ? 'all' : floor + 'th'} floor`}
                                        className={`
                                            px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all
                                            ${floorFilter === floor
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
                                        `}
                                    >
                                        {floor === 'All' ? 'All' : `${floor}F`}
                                    </button>
                                ))}
                            </div>

                            {!isPublic && canEdit && (
                                <button
                                    onClick={() => openModal()}
                                    aria-label="Add new extension"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Plus size={18} />
                                </button>
                            )}

                            {isPublic ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleShare}
                                        aria-label="Share directory link"
                                        className="p-2.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-500 hover:text-indigo-500 transition-all shadow-sm group/share"
                                        title="Share"
                                    >
                                        {isSharing ? <Check size={18} className="text-emerald-500" aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
                                    </button>
                                    <button
                                        onClick={toggleTheme}
                                        aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
                                        className="p-2.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-500 hover:text-indigo-500 transition-all shadow-sm group/theme"
                                        title="Toggle Mode"
                                    >
                                        {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
                                    </button>
                                </div>
                            ) : isAdmin && (
                                <div className="flex p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50 shadow-inner ml-2">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        aria-pressed={viewMode === 'grid'}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        aria-pressed={viewMode === 'table'}
                                        className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                        title="Table View"
                                    >
                                        <LayoutList size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <InstructionPanel />

            {/* List Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                    <h2 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        Directory Registry
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-sm">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                aria-label="Previous page"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                            >
                                <ChevronLeft size={16} aria-hidden="true" />
                            </button>
                            <div className="flex items-center gap-1.5 px-2">
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{currentPage}</span>
                                <span className="text-[10px] font-black text-slate-300">/</span>
                                <span className="text-[10px] font-black text-slate-500">{totalPages}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                aria-label="Next page"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                            >
                                <ChevronRight size={16} aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    <span className="text-[9px] font-black bg-white dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-indigo-500/20 uppercase tracking-widest shadow-sm">
                        {filteredExtensions.length} NODES
                    </span>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/30 rounded-[2rem] animate-pulse border border-slate-200/50 dark:border-slate-800"></div>
                    ))}
                </div>
            ) : filteredExtensions.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    </div>
                ) : (
                    <ExtensionTable
                        extensions={paginatedExtensions}
                        isAdmin={isAdmin}
                        canEdit={canEdit}
                        onEdit={openModal}
                        onDelete={handleDelete}
                    />
                )
            ) : (
                <div className="text-center py-24 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Search className="w-8 h-8 text-slate-400 dark:text-slate-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Results</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-2 font-medium opacity-60">Adjust your search or filter to find nodes.</p>
                </div>
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
            {isPublic && (
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
            )}
        </div>
    );
};
