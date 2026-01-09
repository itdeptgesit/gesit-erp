
'use client';

import React, { useState, useMemo } from 'react';
import { Search, Download, ArrowRight, Cable, Network, ShieldCheck, Server, Filter, Video, PhoneCall, Zap } from 'lucide-react';
import { NetworkSwitch, PortStatus, DeviceType } from '../types';

interface WiringScheduleProps {
    switches: NetworkSwitch[];
}

export const WiringSchedule: React.FC<WiringScheduleProps> = ({ switches }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('All');
  
  const allConnections = useMemo(() => {
    return switches.flatMap(sw => 
        sw.ports.map(port => ({
          switchName: sw.name,
          switchModel: sw.model,
          switchId: sw.id,
          port: port,
          uplink: switches.find(s => s.id === port.uplinkDeviceId)?.name
        }))
      ).filter(item => item.port.status !== PortStatus.DISABLED);
  }, [switches]);

  const filteredConnections = useMemo(() => {
    return allConnections.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = item.switchName.toLowerCase().includes(searchLower) ||
          (item.port.deviceConnected || '').toLowerCase().includes(searchLower) ||
          (item.port.patchPanelPort || '').toLowerCase().includes(searchLower) ||
          (item.port.ipAddress || '').toLowerCase().includes(searchLower);
        
        const matchesDevice = deviceFilter === 'All' ? true : item.switchId === deviceFilter;
        
        return matchesSearch && matchesDevice;
    });
  }, [allConnections, searchTerm, deviceFilter]);

  const getSourceIcon = (name: string, model: string) => {
      const n = name.toLowerCase();
      const m = model.toLowerCase();
      if (n.includes('nvr') || m.includes('nvr')) return <Video size={12} />;
      if (n.includes('dvr') || m.includes('dvr')) return <Zap size={12} className="text-blue-500" />;
      if (n.includes('pabx') || m.includes('pabx') || n.includes('lsa')) return <PhoneCall size={12} />;
      return <Server size={12} />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-b-2xl overflow-hidden flex flex-col min-h-[400px]">
      {/* Table Toolbar */}
      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search by target, IP, or patch port..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400 dark:text-slate-500" />
              <select 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 focus:outline-none hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer shadow-sm"
                value={deviceFilter}
                onChange={e => setDeviceFilter(e.target.value)}
              >
                  <option value="All">All Source Hardware</option>
                  {switches.map(sw => (
                      <option key={sw.id} value={sw.id}>{sw.name}</option>
                  ))}
              </select>
          </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar max-h-[500px]">
        <table className="w-full text-left border-collapse">
            <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 shadow-sm transition-colors">
                <tr>
                    <th className="px-6 py-4">Source Device</th>
                    <th className="px-6 py-4">Circuit ID</th>
                    <th className="px-6 py-4">Patch Location</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Connection Target</th>
                    <th className="px-6 py-4">Infrastructure</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredConnections.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-widest">No connections found matching filters.</td></tr>
                ) : filteredConnections.map((conn, idx) => (
                    <tr key={`${conn.switchId}-${conn.port.id}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg border ${conn.switchName.toLowerCase().includes('nvr') || conn.switchName.toLowerCase().includes('dvr') ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                    {getSourceIcon(conn.switchName, conn.switchModel)}
                                </div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[12px] uppercase tracking-tight">{conn.switchName}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] font-bold">P-{conn.port.portNumber.toString().padStart(2, '0')}</td>
                        <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-lg font-mono text-[10px] font-black border border-slate-200 dark:border-slate-700 shadow-sm">
                                {conn.port.patchPanelPort || 'N/A'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                             <div className={`w-2 h-2 mx-auto rounded-full ${conn.port.status === PortStatus.ACTIVE ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                        </td>
                        <td className="px-6 py-4">
                            {conn.uplink ? (
                                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-black text-[10px] bg-blue-50/50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg w-fit border border-blue-100 dark:border-blue-900/30 uppercase tracking-tight">
                                    <ShieldCheck size={12} /> Link: {conn.uplink}
                                </span>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-slate-800 dark:text-slate-200 font-bold text-[12px] uppercase leading-none">{conn.port.deviceConnected || 'UNASSIGNED'}</span>
                                    {conn.port.ipAddress && <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1.5 font-bold uppercase tracking-widest">{conn.port.ipAddress}</span>}
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                <Cable size={12} className={conn.port.cableType === 'Coaxial' ? 'text-indigo-500' : 'text-blue-500'} />
                                {conn.port.cableType || conn.port.cableLength || 'Cat6'}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest flex justify-between items-center border-t border-slate-100 dark:border-slate-800 transition-colors">
        <span className="flex items-center gap-2"><Network size={12} /> Total Segments: {filteredConnections.length}</span>
        <span className="text-slate-300 dark:text-slate-700">Audit Verified: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};
