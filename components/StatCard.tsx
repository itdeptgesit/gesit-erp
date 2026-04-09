import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
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
    status?: 'on-track' | 'at-risk' | 'delayed';
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
    showSparkline = true,
    status
}) => {
    // Horizon UI Color Mapping - Refined for High Contrast
    const colorMap: any = {
        indigo: { iconBg: 'bg-[#111827]', text: 'text-white' },
        blue: { iconBg: 'bg-blue-600', text: 'text-white' },
        emerald: { iconBg: 'bg-emerald-600', text: 'text-white' },
        rose: { iconBg: 'bg-rose-600', text: 'text-white' },
        amber: { iconBg: 'bg-amber-500', text: 'text-white' },
        purple: { iconBg: 'bg-purple-600', text: 'text-white' },
        sky: { iconBg: 'bg-sky-500', text: 'text-white' },
        orange: { iconBg: 'bg-orange-500', text: 'text-white' },
    };

    const c = colorMap[color] || colorMap.indigo;
    const finalSubText = subValue || subtext;

    const calculatedChange = percentageChange !== undefined
        ? percentageChange
        : (previousValue && typeof value === 'number')
            ? ((value - previousValue) / previousValue) * 100
            : undefined;

    const trendDirection = calculatedChange !== undefined
        ? calculatedChange > 0 ? 'up' : calculatedChange < 0 ? 'down' : 'neutral'
        : undefined;

    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`
                relative flex flex-col justify-between p-6
                bg-[#f5f5f5] text-[#111827] border-none shadow-none
                rounded-[32px] min-h-[140px]
                transition-all duration-300 cursor-pointer group
            `}
        >
            <div className="flex justify-between items-start">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${c.iconBg} ${c.text} shrink-0 shadow-lg shadow-black/5`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                {calculatedChange !== undefined && (
                    <div className={`flex items-center gap-0.5 font-bold text-[10px] ${trendDirection === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {trendDirection === 'up' ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                        {Math.abs(calculatedChange).toFixed(0)}%
                    </div>
                )}
            </div>

            <div className="mt-4">
                <p className="text-[11px] font-black tracking-widest text-[#6B7280] uppercase opacity-70 mb-1">
                    {label}
                </p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-black tracking-tighter text-[#111827]">
                        {value}
                    </h4>
                </div>
                {finalSubText && (
                    <p className="text-[10px] font-bold text-[#9CA3AF] mt-1 uppercase tracking-tight">
                        {finalSubText}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

