'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Search, LayoutGrid, List, Plus, RefreshCcw, Trash2, Cloud, FileSpreadsheet, FileType, ExternalLink, Pencil, ChevronLeft, ChevronRight, Library } from 'lucide-react';
import { exportToExcel } from '../lib/excelExport';
import { FileFormModal } from './FileFormModal';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { StatCard } from './StatCard';
import { UserAccount } from '../types';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FileItem { id: string; name: string; type: 'pdf' | 'doc' | 'sheet' | 'image' | 'folder'; updatedAt: string; gdriveUrl: string; category?: string; }

interface FileManagerProps {
    currentUser: UserAccount | null;
}

export const FileManager: React.FC<FileManagerProps> = ({ currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteFile, setDeleteFile] = useState<FileItem | null>(null);
    const [editingFile, setEditingFile] = useState<FileItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const { data } = await supabase.from('files').select('*').order('updated_at', { ascending: false });
            if (data) {
                setFiles(data.map(f => ({
                    id: f.id, name: f.name, type: f.type, gdriveUrl: f.gdrive_url, category: f.category,
                    updatedAt: f.updated_at ? new Date(f.updated_at).toLocaleDateString('en-GB') : '-'
                })));
            }
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchFiles(); }, []);

    const filteredFiles = useMemo(() =>
        files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [files, searchTerm]
    );

    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
    const paginatedFiles = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredFiles.slice(start, start + itemsPerPage);
    }, [filteredFiles, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const handleExportExcel = () => {
        if (filteredFiles.length === 0) return;

        const dataToExport = filteredFiles.map(f => ({
            "File Name": f.name,
            "Type": f.type,
            "Category": f.category || "-",
            "Google Drive URL": f.gdriveUrl,
            "Last Updated": f.updatedAt
        }));

        exportToExcel(dataToExport, `GESIT-FILES-${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Library Manager"
                description="Shared resource database & global documentation"
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="h-9 px-4 text-xs font-bold"
                    >
                        <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Export Excel
                    </Button>
                    {canManage && (
                        <Button
                            onClick={() => { setEditingFile(null); setIsModalOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-xs font-bold shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="mr-2 h-3.5 w-3.5" /> Register Document
                        </Button>
                    )}
                </div>
            </PageHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="CLOUD REPOSITORY" value={files.length} subValue="Total entries" icon={Cloud} color="blue" />
                <StatCard label="DOCUMENTS" value={files.filter(f => f.type === 'pdf' || f.type === 'doc').length} subValue="Guides & Manuals" icon={FileType} color="rose" />
                <StatCard label="RESOURCES" value={files.filter(f => f.type === 'sheet' || f.type === 'image').length} subValue="Sheets & Diagrams" icon={FileSpreadsheet} color="emerald" />
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4 transition-all">
                <div className="relative flex-1 w-full"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
                    <Input type="text" placeholder="Filter library items..." className="w-full pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold dark:text-slate-200 focus-visible:ring-0 shadow-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div className="flex gap-2 w-full md:w-auto">

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}><LayoutGrid size={16} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}><List size={16} /></button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center flex flex-col items-center gap-3"><RefreshCcw className="animate-spin text-blue-500" size={32} /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Drive...</p></div>
            ) : filteredFiles.length === 0 ? (
                <div className="py-20 text-center text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest italic">No files found in registry.</div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{paginatedFiles.map(file => (
                    <div key={file.id} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group relative flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{file.type === 'pdf' ? <FileType size={28} /> : file.type === 'sheet' ? <FileSpreadsheet size={28} /> : <FileText size={28} />}</div>
                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">{file.name}</h4><p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">{file.category || 'Global'}</p>
                        <div className="mt-5 flex gap-2 w-full">
                            <a href={file.gdriveUrl} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1.5"><ExternalLink size={12} /> Open</a>
                            {isAdmin && <button onClick={() => { setEditingFile(file); setIsModalOpen(true); }} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Pencil size={14} /></button>}
                            {canDelete && <button onClick={() => setDeleteFile(file)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={14} /></button>}
                        </div>
                    </div>
                ))}</div>
            ) : (
                <div className="bg-card dark:bg-slate-900/20 rounded-2xl border border-border/10 dark:border-white/[0.03] overflow-hidden shadow-sm flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow className="border-border/10">
                                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Document Title</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Cluster</TableHead>
                                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Registry Date</TableHead>
                                    <TableHead className="text-center font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedFiles.map(f => (
                                    <TableRow key={f.id} className="group transition-colors border-border/10 dark:border-white/[0.03] hover:bg-primary/5">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-muted-foreground/70 group-hover:text-primary transition-colors">{f.type === 'sheet' ? <FileSpreadsheet size={16} /> : <FileText size={16} />}</div>
                                                <span className="font-bold text-foreground text-sm tracking-tight">{f.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground/80 bg-muted/50 dark:bg-slate-800/40 px-2 py-0.5 rounded border border-border/10">{f.category || 'Global'}</span>
                                        </TableCell>
                                        <TableCell className="py-4 font-mono text-[10px] font-bold text-muted-foreground">
                                            {f.updatedAt}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            <div className="flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-all">
                                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg">
                                                    <a href={f.gdriveUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>
                                                </Button>
                                                {isAdmin && <Button variant="ghost" size="icon" onClick={() => { setEditingFile(f); setIsModalOpen(true); }} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"><Pencil size={16} /></Button>}
                                                {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteFile(f)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 size={16} /></Button>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Page {currentPage} of {totalPages || 1} ({filteredFiles.length} documents)</p>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            )}
            <FileFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingFile(null); }} onSubmit={fetchFiles} folders={[]} initialData={editingFile} />
            <DangerConfirmModal isOpen={!!deleteFile} onClose={() => setDeleteFile(null)} onConfirm={async () => { await supabase.from('files').delete().eq('id', deleteFile!.id); fetchFiles(); setDeleteFile(null); }} title="Purge Document" message={`Remove "${deleteFile?.name}" permanently?`} />
        </div>
    );
};
