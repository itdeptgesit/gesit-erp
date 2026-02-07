'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserAccount } from '../types';
import {
    Search, RefreshCcw, CheckCircle2, Clock, AlertCircle,
    MessageSquare, X, Loader2, Send, ClipboardList,
    User, Building2, PauseCircle, Lock, Unlock, MessageCircle, ChevronLeft, ChevronRight, CircleDot, RotateCcw,
    Image as ImageIcon, Smile, Paperclip, Globe, Zap, Hash, PlusCircle
} from 'lucide-react';
import { StatCard } from './MainDashboard';
import { DangerConfirmModal } from './DangerConfirmModal';
import { FluentEmoji } from '@lobehub/fluent-emoji';

interface HelpdeskManagerProps {
    currentUser: UserAccount | null;
}

export const HelpdeskManager: React.FC<HelpdeskManagerProps> = ({ currentUser }) => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');
    const [toast, setToast] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSolveConfirmOpen, setIsSolveConfirmOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiTriggerRef = useRef<HTMLButtonElement>(null);
    const [detailTab, setDetailTab] = useState<'chat' | 'info'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
                '🔋', '🔌', '📡', '🛰️', '传真', '电视', '收音机', '麦克风', '滑块', '旋钮'
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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3000);
    };

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.error("Error playing sound:", e));
    };

    const sendBrowserNotification = (ticket: any) => {
        if (Notification.permission === 'granted') {
            new Notification('Gesit ERP - New Helpdesk Ticket', {
                body: `New request from ${ticket.requesterName}: ${ticket.subject}`,
                icon: '/logo.png'
            });
        }
    };

    const mapTicket = (t: any) => ({
        id: t.id,
        ticketId: t.ticket_id,
        requesterName: t.requester_name,
        department: t.department,
        subject: t.subject,
        description: t.description,
        priority: t.priority,
        status: t.status,
        createdAt: t.created_at,
        assignedTo: t.assigned_to,
        requesterEmail: t.requester_email,
        resolution: t.resolution,
        requesterFeedback: t.requester_feedback
    });

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('helpdesk_tickets').select('*').order('id', { ascending: false });
            if (error) throw error;
            if (data) {
                setTickets(data.map(mapTicket));
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (ticketId: number) => {
        try {
            const { data, error } = await supabase
                .from('helpdesk_ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setMessages(data || []);
        } catch (err: any) {
            console.error('Error fetching messages:', err);
        }
    };

    useEffect(() => {
        fetchTickets();

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const channel = supabase
            .channel('helpdesk_realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'helpdesk_tickets'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newTicket = mapTicket(payload.new);
                    setTickets(prev => [newTicket, ...prev]);
                    showToast(`New Ticket: ${newTicket.subject}`, 'success');
                    playNotificationSound();
                    sendBrowserNotification(newTicket);
                } else if (payload.eventType === 'UPDATE') {
                    const updatedTicket = mapTicket(payload.new);
                    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

                    // Update selected ticket if it's the one being modified
                    setSelectedTicket(prev => {
                        if (prev && prev.id === updatedTicket.id) {
                            return updatedTicket;
                        }
                        return prev;
                    });
                } else if (payload.eventType === 'DELETE') {
                    setTickets(prev => prev.filter(t => t.id === payload.old.id));
                    setSelectedTicket(prev => prev && prev.id === payload.old.id ? null : prev);
                }
            })
            .subscribe();

        const msgChannel = supabase
            .channel('global_messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'helpdesk_ticket_messages'
            }, (payload) => {
                // Only notify if message is from User and not from IT
                if (payload.new.sender_role === 'User') {
                    playNotificationSound();

                    // Fetch ticket subject for better notification
                    supabase.from('helpdesk_tickets')
                        .select('subject, requester_name')
                        .eq('id', payload.new.ticket_id)
                        .single()
                        .then(({ data }) => {
                            const body = data
                                ? `New message on ${data.subject} from ${data.requester_name}`
                                : `New message: ${payload.new.message.substring(0, 50)}...`;

                            if (Notification.permission === 'granted') {
                                new Notification('Gesit ERP - New Message', { body });
                            }
                        });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(msgChannel);
        };
    }, []);

    useEffect(() => {
        if (selectedTicket) {
            setResolutionNote(selectedTicket.resolution || '');
            fetchMessages(selectedTicket.id);

            // Subscribe to new messages for this ticket
            const channel = supabase
                .channel(`ticket_messages_${selectedTicket.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'helpdesk_ticket_messages',
                    filter: `ticket_id=eq.${selectedTicket.id}`
                }, (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setResolutionNote('');
            setMessages([]);
        }
    }, [selectedTicket?.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTicket) return;
        if (!file.type.startsWith('image/')) {
            showToast("Please upload an image file.", 'error');
            return;
        }
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedTicket.ticketId}_${Math.random().toString(36).slice(2)}.${fileExt}`;
            const filePath = `chat_attachments/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('helpdesk-attachments').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('helpdesk-attachments').getPublicUrl(filePath);
            const { error: msgError } = await supabase.from('helpdesk_ticket_messages').insert([{
                ticket_id: selectedTicket.id,
                sender_name: currentUser?.fullName || 'IT Support',
                sender_role: 'IT',
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
        setResolutionNote(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const matchesSearch = (t.requesterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.ticketId || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tickets, searchTerm, statusFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const paginatedTickets = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTickets.slice(start, start + itemsPerPage);
    }, [filteredTickets, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setCurrentPage(1);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Resolved':
            case 'Closed':
                return <div className="flex items-center gap-1.5 text-emerald-500 font-bold uppercase text-[8px]"><CheckCircle2 size={12} /> Solved</div>;
            case 'In Progress':
                return <div className="flex items-center gap-1.5 text-blue-500 font-bold uppercase text-[8px]"><Clock size={12} /> Process</div>;
            case 'Pending':
                return <div className="flex items-center gap-1.5 text-amber-500 font-bold uppercase text-[8px]"><PauseCircle size={12} /> Hold</div>;
            case 'Open':
                return <div className="flex items-center gap-1.5 text-rose-500 font-bold uppercase text-[8px]"><CircleDot size={12} className="animate-pulse" /> New</div>;
            default:
                return <span className="text-[8px] font-bold uppercase text-slate-400">{status}</span>;
        }
    };

    const isOwner = useMemo(() => {
        if (!selectedTicket || !currentUser) return false;
        if (!selectedTicket.assignedTo) return true;
        return selectedTicket.assignedTo === currentUser.fullName;
    }, [selectedTicket, currentUser]);

    const isSolved = useMemo(() => {
        const s = selectedTicket?.status;
        if (!s) return false;
        // If status is not one of the active ones, consider it solved/resolved
        return !['Open', 'In Progress', 'Pending', 'New', 'Process', 'Hold'].includes(s);
    }, [selectedTicket]);

    const handleSendReply = async () => {
        if (!selectedTicket || isActionLoading || isSolved || !resolutionNote.trim()) return;
        setIsActionLoading(true);
        try {
            const updatePayload: any = { resolution: resolutionNote };
            if (!selectedTicket.assignedTo) {
                updatePayload.assigned_to = currentUser?.fullName || 'IT Staff';
                updatePayload.assigned_to_email = currentUser?.email;
            }
            // Update ticket summary
            const { error: ticketError } = await supabase.from('helpdesk_tickets').update(updatePayload).eq('id', selectedTicket.id);
            if (ticketError) throw ticketError;

            // Insert into messages history
            const { error: msgError } = await supabase.from('helpdesk_ticket_messages').insert([{
                ticket_id: selectedTicket.id,
                sender_name: currentUser?.fullName || 'IT Support',
                sender_role: 'IT',
                message: resolutionNote
            }]);
            if (msgError) throw msgError;

            showToast('Reply sent successfully');

            // Notify Requester
            if (selectedTicket.requesterEmail) {
                await supabase.from('notifications').insert([{
                    user_email: selectedTicket.requesterEmail,
                    title: 'Support Response',
                    message: `IT Support has replied to your ticket: ${selectedTicket.subject}`,
                    type: 'Success',
                    link: 'helpdesk'
                }]);
            }

            setResolutionNote('');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId: number, nextStatus: string) => {
        if (isActionLoading || isSolved) return;
        if (!isOwner) {
            showToast('Only the ticket owner can change status', 'error');
            return;
        }
        if (nextStatus === 'Resolved') {
            let finalNote = resolutionNote.trim();

            // If empty, try to fetch the last IT message as requested
            if (!finalNote) {
                const lastITMessage = [...messages].reverse().find(m => m.sender_role === 'IT');
                if (lastITMessage) {
                    finalNote = lastITMessage.message;
                    setResolutionNote(finalNote);
                }
            }

            if (!finalNote) {
                showToast('Please provide a resolution note first', 'error');
                return;
            }
            setIsSolveConfirmOpen(true);
            return;
        }
        executeStatusUpdate(ticketId, nextStatus);
    };

    const handleConvertToActivity = async () => {
        if (!selectedTicket || isActionLoading || !isSolved) return;
        setIsActionLoading(true);
        try {
            const payload = {
                activity_name: selectedTicket.subject,
                category: 'Troubleshooting',
                requester: selectedTicket.requesterName,
                department: selectedTicket.department,
                it_personnel: selectedTicket.assignedTo || currentUser?.fullName || 'IT Support',
                type: selectedTicket.priority === 'Critical' ? 'Critical' : 'Minor',
                status: 'Completed',
                remarks: selectedTicket.resolution || selectedTicket.description,
                created_at: new Date().toISOString()
            };

            const { error } = await supabase.from('activity_logs').insert([payload]);
            if (error) throw error;

            showToast('Converted to IT Activity successfully');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const executeStatusUpdate = async (ticketId: number, nextStatus: string) => {
        setIsActionLoading(true);
        try {
            let finalResolution = resolutionNote;
            if (nextStatus === 'Resolved') {
                const now = new Date().toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).replace(',', '');
                if (!finalResolution.includes('[Resolved on:')) {
                    finalResolution = `${finalResolution}\n\n[Resolved on: ${now}]`;
                }
            }
            const { error } = await supabase.from('helpdesk_tickets').update({
                status: nextStatus,
                resolution: finalResolution,
                assigned_to: selectedTicket.assignedTo || currentUser?.fullName || 'IT Staff',
                assigned_to_email: currentUser?.email
            }).eq('id', ticketId);
            if (error) throw error;
            showToast(`Status updated to ${nextStatus}`);
            setIsSolveConfirmOpen(false);
            await fetchTickets();
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => prev ? { ...prev, status: nextStatus as any, resolution: finalResolution, assignedTo: prev.assignedTo || currentUser?.fullName } : null);
                setResolutionNote(finalResolution);
            }

            // Notify Requester on Resolution
            if (nextStatus === 'Resolved' && selectedTicket.requesterEmail) {
                await supabase.from('notifications').insert([{
                    user_email: selectedTicket.requesterEmail,
                    title: 'Ticket Resolved',
                    message: `Your technical request "${selectedTicket.subject}" has been marked as solved.`,
                    type: 'Success',
                    link: 'helpdesk'
                }]);
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const stats = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'Open').length,
        inProgress: tickets.filter(t => t.status === 'In Progress').length,
        resolved: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
    }), [tickets]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Helpdesk Manager</h1><p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Manage your company's helpdesk</p></div>

            {toast && (
                <div className={`fixed top-24 right-8 z-[2000] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{toast.text}</span>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total tickets" value={stats.total} icon={MessageSquare} color="blue" />
                <StatCard label="New requests" value={stats.open} icon={CircleDot} color="rose" />
                <StatCard label="Active ops" value={stats.inProgress} icon={Clock} color="indigo" />
                <StatCard label="Stabilized" value={stats.resolved} icon={CheckCircle2} color="emerald" />
            </div>

            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)] min-h-[650px]">
                {/* LEFT COLUMN: Support Queue */}
                <div className={`w-full lg:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden shrink-0 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 flex flex-col gap-3 bg-slate-50/30 dark:bg-slate-800/50 shrink-0">
                        <div className="relative">
                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-0.5 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700">
                                {['All', 'Open', 'In Progress', 'Resolved'].map(st => (
                                    <button key={st} onClick={() => setStatusFilter(st)} className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${statusFilter === st ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{st === 'In Progress' ? 'Process' : st === 'Resolved' ? 'Solved' : st}</button>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={resetFilters} className="p-1.5 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm" title="Reset"><RotateCcw size={12} /></button>
                                <button onClick={fetchTickets} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-sm"><RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-10 text-center flex flex-col items-center gap-2"><Loader2 size={24} className="animate-spin text-blue-500" /><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Scanning...</p></div>
                        ) : paginatedTickets.length === 0 ? (
                            <div className="p-10 text-center text-slate-300 dark:text-slate-600 font-bold text-[8px] tracking-widest italic uppercase">No entries.</div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {paginatedTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group ${selectedTicket?.id === ticket.id ? 'bg-blue-50/50 dark:bg-blue-900/10 border-r-2 border-r-blue-500' : ''}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ticket.status === 'Open' ? 'bg-rose-500 animate-pulse' : ticket.status === 'Resolved' ? 'bg-emerald-500' : ticket.status === 'Pending' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                            <div className="overflow-hidden">
                                                <div className="flex items-center gap-1.5 mb-0.5"><span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 font-mono">{ticket.ticketId}</span><h4 className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">{ticket.subject}</h4></div>
                                                <p className="text-[9px] text-slate-400 font-medium truncate">{ticket.requesterName} • {ticket.department}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-3 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">P. {currentPage}/{totalPages || 1}</p>
                        <div className="flex items-center gap-1">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronLeft size={12} /></button>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronRight size={12} /></button>
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: Chat Interface */}
                <div className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-500 ${!selectedTicket ? 'hidden lg:flex' : (detailTab === 'chat' ? 'flex' : 'hidden lg:flex')}`}>
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    {/* Mobile Back Button */}
                                    <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                                        <ChevronLeft size={20} />
                                    </button>

                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">{selectedTicket.subject}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-blue-500 font-mono uppercase tracking-wider">{selectedTicket.ticketId}</span>
                                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1">
                                                {getStatusIcon(selectedTicket.status)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Mobile Detail Tab Switcher */}
                            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 flex lg:hidden border-b border-slate-100 dark:border-slate-800 gap-2">
                                <button
                                    onClick={() => setDetailTab('chat')}
                                    className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${detailTab === 'chat' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Discussion
                                </button>
                                <button
                                    onClick={() => setDetailTab('info')}
                                    className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${detailTab === 'info' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Info & Manage
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20 p-6 space-y-6">
                                <div className="space-y-4 max-w-2xl mx-auto">
                                    <div className="flex flex-col gap-1 items-start max-w-[90%]">
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800/50 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed shadow-sm">
                                            <p className="text-[9px] font-black text-blue-600/50 dark:text-blue-400/30 uppercase mb-2 tracking-[0.2em]">INITIAL REPORT</p>
                                            <EmojiRenderer text={selectedTicket.description} />
                                        </div>
                                    </div>

                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex flex-col gap-1 max-w-[90%] ${msg.sender_role === 'IT' ? 'ml-auto items-end' : 'items-start'}`}>
                                            <div className={`${msg.sender_role === 'IT' ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800/50'} p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm`}>
                                                <div className={`text-[8px] font-bold uppercase mb-1.5 opacity-60 flex items-center gap-2 ${msg.sender_role === 'IT' ? 'justify-end' : ''}`}>
                                                    {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
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
                                                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                                                                    <div className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
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
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                {!isSolved ? (
                                    <div className="max-w-4xl mx-auto py-2">
                                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 px-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                                            {/* Action Buttons: Upload */}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0 disabled:opacity-50"
                                                disabled={isUploading}
                                                title="Attach Image"
                                            >
                                                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={22} />}
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                                            {/* Input Area */}
                                            <textarea
                                                rows={1}
                                                className="flex-1 p-2 bg-transparent border-none text-[13px] font-medium outline-none placeholder:text-slate-300 dark:text-slate-500 dark:text-white resize-none h-10 flex items-center pt-2.5"
                                                placeholder={`Type a message to ${selectedTicket.requesterName.split(' ')[0]}...`}
                                                value={resolutionNote}
                                                onChange={e => setResolutionNote(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                            />

                                            {/* Emoji Picker */}
                                            <div className="relative shrink-0">
                                                <button
                                                    ref={emojiTriggerRef}
                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                    className={`p-1.5 transition-all rounded-lg ${showEmojiPicker ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                                                    title="Add Emoji"
                                                >
                                                    <Smile size={22} />
                                                </button>
                                                {showEmojiPicker && (
                                                    <div className="absolute bottom-full right-0 mb-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl z-[100] w-[280px] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                                                        <div className="flex items-center justify-between p-2 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                                                            <div className="flex">
                                                                {EMOJI_CATEGORIES.map((cat, idx) => (
                                                                    <button key={cat.name} onClick={() => setActiveEmojiCategory(idx)} className={`p-1.5 rounded-lg transition-all ${activeEmojiCategory === idx ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{cat.icon}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="p-2 grid grid-cols-7 gap-0.5 h-[180px] overflow-y-auto custom-scrollbar">
                                                            {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map(emoji => (
                                                                <button key={emoji} onClick={() => addEmoji(emoji)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-all hover:scale-110 active:scale-90"><FluentEmoji emoji={emoji} size={16} /></button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Send Button */}
                                            <button
                                                onClick={handleSendReply}
                                                disabled={isActionLoading || !resolutionNote.trim()}
                                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 shrink-0"
                                            >
                                                {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto py-2">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Incident Resolved</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                                <MessageSquare size={24} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">Select an active session</p>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Ticket Info & Actions */}
                {selectedTicket && (
                    <div className={`w-full lg:w-[320px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-2 duration-500 shrink-0 ${detailTab !== 'info' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-5 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Requester Details</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-none">{selectedTicket.requesterName}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{selectedTicket.requesterEmail || 'No email provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Building2 size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">Department</p>
                                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedTicket.department}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Priority & Status</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Priority</p>
                                        <p className={`text-[10px] font-black uppercase ${selectedTicket.priority === 'Critical' ? 'text-rose-600' : selectedTicket.priority === 'High' ? 'text-amber-600' : 'text-blue-600'}`}>{selectedTicket.priority}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Created At</p>
                                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {!isSolved ? (
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Management</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button disabled={isActionLoading || !isOwner} onClick={() => handleUpdateStatus(selectedTicket.id, 'In Progress')} className={`h-9 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${selectedTicket.status === 'In Progress' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>Process</button>
                                            <button disabled={isActionLoading || !isOwner} onClick={() => handleUpdateStatus(selectedTicket.id, 'Pending')} className={`h-9 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${selectedTicket.status === 'Pending' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>Hold</button>
                                        </div>
                                        <button disabled={isActionLoading || !isOwner} onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')} className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                                            <CheckCircle2 size={12} /> Mark Solved
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Resolution</p>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
                                            "{selectedTicket.resolution?.split('\n\n')[0] || 'No resolution notes'}"
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleConvertToActivity}
                                        disabled={isActionLoading}
                                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                                    >
                                        {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : <ClipboardList size={12} />} Convert to Activity
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex flex-col items-center justify-center gap-1 shrink-0">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.4em]">OPERATIONAL SYSTEM</p>
                            <p className="text-[7px] text-slate-500 font-mono">v4.0.2-STABLE</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {
                previewImage && (
                    <div
                        className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"
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
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10 backdrop-blur-md"
                                >
                                    Download Original
                                </a>
                            </div>
                        </div>
                    </div>
                )
            }
            <DangerConfirmModal isOpen={isSolveConfirmOpen} onClose={() => setIsSolveConfirmOpen(false)} onConfirm={() => executeStatusUpdate(selectedTicket.id, 'Resolved')} title="Confirm Resolution" message="Are you sure you want to mark this as Solved? This action is permanent and the ticket node will be finalized." isLoading={isActionLoading} />
        </div >
    );
};