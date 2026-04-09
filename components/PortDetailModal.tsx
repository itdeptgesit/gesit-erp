'use client';

import React, { useState, useEffect } from 'react';
import { X, Network, Server, Wifi, Video, Printer, Smartphone, Monitor, Square, Phone, PhoneCall, Save, Link2, Cable } from 'lucide-react';
import { SwitchPort, DeviceType, PortStatus, NetworkSwitch } from '../types';

interface PortDetailModalProps {
  port: SwitchPort | null;
  onClose: () => void;
  switchName: string;
  onSave?: (updatedPort: SwitchPort) => void;
  availableSwitches?: NetworkSwitch[];
  canManage?: boolean;
}

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case DeviceType.AP: return <Wifi className="text-blue-500" />;
    case DeviceType.CCTV: return <Video className="text-purple-500" />;
    case DeviceType.PRINTER: return <Printer className="text-orange-500" />;
    case DeviceType.IP_PHONE: return <Smartphone className="text-green-500" />;
    case DeviceType.ANALOG_PHONE: return <Phone className="text-green-600" />;
    case DeviceType.SERVER: return <Server className="text-indigo-600" />;
    case DeviceType.PC: return <Monitor className="text-slate-600" />;
    case DeviceType.FACEPLATE: return <Square className="text-yellow-600" />;
    case DeviceType.PABX: return <PhoneCall className="text-blue-800" />;
    default: return <Network className="text-gray-400" />;
  }
};

const getStatusColor = (status: PortStatus) => {
  switch (status) {
    case PortStatus.ACTIVE: return 'bg-green-100 text-green-700 border-green-200';
    case PortStatus.IDLE: return 'bg-red-50 text-red-600 border-red-200';
    case PortStatus.ERROR: return 'bg-orange-100 text-orange-700 border-orange-200';
    case PortStatus.DISABLED: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const PortDetailModal: React.FC<PortDetailModalProps> = ({ port, onClose, switchName, onSave, availableSwitches = [], canManage = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SwitchPort>>({});

  useEffect(() => {
    if (port) {
      setEditData(port);
      setIsEditing(false);
    }
  }, [port]);

  if (!port) return null;

  const handleSave = () => {
    if (onSave && port) {
      onSave({ ...port, ...editData } as SwitchPort);
      setIsEditing(false);
    }
  };

  const isLSA = switchName.includes('LSA');
  const isVoicePanel = switchName.includes('Faceplate') || switchName.includes('Voice Panel');
  const isTelephony = isLSA || isVoicePanel;

  const inputClass = "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all";
  const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {isTelephony ? `${port.patchPanelPort || 'Port ' + port.portNumber}` : `Port ${port.portNumber}`}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{switchName}</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
              {getDeviceIcon(editData.deviceType as DeviceType || port.deviceType)}
            </div>
            <div className="flex-1">
              <label className={labelClass}>Connection Target</label>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input type="text" value={editData.deviceConnected || ''} onChange={e => setEditData({ ...editData, deviceConnected: e.target.value })} className={inputClass} placeholder="e.g. Finance PC-01" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value as PortStatus })} className={inputClass}><option value={PortStatus.ACTIVE}>Active</option><option value={PortStatus.IDLE}>Idle</option><option value={PortStatus.ERROR}>Error</option><option value={PortStatus.DISABLED}>Disabled</option></select>
                    <select value={editData.deviceType} onChange={e => setEditData({ ...editData, deviceType: e.target.value as DeviceType })} className={inputClass}>{Object.values(DeviceType).map(dt => <option key={dt} value={dt}>{dt}</option>)}</select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5"><h4 className="text-xl font-bold text-slate-900 leading-none">{port.deviceConnected || "Unassigned"}</h4><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border w-fit ${getStatusColor(port.status)}`}><span className={`w-1.5 h-1.5 rounded-full ${port.status === PortStatus.ACTIVE ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-400'}`}></span>{port.status}</span></div>
              )}
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <label className={labelClass}>IP Address</label>
                {isEditing ? (
                  <input type="text" className={inputClass} value={editData.ipAddress || ''} onChange={e => setEditData({ ...editData, ipAddress: e.target.value })} placeholder="e.g. 192.168.1.50" />
                ) : (
                  <p className="font-mono font-bold text-blue-600 text-sm">{port.ipAddress || '-'}</p>
                )}
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <label className={labelClass}>MAC Address</label>
                {isEditing ? (
                  <input type="text" className={inputClass} value={editData.macAddress || ''} onChange={e => setEditData({ ...editData, macAddress: e.target.value })} placeholder="e.g. 00:0A:95:9D:68:16" />
                ) : (
                  <p className="font-mono font-bold text-slate-500 text-[11px] uppercase">{port.macAddress || '-'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100"><label className={labelClass}>VLAN / Logic ID</label>{isEditing ? (<input type="number" className={inputClass} value={editData.vlan || ''} onChange={e => setEditData({ ...editData, vlan: Number(e.target.value) })} />) : (<p className="font-bold text-slate-800 text-lg">{port.vlan || '-'}</p>)}</div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <label className={labelClass}>Link Speed</label>
                {isEditing ? (
                  <select className={inputClass} value={editData.linkSpeed || '1 Gbps'} onChange={e => setEditData({ ...editData, linkSpeed: e.target.value as any })}>
                    <option value="10 Mbps">10 Mbps</option>
                    <option value="100 Mbps">100 Mbps</option>
                    <option value="1 Gbps">1 Gbps</option>
                    <option value="2.5 Gbps">2.5 Gbps</option>
                    <option value="10 Gbps">10 Gbps</option>
                  </select>
                ) : (
                  <p className="font-bold text-blue-600 text-sm italic">{port.linkSpeed || '1 Gbps'}</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100"><label className={labelClass}>Media Infrastructure</label>{isEditing ? (<select className={inputClass} value={editData.cableType || 'Cat6'} onChange={e => setEditData({ ...editData, cableType: e.target.value as any })}><option value="Cat6">Cat6 (UTP)</option><option value="Cat5e">Cat5e (UTP)</option><option value="Coaxial">Coaxial (Analog)</option><option value="Fiber">Fiber Optic</option></select>) : (<div className="flex flex-col"><span className="font-bold text-slate-800 flex items-center gap-2"><Cable size={14} className="text-blue-500" />{port.cableType || 'UTP/Cat6'}</span><span className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{port.cableLength || 'Std Length'}</span></div>)}</div>

            <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-100/50"><label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Link2 size={12} /> Switch Interconnection</label>{isEditing ? (<select className={inputClass} value={editData.uplinkDeviceId || ''} onChange={e => setEditData({ ...editData, uplinkDeviceId: e.target.value })}><option value="">No Uplink (End Device)</option>{availableSwitches.filter(s => s.name !== switchName).map(sw => (<option key={sw.id} value={sw.id}>Link to: {sw.name}</option>))}</select>) : (<div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${port.uplinkDeviceId ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}><Server size={18} /></div><div><p className="text-[13px] font-bold text-slate-800">{port.uplinkDeviceId ? availableSwitches.find(s => s.id === port.uplinkDeviceId)?.name : 'Standalone Port'}</p><p className="text-[10px] text-slate-400 font-medium">{port.uplinkDeviceId ? 'Fiber/Copper Trunking' : 'Connected to standard end-device'}</p></div></div>)}</div>
            <div className="pt-4 border-t border-slate-50"><label className={labelClass}>Physical Documentation</label><div className="flex justify-between items-center text-xs"><span className="text-slate-400 font-medium">Patch Panel Port</span><span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{port.patchPanelPort}</span></div></div>
          </div>
        </div>

        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">Close</button>
          {canManage && (
            isEditing ? (
              <button onClick={handleSave} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"><Save size={16} /> Save Circuit</button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-8 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-black shadow-lg shadow-slate-200 transition-all">Edit Wiring Config</button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
