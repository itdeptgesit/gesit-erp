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
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8">
      {/* Header with Total Count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Infrastructure Intelligence</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time asset visibility and operational status</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4">
          <div className="w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center text-white dark:text-black">
            <Server size={20} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Total Inventory</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{summary.total}</div>
          </div>
        </div>
      </div>

      {/* Status Distribution Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active', count: summary.byStatus.active, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Spare', count: summary.byStatus.spare, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Maintenance', count: summary.byStatus.maintenance, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { label: 'Retired', count: summary.byStatus.decommissioned, icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-500/10' }
        ].map((item) => (
          <div key={item.label} className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center ${item.color}`}>
              <item.icon size={18} />
            </div>
            <div>
              <div className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">{item.label}</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{item.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Device Type Breakdown */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600">Distribution by Taxonomy</h3>
          <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {topTypes.map(([type, count]) => {
            const Icon = getTypeIcon(type);
            return (
              <div key={type} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-default">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors">
                  <Icon size={16} />
                </div>
                <div className="text-center w-full">
                  <div className="text-base font-bold text-slate-900 dark:text-white leading-none mb-1">{count}</div>
                  <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider truncate px-1">{type}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
