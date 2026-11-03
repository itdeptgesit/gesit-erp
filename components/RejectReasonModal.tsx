
'use client';

import React, { useState } from 'react';
import { useToast } from './ToastProvider';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    itemName?: string;
}

export const RejectReasonModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSubmit,
    itemName
}) => {
    const { showToast } = useToast();
    const [reason, setReason] = useState('');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="sm:max-w-md p-6 bg-white dark:bg-[#101010] rounded-[16px] border border-slate-200 dark:border-[#1e1e1e] shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-1">
                    <h2 className="text-lg font-bold text-rose-600 dark:text-rose-500 tracking-tight">
                        Deny Request
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-[#777777] uppercase tracking-wider">Procurement Audit Protocol</p>
                </div>

                <div className="p-4 bg-slate-50/70 dark:bg-[#1e1e1e] rounded-[8px] border border-slate-200/80 dark:border-[#1e1e1e] mt-4">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-[#777777] uppercase tracking-wider mb-1">Target Requisition</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-[#f3f5f7]">
                        {itemName || 'Unknown Item'}
                    </p>
                </div>

                <div className="space-y-2 mt-4">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-[#777777] uppercase tracking-wider">Reason for Rejection</label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Briefly explain why this procurement node is being rejected (required for registry sync)..."
                        className="w-full min-h-[110px] bg-slate-50/50 dark:bg-[#101010] border border-slate-200 dark:border-[#1e1e1e] rounded-[8px] p-3 text-xs font-medium text-slate-800 dark:text-[#f3f5f7] placeholder:text-slate-400 dark:placeholder:text-[#777777] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-all resize-none shadow-sm"
                    />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                    <button
                        onClick={() => {
                            if (!reason.trim()) {
                                showToast('A technical or administrative reason is required to finalize the rejection.', 'error');
                                return;
                            }
                            onSubmit(reason.trim());
                            setReason('');
                        }}
                        className="w-full py-2.5 bg-rose-600 text-white rounded-[8px] text-xs font-semibold hover:bg-rose-700 transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                        Confirm Denial
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#1e1e1e] text-slate-600 dark:text-[#f3f5f7] rounded-[8px] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#252525] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        Cancel Protocol
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};