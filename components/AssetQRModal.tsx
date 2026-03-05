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
            <div className="flex flex-col items-center gap-1 opacity-40 mb-6">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-slate-900" />
                <span className="text-[7px] font-bold text-slate-900 uppercase tracking-widest">Inventory Control</span>
              </div>
              <span className="text-[7px] font-bold text-slate-900 uppercase tracking-widest">Registry v4.3</span>
            </div>

            <div className="flex flex-col items-center w-full gap-6 mb-6">
              <div className="bg-slate-900 px-4 py-1.5 rounded-lg shadow-sm z-10">
                <h4 className="font-mono font-bold text-base text-white tracking-[0.2em] leading-none">{asset.assetId}</h4>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm w-full max-w-[180px] aspect-square flex items-center justify-center relative z-0">
                <canvas ref={canvasRef} className="rounded-md w-full h-full" />
              </div>
            </div>

            <div className="text-center mt-2">
              <p className="font-bold text-sm text-slate-900 uppercase leading-tight mb-1 tracking-tight px-2">{asset.item}</p>
              <p className="text-[9px] font-semibold text-slate-500 truncate max-w-[200px] uppercase tracking-wider">{asset.company || 'IT OPERATIONS'}</p>
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