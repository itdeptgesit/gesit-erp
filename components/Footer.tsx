
'use client';

import React from 'react';
import { useLanguage } from '../translations';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-4 px-8 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#0f172a]/80 backdrop-blur-sm transition-colors duration-300">
      <div className="max-w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-4">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            © {year} GESIT ERP. {t('allRightsReserved')}.
          </p>
          <span className="hidden md:block w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-tighter">
            Powered by IT Department
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{t('systemOnline')}</span>
          </div>
          <span className="w-px h-3 bg-slate-100 dark:bg-slate-800"></span>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">V 4.1.2-STABLE</span>
        </div>
      </div>
    </footer>
  );
};
