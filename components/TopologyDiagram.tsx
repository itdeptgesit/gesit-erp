
'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Router, Server, Wifi, Globe, Video, Download, Link2, X, Move, Plus, Minus, Maximize, Minimize, Info, Lock, Unlock, Grid3X3, Radio, HardDrive, Monitor, Printer, Smartphone, Phone, LayoutTemplate, Trash2, Search, Pencil } from 'lucide-react';
import { NetworkSwitch, PortStatus, DeviceType } from '../types';
import * as htmlToImage from 'html-to-image';
import { useToast } from './ToastProvider';

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
    onDoubleClick?: (sw: NetworkSwitch) => void;
    onRelink?: (sw: any) => void;
    isInternet?: boolean;
    searchTerm?: string;
    tier?: string;
    isWiringMode?: boolean;
    isImpacted?: boolean;
}

// Minimalist Dimensions
const NODE_WIDTH = 80;
const NODE_HEIGHT = 80;
const GRID_SIZE = 20;

const getIconForType = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('isp') || t.includes('internet') || t.includes('uplink') || t.includes('cloud')) return Globe;
    if (t.includes('mikrotik') || t.includes('router') || t.includes('core')) return Router;
    if (t.includes('wifi') || t.includes('ap') || t.includes('access point')) return Wifi;
    if (t.includes('cctv') || t.includes('camera') || t.includes('nvr') || t.includes('dvr')) return Video;
    if (t.includes('server')) return Server;
    if (t.includes('pc') || t.includes('laptop') || t.includes('computer')) return Monitor;
    if (t.includes('printer')) return Printer;
    if (t.includes('phone') || t.includes('voip')) return Phone;
    if (t.includes('storage') || t.includes('nas') || t.includes('harddrive')) return HardDrive;
    return Server;
};

const DiagramNode: React.FC<NodeProps> = React.memo(({ switchData, x, y, scale, isSelected, isLocked, snapToGrid, onDragEnd, onSelect, onDoubleClick, onRelink, isInternet, searchTerm = '', tier, isWiringMode, isImpacted }) => {
    const [dragging, setDragging] = useState(false);
    const [localPos, setLocalPos] = useState({ x, y });
    const startMousePos = useRef({ x: 0, y: 0 });
    const startNodePos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x, y });
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        if (!dragging) {
            setLocalPos({ x, y });
            currentPos.current = { x, y };
        }
    }, [x, y, dragging]);

    const activePorts = switchData.ports.filter(p => p.status === PortStatus.ACTIVE).length;
    const usagePercent = (activePorts / (switchData.totalPorts || 1)) * 100;

    const getIconInfo = () => {
        if (isInternet) return { icon: Globe, color: 'text-emerald-400', isWireless: false };

        const m = (switchData.model || '').toLowerCase();
        const n = (switchData.name || '').toLowerCase();

        // Exact Type Mapping
        const type = switchData.model as DeviceType;

        // Comprehensive Mapping for All Devices
        if (type === DeviceType.ROUTER || m.includes('mikrotik') || n.includes('router') || n.includes('core')) return { icon: Router, color: 'text-blue-400', isWireless: false };
        if (type === DeviceType.AP || m.includes('access point') || n.includes('ap-') || m.includes('wifi') || m.includes('unifi')) return { icon: Wifi, color: 'text-cyan-400', isWireless: true };
        if (type === DeviceType.CCTV || type === DeviceType.NVR || type === DeviceType.DVR || m.includes('cctv') || m.includes('camera')) return { icon: Video, color: 'text-purple-400', isWireless: false };
        if (type === DeviceType.SERVER || m.includes('server')) return { icon: Server, color: 'text-indigo-400', isWireless: false };
        if (type === DeviceType.PC || m.includes('pc') || m.includes('laptop')) return { icon: Monitor, color: 'text-sky-400', isWireless: false };
        if (type === DeviceType.PRINTER || m.includes('printer')) return { icon: Printer, color: 'text-orange-400', isWireless: false };
        if (type === DeviceType.IP_PHONE || type === DeviceType.ANALOG_PHONE || m.includes('phone') || m.includes('voip')) return { icon: Phone, color: 'text-emerald-400', isWireless: false };
        if (m.includes('storage') || m.includes('nas')) return { icon: HardDrive, color: 'text-amber-400', isWireless: false };

        return { icon: Server, color: 'text-slate-400', isWireless: false };
    };

    const { icon: Icon, color, isWireless } = getIconInfo();

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.stopPropagation();
        onSelect(switchData.id);

        if (isLocked || isWiringMode) return;

        setDragging(true);
        startMousePos.current = { x: e.clientX, y: e.clientY };
        startNodePos.current = { x, y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return;
            if (rafId.current) return;

            rafId.current = requestAnimationFrame(() => {
                let dx = (e.clientX - startMousePos.current.x) / scale;
                let dy = (e.clientY - startMousePos.current.y) / scale;

                let nx = startNodePos.current.x + dx;
                let ny = startNodePos.current.y + dy;

                if (snapToGrid) {
                    nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
                    ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
                }

                currentPos.current = { x: nx, y: ny };
                setLocalPos({ x: nx, y: ny });
                rafId.current = null;
            });
        };

        const handleMouseUp = () => {
            if (dragging) {
                if (rafId.current) cancelAnimationFrame(rafId.current);
                rafId.current = null;
                setDragging(false);
                onDragEnd(switchData.id, currentPos.current.x, currentPos.current.y);
            }
        };

        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [dragging, scale, snapToGrid, onDragEnd, switchData.id]);

    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (usagePercent / 100) * circumference;

    const isInternetNode = switchData.id === 'internet';
    const isChild = switchData.id.startsWith('port-device-');
    const isMatched = !searchTerm ||
        switchData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (switchData.ip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (switchData.model || '').toLowerCase().includes(searchTerm.toLowerCase());

    return (
        <div
            className={`absolute z-20 transition-all ${isChild ? 'scale-90' : ''} ${!isMatched ? 'opacity-20 grayscale-[0.5]' : 'opacity-100'}`}
            style={{ left: localPos.x, top: localPos.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
        >
            <div
                className={`relative w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 group ${isSelected ? 'bg-blue-600 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.4)] scale-110 z-50' :
                    isImpacted ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)] z-30 animate-pulse' :
                        isInternet ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] z-10' : 'border-white/10 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-800/80 z-10'
                    }`}
                onMouseDown={handleMouseDown}
                onDoubleClick={() => onDoubleClick?.(switchData)}
            >
                {/* Node Glow Backdrop */}
                <div className={`absolute inset-0 rounded-2xl blur-xl opacity-20 transition-all ${isSelected ? 'bg-blue-500' : isInternet ? 'bg-emerald-500' : 'bg-transparent'}`} />

                {/* Search Highlight Pulse */}
                {searchTerm && isMatched && (
                    <div className="absolute -inset-2 border-2 border-blue-400 rounded-3xl animate-[ping_2s_infinite] opacity-40 pointer-events-none" />
                )}

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

                <div className={`relative z-10 ${isSelected ? 'text-white' : isImpacted ? 'text-rose-500 animate-pulse' : color}`}>
                    {isInternet ? (
                        <div className="relative">
                            <Icon size={36} strokeWidth={2.5} />
                            {getIconForType(switchData.model) !== Icon && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xl">
                                    {React.createElement(getIconForType(switchData.model), { size: 12, className: "text-slate-900" })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Icon size={28} strokeWidth={2.5} className={(isWireless || isChild || isImpacted) ? 'animate-pulse' : ''} />
                    )}
                    {(isWireless || isChild || isImpacted) && (
                        <div className={`absolute -inset-4 border ${isImpacted ? 'border-rose-500/30' : isWireless ? 'border-cyan-400/20' : 'border-blue-400/20'} rounded-full animate-ping pointer-events-none`}></div>
                    )}
                </div>

                {isSelected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-950"></div>
                )}

                {(switchData as any).isGroup && (
                    <div className="absolute -top-4 -right-4 w-9 h-9 bg-blue-600 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-2xl z-20 group-hover:scale-110 transition-transform">
                        <span className="text-xs font-black text-white">{(switchData as any).totalPorts}</span>
                    </div>
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

            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center pointer-events-none w-max max-w-[140px] flex flex-col items-center gap-0.5">
                {tier && (
                    <span className="text-[6px] font-black uppercase tracking-[0.2em] text-blue-500/80 mb-0.5">{tier}</span>
                )}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm transition-all shadow-sm ${isSelected
                    ? 'text-blue-300 bg-blue-500/20 border border-blue-400/40'
                    : 'text-slate-300 bg-slate-900/60 border border-slate-700/50'
                    }`}>
                    {switchData.name}
                </span>
                {switchData.ip && switchData.ip !== '-' && (
                    <span className="text-[7px] font-mono font-semibold text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/30 backdrop-blur-sm">
                        {switchData.ip}
                    </span>
                )}
            </div>
        </div>
    );
});

DiagramNode.displayName = 'DiagramNode';

const TopologyLink = React.memo(({ sw, internetPos, switches, activePathNodeIds, searchTerm, matchesSearch, coreNodeId }: any) => {
    const [isHovered, setIsHovered] = useState(false);
    let startX, startY;
    const isInternetLink = sw.uplinkId === 'internet' || sw.uplinkId === 'gateway' || sw.uplinkId === 'root' || (coreNodeId && String(sw.uplinkId) === String(coreNodeId));
    if (isInternetLink) {
        startX = internetPos.x + NODE_WIDTH / 2;
        startY = internetPos.y + NODE_HEIGHT / 2;
    } else {
        const parent = switches.find((p: any) => String(p.id) === String(sw.uplinkId));
        if (!parent || parent.posX === undefined || parent.posY === undefined) return null;
        startX = parent.posX + NODE_WIDTH / 2;
        startY = parent.posY + NODE_HEIGHT / 2;
    }
    const endX = sw.posX + NODE_WIDTH / 2;
    const endY = sw.posY + NODE_HEIGHT / 2;

    if (Math.abs(startX - endX) < 1 && Math.abs(startY - endY) < 1) return null;

    // Organic "Smooth S" Bezier Curve
    const midY = startY + (endY - startY) * 0.45;
    const pathData = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${startY + (endY - startY) * 0.55}, ${endX} ${endY}`;

    // Dynamic Link Styling based on Child Usage
    const activePorts = sw.ports?.filter((p: any) => p.status === PortStatus.ACTIVE).length || 0;
    const totalPorts = sw.totalPorts || 1;
    const usagePercent = (activePorts / totalPorts) * 100;

    // Determine path speed based on tier/type (Hypothetical)
    const isHighSpeed = sw.model === 'Router' || sw.model === 'Server';
    const animationDur = isHighSpeed ? '1.5s' : (usagePercent > 70 ? '3s' : '5s');

    let color = isInternetLink ? '#10b981' : '#3b82f6';
    if (usagePercent > 85) color = '#f43f5e'; // Rose for overload
    else if (usagePercent > 60) color = '#f59e0b'; // Amber for high cap
    else if (sw.vlan) {
        if (sw.vlan === 10) color = '#22d3ee';
        else if (sw.vlan === 20) color = '#fbbf24';
        else if (sw.vlan === 30) color = '#f472b6';
        else if (sw.vlan > 50) color = '#a78bfa';
    }
    const isPathActive = (activePathNodeIds.has(String(sw.id)) && (isInternetLink ? (activePathNodeIds.has('internet') || (coreNodeId && activePathNodeIds.has(String(coreNodeId)))) : activePathNodeIds.has(String(sw.uplinkId)))) || isHovered;

    const strokeWidth = isInternetLink ? 3 : (isPathActive ? 4 : (usagePercent > 70 ? 2.5 : 2));
    const opacity = isInternetLink ? 'opacity-100' : (isPathActive ? 'opacity-100' : 'opacity-70');
    const pulseScale = isPathActive ? 1.8 : 1;

    return (
        <g
            className={`transition-all duration-300 ${searchTerm && !matchesSearch(sw) ? 'opacity-10' : 'opacity-100'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Hit Area for Hover */}
            <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer" />

            {/* Base Connection Path */}
            <path d={pathData} stroke={color} strokeWidth={strokeWidth} fill="none" className={`${opacity} transition-all duration-300`} />

            {/* Glowing Solid Path */}
            <path d={pathData} stroke={color} strokeWidth={strokeWidth} fill="none" className="opacity-100" filter="url(#link-glow-fx)" />

            {/* Travel Pulse (Data Packet Animation) */}
            <circle r={2 * pulseScale} fill={color} filter="url(#link-glow-fx)">
                <animateMotion path={pathData} dur={animationDur} repeatCount="indefinite" />
            </circle>
            <circle r={3 * pulseScale} fill={color} className="opacity-30">
                <animateMotion path={pathData} dur={animationDur} repeatCount="indefinite" />
            </circle>

            {/* Label Badge */}
            {sw.uplinkPort && (
                <g transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2})`} className={`transition-all duration-300 ${isPathActive ? 'scale-110' : 'scale-90 opacity-60'}`}>
                    <rect x="-18" y="-9" width="36" height="18" rx="6" className="fill-slate-900/90 stroke-white/20 backdrop-blur-xl" />
                    <text y="4" textAnchor="middle" className="text-[9px] font-black fill-white pointer-events-none uppercase tracking-tighter">
                        P{sw.uplinkPort}
                    </text>
                </g>
            )}
        </g>
    );
});

TopologyLink.displayName = 'TopologyLink';

export interface TopologyDiagramProps {
    switches: NetworkSwitch[];
    internetPos: { x: number, y: number };
    onUpdateSwitches: (sws: NetworkSwitch[], internet?: { x: number, y: number }) => void;
    canManage?: boolean;
    searchTerm?: string;
    isLocked?: boolean;
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
    onViewProfile?: (device: NetworkSwitch) => void;
    centeringTrigger?: number;
    coreNodeId?: string | number;
    onAddNode?: (type: any, x: number, y: number) => void;
    onDeleteNode?: (id: string) => void;
    onEditNode?: (device: any) => void;
    onConnectNodes?: (childId: string, parentId: string) => void;
    onWipeAll?: () => void;
}

export const TopologyDiagram: React.FC<TopologyDiagramProps> = ({
    switches,
    internetPos,
    onUpdateSwitches,
    searchTerm = '',
    isLocked = false,
    selectedNodeId,
    setSelectedNodeId,
    onViewProfile,
    centeringTrigger = 0,
    coreNodeId,
    onAddNode,
    onDeleteNode,
    onEditNode,
    onConnectNodes,
    onWipeAll,
    canManage = true
}) => {
    const [paletteSearch, setPaletteSearch] = useState('');
    const { showToast } = useToast();
    const diagramRef = useRef<HTMLDivElement>(null);
    const [relinkingSwitch, setRelinkingSwitch] = useState<NetworkSwitch | null>(null);
    // Removed local selectedNodeId state as it's now a prop

    const [scale, setScale] = useState(0.85);
    const [offset, setOffset] = useState({ x: 100, y: 100 });
    const [isPanning, setIsPanning] = useState(false);
    const [isUiLocked, setIsUiLocked] = useState(isLocked);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [viewMode, setViewMode] = useState<'simplified' | 'detailed'>('simplified');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const lastMousePos = useRef({ x: 0, y: 0 });

    // New Manual Assembly States
    const [isWiringMode, setIsWiringMode] = useState(false);
    const [wiringStartNodeId, setWiringStartNodeId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [draggedTemplate, setDraggedTemplate] = useState<DeviceType | null>(null);

    const centerView = useCallback(() => {
        if (!diagramRef.current || !diagramRef.current.parentElement) return;

        const viewport = diagramRef.current.parentElement;
        const vRect = viewport.getBoundingClientRect();
        if (vRect.width === 0 || vRect.height === 0) return;

        // Calculate bounding box
        let minX = internetPos.x, minY = internetPos.y, maxX = internetPos.x + NODE_WIDTH, maxY = internetPos.y + NODE_HEIGHT;
        switches.forEach(sw => {
            minX = Math.min(minX, sw.posX || 0);
            minY = Math.min(minY, sw.posY || 0);
            maxX = Math.max(maxX, (sw.posX || 0) + NODE_WIDTH);
            maxY = Math.max(maxY, (sw.posY || 0) + NODE_HEIGHT);
        });

        const padding = 60;
        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;

        // Calculate optimal scale to fit box with padding
        const scaleX = (vRect.width - padding * 2) / boxWidth;
        const scaleY = (vRect.height - padding * 2) / boxHeight;
        const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.1); // Range [0.4, 1.1]

        // Calculate offset to center the box
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const newOffsetX = vRect.width / 2 - (centerX * newScale);
        const newOffsetY = vRect.height / 2 - (centerY * newScale);

        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
    }, [switches, internetPos]);

    // Handle centering trigger
    useEffect(() => {
        if (centeringTrigger > 0) {
            centerView();
        }
    }, [centeringTrigger, centerView]);

    // Initial centering
    useEffect(() => {
        const timer = setTimeout(centerView, 500);
        return () => clearTimeout(timer);
    }, [centerView]);

    // Path Highlighting Logic
    const activePathNodeIds = useMemo(() => {
        if (!selectedNodeId || selectedNodeId === 'internet') return new Set<string>();
        const path = new Set<string>();
        let currentId: string | undefined = selectedNodeId;
        while (currentId && String(currentId) !== 'internet') {
            path.add(String(currentId));
            const node = switches.find(s => String(s.id) === String(currentId));
            currentId = node?.uplinkId;
        }
        if (String(currentId) === 'internet') path.add('internet');
        return path;
    }, [selectedNodeId, switches]);

    // Impact Analysis: Calculate downstream nodes
    const impactedNodeIds = useMemo(() => {
        if (!selectedNodeId) return new Set<string>();
        const impacted = new Set<string>();
        const queue = [selectedNodeId];
        const visited = new Set<string>([selectedNodeId]);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            // Find all nodes that have this as their uplink
            switches.forEach(sw => {
                if (String(sw.uplinkId) === String(currentId) && !visited.has(String(sw.id))) {
                    impacted.add(String(sw.id));
                    visited.add(String(sw.id));
                    queue.push(String(sw.id));
                }
            });
        }
        return impacted;
    }, [selectedNodeId, switches]);

    const nodeTiers = useMemo(() => {
        const tiers = new Map<string, string>();
        switches.forEach(sw => {
            if (sw.id === 'internet') {
                tiers.set(sw.id, 'Core Gateway');
            } else if (sw.uplinkId === 'internet' || (coreNodeId && sw.id.toString() === coreNodeId.toString())) {
                tiers.set(sw.id, 'Infrastructure');
            } else if (sw.id.startsWith('port-device-')) {
                tiers.set(sw.id, 'Endpoint');
            } else {
                tiers.set(sw.id, 'Distribution');
            }
        });
        return tiers;
    }, [switches, coreNodeId]);

    const matchesSearch = useCallback((sw: NetworkSwitch) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return sw.name.toLowerCase().includes(s) || (sw.ip || '').toLowerCase().includes(s) || (sw.model || '').toLowerCase().includes(s);
    }, [searchTerm]);


    // Dynamic Templates based on unique models and types in data
    const dynamicPaletteItems = useMemo(() => {
        const items = new Map<string, { type: DeviceType, icon: any, label: string }>();

        // Add defaults first so palette is never empty
        items.set('ISP', { type: DeviceType.UPLINK, icon: Globe, label: 'Cloud / ISP' });
        items.set('Router', { type: DeviceType.ROUTER, icon: Router, label: 'Router' });
        items.set('Mikrotik', { type: DeviceType.ROUTER, icon: Router, label: 'Mikrotik' });
        items.set('Switch', { type: DeviceType.ROUTER, icon: Server, label: 'Switch' });
        items.set('AP', { type: DeviceType.AP, icon: Wifi, label: 'Access Point' });
        items.set('CCTV', { type: DeviceType.CCTV, icon: Video, label: 'Camera' });
        items.set('PC', { type: DeviceType.PC, icon: Monitor, label: 'Station' });

        // Add unique models from active switches
        switches.forEach(sw => {
            if (sw.id.startsWith('port-device-') || sw.id === 'internet') return;
            const model = sw.model || 'Unknown';
            if (model && model !== '-' && !items.has(model)) {
                items.set(model, {
                    type: sw.model as DeviceType,
                    icon: getIconForType(sw.model),
                    label: model
                });
            }
        });

        return Array.from(items.values());
    }, [switches]);

    // Existing actual nodes list for the palette
    const existingNodesPalette = useMemo(() => {
        return switches
            .filter(sw => !sw.id.startsWith('port-device-') && sw.id !== 'internet')
            .filter(sw => !paletteSearch ||
                sw.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
                (sw.model || '').toLowerCase().includes(paletteSearch.toLowerCase())
            );
    }, [switches, paletteSearch]);

    const paletteItems = dynamicPaletteItems;

    const toggleWiringMode = () => {
        setIsWiringMode(!isWiringMode);
        setWiringStartNodeId(null);
        if (!isWiringMode) {
            showToast('Wiring Mode: Select Source (Child) node', 'info');
        }
    };

    const selectedNode = useMemo(() => {
        if (String(selectedNodeId) === 'internet') return { id: 'internet', name: 'Main Core Hub', model: 'Edge Gateway', ip: 'Static ISP IP', totalPorts: 1, ports: [{ id: 'internet-port', portNumber: 1, status: PortStatus.ACTIVE }], rack: 'Core-01', location: 'External', uptime: 'Online' } as NetworkSwitch;
        return switches.find(s => String(s.id) === String(selectedNodeId));
    }, [switches, selectedNodeId]);

    const handleNodeSelect = (id: string | null) => {
        if (isWiringMode && id) {
            // Check if user is trying to make internet the source (it cannot be a child)
            if (!wiringStartNodeId && String(id) === 'internet') {
                showToast("The Internet Hub cannot be a source. Select a device first, then link it to the hub.", "warning");
                return;
            }

            if (!wiringStartNodeId) {
                setWiringStartNodeId(id);
                showToast(`Source [Child] selected. Now click the Target [Parent] node.`, 'info');
            } else if (String(wiringStartNodeId) === String(id)) {
                setWiringStartNodeId(null);
                showToast(`Wiring cancelled`, 'info');
            } else {
                // Connect them
                onConnectNodes?.(wiringStartNodeId, id);
                setWiringStartNodeId(null);
                setIsWiringMode(false);
                // The establishment toast will be shown by the parent handler upon success
            }
            return;
        }
        setSelectedNodeId(id);
    };

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
            handleNodeSelect(null);
            if (isWiringMode) {
                setIsWiringMode(false);
                setWiringStartNodeId(null);
            }
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

    // Track mouse position for wiring preview
    useEffect(() => {
        if (!isWiringMode || !wiringStartNodeId) return;

        const handleMouseMoveGlobal = (e: MouseEvent) => {
            if (!diagramRef.current) return;
            const rect = diagramRef.current.parentElement!.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            setMousePos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMoveGlobal);
        return () => window.removeEventListener('mousemove', handleMouseMoveGlobal);
    }, [isWiringMode, wiringStartNodeId, offset, scale]);

    const handleNodeDragEnd = useCallback((id: string, x: number, y: number) => {
        if (id === 'internet') {
            onUpdateSwitches(switches, { x, y });
        } else {
            onUpdateSwitches(switches.map(s => String(s.id) === String(id) ? { ...s, posX: x, posY: y } : s));
        }
    }, [switches, onUpdateSwitches]);

    const handleRelink = (swId: string, parentId: string) => {
        onConnectNodes?.(swId, parentId);
        setRelinkingSwitch(null);
        showToast(`Route updated`, 'success');
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
        } catch (error) { showToast('Export failed.', 'error'); } finally { diagramRef.current.style.transform = originalTransform; }
    };

    const handleAutoLayout = useCallback(() => {
        // Hierarchical Auto Layout Algorithm
        // 1. Identification: Identify `internet` as root (Level 0)
        // 2. Grouping: Group nodes by level (BFS from root)
        // 3. Positioning: Assign Y based on level, distribute X based on count

        const LEVEL_HEIGHT = 180;
        const NODE_SPACING_X = 140;

        // Map to store children for each parent
        const childrenMap: Record<string, string[]> = {
            'internet': []
        };

        switches.forEach(s => {
            const parentId = s.uplinkId === 'gateway' ? 'internet' : (s.uplinkId || 'internet');
            if (!childrenMap[parentId]) childrenMap[parentId] = [];
            childrenMap[parentId].push(s.id);
        });

        // BFS to determine levels and order
        const levels: Record<number, string[]> = {};
        const queue: { id: string, level: number }[] = [{ id: 'internet', level: 0 }];
        const visited = new Set<string>(['internet']);

        // Also add orphan nodes to level 1 for now if they have no parent? Or ignore?
        // Let's attach unlinked nodes to 'internet' logically for layout if they have no valid parent
        const allNodeIds = new Set(switches.map(s => s.id));

        while (queue.length > 0) {
            const { id, level } = queue.shift()!;

            if (!levels[level]) levels[level] = [];
            if (id !== 'internet') levels[level].push(id); // Don't add internet to levels array for positioning switches, it has fixed pos

            const children = childrenMap[id] || [];
            children.forEach(childId => {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    queue.push({ id: childId, level: level + 1 });
                }
            });
        }

        // Handle disconnected components?? Put them on Level 1
        switches.forEach(s => {
            if (!visited.has(s.id)) {
                if (!levels[1]) levels[1] = [];
                levels[1].push(s.id);
            }
        });

        // Calculate new positions
        const newSwitches = switches.map(s => ({ ...s }));
        const centerX = internetPos.x;
        const startY = internetPos.y;

        Object.keys(levels).forEach(lvlStr => {
            const level = parseInt(lvlStr);
            const nodesInLevel = levels[level];
            if (nodesInLevel.length === 0) return;

            const totalWidth = (nodesInLevel.length - 1) * NODE_SPACING_X;
            let startX = centerX - (totalWidth / 2); // Center align relative to Internet

            nodesInLevel.forEach((nodeId, index) => {
                const nodeIndex = newSwitches.findIndex(s => s.id === nodeId);
                if (nodeIndex !== -1) {
                    newSwitches[nodeIndex].posX = startX + (index * NODE_SPACING_X);
                    newSwitches[nodeIndex].posY = startY + (level * LEVEL_HEIGHT);
                }
            });
        });

        onUpdateSwitches(newSwitches);
        // Reset view to center on root
        setOffset({ x: window.innerWidth / 2 - internetPos.x, y: 100 });
        setScale(0.8);
    }, [switches, internetPos, onUpdateSwitches]);

    const processedData = useMemo(() => {
        if (viewMode === 'detailed') return { displaySwitches: switches, displayLinks: switches };

        const groups: Record<string, { type: string, count: number, parentId: string, nodes: any[] }> = {};
        const standalone: any[] = [];
        const links: any[] = [];

        switches.forEach(sw => {
            // Only group devices that are explicitly marked as port devices or typical leaf devices
            const isLeaf = sw.id.toString().startsWith('port-device-') ||
                ['CCTV', 'PC', 'Printer', 'Phone', 'Access Point'].includes(sw.model);

            if (isLeaf && sw.uplinkId && !expandedGroups.has(sw.uplinkId + '-' + sw.model)) {
                const groupKey = `${sw.uplinkId}-${sw.model}`;
                if (!groups[groupKey]) {
                    groups[groupKey] = { type: sw.model, count: 0, parentId: sw.uplinkId, nodes: [] };
                }
                groups[groupKey].count++;
                groups[groupKey].nodes.push(sw);
            } else {
                standalone.push(sw);
            }
        });

        // Convert groups to pseudo-nodes
        const groupedNodes = Object.entries(groups).map(([key, group]: [string, any]) => {
            const avgX = group.nodes.reduce((sum: number, n: any) => sum + (n.posX || 0), 0) / group.count;
            const avgY = group.nodes.reduce((sum: number, n: any) => sum + (n.posY || 0), 0) / group.count;

            return {
                id: `group-${key}`,
                name: `${group.count} ${group.type}s`,
                model: group.type,
                posX: avgX,
                posY: avgY,
                uplinkId: group.parentId,
                isGroup: true,
                groupKey: key,
                ports: [],
                totalPorts: group.count
            };
        });

        return {
            displaySwitches: [...standalone, ...groupedNodes],
            displayLinks: [...standalone, ...groupedNodes],
            activeGroups: groups
        };
    }, [switches, viewMode, expandedGroups]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();

        if (!diagramRef.current) return;
        const rect = diagramRef.current.parentElement!.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;

        let finalX = x - NODE_WIDTH / 2;
        let finalY = y - NODE_HEIGHT / 2;

        if (snapToGrid) {
            finalX = Math.round(finalX / GRID_SIZE) * GRID_SIZE;
            finalY = Math.round(finalY / GRID_SIZE) * GRID_SIZE;
        }

        const nodeId = e.dataTransfer.getData('nodeId');
        if (nodeId) {
            // Move existing node
            onUpdateSwitches(switches.map(s => String(s.id) === String(nodeId) ? { ...s, posX: finalX, posY: finalY } : s));
            showToast('Node repositioned', 'success');
            return;
        }

        const type = e.dataTransfer.getData('deviceType') as DeviceType;
        if (!type) return;

        onAddNode?.(type, finalX, finalY);
    };

    return (
        <div
            className={`w-full h-full relative cursor-${isPanning ? 'grabbing' : (isUiLocked || isLocked ? 'default' : 'grab')} overflow-hidden bg-[#080c14] rounded-lg border border-slate-800 shadow-2xl select-none flex ${isWiringMode ? 'cursor-crosshair' : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-[#030712]" />
                {/* Nebula Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.5),rgba(3,7,18,1))]" />
                <div className="absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, opacity: 0.03 }} />

                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-20"
                        style={{
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(255, 255, 255, 0.4)`
                        }}
                    />
                ))}
            </div>

            {/* Manual Assembly Palette */}
            <div className="absolute top-24 bottom-24 left-6 z-[120] w-64 flex flex-col bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Infrastructure Library</span>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Find nodes..."
                            className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/5 rounded-xl text-[10px] text-white focus:outline-none focus:border-blue-500/50 transition-all"
                            value={paletteSearch}
                            onChange={(e) => setPaletteSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                    {/* Templates Section */}
                    <div className="space-y-3">
                        <span className="px-1 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Templates (Provising)</span>
                        <div className="grid grid-cols-2 gap-2">
                            {paletteItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('deviceType', item.type);
                                        e.dataTransfer.setData('modelName', item.label);
                                    }}
                                    className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                                >
                                    <item.icon size={18} className="text-slate-400 group-hover:text-blue-400 mb-1.5" />
                                    <span className="text-[8px] font-bold text-slate-300 group-hover:text-white text-center truncate w-full">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Existing Nodes Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Nodes Library</span>
                            <span className="text-[8px] font-black text-blue-500">{existingNodesPalette.length}</span>
                        </div>
                        <div className="space-y-2">
                            {existingNodesPalette.map((node) => {
                                const Icon = getIconForType(node.model);
                                return (
                                    <div
                                        key={node.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('nodeId', node.id);
                                        }}
                                        className="group flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-grab active:cursor-grabbing"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/5 group-hover:text-emerald-400 text-slate-400">
                                            <Icon size={16} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-black text-white truncate leading-tight uppercase">{node.name}</span>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <span className="text-[7px] font-bold text-slate-400 truncate uppercase">{node.model}</span>
                                                <span className="text-[7px] font-mono text-blue-400">{node.ip}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Control Hub */}
            <div className="absolute bottom-6 left-6 right-6 md:right-auto z-[100] flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center bg-slate-900/60 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-2xl">
                    <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="p-3 hover:bg-white/10 rounded-xl text-slate-400 transition-all active:scale-90"><Minus size={18} /></button>
                    <div className="px-2 text-[11px] font-black text-blue-500 font-mono tracking-tighter w-14 text-center">{Math.round(scale * 100)}%</div>
                    <button onClick={() => setScale(s => Math.min(s + 0.1, 4))} className="p-3 hover:bg-white/10 rounded-xl text-slate-400 transition-all active:scale-90"><Plus size={18} /></button>
                </div>

                <div className="flex items-center bg-slate-900/60 backdrop-blur-xl p-1 rounded-2xl border border-white/10 shadow-2xl">
                    <button onClick={() => setIsUiLocked(!isUiLocked)} className={`p-3 rounded-xl transition-all active:scale-90 ${isUiLocked ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-slate-400 hover:bg-white/10'}`}>
                        {isUiLocked ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                    <div className="w-[1px] h-6 bg-white/5 mx-1"></div>
                    <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-3 rounded-xl transition-all active:scale-90 ${snapToGrid ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-slate-400 hover:bg-white/10'}`}>
                        <Grid3X3 size={18} />
                    </button>
                    <div className="w-[1px] h-6 bg-white/5 mx-1"></div>
                    <button onClick={toggleWiringMode} className={`p-3 rounded-xl transition-all active:scale-90 ${isWiringMode ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:bg-white/10'}`} title="Wiring Mode">
                        <Link2 size={18} />
                    </button>
                </div>

                <div className="h-8 w-[1px] bg-white/5 mx-2"></div>

                <button
                    onClick={() => {
                        setViewMode(viewMode === 'simplified' ? 'detailed' : 'simplified');
                        setExpandedGroups(new Set());
                        showToast(`Switched to ${viewMode === 'simplified' ? 'Detailed' : 'Simplified'} View`, 'info');
                    }}
                    className={`group flex items-center gap-3 px-6 py-3 bg-slate-900/60 backdrop-blur-xl rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 border border-white/10 ${viewMode === 'simplified' ? 'text-blue-400 border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'text-slate-300 hover:text-white hover:border-blue-500/50'}`}
                >
                    {viewMode === 'simplified' ? <Maximize size={16} className="group-hover:scale-110 transition-transform" /> : <LayoutTemplate size={16} className="group-hover:scale-110 transition-transform" />}
                    <span>{viewMode === 'simplified' ? 'Detailed View' : 'Simplified View'}</span>
                </button>

                {viewMode === 'simplified' && expandedGroups.size > 0 && (
                    <>
                        <div className="h-8 w-[1px] bg-white/5 mx-2"></div>
                        <button
                            onClick={() => {
                                setExpandedGroups(new Set());
                                showToast('All groups collapsed', 'info');
                            }}
                            className="group flex items-center gap-3 px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-500/30 transition-all shadow-2xl active:scale-95"
                        >
                            <Minimize size={16} className="group-hover:scale-110 transition-transform" />
                            <span>Collapse All</span>
                        </button>
                    </>
                )}

                <div className="h-8 w-[1px] bg-white/5 mx-2"></div>

                <button onClick={handleDownload} className="group flex items-center gap-3 px-6 py-3 bg-slate-900/60 backdrop-blur-xl text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600/90 hover:text-white transition-all shadow-2xl active:scale-95 border border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                    <Download size={16} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                    <span>Export Map</span>
                </button>
                <button onClick={handleAutoLayout} className="group flex items-center gap-3 px-6 py-3 bg-slate-900/60 backdrop-blur-xl text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/90 hover:text-white transition-all shadow-2xl active:scale-95 border border-white/10 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <LayoutTemplate size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span>Auto Layout</span>
                </button>
            </div>

            {selectedNode && (
                <div className="absolute top-6 left-6 right-6 md:left-auto md:w-80 z-[100] bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-right-8 duration-500 overflow-hidden">
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
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-500 uppercase tracking-widest">Global Tier</span>
                                <span className="text-blue-500 uppercase">{nodeTiers.get(selectedNode.id)}</span>
                            </div>
                        </div>

                        <div className="h-24 w-full bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden mb-6">
                            <div className="flex items-center gap-1.5 opacity-40 mb-3">
                                {[3, 7, 4, 9, 5, 11, 6].map((h, i) => (
                                    <div key={i} className="w-1.5 bg-blue-500 rounded-full animate-pulse" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <span className="text-[8px] font-mono font-black text-blue-500/60 uppercase tracking-[0.4em]">Monitoring Logical stream...</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onViewProfile && onViewProfile(selectedNode)}
                                className="flex items-center justify-center gap-3 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 border border-white/5"
                            >
                                <Info size={16} />
                                Profile
                            </button>
                            {canManage && !selectedNode.id.toString().startsWith('temp-') && (
                                <button
                                    onClick={() => onEditNode && onEditNode(selectedNode)}
                                    className="flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20"
                                >
                                    <Pencil size={16} />
                                    Edit
                                </button>
                            )}
                        </div>

                        {onDeleteNode && selectedNode.id !== 'internet' && (coreNodeId ? String(selectedNode.id) !== String(coreNodeId) : true) && (
                            <button
                                onClick={() => onDeleteNode(selectedNode.id)}
                                className="w-full mt-3 p-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all active:scale-90 border border-rose-500/30 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest"
                            >
                                <Trash2 size={16} /> Delete Node
                            </button>
                        )}
                        {canManage && String(selectedNodeId) !== 'internet' && !selectedNode.id.toString().startsWith('temp-') && (
                            <button
                                onClick={() => {
                                    onConnectNodes?.(selectedNode.id, 'internet');
                                    setSelectedNodeId(null);
                                    showToast(`${selectedNode.name} is now a Core Gateway`, 'success');
                                }}
                                className="w-full flex items-center justify-center gap-3 mt-4 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-emerald-500/20"
                            >
                                <Globe size={14} />
                                <span>Designate as Core HUB</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Infrastructure Legend */}
            <div className="absolute top-24 left-6 z-[90] bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 hidden lg:block w-56">
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-3 bg-blue-500 rounded-full" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Network Map Key</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[9px] font-bold text-slate-300">ISP Uplink</span>
                                </div>
                                <span className="text-[8px] font-mono text-slate-500">1 Gbps+</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    <span className="text-[9px] font-bold text-slate-300">Distribution</span>
                                </div>
                                <span className="text-[8px] font-mono text-slate-500">Trunk</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-rose-500">Overload</span>
                                </div>
                                <span className="text-[8px] font-mono text-rose-500">{'>'}85%</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[1px] bg-white/5 w-full" />

                    <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">VLAN Segregation</span>
                        <div className="grid grid-cols-1 gap-2.5">
                            {[
                                { id: 10, name: 'MGMT / IT', color: 'bg-cyan-400', label: 'VLAN 10' },
                                { id: 20, name: 'OPERATIONAL', color: 'bg-amber-400', label: 'VLAN 20' },
                                { id: 30, name: 'IP CAMERA', color: 'bg-pink-400', label: 'VLAN 30' },
                                { id: 60, name: 'IOT / SMART', color: 'bg-purple-400', label: 'VLAN 60' }
                            ].map(v => (
                                <div key={v.id} className="flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${v.color} group-hover:scale-125 transition-transform`} />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase group-hover:text-white transition-colors">{v.name}</span>
                                    </div>
                                    <span className="text-[8px] font-mono text-slate-600 font-bold">{v.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        <div className="flex items-center gap-2 mb-1">
                            <Info size={10} className="text-blue-400" />
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Map Status</span>
                        </div>
                        <p className="text-[8px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">Sync active with Supabase Realtime Hub.</p>
                    </div>
                </div>
            </div>

            <div
                ref={diagramRef}
                className="absolute inset-0 transition-transform duration-100 ease-out"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
            >
                <div
                    className="min-w-[5000px] min-h-[5000px] p-[1000px] relative"
                    style={{
                        backgroundImage: scale > 0.6 ? `radial-gradient(rgba(59,130,246,0.15) 1.5px, transparent 1.5px)` : 'none',
                        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                        backgroundPosition: '1000px 1000px'
                    }}
                >
                    {/* Layer Tier Labels */}
                    <div className="absolute left-[850px] top-[1000px] flex flex-col pointer-events-none space-y-[200px] opacity-20">
                        <div className="flex items-center gap-6 group">
                            <div className="w-24 h-[2px] bg-gradient-to-r from-emerald-500 to-transparent" />
                            <div>
                                <span className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.6em] block">L1 • Edge Gateway</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">External Connectivity & Firewall</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-[2px] bg-gradient-to-r from-blue-500 to-transparent" />
                            <div>
                                <span className="text-[12px] font-black text-blue-500 uppercase tracking-[0.6em] block">L2 • Core Infrastructure</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">High-Speed Backbone Switching</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent" />
                            <div>
                                <span className="text-[12px] font-black text-indigo-500 uppercase tracking-[0.6em] block">L3 • Distribution Layer</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Mid-Tier Branching & Segmenting</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-[2px] bg-gradient-to-r from-slate-500 to-transparent" />
                            <div>
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] block">L4 • Access Endpoint</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Terminal Devices & AP Management</span>
                            </div>
                        </div>
                    </div>
                    <DiagramNode
                        switchData={switches.find(s => coreNodeId && s.id.toString() === coreNodeId.toString()) || { id: 'internet', name: 'ISP CORE HUB', model: 'Gateway', ip: 'Public Static', totalPorts: 1, ports: [{ id: 'internet-p1', portNumber: 1, status: PortStatus.ACTIVE }], uptime: 'Online', location: 'External', rack: 'Core' } as NetworkSwitch}
                        x={internetPos.x} y={internetPos.y} scale={scale} isSelected={selectedNodeId === 'internet' || (coreNodeId && selectedNodeId === coreNodeId)} isLocked={isLocked} snapToGrid={snapToGrid} onDragEnd={handleNodeDragEnd} onSelect={handleNodeSelect} onDoubleClick={onViewProfile} isInternet searchTerm={searchTerm} tier={nodeTiers.get('internet') || 'Main Hub'} isWiringMode={isWiringMode}
                    />

                    {processedData.displaySwitches.map((sw: any) => {
                        if (sw.id === 'internet' || (coreNodeId && sw.id.toString() === coreNodeId.toString())) return null;
                        return (
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
                                onSelect={(id) => {
                                    if (id.startsWith('group-')) {
                                        const groupKey = sw.groupKey;
                                        setExpandedGroups(prev => {
                                            const next = new Set(prev);
                                            if (next.has(groupKey)) {
                                                next.delete(groupKey);
                                                showToast(`Collapsing ${sw.name}`, 'info');
                                            } else {
                                                next.add(groupKey);
                                                showToast(`Expanding ${sw.name}`, 'info');
                                            }
                                            return next;
                                        });
                                    } else {
                                        handleNodeSelect(id);
                                    }
                                }}
                                onDoubleClick={onViewProfile}
                                isInternet={String(sw.id) === 'internet' || (coreNodeId && String(sw.id) === String(coreNodeId))}
                                isImpacted={impactedNodeIds.has(String(sw.id))}
                                searchTerm={searchTerm}
                                tier={nodeTiers.get(sw.id)}
                                isWiringMode={isWiringMode}
                                onRelink={() => setRelinkingSwitch(sw)}
                            />
                        );
                    })}

                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                        <defs>
                            <filter id="link-glow-fx" x="-5000" y="-5000" width="10000" height="10000" filterUnits="userSpaceOnUse">
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {processedData.displayLinks.map((sw: any) => {
                            if (sw.id === 'internet') return null;
                            if (!sw.uplinkId || sw.posX === undefined || sw.posY === undefined) return null;
                            return <TopologyLink
                                key={`link-${sw.id}`}
                                sw={sw}
                                internetPos={internetPos}
                                switches={switches}
                                activePathNodeIds={activePathNodeIds}
                                searchTerm={searchTerm}
                                matchesSearch={matchesSearch}
                                coreNodeId={coreNodeId}
                            />;
                        })}

                        {/* Wiring Preview Line */}
                        {isWiringMode && wiringStartNodeId && (
                            <line
                                x1={(switches.find(s => String(s.id) === String(wiringStartNodeId))?.posX || (String(wiringStartNodeId) === 'internet' ? internetPos.x : 0)) + NODE_WIDTH / 2}
                                y1={(switches.find(s => String(s.id) === String(wiringStartNodeId))?.posY || (String(wiringStartNodeId) === 'internet' ? internetPos.y : 0)) + NODE_HEIGHT / 2}
                                x2={mousePos.x}
                                y2={mousePos.y}
                                stroke="#10b981"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                className="animate-[dash_1s_linear_infinite]"
                            />
                        )}
                    </svg>
                </div>
            </div>

            {/* Minimap Overlay */}
            <div className="absolute bottom-6 right-6 hidden md:block z-[100]">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden w-48 h-32 relative">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3)_0%,transparent_70%)]" />
                    <div className="w-full h-full relative" style={{ transform: `scale(0.04)`, transformOrigin: 'top left' }}>
                        <div
                            className="bg-emerald-500 rounded-full w-[NODE_WIDTH] h-[NODE_HEIGHT] absolute"
                            style={{ left: internetPos.x, top: internetPos.y }}
                        />
                        {switches.map(sw => (
                            <div
                                key={sw.id}
                                className="bg-blue-500 rounded-full w-[NODE_WIDTH] h-[NODE_HEIGHT] absolute"
                                style={{ left: sw.posX, top: sw.posY }}
                            />
                        ))}
                    </div>
                    {/* Viewport Indicator */}
                    <div
                        className="absolute border-2 border-blue-500/50 bg-blue-500/5 rounded pointer-events-none"
                        style={{
                            left: (-offset.x / scale) * 0.04 + 10,
                            top: (-offset.y / scale) * 0.04 + 10,
                            width: (window.innerWidth / scale) * 0.04,
                            height: (window.innerHeight / scale) * 0.04
                        }}
                    />
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[8px] font-black text-slate-500 uppercase tracking-widest border border-white/5">Radar View</div>
                </div>
            </div>

            {/* Empty State */}
            {
                switches.length === 0 && !searchTerm && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-[50]">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                            <div className="relative bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-xl group">
                                    <Radio size={40} className="text-blue-500 animate-pulse group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Nexus Empty</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px] text-center opacity-60">No active infrastructure nodes detected in the current sector.</p>
                                <button onClick={handleAutoLayout} className="mt-8 px-8 py-3 bg-blue-600/90 hover:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95">Re-scan Area</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                relinkingSwitch && (
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
                )
            }
        </div >
    );
};
