'use client';

import React from 'react';
import { Server, Router, Wifi, Video, Monitor, Printer, Phone, HardDrive, CheckCircle, Clock, Wrench, XCircle } from 'lucide-react';
import { NetworkSwitch } from '../types';

interface NetworkSummaryBarProps {
    switches: NetworkSwitch[];
}

export const NetworkSummaryBar: React.FC<NetworkSummaryBarProps> = ({ switches }) => {
    const summary = React.useMemo(() => {
        const stats = {
            total: switches.length,
            byType: {} as Record<string, number>,
            byStatus: {
                active: 0,
                spare: 0,
                maintenance: 0,
                decommissioned: 0
            }
        };

        switches.forEach(sw => {
            const type = sw.model || 'Unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;

            const status = (sw.status || 'active') as string;
            if (status in stats.byStatus) {
                stats.byStatus[status as keyof typeof stats.byStatus]++;
            }
        });

        return stats;
    }, [switches]);

    const getTypeIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('router') || t.includes('mikrotik')) return Router;
        if (t.includes('access point') || t.includes('ap') || t.includes('wifi')) return Wifi;
        if (t.includes('cctv') || t.includes('camera') || t.includes('nvr')) return Video;
        if (t.includes('pc') || t.includes('computer')) return Monitor;
        if (t.includes('printer')) return Printer;
        if (t.includes('phone')) return Phone;
        if (t.includes('server')) return HardDrive;
        return Server;
    };

    const topTypes = Object.entries(summary.byType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6);

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg mb-6">
            {/* Header with Total Count */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Infrastructure Overview</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time device inventory and status</p>
                </div>
                <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-5 py-3">
                    <Server className="text-blue-600 dark:text-blue-400" size={20} />
                    <div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Total Devices</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">{summary.total}</div>
                    </div>
                </div>
            </div>

            {/* Status Distribution */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={18} />
                    </div>
                    <div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Active</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">{summary.byStatus.active}</div>
                    </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="text-yellow-600 dark:text-yellow-400" size={18} />
                    </div>
                    <div>
                        <div className="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider">Spare</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">{summary.byStatus.spare}</div>
                    </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Wrench className="text-orange-600 dark:text-orange-400" size={18} />
                    </div>
                    <div>
                        <div className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">Maintenance</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">{summary.byStatus.maintenance}</div>
                    </div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-500/20 rounded-lg flex items-center justify-center">
                        <XCircle className="text-slate-600 dark:text-slate-400" size={18} />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Decommissioned</div>
                        <div className="text-xl font-black text-slate-900 dark:text-white">{summary.byStatus.decommissioned}</div>
                    </div>
                </div>
            </div>

            {/* Device Type Breakdown */}
            <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Device Types</h3>
                <div className="grid grid-cols-6 gap-2">
                    {topTypes.map(([type, count]) => {
                        const Icon = getTypeIcon(type);
                        return (
                            <div key={type} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex flex-col items-center gap-2 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 transition-all">
                                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                                    <Icon className="text-blue-600 dark:text-blue-400" size={16} />
                                </div>
                                <div className="text-center w-full">
                                    <div className="text-lg font-black text-slate-900 dark:text-white">{count}</div>
                                    <div className="text-[8px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">{type}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
