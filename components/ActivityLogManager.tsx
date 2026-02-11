'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Filter, Plus, FileText, CheckCircle2, Clock,
    AlertTriangle, X, ChevronLeft, ChevronRight, MoreHorizontal,
    Download, Trash2, Edit, Eye, User, Calendar,
    Presentation, XCircle, Play, Maximize2, Minimize2,
    Zap, RefreshCcw, BarChart3, Sun, Moon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ActivityLog } from '../types';
import { ActivityFormModal } from './ActivityFormModal'; // Import form modal
import { UserAvatar } from './UserAvatar';
import { StatCard } from './StatCard';
import { exportToExcel } from '../lib/excelExport';
import { FileSpreadsheet } from 'lucide-react';

const ActivityDetailModal = ({ isOpen, onClose, activity }: { isOpen: boolean; onClose: () => void; activity: ActivityLog | null }) => {
    if (!isOpen || !activity) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
            case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
            case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Critical': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30';
            case 'Major': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
            default: return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border ${getTypeColor(activity.type)}`}>
                            <AlertTriangle size={12} />
                            {activity.type} Priority
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{activity.activityName}</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">{activity.category} • {activity.location}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Status & Timing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Current Status</p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border ${getStatusColor(activity.status)}`}>
                                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                {activity.status}
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Duration</p>
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                                <Clock size={16} className="text-blue-500" />
                                {activity.duration || '-'}
                            </div>
                        </div>
                    </div>

                    {/* Personnel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Requester</p>
                            <div className="flex items-center gap-3">
                                <UserAvatar name={activity.requester} url={activity.avatarUrl} size="md" />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.requester}</p>
                                    <p className="text-xs text-slate-500 font-medium">{activity.department}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">IT Engineer</p>
                            <div className="flex items-center gap-3">
                                <UserAvatar name={activity.itPersonnel} size="md" />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{activity.itPersonnel}</p>
                                    <p className="text-xs text-slate-500 font-medium">IT Support</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    {activity.remarks && (
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Technical Remarks</p>
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                "{activity.remarks}"
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Created</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                        {activity.completedAt && (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{new Date(activity.completedAt).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DangerConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 mb-6">{message}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                    <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2">
                        {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={16} />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};



export const ActivityLogManager = ({ currentUser }: { currentUser: any }) => {
    const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [deleteActivity, setDeleteActivity] = useState<ActivityLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    // RBAC Logic
    const isAdmin = currentUser?.role === 'Admin';
    const isStaff = currentUser?.role === 'Staff';
    const canManage = isAdmin || isStaff;
    const canDelete = isAdmin;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedData: ActivityLog[] = data.map((item: any) => ({
                    id: item.id,
                    activityName: item.activity_name,
                    category: item.category,
                    requester: item.requester,
                    department: item.department,
                    itPersonnel: item.it_personnel,
                    type: item.type,
                    status: item.status,
                    duration: item.duration,
                    remarks: item.remarks,
                    location: item.location,
                    createdAt: item.created_at,
                    completedAt: item.completed_at,
                    avatarUrl: item.avatar_url
                }));
                const sortedData = formattedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setActivities(sortedData);
            }

            // Fetch User Avatars
            const { data: userData } = await supabase
                .from('user_accounts')
                .select('username, full_name, avatar_url');

            if (userData) {
                const avatarMap: Record<string, string> = {};
                userData.forEach((u: any) => {
                    if (u.avatar_url) {
                        avatarMap[u.username] = u.avatar_url;
                        avatarMap[u.full_name] = u.avatar_url;
                    }
                });
                setUserAvatars(avatarMap);
            }

        } catch (error: any) {
            console.error('Error fetching activities:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchActivities();

        // Real-time subscription
        const subscription = supabase
            .channel('activity_logs_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
                fetchActivities();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);


    const [userList, setUserList] = useState<{ name: string; department: string; avatarUrl?: string }[]>([]);
    const [departmentList, setDepartmentList] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateFilterType, setDateFilterType] = useState('All');

    // Filter Logic
    const filteredActivities = activities.filter(activity => {
        const matchesSearch =
            activity.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.itPersonnel.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || activity.status === statusFilter;

        let matchesDate = true;
        if (startDate && endDate) {
            const activityDate = new Date(activity.createdAt).toISOString().split('T')[0];
            matchesDate = activityDate >= startDate && activityDate <= endDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleExportExcel = () => {
        if (filteredActivities.length === 0) return;

        const dataToExport = filteredActivities.map(act => ({
            "Activity Name": act.activityName,
            "Category": act.category,
            "Requester": act.requester,
            "Department": act.department,
            "IT Personnel": act.itPersonnel,
            "Priority": act.type,
            "Status": act.status,
            "Duration": act.duration || "-",
            "Location": act.location,
            "Remarks": act.remarks || "-",
            "Created At": act.createdAt ? new Date(act.createdAt).toLocaleString() : "-",
            "Completed At": act.completedAt ? new Date(act.completedAt).toLocaleString() : "-"
        }));

        exportToExcel(dataToExport, `GESIT-ACTIVITY-${new Date().toISOString().split('T')[0]}`);
    };

    // Presentation Mode State
    const [isPresenting, setIsPresenting] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const stats = useMemo(() => {
        const total = filteredActivities.length;
        const complete = filteredActivities.filter(a => a.status === 'Completed').length;
        const active = filteredActivities.filter(a => a.status === 'In Progress').length;
        const highAlerts = filteredActivities.filter(a => a.type === 'Critical' || a.type === 'Major').length;
        return { total, complete, active, highAlerts };
    }, [filteredActivities]);

    const nextSlide = () => {
        setCurrentSlideIndex(prev => (prev + 1) % filteredActivities.length);
    };

    const prevSlide = () => {
        setCurrentSlideIndex(prev => (prev - 1 + filteredActivities.length) % filteredActivities.length);
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data } = await supabase.from('departments').select('name').order('name');
            if (data) {
                setDepartmentList(data.map(d => d.name));
            }
        } catch (err) { console.warn("Fetch departments error", err); }
    };

    const fetchUsers = async () => {
        try {
            // Fetch FROM PHONE_EXTENSIONS instead of user_accounts
            const { data } = await supabase.from('phone_extensions').select('name, dept').order('name');
            if (data) {
                // Map phone extensions to user list format
                const uniqueUsers = new Map();
                data.forEach(ext => {
                    if (ext.name && !uniqueUsers.has(ext.name)) {
                        uniqueUsers.set(ext.name, {
                            name: ext.name,
                            department: ext.dept || '',
                            avatarUrl: undefined // Extensions don't have avatars
                        });
                    }
                });
                setUserList(Array.from(uniqueUsers.values()));
            }
        } catch (err) { console.warn("Fetch extensions error", err); }
    };



    useEffect(() => {
        fetchActivities();
        fetchUsers();
        fetchDepartments();
        setIsDarkTheme(document.documentElement.classList.contains('dark'));
    }, []);

    // Pagination
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const paginatedActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
            case 'In Progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
            case 'Pending': return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20';
            default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700';
        }
    };

    const handleDateFilterTypeChange = (type: string) => {
        setDateFilterType(type);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (type === 'All') {
            setStartDate('');
            setEndDate('');
        } else if (type === 'Today') {
            setStartDate(todayStr);
            setEndDate(todayStr);
        } else if (type === 'Week') {
            const firstDay = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
            const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // Saturday
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
        } else if (type === 'Month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
        } else if (type === 'Custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const renderSlideshowOverlay = () => {
        if (!isPresenting) return null;
        const currentActivity = filteredActivities[currentSlideIndex];

        // Theme Constants - Future Glass / Dark Mode Default for "Futuristic" feel
        // but respecting the toggle if user really wants light mode, though Glass looks best in dark.
        const isLight = !isDarkTheme;
        const themeBg = isLight ? 'bg-slate-100' : 'bg-[#0F172A]'; // Slate 900
        const cardBg = isLight ? 'bg-white/60' : 'bg-slate-900/40';
        const cardBorder = isLight ? 'border-white/40' : 'border-white/10';
        const textColor = isLight ? 'text-slate-800' : 'text-white';
        const subTextColor = isLight ? 'text-slate-500' : 'text-blue-200/60';

        return (
            <div className={`fixed inset-0 z-[5000] ${themeBg} flex flex-col items-center justify-center font-sans overflow-hidden`}>

                {/* Animated Background Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/30 rounded-full blur-[100px] animate-pulse`} style={{ animationDuration: '8s' }} />
                    <div className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/30 rounded-full blur-[100px] animate-pulse`} style={{ animationDuration: '10s' }} />
                </div>

                {/* Header Actions */}
                <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                        <div className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest ${textColor} opacity-80`}>Live Feed</span>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setIsDarkTheme(!isDarkTheme)} className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 ${textColor} transition-all`}>
                            {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button onClick={toggleFullScreen} className={`p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 ${textColor} transition-all`}>
                            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button onClick={() => setIsPresenting(false)} className="p-3 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 backdrop-blur-md border border-rose-500/20 transition-all">
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>

                {/* Glass Card Container */}
                {currentActivity && (
                    <div key={currentActivity.id} className="relative z-40 w-full max-w-5xl px-4 animate-in zoom-in-95 fade-in duration-500">
                        <div className={`relative ${cardBg} backdrop-blur-2xl rounded-[3rem] border ${cardBorder} shadow-2xl p-8 md:p-12 overflow-hidden`}>

                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center h-full">

                                {/* Left Side: Requester Identity (Clean & Minimal) */}
                                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center lg:border-r lg:border-slate-200/20 lg:pr-12 h-full">
                                    <div className="relative group mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full blur-2xl opacity-50" />
                                        <UserAvatar
                                            name={currentActivity.requester}
                                            url={userAvatars[currentActivity.requester] || currentActivity.avatarUrl}
                                            size="xl"
                                            className="relative w-48 h-48 border-[6px] border-white dark:border-slate-800 shadow-2xl shadow-slate-200 dark:shadow-black/50"
                                        />
                                    </div>

                                    <h3 className={`text-2xl font-bold ${textColor} mb-2 tracking-tight`}>{currentActivity.requester}</h3>
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                                        {currentActivity.department}
                                    </span>
                                </div>

                                {/* Right Side: Context & Details */}
                                <div className="lg:col-span-8 flex flex-col justify-center h-full pl-4">
                                    {/* Top Meta Row */}
                                    <div className="flex items-center gap-4 mb-8">
                                        <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${currentActivity.type === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${currentActivity.type === 'Critical' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                            {currentActivity.type}
                                        </span>
                                        <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${currentActivity.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${currentActivity.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {currentActivity.status}
                                        </span>
                                    </div>

                                    {/* Main Title */}
                                    <h2 className={`text-4xl lg:text-5xl font-bold ${textColor} leading-tight mb-8 tracking-tight`}>
                                        {currentActivity.activityName}
                                    </h2>

                                    {/* Remarks (Clean Quote Style) */}
                                    {currentActivity.remarks && (
                                        <div className={`pl-6 border-l-4 ${isLight ? 'border-blue-500/20' : 'border-blue-500/40'} mb-10`}>
                                            <p className={`text-xl ${isLight ? 'text-slate-600' : 'text-slate-300'} leading-relaxed`}>
                                                {currentActivity.remarks}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer Info Grid */}
                                    <div className={`grid grid-cols-3 gap-8 mt-auto pt-8 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>

                                        {/* IT Personnel */}
                                        <div className="flex items-center gap-4">
                                            <UserAvatar name={currentActivity.itPersonnel} url={userAvatars[currentActivity.itPersonnel]} size="md" />
                                            <div>
                                                <span className={`block text-[10px] font-bold uppercase tracking-wider ${subTextColor} mb-0.5`}>Executed By</span>
                                                <span className={`text-sm font-bold ${textColor}`}>{currentActivity.itPersonnel}</span>
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div>
                                            <span className={`block text-[10px] font-bold uppercase tracking-wider ${subTextColor} mb-1`}>Duration</span>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className={subTextColor} />
                                                <span className={`text-lg font-mono font-medium ${textColor}`}>{currentActivity.duration || '-'}</span>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <span className={`block text-[10px] font-bold uppercase tracking-wider ${subTextColor} mb-1`}>Date</span>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className={subTextColor} />
                                                <span className={`text-lg font-mono font-medium ${textColor}`}>
                                                    {new Date(currentActivity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons (Floating) */}
                <button onClick={prevSlide} className={`absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 ${textColor} transition-all group`}>
                    <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <button onClick={nextSlide} className={`absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 ${textColor} transition-all group`}>
                    <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Progress Bar (Bottom) */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${((currentSlideIndex + 1) / filteredActivities.length) * 100}%` }}
                    />
                </div>

            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {renderSlideshowOverlay()}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10 shrink-0">
                        <FileText size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">Activity <span className="text-blue-600">Log</span></h1>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">System audit trail</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setIsPresenting(true); toggleFullScreen(); }}
                        className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm active:scale-95 group"
                    >
                        <Presentation size={14} className="group-hover:scale-110 transition-transform" />
                        Present
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                    >
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                    {canManage && (
                        <button
                            onClick={() => { setSelectedActivity(null); setIsFormOpen(true); }}
                            className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Plus size={14} />
                            Register
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Resolved Tasks" value={stats.complete} icon={CheckCircle2} color="emerald" />
                <StatCard label="Active Process" value={stats.active} icon={BarChart3} color="blue" />
                <StatCard label="Total Registry" value={stats.total} icon={RefreshCcw} color="indigo" />
                <StatCard label="High Alerts" value={stats.highAlerts} icon={Zap} color="rose" />
            </div>
            {/* Header Actions (Search & Filter) */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex flex-1 gap-3 w-full">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-0 text-sm font-medium text-slate-700 dark:text-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Date Filters */}
                    <div className="flex gap-2">
                        <select
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:outline-none px-3 py-2"
                            value={dateFilterType}
                            onChange={(e) => handleDateFilterTypeChange(e.target.value)}
                        >
                            <option value="All">All Time</option>
                            <option value="Today">Today</option>
                            <option value="Week">This Week</option>
                            <option value="Month">This Month</option>
                            <option value="Custom">Custom Range</option>
                        </select>

                        {dateFilterType === 'Custom' && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                <input
                                    type="date"
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:outline-none"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <span className="self-center text-slate-400">-</span>
                                <input
                                    type="date"
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:outline-none"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <div className="relative min-w-[140px]">
                            <select
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer focus:outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                <option value="All">All Status</option>
                                <option value="Completed">Completed</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                            <Filter size={16} />
                        </button>
                        <button onClick={fetchActivities} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-colors">
                            <RefreshCcw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredActivities.length === 0 && !isLoading && (
                <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No activities found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your filters or create a new activity log.</p>
                </div>
            )}

            {/* List View */}
            {/* Table View */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5">Task Identity</th>
                                <th className="px-6 py-5">Originator</th>
                                <th className="px-6 py-5">Severity</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Timeline</th>
                                <th className="px-6 py-5 text-center">Protocol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {paginatedActivities.map((act) => (
                                <tr key={act.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-all group align-top border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                                    <td className="px-6 py-6">
                                        <div className="flex items-start gap-4 max-w-xs">
                                            <UserAvatar name={act.itPersonnel} url={userAvatars[act.itPersonnel]} size="md" className="shadow-lg shadow-blue-500/10" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight mb-0.5 leading-tight group-hover:text-blue-600 transition-colors uppercase">{act.itPersonnel}</span>
                                                <span className="font-bold text-slate-500 dark:text-slate-400 text-xs mb-1">{act.activityName}</span>
                                                <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">{act.category}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6" >
                                        <div className="flex items-center gap-4">
                                            <UserAvatar name={act.requester || 'User'} url={userAvatars[act.requester] || act.avatarUrl} size="md" className="shadow-lg shadow-indigo-500/10" />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider">{act.requester || 'IT'}</span>
                                                <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">{act.department || 'Global'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${act.type === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{act.type}</span>
                                    </td>
                                    <td className="px-6 py-6 font-bold text-xs">{getStatusColor(act.status) && <span className={`px-2 py-1 rounded-md ${getStatusColor(act.status)}`}>{act.status}</span>}</td>
                                    <td className="px-6 py-6 text-xs font-mono text-slate-400 font-bold">{new Date(act.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => { setSelectedActivity(act); setIsDetailOpen(true); }} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all"><Eye size={16} /></button>
                                            {canManage && <button onClick={() => { setSelectedActivity(act); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all"><Edit size={16} /></button>}
                                            {canDelete && <button onClick={() => setDeleteActivity(act)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Trash2 size={16} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer / Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-500">
                        Showing <span className="text-slate-900 dark:text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white font-bold">{Math.min(currentPage * itemsPerPage, filteredActivities.length)}</span> of {filteredActivities.length}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <ActivityFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={async (data) => {
                    setIsActionLoading(true);
                    try {
                        const payload = {
                            activity_name: data.activityName,
                            category: data.category,
                            requester: data.requester,
                            department: data.department,
                            it_personnel: data.itPersonnel,
                            type: data.type,
                            status: data.status,
                            remarks: data.remarks,
                            location: data.location,
                            duration: data.duration,
                            created_at: data.createdAt,
                            updated_at: data.updatedAt,
                            completed_at: data.completedAt
                        };

                        if (selectedActivity) {
                            await supabase.from('activity_logs').update(payload).eq('id', selectedActivity.id);
                        } else {
                            await supabase.from('activity_logs').insert([payload]);
                        }

                        await fetchActivities();
                        setIsFormOpen(false);
                    } catch (err) { console.error(err); } finally { setIsActionLoading(false); }
                }}
                initialData={selectedActivity}
                currentUserName={currentUser?.fullName}
                users={userList}  /* Passed correctness */
                departments={departmentList}
            />

            <ActivityDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} activity={selectedActivity} />
            <DangerConfirmModal isOpen={!!deleteActivity} onClose={() => setDeleteActivity(null)} onConfirm={async () => { await supabase.from('activity_logs').delete().eq('id', deleteActivity!.id); setDeleteActivity(null); fetchActivities(); }} title="Delete Log Entry" message={`Are you sure you want to delete the log for "${deleteActivity?.activityName}"?`} isLoading={isActionLoading} />
        </div>
    );
}

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);
