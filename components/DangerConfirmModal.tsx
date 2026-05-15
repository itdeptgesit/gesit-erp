
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '../translations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

interface DangerConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  isLoading?: boolean;
  entityName?: string;
  confirmText?: string;
}

export const DangerConfirmModal: React.FC<DangerConfirmModalProps> = ({
  isOpen, onClose, onConfirm, title, message, isLoading, entityName, confirmText
}) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const isConfirmDisabled = isLoading || (entityName ? inputValue !== entityName : false);
  const buttonText = confirmText || (title.endsWith('?') ? title.slice(0, -1) : title);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="sm:max-w-[440px] p-0 overflow-hidden bg-white dark:bg-zinc-900 rounded-xl border-none shadow-2xl">
                <div className="p-10">
                    <div className="flex flex-col">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                                <Trash2 className="text-rose-500 h-6 w-6" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none uppercase">
                                {title}
                            </h3>
                        </div>

                        <div className="text-[13px] font-medium text-slate-500 dark:text-zinc-400 leading-relaxed mb-8">
                            {message}
                        </div>

                        {entityName && (
                            <div className="space-y-4 mb-8">
                                <div className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                                    Please type <span className="font-bold text-slate-900 dark:text-white">{entityName}</span> to confirm.
                                </div>
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={entityName}
                                    className="h-12 border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950/50 font-bold text-slate-900 dark:text-white px-4 focus-visible:ring-rose-500/20 focus-visible:border-rose-500/40"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setInputValue('');
                                    onClose();
                                }}
                                disabled={isLoading}
                                className="px-8 py-3 rounded-full border border-slate-200 dark:border-zinc-800 text-[12px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isConfirmDisabled}
                                className={`px-8 py-3 rounded-full text-[12px] font-black uppercase tracking-widest transition-all flex-1 flex items-center justify-center gap-3 shadow-lg ${
                                    isConfirmDisabled 
                                    ? 'bg-slate-400 text-white cursor-not-allowed shadow-none' 
                                    : 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20'
                                }`}
                            >
                                {isLoading && <Loader2 size={16} className="animate-spin" strokeWidth={3} />}
                                {buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
