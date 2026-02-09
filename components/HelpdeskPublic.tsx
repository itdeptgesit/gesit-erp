'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Send, CheckCircle2, Search, Clock, Loader2,
    Phone, AlertCircle, Hash, ArrowLeft, PhoneCall, ShieldCheck, Headphones, MessageSquare, User, Globe, Sun, Moon, ChevronRight, MessageCircle, Zap, Building2, ChevronLeft, Image as ImageIcon, Smile, Paperclip, PlusCircle, X
} from 'lucide-react';
import { useLanguage } from '../translations';
import { FluentEmoji } from '@lobehub/fluent-emoji';

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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [appSettings, setAppSettings] = useState({
        name: 'GESIT WORK',
        logo: '/image/logo.png',
        primaryColor: '#0a2558'
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiTriggerRef = useRef<HTMLButtonElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const EMOJI_CATEGORIES = [
        {
            name: 'Smileys',
            icon: <Smile size={16} />,
            emojis: [
                '😊', '😂', '🤣', '❤️', '😍', '😒', '😭', '😘', '😔', '😩',
                '😁', '😉', '😌', '😎', '😅', '😋', '😶', '😏', '😑', '😐',
                '😯', '😮', '😲', '😴', '😫', '😪', '🙌', '👏', '👋', '👍',
                '👊', '✊', '✌️', '👌', '✋', '👐', '💪', '🙏', '🤝', '💅'
            ]
        },
        {
            name: 'Nature',
            icon: <Globe size={16} />,
            emojis: [
                '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
                '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
                '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
                '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙'
            ]
        },
        {
            name: 'Tech',
            icon: <Zap size={16} />,
            emojis: [
                '💻', '📱', '📧', '💡', '📌', '📎', '📅', '⏰', '🛠️', '🔧',
                '🔒', '🔑', '💎', '📦', '🎁', '📁', '📂', '📜', '📄', '📒',
                '📊', '📈', '📉', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '📼',
                '🔋', '🔌', '📡', '🛰️', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️'
            ]
        },
        {
            name: 'Symbols',
            icon: <Hash size={16} />,
            emojis: [
                '✅', '❌', '⚠️', '⭐', '🔥', '✨', '⚡', '💯', '🎉', '🆘',
                '🚫', '⚠️', '💎', '💠', '🌀', '💤', '💥', '💢', '💦', '💨',
                '💫', '💬', '🗯️', '💭', '🕳️', '💣', '🔇', '🔈', '🔉', '🔊',
                '🎵', '🎶', '➕', '➖', '✖️', '➗', '❓', '❔', '❕', '❗'
            ]
        }
    ];

    const EmojiRenderer = ({ text }: { text: string }) => {
        // Regex to match emojis
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;

        const emojiMatches = text.match(emojiRegex);
        if (!emojiMatches) return <span>{text}</span>;

        const parts = text.split(emojiRegex);

        return (
            <span className="flex flex-wrap items-center gap-x-0.5 whitespace-pre-wrap">
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        {part}
                        {emojiMatches[i] && (
                            <FluentEmoji
                                emoji={emojiMatches[i]}
                                size={20}
                                className="inline-block align-middle transform translate-y-[-1px] mx-0.5"
                            />
                        )}
                    </React.Fragment>
                ))}
            </span>
        );
    };

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


    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('system_settings').select('*').single();
            if (data) {
                setAppSettings({
                    name: data.app_name || 'GESIT WORK',
                    logo: data.logo_url || '/image/logo.png',
                    primaryColor: data.primary_color || '#0a2558'
                });
            }
        };
        fetchSettings();

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
            new Notification('GESIT WORK - Update on your Ticket', {
                body: `New message: ${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}`,
                icon: appSettings.logo
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !searchResult) return;

        if (!file.type.startsWith('image/')) {
            showToast("Please upload an image file.", 'error');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${searchResult.ticket_id}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `chat_attachments/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('helpdesk-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('helpdesk-attachments')
                .getPublicUrl(filePath);

            const { error: msgError } = await supabase.from('helpdesk_ticket_messages').insert([{
                ticket_id: searchResult.id,
                sender_name: searchResult.requester_name,
                sender_role: 'User',
                message: `![image](${publicUrl})`
            }]);

            if (msgError) throw msgError;
            console.log("Image message inserted successfully with URL:", publicUrl);
            showToast("Image uploaded successfully.");
        } catch (err: any) {
            console.error('Upload Error Details:', err);
            let userMsg = "Upload failed.";
            if (err.message?.includes('bucket')) userMsg = "Storage bucket 'helpdesk-attachments' not found.";
            else if (err.status === 403) userMsg = "Permission denied. Check RLS policies.";

            showToast(userMsg, 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addEmoji = (emoji: string) => {
        setFeedbackText(prev => prev + emoji);
        setShowEmojiPicker(false);
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

        // Detect Ticket ID in URL (e.g., ?TKT-7348)
        const searchParams = window.location.search;
        if (searchParams && searchParams.startsWith('?TKT-')) {
            const tktId = searchParams.substring(1).toUpperCase();
            console.log("[HelpdeskURL] Detected Ticket ID in URL:", tktId);
            setSearchId(tktId);
            setActiveTab('check');

            // We need to trigger the search. Since we can't call handleCheckStatus directly 
            // due to state update cycles, we utilize a separate effect or a slight delay.
            setTimeout(() => {
                const triggerSearch = document.getElementById('search-trigger-btn');
                if (triggerSearch) triggerSearch.click();
                else {
                    // Fallback to manual call if button not found
                    performSearch(tktId);
                }
            }, 500);
        }
    }, []);

    const performSearch = async (id: string) => {
        if (!id) return;
        setIsSubmitting(true);
        setError(null);
        setSearchResult(null);
        try {
            const { data, error: dbError } = await supabase
                .from('helpdesk_tickets')
                .select('*')
                .eq('ticket_id', id.toUpperCase().trim())
                .maybeSingle();

            if (dbError) throw dbError;
            if (!data) throw new Error('Ticket ID not found.');
            setSearchResult(data);
            fetchMessages(data.id);

            // Sync URL
            const url = new URL(window.location.href);
            url.search = id.toUpperCase();
            window.history.pushState({}, '', url);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

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
        await performSearch(searchId);
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
        if ((!feedbackText.trim() && !isUploading) || !searchResult) return;
        setIsSendingFeedback(true);
        setShowEmojiPicker(false);
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

    const inputClass = "w-full h-11 pl-12 pr-5 rounded-xl border-2 border-transparent bg-white/60 dark:bg-white/5 backdrop-blur-xl focus:bg-white/80 dark:focus:bg-white/10 focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all duration-300 outline-none text-[13px] dark:text-slate-100 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus:shadow-lg focus:shadow-primary/5 focus:scale-[1.01]";
    const labelClass = "text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-display ml-1";

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
            {toast && (
                <div className={`fixed top-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold tracking-tight">{toast.text}</span>
                </div>
            )}
            <main className="flex-1 flex items-stretch">
                <div className={`hidden lg:flex relative overflow-hidden flex-col justify-between p-24 transition-all duration-700 ease-in-out ${searchResult ? 'w-[35%]' : 'w-[45%]'}`}>
                    <div className="absolute inset-0" style={{ backgroundColor: 'var(--primary)' }}>
                        <img
                            src="/image/bg.jpeg"
                            alt="Background"
                            fetchPriority="high"
                            loading="eager"
                            className="w-full h-full object-cover opacity-60 mix-blend-multiply scale-105 animate-pulse-slow transform-gpu"
                        />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, var(--primary)4D, var(--primary)B3)` }}></div>

                        {/* Dynamic Light Orbs */}
                        <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse transform-gpu"></div>
                        <div className="absolute bottom-[5%] left-[-5%] w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] animate-pulse transform-gpu" style={{ animationDelay: '3s' }}></div>
                    </div>

                    <div className="relative z-10">
                        {/* Logo Section */}
                        <div className="mb-20 animate-in fade-in slide-in-from-left duration-1000">
                            <div className="w-20 h-20 flex items-center justify-center hover:scale-110 transition-transform duration-500 group relative">
                                <img src={appSettings.logo} alt="Logo" className="w-full h-full object-contain filter drop-shadow-2xl group-hover:brightness-110 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-12 max-w-xl">
                            <div className="animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                                <h2 className="text-4xl lg:text-5xl font-black text-white leading-none tracking-tighter font-display mb-6 uppercase whitespace-nowrap">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white/100 to-white/60 drop-shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                                        Helpdesk Engine
                                    </span>
                                </h2>
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl ring-1 ring-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.6)]"></div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] font-display">
                                        Integrated Technical Support Node
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 max-w-md animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                                <form onSubmit={handleCheckStatus} className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <input
                                            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-12 text-[13px] font-black text-white placeholder:text-white/30 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono uppercase tracking-widest backdrop-blur-md"
                                            placeholder="TKT-XXXX"
                                            value={searchId}
                                            onChange={e => setSearchId(e.target.value)}
                                            required
                                            aria-label="Ticket Reference ID"
                                        />
                                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <button
                                        type="submit"
                                        id="search-trigger-btn"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-white hover:bg-white/90 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/20 active:scale-95 font-display flex items-center gap-2 whitespace-nowrap text-primary"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Search size={18} /> Lookup</>}
                                    </button>
                                </form>
                                {error && (
                                    <p className="mt-3 text-rose-300 text-[10px] font-black uppercase tracking-widest animate-pulse px-2 flex items-center gap-2">
                                        <AlertCircle size={12} /> {error}
                                    </p>
                                )}
                            </div>

                            <div className="pt-8 space-y-6">
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                                        <PhoneCall size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] mb-1 font-display drop-shadow-md">Emergency Line</p>
                                        <p className="text-white font-bold text-sm tracking-tight drop-shadow-md">Internal Ext: 196</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] mb-1 font-display drop-shadow-md">Active Response</p>
                                        <p className="text-white font-bold text-sm tracking-tight drop-shadow-md">08:00 - 17:00 (Mon-Fri)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 animate-in fade-in duration-1000 delay-500">
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
                                    Gesit WORK v2.5.0 — Proprietary Node
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 relative overflow-y-auto custom-scrollbar transition-all duration-500 ${searchResult ? 'p-4 md:p-8' : 'p-6'}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)]"></div>

                    <div className="absolute top-8 left-8 z-50">
                        <button
                            onClick={() => {
                                if (searchResult || mode === 'success') {
                                    setSearchResult(null);
                                    setMode('form');
                                    setActiveTab('report');
                                    setSearchId('');
                                    window.history.pushState({}, '', window.location.pathname);
                                } else {
                                    window.location.href = '/';
                                }
                            }}
                            className="flex items-center gap-3 text-slate-400 hover:text-primary dark:hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] group font-display w-fit"
                        >
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            </div>
                            {searchResult || mode === 'success' ? 'Back to Portal' : 'Return to Login'}
                        </button>
                    </div>

                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle Theme"
                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-primary transition-all shadow-sm z-50 backdrop-blur-md"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className={`w-full ${searchResult ? 'max-w-[1400px]' : 'max-w-[560px]'} py-12 relative z-10 transition-all duration-700 mx-auto`}>
                        {mode === 'success' ? (
                            <div className="text-center animate-in fade-in zoom-in duration-500 space-y-12">
                                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <CheckCircle2 size={48} className="animate-in zoom-in duration-700 delay-300" />
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter font-display">Request Commenced</h1>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 leading-relaxed text-lg">
                                    Our deployment team has been engaged. <br className="hidden sm:block" />
                                    Your requisition is being processed.
                                </p>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-10 rounded-[2rem] mb-12 border border-slate-100 dark:border-white/5 shadow-inner">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 font-display">Voucher Identity</p>
                                    <p className="text-5xl font-black text-primary font-mono tracking-tighter">{ticketId}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setMode('form');
                                            setActiveTab('check');
                                            setSearchId(ticketId);
                                            setTimeout(() => handleCheckStatus(), 100);
                                        }}
                                        className="h-14 px-6 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/10 active:scale-95 scroll-smooth flex items-center justify-center"
                                    >
                                        Monitor Activity
                                    </button>
                                    <button
                                        onClick={() => { setMode('form'); setActiveTab('report'); }}
                                        className="h-14 px-6 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 flex items-center justify-center"
                                    >
                                        New Requisition
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-500">
                                {searchResult && <div className="mb-4" />}
                                {searchResult && <div className="mb-4" />}
                                {!searchResult && (
                                    <div className="mb-8">
                                        <div className="mb-8 text-center space-y-2">
                                            <div className="w-12 h-1 bg-primary/20 mx-auto rounded-full mb-6"></div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-display">
                                                {activeTab === 'report' ? 'New Manifest Requisition' : 'Track Existing Requisition'}
                                            </h4>
                                        </div>

                                        {/* Mobile Tab Switcher */}
                                        <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl mb-8 lg:hidden">
                                            <button
                                                onClick={() => { setActiveTab('report'); setSearchId(''); setError(null); }}
                                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'report' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            >
                                                New Request
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('check'); setSearchId(''); setError(null); }}
                                                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'check' ? 'bg-white dark:bg-white/10 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            >
                                                Track Ticket
                                            </button>
                                        </div>

                                        {/* Mobile Lookup Form */}
                                        {activeTab === 'check' && (
                                            <div className="lg:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <form onSubmit={handleCheckStatus} className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label htmlFor="mobile-ticket-id" className={labelClass}>Ticket Reference ID</label>
                                                        <div className="relative group">
                                                            <input
                                                                id="mobile-ticket-id"
                                                                className={inputClass}
                                                                placeholder="TKT-XXXX"
                                                                value={searchId}
                                                                onChange={e => setSearchId(e.target.value)}
                                                                required
                                                            />
                                                            <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.98] font-display"
                                                    >
                                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Search size={18} /> Lookup Record</>}
                                                    </button>
                                                    {error && (
                                                        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                                            <AlertCircle size={16} />
                                                            <span className="text-xs font-bold">{error}</span>
                                                        </div>
                                                    )}
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'report' && !searchResult ? (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label htmlFor="requester-name" className={labelClass}>Requester Identity</label>
                                                <div className="relative group">
                                                    <input id="requester-name" className={inputClass} required placeholder="Full Name"
                                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label htmlFor="dept-select" className={labelClass}>Department Cluster</label>
                                                <div className="relative group">
                                                    <select id="dept-select" className={`${inputClass} appearance-none`} required
                                                        value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                    >
                                                        <option value="" disabled>Select Unit</option>
                                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label htmlFor="incident-summary" className={labelClass}>Incident Summary</label>
                                            <div className="relative group">
                                                <input id="incident-summary" className={inputClass} required placeholder="Subject of issue"
                                                    value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                                />
                                                <Zap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label htmlFor="technical-context" className={labelClass}>Technical Context</label>
                                            <div className="relative group">
                                                <textarea id="technical-context" className={`${inputClass} min-h-[140px] py-4 resize-none leading-relaxed`} required placeholder="Describe the error or request..."
                                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                />
                                                <MessageSquare size={18} className="absolute left-4 top-5 text-slate-400 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={isSubmitting}
                                            className="group relative w-full h-11 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl active:scale-[0.97] disabled:opacity-50 font-display overflow-hidden bg-primary"
                                            style={{
                                                boxShadow: `0 10px 40px -10px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                            <span className="relative z-10 flex items-center gap-2">
                                                {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> PROCESSING...</> : <>Initiate Service Request <ChevronRight size={16} /></>}
                                            </span>
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        {searchResult && (
                                            <div className="flex flex-col-reverse lg:flex-row gap-8 animate-in fade-in duration-700 items-start">
                                                <div className="flex-1 w-full flex flex-col min-w-0 bg-slate-50/30 dark:bg-white/[0.02] rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm h-[500px] lg:h-[750px] sticky top-8">
                                                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900/50">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 shadow-sm bg-white">
                                                                <img src="/image/avatar-it.png" alt="IT" className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-[13px] font-black text-slate-900 dark:text-white leading-none mb-1">Support Engineer</h5>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Online</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${searchResult.status === 'Resolved' || searchResult.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                                            {searchResult.status}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                                        <div className="flex justify-center mb-8">
                                                            <div className="px-5 py-2 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] border border-slate-200/50 dark:border-white/5">
                                                                Portal Activity Commenced • {new Date(searchResult.created_at).toLocaleDateString()}
                                                            </div>
                                                        </div>

                                                        {messages.map((msg, idx) => {
                                                            const isUser = msg.sender_role === 'User';
                                                            const initials = msg.sender_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                                                            return (
                                                                <div key={idx} className={`flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-500 ${isUser ? 'ml-auto flex-row-reverse' : 'flex-row'}`}>
                                                                    <div className="flex-shrink-0 mt-1">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border shadow-sm overflow-hidden ${isUser
                                                                            ? 'bg-primary/10 text-primary border-primary/10'
                                                                            : 'bg-white border-slate-100 dark:bg-white/10 dark:border-white/10'
                                                                            }`}>
                                                                            {isUser ? initials : <img src="/image/avatar-it.png" alt="IT" className="w-full h-full object-cover" />}
                                                                        </div>
                                                                    </div>

                                                                    <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                                                                        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 font-display">
                                                                                {msg.sender_name}
                                                                            </span>
                                                                            <span className="text-[8px] font-bold opacity-20 tabular-nums">
                                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                        <div className={`${isUser
                                                                            ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
                                                                            : 'bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/10 shadow-sm'
                                                                            } px-4 py-3 rounded-[1.4rem] text-[13px] font-medium leading-relaxed transition-all tracking-tight overflow-hidden`}>
                                                                            {(() => {
                                                                                const imageMatch = msg.message.match(/!\[image\]\((.*?)\)/);
                                                                                if (imageMatch) {
                                                                                    const imageUrl = imageMatch[1];
                                                                                    return (
                                                                                        <div
                                                                                            onClick={() => setPreviewImage(imageUrl)}
                                                                                            className="block cursor-zoom-in group/img relative"
                                                                                        >
                                                                                            <img
                                                                                                src={imageUrl}
                                                                                                alt="Attachment"
                                                                                                className="max-w-full rounded-xl hover:scale-[1.02] transition-transform duration-300 shadow-sm"
                                                                                                loading="lazy"
                                                                                            />
                                                                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-all rounded-xl flex items-center justify-center">
                                                                                                <div className="opacity-0 group-hover/img:opacity-100 transition-all bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                                                                                                    <Search size={16} />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return <EmojiRenderer text={msg.message} />;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <div ref={messagesEndRef} />
                                                    </div>

                                                    {(searchResult.status === 'Resolved' || searchResult.status === 'Closed') && (
                                                        <div className="px-6 py-4 bg-emerald-500/5 border-t border-emerald-500/10 text-center">
                                                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Communication Channel Closed</p>
                                                        </div>
                                                    )}

                                                    {searchResult.status !== 'Resolved' && searchResult.status !== 'Closed' && (
                                                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5">
                                                            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-2 px-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                                                {/* Action Buttons: Upload */}
                                                                <button
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className="p-1.5 text-slate-400 hover:text-primary dark:hover:text-white transition-colors shrink-0 disabled:opacity-50"
                                                                    disabled={isUploading}
                                                                    title="Attach Image"
                                                                >
                                                                    {isUploading ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={22} />}
                                                                </button>
                                                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                                                                {/* Input Area */}
                                                                <textarea
                                                                    rows={1}
                                                                    className="flex-1 p-2 bg-transparent border-none text-[13px] font-medium outline-none placeholder:text-slate-400 dark:text-slate-500 dark:text-white resize-none h-10 flex items-center pt-2.5 custom-scrollbar"
                                                                    placeholder="Type a message..."
                                                                    value={feedbackText}
                                                                    onChange={e => setFeedbackText(e.target.value)}
                                                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendFeedback(); } }}
                                                                />

                                                                {/* Emoji Picker */}
                                                                <div className="relative shrink-0">
                                                                    <button
                                                                        ref={emojiTriggerRef}
                                                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                        className={`p-1.5 transition-all rounded-lg ${showEmojiPicker ? 'text-primary dark:text-white' : 'text-slate-400 hover:text-primary dark:hover:text-white'}`}
                                                                        title="Add Emoji"
                                                                    >
                                                                        <Smile size={22} />
                                                                    </button>
                                                                    {showEmojiPicker && (
                                                                        <div className="absolute bottom-full right-0 mb-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 shadow-2xl z-[100] w-[320px] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                                                                            <div className="flex items-center justify-between p-2 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                                                                                <div className="flex">
                                                                                    {EMOJI_CATEGORIES.map((cat, idx) => (
                                                                                        <button
                                                                                            key={cat.name}
                                                                                            onClick={() => setActiveEmojiCategory(idx)}
                                                                                            className={`p-2 rounded-lg transition-all ${activeEmojiCategory === idx ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                                                                            title={cat.name}
                                                                                        >
                                                                                            {cat.icon}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3">
                                                                                    {EMOJI_CATEGORIES[activeEmojiCategory].name}
                                                                                </span>
                                                                            </div>

                                                                            <div className="p-3 grid grid-cols-7 gap-1 h-[240px] overflow-y-auto custom-scrollbar">
                                                                                {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map(emoji => (
                                                                                    <button
                                                                                        key={emoji}
                                                                                        onClick={() => addEmoji(emoji)}
                                                                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-110 active:scale-90"
                                                                                    >
                                                                                        <FluentEmoji emoji={emoji} size={24} />
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Send Button */}
                                                                <button
                                                                    onClick={handleSendFeedback}
                                                                    disabled={isSendingFeedback || !feedbackText.trim()}
                                                                    className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                                                                >
                                                                    {isSendingFeedback ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="w-full lg:w-[360px] flex flex-col gap-6 lg:sticky lg:top-8">
                                                    <div className="bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 p-6 space-y-6 shadow-sm">
                                                        <div>
                                                            <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 font-display">Ticket Info</h6>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                                                        <Hash size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reference</p>
                                                                        <p className="text-[13px] font-black text-primary tracking-tight font-display">{searchResult.ticket_id}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500 border border-slate-500/10">
                                                                        <ShieldCheck size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                                                        <p className="text-[13px] font-black text-slate-800 dark:text-white tracking-tight font-display">{searchResult.status}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="h-px bg-slate-100 dark:bg-white/5"></div>

                                                        <div>
                                                            <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 font-display">User Data</h6>
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                                                                        <User size={16} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Requester</p>
                                                                        <p className="text-[13px] font-black text-slate-800 dark:text-white tracking-tight truncate">{searchResult.requester_name}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/10">
                                                                        <Building2 size={16} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Department</p>
                                                                        <p className="text-[13px] font-black text-slate-800 dark:text-white tracking-tight truncate">{searchResult.department}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 p-6 shadow-sm">
                                                        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 font-display">Initial Requisition</h6>
                                                        <div className="relative">
                                                            <div className="absolute left-0 top-0 w-1 h-full bg-primary/20 rounded-full"></div>
                                                            <div className="pl-5">
                                                                <p className="text-[13px] font-bold text-slate-900 dark:text-white mb-2 leading-tight">{searchResult.subject}</p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-4">
                                                                    "{searchResult.description}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {searchResult.status === 'Resolved' && (
                                                        <div className="bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 p-6 shadow-sm">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                                                <h6 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-display">Quick Resolution</h6>
                                                            </div>
                                                            <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 leading-relaxed mb-4">
                                                                This manifest has been marked as resolved by the support node. No further action is required.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all hover:scale-110 active:scale-90"
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
                            <a
                                href={previewImage}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2.5 bg-white text-[#0a2558] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95"
                            >
                                Download Manifest Attachment
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};