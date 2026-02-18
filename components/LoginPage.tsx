'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, LifeBuoy, ChevronRight, Mail, Lock, ShieldCheck, Globe, CheckCircle2, Sun, Moon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/login',
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Could not initiate Google login.");
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
                        <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.6 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            src="/image/bg.jpeg"
                            alt="Background"
                            fetchPriority="high"
                            loading="eager"
                            className="w-full h-full object-cover mix-blend-multiply"
                        />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, ${primaryColor}66, ${primaryColor}E6)` }}></div>

                        {/* Glass Overlay for depth */}
                        <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none"></div>

                        {/* Dynamic Light Orbs */}
                        <motion.div
                            animate={{
                                opacity: [0.1, 0.2, 0.1],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] transform-gpu"
                        ></motion.div>
                        <motion.div
                            animate={{
                                opacity: [0.1, 0.3, 0.1],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                            className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] transform-gpu"
                        ></motion.div>
                    </div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            {/* Logo Section */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="mb-16"
                            >
                                <div className="w-28 h-28 flex items-center justify-center hover:scale-110 transition-transform duration-500 group relative">
                                    <div className="absolute inset-0 bg-white/5 rounded-3xl blur-2xl group-hover:bg-white/10 transition-colors"></div>
                                    <img src={logoUrl} alt="Logo" fetchPriority="high" loading="eager" className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:brightness-110 transition-all z-10" />
                                </div>
                            </motion.div>

                            <div className="space-y-12 max-w-full">
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                        className="text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-8 uppercase"
                                    >
                                        <span className="block opacity-60 text-2xl tracking-[0.3em] font-light mb-2">OPERATIONAL</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 drop-shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                                            {appName}
                                        </span>
                                    </motion.h1>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.5 }}
                                        className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10"
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.8)]"></div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] font-display">
                                            Enterprise Multi-Node Platform
                                        </span>
                                    </motion.div>
                                </div>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    transition={{ duration: 1, delay: 0.7 }}
                                    className="text-white text-base leading-relaxed font-medium max-w-lg drop-shadow-lg"
                                >
                                    Unified intelligence for corporate infrastructure, financial oversight, and rapid technical deployment — engineered for high-stakes environments.
                                </motion.p>

                                <div className="flex gap-8">
                                    {[
                                        { emoji: '⚡', label: 'Engine', value: 'High Performance' },
                                        { emoji: '🛡️', label: 'Security', value: 'Classified Grade' }
                                    ].map((badge, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.8 + (i * 0.1) }}
                                            className="group/badge p-[1px] rounded-[1.5rem] bg-gradient-to-br from-white/20 to-transparent hover:from-white/40 transition-all duration-500 shadow-2xl"
                                        >
                                            <div className="bg-black/20 backdrop-blur-3xl px-6 py-5 rounded-[1.4rem] border border-white/5 flex items-center gap-4 group-hover/badge:bg-white/5 transition-all">
                                                <span className="text-3xl filter drop-shadow-md group-hover/badge:scale-110 transition-transform duration-300">{badge.emoji}</span>
                                                <div>
                                                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] leading-none mb-2">{badge.label}</div>
                                                    <div className="text-xs font-black text-white uppercase tracking-widest">{badge.value}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 1.2 }}
                            className="flex flex-col gap-8"
                        >
                            <div className="flex gap-4 items-center">
                                <div className="h-[1px] w-16 bg-white/20 rounded-full"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]"></div>
                                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.6em] font-display">
                                    © 2026 THE GESIT COMPANIES
                                </p>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] font-display">
                                    SYSTEM {appName} v3.0.1 — SECURE BROADCASTING
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Login Side */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
                    {/* Animated Background Orbs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                x: [0, 50, 0],
                                y: [0, 30, 0],
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute top-20 -right-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] transform-gpu"
                        ></motion.div>
                        <motion.div
                            animate={{
                                x: [0, -50, 0],
                                y: [0, -30, 0],
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] transform-gpu"
                        ></motion.div>
                    </div>

                    {/* Theme Toggle Button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleTheme}
                        aria-label="Toggle Theme"
                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-primary transition-all duration-300 shadow-xl z-50"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </motion.button>

                    <div className="w-full max-w-[440px] relative z-10 transition-all duration-700">
                        <AnimatePresence mode="wait">
                            {resetSent ? (
                                <motion.div
                                    key="reset-success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-8 text-center bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-12 rounded-[3rem] border border-white/20 dark:border-white/10 shadow-2xl glass-card"
                                >
                                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-500/5">
                                        <CheckCircle2 size={48} className="animate-in zoom-in duration-500 delay-200" />
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter leading-none">Transmission Sent</h4>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">The recovery protocol has been initiated. Please check your secure terminal.</p>
                                    </div>
                                    <button
                                        onClick={() => { setResetSent(false); setIsResetMode(false); }}
                                        className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl active:scale-95"
                                    >
                                        RETURN TO ACCESS CONTROL
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={isResetMode ? "reset-mode" : "login-mode"}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl p-10 md:p-12 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]"
                                >
                                    <div className="mb-12">
                                        <h3 className="text-3xl font-black tracking-tighter font-display mb-3 flex items-center gap-3">
                                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-white dark:to-slate-400">
                                                {isResetMode ? 'Recover Access' : 'Sign In'}
                                            </span>
                                            {!isResetMode && <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                            {isResetMode ? 'Enter your credentials to reset security node' : 'Authorized personnel only. Access logging active.'}
                                        </p>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="mb-8 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-5 rounded-[1.5rem] text-xs font-black uppercase tracking-wider flex items-start gap-4"
                                        >
                                            <AlertCircle size={20} className="shrink-0" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-display ml-1">Terminal Identity</label>
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110 z-10 pointer-events-none">
                                                    <Mail size={20} strokeWidth={2.5} />
                                                </div>
                                                <input
                                                    className="w-full h-14 pl-14 pr-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-500 outline-none text-slate-950 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm focus:shadow-xl focus:shadow-primary/5 text-sm"
                                                    placeholder="Username or email"
                                                    type="text"
                                                    value={identifier}
                                                    onChange={(e) => setIdentifier(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {!isResetMode && (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center ml-1">
                                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-display">Security Key</label>
                                                </div>
                                                <div className="relative group">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110 z-10 pointer-events-none">
                                                        <ShieldCheck size={20} strokeWidth={2.5} />
                                                    </div>
                                                    <input
                                                        className="w-full h-14 pl-14 pr-16 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] focus:bg-white dark:focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-500 outline-none text-slate-950 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm focus:shadow-xl focus:shadow-primary/5 text-sm"
                                                        placeholder="••••••••••••"
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-all duration-300 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={isLoading}
                                                className="group relative w-full h-16 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 overflow-hidden"
                                                style={{
                                                    backgroundColor: primaryColor,
                                                    boxShadow: `0 20px 40px -10px ${primaryColor}66`
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                                <span className="relative z-10 flex items-center gap-3">
                                                    {isLoading ? (
                                                        <Loader2 className="animate-spin" size={20} />
                                                    ) : (
                                                        <>
                                                            {isResetMode ? 'SEND RECOVERY LINK' : 'AUTHORIZE ACCESS'}
                                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </span>
                                            </motion.button>

                                            <div className="mt-10 flex flex-col items-center gap-6">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsResetMode(!isResetMode)}
                                                    className="text-[10px] font-black uppercase tracking-[0.2em] font-display transition-all duration-300 hover:scale-105 active:scale-95"
                                                    style={{ color: primaryColor }}
                                                >
                                                    {isResetMode ? 'BACK TO SECURE LOGIN' : 'RECOVER SECURITY KEY'}
                                                </button>

                                                <div className="flex items-center gap-4 my-2">
                                                    <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/5"></div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OR</span>
                                                    <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/5"></div>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.01, y: -2 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    type="button"
                                                    onClick={handleGoogleLogin}
                                                    disabled={isLoading}
                                                    className="w-full h-14 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-xl hover:border-primary/30 group disabled:opacity-50"
                                                >
                                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                        <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.18l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                    </svg>
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{t('googleSignIn')}</span>
                                                </motion.button>
                                            </div>

                                            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 text-center space-y-6">
                                                <div className="flex flex-col gap-3">
                                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] font-display">Technical Barrier?</span>
                                                    <button
                                                        type="button"
                                                        className="text-[10px] font-black hover:text-primary uppercase tracking-[0.2em] font-display transition-all duration-300"
                                                    >
                                                        Contact Node Administrator
                                                    </button>
                                                </div>

                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => window.location.href = '/helpdesk-public'}
                                                        className="w-full py-5 bg-slate-50 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3 font-display border border-slate-200/50 dark:border-white/5 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        <LifeBuoy size={18} className="text-primary" />
                                                        Portal Helpdesk
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);