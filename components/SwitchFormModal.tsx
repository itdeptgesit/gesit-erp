'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Cpu, Server, PhoneCall, Video, Radio, Database, HardDrive, Hash, Layers, Save, Cable, MapPin, ListOrdered, Shield, Link2 } from 'lucide-react';
import { NetworkSwitch, SwitchPort, PortStatus, DeviceType, DeviceStatus } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SwitchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NetworkSwitch) => void;
    initialData?: NetworkSwitch | null;
}

export const SwitchFormModal: React.FC<SwitchFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [category, setCategory] = useState<'Network' | 'Security' | 'Telephony'>('Network');
    const [availableSwitches, setAvailableSwitches] = useState<{ id: string, name: string }[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        rack: '',
        model: '',
        ip: '',
        serialNumber: '',
        displayOrder: 1,
        totalPorts: 24,
        vlanDefault: '10',
        storage: '4TB',
        channels: '16',
        extRange: '100-199',
        pairs: '50',
        cableType: 'Cat6' as any,
        uplinkId: 'internet',
        status: 'active' as DeviceStatus,
        notes: ''
    });

    useEffect(() => {
        const fetchSwitches = async () => {
            const { data } = await supabase.from('network_switches').select('id, name');
            if (data) setAvailableSwitches(data.map(d => ({ id: d.id.toString(), name: d.name })));
        };
        if (isOpen) {
            fetchSwitches();
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    location: initialData.location || '',
                    rack: initialData.rack || '',
                    model: initialData.model || '',
                    ip: initialData.ip || '',
                    serialNumber: initialData.serialNumber || '',
                    displayOrder: initialData.displayOrder || 1,
                    totalPorts: initialData.totalPorts || 24,
                    vlanDefault: '10',
                    storage: '4TB',
                    channels: (initialData.totalPorts || 0).toString(),
                    extRange: '100-199',
                    pairs: (initialData.totalPorts || 0).toString(),
                    cableType: initialData.ports?.[0]?.cableType || 'Cat6',
                    uplinkId: initialData.uplinkId || 'internet',
                    status: (initialData.status as DeviceStatus) || DeviceStatus.ACTIVE,
                    notes: initialData.notes || ''
                });

                const modelLower = (initialData.model || '').toLowerCase();
                const nameLower = (initialData.name || '').toLowerCase();
                if (modelLower.includes('nvr') || modelLower.includes('dvr') || nameLower.includes('nvr') || nameLower.includes('dvr')) setCategory('Security');
                else if (modelLower.includes('pabx') || nameLower.includes('pabx') || nameLower.includes('lsa')) setCategory('Telephony');
                else setCategory('Network');
            } else {
                setFormData({
                    name: '', location: '', rack: '', model: '', ip: '', serialNumber: '', displayOrder: 1, totalPorts: 24,
                    vlanDefault: '10', storage: '4TB', channels: '16', extRange: '100-199', pairs: '50',
                    cableType: 'Cat6', uplinkId: 'internet',
                    status: DeviceStatus.ACTIVE,
                    notes: ''
                });
                setCategory('Network');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let targetPorts = Number(formData.totalPorts);
        if (category === 'Security') targetPorts = Number(formData.channels);
        if (category === 'Telephony') targetPorts = Number(formData.pairs);
        if (isNaN(targetPorts) || targetPorts <= 0) targetPorts = 1;

        if (initialData) {
            let currentPorts = [...(initialData.ports || [])];
            if (targetPorts > currentPorts.length) {
                // Add more ports
                const newPorts: SwitchPort[] = Array.from({ length: targetPorts - currentPorts.length }, (_, i) => {
                    const portNum = currentPorts.length + i + 1;
                    return {
                        id: `temp-port-${Date.now()}-${portNum}`,
                        portNumber: portNum,
                        status: PortStatus.IDLE,
                        deviceType: DeviceType.UNKNOWN,
                        patchPanelPort: `PP-${portNum}`,
                        cableType: formData.cableType
                    };
                });
                currentPorts = [...currentPorts, ...newPorts];
            } else if (targetPorts < currentPorts.length) {
                // Prune ports
                currentPorts = currentPorts.slice(0, targetPorts);
            }

            const updatedDevice: NetworkSwitch = {
                ...initialData,
                name: formData.name,
                location: formData.location || 'Unknown Site',
                rack: formData.rack || 'Unracked',
                model: formData.model,
                ip: formData.ip,
                serialNumber: formData.serialNumber,
                displayOrder: Number(formData.displayOrder),
                totalPorts: targetPorts,
                uplinkId: formData.uplinkId,
                status: formData.status,
                notes: formData.notes,
                ports: currentPorts
            };
            onSubmit(updatedDevice);
        } else {
            let defaultType = DeviceType.UNKNOWN;

            if (category === 'Network') {
                const isAP = formData.model.toLowerCase().includes('access point') || formData.name.toLowerCase().includes('ap-');
                defaultType = isAP ? DeviceType.AP : DeviceType.PC;
                if (isAP) targetPorts = 1; // AP usually only has 1 management port
            } else if (category === 'Security') {
                const isNvr = formData.model.toLowerCase().includes('nvr') || formData.name.toLowerCase().includes('nvr');
                defaultType = DeviceType.CCTV;
                if (isNvr) targetPorts = 1;
            } else if (category === 'Telephony') {
                defaultType = DeviceType.ANALOG_PHONE;
            }

            const newPorts: SwitchPort[] = Array.from({ length: targetPorts }, (_, i) => {
                const rawVlan = category === 'Network' ? Number(formData.vlanDefault) : undefined;
                const vlanVal = (rawVlan === undefined || isNaN(rawVlan) || rawVlan === 0) ? undefined : rawVlan;

                return {
                    id: `temp-port-${Date.now()}-${i + 1}`,
                    portNumber: i + 1,
                    status: PortStatus.IDLE,
                    deviceType: defaultType,
                    patchPanelPort: `PP-${i + 1}`,
                    vlan: vlanVal,
                    cableType: formData.cableType
                };
            });

            const newDevice: NetworkSwitch = {
                id: `temp-sw-${Date.now()}`,
                name: formData.name,
                location: formData.location || 'Unknown Site',
                rack: formData.rack || 'Unracked',
                model: formData.model,
                ip: formData.ip || (category === 'Telephony' ? '-' : 'DHCP'),
                serialNumber: formData.serialNumber,
                displayOrder: Number(formData.displayOrder),
                totalPorts: targetPorts,
                uptime: 'Stable',
                ports: newPorts,
                uplinkId: formData.uplinkId,
                status: formData.status,
                notes: formData.notes,
                posX: 1200, // Safe default position
                posY: 400
            };

            onSubmit(newDevice);
        }
    };

    const inputClass = "w-full border border-slate-200 dark:border-zinc-700 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400 shadow-none";
    const labelClass = "block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 ml-1";

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col border border-slate-200 dark:border-zinc-800 my-8">
                {/* Header */}
                <div className="flex justify-between items-center px-9 py-7 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                            {initialData ? 'Update Node' : 'Provision Node'}
                        </h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Infrastructure Database Entry</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-md transition-all text-slate-400 dark:text-zinc-500 hover:text-slate-600"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-9 space-y-6 overflow-y-auto flex-1 max-h-[65vh]">
                        {/* Segment Tab Buttons */}
                        <div className="flex p-1 bg-slate-150/80 dark:bg-zinc-800 rounded-lg border border-slate-200/50 dark:border-zinc-700/50 mb-6 max-w-md mx-auto">
                            {[
                                { id: 'Network', icon: Radio, label: 'Network' },
                                { id: 'Security', icon: Video, label: 'Security' },
                                { id: 'Telephony', icon: PhoneCall, label: 'Telephony' }
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    disabled={!!initialData}
                                    onClick={() => setCategory(cat.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${category === cat.id ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/30 dark:border-zinc-700/30 font-bold' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 disabled:opacity-30'}`}
                                >
                                    <cat.icon size={14} className={category === cat.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-slate-400'} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                                </button>
                            ))}
                        </div>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                                <Shield size={14} className="text-zinc-900 dark:text-zinc-100" />
                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Hardware Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Identity Name</label>
                                    <Input required className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. CORE-SW-01 or AP-Lobby-01" />
                                </div>
                                <div>
                                    <label className={labelClass}>Hardware Model</label>
                                    <Input required className={inputClass} value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="e.g. Cisco C9200L or UniFi 6 Pro" />
                                </div>
                                <div>
                                    <label className={labelClass}>Management IP</label>
                                    <Input className={inputClass} value={formData.ip} onChange={e => setFormData({ ...formData, ip: e.target.value })} placeholder="192.168.1.x" />
                                </div>
                                <div>
                                    <label className={labelClass}>Serial Number / Asset ID</label>
                                    <Input className={inputClass} value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="SN-XXXXXXX" />
                                </div>
                                <div>
                                    <label className={labelClass}>Site Location</label>
                                    <Input required className={inputClass} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Server Room A" />
                                </div>
                                <div>
                                    <label className={labelClass}>Uplink Connection (Parent)</label>
                                    <select className={inputClass} value={formData.uplinkId} onChange={e => setFormData({ ...formData, uplinkId: e.target.value })}>
                                        <option value="internet">Direct to Internet/Core Hub</option>
                                        {availableSwitches.filter(s => s.id !== initialData?.id).map(sw => (
                                            <option key={sw.id} value={sw.id}>{sw.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                                <Layers size={14} className="text-zinc-900 dark:text-zinc-100" />
                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Interface Configuration</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {category === 'Network' && (
                                    <>
                                        <div>
                                            <label className={labelClass}>Port Density (Total)</label>
                                            <select className={inputClass} value={formData.totalPorts} onChange={e => setFormData({ ...formData, totalPorts: Number(e.target.value) })}>
                                                <option value={4}>4 Ports</option>
                                                <option value={5}>5 Ports</option>
                                                <option value={8}>8 Ports</option>
                                                <option value={10}>10 Ports</option>
                                                <option value={13}>13 Ports (Mikrotik)</option>
                                                <option value={16}>16 Ports</option>
                                                <option value={24}>24 Ports</option>
                                                <option value={28}>28 Ports</option>
                                                <option value={48}>48 Ports</option>
                                                <option value={52}>52 Ports</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Default VLAN</label>
                                            <Input type="number" className={inputClass} value={formData.vlanDefault} onChange={e => setFormData({ ...formData, vlanDefault: e.target.value })} placeholder="10" />
                                        </div>
                                    </>
                                )}

                                {category === 'Security' && (
                                    <>
                                        <div>
                                            <label className={labelClass}>Input Channels</label>
                                            <select className={inputClass} value={formData.channels} onChange={e => setFormData({ ...formData, channels: e.target.value })}>
                                                <option value="4">4 Channels</option>
                                                <option value="8">8 Channels</option>
                                                <option value="16">16 Channels</option>
                                                <option value="32">32 Channels</option>
                                                <option value="64">64 Channels</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Storage Capacity</label>
                                            <Input className={inputClass} value={formData.storage} onChange={e => setFormData({ ...formData, storage: e.target.value })} placeholder="e.g. 8TB" />
                                        </div>
                                    </>
                                )}

                                {category === 'Telephony' && (
                                    <>
                                        <div>
                                            <label className={labelClass}>LSA/Pair Density</label>
                                            <Input type="number" className={inputClass} value={formData.pairs} onChange={e => setFormData({ ...formData, pairs: e.target.value })} placeholder="50" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Extension Range</label>
                                            <Input className={inputClass} value={formData.extRange} onChange={e => setFormData({ ...formData, extRange: e.target.value })} placeholder="100-199" />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className={labelClass}>Backbone Media</label>
                                    <select className={inputClass} value={formData.cableType} onChange={e => setFormData({ ...formData, cableType: e.target.value })}>
                                        <option value="Cat6">Cat6 (UTP)</option>
                                        <option value="Cat5e">Cat5e (UTP)</option>
                                        <option value="Fiber">Fiber Optic</option>
                                        <option value="Coaxial">Coaxial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Governance Status</label>
                                    <select required className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as DeviceStatus })}>
                                        <option value={DeviceStatus.ACTIVE}>Active / Online</option>
                                        <option value={DeviceStatus.SPARE}>Spare / Inventory</option>
                                        <option value={DeviceStatus.MAINTENANCE}>Under Maintenance</option>
                                        <option value={DeviceStatus.DECOMMISSIONED}>Decommissioned</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>Documentation Notes</label>
                                    <Textarea className={`${inputClass} min-h-[5rem] resize-none pb-2 pt-3`} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Add technical notes, port assignment rules, or maintenance history..." />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="px-9 py-6 bg-slate-50/50 dark:bg-zinc-950/20 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-md font-bold text-[10px] uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button type="submit" className="rounded-md font-bold text-[10px] uppercase tracking-widest px-6 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-900/90 dark:hover:bg-zinc-50/90 shadow">
                            <Save size={14} className="mr-2" />
                            {initialData ? 'Save Changes' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

