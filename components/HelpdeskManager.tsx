'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserAccount } from '../types';
import {
    Search, RefreshCcw, CheckCircle2, Clock, AlertCircle, MessageSquare, X, Loader2, Send, ClipboardList,
    User, Building2, PauseCircle, Lock, Unlock, MessageCircle, ChevronLeft, ChevronRight, CircleDot, RotateCcw,
    Image as ImageIcon, Smile, Paperclip, Globe, Zap, Hash, PlusCircle, LifeBuoy, Settings, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from './StatCard';
import { DangerConfirmModal } from './DangerConfirmModal';
import { FluentEmoji } from '@lobehub/fluent-emoji';
import { exportToExcel } from '../lib/excelExport';
import { FileSpreadsheet } from 'lucide-react';

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin';

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
        requesterEmail: t.requester_email,
        requesterPhone: t.requester_phone,
        department: t.department,
        subject: t.subject,
        description: t.description,
        priority: t.priority,
        status: t.status,
        createdAt: t.created_at,
        assignedTo: t.assigned_to,
        assignedToEmail: t.assigned_to_email,
        resolution: t.resolution
    });

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('helpdesk_tickets').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                if (data.length > 0) {
                    console.log("[HelpdeskInit] Data structure sample (Ticket 0):", Object.keys(data[0]));
                }
                setTickets(data.map(mapTicket));
            }
        } catch (err: any) {
            console.error("Fetch Tickets Error:", err);
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
                    const newTicket = {
                        id: payload.new.id,
                        ticketId: payload.new.ticket_id,
                        requesterName: payload.new.requester_name,
                        requesterEmail: payload.new.requester_email,
                        requesterPhone: payload.new.requester_phone,
                        department: payload.new.department,
                        subject: payload.new.subject,
                        description: payload.new.description,
                        priority: payload.new.priority,
                        status: payload.new.status,
                        createdAt: payload.new.created_at,
                        assignedTo: payload.new.assigned_to,
                        assignedToEmail: payload.new.assigned_to_email,
                        resolution: payload.new.resolution
                    };
                    setTickets(prev => [newTicket, ...prev]);
                    showToast(`New Ticket: ${newTicket.subject}`, 'success');
                    playNotificationSound();
                    sendBrowserNotification(newTicket);
                } else if (payload.eventType === 'UPDATE') {
                    const updatedTicket = {
                        id: payload.new.id,
                        ticketId: payload.new.ticket_id,
                        requesterName: payload.new.requester_name,
                        requesterEmail: payload.new.requester_email,
                        requesterPhone: payload.new.requester_phone,
                        department: payload.new.department,
                        subject: payload.new.subject,
                        description: payload.new.description,
                        priority: payload.new.priority,
                        status: payload.new.status,
                        createdAt: payload.new.created_at,
                        assignedTo: payload.new.assigned_to,
                        assignedToEmail: payload.new.assigned_to_email,
                        resolution: payload.new.resolution
                    };
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

    const handleExportExcel = () => {
        if (filteredTickets.length === 0) return;

        const dataToExport = filteredTickets.map(t => ({
            "Ticket ID": t.ticketId,
            "Requester": t.requesterName,
            "Email": t.requesterEmail,
            "Phone": t.requesterPhone || "-",
            "Department": t.department,
            "Subject": t.subject,
            "Description": t.description,
            "Priority": t.priority,
            "Status": t.status,
            "Created At": t.createdAt || "-",
            "Assigned To": t.assignedTo || "Unassigned",
            "Resolution": t.resolution || "-"
        }));

        exportToExcel(dataToExport, `GESIT-HELPDESK-${new Date().toISOString().split('T')[0]}`);
    };

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

    const executeStatusUpdate = async (ticketId: number, nextStatus: string, forcedNote?: string) => {
        setIsActionLoading(true);
        try {
            let finalResolution = forcedNote || resolutionNote;
            if (nextStatus === 'Resolved') {
                const now = new Date().toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }).replace(',', '');
                if (!finalResolution.includes('[Resolved on:')) {
                    finalResolution = `${finalResolution}\n\n[Resolved on: ${now}]`;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            const userEmail = session?.user?.email;

            console.log(`[HelpdeskUpdate] EXECUTION START - Ticket:${ticketId} Status:${nextStatus}`);
            console.log(`[HelpdeskUpdate] Auth Session: ${session ? 'Active (' + userEmail + ')' : 'None'}`);

            const payload = {
                status: nextStatus,
                resolution: finalResolution,
                assigned_to: currentUser?.fullName || 'IT Support',
                assigned_to_email: userEmail
            };

            console.log(`[HelpdeskUpdate] Payload:`, payload);

            // Perform Update
            const { error: updateErr, count: affectedRows, status: dbStatus } = await supabase
                .from('helpdesk_tickets')
                .update(payload, { count: 'exact' })
                .eq('id', ticketId);

            console.log(`[HelpdeskUpdate] DB Result - Status: ${dbStatus} Affected: ${affectedRows}`, updateErr || '');

            if (updateErr) throw updateErr;

            if (affectedRows === 0) {
                // Try fallback by ticket_id string if ID failed
                const { count: fallbackRows } = await supabase
                    .from('helpdesk_tickets')
                    .update(payload, { count: 'exact' })
                    .eq('ticket_id', selectedTicket?.ticketId);

                if (!fallbackRows || fallbackRows === 0) {
                    throw new Error("RLS Block: Your account does not have permission to update this ticket. Please ensure the Supabase RLS policy is correctly applied.");
                }
            }

            // Verification Check
            const { data: verifyData } = await supabase.from('helpdesk_tickets').select('status').eq('id', ticketId).single();
            if (verifyData?.status !== nextStatus) {
                throw new Error("Silent Failure: Database accepted the update but the status remains unchanged. Check for DB triggers.");
            }

            showToast(`Ticket status updated to ${nextStatus}`);
            setIsSolveConfirmOpen(false);
            await fetchTickets();

            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => prev ? {
                    ...prev,
                    status: nextStatus as any,
                    resolution: finalResolution,
                    assignedTo: currentUser?.fullName || prev.assignedTo,
                    assignedToEmail: userEmail || prev.assignedToEmail
                } : null);
                setResolutionNote(finalResolution);
            }

            // Notify Requester
            if (nextStatus === 'Resolved' && selectedTicket?.requesterEmail) {
                await supabase.from('notifications').insert([{
                    user_email: selectedTicket.requesterEmail,
                    title: 'Ticket Resolved',
                    message: `Your technical request "${selectedTicket.subject}" has been marked as solved.`,
                    type: 'Success',
                    link: 'helpdesk'
                }]);
            }
        } catch (err: any) {
            console.error("[HelpdeskUpdate] FATAL ERROR:", err);
            showToast(err.message || "Failed to save status", 'error');
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
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10 shrink-0">
                        <LifeBuoy size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">Helpdesk <span className="text-blue-600">Manager</span></h1>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Enterprise support lifecycle</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTickets} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95 group">
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    {isAdmin && (
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
                            <Settings size={18} />
                        </button>
                    )}
                </div>
            </div>

            {toast && (
                <div className={`fixed top-24 right-8 z-[2000] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{toast.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Requests" value={stats.total} icon={MessageSquare} color="blue" />
                <StatCard label="Awaiting Action" value={stats.open} icon={CircleDot} color="rose" />
                <StatCard label="Active Sessions" value={stats.inProgress} icon={Clock} color="indigo" />
                <StatCard label="Resolved Incidents" value={stats.resolved} icon={CheckCircle2} color="emerald" />
            </div>

            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)] min-h-[650px]">
                {/* LEFT COLUMN: Support Queue */}
                <div className={`w-full lg:w-96 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col overflow-hidden shrink-0 transition-all duration-500 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-4 bg-slate-50/20 dark:bg-slate-800/10 shrink-0">
                        <div className="relative group">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search repository..."
                                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all dark:text-white placeholder:text-slate-400/70"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
                                {['All', 'Open', 'In Progress', 'Resolved'].map(st => {
                                    const isActive = statusFilter === st;
                                    const label = st === 'In Progress' ? 'Process' : st === 'Resolved' ? 'Solved' : st;
                                    return (
                                        <button
                                            key={st}
                                            onClick={() => setStatusFilter(st)}
                                            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 relative z-10 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                                        >
                                            {label}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="status-tab-helpdesk"
                                                    className="absolute inset-0 bg-white dark:bg-slate-700 shadow-sm rounded-xl -z-10"
                                                    initial={false}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={handleExportExcel} className="p-2 text-emerald-500 hover:text-emerald-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm hover:shadow-lg active:scale-90" title="Export Excel"><FileSpreadsheet size={14} strokeWidth={2.5} /></button>
                                <button onClick={resetFilters} className="p-2 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm hover:shadow-lg active:scale-90" title="Reset"><RotateCcw size={14} strokeWidth={2.5} /></button>
                                <button onClick={fetchTickets} className="p-2 text-slate-400 hover:text-indigo-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all shadow-sm hover:shadow-lg active:scale-90" title="Refresh"><RefreshCcw size={14} strokeWidth={2.5} className={isLoading ? 'animate-spin' : ''} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-10 text-center flex flex-col items-center gap-2"><Loader2 size={24} className="animate-spin text-blue-500" /><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Scanning...</p></div>
                        ) : paginatedTickets.length === 0 ? (
                            <div className="p-10 text-center text-slate-300 dark:text-slate-600 font-bold text-[8px] tracking-widest italic uppercase">No entries.</div>
                        ) : (
                            <div className="divide-y divide-slate-100/30 dark:divide-slate-800/30">
                                {paginatedTickets.map(ticket => {
                                    const isSelected = selectedTicket?.id === ticket.id;
                                    const statusColors: any = {
                                        'Open': 'bg-rose-500',
                                        'Resolved': 'bg-emerald-500',
                                        'In Progress': 'bg-indigo-500',
                                        'Pending': 'bg-amber-500'
                                    };
                                    const dotColor = statusColors[ticket.status] || 'bg-slate-400';

                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className={`
                                                p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group relative
                                                ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}
                                            `}
                                        >
                                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                                            <div className="flex items-center gap-4 min-w-0 pr-2">
                                                <div className="relative shrink-0">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${ticket.status === 'Open' ? 'animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''}`} />
                                                    {ticket.status === 'Open' && <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20 scale-150" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight shrink-0">{ticket.ticketId}</span>
                                                        <h4 className={`text-xs font-black truncate transition-colors ${isSelected ? 'text-indigo-950 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                                                            {ticket.subject}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                                        <span className="truncate max-w-[100px]">{ticket.requesterName}</span>
                                                        <span className="opacity-30">•</span>
                                                        <span className="truncate">{ticket.department}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600">
                                                    {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
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

                {/* SHARED MOBILE DETAIL HEADER */}
                {selectedTicket && (
                    <div className="lg:hidden flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mb-4 animate-in slide-in-from-top-4 duration-500 overflow-hidden">
                        <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedTicket(null)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                                    <ChevronLeft size={20} />
                                </button>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight leading-tight line-clamp-1">{selectedTicket.subject}</h3>
                                    <span className="text-[9px] font-bold text-blue-500 font-mono uppercase tracking-wider">{selectedTicket.ticketId}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 flex border-b border-slate-100 dark:border-slate-800 gap-2">
                            <button
                                onClick={() => setDetailTab('chat')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${detailTab === 'chat' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Discussion
                            </button>
                            <button
                                onClick={() => setDetailTab('info')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${detailTab === 'info' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Info & Manage
                            </button>
                        </div>
                    </div>
                )}

                {/* CENTER COLUMN: Chat Interface */}
                <div className={`flex-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-500 ${!selectedTicket ? 'hidden lg:flex' : (detailTab === 'chat' ? 'flex' : 'hidden lg:flex')}`}>
                    {selectedTicket ? (
                        <>
                            {/* Chat Header - Only show full version on Desktop */}
                            <div className="p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 hidden lg:flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-800/50">
                                        <MessageSquare size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-1">{selectedTicket.subject}</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-100/50 dark:border-indigo-500/20">
                                                <Hash size={10} strokeWidth={3} />
                                                {selectedTicket.ticketId}
                                            </div>
                                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                                            <div className="flex items-center">
                                                {getStatusIcon(selectedTicket.status)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-rose-500 active:scale-95 shadow-sm hover:shadow-md">
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>



                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20 p-8 pt-6 space-y-8">
                                <div className="space-y-6 max-w-3xl mx-auto">
                                    <div className="flex flex-col gap-2 items-start max-w-[95%]">
                                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-[2rem] rounded-tl-none border border-slate-200/50 dark:border-slate-800/50 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm relative group/report">
                                            <div className="absolute -left-2 top-0 w-2 h-4 bg-white/80 dark:bg-slate-800/80 border-l border-t border-slate-200/50 dark:border-slate-800/50" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
                                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em]">Initial System Report</p>
                                            </div>
                                            <div className="font-medium whitespace-pre-wrap">
                                                <EmojiRenderer text={selectedTicket.description} />
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence mode="popLayout">
                                        {messages.map((msg, idx) => {
                                            const isIT = msg.sender_role === 'IT';
                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    key={idx}
                                                    className={`flex flex-col gap-1.5 max-w-[90%] ${isIT ? 'ml-auto items-end' : 'items-start'}`}
                                                >
                                                    <div className={`
                                                        ${isIT
                                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-[1.75rem] rounded-tr-none shadow-lg shadow-indigo-500/10'
                                                            : 'bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-[1.75rem] rounded-tl-none border border-slate-200/50 dark:border-slate-800/50 shadow-sm'}
                                                        p-5 text-[13px] font-medium leading-relaxed relative
                                                    `}>
                                                        <div className={`text-[9px] font-black uppercase mb-2 opacity-50 flex items-center gap-2 tracking-widest ${isIT ? 'justify-end' : ''}`}>
                                                            {msg.sender_name} <span className="opacity-30">•</span> {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="relative z-10">
                                                            {(() => {
                                                                const imageMatch = msg.message.match(/!\[image\]\((.*?)\)/);
                                                                if (imageMatch) {
                                                                    const imageUrl = imageMatch[1];
                                                                    return (
                                                                        <div
                                                                            onClick={() => setPreviewImage(imageUrl)}
                                                                            className="block cursor-zoom-in group/img relative overflow-hidden rounded-xl border border-white/20"
                                                                        >
                                                                            <img
                                                                                src={imageUrl}
                                                                                alt="Attachment"
                                                                                className="max-w-full hover:scale-105 transition-transform duration-500"
                                                                                loading="lazy"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                                                                                <div className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/20 backdrop-blur-md p-2 rounded-full text-white border border-white/30">
                                                                                    <Search size={16} strokeWidth={3} />
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
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                {!isSolved ? (
                                    <div className="max-w-4xl mx-auto py-2">
                                        <div className="flex items-end gap-4 p-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-indigo-500/10 ring-1 ring-white/10 px-4">
                                            {/* Upload Trigger */}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-12 h-12 flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-2xl hover:bg-shadow-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 transition-all active:scale-95 shrink-0 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                                                title="Upload Image"
                                            >
                                                {isUploading ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <ImageIcon size={22} strokeWidth={2.5} />}
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                                            {/* Input Area */}
                                            <div className="flex-1 min-h-[48px] flex items-center pt-1">
                                                <textarea
                                                    rows={1}
                                                    className="w-full bg-transparent border-none text-[14px] font-black outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-white resize-none max-h-40 py-2.5 custom-scrollbar"
                                                    placeholder={`Message to ${selectedTicket.requesterName.split(' ')[0]}...`}
                                                    value={resolutionNote}
                                                    onChange={e => {
                                                        setResolutionNote(e.target.value);
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                    }}
                                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                                />
                                            </div>

                                            {/* Emoji Picker / Send Group */}
                                            <div className="flex items-center gap-2 pb-0.5">
                                                <div className="relative shrink-0 flex items-center">
                                                    <button
                                                        ref={emojiTriggerRef}
                                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                        className={`w-11 h-11 flex items-center justify-center transition-all rounded-xl ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-inner' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'}`}
                                                        title="Add Emoji"
                                                    >
                                                        <Smile size={22} strokeWidth={2.5} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {showEmojiPicker && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                className="absolute bottom-full right-0 mb-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-[100] w-[320px] overflow-hidden"
                                                            >
                                                                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                                                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                                                        {EMOJI_CATEGORIES.map((cat, idx) => (
                                                                            <button
                                                                                key={cat.name}
                                                                                onClick={() => setActiveEmojiCategory(idx)}
                                                                                className={`p-2 rounded-xl transition-all shrink-0 ${activeEmojiCategory === idx ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                                            >
                                                                                {cat.icon}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 grid grid-cols-7 gap-1 h-[220px] overflow-y-auto custom-scrollbar">
                                                                    {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map(emoji => (
                                                                        <button
                                                                            key={emoji}
                                                                            onClick={() => addEmoji(emoji)}
                                                                            className="w-9 h-9 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all hover:scale-125 active:scale-90"
                                                                        >
                                                                            <FluentEmoji emoji={emoji} size={18} />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <button
                                                    onClick={handleSendReply}
                                                    disabled={isActionLoading || !resolutionNote.trim()}
                                                    className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-30 disabled:scale-95 disabled:shadow-none shrink-0 group/send"
                                                >
                                                    {isActionLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} strokeWidth={2.5} className="group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />}
                                                </button>
                                            </div>
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
                    <div className={`w-full lg:w-96 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500 shrink-0 ${detailTab !== 'info' ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/20 dark:bg-slate-800/10 hidden lg:block text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Management Terminal</h4>

                            <div className="space-y-5">
                                <div className="p-5 rounded-[2rem] bg-white/50 dark:bg-slate-800/50 border border-slate-200/40 dark:border-slate-700/40 shadow-sm group/req transition-all hover:bg-white dark:hover:bg-slate-800">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/20 group-hover/req:scale-110 transition-transform">
                                            <User size={32} strokeWidth={2} />
                                        </div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1.5">{selectedTicket.requesterName}</p>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-full italic">{selectedTicket.requesterEmail || 'support@gesit-erp.com'}</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Affiliation</p>
                                        <p className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate">{selectedTicket.department}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Metadata</h4>
                                <div className="bg-white/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center justify-between">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Established</p>
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{new Date(selectedTicket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>

                            {!isSolved ? (
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Operations Control</h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                disabled={isActionLoading || !isOwner}
                                                onClick={() => handleUpdateStatus(selectedTicket.id, 'In Progress')}
                                                className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedTicket.status === 'In Progress' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:text-indigo-600'}`}
                                            >
                                                Process
                                            </button>
                                            <button
                                                disabled={isActionLoading || !isOwner}
                                                onClick={() => handleUpdateStatus(selectedTicket.id, 'Pending')}
                                                className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedTicket.status === 'Pending' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-amber-500/50 hover:text-amber-600'}`}
                                            >
                                                On Hold
                                            </button>
                                        </div>
                                        <button
                                            disabled={isActionLoading || !isOwner}
                                            onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                                            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                                        >
                                            <CheckCircle2 size={16} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
                                            Execute Resolution
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/50 relative overflow-hidden group/final">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/final:opacity-10 transition-opacity">
                                            <CheckCircle2 size={60} />
                                        </div>
                                        <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-3">Post-Incident Report</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed mb-4">
                                            "{selectedTicket.resolution?.split('\n\n')[0] || 'System finalized without additional notation'}"
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-emerald-100/50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Case Finalized
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleConvertToActivity}
                                        disabled={isActionLoading}
                                        className="w-full h-12 bg-white dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-indigo-500/20 active:scale-95 border border-indigo-100 dark:border-indigo-900/30 group/conv"
                                    >
                                        {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} strokeWidth={2.5} className="group-hover/conv:scale-110 transition-transform" />}
                                        Log to IT Assets
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-5 bg-slate-900 dark:bg-black text-white flex flex-col items-center justify-center gap-1.5 shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10" />
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] relative z-10">GESIT MISSION CONTROL</p>
                            <div className="flex items-center gap-2 relative z-10">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[8px] text-slate-500 font-mono tracking-widest lowercase">system.stable.v4.1.2</p>
                            </div>
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
            <DangerConfirmModal isOpen={isSolveConfirmOpen} onClose={() => setIsSolveConfirmOpen(false)} onConfirm={() => executeStatusUpdate(selectedTicket.id, 'Resolved', resolutionNote)} title="Confirm Resolution" message="Are you sure you want to mark this as Solved? This action is permanent and the ticket node will be finalized." isLoading={isActionLoading} />
        </div >
    );
};