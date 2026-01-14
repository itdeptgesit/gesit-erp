
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    Server, RefreshCcw, Layout, Search, GitBranch, Plus,
    Loader2, Pencil, Trash2, Save, Cable
} from 'lucide-react';
import { NetworkSwitch, SwitchPort, PortStatus, UserAccount, DeviceType } from '../types';
import { SwitchVisualizer } from './SwitchVisualizer';
import { PortDetailModal } from './PortDetailModal';
import { WiringSchedule } from './WiringSchedule';
import { SwitchFormModal } from './SwitchFormModal';
import { TopologyDiagram } from './TopologyDiagram';
import { DangerConfirmModal } from './DangerConfirmModal';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';

interface NetworkDashboardProps {
    onBack: () => void;
    currentUser: UserAccount | null;
}

export const NetworkDashboard: React.FC<NetworkDashboardProps> = ({ onBack, currentUser }) => {
    const { t } = useLanguage();
    const [switches, setSwitches] = useState<NetworkSwitch[]>([]);
    const [internetPos, setInternetPos] = useState({ x: 1070, y: 120 });
    const [selectedPort, setSelectedPort] = useState<SwitchPort | null>(null);
    const [selectedSwitch, setSelectedSwitch] = useState<NetworkSwitch | null>(null);
    const [editingDevice, setEditingDevice] = useState<NetworkSwitch | null>(null);
    const [deleteDevice, setDeleteDevice] = useState<NetworkSwitch | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'topology' | 'status' | 'wiring' | 'devices'>('topology');

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const fetchNetworkData = async () => {
        setIsLoading(true);
        try {
            const { data: switchData } = await supabase.from('network_switches').select('*').order('display_order', { ascending: true });
            const { data: portData } = await supabase.from('switch_ports').select('*');

            if (switchData) {
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

                    if (sw.id === 'internet' || sw.name.toLowerCase().includes('core hub') || sw.name.toLowerCase().includes('mikrotik')) {
                        setInternetPos({ x: sw.pos_x || 1070, y: sw.pos_y || 120 });
                    }

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
                        posX: sw.pos_x || 1200,
                        posY: sw.pos_y || 400,
                        uplinkId: sw.uplink_id?.toString() || 'internet',
                        ports: switchPorts.sort((a, b) => a.portNumber - b.portNumber)
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
        setSwitches(updatedSwitches);
        if (newInternetPos) setInternetPos(newInternetPos);
        setHasUnsavedChanges(true);
    };

    const handleSaveLayout = async () => {
        if (!canManage) return;
        setIsSaving(true);
        try {
            for (const sw of switches) {
                if (!sw.id.startsWith('port-device-')) {
                    await supabase.from('network_switches').update({
                        pos_x: Math.round(sw.posX || 1200),
                        pos_y: Math.round(sw.posY || 400),
                        uplink_id: sw.uplinkId === 'internet' ? null : sw.uplinkId
                    }).eq('id', sw.id);
                }
            }
            await supabase.from('network_switches').update({ pos_x: Math.round(internetPos.x), pos_y: Math.round(internetPos.y) }).or(`id.eq.internet,name.eq.Main Core Hub`);
            setHasUnsavedChanges(false);
        } catch (err) { alert("Error saving layout."); } finally { setIsSaving(false); }
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
            alert("Failed to update port: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDevice = async (deviceData: NetworkSwitch) => {
        if (!canManage) return;
        setIsSaving(true);
        try {
            const payload = {
                name: deviceData.name,
                location: deviceData.location,
                rack: deviceData.rack,
                model: deviceData.model,
                ip: deviceData.ip,
                serial_number: deviceData.serialNumber,
                display_order: deviceData.displayOrder,
                total_ports: deviceData.totalPorts,
                uplink_id: deviceData.uplinkId === 'internet' ? null : deviceData.uplinkId
            };

            if (editingDevice) {
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
                    .insert([{ ...payload, pos_x: 1200, pos_y: 400 }])
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
            alert("Failed to save node: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const executeDeleteDevice = async () => {
        if (!deleteDevice || !canDelete) return;
        setIsSaving(true);
        try {
            await supabase.from('switch_ports').delete().eq('switch_id', deleteDevice.id);
            const { error } = await supabase.from('network_switches').delete().eq('id', deleteDevice.id);
            if (error) throw error;
            setDeleteDevice(null);
            await fetchNetworkData();
        } catch (err: any) {
            alert("Failed to delete node: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSwitches = useMemo(() => {
        return switches.filter(sw => !sw.id.startsWith('port-device-')).filter(sw => sw.name.toLowerCase().includes(searchTerm.toLowerCase()) || sw.ip.toLowerCase().includes(searchTerm.toLowerCase()) || sw.model.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [switches, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Infrastructure Engine</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Topology mapping and device configuration</p></div>
                <div className="flex items-center gap-3">
                    {hasUnsavedChanges && activeTab === 'topology' && canManage && (
                        <button onClick={handleSaveLayout} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 animate-bounce">
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Current Layout
                        </button>
                    )}
                    {canManage && (
                        <button onClick={() => { setEditingDevice(null); setIsAddDeviceOpen(true); }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 dark:shadow-none">
                            <Plus size={14} /> Provision Node
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto overflow-x-auto">
                        {[{ id: 'topology', label: 'Topology', icon: GitBranch }, { id: 'status', label: 'Nodes', icon: Layout }, { id: 'wiring', label: 'Wiring', icon: Cable }, { id: 'devices', label: 'Hardware', icon: Server }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><tab.icon size={12} />{tab.label}</button>
                        ))}
                    </div>
                    <div className="relative flex-1 md:w-64"><input type="text" placeholder="Filter nodes..." className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-slate-800 dark:text-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /><Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /></div>
                </div>
                <div className="p-0 flex-1 min-h-[550px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-[500px] gap-4"><RefreshCcw className="animate-spin text-blue-500" size={24} /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning...</p></div>
                    ) : activeTab === 'topology' ? (
                        <div className="h-[650px]"><TopologyDiagram switches={switches} onUpdateSwitches={handleUpdateSwitches} internetPos={internetPos} canManage={canManage} /></div>
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
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800"><tr><th className="px-6 py-4">Node Identity</th><th className="px-6 py-4">IP Config</th><th className="px-6 py-4">Site Location</th><th className="px-6 py-4 text-center">Load</th><th className="px-6 py-4 text-center">Protocol</th></tr></thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">{filteredSwitches.map(sw => (
                                            <tr key={sw.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"><td className="px-6 py-4"><p className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-tight">{sw.name}</p><p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-widest">{sw.model}</p></td><td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 text-[11px] font-bold">{sw.ip}</td><td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase">{sw.location}</td><td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded text-[9px] font-black border ${sw.ports.filter(p => p.status === PortStatus.ACTIVE).length > sw.totalPorts * 0.8 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100'}`}>{sw.ports.filter(p => p.status === PortStatus.ACTIVE).length} / {sw.totalPorts}</span></td><td className="px-6 py-4"><div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canManage && <button onClick={() => { setEditingDevice(sw); setIsAddDeviceOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>}
                                                {canDelete && <button onClick={() => setDeleteDevice(sw)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>}
                                            </div></td></tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
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
            <SwitchFormModal isOpen={isAddDeviceOpen} onClose={() => setIsAddDeviceOpen(false)} onSubmit={handleSaveDevice} initialData={editingDevice} />
            <DangerConfirmModal isOpen={!!deleteDevice} onClose={() => setDeleteDevice(null)} onConfirm={executeDeleteDevice} title="Purge Hardware Node" message={`Are you sure you want to permanently erase ${deleteDevice?.name} and its associated circuit maps?`} isLoading={isSaving} />
        </div>
    );
};
