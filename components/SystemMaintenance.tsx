
'use client';

import React, { useState } from 'react';
// Added Briefcase to the lucide-react imports to fix the "Cannot find name 'Briefcase'" error
import { Trash2, AlertCircle, Database, ShieldAlert, CheckCircle2, RefreshCcw, Zap, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { DangerConfirmModal } from './DangerConfirmModal';
import { useLanguage } from '../translations';

export const SystemMaintenance: React.FC = () => {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ open: boolean, type: string, title: string, table: string | string[] } | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const wipeData = async (table: string | string[]) => {
        setIsLoading(true);
        try {
            const tables = Array.isArray(table) ? table : [table];
            for (const t of tables) {
                const { error } = await supabase.from(t).delete().neq('id', -1); 
                if (error) throw error;
            }
            setStatusMsg({ text: `Records purged successfully.`, type: 'success' });
            setConfirmModal(null);
        } catch (err: any) {
            setStatusMsg({ text: err.message, type: 'error' });
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatusMsg(null), 5000);
        }
    };

    const modules = [
        { title: t('assets'), table: 'it_assets', icon: Database, color: 'blue' },
        { title: t('activity'), table: 'activity_logs', icon: RefreshCcw, color: 'indigo' },
        { title: t('weekly'), table: 'weekly_plans', icon: ShieldAlert, color: 'purple' },
        { title: t('purchase'), table: 'purchase_plans', icon: Zap, color: 'orange' },
        { title: t('purchaseRecord'), table: 'purchase_records', icon: Briefcase, color: 'emerald' },
        { title: t('network'), table: ['switch_ports', 'network_switches'], icon: Zap, color: 'rose' },
        { title: t('files'), table: 'files', icon: Database, color: 'slate' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-6 rounded-2xl flex items-start gap-4 transition-colors">
                <div className="p-3 bg-rose-600 text-white rounded-xl shadow-md shrink-0">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-rose-900 dark:text-rose-400 uppercase tracking-tight">{t('maintenanceTitle')}</h2>
                    <p className="text-xs text-rose-700/70 dark:text-rose-500/60 font-medium leading-relaxed mt-1">
                        {t('maintenanceDesc')} <br/>
                        <span className="font-bold">{t('maintenanceWarning')}</span>
                    </p>
                </div>
            </div>

            {statusMsg && (
                <div className={`p-4 rounded-xl border animate-in slide-in-from-top-2 flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'}`}>
                    {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="font-bold text-xs uppercase tracking-widest">{statusMsg.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((m, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-slate-900 dark:group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                                <m.icon size={20} />
                            </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-2">{m.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-6 uppercase tracking-widest leading-relaxed">Wipe all records in this module.</p>
                        
                        <button 
                            onClick={() => setConfirmModal({ open: true, type: m.title, title: `Wipe ${m.title}`, table: m.table })}
                            className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-100 dark:hover:border-rose-900/50 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Trash2 size={14} /> Clear Module
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 dark:bg-[#020617] p-8 rounded-2xl shadow-xl relative overflow-hidden group border border-transparent dark:border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                <div className="relative z-10 max-w-lg">
                    <h3 className="text-white font-bold text-xl uppercase tracking-tighter mb-3">{t('totalReset')}</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-medium leading-relaxed mb-8 uppercase tracking-widest opacity-80">
                        {t('totalResetDesc')}
                    </p>
                    <button 
                        onClick={() => setConfirmModal({ open: true, type: 'TOTAL RESET', title: 'FULL SYSTEM WIPE', table: modules.map(m => Array.isArray(m.table) ? m.table : [m.table]).flat() as string[] })}
                        className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <AlertCircle size={16} /> {t('executePurge')}
                    </button>
                </div>
            </div>

            <DangerConfirmModal 
                isOpen={!!confirmModal?.open}
                onClose={() => setConfirmModal(null)}
                onConfirm={() => wipeData(confirmModal!.table)}
                title={confirmModal?.title || ''}
                message={`You are about to purge all records in ${confirmModal?.type} module.`}
                isLoading={isLoading}
            />
        </div>
    );
};
