'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, LifeBuoy, ChevronRight, Mail, Lock, ShieldCheck, Globe, CheckCircle2, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';

interface LoginPageProps {
    onLogin: (email: string) => void;
    appName?: string;
    logoUrl?: string;
    primaryColor?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
    onLogin,
    appName = 'GESIT WORK',
    logoUrl = '/image/logo.png',
    primaryColor = '#0a2558'
}) => {
    const { t } = useLanguage();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [isDark, setIsDark] = useState(false);


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
            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.35; transform: scale(1.05); }
                    50% { opacity: 0.5; transform: scale(1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .text-shimmer {
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
                    background-size: 200% 100%;
                    animation: shimmer 3s infinite;
                    -webkit-background-clip: padding-box;
                    background-clip: padding-box;
                }
            `}</style>
            <main className="flex-1 flex items-stretch overflow-hidden">
                {/* Left Hero Side - Background Image */}
                <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between p-24">
                    {/* Background Layer */}
                    <div className="absolute inset-0" style={{ backgroundColor: primaryColor }}>
                        <img
                            src="/image/bg.jpeg"
                            alt="Background"
                            fetchPriority="high"
                            loading="eager"
                            className="w-full h-full object-cover opacity-60 mix-blend-multiply scale-105 animate-pulse-slow"
                        />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, ${primaryColor}4D, ${primaryColor}B3)` }}></div>

                        {/* Dynamic Light Orbs - Subtle for background clarity */}
                        <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse transform-gpu"></div>
                        <div className="absolute bottom-[5%] left-[-5%] w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] animate-pulse transform-gpu" style={{ animationDelay: '3s' }}></div>
                    </div>

                    <div className="relative z-10">
                        {/* Logo Section */}
                        <div className="mb-12 animate-in fade-in slide-in-from-left duration-1000">
                            <div className="w-24 h-24 flex items-center justify-center hover:scale-110 transition-transform duration-500 group relative">
                                <img src={logoUrl} alt="Logo" fetchPriority="high" loading="eager" className="w-full h-full object-contain filter drop-shadow-2xl group-hover:brightness-110 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-12 max-w-full">
                            <div className="animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                                <h1 className="text-5xl lg:text-6xl font-black text-white leading-none tracking-tighter font-display mb-6 uppercase whitespace-nowrap">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/100 to-white/60 drop-shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                                        {appName}
                                    </span>
                                </h1>
                                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl ring-1 ring-white/10">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.6)]"></div>
                                    <span className="text-xs font-black text-white uppercase tracking-[0.3em] font-display">
                                        Enterprise Work Platform
                                    </span>
                                </div>
                            </div>

                            <p className="text-white/90 text-sm leading-relaxed font-medium max-w-lg animate-in fade-in slide-in-from-bottom duration-1000 delay-400 drop-shadow-lg">
                                Centralized platform for enterprise operations, infrastructure documentation, asset management, and service desk — built for speed and reliability.
                            </p>

                            <div className="flex gap-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-600">
                                <div className="group/badge p-0.5 rounded-2xl bg-gradient-to-br from-white/30 to-transparent hover:from-white/50 transition-all duration-500 shadow-2xl">
                                    <div className="bg-white/10 backdrop-blur-2xl px-6 py-4 rounded-xl border border-white/10 flex items-center gap-3 group-hover/badge:bg-white/20 transition-all">
                                        <span className="text-2xl filter drop-shadow-md group-hover/badge:scale-110 transition-transform duration-300">🚀</span>
                                        <div>
                                            <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] leading-none mb-1.5">Engine</div>
                                            <div className="text-sm font-black text-white uppercase tracking-wider">High Speed</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="group/badge p-0.5 rounded-2xl bg-gradient-to-br from-white/30 to-transparent hover:from-white/50 transition-all duration-500 shadow-2xl">
                                    <div className="bg-white/10 backdrop-blur-2xl px-6 py-4 rounded-xl border border-white/10 flex items-center gap-3 group-hover/badge:bg-white/20 transition-all">
                                        <span className="text-2xl filter drop-shadow-md group-hover/badge:scale-110 transition-transform duration-300">🔒</span>
                                        <div>
                                            <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] leading-none mb-1.5">Security</div>
                                            <div className="text-sm font-black text-white uppercase tracking-wider">Enterprise</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 animate-in fade-in duration-1000 delay-800">
                        <div className="flex flex-col gap-8">
                            <div className="flex gap-3 items-center">
                                <div className="h-[2px] w-12 bg-white/30 rounded-full"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em] font-display">
                                    © 2026 The Gesit Companies.
                                </p>
                                <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em] font-display">
                                    {appName} v2.5.0 — Proprietary Node
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Login Side */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
                    {/* Animated Background Orbs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse transform-gpu"></div>
                        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse transform-gpu" style={{ animationDelay: '1s' }}></div>
                    </div>

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle Theme"
                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-primary hover:scale-110 transition-all duration-300 shadow-lg z-50"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className="w-full max-w-[420px] transition-all duration-500 relative z-10">
                        {resetSent ? (
                            <div className="space-y-8 text-center bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl glass-card animate-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Email Sent</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Check your mailbox for instructions.</p>
                                <button
                                    onClick={() => { setResetSent(false); setIsResetMode(false); }}
                                    className="w-full h-14 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    BACK TO LOGIN
                                </button>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500">
                                <div className="mb-12">
                                    <h3 className="text-2xl md:text-3xl font-black tracking-tighter font-display mb-2" style={{ color: primaryColor }}>
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
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display ml-1">Username or Email</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110 z-10 pointer-events-none">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                className="w-full h-14 pl-12 pr-5 rounded-xl border-2 border-transparent bg-white/60 dark:bg-white/5 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-white/10 focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:shadow-lg focus:shadow-primary/5 focus:scale-[1.01] text-sm"
                                                placeholder="Enter your identity"
                                                type="text"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display">Password</label>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110 z-10 pointer-events-none">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <input
                                                className="w-full h-14 pl-12 pr-16 rounded-xl border-2 border-transparent bg-white/60 dark:bg-white/5 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-white/10 focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:shadow-lg focus:shadow-primary/5 focus:scale-[1.01] text-sm"
                                                placeholder="••••••••••••"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-primary transition-all duration-300 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="group relative w-full h-14 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl active:scale-[0.97] disabled:opacity-50 font-display overflow-hidden"
                                            style={{
                                                backgroundColor: primaryColor,
                                                boxShadow: `0 10px 40px -10px ${primaryColor}40, 0 0 0 1px ${primaryColor}20`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                            <span className="relative z-10 flex items-center gap-2">
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={18} />
                                                        AUTHENTICATING...
                                                    </>
                                                ) : (
                                                    isResetMode ? 'SEND RECOVERY LINK' : 'AUTHORIZE ACCESS'
                                                )}
                                            </span>
                                        </button>

                                        <div className="mt-8 flex flex-col items-center gap-6">
                                            <div className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    id="stay-connected"
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary/20 transition-all cursor-pointer accent-current"
                                                    style={{ accentColor: primaryColor }}
                                                />
                                                <label htmlFor="stay-connected" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors cursor-pointer">Stay connected</label>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setIsResetMode(!isResetMode)}
                                                className="text-[10px] font-black uppercase tracking-[0.2em] font-display transition-all duration-300 hover:scale-105"
                                                style={{ color: primaryColor }}
                                            >
                                                {isResetMode ? 'BACK TO SECURE LOGIN' : 'Forgot your password?'}
                                            </button>
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 text-center space-y-5">
                                            <div className="flex flex-col gap-3">
                                                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] font-display">Access issues?</span>
                                                <button
                                                    type="button"
                                                    className="text-[10px] font-black hover:underline uppercase tracking-[0.2em] font-display transition-all duration-300 hover:scale-105"
                                                    style={{ color: primaryColor }}
                                                >
                                                    Contact System Administrator
                                                </button>
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    onClick={() => window.location.href = '/helpdesk-public'}
                                                    className="w-full py-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 font-display border-2 border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-sm hover:shadow-lg hover:scale-[1.02]"
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