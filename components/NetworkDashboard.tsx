
'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import {
    Server, RefreshCcw, Layout, Search, GitBranch, Plus,
    Loader2, Pencil, Trash2, Save, Cable, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkSwitch, SwitchPort, PortStatus, UserAccount, DeviceType } from '../types';
import { SwitchVisualizer } from './SwitchVisualizer';
import { PortDetailModal } from './PortDetailModal';
import { WiringSchedule } from './WiringSchedule';
import { SwitchFormModal } from './SwitchFormModal';
import { TopologyDiagram } from './TopologyDiagram';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';
import { exportToExcel } from '../lib/excelExport';
import { FileSpreadsheet } from 'lucide-react';
import { useToast } from './ToastProvider';
import { DeviceProfileDrawer } from './DeviceProfileDrawer';
import { NetworkSummaryBar } from './NetworkSummaryBar';
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface NetworkDashboardProps {
    onBack: () => void;
    currentUser: UserAccount | null;
}

export const NetworkDashboard: React.FC<NetworkDashboardProps> = ({ onBack, currentUser }) => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [switches, setSwitches] = useState<NetworkSwitch[]>([]);
    const [internetPos, setInternetPos] = useState({ x: 1070, y: 120 });
    const [selectedPort, setSelectedPort] = useState<SwitchPort | null>(null);
    const [selectedSwitch, setSelectedSwitch] = useState<NetworkSwitch | null>(null);
    const [editingDevice, setEditingDevice] = useState<NetworkSwitch | null>(null);
    const [coreNodeId, setCoreNodeId] = useState<string | number | null>(null);
    const [deleteDevice, setDeleteDevice] = useState<NetworkSwitch | null>(null);
    const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'topology' | 'status' | 'wiring' | 'devices'>('topology');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileDevice, setProfileDevice] = useState<NetworkSwitch | null>(null);
    const [centeringTrigger, setCenteringTrigger] = useState(0);
    const [isPending, startTransition] = useTransition();

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const fetchNetworkData = async () => {
        setIsLoading(true);
        try {
            const { data: switchData } = await supabase
                .from('network_switches')
                .select(`
                    *,
                    creator:created_by(full_name),
                    updater:updated_by(full_name)
                `)
                .order('display_order', { ascending: true });
            const { data: portData } = await supabase.from('switch_ports').select('*');

            if (switchData) {
                // Find Core Node first
                const coreNode = switchData.find(sw => sw.uplink_id === null) ||
                    switchData.find(sw => sw.id === 'internet') ||
                    switchData.find(sw => sw.name.toLowerCase().includes('core hub')) ||
                    switchData.find(sw => (sw.name || '').toLowerCase().includes('mikrotik')) ||
                    switchData.find(sw => (sw.name || '').toLowerCase().includes('gateway'));

                if (coreNode) {
                    setInternetPos({ x: coreNode.pos_x ?? 1070, y: coreNode.pos_y ?? 120 });
                    setCoreNodeId(coreNode.id);
                } else {
                    setInternetPos({ x: 1070, y: 120 });
                    setCoreNodeId(null);
                }

                // 1. Process Physical Switches
                const mappedSwitches: NetworkSwitch[] = switchData.map(sw => {
                    const switchPorts = portData?.filter(p => p.switch_id === sw.id).map(p => ({
                        id: p.id.toString(),
                        portNumber: p.port_number,
                        status: p.status,
                        deviceConnected: p.device_connected,
                        deviceType: p.device_type,
                        vlan: p.vlan,
                        cableLength: p.cable_length,
                        cableType: p.cable_type || 'Cat6',
                        ipAddress: p.ip_address,
                        macAddress: p.mac_address,
                        linkSpeed: p.link_speed,
                        patchPanelPort: p.patch_panel_port,
                        uplinkDeviceId: p.uplink_device_id?.toString()
                    })) || [];

                    return {
                        id: sw.id.toString(),
                        name: sw.name || 'Unnamed Device',
                        location: sw.location || 'Unknown',
                        rack: sw.rack || 'Unracked',
                        model: sw.model || 'Generic',
                        ip: sw.ip || 'DHCP',
                        serialNumber: sw.serial_number,
                        totalPorts: sw.total_ports || 0,
                        uptime: sw.uptime || 'Stable',
                        posX: sw.pos_x ?? 1200,
                        posY: sw.pos_y ?? 400,
                        uplinkId: sw.uplink_id?.toString() || 'internet',
                        ports: switchPorts.sort((a, b) => a.portNumber - b.portNumber),
                        status: sw.status || 'active',
                        notes: sw.notes,
                        createdBy: sw.creator?.full_name || sw.created_by,
                        createdAt: sw.created_at,
                        updatedBy: sw.updater?.full_name || sw.updated_by,
                        updatedAt: sw.updated_at
                    };
                });

                // 2. Scan Ports for ALL connected leaf devices (CCTV, PC, Server, AP, etc.)
                const subNodes: NetworkSwitch[] = [];
                mappedSwitches.forEach(sw => {
                    const activeLeafPorts = sw.ports.filter(port =>
                        port.status === PortStatus.ACTIVE &&
                        port.deviceType !== DeviceType.UNKNOWN &&
                        port.deviceType !== DeviceType.UPLINK &&
                        !port.uplinkDeviceId
                    );

                    const leafCount = activeLeafPorts.length;

                    activeLeafPorts.forEach((port, index) => {
                        const leafId = `port-device-${port.id}`;

                        // Dynamic Spreading: Calculate angle based on actual leaf count per switch
                        // We use a base angle and spread them 360 degrees or a wide arc
                        const baseAngle = -Math.PI / 2; // Start from top
                        const spreadAngle = (Math.PI * 2) / Math.max(1, leafCount);
                        const angle = baseAngle + (index * spreadAngle);

                        // Multi-layered staggering to handle dense clusters
                        // Every 8 nodes we move to the next "ring"
                        const ring = Math.floor(index / 8);
                        const radius = 250 + (ring * 120);

                        subNodes.push({
                            id: leafId,
                            name: port.deviceConnected || `${port.deviceType}-${port.portNumber}`,
                            model: port.deviceType,
                            location: sw.location,
                            rack: sw.rack,
                            ip: port.ipAddress || 'Active',
                            totalPorts: 1,
                            uptime: 'Online',
                            uplinkId: sw.id,
                            uplinkPort: port.portNumber,
                            vlan: port.vlan,
                            posX: sw.posX ? sw.posX + Math.cos(angle) * radius : 1500,
                            posY: sw.posY ? sw.posY + Math.sin(angle) * radius : 400,
                            ports: [{
                                id: `port-${port.id}`,
                                portNumber: 1,
                                status: PortStatus.ACTIVE,
                                deviceType: port.deviceType,
                                ipAddress: port.ipAddress,
                                macAddress: port.macAddress,
                                linkSpeed: port.linkSpeed
                            }]
                        });
                    });
                });

                setSwitches([...mappedSwitches, ...subNodes]);
                setHasUnsavedChanges(false);
            }
        } catch (err: any) { console.error(err); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchNetworkData(); }, []);

    const handleUpdateSwitches = (updatedSwitches: NetworkSwitch[], newInternetPos?: { x: number, y: number }) => {
        // Synchronize internet node inside the switches array if internetPos is provided
        let finalSwitches = updatedSwitches;
        if (newInternetPos) {
            finalSwitches = updatedSwitches.map(sw =>
                (sw.id === 'internet' || (coreNodeId && sw.id.toString() === coreNodeId.toString()))
                    ? { ...sw, posX: newInternetPos.x, posY: newInternetPos.y }
                    : sw
            );
            setInternetPos(newInternetPos);
        } else {
            // Fix: If a node matching coreNodeId was moved, sync the internetPos state too
            const movedCore = updatedSwitches.find(sw => coreNodeId && sw.id.toString() === coreNodeId.toString());
            if (movedCore && movedCore.posX !== undefined && movedCore.posY !== undefined) {
                if (movedCore.posX !== internetPos.x || movedCore.posY !== internetPos.y) {
                    setInternetPos({ x: movedCore.posX, y: movedCore.posY });
                }
            }
        }
        setSwitches(finalSwitches);
        setHasUnsavedChanges(true);
    };

    const handleSaveLayout = async () => {
        if (!canManage) return;
        setIsSaving(true);
        try {
            const updates = [];

            // 1. Prepare updates for all physical switches positions
            for (const sw of switches) {
                if (!sw.id.startsWith('port-device-') && sw.id !== 'internet' && sw.id.toString() !== coreNodeId?.toString()) {
                    updates.push(
                        supabase.from('network_switches').update({
                            pos_x: Math.round(sw.posX ?? 1200),
                            pos_y: Math.round(sw.posY ?? 400),
                            uplink_id: sw.uplinkId === 'internet' ? null : sw.uplinkId
                        }).eq('id', sw.id)
                    );
                }
            }

            // 2. Explicitly update the Internet/Core node position in the database by its stored ID
            if (coreNodeId) {
                updates.push(
                    supabase.from('network_switches')
                        .update({
                            pos_x: Math.round(internetPos.x),
                            pos_y: Math.round(internetPos.y)
                        })
                        .eq('id', coreNodeId)
                );
            }

            const results = await Promise.all(updates);
            const errors = results.filter(r => r.error).map(r => r.error);
            if (errors.length > 0) throw errors[0];

            setHasUnsavedChanges(false);
            setCenteringTrigger(prev => prev + 1);
            showToast("Circuit architecture synchronized successfully.", 'success');
            await fetchNetworkData();
        } catch (err: any) {
            console.error("Save error:", err);
            showToast("Error saving layout: " + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePort = async (updatedPort: SwitchPort) => {
        if (!canManage) return;
        setIsSaving(true);
        try {
            const payload = {
                device_connected: updatedPort.deviceConnected,
                status: updatedPort.status,
                device_type: updatedPort.deviceType,
                vlan: updatedPort.vlan,
                cable_type: updatedPort.cableType,
                cable_length: updatedPort.cableLength,
                ip_address: updatedPort.ipAddress,
                mac_address: updatedPort.macAddress,
                link_speed: updatedPort.linkSpeed,
                uplink_device_id: updatedPort.uplinkDeviceId || null,
                patch_panel_port: updatedPort.patchPanelPort
            };

            const { error } = await supabase
                .from('switch_ports')
                .update(payload)
                .eq('id', updatedPort.id);

            if (error) throw error;

            setSelectedPort(null);
            await fetchNetworkData();
        } catch (err: any) {
            showToast("Failed to update port: " + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDevice = async (deviceData: NetworkSwitch) => {
        if (!canManage) return;
        setIsSaving(true);
        try {
            const payload: any = {
                name: deviceData.name,
                location: deviceData.location,
                rack: deviceData.rack,
                model: deviceData.model,
                ip: deviceData.ip,
                serial_number: deviceData.serialNumber,
                display_order: deviceData.displayOrder,
                total_ports: deviceData.totalPorts,
                uplink_id: deviceData.uplinkId === 'internet' ? null : deviceData.uplinkId,
                status: deviceData.status,
                notes: deviceData.notes,
                updated_by: currentUser?.id,
                updated_at: new Date().toISOString()
            };

            if (editingDevice && !editingDevice.id.toString().startsWith('temp-')) {
                const { error } = await supabase.from('network_switches').update(payload).eq('id', editingDevice.id);
                if (error) throw error;

                // Sync Ports
                const oldPortCount = Number(editingDevice.totalPorts);
                const newPortCount = Number(deviceData.totalPorts);

                if (newPortCount > oldPortCount) {
                    // Add new ports
                    const portsToAdd = (deviceData.ports || [])
                        .filter(p => p.portNumber > oldPortCount)
                        .map(p => ({
                            switch_id: editingDevice.id,
                            port_number: p.portNumber,
                            status: PortStatus.IDLE,
                            device_type: DeviceType.UNKNOWN,
                            patch_panel_port: p.patchPanelPort || `PP-${p.portNumber}`,
                            cable_type: p.cableType || 'Cat6'
                        }));
                    if (portsToAdd.length > 0) {
                        const { error: portAddErr } = await supabase.from('switch_ports').insert(portsToAdd);
                        if (portAddErr) throw portAddErr;
                    }
                } else if (newPortCount < oldPortCount) {
                    // Remove extra ports
                    const { error: portRemErr } = await supabase
                        .from('switch_ports')
                        .delete()
                        .eq('switch_id', editingDevice.id)
                        .gt('port_number', newPortCount);
                    if (portRemErr) throw portRemErr;
                }
            } else {
                const { data: newSwitch, error: switchError } = await supabase
                    .from('network_switches')
                    .insert([{
                        ...payload,
                        created_by: currentUser?.id,
                        created_at: new Date().toISOString(),
                        pos_x: Math.round(editingDevice?.posX ?? 1200),
                        pos_y: Math.round(editingDevice?.posY ?? 400)
                    }])
                    .select()
                    .single();

                if (switchError) throw switchError;

                if (newSwitch && deviceData.ports && deviceData.ports.length > 0) {
                    const portsPayload = deviceData.ports.map((p: any) => ({
                        switch_id: newSwitch.id,
                        port_number: p.portNumber,
                        status: p.status || PortStatus.IDLE,
                        device_type: p.deviceType || DeviceType.UNKNOWN,
                        patch_panel_port: p.patch_panel_port || `PP-${p.portNumber}`,
                        vlan: p.vlan,
                        cable_length: p.cableType || 'Cat6'
                    }));
                    const { error: portError } = await supabase.from('switch_ports').insert(portsPayload);
                    if (portError) throw portError;
                }
            }
            setIsAddDeviceOpen(false);
            await fetchNetworkData();
        } catch (err: any) {
            showToast("Failed to save node: " + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const executeDeleteDevice = async () => {
        if (!deleteDevice || !canDelete) return;
        setIsSaving(true);
        try {
            if (canManage && String(deleteDevice.id) !== 'internet' && !deleteDevice.id.toString().startsWith('temp-') && !deleteDevice.id.toString().startsWith('port-device-')) {
                await supabase.from('switch_ports').delete().eq('switch_id', deleteDevice.id);
                const { error } = await supabase.from('network_switches').delete().eq('id', deleteDevice.id);
                if (error) throw error;
            }
            setDeleteDevice(null);
            await fetchNetworkData();
        } catch (err: any) {
            showToast("Failed to delete node: " + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddNode = (type: DeviceType, x: number, y: number) => {
        // Pre-populate node data
        const newNode: NetworkSwitch = {
            id: `temp-${Date.now()}`,
            name: `New ${type}`,
            model: type,
            location: 'Main Site',
            rack: 'Unracked',
            ip: '-',
            totalPorts: (type === DeviceType.ROUTER) ? 4 : 1,
            uptime: 'Initial',
            posX: x,
            posY: y,
            ports: [],
            status: 'active'
        };
        setEditingDevice(newNode);
        setIsAddDeviceOpen(true);
    };

    const handleDeleteNode = (id: string) => {
        if (id.startsWith('port-device-')) {
            showToast("Cannot delete derived leaf devices directly. Disconnect from port instead.", "warning");
            return;
        }
        const sw = switches.find(s => s.id === id);
        if (sw) setDeleteDevice(sw);
    };

    const handleConnectNodes = async (childId: string, parentId: string) => {
        if (childId.startsWith('port-device-') || parentId.startsWith('port-device-')) {
            showToast("Only infrastructure nodes can be wired manually.", "warning");
            return;
        }

        if (childId.startsWith('temp-') || (parentId !== 'internet' && parentId.startsWith('temp-'))) {
            showToast("Please save individual nodes before wiring them.", "warning");
            return;
        }

        // Optimistic update local state
        handleUpdateSwitches(switches.map(s => String(s.id) === String(childId) ? { ...s, uplinkId: parentId } : s));

        setIsSaving(true);
        try {
            const dbUplinkId = parentId === 'internet' ? null : parentId;
            const { error } = await supabase
                .from('network_switches')
                .update({ uplink_id: dbUplinkId })
                .eq('id', childId);

            if (error) throw error;
            showToast("Circuit map synchronized", 'success');
            await fetchNetworkData();
        } catch (err: any) {
            showToast("Link failure: " + err.message, 'error');
            // Revert state if needed, but fetchNetworkData will handle it
            await fetchNetworkData();
        } finally {
            setIsSaving(false);
        }
    };

    const handleWipeTopology = async () => {
        setIsSaving(true);
        try {
            await supabase.rpc('wipe_tables', { table_names: ['switch_ports', 'network_switches'] });
            showToast("Topology erased successfully", 'success');
            setWipeConfirmOpen(false);
            await fetchNetworkData();
        } catch (err: any) {
            showToast("Failed to wipe topology: " + err.message, 'error');
        } finally {
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const filteredSwitches = useMemo(() => {
        return switches.filter(sw => !sw.id.startsWith('port-device-')).filter(sw => sw.name.toLowerCase().includes(searchTerm.toLowerCase()) || sw.ip.toLowerCase().includes(searchTerm.toLowerCase()) || sw.model.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [switches, searchTerm]);

    const handleExportSwitches = () => {
        const physicalSwitches = switches.filter(sw => !sw.id.startsWith('port-device-') && sw.id !== 'internet');
        if (physicalSwitches.length === 0) return;

        const dataToExport = physicalSwitches.map(sw => ({
            "Device Name": sw.name,
            "Model": sw.model,
            "IP Address": sw.ip,
            "Serial Number": sw.serialNumber || "-",
            "Location": sw.location,
            "Rack": sw.rack,
            "Total Ports": sw.totalPorts,
            "Governance Status": sw.status || "active",
            "Technical Notes": sw.notes || "-"
        }));

        exportToExcel(dataToExport, `GESIT-NETWORK-NODES-${new Date().toISOString().split('T')[0]}`);
    };

    const handleExportWiring = () => {
        const physicalSwitches = switches.filter(sw => !sw.id.startsWith('port-device-') && sw.id !== 'internet');
        const allPorts: any[] = [];

        physicalSwitches.forEach(sw => {
            sw.ports.forEach(p => {
                allPorts.push({
                    "Switch": sw.name,
                    "Port": p.portNumber,
                    "Status": p.status,
                    "Connected Device": p.deviceConnected || "-",
                    "Device Type": p.deviceType,
                    "IP Address": p.ipAddress || "-",
                    "MAC Address": p.macAddress || "-",
                    "VLAN": p.vlan || "-",
                    "Cable Type": p.cableType || "-",
                    "Patch Panel": p.patchPanelPort || "-"
                });
            });
        });

        if (allPorts.length === 0) return;
        exportToExcel(allPorts, `GESIT-WIRING-SCHEDULE-${new Date().toISOString().split('T')[0]}`);
    };

    const handleViewProfile = (device: NetworkSwitch) => {
        startTransition(() => {
            setActiveTab('status');
            setSelectedSwitch(device);
        });
        showToast(`Viewing hardware profile: ${device.name}`, 'info');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <PageHeader
                title="NetVision Infrastructure"
                description="Sentralisasi manajemen infrastruktur IT & monitoring jaringan real-time"
            >
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 mr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleExportSwitches}
                            className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800"
                            title="Export Nodes"
                        >
                            <FileSpreadsheet size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleExportWiring}
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800"
                            title="Export Wiring"
                        >
                            <Server size={16} />
                        </Button>
                    </div>
                    {canManage && (
                        <Button
                            onClick={() => { setEditingDevice(null); setIsAddDeviceOpen(true); }}
                            className="h-10 px-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-semibold text-xs rounded-xl"
                        >
                            <Plus size={14} className="mr-2" /> Provision Node
                        </Button>
                    )}
                    {hasUnsavedChanges && activeTab === 'topology' && canManage && (
                        <Button
                            onClick={handleSaveLayout}
                            disabled={isSaving}
                            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                            Sync Geometry
                        </Button>
                    )}
                </div>
            </PageHeader>



            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                        {[{ id: 'topology', label: 'Topology', icon: GitBranch }, { id: 'status', label: 'Nodes', icon: Layout }, { id: 'wiring', label: 'Wiring', icon: Cable }, { id: 'devices', label: 'Hardware', icon: Server }].map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => startTransition(() => setActiveTab(tab.id as any))} 
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap 
                                    ${activeTab === tab.id 
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                                    } ${isPending ? 'opacity-50 grayscale' : ''}`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 md:max-w-xs">
                        <Input 
                            placeholder="Filter registry..." 
                            className="w-full pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
                <div className="p-0 flex-1 min-h-[600px] relative">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-[650px] gap-4 transition-all duration-300"
                            >
                                <RefreshCcw className="animate-spin text-blue-500" size={24} />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning Infrastructure...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                className="w-full h-full"
                            >
                                {activeTab === 'topology' ? (
                                    <div className="h-[750px] w-full relative overflow-hidden">
                                        <TopologyDiagram
                                            switches={switches}
                                            internetPos={internetPos}
                                            onUpdateSwitches={handleUpdateSwitches}
                                            selectedNodeId={selectedSwitch?.id || null}
                                            setSelectedNodeId={(id) => {
                                                const sw = switches.find(s => s.id === id);
                                                setSelectedSwitch(sw || null);
                                            }}
                                            searchTerm={searchTerm}
                                            isLocked={!canManage}
                                            onViewProfile={handleViewProfile}
                                            centeringTrigger={centeringTrigger}
                                            coreNodeId={coreNodeId?.toString()}
                                            onAddNode={handleAddNode}
                                            onDeleteNode={handleDeleteNode}
                                            onConnectNodes={handleConnectNodes}
                                            onWipeAll={() => setWipeConfirmOpen(true)}
                                            onEditNode={(sw) => {
                                                setEditingDevice(sw);
                                                setIsAddDeviceOpen(true);
                                            }}
                                            canManage={canManage}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-6 md:p-8">
                                        {activeTab === 'status' ? (
                                            <div className="space-y-8">{filteredSwitches.map(sw => (
                                                <div key={sw.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                                    <div className="flex justify-between items-end mb-6"><div><div className="flex items-center gap-3"><h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{sw.name}</h3><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold border border-slate-200 dark:border-slate-700 uppercase">{sw.model}</span></div><p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">{sw.location} • {sw.rack} • <span className="text-blue-500">{sw.ip}</span></p></div></div>
                                                    <SwitchVisualizer switchDetails={sw} onPortClick={(port) => { setSelectedPort(port); setSelectedSwitch(sw); }} />
                                                </div>
                                            ))}</div>
                                        ) : activeTab === 'wiring' ? (
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"><WiringSchedule switches={switches} /></div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
                                                <Table className="w-full">
                                                    <TableHeader>
                                                        <TableRow className="bg-white dark:bg-slate-950 hover:bg-transparent">
                                                            <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Device Identity</TableHead>
                                                            <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Networking</TableHead>
                                                            <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Infrastructure Detail</TableHead>
                                                            <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Load Status</TableHead>
                                                            <TableHead className="px-6 h-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Operations</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody className="divide-y divide-slate-50 dark:divide-slate-900 font-medium">
                                                        {filteredSwitches.map(sw => (
                                                            <TableRow key={sw.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all group">
                                                                <TableCell className="px-6 py-4">
                                                                    <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-tight leading-none">{sw.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 leading-none tracking-widest">{sw.model}</p>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-4">
                                                                    <p className="font-mono text-blue-600 dark:text-blue-400 text-[11px] font-black">{sw.ip}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Static Access</p>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-tight">
                                                                    <p className="text-slate-700 dark:text-slate-300">{sw.location}</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-widest">SN: {sw.serialNumber || 'N/A'}</p>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-4 text-center">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border ${sw.ports.filter(p => p.status === PortStatus.ACTIVE).length > sw.totalPorts * 0.8 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30'}`}>
                                                                        {sw.ports.filter(p => p.status === PortStatus.ACTIVE).length} / {sw.totalPorts}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="px-6 py-4">
                                                                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {canManage && <Button variant="ghost" size="icon" onClick={() => { setEditingDevice(sw); setIsAddDeviceOpen(true); }} className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Pencil size={14} /></Button>}
                                                                        {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteDevice(sw)} className="h-8 w-8 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></Button>}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <PortDetailModal
                port={selectedPort}
                onClose={() => setSelectedPort(null)}
                switchName={selectedSwitch?.name || ''}
                canManage={canManage}
                onSave={handleSavePort}
                availableSwitches={switches}
            />
            <SwitchFormModal
                isOpen={isAddDeviceOpen}
                onClose={() => setIsAddDeviceOpen(false)}
                onSubmit={handleSaveDevice}
                initialData={editingDevice}
            />
            <DangerConfirmModal
                isOpen={!!deleteDevice}
                onClose={() => setDeleteDevice(null)}
                onConfirm={executeDeleteDevice}
                title="Purge Hardware Node"
                message={`Are you sure you want to permanently erase ${deleteDevice?.name} and its associated circuit maps?`}
                isLoading={isSaving}
            />
            <DeviceProfileDrawer
                device={profileDevice}
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
            <DangerConfirmModal
                isOpen={wipeConfirmOpen}
                onClose={() => setWipeConfirmOpen(false)}
                onConfirm={handleWipeTopology}
                title="Wipe Entire Topology"
                message="This will permanently delete ALL infrastructure nodes and their port connections. You will start with a completely empty canvas. Are you sure?"
            />
        </div>
    );
};
