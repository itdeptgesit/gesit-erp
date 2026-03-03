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
    // Horizon UI Color Mapping
    // Text Primary: #2B3674, Text Secondary: #707EAE, Brand: #4318FF
    const colorMap: any = {
        indigo: { iconBg: 'bg-primary/10', text: 'text-primary' },
        blue: { iconBg: 'bg-blue-500/10', text: 'text-blue-500' },
        emerald: { iconBg: 'bg-emerald-500/10', text: 'text-emerald-500' },
        rose: { iconBg: 'bg-rose-500/10', text: 'text-rose-500' },
        amber: { iconBg: 'bg-amber-500/10', text: 'text-amber-500' },
        purple: { iconBg: 'bg-purple-500/10', text: 'text-purple-500' },
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
                relative flex items-center p-5
                bg-card dark:bg-slate-900/40 text-card-foreground border border-slate-100 dark:border-white/[0.05] shadow-sm
                rounded-2xl backdrop-blur-sm
                transition-all duration-300 cursor-pointer group
            `}
        >
            {/* Icon Container with subtle glass effect */}
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.iconBg} ${c.text} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                <Icon size={28} strokeWidth={1.5} />
            </div>

            {/* Content Section with refined typography */}
            <div className="ml-5 flex flex-col justify-center overflow-hidden">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 leading-none mb-2">
                    {label}
                </p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-black tracking-tight text-foreground leading-none">
                        {value}
                    </h4>
                    {calculatedChange !== undefined && (
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${trendDirection === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                            {trendDirection === 'up' ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                            <span className="text-[10px] font-black tracking-tighter">
                                {Math.abs(calculatedChange).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                {(finalSubText || status) && (
                    <div className="flex items-center gap-2 mt-2">
                        {status === 'on-track' && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-md">
                                <CheckCircle2 size={10} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                            </div>
                        )}
                        {finalSubText && (
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider italic">
                                {finalSubText}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Premium Detail Decorator */}
            <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-primary/20" />
        </motion.div>
    );
};
