
'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Router, Server, Wifi, Globe, Video, Download, Link2, X, Move, Plus, Minus, Maximize, Lock, Unlock, Grid3X3, Radio, HardDrive, Monitor, Printer, Smartphone, Phone } from 'lucide-react';
import { NetworkSwitch, PortStatus, DeviceType } from '../types';
import * as htmlToImage from 'html-to-image';

interface NodeProps {
    switchData: NetworkSwitch;
    x: number;
    y: number;
    scale: number;
    isSelected: boolean;
    isLocked: boolean;
    snapToGrid: boolean;
    onDragEnd: (id: string, x: number, y: number) => void;
    onSelect: (id: string) => void;
    onRelink?: (sw: any) => void;
    isInternet?: boolean;
    searchTerm?: string;
}

// Minimalist Dimensions
const NODE_WIDTH = 80;
const NODE_HEIGHT = 80;
const GRID_SIZE = 20;

const DiagramNode: React.FC<NodeProps> = ({ switchData, x, y, scale, isSelected, isLocked, snapToGrid, onDragEnd, onSelect, onRelink, isInternet, searchTerm = '' }) => {
    const [dragging, setDragging] = useState(false);
    const [localPos, setLocalPos] = useState({ x, y });
    const startMousePos = useRef({ x: 0, y: 0 });
    const startNodePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!dragging) {
            setLocalPos({ x, y });
        }
    }, [x, y, dragging]);

    const activePorts = switchData.ports.filter(p => p.status === PortStatus.ACTIVE).length;
    const usagePercent = (activePorts / (switchData.totalPorts || 1)) * 100;

    const getIconInfo = () => {
        if (isInternet) return { icon: Globe, color: 'text-emerald-500', isWireless: false };

        const m = (switchData.model || '').toLowerCase();
        const n = (switchData.name || '').toLowerCase();
        const id = (switchData.id || '');

        // Comprehensive Mapping for All Devices
        const isPC = m.includes('pc') || m.includes('computer') || m.includes('laptop') || m === DeviceType.PC.toLowerCase();
        const isServer = m.includes('server') || m === DeviceType.SERVER.toLowerCase();
        const isPrinter = m.includes('printer') || m === DeviceType.PRINTER.toLowerCase();
        const isCCTV = m.includes('cctv') || m.includes('camera') || m.includes('nvr') || m.includes('dvr') || m === DeviceType.CCTV.toLowerCase();
        const isPhone = m.includes('phone') || m.includes('voip') || m === DeviceType.IP_PHONE.toLowerCase();
        const isWireless = m.includes('access point') || n.includes('ap-') ||
            m.includes('wifi') || m.includes('unifi') ||
            m.includes('eap') || m === DeviceType.AP.toLowerCase();

        if (m.includes('mikrotik') || n.includes('router') || n.includes('core')) return { icon: Router, color: 'text-blue-500', isWireless: false };
        if (isWireless) return { icon: Wifi, color: 'text-cyan-400', isWireless: true };
        if (isCCTV) return { icon: Video, color: 'text-purple-500', isWireless: false };
        if (isServer) return { icon: Server, color: 'text-indigo-500', isWireless: false };
        if (isPC) return { icon: Monitor, color: 'text-blue-400', isWireless: false };
        if (isPrinter) return { icon: Printer, color: 'text-orange-500', isWireless: false };
        if (isPhone) return { icon: Phone, color: 'text-emerald-500', isWireless: false };
        if (m.includes('storage') || m.includes('nas')) return { icon: HardDrive, color: 'text-amber-500', isWireless: false };

        return { icon: Server, color: 'text-slate-400', isWireless: false };
    };

    const { icon: Icon, color, isWireless } = getIconInfo();

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isLocked) return;
        if ((e.target as HTMLElement).closest('button')) return;
        e.stopPropagation();
        onSelect(switchData.id);
        setDragging(true);
        startMousePos.current = { x: e.clientX, y: e.clientY };
        startNodePos.current = { x, y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            let dx = (e.clientX - startMousePos.current.x) / scale;
            let dy = (e.clientY - startMousePos.current.y) / scale;

            let nx = startNodePos.current.x + dx;
            let ny = startNodePos.current.y + dy;

            if (snapToGrid) {
                nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
                ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
            }

            setLocalPos({ x: nx, y: ny });
        };

        const handleMouseUp = () => {
            if (dragging) {
                setDragging(false);
                onDragEnd(switchData.id, localPos.x, localPos.y);
            }
        };

        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, scale, snapToGrid, onDragEnd, switchData.id, localPos]);

    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (usagePercent / 100) * circumference;

    const isInternetNode = switchData.id === 'internet';
    const isChild = switchData.id.startsWith('port-device-');
    const isMatched = !searchTerm || switchData.name.toLowerCase().includes(searchTerm.toLowerCase()) || (switchData.ip || '').toLowerCase().includes(searchTerm.toLowerCase());

    return (
        <div
            className={`absolute z-20 transition-all ${isChild ? 'scale-90' : ''} ${!isMatched ? 'opacity-20 grayscale-[0.5]' : 'opacity-100'}`}
            style={{ left: localPos.x, top: localPos.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
        >
            <div
                className={`relative w-full h-full flex items-center justify-center rounded-2xl transition-all border-2 cursor-pointer group ${isSelected ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]' :
                    isInternet ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                onMouseDown={handleMouseDown}
            >
                {!isInternet && !isInternetNode && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                            cx="40" cy="40" r={radius}
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            className="text-slate-800"
                        />
                        <circle
                            cx="40" cy="40" r={radius}
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            strokeDasharray={circumference}
                            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
                            className={isChild ? 'text-blue-400' : usagePercent > 80 ? 'text-rose-500' : usagePercent > 40 ? 'text-amber-500' : 'text-blue-500'}
                        />
                    </svg>
                )}

                <div className={`relative z-10 ${isSelected ? 'text-white' : color}`}>
                    <Icon size={isInternet || isInternetNode ? 36 : 28} strokeWidth={2.5} className={(isWireless || !isInternet && !isInternetNode) ? 'animate-pulse' : ''} />
                    {(isWireless || !isInternet && !isInternetNode) && (
                        <div className={`absolute -inset-4 border ${isWireless ? 'border-cyan-400/20' : 'border-blue-400/20'} rounded-full animate-ping pointer-events-none`}></div>
                    )}
                </div>

                {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-950"></div>
                )}

                {!isInternet && !isInternetNode && !isLocked && isSelected && !isChild && (
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRelink?.(switchData); }}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg shadow-xl hover:bg-blue-700 transition-all scale-75"
                    >
                        <Link2 size={14} />
                    </button>
                )}
            </div>

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center pointer-events-none w-max max-w-[140px] flex flex-col items-center gap-1">
                <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border backdrop-blur-md transition-all shadow-sm ${isSelected
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                    : 'text-slate-400 bg-slate-950/80 border-white/5'
                    }`}>
                    {switchData.name}
                </span>
                {switchData.ip && switchData.ip !== '-' && (
                    <span className="text-[7px] font-mono font-bold text-slate-500 bg-slate-900/40 px-1.5 py-0.5 rounded border border-white/5 backdrop-blur-sm">
                        {switchData.ip}
                    </span>
                )}
            </div>
        </div>
    );
};

interface TopologyDiagramProps {
    switches: NetworkSwitch[];
    internetPos: { x: number, y: number };
    onUpdateSwitches: (sws: NetworkSwitch[], internet?: { x: number, y: number }) => void;
    canManage?: boolean;
    searchTerm?: string;
}

export const TopologyDiagram: React.FC<TopologyDiagramProps> = ({ switches, internetPos, onUpdateSwitches, searchTerm = '' }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [relinkingSwitch, setRelinkingSwitch] = useState<NetworkSwitch | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [scale, setScale] = useState(0.85);
    const [offset, setOffset] = useState({ x: 100, y: 100 });
    const [isPanning, setIsPanning] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Path Highlighting Logic
    const activePathNodeIds = useMemo(() => {
        if (!selectedNodeId || selectedNodeId === 'internet') return new Set<string>();
        const path = new Set<string>();
        let currentId: string | undefined = selectedNodeId;
        while (currentId && currentId !== 'internet') {
            path.add(currentId);
            const node = switches.find(s => s.id === currentId);
            currentId = node?.uplinkId;
        }
        if (currentId === 'internet') path.add('internet');
        return path;
    }, [selectedNodeId, switches]);

    const matchesSearch = useCallback((sw: NetworkSwitch) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return sw.name.toLowerCase().includes(s) || (sw.ip || '').toLowerCase().includes(s) || (sw.model || '').toLowerCase().includes(s);
    }, [searchTerm]);

    const selectedNode = useMemo(() => {
        if (selectedNodeId === 'internet') return { id: 'internet', name: 'Main Core Hub', model: 'Edge Gateway', ip: 'Static ISP IP', totalPorts: 1, ports: [{ id: 'internet-port', portNumber: 1, status: PortStatus.ACTIVE }], rack: 'Core-01', location: 'External', uptime: 'Online' } as NetworkSwitch;
        return switches.find(s => s.id === selectedNodeId);
    }, [switches, selectedNodeId]);

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.92 : 1.08;
            setScale(prev => Math.min(Math.max(prev * delta, 0.15), 4));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        } else if (e.target === e.currentTarget) {
            setSelectedNodeId(null);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isPanning) return;
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        };
        const handleMouseUp = () => setIsPanning(false);

        if (isPanning) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanning]);

    const handleNodeDragEnd = useCallback((id: string, x: number, y: number) => {
        if (id === 'internet') {
            onUpdateSwitches(switches, { x, y });
        } else {
            onUpdateSwitches(switches.map(s => s.id === id ? { ...s, posX: x, posY: y } : s));
        }
    }, [switches, onUpdateSwitches]);

    const handleRelink = (swId: string, parentId: string) => {
        onUpdateSwitches(switches.map(s => s.id === swId ? { ...s, uplinkId: parentId } : s));
        setRelinkingSwitch(null);
    };

    const handleDownload = async () => {
        if (!diagramRef.current) return;
        let minX = internetPos.x, minY = internetPos.y, maxX = internetPos.x + NODE_WIDTH, maxY = internetPos.y + NODE_HEIGHT;
        switches.forEach(sw => {
            minX = Math.min(minX, sw.posX || 0); minY = Math.min(minY, sw.posY || 0);
            maxX = Math.max(maxX, (sw.posX || 0) + NODE_WIDTH); maxY = Math.max(maxY, (sw.posY || 0) + NODE_HEIGHT);
        });
        const padding = 100; const totalWidth = (maxX - minX) + (padding * 2); const totalHeight = (maxY - minY) + (padding * 2);
        const originalTransform = diagramRef.current.style.transform;
        diagramRef.current.style.transform = `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`;
        try {
            const dataUrl = await htmlToImage.toPng(diagramRef.current, { backgroundColor: '#080c14', quality: 1, pixelRatio: 2, width: totalWidth, height: totalHeight });
            const link = document.createElement('a'); link.download = `TOPOLOGY-${Date.now()}.png`; link.href = dataUrl; link.click();
        } catch (error) { alert('Export failed.'); } finally { diagramRef.current.style.transform = originalTransform; }
    };

    return (
        <div
            className="w-full h-full relative overflow-hidden bg-[#080c14] rounded-lg border border-slate-800 shadow-2xl select-none flex"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
        >
            <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="absolute bottom-6 left-6 z-[100] flex items-center gap-4">
                <div className="flex items-center bg-slate-900/80 backdrop-blur-2xl p-1 rounded-xl border border-white/5 shadow-2xl">
                    <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="p-2.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all"><Minus size={16} /></button>
                    <div className="px-3 text-[10px] font-black text-blue-500 font-mono tracking-tighter w-12 text-center">{Math.round(scale * 100)}%</div>
                    <button onClick={() => setScale(s => Math.min(s + 0.1, 4))} className="p-2.5 hover:bg-white/10 rounded-lg text-slate-400 transition-all"><Plus size={16} /></button>
                </div>

                <div className="flex items-center bg-slate-900/80 backdrop-blur-2xl p-1 rounded-xl border border-white/5 shadow-2xl">
                    <button onClick={() => setIsLocked(!isLocked)} className={`p-2.5 rounded-lg transition-all ${isLocked ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>
                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-2.5 rounded-lg transition-all ${snapToGrid ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>
                        <Grid3X3 size={16} />
                    </button>
                </div>

                <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 border border-white">
                    <Download size={16} /> Export
                </button>
            </div>

            {selectedNode && (
                <div className="absolute top-6 right-6 w-80 z-[100] bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-right-8 duration-500 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-slate-950/40">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] block mb-1">Identity node</span>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none truncate max-w-[200px]">{selectedNode.name}</h3>
                            </div>
                            <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-500"><X size={20} /></button>
                        </div>
                    </div>
                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Interface IP</span>
                                <span className="text-xs font-mono font-black text-blue-400">{(selectedNode as any).ip}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Rack Pos</span>
                                <span className="text-xs font-black text-white uppercase">{(selectedNode as any).rack}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-500 uppercase tracking-widest">Hardware Type</span>
                                <span className="text-white">{(selectedNode as any).model}</span>
                            </div>
                            {selectedNode.vlan && (
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase tracking-widest">Logic VLAN</span>
                                    <span className="text-blue-400">ID {selectedNode.vlan}</span>
                                </div>
                            )}
                            {selectedNode.ports?.[0]?.macAddress && (
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase tracking-widest">MAC Identity</span>
                                    <span className="text-slate-400 font-mono uppercase text-[9px]">{selectedNode.ports[0].macAddress}</span>
                                </div>
                            )}
                            {selectedNode.ports?.[0]?.linkSpeed && (
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-slate-500 uppercase tracking-widest">Link Quality</span>
                                    <span className="text-emerald-500">{selectedNode.ports[0].linkSpeed}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-500 uppercase tracking-widest">Load Factor</span>
                                <span className="text-emerald-500 font-mono">{(selectedNode.ports || []).filter((p: any) => p.status === PortStatus.ACTIVE).length} / {selectedNode.totalPorts} Nodes Active</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-500 uppercase tracking-widest">Uplink Target</span>
                                <span className="text-amber-500 uppercase">{selectedNode.uplinkId === 'internet' ? 'Internet Core Hub' : (switches.find(s => s.id === selectedNode.uplinkId)?.name || 'None/Internet')}</span>
                            </div>
                        </div>

                        <div className="h-24 w-full bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="flex items-center gap-1.5 opacity-40 mb-3">
                                {[3, 7, 4, 9, 5, 11, 6].map((h, i) => (
                                    <div key={i} className="w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <span className="text-[8px] font-mono font-black text-blue-500/60 uppercase tracking-[0.4em]">Monitoring Logical stream...</span>
                        </div>
                    </div>
                </div>
            )}

            <div
                ref={diagramRef}
                className="absolute inset-0 transition-transform duration-100 ease-out"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
            >
                <div
                    className="min-w-[5000px] min-h-[5000px] p-[1000px] relative"
                    style={{ backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}
                >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <defs>
                            <filter id="link-glow-fx" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {switches.map(sw => {
                            if (sw.id === 'internet') return null; // Avoid self-link for internet node
                            if (!sw.uplinkId || sw.posX === undefined || sw.posY === undefined) return null;
                            let startX, startY;
                            const isInternetLink = sw.uplinkId === 'internet' || sw.uplinkId === 'gateway' || sw.uplinkId === 'root';
                            if (isInternetLink) {
                                startX = internetPos.x + NODE_WIDTH / 2; startY = internetPos.y + NODE_HEIGHT / 2;
                            } else {
                                const parent = switches.find(p => p.id === sw.uplinkId);
                                if (!parent || parent.posX === undefined || parent.posY === undefined) return null;
                                // Avoid zero-length lines
                                if (Math.abs(parent.posX - sw.posX) < 5 && Math.abs(parent.posY - sw.posY) < 5) return null;
                                startX = parent.posX + NODE_WIDTH / 2; startY = parent.posY + NODE_HEIGHT / 2;
                            }
                            const endX = sw.posX + NODE_WIDTH / 2; const endY = sw.posY + NODE_HEIGHT / 2;

                            // Prevent zero-length path
                            if (Math.abs(startX - endX) < 1 && Math.abs(startY - endY) < 1) return null;

                            const pathData = `M ${startX} ${startY} C ${startX} ${startY + (endY - startY) * 0.5}, ${endX} ${endY - (endY - startY) * 0.5}, ${endX} ${endY}`;

                            // VLAN-based Color Mapping
                            let color = isInternetLink ? '#10b981' : '#3b82f6';
                            if (sw.vlan) {
                                if (sw.vlan === 10) color = '#22d3ee'; // Cyan
                                else if (sw.vlan === 20) color = '#fbbf24'; // Amber
                                else if (sw.vlan === 30) color = '#f472b6'; // Pink
                                else if (sw.vlan > 50) color = '#a78bfa'; // Violet
                            }
                            const isPathActive = activePathNodeIds.has(sw.id) && (sw.uplinkId === 'internet' ? activePathNodeIds.has('internet') : activePathNodeIds.has(sw.uplinkId));

                            // High Visibility for Internet Links
                            const strokeWidth = isInternetLink ? 1.5 : (isPathActive ? 2.5 : 1);
                            const opacity = isInternetLink ? 'opacity-60' : (isPathActive ? 'opacity-40' : 'opacity-10');
                            const dashedOpacity = isInternetLink ? 'opacity-100' : (isPathActive ? 'opacity-100' : 'opacity-40');

                            return (
                                <g key={`link-${sw.id}`} className={searchTerm && !matchesSearch(sw) ? 'opacity-10' : 'opacity-100'}>
                                    <path d={pathData} stroke={color} strokeWidth={strokeWidth} fill="none" className={opacity} />
                                    <path d={pathData} stroke={color} strokeWidth={strokeWidth} strokeDasharray={isPathActive ? '10,10' : '4,12'} fill="none" className={dashedOpacity} filter="url(#link-glow-fx)">
                                        <animate attributeName="stroke-dashoffset" from="100" to="0" dur={isPathActive ? '3s' : '6s'} repeatCount="indefinite" />
                                    </path>

                                    {/* Connection Label (Port Info) */}
                                    {sw.uplinkPort && (
                                        <g transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2})`}>
                                            <rect x="-15" y="-8" width="30" height="16" rx="4" className="fill-slate-900/90 stroke-white/10" />
                                            <text y="3" textAnchor="middle" className="text-[8px] font-bold fill-slate-300 pointer-events-none uppercase tracking-tighter">
                                                P{sw.uplinkPort}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    <DiagramNode
                        switchData={{ id: 'internet', name: 'ISP CORE HUB', model: 'Gateway', ip: 'Public Static', totalPorts: 1, ports: [{ id: 'internet-p1', portNumber: 1, status: PortStatus.ACTIVE }], uptime: 'Online', location: 'External', rack: 'Core' } as NetworkSwitch}
                        x={internetPos.x} y={internetPos.y} scale={scale} isSelected={selectedNodeId === 'internet'} isLocked={isLocked} snapToGrid={snapToGrid} onDragEnd={handleNodeDragEnd} onSelect={setSelectedNodeId} isInternet searchTerm={searchTerm}
                    />

                    {switches.map(sw => (
                        <DiagramNode
                            key={sw.id}
                            switchData={sw}
                            x={sw.posX || 0}
                            y={sw.posY || 0}
                            scale={scale}
                            isSelected={selectedNodeId === sw.id}
                            isLocked={isLocked}
                            snapToGrid={snapToGrid}
                            onDragEnd={handleNodeDragEnd}
                            onSelect={setSelectedNodeId}
                            onRelink={setRelinkingSwitch}
                            searchTerm={searchTerm}
                        />
                    ))}
                </div>
            </div>

            {relinkingSwitch && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/10">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <div className="text-left">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Reroute link</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">Node: {relinkingSwitch.name}</p>
                                </div>
                                <button onClick={() => setRelinkingSwitch(null)} className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 transition-all border border-white/5"><X size={20} /></button>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-3">
                                <button onClick={() => handleRelink(relinkingSwitch.id, 'internet')} className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all ${relinkingSwitch.uplinkId === 'internet' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/5 border-white/5 hover:border-blue-500'}`}>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"><Globe size={20} /></div>
                                    <div className="text-left"><span className="text-xs font-black uppercase text-white tracking-widest">ISP Gateway</span></div>
                                </button>
                                {switches.filter(s => s.id !== relinkingSwitch.id && !s.id.startsWith('port-device-')).map(sw => (
                                    <button key={sw.id} onClick={() => handleRelink(relinkingSwitch.id, sw.id)} className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all ${relinkingSwitch.uplinkId === sw.id ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/5 hover:border-blue-500'}`}>
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center border border-white/5"><Router size={20} /></div>
                                        <div className="text-left"><span className="text-xs font-black uppercase text-white tracking-widest">{sw.name}</span></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
