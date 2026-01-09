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

    const LOGO_URL = "https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png";

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
                redirectTo: 'https://gesitcloud.web.id',
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
            <main className="flex-1 flex items-stretch">
                {/* Left Hero Side - Blue/Dark Card */}
                <div className="hidden lg:flex w-[45%] bg-[#0f172a] relative overflow-hidden flex-col justify-between p-16">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>

                    <div className="relative z-10">
                        <img src={LOGO_URL} alt="Logo" className="h-24 w-auto mb-16 drop-shadow-2xl" />

                        <div className="space-y-6 max-w-md">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                                <ShieldCheck size={14} />
                                <span className="text-xs font-semibold uppercase tracking-widest">Secured Access</span>
                            </div>
                            <h2 className="text-5xl font-bold text-white leading-tight tracking-tight">
                                Smart operations <br />
                                for <span className="text-blue-500">modern teams.</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed font-medium">
                                Manage infrastructure, procurement, and IT workflows from a single intuitive core.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                            <span className="text-sm font-medium text-slate-300">All Systems Operational</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Globe size={16} />
                            <span className="text-sm font-medium">Stable v4.1</span>
                        </div>
                    </div>
                </div>

                {/* Right Login Side - Adjusted pt-24 to lower the form slightly while remaining centered in content flow */}
                <div className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-8 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-y-auto">

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md z-50"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="w-full max-w-[420px]">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
                            <div className="mb-10 text-center lg:text-left">
                                <img src={LOGO_URL} alt="Logo" className="h-12 w-auto mb-8 mx-auto lg:mx-0 lg:hidden" />
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {isResetMode ? 'Recover Access' : 'Sign In'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                                    {isResetMode ? 'Enter your email to reset security key' : 'Access your enterprise dashboard'}
                                </p>
                            </div>

                            {error && (
                                <div className="mb-8 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm font-medium flex items-start gap-3">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {resetSent ? (
                                <div className="space-y-6 py-6 text-center">
                                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Email Sent</h4>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Check your inbox for recovery instructions.</p>
                                    <button
                                        onClick={() => { setResetSent(false); setIsResetMode(false); }}
                                        className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            ) : isResetMode ? (
                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email address</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-800 dark:text-slate-100 font-medium"
                                                placeholder="name@company.com"
                                                type="email"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Send Reset Link <ChevronRight size={18} /></>}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsResetMode(false)}
                                        className="w-full text-center py-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-sm transition-colors"
                                    >
                                        Return to standard login
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Username or Email</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-800 dark:text-slate-100 font-medium"
                                                placeholder="Enter your identity"
                                                type="text"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
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

                                    <div className="flex items-center justify-between px-1">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer" />
                                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white">Stay connected</span>
                                        </label>
                                    </div>

                                    <div className="space-y-4 pt-2">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full h-14 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="animate-spin" size={20} />
                                            ) : (
                                                <>Authorize Access <ChevronRight size={18} /></>
                                            )}
                                        </button>

                                        <div className="text-center">
                                            <button
                                                type="button"
                                                onClick={() => setIsResetMode(true)}
                                                className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors py-1"
                                            >
                                                Forgot your password?
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-10 mt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                            Access issues? <br />
                                            <button type="button" className="text-blue-600 font-bold hover:underline">Contact System Administrator</button>
                                        </p>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* IT Helpdesk System Portal Button - Robust Style */}
                        <div className="mt-12 mb-8 flex flex-col items-center gap-6">
                            <button
                                onClick={() => window.location.href = '/helpdesk'}
                                className="group flex items-center gap-3 px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <LifeBuoy size={16} />
                                </div>
                                Portal IT Helpdesk
                            </button>

                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-widest uppercase">
                                <p>© 2025 Gesit ERP Enterprise</p>
                                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                                <p>v4.1.2 Stable</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);