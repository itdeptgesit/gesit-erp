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
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`
                relative flex items-center p-4
                bg-card text-card-foreground border border-border shadow-sm
                rounded-lg
                transition-all duration-300 cursor-pointer group
            `}
        >
            {/* Icon Container */}
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${c.iconBg} ${c.text} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                <Icon size={24} strokeWidth={1.5} />
            </div>

            {/* Content Section with refined typography */}
            <div className="ml-4 flex flex-col justify-center overflow-hidden">
                <p className="text-[10px] font-bold tracking-wide text-muted-foreground/80 leading-none mb-1.5">
                    {label}
                </p>
                <div className="flex items-baseline gap-1.5">
                    <h4 className="text-xl font-bold tracking-tight text-foreground leading-none">
                        {value}
                    </h4>
                    {calculatedChange !== undefined && (
                        <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded ${trendDirection === 'up' ? 'text-emerald-500' : 'text-destructive'}`}>
                            {trendDirection === 'up' ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                            <span className="text-[9px] font-bold">
                                {Math.abs(calculatedChange).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                {(finalSubText || status) && (
                    <div className="flex items-center gap-2 mt-1.5">
                        {status === 'on-track' && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded">
                                <CheckCircle2 size={9} className="text-emerald-400" />
                                <span className="text-[8px] font-bold text-emerald-500">Live</span>
                            </div>
                        )}
                        {finalSubText && (
                            <p className="text-[9px] font-medium text-muted-foreground/70">
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
