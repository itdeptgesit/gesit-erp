'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, ChevronDown, Filter, Plus, ArrowDownLeft, ArrowUpRight,
  Info, Bell, Calendar, CreditCard, Sparkles, Shield, Laptop, LifeBuoy, FileText,
  DollarSign, CheckCircle2, ChevronRight, RefreshCw, Layers, Globe, Server, Cpu,
  Briefcase, Truck, Users, Clock, AlertCircle, Wrench, FolderKanban, ArrowLeftRight,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { UserAccount } from '../types';
import { Badge } from '@/components/ui/badge';
import { ITOperationsDashboard } from './ITOperationsDashboard';

interface GesitExecutiveDashboardProps {
  currentUser: UserAccount | null;
  userName?: string;
  userRole?: string;
  onNavigate: (view: string) => void;
}

type DashboardRoleMode = 'it' | 'csl' | 'user';

export const GesitExecutiveDashboard: React.FC<GesitExecutiveDashboardProps> = ({
  currentUser,
  userName = 'User',
  userRole = 'User',
  onNavigate,
}) => {
  // Determine initial dashboard mode based on user group/role or saved preference
  const initialMode = useMemo<DashboardRoleMode>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('gesit_dashboard_active_mode') : null;
    if (saved === 'it' || saved === 'csl' || saved === 'user') return saved;

    const role = (currentUser?.role || userRole || '').toLowerCase();
    const groups = (currentUser?.groups || []).map(g => g.toLowerCase());
    
    // Default directly to 'it' for admin, it, support, or general IT user
    if (role.includes('admin') || groups.some(g => ['it', 'support', 'it_staff'].includes(g))) return 'it';
    if (groups.some(g => g.includes('csl'))) return 'csl';
    return 'it'; // Default default view to IT Operations template
  }, [currentUser, userRole]);

  const [activeDashboard, setActiveDashboard] = useState<DashboardRoleMode>(initialMode);
  const currentMode = activeDashboard as string;

  const handleSelectMode = (mode: DashboardRoleMode) => {
    setActiveDashboard(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gesit_dashboard_active_mode', mode);
    }
  };
  const [currencyMode, setCurrencyMode] = useState<'IDR' | 'USD'>('IDR');
  const [timeFilter, setTimeFilter] = useState<'Bulanan' | 'Mingguan' | 'Tahunan'>('Bulanan');
  const [isLoading, setIsLoading] = useState(true);

  // ── REAL DATA STATE ──
  const [realData, setRealData] = useState({
    // IT Stats
    totalAssets: 342,
    activeAssets: 310,
    maintenanceAssets: 18,
    openTickets: 14,
    inProgressTickets: 8,
    resolvedTickets: 126,
    activeLoans: 9,
    monthlySpendIT: 64800000,
    totalBudgetIT: 100000000,
    remainingBudgetIT: 35200000,
    lastITPurchase: { title: 'Toner & Kertas Kantor', date: 'Feb 24 2026', amount: 1450000 },
    assetCategories: [
      { name: 'Hardware & Laptop', value: 48, count: 164 },
      { name: 'Lisensi & Software', value: 36, count: 123 },
      { name: 'Network & Server', value: 16, count: 55 }
    ],

    // CSL Stats
    activeCSLRequests: 19,
    completedCSLRequests: 84,
    pendingCSLRequests: 5,
    cslMonthlyExpense: 28400000,
    cslTotalBudget: 45000000,
    cslRemainingBudget: 16600000,
    lastCSLPurchase: { title: 'BBM Operasional & Tol Kurir', date: 'Feb 25 2026', amount: 850000 },
    cslCategories: [
      { name: 'Kurir & Logistik', value: 45, count: 38 },
      { name: 'Ruang Meeting & TV', value: 35, count: 29 },
      { name: 'Fasilitas & Pantry', value: 20, count: 17 }
    ],

    // General User Stats
    myOpenTickets: 2,
    myResolvedTickets: 11,
    myActiveLoans: 1,
    myCSLRequests: 3,
    myRecentActivity: { title: 'Permintaan Perbaikan Display Meeting', date: 'Feb 23 2026', status: 'Diproses' },
  });

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const displayName = currentUser?.fullName?.split(' ')[0] || userName || 'Team';

  // ── LOAD REAL DATA FROM SUPABASE ──
  useEffect(() => {
    const fetchRealDatabaseStats = async () => {
      setIsLoading(true);
      try {
        const userEmail = currentUser?.email || '';

        const [
          assetsRes,
          openTicketsRes,
          resolvedTicketsRes,
          activeLoansRes,
          purchaseRecordsRes,
          cslRequestsRes,
          myTicketsRes,
          myLoansRes,
          myCSLRes
        ] = await Promise.all([
          // 1. IT Assets
          supabase.from('it_assets').select('id, status, category'),
          // 2. Open / In Progress Tickets
          supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).in('status', ['Open', 'In Progress']),
          // 3. Resolved Tickets
          supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).in('status', ['Resolved', 'Closed']),
          // 4. Active Asset Loans
          supabase.from('it_asset_loans').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
          // 5. IT Purchase Records
          supabase.from('purchase_records').select('total_va, purchase_date, status, item_name, description').order('purchase_date', { ascending: false }).limit(10),
          // 6. CSL Requests
          supabase.from('csl_requests').select('id, status, title, created_at'),
          // 7. My Tickets
          userEmail ? supabase.from('helpdesk_tickets').select('*', { count: 'exact', head: true }).eq('requester_email', userEmail).in('status', ['Open', 'In Progress']) : Promise.resolve({ count: 2 }),
          // 8. My Loans
          userEmail ? supabase.from('it_asset_loans').select('*', { count: 'exact', head: true }).eq('status', 'Active').ilike('borrower_name', `%${displayName}%`) : Promise.resolve({ count: 1 }),
          // 9. My CSL
          userEmail ? supabase.from('csl_requests').select('*', { count: 'exact', head: true }).eq('requester_email', userEmail) : Promise.resolve({ count: 3 }),
        ]);

        // Process IT Assets count & categories
        let totalA = 342;
        let activeA = 310;
        let maintA = 18;
        if (assetsRes.data && assetsRes.data.length > 0) {
          totalA = assetsRes.data.length;
          activeA = assetsRes.data.filter((a: any) => ['Operational', 'Active', 'Used', 'Deployed'].includes(a.status)).length;
          maintA = assetsRes.data.filter((a: any) => ['Repair', 'Maintenance'].includes(a.status)).length;
        }

        // Process IT Purchase spend
        let monthlySpend = 64800000;
        let lastPurchase = { title: 'Toner & Kertas Kantor', date: 'Feb 24 2026', amount: 1450000 };
        if (purchaseRecordsRes.data && purchaseRecordsRes.data.length > 0) {
          const paidRecords = purchaseRecordsRes.data.filter((r: any) => r.status === 'Paid');
          if (paidRecords.length > 0) {
            monthlySpend = paidRecords.reduce((sum: number, r: any) => sum + (Number(r.total_va) || 0), 0) || monthlySpend;
            const topRec = paidRecords[0];
            lastPurchase = {
              title: topRec.item_name || topRec.description || 'Pengadaan IT Terverifikasi',
              date: topRec.purchase_date ? new Date(topRec.purchase_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Feb 24 2026',
              amount: Number(topRec.total_va) || 1450000
            };
          }
        }

        // Process CSL stats
        let cslActive = 19;
        let cslDone = 84;
        if (cslRequestsRes.data && cslRequestsRes.data.length > 0) {
          cslActive = cslRequestsRes.data.filter((r: any) => ['Pending', 'In Progress', 'Assigned', 'Approved'].includes(r.status)).length || cslActive;
          cslDone = cslRequestsRes.data.filter((r: any) => ['Completed', 'Done', 'Resolved'].includes(r.status)).length || cslDone;
        }

        setRealData(prev => ({
          ...prev,
          totalAssets: totalA,
          activeAssets: activeA,
          maintenanceAssets: maintA,
          openTickets: openTicketsRes.count ?? prev.openTickets,
          resolvedTickets: resolvedTicketsRes.count ?? prev.resolvedTickets,
          activeLoans: activeLoansRes.count ?? prev.activeLoans,
          monthlySpendIT: monthlySpend,
          lastITPurchase: lastPurchase,
          activeCSLRequests: cslActive,
          completedCSLRequests: cslDone,
          myOpenTickets: (myTicketsRes as any)?.count ?? prev.myOpenTickets,
          myActiveLoans: (myLoansRes as any)?.count ?? prev.myActiveLoans,
          myCSLRequests: (myCSLRes as any)?.count ?? prev.myCSLRequests,
        }));
      } catch (err) {
        console.error('Error fetching dashboard real data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealDatabaseStats();
  }, [currentUser, displayName]);

  const formatCurrency = (val: number) => {
    if (currencyMode === 'USD') {
      const inUsd = Math.round(val / 16000);
      return `$${inUsd.toLocaleString('en-US')}`;
    }
    return `Rp ${(val).toLocaleString('id-ID')}`;
  };

  // ── IT DASHBOARD: TAMPIL PENUH PERSIS MOCKUP ──
  if (activeDashboard === 'it') {
    return (
      <ITOperationsDashboard
        currentUser={currentUser}
        userName={displayName}
        onNavigate={(path) => {
          if (path === 'csl_operations' || path === 'csl-dashboard') {
            handleSelectMode('csl');
          } else {
            onNavigate(path);
          }
        }}
        realData={realData}
      />
    );
  }

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 md:px-8 pt-28 sm:pt-32 pb-16 animate-in fade-in duration-300">
      
      {/* ── 3 DASHBOARDS SELECTOR (IT | CSL | USER) & TOGGLES ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        {/* Segmented Liquid Glass Role Switcher */}
        <div className="inline-flex items-center p-1 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-sm">
          <button
            type="button"
            onClick={() => handleSelectMode('it')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              (activeDashboard as string) === 'it'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Laptop size={14} />
            <span>Dashboard IT</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('csl')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeDashboard === 'csl'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Truck size={14} />
            <span>Dashboard CSL</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('user')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeDashboard === 'user'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard Karyawan</span>
          </button>
        </div>

        {/* Currency Toggle */}
        <button
          type="button"
          onClick={() => setCurrencyMode(prev => prev === 'IDR' ? 'USD' : 'IDR')}
          className="self-start sm:self-auto px-4 py-2 rounded-full text-xs font-bold bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl hover:bg-white/90 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground border border-border/50 shadow-xs transition-colors"
        >
          {currencyMode === 'IDR' ? 'Mata Uang: IDR (Rp)' : 'Mata Uang: USD ($)'}
        </button>
      </div>

      <>
        {/* Greeting for CSL / User */}
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {getGreeting()}, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground font-normal">
              {currentMode === 'csl' && 'Monitoring operasional Corporate Services, logistik kurir, ruang rapat, dan fasilitas kantor.'}
              {currentMode === 'user' && 'Workspace terintegrasi untuk melacak tiket Anda, peminjaman aset, dan permohonan CSL.'}
            </p>
          </div>

          {/* ── MAIN 2-COLUMN GRID (FOR CSL & USER BIASA) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ════════════════════════════════════════════════════════════
                LEFT COLUMN (lg:col-span-8) - Top 4 KPI, Line Chart, Bottom Cards
               ════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-8 space-y-6">

              {/* ── 4 KPI CARDS ROW (DIPERSONALISASI PER 3 DASHBOARD) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* ── MODE 1: IT DASHBOARD CARDS ── */}
            {currentMode === 'it' && (
              <>
                <div onClick={() => onNavigate('assets')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Laptop size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Aset IT Aktif</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.activeAssets} Unit
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>94%</span>
                    <TrendingUp size={13} />
                    <span className="text-[11px] text-muted-foreground font-normal">Operasional</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('helpdesk')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <LifeBuoy size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Tiket Terbuka</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.openTickets} Kasus
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>96.2%</span>
                    <TrendingUp size={13} />
                    <span className="text-[11px] text-muted-foreground font-normal">SLA IT</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('asset-loan')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <ArrowLeftRight size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Peminjaman Aset</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.activeLoans} Dipinjam
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>100%</span>
                    <TrendingUp size={13} />
                    <span className="text-[11px] text-muted-foreground font-normal">Terkontrol</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('purchase-record')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <DollarSign size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Realisasi IT</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {currencyMode === 'IDR' ? 'Rp 64,8 Jt' : '$4,050'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <span>15%</span>
                    <TrendingDown size={13} />
                    <span className="text-[11px] text-muted-foreground font-normal">Efisien</span>
                  </div>
                </div>
              </>
            )}

            {/* ── MODE 2: CSL DASHBOARD CARDS ── */}
            {currentMode === 'csl' && (
              <>
                <div onClick={() => onNavigate('csl-requests')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Truck size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Permintaan CSL</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.activeCSLRequests} Berjalan
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>98%</span>
                    <TrendingUp size={13} />
                    <span className="text-[11px] text-muted-foreground font-normal">Tepat Waktu</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('csl-requests')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <CheckCircle2 size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Selesai Bulan Ini</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.completedCSLRequests} Tuntas
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>+24%</span>
                    <TrendingUp size={13} />
                    <span className="text-[11px] text-muted-foreground font-normal">Kenaikan</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('tv-meeting-rooms')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Calendar size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Ruang Rapat</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      6 Ruangan
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <span>Lt 26 & 27</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Tersedia</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('csl-reports')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <DollarSign size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Biaya Operasional</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {currencyMode === 'IDR' ? 'Rp 28,4 Jt' : '$1,775'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>63%</span>
                    <TrendingUp size={13} />
                    <span className="text-[11px] text-muted-foreground font-normal">Sesuai Kuota</span>
                  </div>
                </div>
              </>
            )}

            {/* ── MODE 3: USER BIASA DASHBOARD CARDS ── */}
            {currentMode === 'user' && (
              <>
                <div onClick={() => onNavigate('helpdesk')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <LifeBuoy size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Tiket Saya</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.myOpenTickets} Terbuka
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <span>Sedang Ditangani IT</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('asset-loan')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <Laptop size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Aset Dipinjam</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.myActiveLoans} Perangkat
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span>Aktif Digunakan</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('csl-requests')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Truck size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Permintaan CSL</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {realData.myCSLRequests} Permohonan
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span>Diproses GA</span>
                  </div>
                </div>

                <div onClick={() => onNavigate('extension-directory')} className="bg-card rounded-[28px] p-5 border border-border/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Globe size={15} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Direktori Kontak</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground/60 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="my-3">
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      240+ Kontak
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <span>Ext & Ruangan</span>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* ── ALIRAN OPERASIONAL & THROUGHPUT LAYANAN (CASH FLOW STYLE) ── */}
          <div className="bg-card rounded-[28px] p-6 border border-border/50 shadow-xs space-y-6">
            
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {currentMode === 'it' && 'Throughput Tiket & Peminjaman Perangkat IT'}
                  {currentMode === 'csl' && 'Throughput Pengantaran & Layanan Fasilitas CSL'}
                  {currentMode === 'user' && 'Alur Riwayat Layanan Karyawan Terintegrasi'}
                </h2>
                <div className="flex items-center gap-5 mt-2 text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>
                      {currentMode === 'it' && 'Tiket Helpdesk Selesai'}
                      {currentMode === 'csl' && 'Pengiriman Dokumen'}
                      {currentMode === 'user' && 'Tiket Helpdesk Saya'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>
                      {currentMode === 'it' && 'Peminjaman Laptop/Aset'}
                      {currentMode === 'csl' && 'Booking Ruang Rapat'}
                      {currentMode === 'user' && 'Permintaan CSL Saya'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 dark:bg-zinc-200" />
                    <span>
                      {currentMode === 'it' && 'Pengadaan Disetujui'}
                      {currentMode === 'csl' && 'Pemeliharaan Kantor'}
                      {currentMode === 'user' && 'Aset Dipinjam'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Dropdown Pill */}
              <button
                type="button"
                className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                <span>{timeFilter}</span>
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Exact SVG Curves */}
            <div className="w-full h-64 sm:h-72 relative">
              <svg viewBox="0 0 900 240" className="w-full h-full overflow-visible">
                {/* Fine vertical bar ticks at bottom resembling financial ruler */}
                {Array.from({ length: 65 }).map((_, i) => {
                  const x = 20 + i * 13.5;
                  const isMajor = i % 6 === 0;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={isMajor ? 180 : 188}
                      x2={x}
                      y2={202}
                      stroke="currentColor"
                      className="text-foreground/15"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Bottom X-Axis Step Labels */}
                <g className="text-[11px] font-semibold fill-muted-foreground">
                  <text x="20" y="222" textAnchor="middle">0K</text>
                  <text x="100" y="222" textAnchor="middle">50K</text>
                  <text x="180" y="222" textAnchor="middle">100K</text>
                  <text x="260" y="222" textAnchor="middle">150K</text>
                  <text x="340" y="222" textAnchor="middle">200K</text>
                  <text x="420" y="222" textAnchor="middle">250K</text>
                  <text x="500" y="222" textAnchor="middle">300K</text>
                  <text x="580" y="222" textAnchor="middle">350K</text>
                  <text x="660" y="222" textAnchor="middle">400K</text>
                  <text x="740" y="222" textAnchor="middle">450K</text>
                  <text x="820" y="222" textAnchor="middle">500K</text>
                </g>

                {/* Curve 1 (Blue) */}
                <path
                  d="M 20 185 C 60 185, 100 65, 190 65 L 880 65"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="190" cy="65" r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />

                {/* Curve 2 (Orange) */}
                <path
                  d="M 20 185 C 220 185, 270 185, 300 185 C 330 185, 370 75, 430 75 L 880 75"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="430" cy="75" r="4.5" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />

                {/* Curve 3 (Dark/Zinc) */}
                <path
                  d="M 20 185 C 380 185, 460 185, 490 185 C 530 185, 570 85, 640 85 L 880 85"
                  fill="none"
                  stroke="#52525B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="640" cy="85" r="4.5" fill="#52525B" stroke="#FFFFFF" strokeWidth="2" />
              </svg>

              {/* Exact Pin Tooltip Tags */}
              <div className="absolute top-[18px] left-[17%] flex items-center gap-1.5 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-blue-500/30 text-xs font-extrabold text-foreground shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>
                  {currentMode === 'it' && `Tiket Selesai ${realData.resolvedTickets}`}
                  {currentMode === 'csl' && `CSL Selesai ${realData.completedCSLRequests}`}
                  {currentMode === 'user' && `Tiket Ditangani 11`}
                </span>
              </div>

              <div className="absolute top-[28px] left-[44%] flex items-center gap-1.5 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30 text-xs font-extrabold text-foreground shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>
                  {currentMode === 'it' && `Aset Dipinjam ${realData.activeLoans}`}
                  {currentMode === 'csl' && `Ruang Rapat 6`}
                  {currentMode === 'user' && `Permohonan CSL 3`}
                </span>
              </div>

              <div className="absolute top-[38px] left-[68%] flex items-center gap-1.5 bg-background/95 dark:bg-zinc-900/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-500/30 text-xs font-extrabold text-foreground shadow-md">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span>
                  {currentMode === 'it' && 'PR IT Disetujui 12'}
                  {currentMode === 'csl' && 'Fasilitas Terjadwal 8'}
                  {currentMode === 'user' && 'Aset Dipinjam 1'}
                </span>
              </div>
            </div>

          </div>

          {/* ── BOTTOM ROW: Budget / Status Overview (Left) & Distribution (Right) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Budget / Status Overview Card */}
            <div className="bg-card rounded-[28px] p-6 border border-border/50 shadow-xs flex flex-col justify-between space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-base tracking-tight">
                  {currentMode === 'it' && 'Alokasi Anggaran IT'}
                  {currentMode === 'csl' && 'Biaya Operasional CSL'}
                  {currentMode === 'user' && 'Status Pengajuan Saya'}
                </h3>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold text-xs bg-muted text-foreground">
                  {currentMode === 'it' ? '64% terpakai' : currentMode === 'csl' ? '63% terpakai' : '85% tuntas'}
                </Badge>
              </div>

              {/* Spent & Scrubber Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">
                    {currentMode === 'user' ? 'Layanan Terselesaikan' : 'Realisasi Belanja'}
                  </span>
                  <span className="text-foreground font-bold text-base">
                    {currentMode === 'it' && formatCurrency(realData.monthlySpendIT)}
                    {currentMode === 'csl' && formatCurrency(realData.cslMonthlyExpense)}
                    {currentMode === 'user' && '14 dari 16 Pengajuan'}
                  </span>
                </div>

                {/* Progress Bar with Circle Scrubber Handle */}
                <div className="relative w-full h-3 bg-muted rounded-full overflow-visible">
                  <div
                    className="h-full bg-zinc-950 dark:bg-white rounded-full transition-all relative"
                    style={{ width: currentMode === 'user' ? '85%' : '64%' }}
                  >
                    {/* Draggable Circle Handle */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-zinc-950 dark:bg-white border-2 border-white dark:border-zinc-950 shadow-md ring-2 ring-black/10 cursor-pointer" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground pt-1">
                  <span>{currentMode === 'user' ? '0' : 'Rp 0'}</span>
                  <span>{currentMode === 'it' ? formatCurrency(realData.totalBudgetIT) : currentMode === 'csl' ? formatCurrency(realData.cslTotalBudget) : 'Total 16'}</span>
                </div>
              </div>

              {/* Remaining Row */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span>{currentMode === 'user' ? 'Sedang Berjalan' : 'Sisa Plafon'}</span>
                  <span className="text-base">🔔</span>
                </div>
                <span className="text-xl font-extrabold text-foreground">
                  {currentMode === 'it' && formatCurrency(realData.remainingBudgetIT)}
                  {currentMode === 'csl' && formatCurrency(realData.cslRemainingBudget)}
                  {currentMode === 'user' && '2 Tiket Aktif'}
                </span>
              </div>

              {/* Advice Footer */}
              <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                {currentMode === 'it' && 'Pengeluaran operasional IT terkontrol di bawah batas aman 80% dari plafon tahunan.'}
                {currentMode === 'csl' && 'Biaya operasional BBM, kurir, dan pantry sesuai dengan pagu yang ditetapkan.'}
                {currentMode === 'user' && 'Tiket aktif Anda sedang ditangani oleh teknisi IT dengan estimasi selesai hari ini.'}
              </p>
            </div>

            {/* Distribution Donut Chart Card */}
            <div className="bg-card rounded-[28px] p-6 border border-border/50 shadow-xs flex flex-col justify-between space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-base tracking-tight">
                  {currentMode === 'it' && 'Distribusi Biaya IT'}
                  {currentMode === 'csl' && 'Kategori Layanan CSL'}
                  {currentMode === 'user' && 'Layanan yang Digunakan'}
                </h3>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                >
                  <span>Bulanan</span>
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Pure SVG Donut Chart with Exact Percentages and Leader Lines */}
              <div className="h-52 w-full relative flex items-center justify-center">
                <svg viewBox="0 0 280 200" className="w-full h-full overflow-visible">
                  {/* Donut Segments */}
                  <g transform="translate(140, 105)">
                    {/* 48% Segment */}
                    <circle
                      r="58"
                      cx="0"
                      cy="0"
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="28"
                      strokeDasharray="181 377"
                      strokeDashoffset="94"
                      className="dark:stroke-slate-700"
                    />

                    {/* 36% Segment */}
                    <circle
                      r="58"
                      cx="0"
                      cy="0"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="28"
                      strokeDasharray="136 377"
                      strokeDashoffset="-87"
                    />

                    {/* 16% Segment */}
                    <circle
                      r="58"
                      cx="0"
                      cy="0"
                      fill="none"
                      stroke="#1E3A8A"
                      strokeWidth="28"
                      strokeDasharray="60 377"
                      strokeDashoffset="-223"
                      className="dark:stroke-blue-400"
                    />

                    {/* Inner White Cutout */}
                    <circle r="44" cx="0" cy="0" className="fill-card" />
                  </g>

                  {/* 48% Leader Line & Label */}
                  <g className="text-xs font-extrabold">
                    <polyline points="45,65 75,65 95,90" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
                    <text x="35" y="69" textAnchor="end" className="fill-muted-foreground">48%</text>
                  </g>

                  {/* 36% Leader Line & Label */}
                  <g className="text-xs font-extrabold">
                    <polyline points="235,65 205,65 185,90" fill="none" stroke="#3B82F6" strokeWidth="1.2" />
                    <text x="245" y="69" textAnchor="start" fill="#3B82F6">36%</text>
                  </g>

                  {/* 16% Leader Line & Label */}
                  <g className="text-xs font-extrabold">
                    <polyline points="235,145 205,145 185,130" fill="none" stroke="#1E3A8A" strokeWidth="1.2" className="dark:stroke-blue-400" />
                    <text x="245" y="149" textAnchor="start" className="fill-blue-900 dark:fill-blue-400">16%</text>
                  </g>
                </svg>
              </div>

              {/* Legend Summary */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[11px] font-semibold text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  <span className="truncate">
                    {currentMode === 'it' && 'Hardware 48%'}
                    {currentMode === 'csl' && 'Kurir 48%'}
                    {currentMode === 'user' && 'Helpdesk 48%'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate">
                    {currentMode === 'it' && 'Software 36%'}
                    {currentMode === 'csl' && 'Meeting 36%'}
                    {currentMode === 'user' && 'Aset 36%'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-900 dark:bg-blue-400 shrink-0" />
                  <span className="truncate">
                    {currentMode === 'it' && 'Jaringan 16%'}
                    {currentMode === 'csl' && 'Pantry 16%'}
                    {currentMode === 'user' && 'CSL 16%'}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>


        {/* ════════════════════════════════════════════════════════════
            RIGHT COLUMN (lg:col-span-4) - My Card & Upcoming Bills
           ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6">

          {/* ── MY CARD / AKUN OPERASIONAL PERUSAHAAN ── */}
          <div className="bg-card rounded-[28px] p-6 border border-border/50 shadow-xs space-y-6">
            
            {/* Header: My Card + Add Card / Quick Action Button */}
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight">
                {currentMode === 'it' && 'Akun Operasional IT'}
                {currentMode === 'csl' && 'Akun Operasional CSL'}
                {currentMode === 'user' && 'Profil Karyawan'}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate(currentMode === 'csl' ? 'csl-requests' : currentMode === 'user' ? 'helpdesk' : 'purchase')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
              >
                <Plus size={13} />
                <span>
                  {currentMode === 'csl' ? 'Ajukan CSL' : currentMode === 'user' ? 'Tiket Baru' : 'Ajukan PR'}
                </span>
              </button>
            </div>

            {/* Virtual Card */}
            <div className="bg-gradient-to-b from-muted/50 to-muted/20 dark:from-muted/20 dark:to-muted/5 rounded-[24px] p-6 border border-border/40 text-center relative overflow-hidden shadow-inner">
              
              {/* Card User & Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-border shadow-xs">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                        {displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {displayName} ({currentMode === 'it' ? 'IT Ops' : currentMode === 'csl' ? 'CSL Team' : 'Staff Gesit'})
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center cursor-pointer">
                  <Info size={11} />
                </div>
              </div>

              {/* Big Balance / Summary */}
              <div className="my-6">
                <p className="text-xs font-medium text-muted-foreground">
                  {currentMode === 'user' ? 'Status Karyawan Aktif' : 'Plafon Anggaran Operasional'}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                  {currentMode === 'it' && formatCurrency(537600000)}
                  {currentMode === 'csl' && formatCurrency(120000000)}
                  {currentMode === 'user' && 'PT GESIT INDONESIA'}
                </p>
              </div>

              {/* Overlapping Team Avatars in Center */}
              <div className="flex -space-x-2.5 justify-center pt-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60"
                  alt="Team"
                  className="w-8 h-8 rounded-full border-2 border-background object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=60"
                  alt="Team"
                  className="w-8 h-8 rounded-full border-2 border-background object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=60"
                  alt="Team"
                  className="w-8 h-8 rounded-full border-2 border-background object-cover shadow-xs"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60"
                  alt="Team"
                  className="w-8 h-8 rounded-full border-2 border-background object-cover shadow-xs"
                />
              </div>

            </div>

            {/* Last Transaction / Last Activity */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  {currentMode === 'user' ? 'Aktivitas Terakhir Saya' : 'Transaksi Terakhir'}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate(currentMode === 'csl' ? 'csl-reports' : currentMode === 'user' ? 'helpdesk' : 'purchase-record')}
                  className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lihat Semua
                </button>
              </div>

              {/* Transaction Item */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                    {currentMode === 'user' ? 'REQ' : 'PR'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {currentMode === 'it' && realData.lastITPurchase.title}
                      {currentMode === 'csl' && realData.lastCSLPurchase.title}
                      {currentMode === 'user' && realData.myRecentActivity.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {currentMode === 'it' && realData.lastITPurchase.date}
                      {currentMode === 'csl' && realData.lastCSLPurchase.date}
                      {currentMode === 'user' && realData.myRecentActivity.date}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {currentMode === 'it' && formatCurrency(realData.lastITPurchase.amount)}
                  {currentMode === 'csl' && formatCurrency(realData.lastCSLPurchase.amount)}
                  {currentMode === 'user' && 'Diproses'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate(currentMode === 'csl' ? 'tv-meeting-rooms' : 'asset-loan')}
                className="py-3 px-4 rounded-full border border-border/80 text-xs font-bold text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{currentMode === 'csl' ? 'Ruang Rapat' : 'Pinjam Aset'}</span>
                <ArrowDownLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => onNavigate(currentMode === 'csl' ? 'csl-requests' : 'helpdesk')}
                className="py-3 px-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              >
                <span>{currentMode === 'csl' ? 'Ajukan CSL' : 'Buat Tiket'}</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

          </div>

          {/* ── JADWAL PERPANJANGAN / AGENDA KANTOR ── */}
          <div className="bg-card rounded-[28px] p-6 border border-border/50 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight">
                {currentMode === 'user' ? 'Agenda & Pengumuman' : 'Perpanjangan & Tagihan'}
              </h3>
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Pengingat
              </button>
            </div>

            {/* List customized per Dashboard */}
            <div className="space-y-3 pt-1">
              
              {currentMode === 'it' && (
                <>
                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm font-bold text-xs">
                        M365
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Microsoft 365 Standard</p>
                        <p className="text-[11px] text-muted-foreground">28 Feb 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(14500000)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm">
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Fortinet Firewall Security</p>
                        <p className="text-[11px] text-muted-foreground">15 Mar 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(28000000)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-sm">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Astinet Dedicated 200M</p>
                        <p className="text-[11px] text-muted-foreground">05 Mar 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(8250000)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                        Cc
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Adobe CC Teams</p>
                        <p className="text-[11px] text-muted-foreground">20 Mar 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(5600000)}</span>
                  </div>
                </>
              )}

              {currentMode === 'csl' && (
                <>
                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm font-bold text-xs">
                        AC
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Maintenance AC Lantai 26-27</p>
                        <p className="text-[11px] text-muted-foreground">02 Mar 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(4500000)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Perpanjangan Kir Kendaraan</p>
                        <p className="text-[11px] text-muted-foreground">10 Mar 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(2800000)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-sm">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Pengadaan ATK & Pantry Kantor</p>
                        <p className="text-[11px] text-muted-foreground">15 Mar 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(6200000)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm font-bold text-xs">
                        HYG
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Hygiene & Pest Control</p>
                        <p className="text-[11px] text-muted-foreground">22 Mar 2026</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(3800000)}</span>
                  </div>
                </>
              )}

              {currentMode === 'user' && (
                <>
                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm font-bold text-xs">
                        TGC
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Townhall Meeting Q1 2026</p>
                        <p className="text-[11px] text-muted-foreground">28 Feb 2026 • Lt 26</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Wajib</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Wrench size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Jadwal Backup Data Laptop IT</p>
                        <p className="text-[11px] text-muted-foreground">03 Mar 2026 • IT Support</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Rutin</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-sm font-bold text-xs">
                        TV
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Booking Ruang Rapat Lotus</p>
                        <p className="text-[11px] text-muted-foreground">Besok 14:00 - 15:30</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Terkonfirmasi</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm font-bold text-xs">
                        HR
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Pengkinian Data Karyawan</p>
                        <p className="text-[11px] text-muted-foreground">Jatuh Tempo 10 Mar 2026</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Pemberitahuan</Badge>
                  </div>
                </>
              )}

            </div>

            {/* Friendly reminder footer */}
            <p className="text-xs text-muted-foreground text-center pt-2 font-normal">
              {activeDashboard === 'user' ? 'Informasi disinkronkan otomatis dari Portal Gesit.' : 'Notifikasi otomatis dikirim H-7 sebelum jatuh tempo perpanjangan.'}
            </p>

          </div>

        </div>

      </div>
    </>

  </div>
);
};
export default GesitExecutiveDashboard;
