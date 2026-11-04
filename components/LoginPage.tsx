'use client';

import React, { useState } from 'react';
import { 
    AlertCircle, CheckCircle2, Loader2,
    Mail, Lock, Eye, EyeOff, Sun, Moon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../translations';
import { useGesitTheme } from '../lib/useGesitTheme';
import { sendPasswordResetNotificationEmail } from '../utils/EmailSystemUtils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginPageProps {
    onLogin: (email: string) => void;
    appName?: string;
    logoUrl?: string;
    primaryColor?: string;
    userGroups?: string[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
    onLogin,
    appName = 'GESIT PORTAL',
    logoUrl = '/image/logo.png',
}) => {
    const { t } = useLanguage();
    const { isDark, toggleTheme } = useGesitTheme();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);

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
            console.error("LoginPage: Login failure detail:", err);
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
            
            // Send additional explicit notification via Resend API
            await sendPasswordResetNotificationEmail(identifier);
            
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
                    scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
                    queryParams: {
                        prompt: 'select_account',
                        access_type: 'offline'
                    }
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Could not initiate Google login.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-zinc-50 dark:bg-[#08090a] text-zinc-900 dark:text-[#ffffff] flex flex-col font-sans transition-colors duration-200 overflow-hidden select-none">
            <main className="flex-1 flex items-stretch min-h-screen overflow-hidden">
                {/* Left Hero Side - Linear Precision Instrument (Light & Dark) */}
                <div className="hidden lg:flex w-[46%] relative overflow-hidden flex-col justify-between p-16 xl:p-20 bg-zinc-100/70 dark:bg-[#08090a] border-r border-zinc-200 dark:border-[#23252a]">
                    {/* Subtle Linear Grid Pattern */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-20"
                        style={{
                            backgroundImage: isDark
                                ? `linear-gradient(to right, #23252a 1px, transparent 1px), linear-gradient(to bottom, #23252a 1px, transparent 1px)`
                                : `linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                            maskImage: 'radial-gradient(ellipse 80% 80% at 30% 40%, #000 60%, transparent 100%)'
                        }}
                    />

                    {/* Top Branding */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3.5 mb-16">
                            <div className="w-10 h-10 rounded-[8px] bg-white dark:bg-[#0f1011] border border-zinc-200 dark:border-[#23252a] flex items-center justify-center p-2 shrink-0 shadow-xs dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <span className="text-sm font-semibold tracking-[-0.022em] text-zinc-900 dark:text-[#ffffff] block">{appName}</span>
                                <span className="text-[11px] font-mono text-zinc-500 dark:text-[#8a8f98] tracking-tight">ENTERPRISE WORKSPACE</span>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-lg">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-[#23252a] bg-white dark:bg-[#161718] text-[11px] font-medium text-zinc-600 dark:text-[#8a8f98] tracking-[-0.011em]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#27a644]" />
                                Sistem Operasional Aktif · SLA 99.9%
                            </div>

                            <h1 className="text-3xl xl:text-4xl font-medium tracking-[-0.022em] text-zinc-900 dark:text-[#ffffff] leading-tight">
                                Platform Kerja Digital &amp; Manajemen Terintegrasi
                            </h1>

                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-[#8a8f98] font-normal tracking-[-0.011em]">
                                Dirancang dengan presisi instrumen untuk keandalan infrastruktur IT, pemantauan status real-time, dan tata kelola aset korporat.
                            </p>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-4 rounded-[8px] border border-zinc-200 dark:border-[#23252a] bg-white dark:bg-[#0f1011] shadow-xs dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                    <div className="text-xs font-medium text-zinc-900 dark:text-[#ffffff] mb-1 tracking-[-0.011em]">Infrastruktur Aman</div>
                                    <div className="text-[11px] text-zinc-500 dark:text-[#8a8f98] leading-normal tracking-[-0.011em]">Proteksi akses berbasis role &amp; audit log real-time</div>
                                </div>
                                <div className="p-4 rounded-[8px] border border-zinc-200 dark:border-[#23252a] bg-white dark:bg-[#0f1011] shadow-xs dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                    <div className="text-xs font-medium text-zinc-900 dark:text-[#ffffff] mb-1 tracking-[-0.011em]">Performa Tinggi</div>
                                    <div className="text-[11px] text-zinc-500 dark:text-[#8a8f98] leading-normal tracking-[-0.011em]">Arsitektur database cloud tersinkronisasi instan</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Bottom Footer */}
                    <div className="relative z-10 pt-10 border-t border-zinc-200 dark:border-[#23252a] flex items-center justify-between text-xs text-zinc-500 dark:text-[#8a8f98] tracking-[-0.011em]">
                        <span>© 2026 Gesit Portal Ecosystem</span>
                        <span className="font-mono text-[11px] text-zinc-400 dark:text-[#62666d]">v3.0.1</span>
                    </div>
                </div>

                {/* Right Login Side - Linear Card Container (Light & Dark) */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 relative bg-zinc-50 dark:bg-[#08090a]">
                    {/* Theme Toggle Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleTheme}
                        className="absolute top-6 right-6 w-8 h-8 rounded-[6px] border border-zinc-200 dark:border-[#23252a] bg-white dark:bg-[#0f1011] hover:bg-zinc-100 dark:hover:bg-[#161718] text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#ffffff] transition-all shadow-xs"
                        title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
                    >
                        {isDark ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
                    </Button>

                    <div className="w-full max-w-[400px] mx-auto">
                        <AnimatePresence mode="wait">
                            {resetSent ? (
                                <motion.div
                                    key="reset-success"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Card className="rounded-[12px] border border-zinc-200 dark:border-[#23252a] bg-white dark:bg-[#0f1011] p-8 text-center space-y-6 shadow-xs dark:shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                                        <div className="w-12 h-12 rounded-[8px] bg-[rgba(39,166,68,0.1)] border border-[rgba(39,166,68,0.25)] text-[#27a644] flex items-center justify-center mx-auto">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-medium tracking-[-0.022em] text-zinc-900 dark:text-[#ffffff]">Email Terkirim</h3>
                                            <p className="text-xs text-zinc-500 dark:text-[#8a8f98] leading-relaxed tracking-[-0.011em]">
                                                Instruksi pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa inbox atau folder spam.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => { setResetSent(false); setIsResetMode(false); }}
                                            className="w-full h-9 rounded-[6px] bg-[#08090a] hover:bg-[#222326] text-white dark:bg-[#e4f222] dark:hover:bg-[#d9e620] dark:text-[#08090a] font-medium text-xs tracking-[-0.011em] shadow-xs dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all"
                                        >
                                            Kembali ke Halaman Masuk
                                        </Button>
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={isResetMode ? "reset-mode" : "login-mode"}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Card className="rounded-[12px] border border-zinc-200 dark:border-[#23252a] bg-white dark:bg-[#0f1011] shadow-xs dark:shadow-[0_2px_4px_rgba(0,0,0,0.4)] overflow-hidden">
                                        <CardHeader className="pt-8 px-8 pb-4">
                                            {/* Mobile Logo Branding */}
                                            <div className="lg:hidden mb-6 flex flex-col items-center text-center gap-2.5">
                                                <div className="w-12 h-12 p-2 bg-zinc-100 dark:bg-[#161718] rounded-[8px] border border-zinc-200 dark:border-[#23252a] flex items-center justify-center shadow-xs">
                                                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-semibold text-zinc-900 dark:text-[#ffffff] tracking-[-0.022em] uppercase">{appName}</h2>
                                                    <p className="text-[11px] font-mono text-zinc-500 dark:text-[#8a8f98]">PORTAL AKSES KARYAWAN &amp; IT</p>
                                                </div>
                                            </div>

                                            <CardTitle className="text-xl font-medium tracking-[-0.022em] text-zinc-900 dark:text-[#ffffff]">
                                                {isResetMode ? 'Pulihkan Kata Sandi' : 'Selamat Datang'}
                                            </CardTitle>
                                            <CardDescription className="text-xs text-zinc-500 dark:text-[#8a8f98] mt-1 tracking-[-0.011em]">
                                                {isResetMode 
                                                    ? 'Masukkan username atau email terdaftar untuk verifikasi.' 
                                                    : 'Masuk dengan kredensial akun portal atau Google.'}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="px-8 pb-6">
                                            {error && (
                                                <Alert variant="destructive" className="mb-5 rounded-[6px] border border-[rgba(235,87,87,0.25)] bg-[rgba(235,87,87,0.08)] p-3 flex items-start gap-2.5 text-[#eb5757]">
                                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#eb5757]" />
                                                    <AlertDescription className="text-xs font-medium text-[#eb5757] leading-normal tracking-[-0.011em]">
                                                        {error}
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-medium text-zinc-700 dark:text-[#d0d6e0] tracking-[-0.011em]">
                                                        Email atau Username
                                                    </Label>
                                                    <div className="relative">
                                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#62666d] pointer-events-none" />
                                                        <Input
                                                            placeholder="contoh: rudi atau rudi@gesit.co.id"
                                                            type="text"
                                                            value={identifier}
                                                            onChange={(e) => setIdentifier(e.target.value)}
                                                            required
                                                            className="pl-9 pr-3 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {!isResetMode && (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-medium text-zinc-700 dark:text-[#d0d6e0] tracking-[-0.011em]">
                                                                Kata Sandi
                                                            </Label>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsResetMode(true)}
                                                                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#ffffff] transition-colors tracking-[-0.011em]"
                                                            >
                                                                Lupa kata sandi?
                                                            </button>
                                                        </div>
                                                        <div className="relative">
                                                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-[#62666d] pointer-events-none" />
                                                            <Input
                                                                placeholder="Masukkan kata sandi"
                                                                type={showPassword ? "text" : "password"}
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                required
                                                                className="pl-9 pr-9 text-xs"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:text-[#62666d] dark:hover:text-[#d0d6e0] p-1 transition-colors"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                tabIndex={-1}
                                                                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                                                            >
                                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full h-9 rounded-[6px] bg-[#08090a] hover:bg-[#222326] text-white dark:bg-[#e4f222] dark:hover:bg-[#d9e620] dark:text-[#08090a] font-medium text-xs tracking-[-0.011em] shadow-xs dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-all mt-2"
                                                >
                                                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (isResetMode ? 'Kirim Link Pemulihan' : 'Masuk Sekarang')}
                                                </Button>
                                            </form>

                                            {isResetMode && (
                                                <div className="mt-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsResetMode(false)}
                                                        className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-[#8a8f98] dark:hover:text-[#ffffff] transition-colors tracking-[-0.011em]"
                                                    >
                                                        ← Kembali ke Halaman Masuk
                                                    </button>
                                                </div>
                                            )}

                                            {!isResetMode && (
                                                <div className="mt-5 space-y-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-px flex-1 bg-zinc-200 dark:bg-[#23252a]" />
                                                        <span className="text-[10px] font-mono text-zinc-400 dark:text-[#62666d] uppercase tracking-wider">Atau masuk dengan</span>
                                                        <div className="h-px flex-1 bg-zinc-200 dark:bg-[#23252a]" />
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        onClick={handleGoogleLogin}
                                                        disabled={isLoading}
                                                        className="w-full h-9 rounded-[6px] border border-zinc-200 dark:border-[#23252a] bg-white hover:bg-zinc-50 text-zinc-900 dark:bg-[#161718] dark:hover:bg-[#23252a] dark:text-[#ffffff] text-xs font-medium tracking-[-0.011em] flex items-center justify-center gap-2.5 transition-colors shadow-xs"
                                                    >
                                                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.18l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                        </svg>
                                                        Akun Google
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="px-8 pb-6 pt-0 flex flex-col gap-3">
                                            <div className="w-full h-px bg-zinc-200 dark:bg-[#23252a]" />
                                            <div className="flex items-center justify-between w-full text-[11px] text-zinc-500 dark:text-[#8a8f98] tracking-[-0.011em]">
                                                <button
                                                    type="button"
                                                    onClick={() => window.location.href = 'mailto:it@gesit.co.id'}
                                                    className="font-medium hover:text-zinc-900 dark:hover:text-[#ffffff] transition-colors"
                                                >
                                                    Bantuan IT Support
                                                </button>
                                                <div className="flex items-center gap-2.5 text-zinc-400 dark:text-[#62666d]">
                                                    <a href="/privacy" className="hover:text-zinc-600 dark:hover:text-[#8a8f98] transition-colors">Privacy</a>
                                                    <span>·</span>
                                                    <a href="/terms" className="hover:text-zinc-600 dark:hover:text-[#8a8f98] transition-colors">Terms</a>
                                                </div>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </main>
        </div>
    );
};
