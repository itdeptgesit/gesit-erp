'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DangerConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  isLoading?: boolean;
  entityName?: string; // for confirmation typing
  confirmText?: string;
  /**
   * Variant determines visual theme.
   * 'danger' (default) – clean ShadCN Alert Dialog styling with dark button.
   * 'logout' – blue theme confirm button.
   */
  variant?: 'danger' | 'logout';
}

export const DangerConfirmModal: React.FC<DangerConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
  entityName,
  confirmText,
  variant = 'danger',
}) => {
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const isConfirmDisabled = isLoading || (entityName ? inputValue !== entityName : false);
  const buttonText = confirmText || (variant === 'logout' ? 'Log out' : 'Delete');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} disablePointerDismissal={true}>
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] p-6 bg-white dark:bg-[#101010] rounded-[16px] border border-slate-200 dark:border-[#1e1e1e] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col space-y-1.5 text-left">
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#f3f5f7] leading-tight tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#777777] leading-normal font-medium">
            {message}
          </p>
        </div>

        {entityName && (
          <div className="space-y-1.5 my-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-[#777777]">
              Please type <span className="font-bold text-slate-900 dark:text-[#f3f5f7]">{entityName}</span> to confirm.
            </div>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={entityName}
              className="h-10 border-slate-200 dark:border-[#1e1e1e] rounded-[8px] bg-slate-50/50 dark:bg-[#1e1e1e] text-xs font-medium text-slate-800 dark:text-[#f3f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 sm:gap-0 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setInputValue('');
              onClose();
            }}
            disabled={isLoading}
            className="text-xs font-semibold h-9 px-4 rounded-[8px] text-slate-700 hover:bg-slate-100 dark:text-[#f3f5f7] dark:hover:bg-[#1e1e1e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`text-xs font-semibold h-9 px-4 rounded-[8px] transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 ${
              variant === 'logout'
                ? 'bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500'
                : 'bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500'
            }`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
