import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  LayoutTemplate, 
  Table as TableIcon, 
  Loader2, 
  Check, 
  Maximize2 
} from 'lucide-react';
import { PhoneExtension } from '../types';
import { 
  DirectoryPdfFormat, 
  exportDirectoryPDF, 
  generateDirectoryPdfBlobUrl 
} from '../lib/directoryPdfExport';
import { Button } from './ui/button';
import { ModalWrapper } from './ui/ModalWrapper';
import { useLanguage } from '../translations';

interface DirectoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  extensions: PhoneExtension[];
  isAdmin?: boolean;
}

export const DirectoryExportModal: React.FC<DirectoryExportModalProps> = ({
  isOpen,
  onClose,
  extensions,
  isAdmin = false
}) => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const [format, setFormat] = useState<DirectoryPdfFormat>('desk_card');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // Generate preview when modal opens or format changes
  useEffect(() => {
    if (!isOpen || extensions.length === 0) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
        setBlobUrl(null);
      }
      return;
    }

    setIsGenerating(true);
    const timer = setTimeout(() => {
      try {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        const url = generateDirectoryPdfBlobUrl(extensions, format, isAdmin);
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch (err) {
        console.error('Error generating PDF preview:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 80);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, format, extensions, isAdmin]);

  // Clean up blob url on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleDownload = () => {
    exportDirectoryPDF(extensions, format, isAdmin);
  };

  const handlePrint = () => {
    if (blobUrl) {
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose} 
      className="sm:max-w-5xl h-[92vh] flex flex-col p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              {isId ? 'Export & Preview Phone Directory PDF' : 'Phone Directory PDF Export & Preview'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isId 
                ? `${extensions.length} Kontak siap diekspor` 
                : `${extensions.length} Extensions ready to export`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Control Bar: Format Switcher & Actions */}
      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Format Selector Cards */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFormat('desk_card')}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              format === 'desk_card'
                ? 'bg-primary/10 border-primary text-primary shadow-xs'
                : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
            }`}
          >
            <LayoutTemplate className="w-4 h-4 shrink-0" />
            <div className="text-left leading-tight">
              <div>{isId ? 'Kartu Meja (A4 Lipat)' : 'Desk Card (2-Up A4)'}</div>
              <div className="text-[10px] font-normal text-muted-foreground hidden sm:block">
                {isId ? 'Layout diagram TGC 27th & 26th' : 'Office desk card layout'}
              </div>
            </div>
            {format === 'desk_card' && <Check className="w-3.5 h-3.5 text-primary ml-1 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setFormat('table_report')}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              format === 'table_report'
                ? 'bg-primary/10 border-primary text-primary shadow-xs'
                : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700/60 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
            }`}
          >
            <TableIcon className="w-4 h-4 shrink-0" />
            <div className="text-left leading-tight">
              <div>{isId ? 'Laporan Lengkap (Tabel)' : 'Full Table Report'}</div>
              <div className="text-[10px] font-normal text-muted-foreground hidden sm:block">
                {isId ? 'Format tabel multi-halaman resmi' : 'Multi-page tabular report'}
              </div>
            </div>
            {format === 'table_report' && <Check className="w-3.5 h-3.5 text-primary ml-1 shrink-0" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!blobUrl || isGenerating}
            className="rounded-xl font-bold h-9 px-3 border-border text-slate-700 dark:text-zinc-300"
            title="Open in new tab / Print"
          >
            <Printer className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{isId ? 'Cetak / Buka' : 'Print / Open'}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            disabled={isGenerating}
            className="rounded-xl font-bold h-9 px-4 shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>{isId ? 'Unduh PDF' : 'Download PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Main Body: Live PDF Iframe Preview */}
      <div className="flex-1 bg-slate-100 dark:bg-zinc-950 p-3 sm:p-4 overflow-hidden relative flex flex-col items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold">
              {isId ? 'Menyiapkan preview dokumen...' : 'Preparing PDF preview...'}
            </p>
          </div>
        ) : blobUrl ? (
          <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-md bg-white dark:bg-zinc-900">
            <iframe
              src={`${blobUrl}#toolbar=0&navpanes=0`}
              title="PDF Preview"
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            {isId ? 'Gagal memuat preview PDF' : 'Failed to load PDF preview'}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
