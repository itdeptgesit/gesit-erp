'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ChevronRight, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const LOGO_URL = "https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png";

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setIsSuccess(true);

            // Redirect to home after 3 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Try requesting a new link.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans selection:bg-blue-100 transition-colors duration-300">
            <main className="flex-1 flex items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-full max-w-[420px]">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
                        <div className="mb-10 text-center">
                            <img src={LOGO_URL} alt="Logo" className="h-12 w-auto mb-8 mx-auto" />
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {isSuccess ? 'Security Updated' : 'Reset Password'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                                {isSuccess
                                    ? 'Your new credentials have been established'
                                    : 'Please enter your new secure password'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-8 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm font-medium flex items-start gap-3">
                                <span>{error}</span>
                            </div>
                        )}

                        {isSuccess ? (
                            <div className="space-y-6 py-4 text-center">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 scale-in-center">
                                    <CheckCircle2 size={40} />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    Redirecting to dashboard...
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">New Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-800 dark:text-slate-100 font-medium"
                                            placeholder="••••••••••••"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={20} />
                                        </div>
                                        <input
                                            className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-800 dark:text-slate-100 font-medium"
                                            placeholder="••••••••••••"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isLoading ? <RefreshCcw className="animate-spin" size={20} /> : <>Update Security Key <ChevronRight size={18} /></>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
