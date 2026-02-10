import React from 'react';
import { Store, ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface VendorData {
    name: string;
    total: number;
    transactionCount: number;
}

interface TopVendorsWidgetProps {
    vendors: VendorData[];
}

export const TopVendorsWidget: React.FC<TopVendorsWidgetProps> = ({ vendors }) => {
    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-8 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                <Store size={120} />
            </div>

            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-500/20 shadow-sm">
                    <Store size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg leading-none">Key Suppliers</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Top Contracted Entities</p>
                </div>
            </div>

            <div className="space-y-5 flex-1 relative z-10">
                {vendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <Store size={32} className="mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No vendor data</p>
                    </div>
                ) : (
                    vendors.slice(0, 5).map((vendor, idx) => (
                        <motion.div
                            key={vendor.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative group/item"
                        >
                            <div className="flex justify-between items-center z-10 relative p-4 -mx-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm border
                                        ${idx === 0 ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                            idx === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                idx === 2 ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                                    'bg-slate-50 text-slate-400 border-slate-100'}
                                    `}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                                            {vendor.name === 'Unknown' || !vendor.name ? 'General Supplier' : vendor.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                                                {vendor.transactionCount} Txns
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                        {formatIDR(vendor.total).replace('Rp', '')}
                                    </p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                                        Active
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
            {vendors.length > 3 && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center relative z-10">
                    <button className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest group/btn">
                        View All Vendors
                        <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
};
