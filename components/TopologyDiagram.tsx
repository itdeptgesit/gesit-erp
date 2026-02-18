
'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Router, Server, Wifi, Globe, Video, Download, Link2, X, Move, Plus, Minus, Maximize, Minimize, Info, Lock, Unlock, Grid3X3, Radio, HardDrive, Monitor, Printer, Smartphone, Phone, LayoutTemplate } from 'lucide-react';
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
    onRelink?: (sw: any) => void;
    isInternet?: boolean;
    searchTerm?: string;
    tier?: string;
}

// Minimalist Dimensions
const NODE_WIDTH = 80;
const NODE_HEIGHT = 80;
const GRID_SIZE = 20;

const DiagramNode: React.FC<NodeProps> = React.memo(({ switchData, x, y, scale, isSelected, isLocked, snapToGrid, onDragEnd, onSelect, onRelink, isInternet, searchTerm = '', tier }) => {
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
    const isMatched = !searchTerm || switchData.name.toLowerCase().includes(searchTerm.toLowerCase()) || (switchData.ip || '').toLowerCase().includes(searchTerm.toLowerCase());

    return (
        <div
            className={`absolute z-20 transition-all ${isChild ? 'scale-90' : ''} ${!isMatched ? 'opacity-20 grayscale-[0.5]' : 'opacity-100'}`}
            style={{ left: localPos.x, top: localPos.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
        >
            <div
                className={`relative w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 group ${isSelected ? 'bg-blue-600 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.4)] scale-110 z-50' :
                    isInternet ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] z-10' : 'border-white/10 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-800/80 z-10'
                    }`}
                onMouseDown={handleMouseDown}
            >
                {/* Node Glow Backdrop */}
                <div className={`absolute inset-0 rounded-2xl blur-xl opacity-20 transition-all ${isSelected ? 'bg-blue-500' : isInternet ? 'bg-emerald-500' : 'bg-transparent'}`} />
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

const TopologyLink = React.memo(({ sw, internetPos, switches, activePathNodeIds, searchTerm, matchesSearch }: any) => {
    const [isHovered, setIsHovered] = useState(false);
    let startX, startY;
    const isInternetLink = sw.uplinkId === 'internet' || sw.uplinkId === 'gateway' || sw.uplinkId === 'root';
    if (isInternetLink) {
        startX = internetPos.x + NODE_WIDTH / 2;
        startY = internetPos.y + NODE_HEIGHT / 2;
    } else {
        const parent = switches.find((p: any) => p.id === sw.uplinkId);
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

    let color = isInternetLink ? '#10b981' : '#3b82f6';
    if (sw.vlan) {
        if (sw.vlan === 10) color = '#22d3ee';
        else if (sw.vlan === 20) color = '#fbbf24';
        else if (sw.vlan === 30) color = '#f472b6';
        else if (sw.vlan > 50) color = '#a78bfa';
    }
    const isPathActive = (activePathNodeIds.has(sw.id) && (sw.uplinkId === 'internet' ? activePathNodeIds.has('internet') : activePathNodeIds.has(sw.uplinkId))) || isHovered;

    const strokeWidth = isInternetLink ? 2 : (isPathActive ? 3 : 1.5);
    const opacity = isInternetLink ? 'opacity-70' : (isPathActive ? 'opacity-100' : 'opacity-50');
    const pulseScale = isPathActive ? 1.5 : 1;

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

            {/* Glowing Dotted Path */}
            <path d={pathData} stroke={color} strokeWidth={strokeWidth} strokeDasharray={isPathActive ? '12,12' : '4,16'} fill="none" className="opacity-100" filter="url(#link-glow-fx)">
                <animate attributeName="stroke-dashoffset" from="200" to="0" dur={isPathActive ? '4s' : '8s'} repeatCount="indefinite" />
            </path>

            {/* Travel Pulse (Data Packet Animation) */}
            <circle r={2 * pulseScale} fill={color} filter="url(#link-glow-fx)">
                <animateMotion path={pathData} dur={isPathActive ? '2s' : '4s'} repeatCount="indefinite" />
            </circle>
            <circle r={3 * pulseScale} fill={color} className="opacity-20">
                <animateMotion path={pathData} dur={isPathActive ? '2s' : '4s'} repeatCount="indefinite" />
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

interface TopologyDiagramProps {
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
    coreNodeId?: string;
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
    coreNodeId
}) => {
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
        while (currentId && currentId !== 'internet') {
            path.add(currentId);
            const node = switches.find(s => s.id === currentId);
            currentId = node?.uplinkId;
        }
        if (currentId === 'internet') path.add('internet');
        return path;
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

    return (
        <div
            className={`w-full h-full relative cursor-${isPanning ? 'grabbing' : (isUiLocked || isLocked ? 'default' : 'grab')} overflow-hidden bg-[#080c14] rounded-lg border border-slate-800 shadow-2xl select-none flex`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
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
                            width: `${Math.random() * 2 + 1} px`,
                            height: `${Math.random() * 2 + 1} px`,
                            left: `${Math.random() * 100}% `,
                            top: `${Math.random() * 100}% `,
                            boxShadow: `0 0 ${Math.random() * 10 + 5}px rgba(255, 255, 255, 0.4)`
                        }}
                    />
                ))}
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

                        <button
                            onClick={() => onViewProfile && onViewProfile(selectedNode)}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20"
                        >
                            <Info size={16} />
                            View Full Profile
                        </button>
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
                    style={{
                        backgroundImage: scale > 0.6 ? `radial-gradient(rgba(59,130,246,0.15) 1.5px, transparent 1.5px)` : 'none',
                        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                        backgroundPosition: '1000px 1000px'
                    }}
                >
                    {/* Layer Tier Labels */}
                    <div className="absolute left-[850px] top-[1000px] flex flex-col pointer-events-none space-y-[150px] opacity-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-[1px] bg-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em]">L1 Core Gateway</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-[1px] bg-blue-500" />
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">L2 Core Switching</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-[1px] bg-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em]">L3 Access Layer</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-[1px] bg-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Terminal Assets</span>
                        </div>
                    </div>
                    <DiagramNode
                        switchData={switches.find(s => coreNodeId && s.id.toString() === coreNodeId.toString()) || { id: 'internet', name: 'ISP CORE HUB', model: 'Gateway', ip: 'Public Static', totalPorts: 1, ports: [{ id: 'internet-p1', portNumber: 1, status: PortStatus.ACTIVE }], uptime: 'Online', location: 'External', rack: 'Core' } as NetworkSwitch}
                        x={internetPos.x} y={internetPos.y} scale={scale} isSelected={selectedNodeId === 'internet' || (coreNodeId && selectedNodeId === coreNodeId)} isLocked={isLocked} snapToGrid={snapToGrid} onDragEnd={handleNodeDragEnd} onSelect={setSelectedNodeId} isInternet searchTerm={searchTerm} tier={nodeTiers.get('internet') || 'Main Hub'}
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
                                        setSelectedNodeId(id);
                                    }
                                }}
                                onRelink={setRelinkingSwitch}
                                searchTerm={searchTerm}
                                tier={nodeTiers.get(sw.id)}
                            />
                        );
                    })}

                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                        <defs>
                            <filter id="link-glow-fx" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {processedData.displayLinks.map((sw: any) => {
                            if (sw.id === 'internet' || (coreNodeId && sw.id.toString() === coreNodeId.toString())) return null;
                            if (!sw.uplinkId || sw.posX === undefined || sw.posY === undefined) return null;
                            return <TopologyLink
                                key={`link-${sw.id}`}
                                sw={sw}
                                internetPos={internetPos}
                                switches={switches}
                                activePathNodeIds={activePathNodeIds}
                                searchTerm={searchTerm}
                                matchesSearch={matchesSearch}
                            />;
                        })}
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
            {switches.length === 0 && !searchTerm && (
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
            )}

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
