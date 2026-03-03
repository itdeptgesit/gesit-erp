'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '../translations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  if (!isOpen) return null;

  const isConfirmDisabled = isLoading || (entityName ? inputValue !== entityName : false);
  const buttonText = confirmText || (title.endsWith('?') ? title.slice(0, -1) : title);

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-950 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex flex-col text-left">
            <h3 className="text-xl font-bold tracking-tight mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <Trash2 className="text-red-600 shrink-0 h-6 w-6" strokeWidth={2} />
              {title}
            </h3>

            <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </div>

            {entityName && (
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Please type <span className="font-bold text-slate-900 dark:text-slate-50">{entityName}</span> to confirm.
              </div>
            )}

            {entityName && (
              <div className="mt-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={entityName}
                  className="font-mono text-sm"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => {
                  setInputValue('');
                  onClose();
                }}
                disabled={isLoading}
                className="font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isConfirmDisabled}
                className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 font-semibold"
              >
                {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
                {buttonText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};