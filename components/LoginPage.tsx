'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, LifeBuoy, ChevronRight, Mail, Lock, ShieldCheck, Globe, CheckCircle2, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';

interface LoginPageProps {
    onLogin: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const { t } = useLanguage();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [isDark, setIsDark] = useState(false);

    const LOGO_URL = "/image/logo.png";

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let finalEmail = identifier.trim();
            if (!finalEmail.includes('@')) {
                const { data: userData, error: userError } = await supabase
                    .from('user_accounts')
                    .select('email')
                    .eq('username', finalEmail.toLowerCase())
                    .maybeSingle();

                if (userError) throw new Error(`Directory error: ${userError.message}`);
                if (!userData) throw new Error("Identity not recognized.");
                finalEmail = userData.email;
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: finalEmail,
                password: password,
            });

            if (authError) throw authError;
            if (data.session?.user?.email) {
                onLogin(data.session.user.email);
            }
        } catch (err: any) {
            setError(err.message || "Access denied.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
                redirectTo: 'https://it.gesit.co.id',
            });
            if (error) throw error;
            setResetSent(true);
        } catch (err: any) {
            setError(err.message || "Could not send reset link.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans selection:bg-blue-100 transition-colors duration-300">
            <main className="flex-1 flex items-stretch overflow-hidden">
                {/* Left Hero Side - Background Image */}
                <div className="hidden lg:flex w-[48%] relative overflow-hidden flex-col justify-between p-16">
                    {/* Dark Background Overlay */}
                    <div className="absolute inset-0 bg-[#0a2558]">
                        <img
                            src="/image/bg.jpeg"
                            alt="Background"
                            className="w-full h-full object-cover opacity-60 mix-blend-multiply"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2558]/30 via-transparent to-[#0a2558]/80"></div>
                    </div>

                    <div className="relative z-10">
                        {/* Logo Section */}
                        <div className="mb-8 animate-in fade-in slide-in-from-left duration-700">
                            <div className="w-28 h-28 flex items-center justify-center">
                                <img src="/image/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div className="space-y-8 max-w-xl">
                            <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                                <h2 className="text-6xl font-black text-white leading-[1.1] tracking-tight font-display mb-2">
                                    GESIT WORK
                                </h2>
                                <h3 className="text-2xl font-bold text-white/80 tracking-tight font-display">
                                    Enterprise Work Platform
                                </h3>
                            </div>
                            <p className="text-white/70 text-lg leading-relaxed font-medium max-w-md animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                                Centralized platform for enterprise operations, infrastructure documentation, asset management, and service desk — built for speed and reliability.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 animate-in fade-in duration-1000 delay-500">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                <div className="w-2 h-2 rounded-full bg-white/20"></div>
                            </div>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] font-display">
                                © 2026 The Gesit Companies. GESIT WORK™. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Login Side */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950 relative">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle Theme"
                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-[#0a2558] dark:hover:text-blue-400 transition-all shadow-sm z-50 backdrop-blur-md"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className="w-full max-w-[420px] transition-all duration-500">
                        {resetSent ? (
                            <div className="space-y-8 text-center bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl glass-card animate-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Email Sent</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Check your mailbox for instructions.</p>
                                <button
                                    onClick={() => { setResetSent(false); setIsResetMode(false); }}
                                    className="w-full h-14 bg-[#0a2558] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95"
                                >
                                    BACK TO LOGIN
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500">
                                <div className="mb-12">
                                    <h3 className="text-4xl font-black text-[#0a2558] dark:text-white tracking-tighter font-display mb-3">
                                        {isResetMode ? 'Recover Access' : 'Sign In'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
                                        {isResetMode ? 'Enter your email to reset security key' : 'Access your Gesit Work dashboard'}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-8 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display ml-1">Username or Email</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0a2558] transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                className="w-full h-15 pl-14 pr-5 rounded-xl border-none bg-slate-50 dark:bg-white/5 focus:bg-slate-100 dark:focus:bg-white/10 transition-all outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-300"
                                                placeholder="Enter your identity"
                                                type="text"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {!isResetMode && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">Password</label>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0a2558] transition-colors">
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <input
                                                    className="w-full h-15 pl-14 pr-14 rounded-xl border-none bg-slate-50 dark:bg-white/5 focus:bg-slate-100 dark:focus:bg-white/10 transition-all outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-300"
                                                    placeholder="••••••••••••"
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-400"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-15 bg-[#0a2558] hover:bg-[#0c2d6b] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 font-display"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="animate-spin" size={18} />
                                            ) : (
                                                isResetMode ? 'SEND RECOVERY LINK' : 'Authorize Access'
                                            )}
                                        </button>

                                        <div className="mt-8 flex flex-col items-center gap-6">
                                            <div className="flex items-center gap-2 cursor-pointer group">
                                                <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-[#0a2558] focus:ring-blue-500/20 transition-all" />
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-display">Stay connected</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setIsResetMode(!isResetMode)}
                                                className="text-[10px] font-black text-slate-400 hover:text-[#0a2558] dark:hover:text-white uppercase tracking-widest font-display transition-colors"
                                            >
                                                {isResetMode ? 'BACK TO SECURE LOGIN' : 'Forgot your password?'}
                                            </button>
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-slate-50 dark:border-white/5 text-center space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest font-display">Access issues?</span>
                                                <button type="button" className="text-[10px] font-black text-[#0a2558] dark:text-blue-400 hover:underline uppercase tracking-widest font-display">
                                                    Contact System Administrator
                                                </button>
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    onClick={() => window.location.href = '/helpdesk-public'}
                                                    className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 font-display"
                                                >
                                                    <LifeBuoy size={16} />
                                                    Portal Helpdesk
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);