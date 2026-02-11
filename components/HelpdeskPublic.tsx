'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Send, CheckCircle2, Search, Clock, Loader2,
    Phone, AlertCircle, Hash, ArrowLeft, ArrowRight, PhoneCall, ShieldCheck, Headphones, MessageSquare, User, Globe, Sun, Moon, ChevronRight, MessageCircle, Zap, Building2, ChevronLeft, Image as ImageIcon, Smile, Paperclip, PlusCircle, X
} from 'lucide-react';
import { useLanguage } from '../translations';
import { FluentEmoji } from '@lobehub/fluent-emoji';
import { motion, AnimatePresence } from 'framer-motion';

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
            <main className="flex-1 flex items-stretch overflow-hidden">
                <div className={`hidden lg:flex relative overflow-hidden flex-col justify-between p-16 xl:p-24 transition-all duration-1000 ease-in-out ${searchResult ? 'w-[32%]' : 'w-[45%]'}`}>
                    {/* Background Layer */}
                    <div className="absolute inset-0" style={{ backgroundColor: appSettings.primaryColor }}>
                        <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.6 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            src="/image/bg.jpeg"
                            alt="Background"
                            className="w-full h-full object-cover mix-blend-multiply"
                        />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, ${appSettings.primaryColor}66, ${appSettings.primaryColor}E6)` }}></div>

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
                            className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] transform-gpu"
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
                                <div className="w-24 h-24 flex items-center justify-center hover:scale-110 transition-transform duration-500 group relative cursor-pointer" onClick={() => window.location.href = '/'}>
                                    <div className="absolute inset-0 bg-white/5 rounded-3xl blur-2xl group-hover:bg-white/10 transition-colors"></div>
                                    <img src={appSettings.logo} alt="Logo" className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:brightness-110 transition-all z-10" />
                                </div>
                            </motion.div>

                            <div className="space-y-12 max-w-xl">
                                <div>
                                    <motion.h2
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                        className="text-5xl lg:text-6xl font-black text-white leading-[0.9] tracking-tighter mb-8 uppercase"
                                    >
                                        <span className="block opacity-60 text-xl tracking-[0.3em] font-light mb-2">SERVICE</span>
                                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 drop-shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
                                            Intelligence
                                        </span>
                                    </motion.h2>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.5 }}
                                        className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10"
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.8)]"></div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] font-display">
                                            Integrated Technical Support Node
                                        </span>
                                    </motion.div>
                                </div>

                                <div className="pt-4 max-w-md">
                                    <motion.form
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                        onSubmit={handleCheckStatus}
                                        className="flex gap-2"
                                    >
                                        <div className="relative flex-1 group">
                                            <input
                                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-14 text-[13px] font-black text-white placeholder:text-white/20 focus:ring-4 focus:ring-primary/20 focus:border-white/30 transition-all font-mono uppercase tracking-[0.4em] backdrop-blur-md"
                                                placeholder="TKT-XXXX"
                                                value={searchId}
                                                onChange={e => setSearchId(e.target.value)}
                                                required
                                            />
                                            <Hash size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" />
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-8 bg-white text-slate-900 hover:bg-white/90 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 font-display flex items-center gap-3 whitespace-nowrap"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Search size={20} /> Lookup</>}
                                        </motion.button>
                                    </motion.form>
                                    <AnimatePresence>
                                        {error && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4 text-rose-300 text-[10px] font-black uppercase tracking-widest px-2 flex items-center gap-2"
                                            >
                                                <AlertCircle size={14} /> {error}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="pt-6 space-y-8">
                                    {[
                                        { icon: <PhoneCall size={20} />, label: 'Emergency Line', value: 'Internal Ext: 196' },
                                        { icon: <Clock size={20} />, label: 'Active Response', value: '08:00 - 17:00 (Mon-Fri)' }
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: 0.8 + (i * 0.1) }}
                                            className="flex items-center gap-6 group cursor-default"
                                        >
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/20 group-hover:shadow-[0_10px_30px_rgba(255,255,255,0.05)] transition-all duration-500">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1.5 font-display">{item.label}</p>
                                                <p className="text-white font-black text-sm tracking-widest uppercase">{item.value}</p>
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
                                    SYSTEM {appSettings.name} v3.0.1 — PUBLIC PORTAL
                                </p>
                            </div>
                        </motion.div>
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

                    <div className={`w-full ${searchResult ? 'max-w-[1400px]' : 'max-w-[560px]'} py-12 relative z-10 mx-auto transition-all duration-700`}>
                        <AnimatePresence mode="wait">
                            {mode === 'success' ? (
                                <motion.div
                                    key="success-screen"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="text-center space-y-12 bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl p-16 rounded-[4rem] border border-white/20 dark:border-white/10 shadow-2xl glass-card"
                                >
                                    <div className="w-28 h-28 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-emerald-500/5">
                                        <CheckCircle2 size={56} className="animate-in zoom-in duration-700 delay-300" />
                                    </div>
                                    <div className="space-y-4">
                                        <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter font-display leading-none">Request Commenced</h1>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-lg max-w-sm mx-auto">
                                            The deployment node has been engaged. Your requisition is now being processed.
                                        </p>
                                    </div>
                                    <div className="bg-slate-900/5 dark:bg-white/5 p-12 rounded-[3rem] border border-black/5 dark:border-white/5 shadow-inner group">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-4 font-display">Voucher Identity</p>
                                        <p className="text-6xl font-black text-primary dark:text-white font-mono tracking-tighter group-hover:scale-105 transition-transform duration-500">{ticketId}</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setMode('form');
                                                setActiveTab('check');
                                                setSearchId(ticketId);
                                                setTimeout(() => handleCheckStatus(), 100);
                                            }}
                                            className="h-16 px-8 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-3"
                                        >
                                            Monitor Activity
                                            <ArrowRight size={18} />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => { setMode('form'); setActiveTab('report'); }}
                                            className="h-16 px-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl text-slate-600 dark:text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all border border-slate-200/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 shadow-xl flex items-center justify-center"
                                        >
                                            New Requisition
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={searchResult ? "chat-view" : "portal-view"}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                >
                                    {!searchResult && (
                                        <div className="mb-14 text-center space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-display">
                                                {activeTab === 'report' ? 'New Manifest Requisition' : 'Track Existing Requisition'}
                                            </h4>
                                            <div className="w-16 h-[1.5px] bg-primary/20 mx-auto rounded-full"></div>
                                        </div>
                                    )}

                                    {/* Mobile Tab Switcher */}
                                    {!searchResult && (
                                        <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl mb-12 lg:hidden">
                                            <button
                                                onClick={() => { setActiveTab('report'); setSearchId(''); setError(null); }}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${activeTab === 'report' ? 'bg-white dark:bg-white/10 text-primary dark:text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            >
                                                New Request
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('check'); setSearchId(''); setError(null); }}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${activeTab === 'check' ? 'bg-white dark:bg-white/10 text-primary dark:text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                            >
                                                Track Ticket
                                            </button>
                                        </div>
                                    )}

                                    {activeTab === 'check' && !searchResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="lg:hidden"
                                        >
                                            <form onSubmit={handleCheckStatus} className="space-y-6">
                                                <div className="space-y-3">
                                                    <label htmlFor="mobile-ticket-id" className={labelClass}>Ticket Reference ID</label>
                                                    <div className="relative group">
                                                        <input id="mobile-ticket-id" className={inputClass} placeholder="TKT-XXXX" value={searchId} onChange={e => setSearchId(e.target.value)} required />
                                                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                </div>
                                                <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]">
                                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Search size={20} /> Lookup Record</>}
                                                </button>
                                            </form>
                                        </motion.div>
                                    )}

                                    {activeTab === 'report' && !searchResult ? (
                                        <form onSubmit={handleSubmit} className="space-y-8 bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] border border-white/20 dark:border-white/5 shadow-2xl">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label htmlFor="requester-name" className={labelClass}>Requester Identity</label>
                                                    <div className="relative group">
                                                        <input id="requester-name" className={inputClass} required placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                                        <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label htmlFor="dept-select" className={labelClass}>Department Cluster</label>
                                                    <div className="relative group">
                                                        <select id="dept-select" className={`${inputClass} appearance-none`} required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                                            <option value="" disabled>Select Unit</option>
                                                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>
                                                        <Building2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label htmlFor="incident-summary" className={labelClass}>Incident Summary</label>
                                                <div className="relative group">
                                                    <input id="incident-summary" className={inputClass} required placeholder="Subject of issue" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                                    <Zap size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label htmlFor="technical-context" className={labelClass}>Technical Context</label>
                                                <div className="relative group">
                                                    <textarea id="technical-context" className={`${inputClass} min-h-[160px] py-5 px-14 resize-none leading-relaxed`} required placeholder="Describe the error or request in detail..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                                    <MessageSquare size={18} className="absolute left-5 top-6 text-slate-400 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
                                                </div>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="group relative w-full h-16 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 overflow-hidden"
                                                style={{
                                                    backgroundColor: appSettings.primaryColor,
                                                    boxShadow: `0 20px 40px -10px ${appSettings.primaryColor}66`
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                                <span className="relative z-10 flex items-center gap-3">
                                                    {isSubmitting ? (
                                                        <Loader2 className="animate-spin" size={20} />
                                                    ) : (
                                                        <>INITIATE SERVICE REQUEST <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                                                    )}
                                                </span>
                                            </motion.button>
                                        </form>
                                    ) : (
                                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            {searchResult && (
                                                <div className="flex flex-col lg:flex-row gap-10 items-start">
                                                    {/* Central Chat Node */}
                                                    {/* Chat Interface */}
                                                    <div className="flex-1 w-full flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-[600px] lg:h-[800px] sticky top-8">
                                                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm p-0.5 bg-white dark:bg-slate-800">
                                                                    <div className="w-full h-full rounded-lg overflow-hidden">
                                                                        <img src="/image/avatar-it.png" alt="IT" className="w-full h-full object-cover" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Support Agent</h5>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Online</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${searchResult.status === 'Resolved' || searchResult.status === 'Closed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                {searchResult.status}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                                            <div className="flex justify-center mb-12">
                                                                <div className="px-8 py-3 bg-white/10 dark:bg-white/[0.02] backdrop-blur-xl rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border border-white/10 shadow-sm">
                                                                    Session Synced • {new Date(searchResult.created_at).toLocaleDateString()}
                                                                </div>
                                                            </div>

                                                            {messages.map((msg, idx) => {
                                                                const isUser = msg.sender_role === 'User';
                                                                const initials = msg.sender_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                                                                return (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                                                                        key={idx}
                                                                        className={`flex gap-4 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'flex-row'}`}
                                                                    >
                                                                        <div className="flex-shrink-0 mt-1">
                                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border overflow-hidden ${isUser
                                                                                ? 'bg-white dark:bg-slate-800 text-blue-600 border-slate-200 dark:border-slate-700 shadow-sm'
                                                                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                                                }`}>
                                                                                {isUser ? initials : <img src="/image/avatar-it.png" alt="IT" className="w-full h-full object-cover" />}
                                                                            </div>
                                                                        </div>

                                                                        <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                                                                            <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                                    {msg.sender_name}
                                                                                </span>
                                                                                <span className="text-[9px] font-medium text-slate-300 tabular-nums">
                                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                            </div>
                                                                            <div className={`${isUser
                                                                                ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                                                                } px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed break-words`}>
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
                                                                                                    className="max-w-full rounded-2xl hover:scale-[1.02] transition-transform duration-500 shadow-2xl"
                                                                                                    loading="lazy"
                                                                                                />
                                                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all rounded-2xl flex items-center justify-center">
                                                                                                    <div className="opacity-0 group-hover/img:opacity-100 transition-all bg-white/20 backdrop-blur-xl p-3 rounded-full text-white border border-white/30">
                                                                                                        <Search size={22} strokeWidth={3} />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return <EmojiRenderer text={msg.message} />;
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                            <div ref={messagesEndRef} />
                                                        </div>

                                                        {(searchResult.status === 'Resolved' || searchResult.status === 'Closed') && (
                                                            <div className="px-10 py-6 bg-emerald-500/10 border-t border-emerald-500/20 text-center backdrop-blur-md">
                                                                <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em]">Encrypted Channel Closed</p>
                                                            </div>
                                                        )}

                                                        {searchResult.status !== 'Resolved' && searchResult.status !== 'Closed' && (
                                                            <div className="p-10 bg-white/40 dark:bg-black/20 backdrop-blur-md border-t border-white/10">
                                                                <div className="flex items-end gap-4 bg-white/60 dark:bg-white/[0.02] border border-white/20 dark:border-white/10 rounded-[3rem] p-3 px-4 shadow-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all max-w-5xl mx-auto ring-1 ring-white/10">
                                                                    <button
                                                                        onClick={() => fileInputRef.current?.click()}
                                                                        className="w-14 h-14 flex items-center justify-center bg-slate-100/50 dark:bg-white/5 text-slate-400 hover:text-primary dark:hover:text-white transition-all shrink-0 rounded-2xl hover:scale-105 active:scale-95 border border-white/10"
                                                                        disabled={isUploading}
                                                                        title="Attach Document"
                                                                    >
                                                                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} strokeWidth={2.5} />}
                                                                    </button>
                                                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                                                                    <div className="flex-1 min-h-[56px] flex items-center pt-1">
                                                                        <textarea
                                                                            rows={1}
                                                                            className="w-full bg-transparent border-none text-[15px] font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white resize-none max-h-40 custom-scrollbar py-3"
                                                                            placeholder={`Message to Support Node...`}
                                                                            value={feedbackText}
                                                                            onChange={e => {
                                                                                setFeedbackText(e.target.value);
                                                                                e.target.style.height = 'auto';
                                                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                                                            }}
                                                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendFeedback(); } }}
                                                                        />
                                                                    </div>

                                                                    <div className="relative shrink-0 flex items-center pb-1">
                                                                        <button
                                                                            ref={emojiTriggerRef}
                                                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                            className={`w-12 h-12 flex items-center justify-center transition-all rounded-xl ${showEmojiPicker ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-primary'}`}
                                                                            title="Add Expression"
                                                                        >
                                                                            <Smile size={24} strokeWidth={2.5} />
                                                                        </button>
                                                                        {showEmojiPicker && (
                                                                            <div className="absolute bottom-full right-0 mb-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.4)] z-[100] w-[340px] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                                                                                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/40 dark:bg-white/5">
                                                                                    <div className="flex gap-1">
                                                                                        {EMOJI_CATEGORIES.map((cat, idx) => (
                                                                                            <button
                                                                                                key={cat.name}
                                                                                                onClick={() => setActiveEmojiCategory(idx)}
                                                                                                className={`p-2.5 rounded-xl transition-all ${activeEmojiCategory === idx ? 'bg-primary text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/10'}`}
                                                                                                title={cat.name}
                                                                                            >
                                                                                                {cat.icon}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="p-5 grid grid-cols-6 gap-2 h-[280px] overflow-y-auto custom-scrollbar">
                                                                                    {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map(emoji => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            onClick={() => addEmoji(emoji)}
                                                                                            className="w-11 h-11 flex items-center justify-center hover:bg-primary/10 rounded-2xl transition-all hover:scale-125 active:scale-90"
                                                                                        >
                                                                                            <FluentEmoji emoji={emoji} size={28} />
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <button
                                                                        onClick={handleSendFeedback}
                                                                        disabled={isSendingFeedback || !feedbackText.trim()}
                                                                        className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale overflow-hidden group/send relative z-10"
                                                                    >
                                                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/send:translate-y-0 transition-transform duration-300"></div>
                                                                        {isSendingFeedback ? <Loader2 size={22} className="animate-spin relative z-10" /> : <Send size={22} strokeWidth={2.5} className="relative z-10" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Management Sidebar */}
                                                    <div className="w-full lg:w-[420px] flex flex-col gap-8 lg:sticky lg:top-8">
                                                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 shadow-sm">
                                                            <div>
                                                                <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    Ticket Details
                                                                </h6>
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {[
                                                                        { icon: <Hash size={16} />, label: 'Reference ID', value: searchResult.ticket_id, color: 'blue' },
                                                                        { icon: <ShieldCheck size={16} />, label: 'Status', value: searchResult.status, color: 'indigo' }
                                                                    ].map((item, i) => (
                                                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                                            <div className={`w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400 shadow-sm border border-slate-100 dark:border-slate-600`}>
                                                                                {item.icon}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{item.label}</p>
                                                                                <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{item.value}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                                                            <div>
                                                                <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                                    Requester
                                                                </h6>
                                                                <div className="space-y-6">
                                                                    <div className="space-y-4">
                                                                        {[
                                                                            { icon: <User size={16} />, label: 'Name', value: searchResult.requester_name, color: 'slate' },
                                                                            { icon: <Building2 size={16} />, label: 'Department', value: searchResult.department, color: 'slate' }
                                                                        ].map((item, i) => (
                                                                            <div key={i} className="flex items-center gap-4">
                                                                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700">
                                                                                    {item.icon}
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{item.label}</p>
                                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">{item.value}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-inner relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                                                                    <MessageCircle size={80} strokeWidth={1} />
                                                                </div>
                                                                <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 relative z-10">Initial Request</h6>
                                                                <div className="relative z-10 pl-6 border-l-2 border-blue-500/30">
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-tight">{searchResult.subject}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                                        "{searchResult.description}"
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {searchResult.status === 'Resolved' && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="bg-emerald-500/10 backdrop-blur-3xl rounded-[3rem] border border-emerald-500/20 p-10 shadow-2xl relative overflow-hidden"
                                                                >
                                                                    <div className="absolute top-0 right-0 p-6 text-emerald-500/20">
                                                                        <CheckCircle2 size={60} strokeWidth={1} />
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                                                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                                                            <CheckCircle2 size={24} strokeWidth={3} />
                                                                        </div>
                                                                        <h6 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] font-display">Resolution Success</h6>
                                                                    </div>
                                                                    <p className="text-[13px] text-emerald-800/70 dark:text-emerald-400/70 font-medium leading-relaxed relative z-10">
                                                                        This requisition has been successfully synchronized and marked as resolved. No further intervention required.
                                                                    </p>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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