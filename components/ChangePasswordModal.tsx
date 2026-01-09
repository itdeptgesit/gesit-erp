
'use client';

import React, { useState } from 'react';
import { X, Lock, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setNewPassword('');
                setConfirmPassword('');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 mt-1 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all font-medium placeholder:text-slate-400";
    const labelClass = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1";

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Change Key</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Access Protocol Reset</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {success ? (
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                <Check size={24} strokeWidth={3} />
                            </div>
                            <p className="text-emerald-800 dark:text-emerald-400 font-bold text-sm uppercase tracking-widest">Protocol Updated</p>
                            <p className="text-emerald-600/70 dark:text-emerald-500/60 text-[10px] font-medium mt-1 uppercase tracking-widest leading-relaxed">Your secure passcode has been <br />successfully synchronized.</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-rose-100 dark:border-rose-900/20 animate-in slide-in-from-top-2">
                                    <span className="flex items-center gap-2"><Lock size={12} /> {error}</span>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>New Passcode</label>
                                    <input
                                        type="password" required className={inputClass}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Confirm Passcode</label>
                                    <input
                                        type="password" required className={inputClass}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] shadow-xl shadow-blue-500/20"
                                >
                                    {isLoading ? 'Syncing...' : 'Update Password'}
                                </button>
                                <button type="button" onClick={onClose} className="w-full py-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-all">Cancel</button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};
