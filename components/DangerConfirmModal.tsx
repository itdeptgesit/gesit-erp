'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../translations';

interface DangerConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export const DangerConfirmModal: React.FC<DangerConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
              {title}
            </h3>

            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex flex-col w-full gap-2">
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                {t('confirm')}
              </button>

              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full py-3 bg-white text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 transition-all border border-transparent disabled:opacity-50"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};