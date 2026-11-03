import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGesitTheme } from "../lib/useGesitTheme";
import "./DashboardIT.css";

/* =====================================================================
   Dashboard IT — GESIT PORTAL (React + TypeScript)
   Mockup statis dengan data snapshot portal 26 Okt 2026.
   Semua angka ada di konstanta DATA di bawah — nanti tinggal ganti
   dengan hasil query Supabase / Google Calendar (backend).
   ===================================================================== */

const MENU_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>
    ),
  },
  {
    id: "it-operations",
    label: "IT Operations",
    children: [
      { label: "Ticketing / Support", path: "/helpdesk" },
      { label: "Activities Log", path: "/activity" },
      { label: "Weekly Planner", path: "/weekly" },
      { label: "Infrastructure", path: "/network" },
    ],
  },
  {
    id: "csl-operations",
    label: "CSL Operations",
    children: [
      { label: "CSL Requests", path: "/csl-requests" },
      { label: "Activity Log", path: "/routine-activity" },
      { label: "Task Manager", path: "/routine-task" },
      { label: "Expense Approval", path: "/budget-expense" },
      { label: "Directory External", path: "/directory-external" },
      { label: "Reports", path: "/reports" },
    ],
  },
  {
    id: "procurement-assets",
    label: "Procurement & Assets",
    children: [
      { label: "Procurement / Requisition", path: "/purchase" },
      { label: "Purchase Record", path: "/purchase-record" },
      { label: "Asset Catalog", path: "/assets" },
      { label: "Asset Loan & Return", path: "/asset-loan" },
      { label: "Asset Handover (BAST)", path: "/asset-handover" },
    ],
  },
  {
    id: "directory-office",
    label: "Directory & Office",
    children: [
      { label: "Directory Internal", path: "/extension-directory" },
      { label: "Office Layout", path: "/office-layout" },
      { label: "TV Meeting Room", path: "/tv-meeting-rooms" },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    children: [
      { label: "User Accounts", path: "/users" },
      { label: "CSL Settings", path: "/csl-settings" },
      { label: "System Settings", path: "/system-settings" },
      { label: "Tracking Log", path: "/tracking-log" },
      { label: "Broadcasts", path: "/announcements" },
      { label: "Company Data", path: "/master-company" },
      { label: "Departments", path: "/master-department" },
      { label: "Asset Categories", path: "/master-category" },
      { label: "Groups & Access", path: "/master-group" },
    ],
  },
];

const DATA = {
  user: { name: "Rudi", initials: "RS", role: "Rudi (IT Team)" },
  kpis: [
    { label: "Tiket Berjalan", iconBg: "#eef4ff", big: "1", unit: "Open", note: "belum di-assign", note2: "dari 3 total tiket", accent: "#f79009" },
    { label: "Selesai Bulan Ini", iconBg: "#ecfdf3", big: "2", unit: "Tuntas", note: "SLA compliance", note2: "target 90%", accent: "#12b76a" },
    { label: "Rata-rata Resolusi", iconBg: "#fffaeb", big: "0,3", unit: "Jam", note: "lebih cepat dari target", note2: "24 jam", accent: "#12b76a" },
    { label: "Aktivitas Berjalan", iconBg: "#fef3f2", big: "14", unit: "Proses", note: "high alert dari", note2: "364 total aktivitas", accent: "#f04438" },
  ],
  week: [
    { d: "Sel", masuk: 24, selesai: 22 },
    { d: "Rab", masuk: 31, selesai: 29 },
    { d: "Kam", masuk: 28, selesai: 30 },
    { d: "Jum", masuk: 38, selesai: 35 },
    { d: "Sab", masuk: 17, selesai: 19 },
    { d: "Min", masuk: 12, selesai: 15 },
    { d: "Sen", masuk: 33, selesai: 31 },
  ],
  meetings: [
    { day: "HARI INI · SENIN, 26 OKT", title: "Briefing Tim IT", loc: "On Google Meet · Ruang Meeting Lt. 26", tag: "Internal", time: "09:00 – 10:00" },
    { day: "HARI INI · SENIN, 26 OKT", title: "Koordinasi Vendor CCTV Sircon73", loc: "On Google Meet · tindak lanjut kunjungan vendor", tag: "Eksternal", time: "13:30 – 14:30" },
    { day: "BESOK · SELASA, 27 OKT", title: "Review Infrastruktur Mingguan", loc: "On Google Meet · NetVision & node kantor", tag: "Internal", time: "10:00 – 11:00" },
  ],
  tasks: [
    { state: "todo", title: "Progress doc replacement copier HP", time: "09:00" },
    { state: "dark", title: "Develop Absen Gesit", time: "10:30" },
    { state: "todo", title: "Arrange visit CCTV vendor Sircon73", time: "13:00" },
    { state: "blue", title: "Kordinasi dokumen kontrak copier HP", time: "14:15" },
    { state: "green", title: "Develop System CSL", time: "16:00" },
  ] as { state: "todo" | "dark" | "blue" | "green"; title: string; time: string }[],
  systemStatus: [
    {
      name: "GESIT PORTAL",
      url: "https://it.gesit.co.id",
      displayUrl: "it.gesit.co.id",
      ip: "103.28.160.42",
      type: "Portal Web",
      ping: "18ms",
      pct: "100%",
    },
    {
      name: "Supabase REST API",
      url: "https://yihjfrxdrhkqfnjofvua.supabase.co",
      displayUrl: "yihjfrxdrhkq...supabase.co",
      ip: "AWS ap-southeast-1",
      type: "Database / Auth",
      ping: "24ms",
      pct: "99,99%",
    },
    {
      name: "Supabase Realtime Hub",
      url: "wss://yihjfrxdrhkqfnjofvua.supabase.co/realtime/v1",
      displayUrl: "wss://...supabase.co/realtime",
      ip: "WSS Port 443 Active",
      type: "WebSocket Stream",
      ping: "21ms",
      pct: "100%",
    },
    {
      name: "IP Public Gateway (CBN)",
      url: "http://103.28.160.42",
      displayUrl: "103.28.160.42",
      ip: "AS17995 Cyber 1 Kuningan",
      type: "ISP Dedicated 1G",
      ping: "4ms",
      pct: "100%",
    },
    {
      name: "MikroTik Core Router",
      url: "http://192.168.1.1",
      displayUrl: "192.168.1.1 (RouterOS)",
      ip: "RB1100AHx4 · L3 Gateway",
      type: "Hardware Core",
      ping: "1ms",
      pct: "99,98%",
    },
    {
      name: "HCM Gesit People",
      url: "https://people.gesit.co.id",
      displayUrl: "people.gesit.co.id",
      ip: "103.28.160.45",
      type: "HR System Web",
      ping: "22ms",
      pct: "99,95%",
    },
    {
      name: "Presensi Mobile API",
      url: "https://api-absen.gesit.co.id",
      displayUrl: "api-absen.gesit.co.id",
      ip: "103.28.160.48",
      type: "Mobile API",
      ping: "16ms",
      pct: "100%",
    },
    {
      name: "Website Alakasa",
      url: "https://alakasa.co.id",
      displayUrl: "alakasa.co.id",
      ip: "103.28.160.50",
      type: "Corporate Portal",
      ping: "28ms",
      pct: "99,90%",
    },
  ],
  networkSummary: {
    ipPublic: "103.28.160.42",
    isp: "PT Cyberindo Aditama (CBN)",
    bandwidth: "1 Gbps Dedicated",
    gatewayLocal: "192.168.1.1",
    routerModel: "MikroTik RB1100AHx4",
    supabaseHost: "yihjfrxdrhkqfnjofvua.supabase.co",
    dns: "1.1.1.1 / 8.8.8.8",
    vlans: [
      { id: "VLAN 10", name: "Management & CCTV", subnet: "192.168.10.0/24", active: 18 },
      { id: "VLAN 20", name: "Staff & Office Workstation", subnet: "192.168.20.0/24", active: 64 },
      { id: "VLAN 30", name: "Servers & Supabase Sync", subnet: "192.168.30.0/24", active: 12 },
      { id: "VLAN 60", name: "Guest WiFi Captive Portal", subnet: "192.168.60.0/24", active: 29 },
    ],
    webLinks: [
      { name: "GESIT PORTAL (IT Ops)", url: "https://it.gesit.co.id", desc: "Enterprise Work Platform SPA v4.1.2", ip: "103.28.160.42", status: "Online", ping: "18ms" },
      { name: "Supabase Cloud Project", url: "https://yihjfrxdrhkqfnjofvua.supabase.co", desc: "Database PostgreSQL 15, Auth & Realtime", ip: "AWS ap-southeast-1", status: "Online", ping: "24ms" },
      { name: "HCM Gesit People", url: "https://people.gesit.co.id", desc: "Sistem Penggajian & HR Karyawan", ip: "103.28.160.45", status: "Online", ping: "22ms" },
      { name: "Presensi Mobile Gesit", url: "https://api-absen.gesit.co.id", desc: "Backend Presensi GPS & Face Detection", ip: "103.28.160.48", status: "Online", ping: "16ms" },
      { name: "Website Alakasa", url: "https://alakasa.co.id", desc: "Portal Publik PT Alakasa Industrindo Tbk", ip: "103.28.160.50", status: "Online", ping: "28ms" },
      { name: "MikroTik RouterOS WebFig", url: "http://192.168.1.1", desc: "Konsol Admin Router Core Lt. 26", ip: "192.168.1.1", status: "Protected", ping: "1ms" },
    ],
  },
  recentLogs: [
    "PROGRESS DOC REPLACEMENT COPIER HP",
    "KORDINASI DOKUMEN KONTRAK COPIER HP (REPLACEMENT HP E786)",
    "DEVELOP ABSEN GESIT",
    "ARRANGE VISIT CCTV VENDOR SIRCON73",
    "CONCALL DENGAN PT GALVA UNTUK REPLACE UNIT COPIER",
    "DEVELOP SYSTEM CSL",
  ],
  purchaseCats: [
    { name: "Hardware", val: "Rp 250,2 Jt", pct: 100 },
    { name: "Subscription", val: "Rp 124,4 Jt", pct: 50 },
    { name: "IT Services", val: "Rp 17,2 Jt", pct: 7 },
    { name: "Cloud & Hosting", val: "Rp 3,5 Jt", pct: 2 },
    { name: "Accessories", val: "Rp 3,5 Jt", pct: 2 },
  ],
  purchaseDepts: [
    { name: "IT", val: "Rp 322,6 Jt", pct: 100 },
    { name: "BOC", val: "Rp 58,0 Jt", pct: 18 },
    { name: "Finance Acctg.", val: "Rp 17,0 Jt", pct: 5 },
    { name: "CSL", val: "Rp 1,4 Jt", pct: 1 },
    { name: "Trading", val: "Rp 1,3 Jt", pct: 1 },
  ],
};

/* ---------- ikon kecil ---------- */
const Chev = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
);
const MeetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"><rect x="2" y="6" width="13" height="12" rx="3" fill="#34a853" /><path d="M15 10.6 21 6.5v11L15 13.4z" fill="#1a73e8" /></svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const Plus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
const Check = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5 10-11" /></svg>
);
const ArrowR = () => (
  <svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="#98a2b3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6h22M19 1.8 23.2 6 19 10.2" /></svg>
);

const KPI_ICONS = [
  <svg key="k1" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2.5 2.5 0 0 0 0 5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2.5 2.5 0 0 0 0-5Z" /><path d="M13 6v2M13 11v2M13 16v2" /></svg>,
  <svg key="k2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#12805c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12.2 2.4 2.4 4.8-5" /></svg>,
  <svg key="k3" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b54708" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></svg>,
  <svg key="k4" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 8L9 4l-3 8H2" /></svg>,
];

/* ---------- blok arsitektur monitoring ---------- */
function ArchBox({
  name,
  sub,
  ip,
  link,
}: {
  name: string;
  sub: string;
  ip?: string;
  link?: string;
}) {
  return (
    <div className="arch-box">
      <div className="arch-bt">
        <b>{name}</b>
        <span className="adot" />
      </div>
      <span>{sub}</span>
      {ip && (
        <div className="arch-ip-badge">
          <code>{ip}</code>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="arch-ext-link"
              title={`Buka ${link}`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- heatmap aktivitas (pola deterministik) ---------- */
function Heatmap() {
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const cols: number[][] = [];
  for (let c = 0; c < 52; c++) {
    const col: number[] = [];
    const density = 0.25 + (c / 52) * 0.55;
    for (let r = 0; r < 7; r++) {
      const v = rnd();
      col.push(v > density ? 0 : v > density * 0.62 ? 1 : v > density * 0.38 ? 2 : v > density * 0.2 ? 3 : 4);
    }
    cols.push(col);
  }
  return (
    <div className="hm" id="heatmap">
      {cols.map((col, i) => (
        <div className="hm-col" key={i}>
          {col.map((lv, j) => (
            <span key={j} className={`hm-cell lv${lv}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- kalender Oktober 2026 ---------- */
const CAL_WEEKS: { d: string; kind: "" | "dim" | "today" | "dot" }[][] = [
  [{ d: "27", kind: "dim" }, { d: "28", kind: "dim" }, { d: "29", kind: "dim" }, { d: "30", kind: "dim" }, { d: "1", kind: "" }, { d: "2", kind: "" }, { d: "3", kind: "" }],
  [{ d: "4", kind: "" }, { d: "5", kind: "" }, { d: "6", kind: "" }, { d: "7", kind: "" }, { d: "8", kind: "" }, { d: "9", kind: "" }, { d: "10", kind: "" }],
  [{ d: "11", kind: "" }, { d: "12", kind: "" }, { d: "13", kind: "" }, { d: "14", kind: "" }, { d: "15", kind: "" }, { d: "16", kind: "" }, { d: "17", kind: "" }],
  [{ d: "18", kind: "" }, { d: "19", kind: "" }, { d: "20", kind: "" }, { d: "21", kind: "" }, { d: "22", kind: "" }, { d: "23", kind: "" }, { d: "24", kind: "" }],
  [{ d: "25", kind: "" }, { d: "26", kind: "today" }, { d: "27", kind: "dot" }, { d: "28", kind: "" }, { d: "29", kind: "" }, { d: "30", kind: "" }, { d: "31", kind: "" }],
  [{ d: "1", kind: "dim" }, { d: "2", kind: "dim" }, { d: "3", kind: "dim" }, { d: "4", kind: "dim" }, { d: "5", kind: "dim" }, { d: "6", kind: "dim" }, { d: "7", kind: "dim" }],
];

export default function DashboardIT({
  onNavigate,
  currentUser,
  userName,
  showTopbar = false,
}: {
  onNavigate?: (path: string) => void;
  currentUser?: any;
  userName?: string;
  showTopbar?: boolean;
  [key: string]: any;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);
  const { isDark, toggleTheme } = useGesitTheme();
  const [archTab, setArchTab] = useState<"arsitektur" | "peta" | "web">("arsitektur");
  const maxWeek = 42;

  const handleNav = (path: string) => {
    setOpenMenu(null);
    if (onNavigate) {
      const clean = path.startsWith('/') ? path.substring(1) : path;
      onNavigate(clean || 'dashboard');
    }
    navigate(path);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = currentUser?.fullName?.split(' ')[0] || userName || 'User';

  return (
    <div className="gesit-dash">
      {/* ================= BAR ATAS (fixed, kaca hanya di pil) ================= */}
      {showTopbar && (
        <div className="topbar">
          <div className="brand" onClick={() => handleNav('/')} style={{ cursor: 'pointer' }}>
            <img src="/image/logo.png" alt="Gesit" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
            Gesit Portal
          </div>
          <nav className="main" ref={menuRef}>
            <a
              className={location.pathname === '/' || location.pathname === '/dashboard' ? 'on' : ''}
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNav('/');
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>Dashboard
            </a>

            {MENU_ITEMS.slice(1).map((item) => (
              <div className="nav-item-wrap" key={item.id}>
                <a
                  href="#"
                  className={openMenu === item.id ? 'on' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenu(openMenu === item.id ? null : item.id);
                  }}
                >
                  {item.label} <Chev />
                </a>
                {openMenu === item.id && item.children && (
                  <div className="nav-dropdown">
                    {item.children.map((sub) => (
                      <a
                        key={sub.path}
                        href={sub.path}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNav(sub.path);
                        }}
                        className="nav-dropdown-item"
                      >
                        {sub.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="top-ic" onClick={() => handleNav('/announcements')} style={{ cursor: 'pointer' }} title="Pemberitahuan">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
          </div>
          <div className="top-ic" onClick={() => handleNav('/announcements')} style={{ cursor: 'pointer' }} title="Notifikasi">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></svg>
            <span className="dot" />
          </div>
          <button
            type="button"
            className="top-ic theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
          <div className="lang">EN</div>
          <div className="avatar" onClick={() => handleNav('/users')} style={{ cursor: 'pointer' }} title="Profil RS">{currentUser?.fullName?.slice(0, 2).toUpperCase() || DATA.user.initials}</div>
        </div>
      )}

      <main className="wrap">
        {/* ================= KOLOM UTAMA + REL ================= */}
        <div className="layout">
          <div>
            <div className="head">
              <div className="head-row">
                <div>
                  <h1>Selamat Siang, {displayName}</h1>
                  <p>Monitoring operasional IT — tiket, aktivitas tim, infrastruktur, dan layanan online dalam satu layar.</p>
                </div>
                <a className="btn-filter" href="#"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>Filter</a>
              </div>
            </div>

            {/* KPI */}
            <div className="kpis">
              {DATA.kpis.map((k, idx) => (
                <div className="card kpi" key={k.label}>
                  <div className="top">
                    <span className="ic" style={{ background: k.iconBg }}>
                      {KPI_ICONS[idx]}
                    </span>
                    {k.label}
                    <span className="chev"><Chev /></span>
                  </div>
                  <div className="num">{k.big}<small>{k.unit}</small></div>
                  <div className="delta">
                    <span style={{ color: k.accent, fontWeight: 800 }}>{k.note}</span>
                    <span className="kpi-tail"> · {k.note2}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* TREN AKTIVITAS + TIKET SEKILAS */}
            <div className="card">
              <div className="head2">
                <div>
                  <h3>Aktivitas IT — Tren Mingguan</h3>
                  <div className="legend">
                    <span><i style={{ background: "var(--blue)" }} />Aktivitas Masuk</span>
                    <span><i style={{ background: "var(--bar-done, #101828)" }} />Aktivitas Selesai</span>
                  </div>
                </div>
                <span className="mini-select">7 Hari Terakhir <Chev /></span>
              </div>
              <div className="flow-split">
                <div>
                  <div className="wk-chart">
                    {DATA.week.map((w) => (
                      <div className="wk" key={w.d}>
                        <div className="wk-bars">
                          <div className="wk-bar in" data-v={w.masuk} style={{ height: `${Math.round((w.masuk / maxWeek) * 100)}%` }} />
                          <div className="wk-bar done" data-v={w.selesai} style={{ height: `${Math.round((w.selesai / maxWeek) * 100)}%` }} />
                        </div>
                        <span>{w.d}</span>
                      </div>
                    ))}
                  </div>
                  <div className="axis-note">Jumlah aktivitas per hari — pola ilustratif mengikuti log aktivitas (total 364, selesai 350).</div>
                </div>
                <div className="tix-panel">
                  <div className="tix-title">Tiket Sekilas</div>
                  <div className="tix-stats">
                    <div className="tix-stat"><b>3</b><span>Total Masuk</span></div>
                    <div className="tix-stat"><b style={{ color: "var(--green)" }}>2</b><span>Selesai</span></div>
                    <div className="tix-stat"><b style={{ color: "var(--red)" }}>1</b><span>Terbuka</span></div>
                  </div>
                  <div className="tix-alert"><b>#TKT-4584</b> belum di-assign sejak 12 Sep 2026 — satu-satunya tiket terbuka saat ini.</div>
                  <a className="tix-link" href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Buka Ticketing Manager</a>
                </div>
              </div>
            </div>

            {/* QUEUE + STATUS */}
            <div className="row2">
              <div className="card">
                <div className="head2">
                  <div><h3>Queue Overview</h3><div className="sub">Antrean tiket helpdesk</div></div>
                  <div className="q-rt"><b>67%</b><span>tertangani</span></div>
                </div>
                <div className="q-top"><span>Tertangani <b style={{ color: "var(--ink)" }}>2 dari 3 tiket</b></span></div>
                <div className="slider"><div className="fill" style={{ width: "67%" }} /><div className="knob" style={{ left: "67%" }} /></div>
                <div className="q-scale"><span>0 tiket</span><span>3 tiket</span></div>
                <div className="q-remain">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f04438" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></svg>
                  <span>Sisa Antrean</span><b>1 Tiket</b>
                </div>
                <p className="fineprint">#TKT-4584 masih menunggu handler. Jaga antrean tanpa handler di bawah 1 hari kerja agar SLA 100% tetap terjaga.</p>
              </div>

              <div className="card">
                <div className="head2">
                  <div><h3>Status Tiket</h3><div className="sub">Distribusi semua tiket tercatat</div></div>
                  <span className="mini-select">Semua <Chev /></span>
                </div>
                <div className="donut-flex">
                  <div className="donut-box">
                    <svg viewBox="0 0 172 172" width="172" height="172">
                      <circle cx="86" cy="86" r="66" fill="none" stroke="var(--donut-track, #eef0f3)" strokeWidth="21" />
                      <circle cx="86" cy="86" r="66" fill="none" stroke="#2f6bff" strokeWidth="21" strokeLinecap="round" strokeDasharray="272 415" transform="rotate(-90 86 86)" />
                      <circle cx="86" cy="86" r="66" fill="none" stroke="var(--donut-dark, #101828)" strokeWidth="21" strokeLinecap="round" strokeDasharray="131 415" strokeDashoffset="-280" transform="rotate(-90 86 86)" />
                      <text x="86" y="80" textAnchor="middle" fontSize="21" fontWeight="800" fill="var(--ink, #101828)">3</text>
                      <text x="86" y="100" textAnchor="middle" fontSize="10.5" fill="var(--muted, #667085)">Total Tiket</text>
                    </svg>
                    <span className="pct-lab" style={{ left: -6, top: 26, color: "#2f6bff" }}>67%</span>
                    <span className="pct-lab" style={{ right: -8, top: 64 }}>33%</span>
                  </div>
                  <div className="dleg">
                    <div><i style={{ background: "#2f6bff" }} />Resolved<b>2</b></div>
                    <div><i style={{ background: "var(--donut-dark, #101828)" }} />Open<b>1</b></div>
                    <div><i style={{ background: "#f79009" }} />In Progress<b>0</b></div>
                    <div><i style={{ background: "#c9d2e0" }} />Pending<b>0</b></div>
                  </div>
                </div>
                <div className="rowline"><span>Kategori terbanyak</span><b>General</b></div>
                <div className="rowline"><span>CSAT</span><b>0/5</b></div>
              </div>
            </div>

            {/* MONITORING ONLINE — SYSTEM OVERVIEW */}
            <div className="card">
              <div className="head2">
                <div>
                  <h3>Monitoring Online</h3>
                  <div className="sub">System overview — IP public, gateway, backend Supabase, dan status layanan web GESIT PORTAL</div>
                </div>
                <span className="pill info" style={{ background: "var(--green-soft)", color: "var(--green)" }}><span className="pulse" />Semua Online</span>
              </div>

              {/* 4 Kartu Metrik Ringkas: IP Public, Supabase, MikroTik, Web Links */}
              <div className="mon-grid">
                <div className="mon">
                  <div className="top">
                    <div className="ic" style={{ background: "rgba(47, 107, 255, 0.12)", color: "#2f6bff" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    </div>
                    <span className="st">Online</span>
                  </div>
                  <div className="n">IP Public CBN</div>
                  <div className="d">
                    <a href="http://103.28.160.42" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700 }}>
                      103.28.160.42
                    </a> · Dedicated 1G
                  </div>
                  <div className="f">Latency 4ms · Cyber 1 JKT</div>
                </div>

                <div className="mon">
                  <div className="top">
                    <div className="ic" style={{ background: "rgba(18, 183, 106, 0.12)", color: "#12b76a" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                    </div>
                    <span className="st">Connected</span>
                  </div>
                  <div className="n">Supabase Cloud Hub</div>
                  <div className="d">
                    <a href="https://yihjfrxdrhkqfnjofvua.supabase.co" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700 }}>
                      yihjfrxdrhkq...supabase.co
                    </a>
                  </div>
                  <div className="f">PostgreSQL 15 · Latency 24ms</div>
                </div>

                <div className="mon">
                  <div className="top">
                    <div className="ic" style={{ background: "rgba(247, 144, 9, 0.12)", color: "#f79009" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
                    </div>
                    <span className="st">99,98%</span>
                  </div>
                  <div className="n">MikroTik Router Core</div>
                  <div className="d">
                    <a href="http://192.168.1.1" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700 }}>
                      192.168.1.1
                    </a> · RB1100AHX4
                  </div>
                  <div className="f">5 VLAN Active · CPU 14%</div>
                </div>

                <div className="mon">
                  <div className="top">
                    <div className="ic" style={{ background: "rgba(105, 65, 198, 0.12)", color: "#6941c6" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m10 15 5-3-5-3v6Z" /></svg>
                    </div>
                    <span className="st">100% SLA</span>
                  </div>
                  <div className="n">Layanan &amp; Web Aktif</div>
                  <div className="d">5 Portal Web Online</div>
                  <div className="f">Uptime 99.98% · Avg 142ms</div>
                </div>
              </div>

              {/* Panel System Overview dengan 3 Tab: Arsitektur, Peta Jaringan & IP, Link Web */}
              <div className="arch-wrap">
                <div className="arch-head">
                  <span className="arch-title">System Overview</span>
                  <span className="arch-tabs">
                    <a
                      className={archTab === "arsitektur" ? "on" : ""}
                      href="#"
                      onClick={(e) => { e.preventDefault(); setArchTab("arsitektur"); }}
                    >
                      Arsitektur Layanan
                    </a>
                    <a
                      className={archTab === "peta" ? "on" : ""}
                      href="#"
                      onClick={(e) => { e.preventDefault(); setArchTab("peta"); }}
                    >
                      Peta Jaringan &amp; IP
                    </a>
                    <a
                      className={archTab === "web" ? "on" : ""}
                      href="#"
                      onClick={(e) => { e.preventDefault(); setArchTab("web"); }}
                    >
                      Link Web &amp; Layanan
                    </a>
                  </span>
                </div>

                {archTab === "arsitektur" && (
                  <>
                    <div className="arch-flow">
                      <div className="arch-col">
                        <ArchBox name="Pengguna" sub="Web & Mobile App" ip="Multi-tenant Client" />
                      </div>
                      <div className="arch-arrow"><ArrowR /></div>
                      <div className="arch-col">
                        <ArchBox
                          name="GESIT PORTAL"
                          sub="it.gesit.co.id · SPA v4.1.2"
                          ip="IP: 103.28.160.42"
                          link="https://it.gesit.co.id"
                        />
                      </div>
                      <div className="arch-arrow"><ArrowR /></div>
                      <div className="arch-col">
                        <ArchBox name="Layanan Ticketing" sub="Helpdesk & antrean" link="/helpdesk" />
                        <ArchBox name="Layanan Activities" sub="Log aktivitas tim" link="/activity" />
                        <ArchBox name="Layanan Assets" sub="Inventaris & procurement" link="/assets" />
                      </div>
                      <div className="arch-arrow"><ArrowR /></div>
                      <div className="arch-col">
                        <ArchBox
                          name="PostgreSQL Database"
                          sub="Primary · Supabase Cloud"
                          ip="yihjfrxdrhkq...supabase.co"
                          link="https://yihjfrxdrhkqfnjofvua.supabase.co"
                        />
                        <ArchBox name="Realtime Hub" sub="WSS Active Sync · Port 443" ip="Realtime Channel" />
                        <ArchBox name="Storage S3 Bucket" sub="Lampiran & berkas digital" ip="Bucket Encrypted" />
                      </div>
                    </div>
                    <div className="arch-infra">
                      <span className="arch-infra-t">Infrastruktur</span>
                      <ArchBox
                        name="ISP CBN"
                        sub="Dedicated Fiber 1 Gbps"
                        ip="IP Public: 103.28.160.42"
                        link="http://103.28.160.42"
                      />
                      <div className="arch-arrow"><ArrowR /></div>
                      <ArchBox
                        name="MikroTik RB1100AHX4"
                        sub="Router utama · L3 Managed"
                        ip="Local: 192.168.1.1"
                        link="http://192.168.1.1"
                      />
                      <div className="arch-arrow"><ArrowR /></div>
                      <ArchBox
                        name="Switch & Access Point"
                        sub="5 node NetVision · VLAN 10/20/30/60"
                        ip="Trunk SFP+ Active"
                      />
                    </div>
                  </>
                )}

                {archTab === "peta" && (
                  <div className="net-view-grid">
                    <div className="net-node-box">
                      <div className="net-node-head">
                        <b>Gateway &amp; IP Public (WAN)</b>
                        <span className="net-node-badge">ISP CBN</span>
                      </div>
                      <div className="net-node-row"><span>IP Public Utama</span><code>103.28.160.42</code></div>
                      <div className="net-node-row"><span>Gateway ISP</span><code>103.28.160.41</code></div>
                      <div className="net-node-row"><span>Subnet WAN</span><code>255.255.255.248 (/29)</code></div>
                      <div className="net-node-row"><span>AS Number</span><code>AS17995 (Cyber 1 Kuningan)</code></div>
                      <div className="net-node-row"><span>Bandwidth Uplink</span><code>1 Gbps Symmetrical</code></div>
                      <div className="net-node-row"><span>DNS Resolvers</span><code>1.1.1.1 / 8.8.8.8</code></div>
                    </div>

                    <div className="net-node-box">
                      <div className="net-node-head">
                        <b>Core Router (LAN / L3)</b>
                        <span className="net-node-badge" style={{ background: "var(--green-soft)", color: "var(--green)" }}>MikroTik</span>
                      </div>
                      <div className="net-node-row"><span>Hardware Model</span><code>RB1100AHx4 Dude Ed.</code></div>
                      <div className="net-node-row"><span>IP Gateway Local</span><code>192.168.1.1</code></div>
                      <div className="net-node-row"><span>DHCP Server</span><code>Active · Lease Time 12h</code></div>
                      <div className="net-node-row"><span>Firewall NAT</span><code>Masquerade to 103.28.160.42</code></div>
                      <div className="net-node-row"><span>CPU Load / Temp</span><code>14% · 38°C (Normal)</code></div>
                      <div className="net-node-row"><span>Uptime System</span><code>48 hari 14 jam</code></div>
                    </div>

                    <div className="net-node-box">
                      <div className="net-node-head">
                        <b>Segmentasi VLAN Kantor</b>
                        <span className="net-node-badge" style={{ background: "rgba(247, 144, 9, 0.12)", color: "#f79009" }}>4 Subnet</span>
                      </div>
                      {DATA.networkSummary.vlans.map((v) => (
                        <div className="net-node-row" key={v.id}>
                          <span><b>{v.id}</b> · {v.name}</span>
                          <code>{v.subnet} ({v.active} host)</code>
                        </div>
                      ))}
                    </div>

                    <div className="net-node-box">
                      <div className="net-node-head">
                        <b>Supabase Cloud &amp; Database Endpoint</b>
                        <span className="net-node-badge" style={{ background: "rgba(105, 65, 198, 0.12)", color: "#6941c6" }}>Cloud DB</span>
                      </div>
                      <div className="net-node-row"><span>Project Endpoint</span><code>yihjfrxdrhkq...supabase.co</code></div>
                      <div className="net-node-row"><span>Region Cluster</span><code>AWS ap-southeast-1 (Singapore)</code></div>
                      <div className="net-node-row"><span>Engine Version</span><code>PostgreSQL 15.6 / PostgREST 12</code></div>
                      <div className="net-node-row"><span>Realtime Engine</span><code>WSS / Realtime v2.28</code></div>
                      <div className="net-node-row"><span>Database Latency</span><code>~24ms (Avg RTT)</code></div>
                      <div className="net-node-row"><span>SSL Security</span><code>TLS 1.3 / Strict RLS Enabled</code></div>
                    </div>
                  </div>
                )}

                {archTab === "web" && (
                  <div className="web-table-wrap">
                    <table className="web-table">
                      <thead>
                        <tr>
                          <th>LAYANAN &amp; LINK WEB</th>
                          <th>IP / HOST ADDRESS</th>
                          <th>KETERANGAN</th>
                          <th>STATUS</th>
                          <th style={{ textAlign: "right" }}>LATENSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DATA.networkSummary.webLinks.map((wl) => (
                          <tr key={wl.name}>
                            <td>
                              <div className="web-link-col">
                                <a
                                  href={wl.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="web-link-anchor"
                                >
                                  {wl.name}
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                </a>
                                <span className="web-link-desc">{wl.desc}</span>
                              </div>
                            </td>
                            <td>
                              <code>{wl.ip}</code>
                            </td>
                            <td>
                              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{wl.url}</span>
                            </td>
                            <td>
                              <span className="pill info" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
                                <span className="pulse" />
                                {wl.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "var(--blue)" }}>
                              {wl.ping}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Panel Bawah: System Status Table & Response / Error Charts */}
              <div className="mon-b">
                <div className="st-card">
                  <div className="st-head">
                    <h4>System Status</h4>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNav('/network'); }}>View All</a>
                  </div>
                  {DATA.systemStatus.map((s) => (
                    <div className="st-row" key={s.name}>
                      <span className="st-ck"><Check /></span>
                      <div className="st-info">
                        <div className="st-name-wrap">
                          <span className="st-n">{s.name}</span>
                          {s.url && (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="st-link"
                              title={`Buka ${s.url}`}
                            >
                              {s.displayUrl || s.url}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            </a>
                          )}
                        </div>
                        <div className="st-sub-meta">
                          <span className="st-ip-tag">{s.ip}</span>
                          <span className="st-type-tag">{s.type}</span>
                        </div>
                      </div>
                      <div className="st-right-meta">
                        <span className="st-op">{s.ping}</span>
                        <span className="st-pct">{s.pct}</span>
                      </div>
                    </div>
                  ))}
                  <div className="st-foot">Diperbarui realtime &middot; sinkronisasi Supabase aktif</div>
                </div>
                <div className="charts2">
                  <div className="chart-box">
                    <div className="chart-head"><h4>Response Time</h4><span className="chart-sel">Last 24 Hours</span><span className="chart-badge">5m</span></div>
                    <svg className="chart-svg" viewBox="0 0 300 96" preserveAspectRatio="none">
                      <g stroke="#e4e9f2" strokeWidth="1"><line x1="0" y1="18" x2="300" y2="18" /><line x1="0" y1="48" x2="300" y2="48" /><line x1="0" y1="78" x2="300" y2="78" /></g>
                      <path d="M0,62 C25,58 40,66 60,60 C85,52 95,40 120,44 C145,48 155,30 180,34 C205,38 215,55 240,52 C262,49 280,44 300,46" fill="none" stroke="#2f6bff" strokeWidth="2.2" strokeLinecap="round" />
                      <circle cx="292" cy="46" r="3.4" fill="#2f6bff" />
                    </svg>
                    <div className="chart-val" style={{ color: "#2f6bff" }}>142ms <span>rata-rata</span></div>
                    <div className="chart-x"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span></div>
                    <div className="chart-cap">Average Response Time (ms)</div>
                  </div>
                  <div className="chart-box">
                    <div className="chart-head"><h4>Error Rate</h4><span className="chart-sel">Last 24 Hours</span><span className="chart-badge">5m</span></div>
                    <svg className="chart-svg" viewBox="0 0 300 96" preserveAspectRatio="none">
                      <g stroke="#e4e9f2" strokeWidth="1"><line x1="0" y1="18" x2="300" y2="18" /><line x1="0" y1="48" x2="300" y2="48" /><line x1="0" y1="78" x2="300" y2="78" /></g>
                      <path d="M0,80 C30,78 50,82 75,79 C100,76 115,80 140,77 C165,74 180,79 205,76 C230,73 255,78 300,75" fill="none" stroke="#6941c6" strokeWidth="2.2" strokeLinecap="round" />
                      <circle cx="292" cy="75" r="3.4" fill="#6941c6" />
                    </svg>
                    <div className="chart-val" style={{ color: "#6941c6" }}>0,02% <span>dari total request</span></div>
                    <div className="chart-x"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span></div>
                    <div className="chart-cap">Error Rate (%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>{/* /kolom utama */}

          {/* ================= REL KANAN ================= */}
          <aside className="rail">
            <div className="card">
              <div className="rail-head"><h3>Kartu Operasional IT</h3><a href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>+ Tiket</a></div>
              <div className="mycard">
                <div className="who"><span className="av">RS</span>Rudi (IT Team)
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                </div>
                <div className="bal-label">SLA Compliance</div>
                <div className="bal">100%</div>
                <div className="stack">
                  <span style={{ background: "#f79009" }}>B</span><span style={{ background: "#2f6bff" }}>RS</span><span style={{ background: "#12b76a" }}>A</span>
                </div>
                <div className="mc-cap">3 Handler — Bendry · Rudi · Administrator</div>
                <div className="mc-stats">
                  <div><b>2</b><span>Tiket Selesai</span></div>
                  <div><b>0,3 Jam</b><span>Rata-rata Resolusi</span></div>
                  <div><b>90%</b><span>Target SLA</span></div>
                </div>
                <div className="mc-txhead"><span>Tiket terakhir</span><a href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Lihat Semua</a></div>
                <div className="last-tx">
                  <span className="tic"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7db4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2.5 2.5 0 0 0 0 5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2.5 2.5 0 0 0 0-5Z" /><path d="M13 6v2M13 11v2M13 16v2" /></svg></span>
                  <div><div className="t">K. Nisa Oktafiani</div><div className="d">#TKT-6087 · 15 Apr 2026</div></div>
                  <span className="amt">Selesai</span>
                </div>
              </div>
              <div className="rail-btns">
                <a className="btn-white" href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Lihat Antrean</a>
                <a className="btn-black" href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Tiket Baru</a>
              </div>
            </div>

            <div className="card">
              <div className="rail-head"><h3>Perlu Perhatian</h3><a href="#">Pengingat</a></div>
              <div className="rem-item">
                <span className="ric" style={{ background: "#f04438" }}>!</span>
                <div><div className="t">#TKT-4584 Belum Di-assign</div><div className="d">Reset password Email · Desi Rahmuni</div></div>
                <span className="amt" style={{ color: "var(--red)" }}>44 hari</span>
              </div>
              <div className="rem-item">
                <span className="ric" style={{ background: "#f79009" }}>HA</span>
                <div><div className="t">14 Aktivitas High Alert</div><div className="d">Masih berjalan · pantau prioritas tim</div></div>
                <span className="amt">Proses</span>
              </div>
              <div className="rem-item">
                <span className="ric" style={{ background: "#2f6bff" }}>CS</span>
                <div><div className="t">CSAT Belum Ada Rating</div><div className="d">0 respons kepuasan dari pengguna</div></div>
                <span className="amt">0/5</span>
              </div>
              <div className="rem-item">
                <span className="ric" style={{ background: "#6941c6" }}>PL</span>
                <div><div className="t">Planner Minggu Ini Kosong</div><div className="d">0 event · 26–31 Okt 2026</div></div>
                <span className="amt">Cek</span>
              </div>
              <p className="fineprint" style={{ borderTop: 0, paddingTop: 4 }}>Pengingat otomatis terkirim sebelum tiket melewati SLA 24 jam.</p>
            </div>

            <div className="card">
              <div className="rail-head"><h3>Aktivitas Terakhir</h3><a href="#" onClick={(e) => { e.preventDefault(); handleNav('/activity'); }}>Lihat Semua</a></div>
              <div style={{ marginTop: 2 }}>
                <div className="log-item">PROGRESS DOC REPLACEMENT COPIER HP</div>
                <div className="log-item">DEVELOP ABSEN GESIT</div>
                <div className="log-item">ARRANGE VISIT CCTV VENDOR SIRCON73</div>
                <div className="log-item">DEVELOP SYSTEM CSL</div>
              </div>
              <div className="rowline" style={{ marginTop: 8 }}><span>Aktivitas selesai</span><b>350 dari 364</b></div>
              <div className="prog"><i style={{ width: "96%" }} /></div>
            </div>
          </aside>
        </div>{/* /layout */}

        {/* ================= JADWAL MEETING ================= */}
        <div className="r-detail" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card sched-card">
            <div className="sched">
              <div className="cal-pane">
                <div className="cal-head"><h3>Jadwal Meeting</h3><a className="btn-new" href="#" onClick={(e) => { e.preventDefault(); handleNav('/weekly'); }}><Plus />Buat Baru</a></div>
                <div className="cal-nav">
                  <a className="cal-arrow" href="#"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 6-6 6 6 6" /></svg></a>
                  <span className="cal-my"><span className="cal-month">October <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg></span><span className="cal-year">2026</span></span>
                  <a className="cal-arrow" href="#"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.5 6 6 6-6 6" /></svg></a>
                </div>
                <div className="cal-grid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((h) => (
                    <div className="cal-h" key={h}>{h}</div>
                  ))}
                  {CAL_WEEKS.flat().map((c, i) => (
                    <div key={i} className={`cal-d ${c.kind === "dim" ? "dim" : ""}`}>
                      {c.kind === "today" ? <span className="today">{c.d}</span> : c.d}
                      {(c.kind === "today" || c.kind === "dot") && <i className="cdot" />}
                    </div>
                  ))}
                </div>
                <p className="sched-note">Contoh tampilan — data asli mengalir dari Google Calendar yang disiapkan di backend.</p>
              </div>
              <div className="meet-pane">
                {DATA.meetings.map((m) => (
                  <div className="meet2" key={m.title}>
                    <div className="meet2-day">{m.day}</div>
                    <div className="meet2-top"><b>{m.title}</b><span className="meet2-dots">•••</span></div>
                    <div className="meet2-loc"><MeetIcon /><span>{m.loc}</span></div>
                    <div className="meet2-bot"><span className="tag2">{m.tag}</span><span className="meet2-time"><ClockIcon /> {m.time}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= TASK + RECENT LOGS ================= */}
        <div className="r-detail" style={{ gridTemplateColumns: "5fr 7fr" }}>
          <div className="card">
            <div className="head2">
              <div><h3>Task Update</h3><div className="sub">Tugas operasional IT hari ini</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <a href="#" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--blue)" }}>Lihat Semua</a>
                <a className="btn-new" href="#"><Plus />Tugas Baru</a>
              </div>
            </div>
            <div className="task-list">
              {DATA.tasks.map((t) => (
                <div className={`task-row ${t.state !== "todo" ? "done" : ""}`} key={t.title}>
                  <span className="drag"><i /><i /><i /><i /><i /><i /></span>
                  {t.state === "todo" ? <span className="cb" /> : <span className={`cb on-${t.state}`}><Check /></span>}
                  <span className="task-t">{t.title}</span><span className="task-time">{t.time}</span>
                  <span className="task-del"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6.5 7l1 13h9l1-13" /></svg></span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="head2">
              <div><h3>Recent Logs</h3><div className="sub">Aktivitas terakhir yang tercatat</div></div>
              <span className="mini-select">Semua</span>
            </div>
            <div style={{ marginTop: 6 }}>
              {DATA.recentLogs.map((l) => (
                <div className="log-item" key={l}>{l}</div>
              ))}
            </div>
            <div className="rowline" style={{ marginTop: 12 }}><span>Total aktivitas tercatat</span><b>364</b></div>
            <div className="rowline"><span>Selesai</span><b>350 (96%)</b></div>
            <div className="prog"><i style={{ width: "96%" }} /></div>
          </div>
        </div>

        {/* ================= PLATFORM ACTIVITY ================= */}
        <div className="r-detail" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card">
            <div className="head2">
              <div><h3>Platform Activity</h3><div className="sub">Intensitas aktivitas tim di portal — 12 bulan terakhir</div></div>
              <span className="mini-select">Last 12 M</span>
            </div>
            <div className="hm-months"><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div>
            <Heatmap />
            <div className="hm-foot"><span>Pola mengikuti screenshot portal — data harian mengikuti log aktivitas.</span><span className="hm-legend">Less <i className="hm-cell lv0" /> <i className="hm-cell lv1" /> <i className="hm-cell lv2" /> <i className="hm-cell lv3" /> <i className="hm-cell lv4" /> More</span></div>
          </div>
        </div>

        {/* ================= PURCHASE + INVENTORY ================= */}
        <div className="r-detail">
          <div className="card">
            <div className="head2">
              <div><h3>Purchase Record</h3><div className="sub">Ringkasan keuangan pengadaan — semua departemen</div></div>
              <span className="mini-select">Semua Waktu</span>
            </div>
            <div className="fin-kpis">
              <div className="fin-kpi"><span>Disbursed</span><b>Rp 401,9 Jt</b></div>
              <div className="fin-kpi"><span>Total Records</span><b>71</b></div>
              <div className="fin-kpi"><span>Liability</span><b>Rp 0</b></div>
            </div>
            <div className="fin-cols">
              <div>
                <div className="fin-h">Top Categories</div>
                {DATA.purchaseCats.map((c) => (
                  <div className="bar-row" key={c.name}><span className="bl">{c.name}</span><div className="bar"><i style={{ width: `${c.pct}%` }} /></div><span className="bv">{c.val}</span></div>
                ))}
              </div>
              <div>
                <div className="fin-h">Department Spend</div>
                {DATA.purchaseDepts.map((d) => (
                  <div className="bar-row dark" key={d.name}><span className="bl">{d.name}</span><div className="bar"><i style={{ width: `${d.pct}%` }} /></div><span className="bv">{d.val}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="head2">
              <div><h3>Inventory</h3><div className="sub">Komposisi 334 aset terdaftar</div></div>
            </div>
            <div className="donut-flex" style={{ marginTop: 14 }}>
              <div className="donut" style={{ width: 148, height: 148 }}>
                <svg width="148" height="148" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="52" fill="none" stroke="var(--donut-track, #eaecf0)" strokeWidth="15" />
                  <circle cx="64" cy="64" r="52" fill="none" stroke="#2f6bff" strokeWidth="15" strokeDasharray="101.7 326.7" transform="rotate(-90 64 64)" />
                  <circle cx="64" cy="64" r="52" fill="none" stroke="#12b76a" strokeWidth="15" strokeDasharray="91.9 326.7" strokeDashoffset="-101.7" transform="rotate(-90 64 64)" />
                  <circle cx="64" cy="64" r="52" fill="none" stroke="#f79009" strokeWidth="15" strokeDasharray="26.4 326.7" strokeDashoffset="-193.6" transform="rotate(-90 64 64)" />
                  <circle cx="64" cy="64" r="52" fill="none" stroke="var(--donut-dark, #101828)" strokeWidth="15" strokeDasharray="11.7 326.7" strokeDashoffset="-220" transform="rotate(-90 64 64)" />
                  <circle cx="64" cy="64" r="52" fill="none" stroke="var(--donut-other, #d0d5dd)" strokeWidth="15" strokeDasharray="94.9 326.7" strokeDashoffset="-231.7" transform="rotate(-90 64 64)" />
                </svg>
                <div className="donut-c"><b style={{ fontSize: 24 }}>334</b><span>Total</span></div>
              </div>
              <ul className="dlegend">
                <li><i style={{ background: "#2f6bff" }} />Laptop<b>104</b></li>
                <li><i style={{ background: "#12b76a" }} />Other<b>94</b></li>
                <li><i style={{ background: "#f79009" }} />Monitor<b>27</b></li>
                <li><i style={{ background: "var(--donut-dark, #101828)" }} />Computer<b>12</b></li>
                <li><i style={{ background: "var(--donut-other, #d0d5dd)" }} />Kategori lain<b>97</b></li>
              </ul>
            </div>
            <div className="rowline" style={{ marginTop: 14 }}><span>Dalam produksi</span><b>313 aset</b></div>
            <div className="rowline"><span>Stok standby</span><b>11 aset</b></div>
          </div>
        </div>

        <div className="foot">
          <span>© 2026 The Gesit Companies · GESIT Portal · Mockup Dashboard IT — tata letak &amp; tipografi mengikuti referensi Ketua; angka dari snapshot portal 26 Okt 2026, pola grafik &amp; heatmap ilustratif.</span>
          <span><span style={{ color: "#12b76a" }}>●</span> Online&nbsp;&nbsp;|&nbsp;&nbsp;v4.1.2</span>
        </div>
      </main>
    </div>
  );
}

export { DashboardIT };

