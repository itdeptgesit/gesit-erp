'use client';

import React from 'react';
import { NetworkSwitch, SwitchPort, PortStatus, DeviceType } from '../types';
import { Video, Wifi, Monitor, Server, Router, Square, PhoneCall, Disc, Box, Radio, Zap, Cable } from 'lucide-react';

interface SwitchVisualizerProps {
  switchDetails: NetworkSwitch;
  onPortClick: (port: SwitchPort) => void;
}

export const SwitchVisualizer: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
  const model = (switchDetails.model || '').toLowerCase();
  const name = (switchDetails.name || '').toLowerCase();

  const isMikrotik = model.includes('rb1100') || model.includes('mikrotik') || name.includes('mikrotik') || name.includes('gateway');
  const isSecurity = model.includes('nvr') || model.includes('dvr') || name.includes('nvr') || name.includes('dvr');
  const isPabx = model.includes('pabx') || name.includes('pabx');
  const isLSA = model.includes('lsa') || name.includes('lsa');
  const isFaceplate = model.includes('faceplate') || name.includes('faceplate');
  const isAP = model.includes('access point') || name.includes('ap-') || model.includes('unifi') || model.includes('eap');
  const isCore = name.includes('core') || name.includes('dist');

  if (isAP) {
      return <AccessPointChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
  }

  if (isSecurity) {
    return <SecurityChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
  }
  
  if (isPabx) {
    return <PabxChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
  }

  if (isLSA) {
    return <LsaChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
  }

  if (isFaceplate) {
    return <FaceplatePanel switchDetails={switchDetails} onPortClick={onPortClick} />;
  }
  
  if (isMikrotik) {
    return <MikrotikChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
  }

  if (isCore) {
    return <CoreChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
  }
  
  return <StandardChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
};

const AccessPointChassis: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full border-4 border-white shadow-inner flex items-center justify-center relative">
                <Wifi size={32} className="text-blue-500" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_8px_#10b981]"></div>
            </div>
            <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{switchDetails.model}</span>
                <h4 className="text-base font-bold text-slate-800">{switchDetails.name}</h4>
                <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                        <Radio size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">2.4 / 5 GHz Active</span>
                    </div>
                </div>
            </div>
            <div className="ml-auto flex gap-2">
                {(switchDetails.ports || []).map(port => (
                    <div key={port.id} onClick={() => onPortClick(port)} className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-black transition-all">
                        <Box size={14} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const CoreChassis: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    const ports = [...(switchDetails.ports || [])].sort((a, b) => a.portNumber - b.portNumber);
    const topRow = ports.filter(p => p.portNumber % 2 !== 0);
    const bottomRow = ports.filter(p => p.portNumber % 2 === 0);
    const columns = Math.ceil(ports.length / 2);

    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[850px] bg-[#0c111d] rounded-2xl p-4 shadow-2xl border border-[#1f2937] relative flex items-center h-32">
                <div className="flex flex-col gap-1 px-4 border-r border-slate-800/50 w-48 shrink-0">
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">{switchDetails.model}</span>
                    <span className="text-[12px] font-bold text-white tracking-tight">{switchDetails.name}</span>
                    <div className="flex gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <div className="flex-1 flex gap-2 items-center justify-center px-6">
                    {Array.from({ length: columns }).map((_, colIndex) => {
                        const tPort = topRow[colIndex];
                        const bPort = bottomRow[colIndex];
                        const isGroupEdge = (colIndex + 1) % 6 === 0 && colIndex !== columns - 1;
                        return (
                            <React.Fragment key={colIndex}>
                                <div className="flex flex-col gap-2">
                                    {tPort && <LEDPort port={tPort} onClick={() => onPortClick(tPort)} />}
                                    {bPort && <LEDPort port={bPort} onClick={() => onPortClick(bPort)} />}
                                </div>
                                {isGroupEdge && <div className="w-6 border-r border-slate-800/30 h-16 self-center"></div>}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="flex gap-3 px-4 border-l border-slate-800/50 shrink-0">
                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-700"><Server size={20} /></div>
                </div>
            </div>
        </div>
    );
};

const SecurityChassis: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    const model = (switchDetails.model || '').toLowerCase();
    const name = (switchDetails.name || '').toLowerCase();
    const isDvr = model.includes('dvr') || name.includes('dvr');
    const isNvr = !isDvr && (model.includes('nvr') || name.includes('nvr'));
    
    const displayPorts = isNvr ? (switchDetails.ports || []).slice(0, 1) : (switchDetails.ports || []);

    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className={`min-w-[850px] ${isDvr ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800'} rounded-2xl p-4 shadow-2xl border relative flex items-center h-28`}>
                <div className={`flex flex-col gap-1 px-4 border-r ${isDvr ? 'border-slate-700' : 'border-slate-800'} w-48 shrink-0`}>
                    <span className={`text-[8px] font-black ${isDvr ? 'text-blue-400' : 'text-purple-400'} uppercase tracking-widest`}>
                        {isDvr ? 'DVR ANALOG SYSTEM' : 'NVR IP SYSTEM'}
                    </span>
                    <span className="text-[12px] font-bold text-white tracking-tight">{switchDetails.name}</span>
                    <div className="flex items-center gap-2 mt-2">
                         <div className={`w-2 h-2 ${isDvr ? 'bg-blue-600 shadow-[0_0_8px_#3b82f6]' : 'bg-red-600 shadow-[0_0_8px_red]'} rounded-full animate-pulse`}></div>
                         <span className={`text-[8px] font-black ${isDvr ? 'text-blue-500' : 'text-red-500'} uppercase tracking-tighter`}>REC • LIVE</span>
                    </div>
                </div>

                <div className="flex-1 flex items-center px-8">
                    {isNvr ? (
                        <div className="flex items-center gap-6">
                            <div 
                                onClick={() => onPortClick(displayPorts[0])}
                                className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105
                                    ${displayPorts[0]?.status === PortStatus.ACTIVE 
                                        ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                        : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                            >
                                <Cable size={20} />
                                <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">LAN / RJ45</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Interface</span>
                                <span className="text-[9px] font-bold text-slate-400">IP Cameras via Switch Access</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {displayPorts.map(port => (
                                <div 
                                    key={port.id} 
                                    onClick={() => onPortClick(port)} 
                                    className={`flex items-center justify-center cursor-pointer transition-all w-10 h-10
                                        ${port.status === PortStatus.ACTIVE ? 'text-blue-400' : 'text-slate-600'}`}
                                >
                                    <BncPort status={port.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`px-4 ${isDvr ? 'text-slate-600' : 'text-slate-700'} shrink-0`}>
                    <Disc size={32} className="animate-spin-slow" />
                </div>
            </div>
        </div>
    );
};

const BncPort: React.FC<{ status: PortStatus }> = ({ status }) => (
    <div className="relative flex items-center justify-center">
        <div className={`w-8 h-8 rounded-full border-2 ${status === PortStatus.ACTIVE ? 'border-blue-500 bg-slate-900' : 'border-slate-700 bg-slate-900'} flex items-center justify-center`}>
            <div className={`w-4 h-4 rounded-full border ${status === PortStatus.ACTIVE ? 'border-blue-400 bg-blue-500/20 shadow-[0_0_4px_#3b82f6]' : 'border-slate-800 bg-slate-800'}`}></div>
        </div>
    </div>
);

const PabxChassis: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[850px] bg-slate-100 rounded-2xl p-4 shadow-xl border border-slate-300 relative flex items-center h-28">
                <div className="flex flex-col gap-1 px-4 border-r border-slate-300 w-48 shrink-0">
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">PABX ANALOG</span>
                    <span className="text-[12px] font-bold text-slate-800 tracking-tight">{switchDetails.name}</span>
                </div>
                <div className="flex-1 flex flex-wrap gap-2 px-8">
                    {(switchDetails.ports || []).map(port => (
                         <div key={port.id} onClick={() => onPortClick(port)} className={`w-7 h-10 rounded-sm border flex flex-col items-center justify-center cursor-pointer transition-all ${port.status === PortStatus.ACTIVE ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-300'}`}>
                            <span className="text-[7px] font-bold mb-1">{port.portNumber}</span>
                            <PhoneCall size={12} />
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LsaChassis: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[850px] bg-white rounded-xl p-4 shadow-md border border-slate-200 relative flex flex-col justify-center h-32">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 px-2">LSA DISCONNECTION MODULE</div>
                <div className="flex gap-1.5 items-center justify-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {(switchDetails.ports || []).map(port => (
                        <div key={port.id} onClick={() => onPortClick(port)} className="flex flex-col items-center gap-1 group cursor-pointer">
                            <div className={`w-4 h-12 rounded-[2px] border-x-2 border-slate-200 transition-all ${port.status === PortStatus.ACTIVE ? 'bg-blue-500 shadow-[0_0_4px_#3b82f6]' : 'bg-slate-300'}`}></div>
                            <span className="text-[8px] font-bold text-slate-400">{port.portNumber}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FaceplatePanel: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="grid grid-cols-6 md:grid-cols-12 gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                {(switchDetails.ports || []).map(port => (
                    <div key={port.id} onClick={() => onPortClick(port)} className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className={`w-14 h-14 bg-slate-50 border-2 rounded-xl flex items-center justify-center shadow-inner transition-all group-hover:scale-110 ${port.status === PortStatus.ACTIVE ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}>
                            <Square size={20} className={port.status === PortStatus.ACTIVE ? 'text-emerald-500' : 'text-slate-200'} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{port.patchPanelPort || `FP-${port.portNumber}`}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LEDPort: React.FC<{ port: SwitchPort; onClick: () => void }> = ({ port, onClick }) => {
    const isActive = port.status === PortStatus.ACTIVE;
    const isError = port.status === PortStatus.ERROR;
    let ledColor = 'bg-slate-800';
    if (isActive) ledColor = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
    else if (isError) ledColor = 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]';

    return (
        <div 
            onClick={onClick}
            className={`w-6 h-6 rounded border transition-all cursor-pointer group flex items-center justify-center ${isActive ? 'bg-[#1a2333] border-slate-700' : 'bg-[#111827] border-slate-800 hover:border-slate-600'}`}
        >
            <div className={`w-3 h-3 rounded-[1px] ${ledColor} transition-all`}></div>
        </div>
    );
};

const MikrotikChassis: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    const ports = [...(switchDetails.ports || [])].sort((a, b) => a.portNumber - b.portNumber);
    return (
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[800px] bg-[#d1d5db] rounded-lg p-6 shadow-xl border border-slate-400 relative">
                <div className="flex justify-between items-end">
                    <div className="flex gap-4 bg-white/40 p-3 rounded-xl border border-slate-400/50 shadow-inner overflow-x-auto custom-scrollbar">
                        {ports.map(port => (
                            <div key={port.id} onClick={() => onPortClick(port)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                                <span className="text-[9px] font-mono text-slate-600">{port.portNumber}</span>
                                <div className={`w-8 h-8 rounded border-2 transition-all ${port.status === PortStatus.ACTIVE ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-400 opacity-50'}`}>
                                    <div className={`w-full h-1 mt-1 ${port.status === PortStatus.ACTIVE ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]' : 'bg-slate-700'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                        <div className="font-black text-slate-800 text-2xl tracking-tight">Mikro<span className="text-slate-500">Tik</span></div>
                        <div className="font-bold text-slate-700 text-[10px] uppercase tracking-widest">{switchDetails.model}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StandardChassis: React.FC<SwitchVisualizerProps> = ({ switchDetails, onPortClick }) => {
    return <CoreChassis switchDetails={switchDetails} onPortClick={onPortClick} />;
};