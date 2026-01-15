"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
    Search,
    Phone,
    Building2,
    Info,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Pencil,
    Loader2,
    X,
    Zap,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    LayoutList,
    Share2,
    ExternalLink
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { PhoneExtension, UserAccount } from "../types";

/* ===========================
   Instruction Panel
=========================== */
const InstructionPanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border flex justify-between"
            >
                <div className="flex items-center gap-2">
                    <Info size={14} />
                    <span className="text-sm font-bold">How to Dial</span>
                </div>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isOpen && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl mt-2 text-xs">
                    Dial instructions here...
                </div>
            )}
        </div>
    );
};

/* ===========================
   Extension Card (GRID)
=========================== */
const ExtensionCard: React.FC<{
    ext: PhoneExtension;
    index: number;
    canEdit: boolean;
    canDelete: boolean;
    onEdit?: (ext: PhoneExtension) => void;
    onDelete?: (id: number) => void;
}> = ({ ext, canEdit, canDelete, onEdit, onDelete }) => {
    const [copied, setCopied] = useState(false);

    const copyExt = () => {
        navigator.clipboard.writeText(ext.ext);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border hover:shadow-lg transition">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold">{ext.name}</h3>
                    <p className="text-xs text-slate-400">{ext.dept}</p>
                </div>

                <div className="flex gap-1">
                    <button
                        onClick={copyExt}
                        className="px-3 py-1 rounded-xl font-mono font-black bg-slate-100 dark:bg-slate-800"
                    >
                        {copied ? <Check size={14} /> : ext.ext}
                    </button>

                    {canEdit && (
                        <button
                            onClick={() => onEdit?.(ext)}
                            className="p-1.5 text-slate-400 hover:text-indigo-500"
                        >
                            <Pencil size={14} />
                        </button>
                    )}

                    {canDelete && (
                        <button
                            onClick={() => onDelete?.(ext.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {ext.role && (
                <p className="text-[10px] italic text-slate-400 mt-2">
                    {ext.role}
                </p>
            )}

            <div className="mt-3 text-[10px] uppercase font-bold text-slate-500">
                Floor {ext.floor}
            </div>
        </div>
    );
};

/* ===========================
   Extension Table (LIST)
=========================== */
const ExtensionTable: React.FC<{
    extensions: PhoneExtension[];
    canEdit: boolean;
    canDelete: boolean;
    onEdit?: (ext: PhoneExtension) => void;
    onDelete?: (id: number) => void;
}> = ({ extensions, canEdit, canDelete, onEdit, onDelete }) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b text-xs">
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3">Ext</th>
                        <th className="px-4 py-3">Dept</th>
                        <th className="px-4 py-3">Floor</th>
                        {canEdit && <th className="px-4 py-3 text-right">Action</th>}
                    </tr>
                </thead>
                <tbody>
                    {extensions.map(ext => (
                        <tr key={ext.id} className="border-b hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold">{ext.name}</td>
                            <td className="px-4 py-3 font-mono">{ext.ext}</td>
                            <td className="px-4 py-3">{ext.dept}</td>
                            <td className="px-4 py-3">{ext.floor}</td>

                            {canEdit && (
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => onEdit?.(ext)}
                                        className="p-2 text-slate-400 hover:text-indigo-600"
                                    >
                                        <Pencil size={14} />
                                    </button>

                                    {canDelete && (
                                        <button
                                            onClick={() => onDelete?.(ext.id)}
                                            className="p-2 text-slate-400 hover:text-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/* ===========================
   MAIN COMPONENT
=========================== */
export const ExtensionDirectory = ({
    currentUser
}: {
    currentUser?: UserAccount | null;
}) => {
    const [extensions, setExtensions] = useState<PhoneExtension[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    /* ===== ROLE PERMISSION ===== */
    const isAdmin = currentUser?.role === "Admin";
    const isStaff = currentUser?.role === "Staff";

    const canEdit = isAdmin || isStaff;
    const canDelete = isAdmin;

    useEffect(() => {
        fetchExtensions();
    }, []);

    const fetchExtensions = async () => {
        const { data } = await supabase
            .from("phone_extensions")
            .select("*")
            .order("name");

        setExtensions(data || []);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this extension?")) return;

        await supabase.from("phone_extensions").delete().eq("id", id);
        fetchExtensions();
    };

    const filtered = useMemo(() => {
        return extensions.filter(ext =>
            ext.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [extensions, searchTerm]);

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <input
                    className="border rounded-xl px-4 py-2"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />

                {isAdmin && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl">
                        <Plus size={16} />
                    </button>
                )}
            </div>

            <InstructionPanel />

            {/* VIEW SWITCH */}
            {canEdit && (
                <div className="flex gap-2">
                    <button onClick={() => setViewMode("grid")}>
                        <LayoutGrid size={16} />
                    </button>
                    <button onClick={() => setViewMode("table")}>
                        <LayoutList size={16} />
                    </button>
                </div>
            )}

            {/* CONTENT */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filtered.map((ext, i) => (
                        <ExtensionCard
                            key={ext.id}
                            ext={ext}
                            index={i}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <ExtensionTable
                    extensions={filtered}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};
