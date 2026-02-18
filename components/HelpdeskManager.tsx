'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserAccount } from '../types';
import {
    Search, RefreshCcw, CheckCircle2, Clock, AlertCircle, MessageSquare, X, Loader2, Send, ClipboardList,
    User, Building2, PauseCircle, Lock, Unlock, MessageCircle, ChevronLeft, ChevronRight, CircleDot, RotateCcw,
    Image as ImageIcon, Smile, Paperclip, Globe, Zap, Hash, PlusCircle, LifeBuoy, Check,
    ArrowLeft, ArrowRight, ShieldCheck, CloudUpload, Phone, Info, FileText, File, ExternalLink, Star, Download, Inbox, Shield
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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isInternal, setIsInternal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiTriggerRef = useRef<HTMLButtonElement>(null);
    const [detailTab, setDetailTab] = useState<'chat' | 'info'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const role = currentUser?.role?.toLowerCase() || '';
    const groups = currentUser?.groups || [];
    const isAdmin = role.includes('admin');
    const isITStaff = role.includes('admin') || role.includes('staff') || groups.some(g => g.toLowerCase().includes('admin') || g.toLowerCase().includes('staff'));

    // Client-side UI states from HelpdeskPublic
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'success' | 'archive'>('list');
    const [archivePage, setArchivePage] = useState(1);
    const ARCHIVE_PER_PAGE = 5;
    const [recentFilter, setRecentFilter] = useState<'Active' | 'Resolved'>('Active');
    const [searchId, setSearchId] = useState('');
    const [isSuccessMode, setIsSuccessMode] = useState(false);
    const [lastCreatedTicketId, setLastCreatedTicketId] = useState('');
    const [departments, setDepartments] = useState<string[]>([]);
    const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
    const [newTicketData, setNewTicketData] = useState({
        subject: '',
        description: '',
        priority: 'Medium' as any,
        department: currentUser?.department || 'Other',
        attachments: [] as string[]
    });
    const newTicketFileInputRef = useRef<HTMLInputElement>(null);
    const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null);

    // Feedback State
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const EMOJI_CATEGORIES = [
        {
            name: 'Smileys',
            icon: <Smile size={16} />,
            emojis: [
                '😊', '😂', '🤣', '❤️', '😍', '😒', '😭', '😘', '😔', '😩',
                '😏', '😉', '😌', '😎', '😅', '😋', '😶', '😱', '😐', '😣',
                '😯', '😮', '😲', '😴', '😫', '😪', '🙌', '👍', '👋', '👏',
                '👊', '✊', '✌️', '👌', '✋', '👎', '💪', '🙏', '🤝', '💅'
            ]
        },
        {
            name: 'Nature',
            icon: <Globe size={16} />,
            emojis: [
                '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
                '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦅',
                '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
                '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎'
            ]
        },
        {
            name: 'Tech',
            icon: <Zap size={16} />,
            emojis: [
                '💻', '📱', '📧', '💡', '📌', '📎', '📅', '⌚', '🛍️', '🔧',
                '🔒', '🔑', '💎', '📦', '🎁', '🎈', '📂', '📜', '📄', '📓',
                '📊', '📈', '📉', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '📼',
                '🔋', '🔌', '📡', '🛰️', '📠', '📺', '📻', '🎤', '🎚️', '🎛️'
            ]
        },
        {
            name: 'Symbols',
            icon: <Hash size={16} />,
            emojis: [
                '✅', '❌', '⚠️', '⭐', '🔥', '✨', '⚡', '💯', '🎉', '🆘',
                '🚫', '☢️', '💍', '💎', '🌀', '💤', '💥', '💢', '💦', '💨',
                '💫', '💬', '🗨️', '💭', '🗯️', '🔕', '🔈', '🔉', '🔊', '🎵',
                '🎶', '➕', '➖', '✖️', '➗', '❓', '❔', '❕', '❗'

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

    const RichContentRenderer = ({ text, isSelf = false }: { text: string; isSelf?: boolean }) => {
        if (!text) return null;
        const lines = text.split('\n');
        return (
            <div className="space-y-1">
                {lines.map((line, idx) => {
                    const imageMatch = line.match(/!\[image\]\((.*?)\)/);
                    const fileMatch = line.match(/\[Attached (File|PDF)\]\((.*?)\)/);

                    const isUrlPdf = (match: string) =>
                        match.toLowerCase().includes('.pdf') ||
                        match.toLowerCase().includes('raw/upload') ||
                        match.toLowerCase().includes('resource_type:raw');

                    if (imageMatch && !isUrlPdf(imageMatch[1])) {
                        const imageUrl = imageMatch[1];
                        return (
                            <div key={idx} onClick={() => setPreviewImage(imageUrl)} className="block cursor-zoom-in group/img relative overflow-hidden rounded-xl border border-black/5 dark:border-white/5 mt-2 transition-transform active:scale-[0.98] w-full max-w-lg">
                                <img src={imageUrl} alt="Attachment" className="max-w-full max-h-[300px] object-contain bg-slate-100 dark:bg-slate-800 rounded-lg shadow-sm" loading="lazy" />
                            </div>
                        );
                    }
                    if (fileMatch || (imageMatch && isUrlPdf(imageMatch[1]))) {
                        const fileUrl = fileMatch ? fileMatch[2] : imageMatch![1];
                        const isPdf = (fileMatch && fileMatch[1] === 'PDF') || isUrlPdf(fileUrl);
                        return (
                            <div key={idx} onClick={() => isPdf ? setPreviewImage(fileUrl) : window.open(fileUrl, '_blank')} className={`flex items-center gap-3 p-3 rounded-xl mt-2 border transition-all cursor-pointer ${isSelf ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                <div className={`p-2 rounded-lg ${isSelf ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                                    <FileText size={18} />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`text-xs font-bold truncate ${isSelf ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{isPdf ? 'Attached PDF' : 'Attached Document'}</p>
                                    <p className={`text-[10px] truncate ${isSelf ? 'text-white/70' : 'text-slate-500'}`}>Click to {isPdf ? 'preview' : 'view'}</p>
                                </div>
                                <ExternalLink size={14} className={isSelf ? 'text-white/60' : 'text-slate-400'} />
                            </div>
                        );
                    }
                    if (line.trim() === '' && lines.length > 1) return <div key={idx} className="h-1" />;
                    return <div key={idx} className="leading-relaxed"><EmojiRenderer text={line} /></div>;
                })}
            </div>
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
        updatedAt: t.updated_at || t.created_at,
        assignedTo: t.assigned_to,
        assignedToEmail: t.assigned_to_email,
        resolution: t.resolution,
        rating: t.rating,
        feedback: t.feedback,
        attachments: t.attachments || [],
        resolvedAt: t.resolved_at
    });

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            let query = supabase.from('helpdesk_tickets').select('*');

            // SECURITY: If not IT Staff/Admin, only fetch their own tickets (Case-Insensitive)
            if (!isITStaff) {
                if (currentUser?.email) {
                    query = query.ilike('requester_email', currentUser.email);
                } else {
                    // If profile not yet loaded and not IT staff, return empty to prevent leak
                    setTickets([]);
                    setIsLoading(false);
                    return;
                }
            }

            const { data, error } = await query.order('updated_at', { ascending: false });
            if (error) throw error;
            if (data) {
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

            // Filter out internal messages for non-IT staff
            const filteredMessages = isITStaff
                ? data
                : (data || []).filter((m: any) => !m.is_internal);

            setMessages(filteredMessages || []);
        } catch (err: any) {
            console.error('Error fetching messages:', err);
        }
    };

    useEffect(() => {
        fetchTickets();

        const fetchDepts = async () => {
            const { data } = await supabase.from('departments').select('name').order('name');
            if (data) setDepartments(data.map(d => d.name));
        };
        fetchDepts();

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
                        updatedAt: payload.new.updated_at || payload.new.created_at,
                        assignedTo: payload.new.assigned_to,
                        assignedToEmail: payload.new.assigned_to_email,
                        resolution: payload.new.resolution,
                        rating: payload.new.rating,
                        feedback: payload.new.feedback
                    };
                    if (!isITStaff && newTicket.requesterEmail?.toLowerCase() !== currentUser?.email?.toLowerCase()) return;
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
                        updatedAt: payload.new.updated_at || payload.new.created_at,
                        assignedTo: payload.new.assigned_to,
                        assignedToEmail: payload.new.assigned_to_email,
                        resolution: payload.new.resolution,
                        rating: payload.new.rating,
                        feedback: payload.new.feedback
                    };

                    if (!isITStaff && updatedTicket.requesterEmail?.toLowerCase() !== currentUser?.email?.toLowerCase()) {
                        setTickets(prev => prev.filter(t => t.id !== updatedTicket.id));
                        return;
                    }

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
    }, [currentUser?.email, isITStaff]);

    useEffect(() => {
        if (selectedTicket) {
            setResolutionNote(selectedTicket.resolution || '');
            setFeedbackRating(selectedTicket.rating || 0);
            setFeedbackComment(selectedTicket.feedback || '');
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

    const performUpload = (file: File, resourceType: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmr8bxdos';
            const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gesit_erp_preset';

            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, true);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.secure_url);
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.error?.message || 'Upload failed'));
                    } catch (e) {
                        reject(new Error('Upload failed'));
                    }
                }
            };

            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(formData);
        });
    };
    const uploadFileToChat = async (file: File) => {
        if (!selectedTicket) return;

        setIsUploading(true);
        const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmr8bxdos';
        const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gesit_erp_preset';

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', uploadPreset);

        // Determine resource type
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const resourceType = isImage ? 'image' : 'raw';

        try {
            setUploadProgress(0);
            const publicUrl = await performUpload(file, resourceType);

            const senderRole = isITStaff ? 'IT' : 'User';
            const { error: msgError } = await supabase.from('helpdesk_ticket_messages').insert([{
                ticket_id: selectedTicket.id,
                sender_name: currentUser?.fullName || 'IT Support',
                sender_role: senderRole,
                message: isImage ? `![image](${publicUrl})` : isPdf ? `[Attached PDF](${publicUrl})` : `[Attached File](${publicUrl})`
            }]);

            if (msgError) throw msgError;
            showToast("File uploaded successfully.");
        } catch (err: any) {
            console.error('Upload Error Details:', err);
            showToast(err.message || "Upload failed.", 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadFileToChat(file);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    await uploadFileToChat(file);
                    return;
                }
            }
        }
    };

    const addEmoji = (emoji: string) => {
        setResolutionNote(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            // High-Security Filter (Defense in Depth)
            if (!isITStaff && t.requesterEmail?.toLowerCase() !== currentUser?.email?.toLowerCase()) {
                return false;
            }

            const matchesSearch = (t.requesterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.ticketId || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tickets, searchTerm, statusFilter, isITStaff, currentUser?.email]);

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

    const isRequester = useMemo(() => {
        if (!selectedTicket || !currentUser) return false;
        return selectedTicket.requesterEmail?.toLowerCase() === currentUser.email?.toLowerCase();
    }, [selectedTicket, currentUser]);

    const handleSubmitFeedback = async () => {
        if (!selectedTicket || isActionLoading || !feedbackRating) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('helpdesk_tickets')
                .update({
                    rating: feedbackRating,
                    feedback: feedbackComment
                })
                .eq('id', selectedTicket.id);

            if (error) throw error;

            showToast('Thank you for your feedback!', 'success');

            // Update local state
            const updatedTicket = { ...selectedTicket, rating: feedbackRating, feedback: feedbackComment };
            setSelectedTicket(updatedTicket);
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedTicket || isActionLoading || isSolved || !resolutionNote.trim()) return;
        setIsActionLoading(true);
        try {
            const senderRole = isITStaff ? 'IT' : 'User';
            const updatePayload: any = {};
            if (isITStaff && !isInternal) {
                updatePayload.resolution = resolutionNote;
                if (!selectedTicket.assignedTo) {
                    updatePayload.assigned_to = currentUser?.fullName || 'IT Staff';
                    updatePayload.assigned_to_email = currentUser?.email;
                }
            }

            // Update ticket if IT is resolving, otherwise just a reply
            if (Object.keys(updatePayload).length > 0) {
                const { error: ticketError } = await supabase.from('helpdesk_tickets').update(updatePayload).eq('id', selectedTicket.id);
                if (ticketError) throw ticketError;
            }

            // Insert into messages history
            const { error: msgError } = await supabase.from('helpdesk_ticket_messages').insert([{
                ticket_id: selectedTicket.id,
                sender_name: currentUser?.fullName || 'User',
                sender_role: senderRole,
                message: resolutionNote,
                is_internal: isInternal && isITStaff
            }]);
            if (msgError) throw msgError;

            showToast('Reply sent successfully');

            // Notifications logic...
            if (isITStaff && selectedTicket.requesterEmail) {
                await supabase.from('notifications').insert([{
                    user_email: selectedTicket.requesterEmail,
                    title: 'Support Response',
                    message: `IT Support has replied to your ticket: ${selectedTicket.subject}`,
                    type: 'Success',
                    link: 'helpdesk'
                }]);
            } else if (!isITStaff) {
                // Notify IT or Admin if user replies
                const targetEmail = selectedTicket.assignedToEmail;
                if (targetEmail) {
                    await supabase.from('notifications').insert([{
                        user_email: targetEmail,
                        title: 'User Response',
                        message: `${currentUser?.fullName} replied to: ${selectedTicket.subject}`,
                        type: 'Info',
                        link: 'helpdesk'
                    }]);
                }
            }

            setResolutionNote('');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleNewTicketFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmr8bxdos';
        const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'gesit_erp_preset';

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', uploadPreset);

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const resourceType = isImage ? 'image' : (isPdf ? 'raw' : 'auto');

        try {
            setUploadProgress(0);
            const publicUrl = await performUpload(file, resourceType);

            setNewTicketData(prev => ({
                ...prev,
                attachments: [...prev.attachments, publicUrl]
            }));
            showToast("File attached.");
        } catch (err: any) {
            console.error('Upload Error:', err);
            showToast(err.message || "Upload failed.", 'error');
        } finally {
            setIsUploading(false);
            if (newTicketFileInputRef.current) newTicketFileInputRef.current.value = '';
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicketData.subject || !newTicketData.description) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setIsActionLoading(true);
        try {
            const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
            let finalDescription = newTicketData.description;
            if (newTicketData.attachments.length > 0) {
                finalDescription += "\n\n**Attachments:**\n" + newTicketData.attachments.map(url => {
                    const isPdf = url.toLowerCase().includes('.pdf');
                    return isPdf ? `[Attached PDF](${url})` : `![image](${url})`;
                }).join('\n');
            }

            const { error: dbError } = await supabase.from('helpdesk_tickets').insert([{
                ticket_id: ticketId,
                requester_name: currentUser?.fullName,
                requester_email: currentUser?.email,
                department: newTicketData.department,
                subject: newTicketData.subject,
                description: finalDescription,
                priority: newTicketData.priority,
                status: 'Open',
                attachments: newTicketData.attachments,
                created_at: new Date().toISOString()
            }]);

            if (dbError) throw dbError;

            // Notify Admins
            const { data: admins } = await supabase.from('user_accounts').select('email').eq('role', 'Admin');
            if (admins) {
                const notifications = admins.map(a => ({
                    user_email: a.email,
                    title: 'New Service Ticket',
                    message: `${currentUser?.fullName} reported: ${newTicketData.subject}`,
                    type: 'Info',
                    link: 'helpdesk'
                }));
                await supabase.from('notifications').insert(notifications);
            }

            showToast(`Ticket ${ticketId} established.`);
            setIsNewTicketModalOpen(false);
            setLastCreatedTicketId(ticketId);
            setViewMode('success');
            setNewTicketData({
                subject: '',
                description: '',
                priority: 'Medium',
                department: currentUser?.department || 'Other',
                attachments: []
            });
            fetchTickets();
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

            const payload: any = {
                status: nextStatus,
                resolution: finalResolution,
                assigned_to: currentUser?.fullName || 'IT Support',
                assigned_to_email: userEmail,
                updated_at: new Date().toISOString()
            };

            if (nextStatus === 'Resolved') {
                payload.resolved_at = new Date().toISOString();
            } else if (['Open', 'In Progress', 'Pending'].includes(nextStatus)) {
                // If reopened, clear the resolved_at but it's optional
                // payload.resolved_at = null; 
            }

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

    // Perform Search for Client View
    const performSearch = async (id: string) => {
        if (!id) return;
        setIsLoading(true);
        try {
            const { data, error: dbError } = await supabase
                .from('helpdesk_tickets')
                .select('*')
                .eq('ticket_id', id.toUpperCase().trim())
                .maybeSingle();

            if (dbError) throw dbError;
            if (!data) throw new Error('Ticket ID not found.');

            // Verify access if not IT Staff
            if (!isITStaff && data.requester_email?.toLowerCase() !== currentUser?.email?.toLowerCase()) {
                throw new Error('You do not have permission to view this ticket.');
            }

            setSelectedTicket(mapTicket(data));
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadImage = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = url.split('/').pop()?.split('?')[0] || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            {isITStaff && (
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
                    </div>
                </div>
            )}

            {toast && (
                <div className={`fixed top-24 right-8 z-[2000] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border animate-in slide-in-from-right-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{toast.text}</span>
                </div>
            )}

            {isITStaff && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Requests" value={stats.total} icon={MessageSquare} color="blue" />
                    <StatCard label="Awaiting Action" value={stats.open} icon={CircleDot} color="rose" />
                    <StatCard label="Active Sessions" value={stats.inProgress} icon={Clock} color="indigo" />
                    <StatCard label="Resolved Incidents" value={stats.resolved} icon={CheckCircle2} color="emerald" />
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            {isITStaff ? (
                <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)] min-h-[650px]">
                    {/* LEFT COLUMN: Support Queue - ONLY FOR IT STAFF */}
                    <div className={`w-full lg:w-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden shrink-0 transition-all duration-300 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-3 border-b border-slate-50 dark:border-slate-800/50 flex flex-col gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0 z-10 sticky top-0">
                            <div className="relative group">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all dark:text-white placeholder:text-slate-400"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 flex bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg relative overflow-hidden">
                                    {['All', 'Open', 'Active', 'Done'].map(st => {
                                        const isActive = statusFilter === (st === 'Active' ? 'In Progress' : (st === 'Done' ? 'Resolved' : st));
                                        const actualStatus = st === 'Active' ? 'In Progress' : (st === 'Done' ? 'Resolved' : st);

                                        return (
                                            <button
                                                key={st}
                                                onClick={() => setStatusFilter(actualStatus)}
                                                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all duration-300 relative z-10 ${isActive ? 'text-indigo-600 dark:text-indigo-400 shadow-sm bg-white dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                {st}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={handleExportExcel} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all" title="Export Excel"><FileSpreadsheet size={16} strokeWidth={2} /></button>
                                    <button onClick={resetFilters} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30 rounded-lg transition-all" title="Reset"><RotateCcw size={16} strokeWidth={2} /></button>
                                    <button onClick={fetchTickets} className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 rounded-lg transition-all" title="Refresh"><RefreshCcw size={16} strokeWidth={2} className={isLoading ? 'animate-spin' : ''} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="p-10 text-center flex flex-col items-center gap-2"><Loader2 size={24} className="animate-spin text-blue-500" /><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Scanning...</p></div>
                            ) : paginatedTickets.length === 0 ? (
                                <div className="p-10 text-center text-slate-300 dark:text-slate-600 font-bold text-[8px] tracking-widest italic uppercase">No entries.</div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {paginatedTickets.map(ticket => {
                                        const isSelected = selectedTicket?.id === ticket.id;
                                        const statusColors: any = {
                                            'Open': 'bg-rose-500 shadow-rose-500/20',
                                            'Resolved': 'bg-emerald-500 shadow-emerald-500/20',
                                            'In Progress': 'bg-blue-500 shadow-blue-500/20',
                                            'Pending': 'bg-amber-500 shadow-amber-500/20'
                                        };
                                        const dotColor = statusColors[ticket.status] || 'bg-slate-400';

                                        const priorityColors: any = {
                                            'Critical': 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
                                            'High': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
                                            'Medium': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                                            'Low': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        };

                                        return (
                                            <div
                                                key={ticket.id}
                                                onClick={() => setSelectedTicket(ticket)}
                                                className={`
                                                p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer group relative border
                                                ${isSelected
                                                        ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50 shadow-sm'
                                                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-100 dark:hover:border-slate-800'}
                                            `}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                                    <div className={`w-2 h-2 rounded-full ${dotColor} shadow-lg shrink-0`} />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className={`text-[9px] font-bold font-mono tracking-tight ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{ticket.ticketId}</span>
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight ${priorityColors[ticket.priority] || priorityColors.Medium}`}>
                                                                    {ticket.priority}
                                                                </span>
                                                            </div>
                                                            <h4 className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                {ticket.subject}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide leading-none">
                                                            <span className="truncate max-w-[80px]">{ticket.requesterName.split(' ')[0]}</span>
                                                            <span className="opacity-30">•</span>
                                                            <span className="truncate">{ticket.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <span className={`text-[9px] font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                        {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {ticket.assignedTo && (
                                                        <div className="flex items-center -space-x-1" title={`Assigned to ${ticket.assignedTo}`}>
                                                            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-indigo-600 dark:text-indigo-300">
                                                                {ticket.assignedTo.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                                            </div>
                                                        </div>
                                                    )}
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
                            </div>
                        </div>
                    </div>


                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">



                        {/* SHARED MOBILE DETAIL HEADER - ONLY FOR IT STAFF */}
                        {
                            isITStaff && selectedTicket && (
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
                                </div>
                            )}

                        {/* CENTER COLUMN */}
                        <div className={`flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-500 ${!selectedTicket ? 'hidden lg:flex' : (detailTab === 'chat' ? 'flex' : 'hidden lg:flex')}`}>
                            {selectedTicket ? (
                                <>
                                    {/* Chat Header - Only show full version on Desktop */}
                                    {/* Chat Header - Modern Minimalist */}
                                    <div className="p-3 border-b border-slate-50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hidden lg:flex items-center justify-between shrink-0 z-10 sticky top-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                                                <MessageSquare size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{selectedTicket.subject}</h3>
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                                                    <span className="font-mono text-indigo-500">#{selectedTicket.ticketId}</span>
                                                    <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                                                    <span>{selectedTicket.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-rose-500">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20 p-6 space-y-6">
                                        <div className="space-y-6 max-w-3xl mx-auto">
                                            <div className="flex flex-col gap-2 items-center w-full my-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-sm text-slate-600 dark:text-slate-300 leading-relaxed shadow-sm relative group/report max-w-[90%] text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-2 opacity-70">
                                                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                                        <p className="text-[9px] font-bold uppercase tracking-widest">Initial System Report</p>
                                                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                                    </div>
                                                    <div className="font-medium whitespace-pre-wrap text-xs text-left">
                                                        <RichContentRenderer text={selectedTicket.description} />
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence mode="popLayout">
                                                {messages.map((msg, idx) => {
                                                    const isSelf = msg.sender_role === 'IT';
                                                    const isInternalMsg = msg.is_internal;

                                                    // High security: do not render if internal and user is not staff
                                                    if (isInternalMsg && !isITStaff) return null;

                                                    return (
                                                        <div key={idx} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-2`}>
                                                            <div className={`p-3.5 px-5 max-w-[85%] text-sm leading-relaxed shadow-sm relative group ${isInternalMsg ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 rounded-[20px]' : (!isSelf ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-[20px] rounded-bl-sm border border-slate-100 dark:border-slate-700' : 'bg-indigo-600 text-white rounded-[20px] rounded-br-sm shadow-indigo-500/20')}`}>
                                                                <div className={`flex items-center gap-2 mb-1.5 opacity-70 text-[10px] font-semibold uppercase tracking-wide ${isSelf ? 'justify-end' : ''}`}>
                                                                    {isInternalMsg && (
                                                                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-800/50 px-1.5 py-0.5 rounded mr-1">
                                                                            <Shield size={10} /> Internal
                                                                        </span>
                                                                    )}
                                                                    <span>{msg.sender_name}</span>
                                                                    <span>•</span>
                                                                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>                                       {(() => {
                                                                    const imageMatch = msg.message.match(/!\[image\]\((.*?)\)/);
                                                                    const fileMatch = msg.message.match(/\[Attached (File|PDF)\]\((.*?)\)/);

                                                                    if (imageMatch) {
                                                                        const imageUrl = imageMatch[1];
                                                                        return (
                                                                            <div
                                                                                onClick={() => setPreviewImage(imageUrl)}
                                                                                className="block cursor-zoom-in group/img relative overflow-hidden rounded-lg border border-white/10 mt-2"
                                                                            >
                                                                                <img
                                                                                    src={imageUrl}
                                                                                    alt="Attachment"
                                                                                    className="max-w-full max-h-[300px] object-contain hover:scale-105 transition-transform duration-500 bg-black/20"
                                                                                    loading="lazy"
                                                                                />
                                                                            </div>
                                                                        );
                                                                    }

                                                                    if (fileMatch) {
                                                                        const fileUrl = fileMatch[2];
                                                                        const isPdf = fileMatch[1] === 'PDF';

                                                                        if (isPdf) {
                                                                            return (
                                                                                <div
                                                                                    onClick={() => setPreviewImage(fileUrl)}
                                                                                    className={`flex items-center gap-3 p-3 rounded-lg mt-2 transition-colors cursor-pointer ${!isSelf ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                                                                >
                                                                                    <div className={`p-2 rounded-lg ${!isSelf ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white'}`}>
                                                                                        <FileText size={20} />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0 text-left">
                                                                                        <p className={`text-xs font-bold truncate ${!isSelf ? 'text-slate-700 dark:text-slate-300' : 'text-white'}`}>Attached PDF</p>
                                                                                        <p className={`text-[10px] truncate ${!isSelf ? 'text-slate-500' : 'text-white/80'}`}>Click to preview</p>
                                                                                    </div>
                                                                                    <ExternalLink size={14} className={!isSelf ? 'text-slate-400' : 'text-white/80'} />
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <a
                                                                                href={fileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={`flex items-center gap-3 p-3 rounded-lg mt-2 transition-colors ${!isSelf ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                                                            >
                                                                                <div className={`p-2 rounded-lg ${!isSelf ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white'}`}>
                                                                                    <FileText size={20} />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0 text-left">
                                                                                    <p className={`text-xs font-bold truncate ${!isSelf ? 'text-slate-700 dark:text-slate-300' : 'text-white'}`}>Attached Document</p>
                                                                                    <p className={`text-[10px] truncate ${!isSelf ? 'text-slate-500' : 'text-white/80'}`}>Click to view</p>
                                                                                </div>
                                                                                <ExternalLink size={14} className={!isSelf ? 'text-slate-400' : 'text-white/80'} />
                                                                            </a>
                                                                        );
                                                                    }

                                                                    return <EmojiRenderer text={msg.message} />;
                                                                })()}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                        {!isSolved ? (
                                            <div className="max-w-4xl mx-auto">
                                                <div className="flex items-end gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 transition-shadow focus-within:ring-2 ring-indigo-500/10">
                                                    {/* Upload Trigger */}
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isUploading}
                                                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-200 transition-all shrink-0"
                                                        title="Attach File"
                                                    >
                                                        {isUploading ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Paperclip size={20} />}
                                                    </button>

                                                    {isITStaff && (
                                                        <button
                                                            onClick={() => setIsInternal(!isInternal)}
                                                            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all shrink-0 ${isInternal ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                                            title={isInternal ? "Switch to Public Reply" : "Switch to Internal Note"}
                                                        >
                                                            <Shield size={18} />
                                                        </button>
                                                    )}

                                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileUpload} />

                                                    {/* Input Area */}
                                                    <div className="flex-1 min-h-[44px] flex items-center">
                                                        <textarea
                                                            rows={1}
                                                            className="w-full bg-transparent border-none text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white resize-none max-h-32 py-3 px-2"
                                                            placeholder={isInternal ? "Type a private internal note..." : `Message to ${selectedTicket.requesterName.split(' ')[0]}...`}
                                                            value={resolutionNote}
                                                            onChange={e => {
                                                                setResolutionNote(e.target.value);
                                                                e.target.style.height = 'auto';
                                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                                            }}
                                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                                            onPaste={handlePaste}
                                                        />
                                                    </div>

                                                    {/* Emoji Picker / Send Group */}
                                                    <div className="flex items-center gap-2 pb-0.5">
                                                        <div className="relative shrink-0 flex items-center">
                                                            <button
                                                                ref={emojiTriggerRef}
                                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                className={`w-9 h-9 flex items-center justify-center transition-all rounded-lg ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50'}`}
                                                                title="Add Emoji"
                                                            >
                                                                <Smile size={20} />
                                                            </button>
                                                            <AnimatePresence>
                                                                {showEmojiPicker && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                        className="absolute bottom-full right-0 mb-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-[100] w-[300px] overflow-hidden"
                                                                    >
                                                                        {/* Emoji Picker Content (Simplified for brevity) */}
                                                                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                                                            <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                                                                {EMOJI_CATEGORIES.map((cat, idx) => (
                                                                                    <button
                                                                                        key={cat.name}
                                                                                        onClick={() => setActiveEmojiCategory(idx)}
                                                                                        className={`p-1.5 rounded-lg transition-all shrink-0 ${activeEmojiCategory === idx ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                                                    >
                                                                                        {cat.icon}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-2 grid grid-cols-7 gap-1 h-[200px] overflow-y-auto custom-scrollbar">
                                                                            {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map(emoji => (
                                                                                <button
                                                                                    key={emoji}
                                                                                    onClick={() => addEmoji(emoji)}
                                                                                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-lg"
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
                                                            className={`h-10 px-4 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm ${isInternal ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                                        >
                                                            <span>{isInternal ? 'Post Note' : 'Send'}</span>
                                                            {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : (isInternal ? <Shield size={14} /> : <Send size={14} />)}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-xl mx-auto py-2">
                                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-xl flex flex-col items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                                        <span className="text-xs font-black uppercase tracking-widest">Incident Resolved</span>
                                                    </div>
                                                    {selectedTicket.resolvedAt && (
                                                        <p className="text-[10px] font-bold opacity-60">
                                                            {new Date(selectedTicket.resolvedAt).toLocaleDateString([], { month: 'long', day: 'numeric' })} at {new Date(selectedTicket.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                                        <MessageSquare size={24} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select a ticket to start</p>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Ticket Info & Actions - ONLY FOR IT STAFF */}
                        {selectedTicket && (
                            <div className={`w-full lg:w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500 shrink-0 ${detailTab !== 'info' ? 'hidden lg:flex' : 'flex'}`}>
                                <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                                        <User size={32} />
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{selectedTicket.requesterName}</h4>
                                    <p className="text-xs font-medium text-slate-400">{selectedTicket.requesterEmail}</p>
                                    {selectedTicket.requesterPhone && <p className="text-xs text-slate-400 mt-1">{selectedTicket.requesterPhone}</p>}
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar bg-white dark:bg-slate-900">
                                    {isITStaff && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Department</p>
                                                <div className="px-1 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                    <Building2 size={16} className="text-slate-400" />
                                                    {selectedTicket.department}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Created On</p>
                                                <div className="px-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {new Date(selectedTicket.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>

                                            {selectedTicket.resolvedAt && (
                                                <>
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Resolved On</p>
                                                        <div className="px-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                                            {new Date(selectedTicket.resolvedAt).toLocaleDateString([], { month: 'long', day: 'numeric' })}
                                                            <span className="ml-2 opacity-60 font-medium text-xs">at {new Date(selectedTicket.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                    {/* Calculation of Duration */}
                                                    {(() => {
                                                        const start = new Date(selectedTicket.createdAt).getTime();
                                                        const end = new Date(selectedTicket.resolvedAt).getTime();
                                                        const diff = end - start;
                                                        const hours = Math.floor(diff / (1000 * 60 * 60));
                                                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                        const days = Math.floor(hours / 24);

                                                        let durationText = "";
                                                        if (days > 0) durationText = `${days}d ${hours % 24}h`;
                                                        else if (hours > 0) durationText = `${hours}h ${minutes}m`;
                                                        else durationText = `${minutes}m`;

                                                        return (
                                                            <div className="flex flex-col gap-1 bg-emerald-50/50 dark:bg-emerald-900/10 p-2 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">
                                                                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest pl-1">Time to Solve</p>
                                                                <div className="px-1 text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                                                    <Clock size={12} />
                                                                    {durationText}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            )}

                                            {(selectedTicket.rating || selectedTicket.feedback) && (
                                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest pl-1 mb-2">User Experience</p>
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                        {selectedTicket.rating && (
                                                            <div className="flex gap-1 mb-2">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star
                                                                        key={star}
                                                                        size={12}
                                                                        className={`${selectedTicket.rating! >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {selectedTicket.feedback && (
                                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                                                "{selectedTicket.feedback}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isSolved ? (
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Actions</h4>
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        disabled={isActionLoading || !isOwner}
                                                        onClick={() => handleUpdateStatus(selectedTicket.id, 'In Progress')}
                                                        className={`h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${selectedTicket.status === 'In Progress' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600'}`}
                                                    >
                                                        Process
                                                    </button>
                                                    <button
                                                        disabled={isActionLoading || !isOwner}
                                                        onClick={() => handleUpdateStatus(selectedTicket.id, 'Pending')}
                                                        className={`h-9 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border ${selectedTicket.status === 'Pending' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600'}`}
                                                    >
                                                        Hold
                                                    </button>
                                                </div>
                                                <button
                                                    disabled={isActionLoading || !isOwner}
                                                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                                                    className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                >
                                                    <CheckCircle2 size={16} /> Mark Resolved
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/50 text-center">
                                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">Resolved</p>
                                                <p className="text-[10px] text-slate-500 italic">Ticket finalized</p>
                                            </div>
                                            <button
                                                onClick={handleConvertToActivity}
                                                disabled={isActionLoading}
                                                className="w-full h-10 bg-white dark:bg-slate-800 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2"
                                            >
                                                {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
                                                Log to Assets
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-1 -mx-8 -mt-8 bg-slate-50/50 dark:bg-slate-950/50">
                        <div className="max-w-7xl mx-auto p-8 pt-12">
                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Helpdesk Center</h1>
                                <p className="text-slate-500 font-medium">Submit a request or track your existing tickets.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* LEFT COLUMN: Submit Ticket Form */}
                                <div className="lg:col-span-2 space-y-8">
                                    <AnimatePresence mode="wait">
                                        {selectedTicket ? (
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
                                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900 sticky top-0 z-10">
                                                    <button onClick={() => setSelectedTicket(null)} className="p-2 -ml-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"><ArrowLeft size={18} /></button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-xs font-bold text-indigo-600 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">#{selectedTicket.ticketId}</span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${selectedTicket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{selectedTicket.status}</span>
                                                        </div>
                                                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{selectedTicket.subject}</h3>
                                                    </div>
                                                </div>

                                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
                                                    <div className="max-w-3xl mx-auto space-y-6">
                                                        {/* Ticket Description */}
                                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Description</div>
                                                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                                <RichContentRenderer text={selectedTicket.description} />
                                                            </div>
                                                        </div>

                                                        {/* Chat Messages */}
                                                        <div className="space-y-6 pb-6">
                                                            {messages.map((msg, i) => {
                                                                const isInternalMsg = msg.is_internal;
                                                                if (isInternalMsg && !isITStaff) return null;

                                                                const isSelf = (isITStaff && msg.sender_role === 'IT') || (!isITStaff && msg.sender_role !== 'IT');
                                                                return (
                                                                    <div key={i} className={`flex ${!isSelf ? 'justify-start' : 'justify-end'}`}>
                                                                        <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${isInternalMsg ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200' : (!isSelf ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300' : 'bg-indigo-600 text-white')}`}>
                                                                            <div className="flex items-center gap-2 mb-1.5 opacity-70 text-[10px] font-semibold uppercase tracking-wide">
                                                                                {isInternalMsg && (
                                                                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-800/50 px-1.5 py-0.5 rounded">
                                                                                        <Shield size={10} /> Private Note
                                                                                    </span>
                                                                                )}
                                                                                <span>{msg.sender_name}</span>
                                                                                <span>•</span>
                                                                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                            </div>
                                                                            {(() => {
                                                                                const imageMatch = msg.message.match(/!\[image\]\((.*?)\)/);
                                                                                const fileMatch = msg.message.match(/\[Attached (File|PDF)\]\((.*?)\)/);

                                                                                if (imageMatch) {
                                                                                    const imageUrl = imageMatch[1];
                                                                                    return (
                                                                                        <div
                                                                                            onClick={() => setPreviewImage(imageUrl)}
                                                                                            className="block cursor-zoom-in group/img relative overflow-hidden rounded-lg border border-white/10 mt-2"
                                                                                        >
                                                                                            <img
                                                                                                src={imageUrl}
                                                                                                alt="Attachment"
                                                                                                className="max-w-full max-h-[300px] object-contain hover:scale-105 transition-transform duration-500 bg-black/20"
                                                                                                loading="lazy"
                                                                                            />
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if (fileMatch) {
                                                                                    const fileUrl = fileMatch[2];
                                                                                    const isPdf = fileMatch[1] === 'PDF';

                                                                                    if (isPdf) {
                                                                                        return (
                                                                                            <div
                                                                                                onClick={() => setPreviewImage(fileUrl)}
                                                                                                className={`flex items-center gap-3 p-3 rounded-lg mt-2 transition-colors cursor-pointer ${!isSelf ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                                                                            >
                                                                                                <div className={`p-2 rounded-lg ${!isSelf ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white'}`}>
                                                                                                    <FileText size={20} />
                                                                                                </div>
                                                                                                <div className="flex-1 min-w-0 text-left">
                                                                                                    <p className={`text-xs font-bold truncate ${!isSelf ? 'text-slate-700 dark:text-slate-300' : 'text-white'}`}>Attached PDF</p>
                                                                                                    <p className={`text-[10px] truncate ${!isSelf ? 'text-slate-500' : 'text-white/80'}`}>Click to preview</p>
                                                                                                </div>
                                                                                                <ExternalLink size={14} className={!isSelf ? 'text-slate-400' : 'text-white/80'} />
                                                                                            </div>
                                                                                        );
                                                                                    }

                                                                                    return (
                                                                                        <a
                                                                                            href={fileUrl}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className={`flex items-center gap-3 p-3 rounded-lg mt-2 transition-colors ${!isSelf ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                                                                        >
                                                                                            <div className={`p-2 rounded-lg ${!isSelf ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20 text-white'}`}>
                                                                                                <FileText size={20} />
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0 text-left">
                                                                                                <p className={`text-xs font-bold truncate ${!isSelf ? 'text-slate-700 dark:text-slate-300' : 'text-white'}`}>Attached Document</p>
                                                                                                <p className={`text-[10px] truncate ${!isSelf ? 'text-slate-500' : 'text-white/80'}`}>Click to view</p>
                                                                                            </div>
                                                                                            <ExternalLink size={14} className={!isSelf ? 'text-slate-400' : 'text-white/80'} />
                                                                                        </a>
                                                                                    );
                                                                                }

                                                                                return <EmojiRenderer text={msg.message} />;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            <div ref={messagesEndRef} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Feedback / Reply Input */}
                                                {(selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed') ? (
                                                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                        <div className="max-w-2xl mx-auto text-center space-y-4">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                                                                    <CheckCircle2 size={24} />
                                                                </div>
                                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ticket Resolved</h3>
                                                                {selectedTicket.resolvedAt && (
                                                                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full mb-1">
                                                                        Resolved on {new Date(selectedTicket.resolvedAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(selectedTicket.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                )}
                                                                <p className="text-slate-500 text-sm">How was your experience with our support?</p>
                                                            </div>

                                                            {selectedTicket.rating || !isRequester ? (
                                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                                                                    <div className="flex gap-2 justify-center mb-4">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <Star
                                                                                key={star}
                                                                                size={24}
                                                                                className={`${(selectedTicket.rating || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    {selectedTicket.feedback ? (
                                                                        <p className="text-slate-700 dark:text-slate-300 italic">"{selectedTicket.feedback}"</p>
                                                                    ) : (
                                                                        <p className="text-slate-400 text-xs italic">No additional comments provided.</p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                                                                    <div className="flex gap-2 justify-center">
                                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                                            <button
                                                                                key={star}
                                                                                onClick={() => setFeedbackRating(star)}
                                                                                className="transition-transform hover:scale-110 focus:outline-none"
                                                                            >
                                                                                <Star
                                                                                    size={32}
                                                                                    className={`${feedbackRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-200'}`}
                                                                                />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <textarea
                                                                        className="w-full h-24 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                                                                        placeholder="Share your experience (optional)..."
                                                                        value={feedbackComment}
                                                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                                                    />
                                                                    <button
                                                                        onClick={handleSubmitFeedback}
                                                                        disabled={isActionLoading || feedbackRating === 0}
                                                                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        {isActionLoading ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                                                                        Submit Feedback
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                        <div className="flex items-end gap-3 max-w-4xl mx-auto">
                                                            <button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploading}
                                                                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-200 transition-all shrink-0"
                                                                title="Attach File"
                                                            >
                                                                {isUploading ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Paperclip size={20} />}
                                                            </button>
                                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileUpload} />

                                                            {/* Input Area */}
                                                            <div className="flex-1 min-h-[40px] flex items-center pt-1">
                                                                <textarea
                                                                    rows={1}
                                                                    className="w-full bg-transparent border-none text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white resize-none max-h-32 py-2"
                                                                    placeholder="Type a reply..."
                                                                    value={resolutionNote}
                                                                    onChange={e => {
                                                                        setResolutionNote(e.target.value);
                                                                        e.target.style.height = 'auto';
                                                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                                                    }}
                                                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                                                    onPaste={handlePaste}
                                                                />
                                                            </div>

                                                            {/* Emoji Picker / Send Group */}
                                                            <div className="flex items-center gap-2 pb-0.5">
                                                                <div className="relative shrink-0 flex items-center">
                                                                    <button
                                                                        ref={emojiTriggerRef}
                                                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                        className={`w-9 h-9 flex items-center justify-center transition-all rounded-lg ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50'}`}
                                                                        title="Add Emoji"
                                                                    >
                                                                        <Smile size={20} />
                                                                    </button>
                                                                    <AnimatePresence>
                                                                        {showEmojiPicker && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                                className="absolute bottom-full right-0 mb-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-[100] w-[300px] overflow-hidden"
                                                                            >
                                                                                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                                                                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                                                                        {EMOJI_CATEGORIES.map((cat, idx) => (
                                                                                            <button
                                                                                                key={cat.name}
                                                                                                onClick={() => setActiveEmojiCategory(idx)}
                                                                                                className={`p-1.5 rounded-lg transition-all shrink-0 ${activeEmojiCategory === idx ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                                                            >
                                                                                                {cat.icon}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="p-2 grid grid-cols-7 gap-1 h-[200px] overflow-y-auto custom-scrollbar">
                                                                                    {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map(emoji => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            onClick={() => addEmoji(emoji)}
                                                                                            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-lg"
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
                                                                    className="h-10 px-4 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-sm"
                                                                >
                                                                    <span>Send</span>
                                                                    {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : viewMode === 'archive' ? (
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px] animate-in slide-in-from-bottom-4 duration-500">
                                                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                                                    <div>
                                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ticket Archive</h2>
                                                        <p className="text-xs text-slate-500 font-medium">Browse all your previous support requests</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setViewMode('list')}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                                                    >
                                                        <PlusCircle size={14} />
                                                        Submit New
                                                    </button>
                                                </div>

                                                <div className="overflow-x-auto flex-1">
                                                    {tickets.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-24 text-center">
                                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                                                <Inbox size={32} />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-400">No tickets found in your history.</p>
                                                        </div>
                                                    ) : (
                                                        <table className="w-full text-left border-separate border-spacing-0">
                                                            <thead>
                                                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 z-10">
                                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Reference</th>
                                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Subject</th>
                                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Status</th>
                                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">Date</th>
                                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 text-right">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                {(() => {
                                                                    const startIdx = (archivePage - 1) * ARCHIVE_PER_PAGE;
                                                                    const pageTickets = tickets.slice(startIdx, startIdx + ARCHIVE_PER_PAGE);

                                                                    return pageTickets.map((t) => (
                                                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                                                            <td className="px-6 py-4">
                                                                                <span className="text-[11px] font-bold text-indigo-600 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">#{t.ticketId}</span>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <div className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{t.subject}</div>
                                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.department}</div>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'Resolved' ? 'bg-emerald-500' :
                                                                                        t.status === 'Open' ? 'bg-blue-500' :
                                                                                            t.status === 'Pending' ? 'bg-amber-500' : 'bg-indigo-500'
                                                                                        }`} />
                                                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${t.status === 'Resolved' ? 'text-emerald-600' :
                                                                                        t.status === 'Open' ? 'text-blue-600' :
                                                                                            'text-slate-500'
                                                                                        }`}>{t.status}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-4">
                                                                                <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">{new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                                            </td>
                                                                            <td className="px-6 py-4 text-right">
                                                                                <button
                                                                                    onClick={() => setSelectedTicket(t)}
                                                                                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 text-slate-400 rounded-xl transition-all shadow-sm active:scale-90"
                                                                                >
                                                                                    <ArrowRight size={16} />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ));
                                                                })()}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>

                                                {/* Archive Pagination */}
                                                {tickets.length > ARCHIVE_PER_PAGE && (
                                                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Showing {Math.min(tickets.length, (archivePage - 1) * ARCHIVE_PER_PAGE + 1)}-{Math.min(tickets.length, archivePage * ARCHIVE_PER_PAGE)} of {tickets.length}
                                                        </p>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                disabled={archivePage === 1}
                                                                onClick={() => setArchivePage(prev => prev - 1)}
                                                                className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                                            >
                                                                <ChevronLeft size={16} />
                                                            </button>
                                                            {(() => {
                                                                const totalPages = Math.ceil(tickets.length / ARCHIVE_PER_PAGE);
                                                                return Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                                    <button
                                                                        key={p}
                                                                        onClick={() => setArchivePage(p)}
                                                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${archivePage === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600'}`}
                                                                    >
                                                                        {p}
                                                                    </button>
                                                                ));
                                                            })()}
                                                            <button
                                                                disabled={archivePage >= Math.ceil(tickets.length / ARCHIVE_PER_PAGE)}
                                                                onClick={() => setArchivePage(prev => prev + 1)}
                                                                className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                                            >
                                                                <ChevronRight size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : viewMode === 'success' ? (
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto mt-12">
                                                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500"><CheckCircle2 size={40} /></div>
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Request Submitted!</h2>
                                                <p className="text-slate-500 text-sm mb-8 font-medium">Your ticket has been successfully created. Our support team will review it shortly.</p>

                                                <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-4 rounded-xl border border-slate-100 dark:border-slate-800 inline-block mb-8">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ticket Reference</div>
                                                    <span className="text-2xl font-black text-indigo-600 font-mono tracking-tight">#{lastCreatedTicketId}</span>
                                                </div>

                                                <div>
                                                    <button onClick={() => setViewMode('list')} className="w-full h-12 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-lg active:scale-95">Return to Dashboard</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Submit a Support Ticket</h2>
                                                <p className="text-slate-500 text-sm mb-8">Fill out the details below and our team will get back to you.</p>

                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                                                            <input
                                                                type="text"
                                                                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm placeholder:text-slate-400"
                                                                placeholder="Briefly describe the issue"
                                                                value={newTicketData.subject}
                                                                onChange={e => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Category</label>
                                                            <div className="relative">
                                                                <select
                                                                    className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm appearance-none cursor-pointer"
                                                                    value={newTicketData.department || 'General Inquiry'}
                                                                    onChange={e => setNewTicketData({ ...newTicketData, department: e.target.value })}
                                                                >
                                                                    <option value="General Inquiry">General Inquiry</option>
                                                                    <option value="Technical Support">Technical Support</option>
                                                                    <option value="Hardware Issue">Hardware Issue</option>
                                                                    <option value="Network Access">Network Access</option>
                                                                    <option value="Software License">Software License</option>
                                                                </select>
                                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Detailed Description</label>
                                                        <textarea
                                                            className="w-full min-h-[150px] p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm placeholder:text-slate-400 resize-none leading-relaxed"
                                                            placeholder="Please provide as much detail as possible..."
                                                            value={newTicketData.description}
                                                            onChange={e => setNewTicketData({ ...newTicketData, description: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Attachments (Optional)</label>
                                                        <div
                                                            onClick={() => newTicketFileInputRef.current?.click()}
                                                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-all group"
                                                        >
                                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all mb-3 relative">
                                                                {isUploading ? (
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <svg className="w-full h-full transform -rotate-90">
                                                                            <circle
                                                                                cx="24" cy="24" r="20"
                                                                                stroke="currentColor"
                                                                                strokeWidth="3"
                                                                                fill="transparent"
                                                                                className="text-slate-200 dark:text-slate-700"
                                                                            />
                                                                            <circle
                                                                                cx="24" cy="24" r="20"
                                                                                stroke="currentColor"
                                                                                strokeWidth="3"
                                                                                fill="transparent"
                                                                                strokeDasharray={125.6}
                                                                                strokeDashoffset={125.6 - (125.6 * uploadProgress) / 100}
                                                                                className="text-indigo-500 transition-all duration-300"
                                                                            />
                                                                        </svg>
                                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 absolute">{uploadProgress}%</span>
                                                                    </div>
                                                                ) : <CloudUpload size={24} />}
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Click to upload or drag and drop</p>
                                                            <p className="text-xs text-slate-400 mt-1">Images, PDF or Documents (max. 10MB)</p>
                                                            <input
                                                                type="file"
                                                                ref={newTicketFileInputRef}
                                                                onChange={handleNewTicketFileUpload}
                                                                className="hidden"
                                                                accept="*/*"
                                                            />
                                                        </div>

                                                        {newTicketData.attachments.length > 0 && (
                                                            <div className="flex flex-wrap gap-3 mt-4">
                                                                {newTicketData.attachments.map((url, idx) => {
                                                                    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);
                                                                    return (
                                                                        <div key={idx} className="relative group w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                                                                            {isImage ? (
                                                                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                                                    <FileText size={20} />
                                                                                    <span className="text-[8px] font-bold mt-1">FILE</span>
                                                                                </div>
                                                                            )}
                                                                            <button
                                                                                onClick={() => setNewTicketData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                                                                                className="absolute top-1 right-1 p-1 bg-slate-900/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-4 flex items-center justify-end gap-3">
                                                        <button onClick={() => setNewTicketData({ subject: '', description: '', priority: 'Medium', attachments: [], department: 'General Inquiry' })} className="px-6 h-12 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">Cancel</button>
                                                        <button
                                                            onClick={handleCreateTicket}
                                                            disabled={isActionLoading || !newTicketData.subject || !newTicketData.description}
                                                            className="px-8 h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                                        >
                                                            {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Ticket'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* RIGHT COLUMN: Sidebar */}
                                <div className="space-y-6">
                                    {/* Recent Tickets Card */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Recent Tickets</h3>
                                            <button onClick={fetchTickets} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-blue-600">
                                                <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                                            </button>
                                        </div>

                                        {/* Mini Tabs */}
                                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                                            {(['Active', 'Resolved'] as const).map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={() => setRecentFilter(tab)}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${recentFilter === tab ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                >
                                                    {tab}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="max-h-[420px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                            {(() => {
                                                const filtered = tickets.filter(t =>
                                                    recentFilter === 'Resolved' ? (t.status === 'Resolved' || t.status === 'Closed') : (t.status !== 'Resolved' && t.status !== 'Closed')
                                                );

                                                if (filtered.length === 0) {
                                                    return <div className="text-center py-12">
                                                        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300">
                                                            <Inbox size={20} />
                                                        </div>
                                                        <p className="text-[10px] font-medium text-slate-400">No {recentFilter.toLowerCase()} tickets</p>
                                                    </div>;
                                                }

                                                return filtered.map((ticket) => (
                                                    <div
                                                        key={ticket.id}
                                                        onClick={() => setSelectedTicket(ticket)}
                                                        className="group cursor-pointer p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-black text-slate-400 font-mono">#{ticket.ticketId}</span>
                                                            <div className={`w-2 h-2 rounded-full ${ticket.status === 'Resolved' ? 'bg-emerald-500' :
                                                                ticket.status === 'Open' ? 'bg-blue-500' :
                                                                    ticket.status === 'Pending' ? 'bg-amber-500' : 'bg-indigo-500'
                                                                }`} />
                                                        </div>
                                                        <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">{ticket.subject}</h4>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(ticket.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Open Ticket</span>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                            <button
                                                onClick={() => setViewMode('archive')}
                                                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                                            >
                                                View All Archive
                                            </button>
                                        </div>
                                    </div>

                                    {/* Operational Hours Card */}
                                    <div className="bg-indigo-50 dark:bg-slate-800/50 rounded-2xl border border-indigo-100 dark:border-slate-700 p-6">
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Operational Hours</h3>
                                        <div className="space-y-3">
                                            {[
                                                {
                                                    label: '08.00 - 17:00',
                                                    icon: Clock,
                                                    title: 'Jam Operasional IT',
                                                    detail: 'Layanan Helpdesk tersedia setiap hari kerja (Senin - Jumat) dari pukul 08.00 hingga 17.00 WIB. Permintaan di luar jam operasional akan diproses pada hari kerja berikutnya.'
                                                },
                                                {
                                                    label: 'Ext Call 196',
                                                    icon: Phone,
                                                    title: 'Panggilan Ekstensi IT',
                                                    detail: 'Untuk bantuan teknis segera di area kantor, silakan hubungi ekstensi 196. Kami siap membantu menangani masalah perangkat keras, jaringan, dan aplikasi internal Anda.'
                                                }
                                            ].map((item, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setInfoModal({ title: item.title, content: item.detail })}
                                                    className="flex items-center gap-4 w-full p-3 text-left bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                        <item.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.label}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Click for details</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div >
                    </div >

                    {/* Info Modal */}
                    <AnimatePresence>
                        {
                            infoModal && (
                                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full relative"
                                    >
                                        <button
                                            onClick={() => setInfoModal(null)}
                                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                                        >
                                            <X size={20} />
                                        </button>

                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                                                <Info size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Information Guide</h3>
                                                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{infoModal.title}</h2>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                {infoModal.content}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setInfoModal(null)}
                                            className="w-full mt-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 dark:shadow-white/5"
                                        >
                                            Understood
                                        </button>
                                    </motion.div>
                                </div>
                            )
                        }
                    </AnimatePresence >

                    {/* Image Preview Modal (Keep existing logic) */}

                </>
            )}

            {/* Image Preview Modal (Now available for both views) */}
            {previewImage && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
                    <button className="absolute top-8 right-24 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all" onClick={(e) => { e.stopPropagation(); if (previewImage) handleDownloadImage(previewImage); }} title="Download"><Download size={24} /></button>
                    <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all" onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}><X size={24} /></button>
                    <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        {previewImage.toLowerCase().includes('.pdf') ? (
                            <div className="w-full h-full max-w-5xl relative flex flex-col items-center justify-center">
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewImage)}&embedded=true`}
                                    className="w-full h-full bg-white rounded-2xl shadow-2xl"
                                    title="PDF Preview"
                                />
                                <div className="absolute bottom-4 right-4 animate-pulse">
                                    <a
                                        href={previewImage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase rounded-lg border border-white/10 hover:bg-slate-800 transition-all"
                                    >
                                        <ExternalLink size={12} /> Open Original PDF
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
                        )}
                    </div>
                </div>
            )}

            <DangerConfirmModal
                isOpen={isSolveConfirmOpen}
                onClose={() => setIsSolveConfirmOpen(false)}
                onConfirm={() => selectedTicket && executeStatusUpdate(selectedTicket.id, 'Resolved')}
                title="Mark as Resolved?"
                message="This will close the ticket and notify the requester. Please ensure the issue is completely resolved before proceeding."
                isLoading={isActionLoading}
            />
        </div>
    );
};
