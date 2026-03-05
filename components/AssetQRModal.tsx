'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, QrCode as QrIcon, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { ITAsset } from '../types';
import { Button } from "@/components/ui/button";

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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        {/* Header Modal */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tighter text-sm">Identity Tag</h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Registry Authentication</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-8 w-8">
            <X size={18} />
          </Button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Physical Label Simulation */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-white flex flex-col items-center w-full max-w-[280px] shadow-sm relative">
            {/* Header Labels */}
            <div className="flex flex-col items-center gap-1 opacity-50 mb-7">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-slate-900" />
                <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Inventory Control</span>
              </div>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.2em]">Registry v4.3</span>
            </div>

            {/* Asset ID Badge */}
            <div className="bg-slate-900 px-5 py-2.5 rounded-xl shadow-md mb-6 relative">
              <h4 className="font-mono font-black text-base text-white tracking-[0.2em] leading-none">{asset.assetId}</h4>
              {/* Subtle design element */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-blue-500 rounded-full blur-[2px] opacity-50"></div>
            </div>

            {/* QR Code Canvas Container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-50 shadow-inner w-full max-w-[190px] aspect-square flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
              <canvas ref={canvasRef} className="rounded-lg w-full h-full" />
            </div>

            {/* Asset Details */}
            <div className="text-center w-full space-y-1.5 px-2">
              <p className="font-black text-[13px] text-slate-900 uppercase leading-snug tracking-tight line-clamp-2">{asset.item}</p>
              <div className="h-0.5 w-8 bg-slate-200 mx-auto rounded-full"></div>
              <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-[0.15em]">{asset.company || 'IT OPERATIONS'}</p>
            </div>
          </div>

          {/* Quick URL Info */}
          <div className="mt-8 w-full space-y-2">
            <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Deployment URI</p>
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-center shadow-sm">
              <a href={`https://it.gesit.co.id/asset?id=${asset.assetId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 truncate block max-w-[240px] mx-auto text-[10px] font-mono font-bold tracking-tight hover:underline">
                it.gesit.co.id/asset?id={asset.assetId}
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 text-[10px] font-bold uppercase tracking-widest"
          >
            Close
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-[2] bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-sm"
          >
            <Download size={14} className="mr-2" /> Download Tag
          </Button>
        </div>
      </div>
    </div>
  );
};