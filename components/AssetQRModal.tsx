'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, QrCode as QrIcon, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { ITAsset } from '../types';

interface AssetQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ITAsset | null;
}

export const AssetQRModal: React.FC<AssetQRModalProps> = ({ isOpen, onClose, asset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen && asset && canvasRef.current) {
      const qrContent = `https://it.gesit.co.id/asset?id=${asset.assetId}`;

      QRCode.toCanvas(
        canvasRef.current,
        qrContent,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f172a', // Slate-900
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error(error);
          else {
            setQrDataUrl(canvasRef.current?.toDataURL('image/png') || '');
          }
        }
      );
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.download = `QR-${asset.assetId}.png`;
      link.href = qrDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-slate-800">
        {/* Header Modal */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">Identity Tag</h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Registry Authentication</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Physical Label Simulation */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 bg-white flex flex-col items-center w-full max-w-[280px] shadow-inner relative">
            {/* Micro Label Elements */}
            <div className="absolute top-4 left-6 flex items-center gap-1.5 opacity-20">
              <ShieldCheck size={10} className="text-slate-900" />
              <span className="text-[7px] font-black text-slate-900 uppercase tracking-widest">Inventory Control</span>
            </div>
            <div className="absolute top-4 right-6 opacity-20">
              <span className="text-[7px] font-black text-slate-900 uppercase tracking-widest">v4.1</span>
            </div>

            <div className="mt-4 mb-4 flex flex-col items-center">
              <div className="bg-slate-900 px-3 py-1 rounded-lg mb-4 shadow-sm">
                <h4 className="font-mono font-black text-lg text-white tracking-tighter leading-none">{asset.assetId}</h4>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-50 shadow-sm">
                <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto" />
              </div>
            </div>

            <div className="text-center">
              <p className="font-black text-xs text-slate-900 uppercase leading-none mb-1 tracking-tight">{asset.item}</p>
              <p className="text-[9px] font-bold text-slate-400 truncate max-w-[180px] uppercase tracking-wider">{asset.company || 'IT OPERATIONS'}</p>
            </div>
          </div>

          {/* Quick URL Info */}
          <div className="mt-8 w-full space-y-2">
            <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">Deployment URI</p>
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden text-center shadow-inner">
              <span className="text-blue-600 dark:text-blue-400 truncate block max-w-[240px] mx-auto text-[10px] font-mono font-bold tracking-tight">
                it.gesit.co.id/asset?id={asset.assetId}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Download size={14} /> Download Tag
          </button>
        </div>
      </div>
    </div>
  );
};