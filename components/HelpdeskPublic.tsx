'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Send, CheckCircle2, Search, Clock, Loader2,
    Phone, AlertCircle, Hash, ArrowLeft, PhoneCall, ShieldCheck, Headphones, MessageSquare, User, Globe, Sun, Moon, ChevronRight, MessageCircle
} from 'lucide-react';
import { useLanguage } from '../translations';

export const HelpdeskPublic: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'report' | 'check'>('report');
    const [mode, setMode] = useState<'form' | 'success'>('form');
    const [departments, setDepartments] = useState<string[]>([]);
    const [isDark, setIsDark] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        subject: '',
        description: '',
        priority: 'Medium'
    });
    const [ticketId, setTicketId] = useState('');
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3000);
    };

    const LOGO_URL = 'https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png';

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.error('Error playing sound:', e));
    };

    const sendBrowserNotification = (message: any) => {
        if (Notification.permission === 'granted') {
            new Notification('Gesit ERP - Update on your Ticket', {
                body: `New message: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`,
                icon: LOGO_URL
            });
        }
    };

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

    const isWorkingHours = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();
        return day >= 1 && day <= 5 && hours >= 8 && hours < 17;
    }, []);

    useEffect(() => {
        const fetchDepts = async () => {
            const { data } = await supabase.from('departments').select('name').order('name');
            if (data) setDepartments(data.map(d => d.name));
        };
        fetchDepts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const newTicketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
            const { error: dbError } = await supabase.from('helpdesk_tickets').insert([{
                ticket_id: newTicketId,
                requester_name: formData.name,
                department: formData.department,
                subject: formData.subject,
                description: formData.description,
                priority: formData.priority,
                status: 'Open',
                created_at: new Date().toISOString()
            }]);

            if (dbError) throw dbError;

            // Notify Admins
            const { data: admins } = await supabase
                .from('user_accounts')
                .select('email')
                .eq('role', 'Admin');

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_email: admin.email,
                    title: 'New Service Ticket',
                    message: `${formData.name} from ${formData.department} reported: ${formData.subject}`,
                    type: 'Info',
                    link: 'helpdesk'
                }));
                await supabase.from('notifications').insert(notifications);
            }

            setTicketId(newTicketId);
            setMode('success');
        } catch (err: any) {
            setError(err.message || 'Error submitting report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCheckStatus = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchId) return;
        setIsSubmitting(true);
        setError(null);
        setSearchResult(null);
        try {
            const { data, error: dbError } = await supabase
                .from('helpdesk_tickets')
                .select('*')
                .eq('ticket_id', searchId.toUpperCase().trim())
                .maybeSingle();

            if (dbError) throw dbError;
            if (!data) throw new Error('Ticket ID not found.');
            setSearchResult(data);
            fetchMessages(data.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchMessages = async (ticketId: number) => {
        try {
            const { data, error: dbError } = await supabase
                .from('helpdesk_ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });
            if (dbError) throw dbError;
            setMessages(data || []);
        } catch (err: any) {
            console.error('Error fetching messages:', err);
        }
    };

    const handleSendFeedback = async () => {
        if (!feedbackText.trim() || !searchResult) return;
        setIsSendingFeedback(true);
        try {
            // Insert into messages history
            const { error: msgError } = await supabase.from('helpdesk_ticket_messages').insert([{
                ticket_id: searchResult.id,
                sender_name: searchResult.requester_name,
                sender_role: 'User',
                message: feedbackText
            }]);
            if (msgError) throw msgError;

            // Also update ticket summary for backward compatibility
            await supabase
                .from('helpdesk_tickets')
                .update({ requester_feedback: feedbackText })
                .eq('id', searchResult.id);

            // Notify Assigned IT or Admins
            const targetEmail = searchResult.assigned_to_email || null;
            if (targetEmail) {
                await supabase.from('notifications').insert([{
                    user_email: targetEmail,
                    title: 'New Response on Ticket',
                    message: `Requester ${searchResult.requester_name} sent a message: ${feedbackText.substring(0, 50)}...`,
                    type: 'Info',
                    link: 'helpdesk'
                }]);
            } else {
                // If no one assigned, notify all admins
                const { data: admins } = await supabase.from('user_accounts').select('email').eq('role', 'Admin');
                if (admins) {
                    const notices = admins.map(a => ({
                        user_email: a.email,
                        title: 'Ticket Message Update',
                        message: `New message on ${searchResult.subject} from ${searchResult.requester_name}`,
                        type: 'Info',
                        link: 'helpdesk'
                    }));
                    await supabase.from('notifications').insert(notices);
                }
            }

            setFeedbackText('');
            showToast("Message sent successfully.");
        } catch (err: any) {
            showToast("Failed to send: " + err.message, 'error');
        } finally {
            setIsSendingFeedback(false);
        }
    };

    useEffect(() => {
        if (!searchResult) return;

        const ticketChannel = supabase
            .channel(`public_ticket_${searchResult.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'helpdesk_tickets',
                filter: `id=eq.${searchResult.id}`
            }, (payload) => {
                setSearchResult(payload.new);
            })
            .subscribe();

        const messageChannel = supabase
            .channel(`public_ticket_messages_${searchResult.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'helpdesk_ticket_messages',
                filter: `ticket_id=eq.${searchResult.id}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                if (payload.new.sender_role !== 'User') {
                    playNotificationSound();
                    sendBrowserNotification(payload.new);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ticketChannel);
            supabase.removeChannel(messageChannel);
        };
    }, [searchResult?.id]);

    const inputClass = "w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400";
    const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block ml-1 uppercase tracking-widest";

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans selection:bg-blue-100 transition-colors duration-300">
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold tracking-tight">{toast.text}</span>
                </div>
            )}
            <main className="flex-1 flex items-stretch">
                {/* Left Hero Side */}
                <div className="hidden lg:flex w-[40%] bg-slate-900 dark:bg-[#020617] relative overflow-hidden flex-col justify-between p-16">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"></div>

                    <div className="relative z-10">
                        <img src={LOGO_URL} alt="Logo" className="h-16 w-auto mb-12" />

                        <div className="space-y-6 max-w-sm">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                                <Headphones size={14} />
                                <span className="text-xs font-bold uppercase tracking-widest">Support Portal</span>
                            </div>
                            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
                                Technical assistance, <br />
                                <span className="text-blue-500 italic">simplified.</span>
                            </h2>
                            <p className="text-slate-400 text-base leading-relaxed font-medium">
                                Report issues, request equipment, or track your previous tickets directly from our enterprise support node.
                            </p>

                            <div className="pt-8 space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <PhoneCall size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Emergency Line</p>
                                        <p className="text-white font-bold text-sm tracking-tight">Ext: 196</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Response</p>
                                        <p className="text-white font-bold text-sm tracking-tight">08:00 - 17:00 (Mon-Fri)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/5">
                        <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                            <ArrowLeft size={16} /> Return to Login
                        </button>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-y-auto">

                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle Theme"
                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-all shadow-sm z-50"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className="w-full max-w-[520px] py-12">
                        {mode === 'success' ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-14 shadow-xl border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Report Logged</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                                    Our technical team has been notified of your request.
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl mb-10 border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Registry ID</p>
                                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 font-mono tracking-tighter">{ticketId}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setMode('form');
                                        setActiveTab('check');
                                        setSearchId(ticketId);
                                        setTimeout(() => handleCheckStatus(), 100);
                                    }}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Track Now
                                </button>
                                <button
                                    onClick={() => { setMode('form'); setActiveTab('report'); }}
                                    className="w-full mt-4 py-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 font-bold transition-colors text-sm uppercase tracking-widest"
                                >
                                    Back to Hub
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 dark:border-slate-800">
                                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Support Technical</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium italic">Helpdesk Support</p>
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                        <button
                                            onClick={setActiveTab.bind(null, 'report')}
                                            aria-pressed={activeTab === 'report'}
                                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'report' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            Report
                                        </button>
                                        <button
                                            onClick={setActiveTab.bind(null, 'check')}
                                            aria-pressed={activeTab === 'check'}
                                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'check' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            Track
                                        </button>
                                    </div>
                                </div>

                                {activeTab === 'report' ? (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="requester-name" className={labelClass}>Requester Identity</label>
                                                <input id="requester-name" className={inputClass} required placeholder="Full Name"
                                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="dept-select" className={labelClass}>Department Cluster</label>
                                                <select id="dept-select" className={inputClass} required
                                                    value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                >
                                                    <option value="" disabled>Select Unit</option>
                                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="incident-summary" className={labelClass}>Incident Summary</label>
                                            <input id="incident-summary" className={inputClass} required placeholder="Subject of issue"
                                                value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="technical-context" className={labelClass}>Technical Context</label>
                                            <textarea id="technical-context" className={`${inputClass} min-h-[120px] resize-none leading-relaxed`} required placeholder="Describe the error or request..."
                                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" disabled={isSubmitting}
                                            className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 active:scale-[0.98]"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <>Commence Request <ChevronRight size={16} /></>}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <form onSubmit={handleCheckStatus} className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    className={`${inputClass} pl-12 font-mono uppercase tracking-widest`}
                                                    placeholder="TKT-XXXX"
                                                    value={searchId}
                                                    onChange={e => setSearchId(e.target.value)}
                                                    required
                                                />
                                                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold transition-all shadow-md active:scale-95">
                                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                            </button>
                                        </form>

                                        {error && (
                                            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase tracking-tight">
                                                <AlertCircle size={18} /> {error}
                                            </div>
                                        )}

                                        {searchResult && (
                                            <div className="space-y-6 animate-in fade-in duration-500">
                                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800">{searchResult.ticket_id}</span>
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${searchResult.status === 'Resolved' || searchResult.status === 'Closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                            }`}>
                                                            {searchResult.status === 'Resolved' ? 'Solved' : searchResult.status}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{searchResult.subject}</h4>
                                                    <p className="text-[11px] text-slate-500 font-medium font-mono">{searchResult.requester_name} • {searchResult.department}</p>
                                                </div>

                                                {(searchResult.status === 'Resolved' || searchResult.status === 'Closed') && (
                                                    <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-[2.5rem] flex flex-col items-center gap-5 text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm ring-1 ring-emerald-500/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center">
                                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">Incident Resolved</span>
                                                        </div>

                                                        {searchResult.resolution && (
                                                            <div className="w-full text-center px-4 space-y-4">
                                                                <div className="h-px w-10 bg-emerald-200 dark:bg-emerald-800/50 mx-auto"></div>
                                                                <p className="text-[14px] font-semibold leading-relaxed italic text-emerald-800/90 dark:text-emerald-300/90 max-w-[320px] mx-auto">
                                                                    "{searchResult.resolution.split('\n\n[Resolved on:')[0]}"
                                                                </p>
                                                                {searchResult.resolution.includes('[Resolved on:') && (
                                                                    <div className="flex items-center justify-center gap-2 text-[9px] font-bold font-mono opacity-50 bg-emerald-100 dark:bg-emerald-800/30 px-3 py-1.5 rounded-full w-fit mx-auto border border-emerald-200/50 dark:border-emerald-700/50">
                                                                        <Clock size={10} />
                                                                        COMPLETED {searchResult.resolution.split('[Resolved on: ')[1]?.replace(']', '')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col gap-4 shadow-inner">
                                                    <div className="flex flex-col gap-1 max-w-[90%]">
                                                        <div className="bg-white dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-600 text-[13px] text-slate-600 dark:text-slate-300 shadow-sm leading-relaxed">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Initial Report</p>
                                                            {searchResult.description}
                                                        </div>
                                                    </div>

                                                    {messages.map((msg, idx) => (
                                                        <div key={idx} className={`flex flex-col gap-1 max-w-[90%] ${msg.sender_role === 'User' ? 'ml-auto items-end' : 'items-start'}`}>
                                                            <div className={`${msg.sender_role === 'User' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-600'} p-4 rounded-2xl text-[13px] shadow-sm leading-relaxed`}>
                                                                <div className={`text-[8px] font-bold uppercase mb-1 opacity-60 ${msg.sender_role === 'User' ? 'text-right' : ''}`}>
                                                                    {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                {msg.message}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div ref={messagesEndRef} />
                                                </div>

                                                {searchResult.status !== 'Resolved' && searchResult.status !== 'Closed' && (
                                                    <div className="space-y-3">
                                                        <label className={labelClass}>Send Message</label>
                                                        <div className="relative">
                                                            <textarea
                                                                className={`${inputClass} min-h-[100px] pr-14 resize-none text-[13px]`}
                                                                placeholder="Send a message to IT support..."
                                                                value={feedbackText}
                                                                onChange={e => setFeedbackText(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendFeedback(); } }}
                                                            />
                                                            <button
                                                                onClick={handleSendFeedback}
                                                                disabled={isSendingFeedback || !feedbackText.trim()}
                                                                className="absolute bottom-3 right-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg"
                                                            >
                                                                {isSendingFeedback ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em]">The Gesit Companies • v4.1.2</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};