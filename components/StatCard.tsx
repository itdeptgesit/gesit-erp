import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon: any;
    color?: string; // Legacy prop (e.g. "blue", "rose")
    colorClass?: string; // New prop for full Tailwind classes
    subtext?: string; // Alias for subValue to match ExtensionDirectory usage
    trend?: number;
    onClick?: () => void;
    children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    subValue,
    subtext,
    icon: Icon,
    color = "indigo",
    colorClass,
    trend,
    onClick,
    children
}) => {
    // Generate color classes if legacy 'color' prop is used and 'colorClass' is missing
    const finalColorClass = colorClass || `bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 border-${color}-100 dark:border-${color}-500/20`;

    // Extract the base color name for the big background icon (hacky but works for standard Tailwind colors)
    // If colorClass is provided, we try to extract a color, otherwise default to legacy color
    const iconColor = colorClass ? colorClass.split('-')[1] || color : color;

    // Use subValue or subtext (legacy support)
    const finalSubText = subValue || subtext;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={onClick}
            className={`
                relative overflow-hidden flex flex-col p-6 
                bg-white dark:bg-slate-900/60 backdrop-blur-xl 
                border border-slate-200/50 dark:border-slate-800/50 
                rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 
                transition-all duration-500 group cursor-pointer
            `}
        >
            <div className={`absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500 scale-150 rotate-12 text-${iconColor}-500`}>
                <Icon size={120} />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">{label}</span>
                        <div className={`p-2.5 rounded-xl border transition-all duration-500 ${finalColorClass} shadow-sm`}>
                            <Icon size={18} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="flex items-end gap-3 mb-1">
                        <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                            {value}
                        </span>
                        {trend !== undefined && (
                            <span className={`text-xs font-bold flex items-center mb-1.5 ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-1">
                    {finalSubText && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{finalSubText}</span>}
                    {children}
                </div>
            </div>
        </motion.div>
    );
};
