'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserAccount } from '../types';
import {
    Search, RefreshCcw, CheckCircle2, Clock, AlertCircle,
    MessageSquare, X, Loader2, Send, ClipboardList,
    User, Building2, PauseCircle, Lock, Unlock, MessageCircle, ChevronLeft, ChevronRight, CircleDot, RotateCcw
} from 'lucide-react';
import { StatCard } from './MainDashboard';
import { DangerConfirmModal } from './DangerConfirmModal';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:col-span-7 flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-h-[500px]">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/30 dark:bg-slate-800/50 shrink-0">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search by requester or ID..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
                            {['All', 'Open', 'In Progress', 'Pending', 'Resolved'].map(st => (
                                <button key={st} onClick={() => setStatusFilter(st)} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${statusFilter === st ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}>{st === 'In Progress' ? 'Process' : st === 'Resolved' ? 'Solved' : st}</button>
                            ))}
                        </div>
                        <button
                            onClick={resetFilters}
                            className="p-2.5 text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shrink-0 transition-colors shadow-sm"
                            title="Reset Filters"
                        >
                            <RotateCcw size={16} />
                        </button>
                        <button onClick={fetchTickets} className="p-2.5 text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shrink-0 transition-colors shadow-sm"><RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-20 text-center flex flex-col items-center gap-3"><Loader2 size={32} className="animate-spin text-blue-500" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning protocols...</p></div>
                        ) : paginatedTickets.length === 0 ? (
                            <div className="p-20 text-center text-slate-300 dark:text-slate-600 font-bold text-[10px] tracking-widest italic">No entries found.</div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {paginatedTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group ${selectedTicket?.id === ticket.id ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${ticket.status === 'Open' ? 'bg-rose-500 animate-pulse' : ticket.status === 'Resolved' ? 'bg-emerald-500' : ticket.status === 'Pending' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5"><span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/50">{ticket.ticketId}</span><h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-blue-600 transition-colors">{ticket.subject}</h4></div>
                                                <div className="flex items-center gap-2"><p className="text-[10px] text-slate-400 font-medium">{ticket.requesterName}</p><span className="w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></span><p className="text-[10px] text-slate-400 font-medium">{ticket.department}</p></div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 mb-1.5 uppercase">{new Date(ticket.createdAt).toLocaleDateString('en-GB')}</p>
                                            {getStatusIcon(ticket.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</p>
                        <div className="flex items-center gap-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-2 duration-500 shrink-0">
                    {selectedTicket ? (
                        <>
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white relative shrink-0"><div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-12 -mt-12"></div><div className="flex items-center justify-between mb-6 relative z-10"><span className="text-[10px] font-bold text-blue-400 font-mono tracking-widest">{selectedTicket.ticketId}</span><button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-500"><X size={20} /></button></div><h3 className="text-xl font-bold tracking-tight mb-2 leading-none relative z-10">{selectedTicket.subject}</h3><div className="flex flex-wrap gap-x-4 gap-y-2 relative z-10"><div className="flex items-center gap-1.5"><User size={12} className="text-slate-500" /><p className="text-[10px] font-semibold text-slate-400">{selectedTicket.requesterName}</p></div><div className="flex items-center gap-1.5"><Building2 size={12} className="text-slate-500" /><p className="text-[10px] font-semibold text-slate-400">{selectedTicket.department}</p></div></div></div>
                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50 dark:bg-slate-900 shadow-inner">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">System - Initial Report</p>
                                            {selectedTicket.description}
                                        </div>
                                    </div>

                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender_role === 'IT' ? 'ml-auto items-end' : 'items-start'}`}>
                                            <div className={`${msg.sender_role === 'IT' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800'} p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm`}>
                                                <div className={`text-[9px] font-bold uppercase mb-1 opacity-60 flex items-center gap-2 ${msg.sender_role === 'IT' ? 'justify-end' : ''}`}>
                                                    {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {msg.message}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                {!isSolved ? (
                                    <div className="space-y-4">
                                        <textarea rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[13px] font-medium focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-400 dark:text-white" placeholder="Type message to requester..." value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}></textarea>
                                        <div className="flex gap-2">
                                            <button onClick={handleSendReply} disabled={isActionLoading || !resolutionNote.trim()} className="flex-1 h-12 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                                                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Message
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 w-full">
                                        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-3xl flex flex-col items-center gap-4 text-emerald-700 dark:text-emerald-400">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={20} className="text-emerald-500" />
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Incident Resolved - Chat Closed</span>
                                            </div>

                                            {selectedTicket.resolution && (
                                                <div className="w-full text-center px-4 space-y-2">
                                                    <div className="h-px w-12 bg-emerald-200 dark:bg-emerald-800/50 mx-auto"></div>
                                                    <p className="text-[13px] font-medium leading-relaxed italic text-emerald-800/80 dark:text-emerald-300/80">
                                                        "{selectedTicket.resolution.split('\n\n[Resolved on:')[0]}"
                                                    </p>
                                                    {selectedTicket.resolution.includes('[Resolved on:') && (
                                                        <p className="text-[9px] font-bold font-mono opacity-60">
                                                            ON {selectedTicket.resolution.split('[Resolved on: ')[1]?.replace(']', '')}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {!selectedTicket.resolution && (
                                                <span className="text-[8px] opacity-40 uppercase font-mono">Ref: {selectedTicket.ticketId}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="flex justify-between items-center shrink-0">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ticket Actions</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{selectedTicket.priority} PRIORITY</span>
                                    </div>
                                </div>
                                {!isSolved ? (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <button disabled={isActionLoading || !isOwner} onClick={() => handleUpdateStatus(selectedTicket.id, 'In Progress')} className={`h-10 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${selectedTicket.status === 'In Progress' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}><Clock size={12} className="inline mr-1" /> Process</button>
                                            <button disabled={isActionLoading || !isOwner} onClick={() => handleUpdateStatus(selectedTicket.id, 'Pending')} className={`h-10 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border ${selectedTicket.status === 'Pending' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}><PauseCircle size={12} className="inline mr-1" /> Hold</button>
                                        </div>
                                        <button disabled={isActionLoading || !isOwner} onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-md transition-all active:scale-95"><CheckCircle2 size={12} className="inline mr-1" /> Mark Resolved</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConvertToActivity}
                                        disabled={isActionLoading}
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                                    >
                                        {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />} Convert to IT Activity
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (<div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30"><div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6"><MessageSquare size={36} className="text-slate-300 dark:text-slate-600" /></div><p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">Select a ticket</p></div>)}
                </div>
            </div>

            <DangerConfirmModal isOpen={isSolveConfirmOpen} onClose={() => setIsSolveConfirmOpen(false)} onConfirm={() => executeStatusUpdate(selectedTicket.id, 'Resolved')} title="Confirm Resolution" message="Are you sure you want to mark this as Solved? This action is permanent and the ticket node will be finalized." isLoading={isActionLoading} />
        </div>
    );
};