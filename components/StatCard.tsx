import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sparkline } from './Sparkline';

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
    // New props for advanced features
    trendData?: number[]; // For sparkline
    percentageChange?: number; // +5.2 or -3.1
    target?: number; // For progress bar
    comparisonPeriod?: 'MTD' | 'QTD' | 'YTD' | 'vs Last Month' | 'vs Last Week';
    previousValue?: number;
    showSparkline?: boolean;
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
    children,
    trendData,
    percentageChange,
    target,
    comparisonPeriod,
    previousValue,
    showSparkline = true
}) => {
    // Generate color classes if legacy 'color' prop is used and 'colorClass' is missing
    const finalColorClass = colorClass || `bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 border-${color}-100 dark:border-${color}-500/20`;

    // Extract the base color name for the big background icon
    const iconColor = colorClass ? colorClass.split('-')[1] || color : color;

    // Use subValue or subtext (legacy support)
    const finalSubText = subValue || subtext;

    // Calculate percentage change if not provided
    const calculatedChange = percentageChange !== undefined
        ? percentageChange
        : (previousValue && typeof value === 'number')
            ? ((value - previousValue) / previousValue) * 100
            : undefined;

    // Determine trend direction
    const trendDirection = calculatedChange !== undefined
        ? calculatedChange > 0 ? 'up' : calculatedChange < 0 ? 'down' : 'neutral'
        : undefined;

    // Calculate progress percentage for target
    const progressPercentage = target && typeof value === 'number'
        ? Math.min((value / target) * 100, 100)
        : undefined;

    // Sparkline color based on trend
    const sparklineColor = trendDirection === 'up' ? 'emerald' : trendDirection === 'down' ? 'rose' : color;

    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={`
                relative overflow-hidden flex flex-col p-6 
                bg-white/60 dark:bg-slate-950/40 backdrop-blur-xl 
                border border-slate-200/50 dark:border-slate-800/50 
                rounded-2xl shadow-sm hover:shadow-md 
                transition-all duration-300 group cursor-pointer
            `}
        >
            <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 scale-125 rotate-12 text-slate-500`}>
                <Icon size={110} />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">{label}</span>
                        <div className={`p-2.5 rounded-xl border transition-all duration-500 ${finalColorClass} shadow-sm`}>
                            <Icon size={18} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="flex items-end gap-3 mb-2">
                        <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                            {value}
                        </span>

                        {/* Percentage Change Badge */}
                        {calculatedChange !== undefined && trendDirection !== 'neutral' && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg mb-1.5 ${trendDirection === 'up'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                                }`}>
                                {trendDirection === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span className="text-xs font-bold">
                                    {Math.abs(calculatedChange).toFixed(1)}%
                                </span>
                            </div>
                        )}

                        {/* Legacy trend support */}
                        {trend !== undefined && calculatedChange === undefined && (
                            <span className={`text-xs font-bold flex items-center mb-1.5 ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                    </div>

                    {/* Comparison Period Label */}
                    {comparisonPeriod && calculatedChange !== undefined && (
                        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                            {comparisonPeriod}
                        </div>
                    )}

                    {/* Sparkline */}
                    {showSparkline && trendData && trendData.length > 0 && (
                        <div className="mt-3 mb-2">
                            <Sparkline
                                data={trendData}
                                width={120}
                                height={24}
                                color={sparklineColor as any}
                                showGradient={true}
                            />
                        </div>
                    )}

                    {/* Target Progress Bar */}
                    {target && progressPercentage !== undefined && (
                        <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>Target Progress</span>
                                <span>{progressPercentage.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full bg-gradient-to-r ${progressPercentage >= 90
                                        ? 'from-emerald-500 to-emerald-600'
                                        : progressPercentage >= 70
                                            ? 'from-blue-500 to-blue-600'
                                            : 'from-amber-500 to-amber-600'
                                        }`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-2">
                    {finalSubText && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{finalSubText}</span>}
                    {children}
                </div>
            </div>
        </motion.div>
    );
};
