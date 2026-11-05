import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Calendar, 
  Star, 
  Check as CheckIcon, 
  AlertCircle, 
  Server, 
  Activity, 
  Wifi, 
  CircleCheck, 
  ShieldCheck, 
  RefreshCw, 
  Globe, 
  ArrowUpRight, 
  Zap, 
  Cpu,
  Database as DatabaseIcon
} from "lucide-react";
import { useGesitTheme } from "../lib/useGesitTheme";
import { supabase } from "../lib/supabaseClient";
import { isGoogleConnected, ensureGoogleConnected, fetchEventsForMonth, signInWithGoogle } from "../lib/googleCalendar";
import { StatCard } from "./StatCard";
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
      displayUrl: "supabase.co (REST v1)",
      ip: "AWS ap-southeast-1",
      type: "Database / Auth",
      ping: "24ms",
      pct: "99,99%",
    },
    {
      name: "Supabase Realtime Hub",
      url: "wss://yihjfrxdrhkqfnjofvua.supabase.co/realtime/v1",
      displayUrl: "supabase.co (WSS Stream)",
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

const DEFAULT_FALLBACK_ACTIVITIES = [
  {
    id: 1,
    activity_name: "Progress doc replacement copier HP",
    category: "Procurement",
    requester: "Rudi",
    department: "IT",
    it_personnel: "Bendry",
    type: "Minor",
    status: "Done",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    activity_name: "Develop Absen Gesit (Mobile Presensi & GPS)",
    category: "Development",
    requester: "Rudi Siarudin",
    department: "IT",
    it_personnel: "Rudi",
    type: "Major",
    status: "In Progress",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 3,
    activity_name: "Arrange visit CCTV vendor Sircon73",
    category: "Infrastructure",
    requester: "Desi",
    department: "Finance & GA",
    it_personnel: "Bendry",
    type: "Minor",
    status: "In Progress",
    created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
  {
    id: 4,
    activity_name: "Kordinasi dokumen kontrak copier HP (Replacement HP E786)",
    category: "Procurement",
    requester: "Sylvia",
    department: "BOC",
    it_personnel: "Rudi",
    type: "Minor",
    status: "Done",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 5,
    activity_name: "Concall dengan PT Galva untuk replace unit copier",
    category: "Procurement",
    requester: "Rudi",
    department: "IT",
    it_personnel: "Rudi",
    type: "Minor",
    status: "Done",
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: 6,
    activity_name: "Develop System CSL Operations & Portal",
    category: "Development",
    requester: "Puji",
    department: "CSL",
    it_personnel: "Rudi",
    type: "Major",
    status: "Done",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

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

/* ---------- heatmap aktivitas (pola riil 52 minggu x 7 hari) ---------- */
function Heatmap({ activityLogs }: { activityLogs?: any[] }) {
  const { isDark } = useGesitTheme();
  // Hitung distribusi tanggal aktivitas nyata jika ada
  const logDateMap: Record<string, number> = {};
  if (activityLogs && activityLogs.length > 0) {
    activityLogs.forEach((l) => {
      if (l.created_at) {
        const dStr = l.created_at.slice(0, 10);
        logDateMap[dStr] = (logDateMap[dStr] || 0) + 1;
      }
    });
  }

  // Generate 52 minggu (12 bulan ke belakang)
  const cols = useMemo(() => {
    let seed = 42;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const result: number[][] = [];
    const hasRealLogs = Object.keys(logDateMap).length > 0;
    const today = new Date();

    for (let c = 51; c >= 0; c--) {
      const col: number[] = [];
      const density = 0.35 + ((51 - c) / 51) * 0.45;
      for (let r = 0; r < 7; r++) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - (c * 7 + (6 - r)));
        const dStr = targetDate.toISOString().slice(0, 10);

        if (hasRealLogs && logDateMap[dStr] !== undefined) {
          const count = logDateMap[dStr];
          col.push(count >= 5 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0);
        } else {
          const v = rnd();
          col.push(v > density ? 0 : v > density * 0.65 ? 1 : v > density * 0.4 ? 2 : v > density * 0.2 ? 3 : 4);
        }
      }
      result.push(col);
    }
    return result;
  }, [activityLogs]);

  return (
    <div className="hm" id="heatmap" style={{ display: "flex", gap: "3px", width: "100%", justifyContent: "space-between", margin: "10px 0" }}>
      {cols.map((col, i) => (
        <div className="hm-col" key={i} style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
          {col.map((lv, j) => (
            <span
              key={j}
              className={`hm-cell lv${lv}`}
              style={{
                width: "100%",
                height: "10px",
                minHeight: "10px",
                borderRadius: "2px",
                display: "block",
                backgroundColor:
                  lv === 4
                    ? "#12805c"
                    : lv === 3
                    ? "#2fbb71"
                    : lv === 2
                    ? "#71d69c"
                    : lv === 1
                    ? "#b9e8cd"
                    : (isDark ? "rgba(255, 255, 255, 0.08)" : "#ebedf0"),
              }}
            />
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

  // Dynamic Theme Colors (Threads System: Dark vs Light)
  const modalBg = isDark ? "#101010" : "#ffffff";
  const modalBorder = isDark ? "1px solid #1e1e1e" : "1px solid rgba(0, 0, 0, 0.12)";
  const modalTitleColor = isDark ? "#f3f5f7" : "#000000";
  const modalSubColor = isDark ? "#777777" : "#6B7280";
  const modalTabBg = isDark ? "#0a0a0a" : "#f4f4f5";
  const modalItemBg = isDark ? "#141414" : "#f9fafb";
  const inputBg = isDark ? "#000000" : "#ffffff";
  const inputBorder = isDark ? "1px solid #2a2a2a" : "1px solid #e4e4e7";
  const inputColor = isDark ? "#ffffff" : "#000000";
  const cancelBtnBorder = isDark ? "1px solid #333333" : "1px solid #e4e4e7";
  const cancelBtnColor = isDark ? "#aaaaaa" : "#6B7280";

  const [archTab, setArchTab] = useState<"arsitektur" | "peta" | "web">("arsitektur");
  const maxWeek = 42;

  // State Konfigurasi Monitoring Online (Editable & Stored in LocalStorage)
  const [monTopCards, setMonTopCards] = useState(() => {
    const saved = localStorage.getItem("gesit_dash_mon_top");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: "1", label: "IP Public CBN", value: "103.28.160.42", sub: "Dedicated 1G", note: "Latency 4ms · Cyber 1 JKT", status: "Online", url: "http://103.28.160.42", color: "#2f6bff" },
      { id: "2", label: "Supabase Cloud Hub", value: "yihjfrxdrhkq...supabase.co", sub: "", note: "PostgreSQL 15 · Latency 24ms", status: "Connected", url: "https://yihjfrxdrhkqfnjofvua.supabase.co", color: "#12b76a" },
      { id: "3", label: "MikroTik Router Core", value: "192.168.1.1", sub: "RB1100AHX4", note: "5 VLAN Active · CPU 14%", status: "99,98%", url: "http://192.168.1.1", color: "#f79009" },
      { id: "4", label: "Layanan & Web Aktif", value: "5 Portal Web Online", sub: "", note: "Uptime 99.98% · Avg 142ms", status: "100% SLA", url: "", color: "#6941c6" },
    ];
  });

  const [monWebLinks, setMonWebLinks] = useState(() => {
    const saved = localStorage.getItem("gesit_dash_mon_links");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DATA.networkSummary.webLinks;
  });

  const [monSystemStatus, setMonSystemStatus] = useState(() => {
    const saved = localStorage.getItem("gesit_dash_mon_systems");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DATA.systemStatus;
  });

  const [monVlans, setMonVlans] = useState(() => {
    const saved = localStorage.getItem("gesit_dash_mon_vlans");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DATA.networkSummary.vlans;
  });

  const [isEditMonOpen, setIsEditMonOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<"cards" | "links" | "systems" | "vlans">("systems");
  const [isPinging, setIsPinging] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<string>("Realtime");
  const [liveSupabasePing, setLiveSupabasePing] = useState<number | null>(null);
  const [realAvgPing, setRealAvgPing] = useState<number>(142);
  const [realErrorRate, setRealErrorRate] = useState<string>("0,02");
  const [dbSysLogs, setDbSysLogs] = useState<any[]>([]);

  // Metrik dan kalkulasi kurva SVG dinamis berbasis data riil
  const monMetrics = useMemo(() => {
    // 1. Layanan inti internal / cloud database (Supabase, MikroTik, CBN)
    const coreServices = monSystemStatus.filter((s: any) => 
      s.id?.includes("supabase") || s.id?.includes("mikrotik") || s.id?.includes("cbn")
    );
    const corePings = coreServices.map((s: any) => parseInt(s.ping) || 15);
    const coreAvg = corePings.length > 0 
      ? Math.round(corePings.reduce((a: number, b: number) => a + b, 0) / corePings.length) 
      : (liveSupabasePing || 14);

    // 2. Rata-rata keseluruhan
    const allPings = monSystemStatus.map((s: any) => parseInt(s.ping) || 15);
    const allAvg = allPings.length > 0 
      ? Math.round(allPings.reduce((a: number, b: number) => a + b, 0) / allPings.length) 
      : realAvgPing;

    // 3. Status ketersediaan saat ini
    const offlineCount = monSystemStatus.filter((s: any) => s.status === "offline").length;
    const onlineCount = monSystemStatus.length - offlineCount;

    // Spektrum Latensi per Segmen
    const dbPing = liveSupabasePing || parseInt(monSystemStatus.find((s: any) => s.id === "supabase_api")?.ping) || 13;
    const networkPing = parseInt(monSystemStatus.find((s: any) => s.id === "mikrotik_router" || s.id === "cbn_gateway")?.ping) || 1;
    const appServices = monSystemStatus.filter((s: any) => 
      s.id === "gesit_portal" || s.id === "presensi_api" || s.id === "hcm_people"
    );
    const appPings = appServices.map((s: any) => parseInt(s.ping) || 140);
    const appAvg = appPings.length > 0 ? Math.round(appPings.reduce((a: number, b: number) => a + b, 0) / appPings.length) : 151;

    const extServices = monSystemStatus.filter((s: any) => s.id === "alakasa_web");
    const extPing = extServices.length > 0 ? (parseInt(extServices[0].ping) || 801) : 801;

    return {
      coreAvg,
      allAvg,
      offlineCount,
      onlineCount,
      dbPing,
      networkPing,
      appAvg,
      extPing,
      totalLogsCount: dbSysLogs.length,
    };
  }, [monSystemStatus, dbSysLogs, liveSupabasePing, realAvgPing]);

  const testLivePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const baseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "https://yihjfrxdrhkqfnjofvua.supabase.co";
      const res = await fetch(`${baseUrl}/rest/v1/`, {
        method: "HEAD",
        headers: { "apikey": (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "" },
        cache: "no-store",
      });
      const duration = Math.max(1, Math.round(performance.now() - start));
      setLiveSupabasePing(duration);
      const nowStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      setLastPingTime(nowStr);

      // Simpan hasil pengukuran aktual ke Supabase database
      await supabase.from("system_monitoring").update({
        ping_ms: duration,
        status: res.status < 500 ? "online" : "degraded",
        last_checked_at: new Date().toISOString()
      }).eq("id", "supabase_api");

      await supabase.from("system_monitoring_logs").insert([{
        service_id: "supabase_api",
        ping_ms: duration,
        status_code: res.status,
        is_success: res.status < 500,
        created_at: new Date().toISOString()
      }]);

      // Tes live ping ke services yang punya URL web dari browser
      const webChecks = monSystemStatus.filter((s: any) => s.url && s.url.startsWith("http") && s.id !== "supabase_api");
      await Promise.all(
        webChecks.map(async (s: any) => {
          const t0 = performance.now();
          try {
            await fetch(s.url, { mode: "no-cors", cache: "no-store" });
            const d = Math.max(1, Math.round(performance.now() - t0));
            await supabase.from("system_monitoring").update({
              ping_ms: d,
              status: d < 1500 ? "online" : "degraded",
              uptime_pct: d < 1500 ? 100 : 99.8,
              last_checked_at: new Date().toISOString()
            }).eq("id", s.id);
          } catch (_) {
            // ignore
          }
        })
      );

      // Ambil kembali data terbaru dari Supabase
      const { data: updated } = await supabase.from("system_monitoring").select("*").order("display_order");
      if (updated && updated.length > 0) {
        setMonSystemStatus(updated.map((s: any) => ({
          id: s.id,
          name: s.name,
          url: s.url,
          displayUrl: s.display_url || s.url,
          ip: s.ip,
          type: s.service_type,
          ping: s.ping_ms > 0 ? `${s.ping_ms}ms` : "1ms",
          pct: `${s.uptime_pct}%`,
          status: s.status,
          lastChecked: s.last_checked_at
        })));
      }
    } catch {
      const duration = Math.max(1, Math.round(performance.now() - start));
      setLiveSupabasePing(duration);
      setLastPingTime(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    } finally {
      setIsPinging(false);
    }
  };

  const avgPingValue = useMemo(() => {
    if (!monSystemStatus || monSystemStatus.length === 0) return 17;
    const total = monSystemStatus.reduce((acc: number, s: any) => {
      const num = parseInt(s.ping) || 15;
      return acc + num;
    }, 0);
    return Math.round(total / monSystemStatus.length);
  }, [monSystemStatus]);

  const [isSavingMon, setIsSavingMon] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const saveTimeoutRef = useRef<any>(null);

  const extractDomain = (urlStr: string) => {
    if (!urlStr) return "";
    try {
      const withProto = urlStr.startsWith("http://") || urlStr.startsWith("https://") ? urlStr : `https://${urlStr}`;
      return new URL(withProto).hostname;
    } catch (_) {
      return urlStr.replace(/^https?:\/\//i, "").split("/")[0];
    }
  };

  const saveMonConfigToSupabase = async (
    overrideSystems?: any[],
    overrideLinks?: any[],
    overrideCards?: any[],
    overrideVlans?: any[]
  ) => {
    const sysData = overrideSystems || monSystemStatus;
    const cardsData = overrideCards || monTopCards;
    const linksData = overrideLinks || monWebLinks;
    const vlansData = overrideVlans || monVlans;

    setIsSavingMon(true);
    try {
      // 1. Simpan Systems ke system_monitoring (IP opsional)
      if (sysData && sysData.length > 0) {
        const sysPayload = sysData.map((s: any, idx: number) => {
          const dom = extractDomain(s.url);
          return {
            id: s.id || `custom_sys_${idx + 1}`,
            name: s.name || `Node #${idx + 1}`,
            url: s.url || "",
            display_url: dom || s.displayUrl || s.url || "",
            ip: s.ip ? s.ip.trim() : null,
            service_type: s.type || "Web Service",
            ping_ms: parseInt(s.ping) || 15,
            uptime_pct: parseFloat(s.pct) || 100,
            status: s.status || "online",
            display_order: idx + 1,
            last_checked_at: new Date().toISOString()
          };
        });
        await supabase.from("system_monitoring").upsert(sysPayload, { onConflict: "id" });
      }

      // 2. Simpan configs lainnya (cards, links, vlans) ke monitoring_configs
      await Promise.all([
        supabase.from("monitoring_configs").upsert({
          key: "top_cards",
          value: cardsData,
          updated_at: new Date().toISOString()
        }),
        supabase.from("monitoring_configs").upsert({
          key: "web_links",
          value: linksData,
          updated_at: new Date().toISOString()
        }),
        supabase.from("monitoring_configs").upsert({
          key: "vlans",
          value: vlansData,
          updated_at: new Date().toISOString()
        }),
      ]);

      setSaveSuccessMsg("Tersimpan di Supabase ✓");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Gagal simpan ke Supabase:", err);
    } finally {
      setIsSavingMon(false);
    }
  };

  const saveMonConfig = (type: "cards" | "links" | "systems" | "vlans", data: any) => {
    let nextCards = monTopCards;
    let nextLinks = monWebLinks;
    let nextSystems = monSystemStatus;
    let nextVlans = monVlans;

    if (type === "cards") {
      nextCards = data;
      setMonTopCards(data);
      try { localStorage.setItem("gesit_dash_mon_top", JSON.stringify(data)); } catch (_) {}
    } else if (type === "links") {
      nextLinks = data;
      setMonWebLinks(data);
      try { localStorage.setItem("gesit_dash_mon_links", JSON.stringify(data)); } catch (_) {}
    } else if (type === "systems") {
      nextSystems = data;
      setMonSystemStatus(data);
      try { localStorage.setItem("gesit_dash_mon_systems", JSON.stringify(data)); } catch (_) {}
    } else if (type === "vlans") {
      nextVlans = data;
      setMonVlans(data);
      try { localStorage.setItem("gesit_dash_mon_vlans", JSON.stringify(data)); } catch (_) {}
    }

    // Auto debounce save ke Supabase (1.2 detik setelah user selesai mengetik)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMonConfigToSupabase(nextSystems, nextLinks, nextCards, nextVlans);
    }, 1200);
  };

  const resetMonConfig = async () => {
    try {
      localStorage.removeItem("gesit_dash_mon_top");
      localStorage.removeItem("gesit_dash_mon_links");
      localStorage.removeItem("gesit_dash_mon_systems");
      localStorage.removeItem("gesit_dash_mon_vlans");
    } catch (_) {}

    const defaultCards = [
      { id: "1", label: "IP Public CBN", value: "103.28.160.42", sub: "Dedicated 1G", note: "Latency 4ms · Cyber 1 JKT", status: "Online", url: "http://103.28.160.42", color: "#2f6bff" },
      { id: "2", label: "Supabase Cloud Hub", value: "yihjfrxdrhkq...supabase.co", sub: "", note: "PostgreSQL 15 · Latency 24ms", status: "Connected", url: "https://yihjfrxdrhkqfnjofvua.supabase.co", color: "#12b76a" },
      { id: "3", label: "MikroTik Router Core", value: "192.168.1.1", sub: "RB1100AHX4", note: "5 VLAN Active · CPU 14%", status: "99,98%", url: "http://192.168.1.1", color: "#f79009" },
      { id: "4", label: "Layanan & Web Aktif", value: "5 Portal Web Online", sub: "", note: "Uptime 99.98% · Avg 142ms", status: "100% SLA", url: "", color: "#6941c6" },
    ];
    setMonTopCards(defaultCards);
    setMonWebLinks(DATA.networkSummary.webLinks);
    setMonSystemStatus(DATA.systemStatus);
    setMonVlans(DATA.networkSummary.vlans);

    // Reset di Supabase juga
    try {
      await Promise.all([
        supabase.from("monitoring_configs").upsert({ key: "top_cards", value: defaultCards, updated_at: new Date().toISOString() }),
        supabase.from("monitoring_configs").upsert({ key: "web_links", value: DATA.networkSummary.webLinks, updated_at: new Date().toISOString() }),
        supabase.from("monitoring_configs").upsert({ key: "vlans", value: DATA.networkSummary.vlans, updated_at: new Date().toISOString() }),
      ]);
    } catch (_) {}
    alert("Konfigurasi monitoring dikembalikan ke bawaan awal dan disinkronkan ke Supabase.");
  };

  // Real data state dari Supabase
  const [dbTickets, setDbTickets] = useState<any[]>([]);
  const [dbActivities, setDbActivities] = useState<any[]>([]);
  const [totalActivityCount, setTotalActivityCount] = useState<number>(364);
  const [completedActivityCount, setCompletedActivityCount] = useState<number>(350);
  const [dbWeeklyTasks, setDbWeeklyTasks] = useState<any[]>([]);
  const [dbMeetings, setDbMeetings] = useState<any[]>([]);
  const [dbPurchaseRecords, setDbPurchaseRecords] = useState<any[]>([]);
  const [dbAssets, setDbAssets] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Jadwal Meeting & Google Calendar state
  const [isGCalConnected, setIsGCalConnected] = useState(() => isGoogleConnected());
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [newMeetingForm, setNewMeetingForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "10:00",
    location: "Google Meet",
    category: "Meeting",
    assignee: "Rudi",
  });

  const fetchLiveMetrics = async () => {
    try {
      const [
        ticketRes,
        actRes,
        actCountRes,
        doneCountRes,
        taskRes,
        meetingRes,
        purchaseRes,
        assetRes,
        sysMonRes,
        sysLogsRes,
        configsRes,
      ] = await Promise.all([
        supabase.from("helpdesk_tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }).or("status.eq.Done,status.eq.Completed,status.eq.Closed"),
        supabase.from("weekly_plans").select("*").order("id", { ascending: false }).limit(10),
        supabase.from("weekly_plans").select("*").or("category.ilike.%meeting%,task.ilike.%meeting%").order("start_date", { ascending: true }),
        supabase.from("purchase_records").select("*").order("purchase_date", { ascending: false }),
        supabase.from("it_assets").select("*"),
        supabase.from("system_monitoring").select("*").order("display_order", { ascending: true }),
        supabase.from("system_monitoring_logs").select("*").order("created_at", { ascending: false }).limit(60),
        supabase.from("monitoring_configs").select("*"),
      ]);

      if (ticketRes.data) {
        setDbTickets(ticketRes.data);
      }
      if (configsRes.data && configsRes.data.length > 0) {
        configsRes.data.forEach((cfg: any) => {
          if (cfg.key === "top_cards" && Array.isArray(cfg.value)) {
            setMonTopCards(cfg.value);
          } else if (cfg.key === "web_links" && Array.isArray(cfg.value)) {
            setMonWebLinks(cfg.value);
          } else if (cfg.key === "vlans" && Array.isArray(cfg.value)) {
            setMonVlans(cfg.value);
          }
        });
      }
      if (sysMonRes.data && sysMonRes.data.length > 0) {
        const mapped = sysMonRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          url: s.url,
          displayUrl: s.display_url || s.url,
          ip: s.ip,
          type: s.service_type,
          ping: s.ping_ms > 0 ? `${s.ping_ms}ms` : "1ms",
          pct: `${s.uptime_pct}%`,
          status: s.status,
          lastChecked: s.last_checked_at
        }));
        setMonSystemStatus(mapped);
      }
      if (sysLogsRes.data && sysLogsRes.data.length > 0) {
        const logs = sysLogsRes.data;
        setDbSysLogs(logs);
        const totalPing = logs.reduce((acc: number, l: any) => acc + (l.ping_ms || 0), 0);
        const avg = Math.round(totalPing / logs.length);
        const errs = logs.filter((l: any) => !l.is_success || (l.status_code && l.status_code >= 500)).length;
        const rate = ((errs / logs.length) * 100).toFixed(2).replace(".", ",");
        setRealAvgPing(avg > 0 ? avg : 142);
        setRealErrorRate(rate);
      }
      if (actRes.data && actRes.data.length > 0) {
        setDbActivities(actRes.data);
      } else {
        setDbActivities(DEFAULT_FALLBACK_ACTIVITIES);
      }
      if (typeof actCountRes.count === "number" && actCountRes.count > 0) {
        setTotalActivityCount(actCountRes.count);
      } else {
        setTotalActivityCount(364);
      }
      if (typeof doneCountRes.count === "number" && doneCountRes.count > 0) {
        setCompletedActivityCount(doneCountRes.count);
      } else if (typeof actCountRes.count === "number" && actCountRes.count > 0) {
        setCompletedActivityCount(Math.round(actCountRes.count * 0.96));
      } else {
        setCompletedActivityCount(350);
      }
      if (taskRes.data && taskRes.data.length > 0) {
        setDbWeeklyTasks(taskRes.data);
      }

      // Sinkronisasi status Google Calendar secara pasif (tanpa memunculkan popup GIS)
      await ensureGoogleConnected(currentUser?.email);
      let connected = isGoogleConnected();
      setIsGCalConnected(connected);

      const userEmail = currentUser?.email?.toLowerCase();
      const userNameStr = (currentUser?.fullName || currentUser?.name || "").toLowerCase();

      // Filter weekly_plans meetings untuk akun user ini atau meeting umum IT
      let internalMeetings = (meetingRes.data || []).filter((m: any) => {
        if (!userEmail && !userNameStr) return true;
        const assignee = (m.assignee || "").toLowerCase();
        const assigneeEmail = (m.assignee_email || "").toLowerCase();
        const creator = (m.created_by || "").toLowerCase();
        return (
          !m.assignee ||
          assignee === "it" ||
          assignee === "all" ||
          (userEmail && (assignee.includes(userEmail) || assigneeEmail.includes(userEmail) || creator.includes(userEmail))) ||
          (userNameStr && (assignee.includes(userNameStr) || creator.includes(userNameStr)))
        );
      });

      let combinedMeetings = internalMeetings;
      if (connected) {
        try {
          const now = new Date();
          // Ambil HANYA dari primary calendar (kalender personal akun user)
          const rawEvents = await fetchEventsForMonth(now.getFullYear(), now.getMonth(), "primary");
          const gcalEvents = rawEvents
            .filter((ev: any) => {
              // Jika user menolak undangan meeting (declined), jangan tampilkan
              const myAttendee = ev.attendees?.find(
                (a: any) => a.self || (userEmail && a.email?.toLowerCase() === userEmail)
              );
              if (myAttendee && myAttendee.responseStatus === "declined") {
                return false;
              }
              // Pastikan event milik akun user yang login
              if (userEmail) {
                const isCreator = ev.creator?.email?.toLowerCase() === userEmail;
                const isOrganizer = ev.organizer?.email?.toLowerCase() === userEmail;
                const isAttendee = !!myAttendee;
                return isCreator || isOrganizer || isAttendee || (!ev.attendees && !ev.organizer);
              }
              return true;
            })
            .map((ev: any) => ({
              id: ev.id,
              task: ev.summary || "Meeting Google Calendar",
              start_date: ev.start?.dateTime ? ev.start.dateTime.slice(0, 10) : ev.start?.date,
              start_time: ev.start?.dateTime ? ev.start.dateTime.slice(11, 16) : "09:00",
              end_time: ev.end?.dateTime ? ev.end.dateTime.slice(11, 16) : "10:00",
              location: ev.location || "Google Meet",
              category: "Google Calendar",
              isGoogle: true,
            }));
          combinedMeetings = [...combinedMeetings, ...gcalEvents];
        } catch (gcalErr) {
          console.warn("GCal fetch error in IT dashboard (fallback ke database internal):", gcalErr);
          setIsGCalConnected(false);
        }
      }

      setDbMeetings(combinedMeetings);
      if (purchaseRes.data && purchaseRes.data.length > 0) {
        setDbPurchaseRecords(purchaseRes.data);
      }
      if (assetRes.data && assetRes.data.length > 0) {
        setDbAssets(assetRes.data);
      }
    } catch (e) {
      console.warn("Gagal load data dashboard IT:", e);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();

    const ch = supabase
      .channel("dash_it_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "helpdesk_tickets" }, () => {
        fetchLiveMetrics();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_logs" }, () => {
        fetchLiveMetrics();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "weekly_plans" }, () => {
        fetchLiveMetrics();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_records" }, () => {
        fetchLiveMetrics();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "it_assets" }, () => {
        fetchLiveMetrics();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "system_monitoring" }, () => {
        fetchLiveMetrics();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "monitoring_configs" }, () => {
        fetchLiveMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Metrik terhitung dari Supabase
  const totalTickets = dbTickets.length || 3;
  const openTickets = dbTickets.filter((t) => t.status === "Open" || !t.status).length;
  const inProgTickets = dbTickets.filter((t) => t.status === "In Progress").length;
  const resolvedTickets = dbTickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
  const pendingTickets = dbTickets.filter((t) => t.status === "Pending").length;
  const unassignedTickets = dbTickets.filter((t) => !t.assigned_to || t.assigned_to === "Unassigned").length;

  const pctHandled = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 67;
  const firstOpenTicket = dbTickets.find((t) => t.status === "Open" || !t.assigned_to);
  const lastResolvedTicket = dbTickets.find((t) => t.status === "Resolved" || t.status === "Closed");

  // Hitung rata-rata waktu resolusi dari tiket selesai
  const avgResolutionHours = (() => {
    const resolvedList = dbTickets.filter((t) => (t.status === "Resolved" || t.status === "Closed") && t.resolved_at && t.created_at);
    if (resolvedList.length === 0) return "0,3";
    const totalDiffMs = resolvedList.reduce((acc, t) => {
      const diff = new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
      return acc + (diff > 0 ? diff : 0);
    }, 0);
    const avgHours = totalDiffMs / (resolvedList.length * 3600000);
    return avgHours.toFixed(1).replace(".", ",");
  })();

  // Hitungan kalkulasi Purchase Records dinamis
  const totalPurchaseRecordsCount = dbPurchaseRecords.length || 71;
  const disbursedTotal = dbPurchaseRecords
    .filter((p) => p.status === "Paid" || p.status === "Approved" || p.status === "Completed")
    .reduce((acc, curr) => acc + (Number(curr.total_va || curr.subtotal || curr.amount || 0)), 0);
  const liabilityTotal = dbPurchaseRecords
    .filter((p) => p.status === "Pending" || p.status === "Waiting Approval")
    .reduce((acc, curr) => acc + (Number(curr.total_va || curr.subtotal || curr.amount || 0)), 0);

  const formatJuta = (val: number, fallback: string) => {
    if (!val || val === 0) return fallback;
    const jt = val / 1000000;
    return `Rp ${jt.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  };

  // Top Categories & Dept Spend dinamis
  const dynamicPurchaseCats = (() => {
    if (dbPurchaseRecords.length === 0) return DATA.purchaseCats;
    const catMap: Record<string, number> = {};
    dbPurchaseRecords.forEach((p) => {
      const c = p.category || "Lain-lain";
      const amt = Number(p.total_va || p.subtotal || p.amount || 0);
      catMap[c] = (catMap[c] || 0) + amt;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxVal = sorted[0]?.[1] || 1;
    return sorted.map(([name, sum]) => ({
      name,
      pct: Math.min(100, Math.round((sum / maxVal) * 100)),
      val: sum >= 1000000 ? `${(sum / 1000000).toFixed(1)} Jt` : `${Math.round(sum / 1000)} Rb`,
    }));
  })();

  const dynamicPurchaseDepts = (() => {
    if (dbPurchaseRecords.length === 0) return DATA.purchaseDepts;
    const deptMap: Record<string, number> = {};
    dbPurchaseRecords.forEach((p) => {
      const d = p.department || p.dept || "Umum";
      const amt = Number(p.total_va || p.subtotal || p.amount || 0);
      deptMap[d] = (deptMap[d] || 0) + amt;
    });
    const sorted = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxVal = sorted[0]?.[1] || 1;
    return sorted.map(([name, sum]) => ({
      name,
      pct: Math.min(100, Math.round((sum / maxVal) * 100)),
      val: sum >= 1000000 ? `${(sum / 1000000).toFixed(1)} Jt` : `${Math.round(sum / 1000)} Rb`,
    }));
  })();

  // Hitungan kalkulasi Inventory Aset dinamis
  const totalAssetsCount = dbAssets.length || 334;
  const inProductionAssetsCount = dbAssets.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return s.includes("prod") || s.includes("use") || s.includes("pakai") || s.includes("aktif") || s.includes("active");
  }).length || (dbAssets.length > 0 ? Math.round(dbAssets.length * 0.93) : 313);

  const standbyAssetsCount = dbAssets.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return s.includes("standby") || s.includes("ready") || s.includes("idle") || s.includes("tersedia");
  }).length || (dbAssets.length > 0 ? Math.max(1, dbAssets.length - inProductionAssetsCount) : 11);

  const dynamicAssetCats = (() => {
    if (dbAssets.length === 0) {
      return [
        { label: "Laptop", count: 104, color: "#2f6bff" },
        { label: "Other", count: 94, color: "#12b76a" },
        { label: "Monitor", count: 27, color: "#f79009" },
        { label: "Computer", count: 12, color: "var(--donut-dark, #101828)" },
        { label: "Kategori lain", count: 97, color: "var(--donut-other, #d0d5dd)" },
      ];
    }
    const catCounts: Record<string, number> = {};
    dbAssets.forEach((a) => {
      const c = a.category || "Other";
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
    const colors = ["#2f6bff", "#12b76a", "#f79009", "var(--donut-dark, #101828)", "var(--donut-other, #d0d5dd)"];
    const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const top4 = sorted.slice(0, 4);
    const otherSum = sorted.slice(4).reduce((acc, curr) => acc + curr[1], 0);
    const result = top4.map(([label, count], idx) => ({
      label,
      count,
      color: colors[idx] || "#6941c6",
    }));
    if (otherSum > 0) {
      result.push({ label: "Kategori lain", count: otherSum, color: colors[4] });
    }
    return result;
  })();

  // Hitungan grafik aktivitas mingguan (7 hari terakhir) dinamis dari activity_logs & helpdesk_tickets
  const dynamicWeekData = (() => {
    const daysLabel = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const now = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = daysLabel[d.getDay()];
      const dateStr = d.toISOString().slice(0, 10);
      
      const dayLogs = dbActivities.filter((act) => act.created_at && act.created_at.startsWith(dateStr));
      const dayTickets = dbTickets.filter((t) => t.created_at && t.created_at.startsWith(dateStr));
      const masuk = dayLogs.length + dayTickets.length;
      const selesai = dayLogs.filter((act) => act.status === "Done" || act.status === "Completed" || act.status === "Closed").length
        + dayTickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
      result.push({
        d: dayName,
        date: dateStr,
        masuk: masuk,
        selesai: selesai,
      });
    }
    return result;
  })();
  const dynamicMaxWeek = Math.max(...dynamicWeekData.map((w) => Math.max(w.masuk, w.selesai)), 6);

  // Kategori terbanyak dari aktivitas & tiket operasional
  const topCategoryLabel = useMemo(() => {
    const counts: Record<string, number> = {};
    dbActivities.forEach((a) => {
      const cat = a.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    dbTickets.forEach((t) => {
      const cat = t.department || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `${sorted[0][0]} (${sorted[0][1]} log)` : "General Support";
  }, [dbActivities, dbTickets]);

  // State tanggal dan bulan/tahun kalender dinamis
  const [calCurrentDate, setCalCurrentDate] = useState(() => new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<Date>(() => new Date());

  // Parser tanggal seragam untuk string YYYY-MM-DD, ISO, maupun Date
  const parseDateParts = (dateVal: any): { year: number; month: number; day: number } | null => {
    if (!dateVal) return null;
    if (typeof dateVal === "string") {
      const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return {
          year: parseInt(match[1], 10),
          month: parseInt(match[2], 10) - 1,
          day: parseInt(match[3], 10),
        };
      }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
    };
  };

  const isSelectedDateToday = useMemo(() => {
    const now = new Date();
    return (
      selectedCalDate.getFullYear() === now.getFullYear() &&
      selectedCalDate.getMonth() === now.getMonth() &&
      selectedCalDate.getDate() === now.getDate()
    );
  }, [selectedCalDate]);

  // Hitung agenda meeting yang tampil (default: hanya hari ini)
  const displayedMeetings = useMemo(() => {
    const targetY = selectedCalDate.getFullYear();
    const targetM = selectedCalDate.getMonth();
    const targetD = selectedCalDate.getDate();

    const rawList = dbMeetings;

    return rawList.filter((m: any) => {
      const mDate = m.start_date || m.due_date || m.date;
      if (mDate) {
        const p = parseDateParts(mDate);
        if (p) {
          return p.year === targetY && p.month === targetM && p.day === targetD;
        }
      }
      if (m.day) {
        if (isSelectedDateToday && m.day.includes("HARI INI")) return true;
        return false;
      }
      return false;
    });
  }, [dbMeetings, selectedCalDate, isSelectedDateToday]);

  // Hitung grid kalender bulan berjalan secara dinamis
  const dynamicCalWeeks = useMemo(() => {
    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth(); // 0-indexed
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    // Kumpulkan tanggal meeting pada bulan ini
    const meetingDays = new Set<number>();
    dbMeetings.forEach((m) => {
      const mDate = m.start_date || m.due_date || m.date;
      if (mDate) {
        const p = parseDateParts(mDate);
        if (p && p.year === year && p.month === month) {
          meetingDays.add(p.day);
        }
      }
    });

    const cells: { d: string; kind: "" | "dim" | "today" | "dot"; dateObj: Date }[] = [];

    // Hari dari bulan sebelumnya
    for (let i = firstDay - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      cells.push({
        d: String(dNum),
        kind: "dim",
        dateObj: new Date(year, month - 1, dNum),
      });
    }

    // Hari bulan berjalan
    for (let day = 1; day <= totalDays; day++) {
      let kind: "" | "dim" | "today" | "dot" = "";
      if (isThisMonth && day === todayDate) {
        kind = "today";
      } else if (meetingDays.has(day)) {
        kind = "dot";
      }
      cells.push({
        d: String(day),
        kind,
        dateObj: new Date(year, month, day),
      });
    }

    // Sisa hari hingga kelipatan 7 (atau 35/42)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let nextDay = 1; nextDay <= remaining; nextDay++) {
      cells.push({
        d: String(nextDay),
        kind: "dim",
        dateObj: new Date(year, month + 1, nextDay),
      });
    }

    // Split ke array of weeks
    const weeks: { d: string; kind: "" | "dim" | "today" | "dot"; dateObj: Date }[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [calCurrentDate, dbMeetings]);

  // Handler dan daftar unik teknisi dari helpdesk_tickets
  const uniqueHandlers = useMemo(() => {
    const handlersSet = new Set<string>();
    dbTickets.forEach((t) => {
      if (t.assigned_to && t.assigned_to !== "Unassigned") {
        handlersSet.add(t.assigned_to);
      }
    });
    if (handlersSet.size === 0) {
      return ["Bendry", "Rudi", "Administrator"];
    }
    return Array.from(handlersSet);
  }, [dbTickets]);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getWeekRangeLabel = () => {
    const d = new Date();
    const day = d.getDay();
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d);
    mon.setDate(diffToMon);
    const sat = new Date(mon);
    sat.setDate(mon.getDate() + 5);
    const mFmt = mon.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const sFmt = sat.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${mFmt} – ${sFmt}`;
  };

  const inProgActivities = dbActivities.filter((a) => a.status === 'In Progress' || a.status === 'Pending').length;
  const ratedTickets = dbTickets.filter((t) => t.rating != null && t.rating > 0);
  const avgRating = ratedTickets.length > 0 ? (ratedTickets.reduce((acc, t) => acc + (t.rating || 0), 0) / ratedTickets.length).toFixed(1) : "0";
  const actPct = totalActivityCount > 0 ? Math.min(100, Math.round((completedActivityCount / totalActivityCount) * 100)) : 96;

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
        {/* ================= HEADER SAPAAN & AKSI ================= */}
        <div className="head">
          <div className="head-row">
            <div>
              <h1>{getGreeting()}, {displayName}</h1>
              <p>Monitoring operasional IT — tiket, aktivitas tim, infrastruktur, dan layanan online dalam satu layar.</p>
            </div>
            <a
              className="btn-filter"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                fetchLiveMetrics();
              }}
              title="Segarkan data metrik dashboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>Refresh
            </a>
          </div>
        </div>

        {/* ================= 4 KARTU KPI UTAMA (FULL WIDTH) ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 w-full">
          <StatCard
            label="Tiket Berjalan"
            value={openTickets}
            unit="Open"
            subValue={unassignedTickets > 0 ? `${unassignedTickets} unassigned` : "semua assigned"}
            note2={`dari ${totalTickets} total tiket`}
            color="amber"
            accent={openTickets > 0 ? "#f79009" : "#12b76a"}
            icon={() => KPI_ICONS[0]}
            drilldownData={dbTickets.filter((t) => t.status === "Open" || !t.status || t.status === "In Progress")}
            drilldownTitle="Ringkasan Tiket Berjalan"
            drilldownDescription="Komposisi dan daftar tiket aktif dalam penanganan tim."
            drilldownColumns={[
              { 
                header: 'Tiket & Masalah', 
                render: (t: any) => (
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{t.ticket_id || `#TKT-${t.id}`}</span>
                      <span>·</span>
                      <span className="truncate max-w-[220px]" title={t.subject}>{t.subject || '-'}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t.requester_name || t.requester || '-'} · Handler: <span className={t.assigned_to ? 'text-foreground font-medium' : 'text-rose-500 font-semibold'}>{t.assigned_to || 'Unassigned'}</span>
                    </div>
                  </div>
                ) 
              },
              { header: 'Prioritas', accessor: 'priority', className: 'w-24' },
              { header: 'Status', accessor: 'status', className: 'w-24 text-right' }
            ]}
          />

          <StatCard
            label="Selesai"
            value={resolvedTickets}
            unit="Tuntas"
            subValue={`${pctHandled}% terselesaikan`}
            note2="target 90%"
            color="emerald"
            status="on-track"
            icon={() => KPI_ICONS[1]}
            drilldownData={dbTickets.filter((t) => t.status === "Resolved" || t.status === "Closed")}
            drilldownTitle="Ringkasan Tiket Selesai"
            drilldownDescription="Komposisi dan daftar tiket bantuan teknis yang telah tuntas."
            drilldownColumns={[
              { 
                header: 'Tiket & Masalah', 
                render: (t: any) => (
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{t.ticket_id || `#TKT-${t.id}`}</span>
                      <span>·</span>
                      <span className="truncate max-w-[220px]" title={t.subject}>{t.subject || '-'}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t.requester_name || t.requester || '-'} · Teknisi: {t.assigned_to || t.resolved_by || '-'}
                    </div>
                  </div>
                ) 
              },
              { 
                header: 'Rating', 
                render: (t: any) => t.rating ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {t.rating}/5
                  </span>
                ) : 'Selesai', 
                className: 'w-24' 
              },
              { header: 'Status', accessor: 'status', className: 'w-24 text-right' }
            ]}
          />

          <StatCard
            label="Rata-rata Resolusi"
            value={avgResolutionHours}
            unit="Jam"
            subValue="lebih cepat dari target"
            note2="target 24 jam"
            color="emerald"
            status="on-track"
            icon={() => KPI_ICONS[2]}
            drilldownData={dbTickets.filter((t) => (t.status === "Resolved" || t.status === "Closed") && t.resolved_at && t.created_at)}
            drilldownTitle="Ringkasan Waktu Resolusi Tiket"
            drilldownDescription="Kalkulasi durasi waktu penyelesaian tiket tuntas."
            drilldownColumns={[
              { 
                header: 'Tiket & Masalah', 
                render: (t: any) => (
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span className="font-mono font-bold">{t.ticket_id || `#TKT-${t.id}`}</span>
                      <span>·</span>
                      <span className="truncate max-w-[220px]" title={t.subject}>{t.subject || '-'}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t.requester_name || t.requester || '-'}
                    </div>
                  </div>
                ) 
              },
              { 
                header: 'Waktu Eksekusi', 
                render: (t: any) => (
                  <div className="text-[11px] text-muted-foreground">
                    <div>Buat: {t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '-'}</div>
                    <div>Selesai: {t.resolved_at ? new Date(t.resolved_at).toLocaleDateString('id-ID') : '-'}</div>
                  </div>
                ),
                className: 'w-36'
              },
              { 
                header: 'Durasi', 
                render: (t: any) => {
                  const diff = new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
                  return <span className="font-bold text-emerald-600 dark:text-emerald-400">{(diff / 3600000).toFixed(1)} Jam</span>;
                },
                className: 'w-24 text-right'
              }
            ]}
          />

          <StatCard
            label="Aktivitas Terdata"
            value={totalActivityCount > 0 ? totalActivityCount : (dbActivities.length > 0 ? dbActivities.length : 14)}
            unit="Log"
            subValue="aktivitas sistem & tiket"
            note2="tersinkronisasi"
            color="blue"
            icon={() => KPI_ICONS[3]}
            drilldownData={dbActivities}
            drilldownTitle="Ringkasan Aktivitas Terdata"
            drilldownDescription="Komposisi dan rekapitulasi seluruh pencatatan kegiatan teknis IT."
            drilldownColumns={[
              { 
                header: 'Aktivitas & Pemohon', 
                render: (a: any) => (
                  <div>
                    <div className="font-semibold text-foreground">{a.activity_name || a.activityName || a.title || '-'}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {a.requester || '-'} {a.department ? `· ${a.department}` : ''} {(a.it_personnel || a.itPersonnel) ? `· PIC: ${a.it_personnel || a.itPersonnel}` : ''}
                    </div>
                  </div>
                ) 
              },
              { header: 'Kategori', accessor: 'category', className: 'w-32' },
              { header: 'Status', render: (a: any) => a.status || 'Done', className: 'w-24 text-right' }
            ]}
          />
        </div>

        {/* ================= KOLOM UTAMA + REL ================= */}
        <div className="layout">
          <div>

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
                    {dynamicWeekData.map((w, idx) => (
                      <div className="wk" key={w.d + (w.date || '')}>
                        <div className="wk-bars">
                          <div 
                            className="wk-bar in" 
                            data-v={w.masuk} 
                            style={{ 
                              height: w.masuk > 0 ? `${Math.max(14, Math.round((w.masuk / dynamicMaxWeek) * 100))}%` : "4px",
                              opacity: w.masuk > 0 ? 1 : 0.25,
                              animationDelay: `${idx * 60}ms`
                            }} 
                            title={`${w.d} (${w.date}): ${w.masuk} aktivitas & tiket masuk`}
                          />
                          <div 
                            className="wk-bar done" 
                            data-v={w.selesai} 
                            style={{ 
                              height: w.selesai > 0 ? `${Math.max(14, Math.round((w.selesai / dynamicMaxWeek) * 100))}%` : "4px",
                              opacity: w.selesai > 0 ? 1 : 0.25,
                              animationDelay: `${idx * 60 + 30}ms`
                            }} 
                            title={`${w.d} (${w.date}): ${w.selesai} tuntas diselesaikan`}
                          />
                        </div>
                        <span>{w.d}</span>
                      </div>
                    ))}
                  </div>
                  <div className="axis-note">Data aktual aktivitas & tiket per hari dalam 7 hari terakhir.</div>
                </div>
                <div className="tix-panel">
                  <div className="tix-title">Tiket Sekilas</div>
                  <div className="tix-stats">
                    <div className="tix-stat"><b>{totalTickets}</b><span>Total Masuk</span></div>
                    <div className="tix-stat"><b style={{ color: "var(--green)" }}>{resolvedTickets}</b><span>Selesai</span></div>
                    <div className="tix-stat"><b style={{ color: "var(--red)" }}>{openTickets}</b><span>Terbuka</span></div>
                  </div>
                  <div className="tix-alert">
                    {firstOpenTicket ? (
                      <><b>{firstOpenTicket.ticket_id || `#TKT-${firstOpenTicket.id}`}</b> ({firstOpenTicket.subject || "Tiket"}) {firstOpenTicket.assigned_to ? `ditangani ${firstOpenTicket.assigned_to}` : "menunggu penugasan teknisi"}.</>
                    ) : (
                      <>Semua antrean tiket saat ini telah tuntas ditangani.</>
                    )}
                  </div>
                  <a className="tix-link" href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Buka Ticketing Manager</a>
                </div>
              </div>
            </div>

            {/* QUEUE + STATUS */}
            <div className="row2">
              <div className="card">
                <div className="head2">
                  <div><h3>Queue Overview</h3><div className="sub">Antrean tiket helpdesk</div></div>
                  <div className="q-rt"><b>{pctHandled}%</b><span>tertangani</span></div>
                </div>
                <div className="q-top"><span>Tertangani <b style={{ color: "var(--ink)" }}>{resolvedTickets} dari {totalTickets} tiket</b></span></div>
                <div className="slider"><div className="fill" style={{ width: `${pctHandled}%` }} /><div className="knob" style={{ left: `${pctHandled}%` }} /></div>
                <div className="q-scale"><span>0 tiket</span><span>{totalTickets} tiket</span></div>
                <div className="q-remain">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f04438" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M13.7 20a2 2 0 0 1-3.4 0" /></svg>
                  <span>Sisa Antrean</span><b>{openTickets} Tiket</b>
                </div>
                <p className="fineprint">
                  {firstOpenTicket
                    ? `${firstOpenTicket.ticket_id || `#TKT-${firstOpenTicket.id}`} masih aktif. Jaga antrean tanpa handler di bawah 1 hari kerja agar SLA 100% tetap terjaga.`
                    : "Tidak ada tiket tertunda. Layanan helpdesk berjalan optimal."}
                </p>
              </div>

              <div className="card">
                <div className="head2">
                  <div><h3>Status Tiket</h3><div className="sub">Distribusi tiket bantuan teknis</div></div>
                  <span className="mini-select">Semua <Chev /></span>
                </div>
                <div className="donut-flex">
                  <div className="donut-box">
                    <svg viewBox="0 0 172 172" width="172" height="172">
                      <circle cx="86" cy="86" r="66" fill="none" stroke="var(--donut-track, #eef0f3)" strokeWidth="21" />
                      <circle cx="86" cy="86" r="66" fill="none" stroke="#2f6bff" strokeWidth="21" strokeLinecap="round" strokeDasharray={`${Math.round((resolvedTickets / (totalTickets || 1)) * 415)} 415`} transform="rotate(-90 86 86)" />
                      <circle cx="86" cy="86" r="66" fill="none" stroke="var(--donut-dark, #101828)" strokeWidth="21" strokeLinecap="round" strokeDasharray={`${Math.round((openTickets / (totalTickets || 1)) * 415)} 415`} strokeDashoffset={`-${Math.round((resolvedTickets / (totalTickets || 1)) * 415)}`} transform="rotate(-90 86 86)" />
                      <text x="86" y="80" textAnchor="middle" fontSize="21" fontWeight="800" fill="var(--ink, #101828)">{totalTickets}</text>
                      <text x="86" y="100" textAnchor="middle" fontSize="10.5" fill="var(--muted, #667085)">Total Tiket</text>
                    </svg>
                    <span className="pct-lab" style={{ left: -6, top: 26, color: "#2f6bff" }}>{pctHandled}%</span>
                    <span className="pct-lab" style={{ right: -8, top: 64 }}>{100 - pctHandled}%</span>
                  </div>
                  <div className="dleg">
                    <div><i style={{ background: "#2f6bff" }} />Resolved<b>{resolvedTickets}</b></div>
                    <div><i style={{ background: "var(--donut-dark, #101828)" }} />Open<b>{openTickets}</b></div>
                    <div><i style={{ background: "#f79009" }} />In Progress<b>{inProgTickets}</b></div>
                    <div><i style={{ background: "#c9d2e0" }} />Pending<b>{pendingTickets}</b></div>
                  </div>
                </div>
                <div className="rowline"><span>Kategori Terbanyak</span><b>{topCategoryLabel}</b></div>
                <div className="rowline">
                  <span>Kepuasan (CSAT)</span>
                  <b>
                    {Number(avgRating) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {avgRating}/5
                      </span>
                    ) : (
                      "100% SLA Tercapai"
                    )}
                  </b>
                </div>
              </div>
            </div>

            {/* ================= TASK UPDATE (TUGAS OPERASIONAL IT HARI INI) ================= */}
            <div className="card">
              <div className="head2">
                <div>
                  <h3>Task Update</h3>
                  <div className="sub">Tugas operasional IT &amp; tiket aktif hari ini</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNav('/weekly');
                    }}
                    style={{ fontSize: 12.5, fontWeight: 700, color: "var(--blue)" }}
                  >
                    Lihat Semua
                  </a>
                  <a
                    className="btn-new"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNav('/weekly');
                    }}
                  >
                    <Plus />Tugas Baru
                  </a>
                </div>
              </div>
              <div className="task-list">
                {(() => {
                  // Agregasi cerdas: gabungkan weekly plan + tiket open + aktivitas in progress
                  const combinedTasks: Array<{
                    id: string | number;
                    rawId: number | string;
                    source: "weekly" | "ticket" | "activity";
                    title: string;
                    time: string;
                    state: "todo" | "dark";
                    badge: string;
                    badgeColor: string;
                  }> = [];

                  // 1. Weekly tasks
                  dbWeeklyTasks.forEach((t) => {
                    const isDone = t.status === "Done" || t.status === "Completed";
                    const time = t.start_time || (t.start_date ? t.start_date : (t.created_at ? new Date(t.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "09:00"));
                    combinedTasks.push({
                      id: `wp-${t.id}`,
                      rawId: t.id,
                      source: "weekly",
                      title: t.task || t.task_name || t.title || "Tugas Operasional",
                      time: time,
                      state: isDone ? "dark" : "todo",
                      badge: "Planner",
                      badgeColor: "#6941c6",
                    });
                  });

                  // 2. Tiket Helpdesk Open / In Progress
                  dbTickets
                    .filter((t) => t.status === "Open" || t.status === "In Progress" || !t.status)
                    .forEach((t) => {
                      combinedTasks.push({
                        id: `tkt-${t.id}`,
                        rawId: t.id,
                        source: "ticket",
                        title: `[${t.ticket_id || `#TKT-${t.id}`}] ${t.subject || "Tiket Bantuan"} — ${t.requester_name || "User"}`,
                        time: t.created_at ? new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Aktif",
                        state: "todo",
                        badge: "Tiket",
                        badgeColor: "#2f6bff",
                      });
                    });

                  // 3. Aktivitas In Progress
                  dbActivities
                    .filter((a) => a.status === "In Progress" || a.status === "Pending")
                    .slice(0, 4)
                    .forEach((a) => {
                      combinedTasks.push({
                        id: `act-${a.id}`,
                        rawId: a.id,
                        source: "activity",
                        title: a.activity_name || a.activityName || "Aktivitas IT Berjalan",
                        time: a.created_at ? new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Proses",
                        state: "todo",
                        badge: "Aktivitas",
                        badgeColor: "#f79009",
                      });
                    });

                  // Jika masih kosong atau sedikit, sediakan fallback
                  const tasksToRender = combinedTasks.length > 0 ? combinedTasks : DATA.tasks.map((t, i) => ({
                    id: `dummy-${i}`,
                    rawId: i,
                    source: "weekly" as const,
                    title: t.title,
                    time: t.time,
                    state: t.state === "dark" ? "dark" as const : "todo" as const,
                    badge: "Operasional",
                    badgeColor: "#667085",
                  }));

                  return tasksToRender.map((t, idx) => (
                    <div className={`task-row ${t.state !== "todo" ? "done" : ""}`} key={t.id || idx}>
                      <span className="drag"><i /><i /><i /><i /><i /><i /></span>
                      <span
                        className={`cb ${t.state !== "todo" ? `on-${t.state}` : ""}`}
                        style={{ cursor: "pointer" }}
                        title="Klik untuk ubah status tugas"
                        onClick={async () => {
                          try {
                            if (t.source === "weekly") {
                              const nextStatus = t.state === "todo" ? "Done" : "In Progress";
                              await supabase.from("weekly_plans").update({ status: nextStatus }).eq("id", t.rawId);
                            } else if (t.source === "ticket") {
                              const nextStatus = t.state === "todo" ? "Resolved" : "Open";
                              await supabase.from("helpdesk_tickets").update({ status: nextStatus, resolved_at: new Date().toISOString() }).eq("id", t.rawId);
                            } else if (t.source === "activity") {
                              const nextStatus = t.state === "todo" ? "Completed" : "In Progress";
                              await supabase.from("activity_logs").update({ status: nextStatus }).eq("id", t.rawId);
                            }
                            fetchLiveMetrics();
                          } catch (err) {
                            console.error("Gagal update task status:", err);
                          }
                        }}
                      >
                        {t.state !== "todo" && <Check />}
                      </span>
                      <span className="task-t" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span 
                          style={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            padding: "1px 5px", 
                            borderRadius: 4, 
                            background: `${t.badgeColor}18`, 
                            color: t.badgeColor,
                            flexShrink: 0
                          }}
                        >
                          {t.badge}
                        </span>
                        <span className="truncate">{t.title}</span>
                      </span>
                      <span className="task-time">{t.time}</span>
                      <span
                        className="task-del"
                        style={{ cursor: "pointer" }}
                        title="Hapus tugas"
                        onClick={async () => {
                          if (confirm(`Hapus tugas "${t.title}"?`)) {
                            try {
                              if (t.source === "weekly") {
                                await supabase.from("weekly_plans").delete().eq("id", t.rawId);
                              } else if (t.source === "activity") {
                                await supabase.from("activity_logs").delete().eq("id", t.rawId);
                              }
                              fetchLiveMetrics();
                            } catch (err) {
                              console.error("Gagal hapus task:", err);
                            }
                          }
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6.5 7l1 13h9l1-13" /></svg>
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>{/* /kolom utama */}

          {/* ================= REL KANAN ================= */}
          <aside className="rail">
            <div className="card">
              <div className="rail-head">
                <h3>Tim Operasional IT</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>+ Tiket</a>
              </div>
              <div className="it-team-panel">
                <div className="it-lead">
                  <span className="it-av">
                    {currentUser?.fullName
                      ? currentUser.fullName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                      : (DATA.user.initials || "IT")}
                  </span>
                  <div className="it-lead-info">
                    <div className="it-lead-name">{currentUser?.fullName || DATA.user.name}</div>
                    <div className="it-lead-role">{currentUser?.role || "IT Support Specialist"} · Shift Aktif</div>
                  </div>
                </div>

                <div className="it-sla-box">
                  <div className="it-sla-row">
                    <span>SLA Compliance</span>
                    <b style={{ color: "var(--green)" }}>100%</b>
                  </div>
                  <div className="prog" style={{ marginTop: 6 }}>
                    <i style={{ width: "100%", background: "var(--green)" }} />
                  </div>
                  <div className="it-sla-sub">Target SLA: 90% (Sesuai Standar)</div>
                </div>

                <div className="it-handlers-row">
                  <div className="it-handlers-label">Handler Bertugas ({uniqueHandlers.length}):</div>
                  <div className="it-handlers-tags">
                    {uniqueHandlers.map((h, i) => (
                      <span className="it-h-tag" key={h + i}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mc-txhead" style={{ marginTop: 14 }}>
                  <span>Tiket Terakhir Ditangani</span>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Lihat Semua</a>
                </div>
                <div className="last-tx">
                  <span className="tic">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7db4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2.5 2.5 0 0 0 0 5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2.5 2.5 0 0 0 0-5Z" /><path d="M13 6v2M13 11v2M13 16v2" /></svg>
                  </span>
                  {lastResolvedTicket ? (
                    <div>
                      <div className="t">{lastResolvedTicket.requester_name || "Pemohon"}</div>
                      <div className="d">{lastResolvedTicket.ticket_id || `#TKT-${lastResolvedTicket.id}`} · {new Date(lastResolvedTicket.resolved_at || lastResolvedTicket.created_at || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</div>
                    </div>
                  ) : (
                    <div><div className="t">K. Nisa Oktafiani</div><div className="d">#TKT-6087 · 15 Apr 2026</div></div>
                  )}
                  <span className="amt">Selesai</span>
                </div>
              </div>
              <div className="rail-btns">
                <a className="btn-white" href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Lihat Antrean</a>
                <a className="btn-black" href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Tiket Baru</a>
              </div>
            </div>

            <div className="card">
              <div className="rail-head"><h3>Perlu Perhatian</h3><a href="#" onClick={(e) => { e.preventDefault(); handleNav('/helpdesk'); }}>Pengingat</a></div>
              <div className="rem-item">
                <span className="ric" style={{ background: firstOpenTicket ? "#f04438" : "#12b76a", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {firstOpenTicket ? "!" : <CheckIcon style={{ width: 12, height: 12, strokeWidth: 3 }} />}
                </span>
                {firstOpenTicket ? (
                  <div>
                    <div className="t">{firstOpenTicket.ticket_id || `#TKT-${firstOpenTicket.id}`} {firstOpenTicket.assigned_to ? "Aktif" : "Belum Di-assign"}</div>
                    <div className="d">{firstOpenTicket.subject} · {firstOpenTicket.requester_name || "User"}</div>
                  </div>
                ) : (
                  <div><div className="t">Semua Tiket Tertangani</div><div className="d">Tidak ada tiket perlu perhatian</div></div>
                )}
                <span className="amt" style={{ color: firstOpenTicket ? "var(--red)" : "var(--green)" }}>
                  {firstOpenTicket ? "Aktif" : "Aman"}
                </span>
              </div>
              <div className="rem-item">
                <span className="ric" style={{ background: inProgActivities > 0 ? "#f79009" : "#12b76a" }}>
                  {inProgActivities > 0 ? "HA" : "OK"}
                </span>
                <div>
                  <div className="t">{inProgActivities > 0 ? `${inProgActivities} Aktivitas Berjalan` : "Semua Aktivitas Selesai"}</div>
                  <div className="d">{inProgActivities > 0 ? "Masih berjalan · pantau prioritas tim" : "Tidak ada aktivitas tertunda"}</div>
                </div>
                <span className="amt">{inProgActivities > 0 ? "Proses" : "Aman"}</span>
              </div>
              <div className="rem-item">
                <span className="ric" style={{ background: ratedTickets.length > 0 ? "#12b76a" : "#2f6bff" }}>CS</span>
                <div>
                  <div className="t">{ratedTickets.length > 0 ? `CSAT Skor ${avgRating}/5` : "SLA Kepatuhan 100%"}</div>
                  <div className="d">{ratedTickets.length > 0 ? `${ratedTickets.length} respons kepuasan pengguna` : "Semua tiket tuntas sesuai target SLA"}</div>
                </div>
                <span className="amt">{ratedTickets.length > 0 ? `${avgRating}/5` : "100%"}</span>
              </div>
              <div className="rem-item">
                <span className="ric" style={{ background: "#6941c6" }}>PL</span>
                <div>
                  <div className="t">{dbMeetings.length > 0 ? `${dbMeetings.length} Agenda / Meeting` : "Planner Terjadwal"}</div>
                  <div className="d">{dbMeetings.length > 0 ? `${dbMeetings.length} event · ${getWeekRangeLabel()}` : `Kalender kerja terintegrasi · ${getWeekRangeLabel()}`}</div>
                </div>
                <span className="amt">{dbMeetings.length > 0 ? "Jadwal" : "Aktif"}</span>
              </div>
              <p className="fineprint" style={{ borderTop: 0, paddingTop: 4 }}>Pengingat otomatis terkirim sebelum tiket melewati SLA 24 jam.</p>
            </div>

            <div className="card">
              <div className="rail-head">
                <h3>Aktivitas Terakhir</h3>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNav('/activity'); }}>Lihat Semua</a>
              </div>
              <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 6 }}>
                {dbActivities.length > 0 ? (
                  dbActivities.slice(0, 4).map((act, i) => {
                    const title = act.activity_name || act.activityName || act.action || act.activity || act.description || "Aktivitas Sistem";
                    const isDone = act.status === "Completed" || act.status === "Done";
                    const timeStr = act.created_at ? new Date(act.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Baru";
                    return (
                      <div 
                        key={act.id || i}
                        style={{ 
                          padding: "8px 0", 
                          borderBottom: i < 3 ? "1px dashed var(--line, #e7ecf3)" : "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: 3
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground, #101828)" }} className="truncate" title={title}>
                            {title}
                          </span>
                          <span 
                            style={{ 
                              fontSize: 10, 
                              fontWeight: 700, 
                              padding: "1px 6px", 
                              borderRadius: 4, 
                              flexShrink: 0,
                              background: isDone ? "rgba(18, 183, 106, 0.12)" : "rgba(247, 144, 9, 0.12)",
                              color: isDone ? "#12b76a" : "#f79009"
                            }}
                          >
                            {isDone ? "Selesai" : "Proses"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--muted, #667085)" }}>
                          <span>{act.requester || "IT"} {act.category ? `· ${act.category}` : ""}</span>
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="log-item">Progress replacement copier HP</div>
                    <div className="log-item">Pengembangan Absen Gesit</div>
                    <div className="log-item">Koordinasi vendor CCTV Sircon73</div>
                    <div className="log-item">Pengembangan Sistem CSL</div>
                  </>
                )}
              </div>
              <div className="rowline" style={{ marginTop: 10 }}><span>Aktivitas selesai</span><b>{completedActivityCount} dari {totalActivityCount}</b></div>
              <div className="prog"><i style={{ width: `${actPct}%` }} /></div>
            </div>
          </aside>
        </div>{/* /layout */}
        {/* ================= MONITORING ONLINE — SYSTEM OVERVIEW (FULL WIDTH) ================= */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="head2">
            <div>
              <h3>Monitoring Online</h3>
              <div className="sub">System overview — IP public, gateway, backend Supabase, dan status layanan web GESIT PORTAL</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                className="btn-live-ping"
                onClick={testLivePing}
                disabled={isPinging}
                title="Jalankan pengukuran latensi real-time ke Supabase endpoint"
              >
                <svg className={isPinging ? "animate-spin" : ""} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                {isPinging ? "Mengukur..." : "Test Latensi Live"}
              </button>
              <button
                type="button"
                className="btn-filter"
                style={{ fontSize: 12, padding: "5px 12px", background: "var(--card)", border: "1px solid var(--line)" }}
                onClick={() => setIsEditMonOpen(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Kelola Monitoring
              </button>
              <span className="pill info" style={{ background: "var(--green-soft)", color: "var(--green)" }}><span className="pulse" />Semua Online</span>
            </div>
          </div>

          {/* 4 Kartu Metrik Ringkas: Editable */}
          <div className="mon-grid">
            {monTopCards.map((c: any) => (
              <div className="mon" key={c.id || c.label}>
                <div className="top">
                  <div className="ic" style={{ background: `${c.color || "#2f6bff"}1f`, color: c.color || "#2f6bff" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  </div>
                  <span className="st">{c.status}</span>
                </div>
                <div className="n">{c.label}</div>
                <div className="d">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", fontWeight: 700 }}>
                      {c.value}
                    </a>
                  ) : (
                    <b>{c.value}</b>
                  )}
                  {c.sub ? ` · ${c.sub}` : ""}
                </div>
                <div className="f">{c.note}</div>
              </div>
            ))}
          </div>

          {/* Arsitektur Jaringan Interaktif */}
          <div className="arch-wrap">
            <div className="arch-head">
              <span className="arch-title">INFRASTRUKTUR JARINGAN UTAMA</span>
              <div className="arch-tabs">
                <a href="#" className={archTab === "arsitektur" ? "on" : ""} onClick={(e) => { e.preventDefault(); setArchTab("arsitektur"); }}>Arsitektur Sistem</a>
                <a href="#" className={archTab === "peta" ? "on" : ""} onClick={(e) => { e.preventDefault(); setArchTab("peta"); }}>Peta Jaringan</a>
                <a href="#" className={archTab === "web" ? "on" : ""} onClick={(e) => { e.preventDefault(); setArchTab("web"); }}>Web &amp; Endpoints</a>
              </div>
            </div>

            {archTab === "arsitektur" && (
              <>
                <div className="arch-flow">
                  <div className="arch-col"><ArchBox name="Pengguna" sub="Web & Mobile App" ip="Multi-tenant Client" /></div>
                  <div className="arch-arrow"><ArrowR /></div>
                  <div className="arch-col"><ArchBox name="GESIT PORTAL" sub="it.gesit.co.id · SPA v4.1.2" ip="IP: 103.28.160.42" link="https://it.gesit.co.id" /></div>
                  <div className="arch-arrow"><ArrowR /></div>
                  <div className="arch-col">
                    <ArchBox name="Layanan Ticketing" sub="Helpdesk & antrean" link="/helpdesk" />
                    <ArchBox name="Layanan Activities" sub="Log aktivitas tim" link="/activity" />
                    <ArchBox name="Layanan Assets" sub="Inventaris & procurement" link="/assets" />
                  </div>
                  <div className="arch-arrow"><ArrowR /></div>
                  <div className="arch-col">
                    <ArchBox name="PostgreSQL Database" sub="Primary · Supabase Cloud" ip="yihjfrxdrhkq...supabase.co" link="https://yihjfrxdrhkqfnjofvua.supabase.co" />
                    <ArchBox name="Realtime Hub" sub="WSS Active Sync · Port 443" ip="Realtime Channel" />
                    <ArchBox name="Storage S3 Bucket" sub="Lampiran & berkas digital" ip="Bucket Encrypted" />
                  </div>
                </div>
                <div className="arch-infra">
                  <span className="arch-infra-t">Infrastruktur</span>
                  <ArchBox name="ISP CBN" sub="Dedicated Fiber 1 Gbps" ip="Gateway WAN: 103.28.160.42" link="http://103.28.160.42" />
                  <div className="arch-arrow"><ArrowR /></div>
                  <ArchBox name="MikroTik RB1100AHX4" sub="Router utama · L3 Managed" ip="Intranet LAN: 192.168.1.1" link="http://192.168.1.1" />
                  <div className="arch-arrow"><ArrowR /></div>
                  <ArchBox name="Switch & Access Point" sub="5 node NetVision · VLAN 10/20/30/60" ip="Trunk SFP+ Active" />
                </div>
              </>
            )}

            {archTab === "peta" && (
              <div className="net-view-grid">
                <div className="net-node-box">
                  <div className="net-node-head"><b>Gateway &amp; IP Public (WAN)</b><span className="net-node-badge">ISP CBN</span></div>
                  <div className="net-node-row"><span>IP Public Utama</span><code>103.28.160.42</code></div>
                  <div className="net-node-row"><span>Gateway ISP</span><code>103.28.160.41</code></div>
                  <div className="net-node-row"><span>Subnet WAN</span><code>255.255.255.248 (/29)</code></div>
                  <div className="net-node-row"><span>AS Number</span><code>AS17995 (Cyber 1 Kuningan)</code></div>
                  <div className="net-node-row"><span>Bandwidth Uplink</span><code>1 Gbps Symmetrical</code></div>
                  <div className="net-node-row"><span>DNS Resolvers</span><code>1.1.1.1 / 8.8.8.8</code></div>
                </div>

                <div className="net-node-box">
                  <div className="net-node-head"><b>Core Router (LAN / L3)</b><span className="net-node-badge" style={{ background: "var(--green-soft)", color: "var(--green)" }}>MikroTik</span></div>
                  <div className="net-node-row"><span>Hardware Model</span><code>RB1100AHx4 Dude Ed.</code></div>
                  <div className="net-node-row"><span>IP Gateway Local</span><code>192.168.1.1</code></div>
                  <div className="net-node-row"><span>DHCP Server</span><code>Active · Lease Time 12h</code></div>
                  <div className="net-node-row"><span>Firewall NAT</span><code>Masquerade to 103.28.160.42</code></div>
                  <div className="net-node-row"><span>CPU Load / Temp</span><code>14% · 38°C (Normal)</code></div>
                  <div className="net-node-row"><span>Uptime System</span><code>48 hari 14 jam</code></div>
                </div>

                <div className="net-node-box">
                  <div className="net-node-head"><b>Segmentasi VLAN Kantor</b><span className="net-node-badge" style={{ background: "rgba(247, 144, 9, 0.12)", color: "#f79009" }}>4 Subnet</span></div>
                  {monVlans.map((v: any) => (
                    <div className="net-node-row" key={v.id}>
                      <span><b>{v.id}</b> · {v.name}</span>
                      <code>{v.subnet} ({v.active} host)</code>
                    </div>
                  ))}
                </div>

                <div className="net-node-box">
                  <div className="net-node-head"><b>Supabase Cloud &amp; Database Endpoint</b><span className="net-node-badge" style={{ background: "rgba(105, 65, 198, 0.12)", color: "#6941c6" }}>Cloud DB</span></div>
                  <div className="net-node-row"><span>Project Endpoint</span><code>yihjfrxdrhkq...supabase.co</code></div>
                  <div className="net-node-row"><span>Region Cluster</span><code>AWS ap-southeast-1 (Singapore)</code></div>
                  <div className="net-node-row"><span>Engine Version</span><code>PostgreSQL 15.6 / PostgREST 12</code></div>
                  <div className="net-node-row"><span>Realtime Engine</span><code>WSS / Realtime v2.28</code></div>
                  <div className="net-node-row"><span>Database Latency</span><code>{liveSupabasePing ? `${liveSupabasePing}ms (Live)` : "~24ms (Avg RTT)"}</code></div>
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
                      <th>HOST / IP (OPSIONAL)</th>
                      <th>KETERANGAN</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: "right" }}>LATENSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monWebLinks.map((wl: any, idx: number) => (
                      <tr key={wl.name || idx}>
                        <td>
                          <div className="web-link-col">
                            <a
                              href={wl.url ? (wl.url.startsWith("http") ? wl.url : `https://${wl.url}`) : "#"}
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
                          {wl.ip && wl.ip.trim() !== "" ? (
                            <code>{wl.ip}</code>
                          ) : (
                            <span style={{ fontSize: 11.5, color: "var(--muted)", fontStyle: "italic" }}>
                              {extractDomain(wl.url) || "Web Domain"}
                            </span>
                          )}
                        </td>
                        <td>
                          {wl.url ? (
                            <a
                              href={wl.url.startsWith("http") ? wl.url : `https://${wl.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 11.5, color: "var(--blue)", textDecoration: "none", wordBreak: "break-all" }}
                              title={`Buka ${wl.url}`}
                            >
                              {wl.url}
                            </a>
                          ) : (
                            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>-</span>
                          )}
                        </td>
                        <td>
                          <span className="pill info" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
                            <span className="pulse" />
                            {wl.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--blue)" }}>{wl.ping}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel Bawah: 3 Kolom Sejajar (System Status, Response Time, Error Rate) */}
          <div className="mon-b">
            <div className="st-card">
              <div className="st-head">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h4>System Status</h4>
                  <span className="pill info" style={{ background: "var(--green-soft)", color: "var(--green)", fontSize: 11, padding: "2px 7px" }}>
                    <span className="pulse" />
                    {monSystemStatus.length} Layanan Aktif
                  </span>
                </div>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNav('/network'); }}>View All</a>
              </div>
              {monSystemStatus.map((s: any) => {
                const pingNum = s.name.includes("Supabase") && liveSupabasePing ? `${liveSupabasePing}ms` : s.ping;
                const pingInt = parseInt(pingNum) || 15;
                const isOffline = s.status === "offline" || pingInt >= 2500;
                const isDegraded = s.status === "degraded" || (pingInt >= 1500 && pingInt < 3000);

                const statusColor = isOffline ? "#f04438" : isDegraded ? "#f79009" : "#12b76a";
                const statusBg = isOffline ? "rgba(240,68,56,0.12)" : isDegraded ? "rgba(247,144,9,0.12)" : "rgba(18,183,106,0.12)";

                return (
                  <div className="st-row" key={s.name}>
                    <span className="st-ck" style={{ background: statusColor }}>
                      {isOffline ? (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      ) : (
                        <Check />
                      )}
                    </span>
                    <div className="st-info">
                      <div className="st-name-wrap">
                        <span className="st-n">{s.name}</span>
                        {s.url && (
                          <a
                            href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="st-link"
                            title={`Buka ${s.url}`}
                          >
                            {extractDomain(s.url) || s.url || s.displayUrl}
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                          </a>
                        )}
                      </div>
                      <div className="st-sub-meta">
                        {s.ip && s.ip.trim() !== "" && <span className="st-ip-tag">{s.ip}</span>}
                        {s.type && <span className="st-type-tag">{s.type}</span>}
                      </div>
                    </div>
                    <div className="st-right-meta">
                      <span className="st-op" style={{ color: statusColor, background: statusBg, padding: "1px 6px", borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                        {isOffline ? "Offline" : pingNum}
                      </span>
                      <span className="st-pct">{s.pct} SLA</span>
                    </div>
                  </div>
                );
              })}
              <div className="st-foot">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                Diperbarui realtime &middot; sinkronisasi Supabase aktif ({lastPingTime})
              </div>
            </div>

            {/* Kolom 2: Spektrum Latensi Infrastruktur IT */}
            <div className="spec-box">
              <div className="chart-head" style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Activity style={{ width: 16, height: 16, color: "#2f6bff" }} />
                  <h4>Spektrum Latensi</h4>
                </div>
                <span className="chart-badge" style={{ marginLeft: "auto", background: "rgba(47, 107, 255, 0.08)", color: "#2f6bff", borderColor: "rgba(47, 107, 255, 0.2)" }}>
                  Realtime SLA
                </span>
              </div>

              <div className="spec-list">
                {/* 1. Core Database */}
                <div className="spec-item">
                  <div className="spec-top">
                    <span className="spec-label">
                      <DatabaseIcon style={{ width: 13, height: 13, color: "#12b76a" }} />
                      Core Database &amp; Auth
                    </span>
                    <span className="spec-val" style={{ color: "#12b76a" }}>{monMetrics.dbPing}ms</span>
                  </div>
                  <div className="spec-bar-track">
                    <div 
                      className="spec-bar-progress" 
                      style={{ 
                        width: `${Math.min(100, Math.max(12, Math.round((monMetrics.dbPing / 50) * 100)))}%`, 
                        background: "#12b76a" 
                      }} 
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)" }}>
                    <span>Supabase AWS AP-SE-1</span>
                    <span>SLA &lt; 50ms (Tercapai)</span>
                  </div>
                </div>

                {/* 2. Jaringan Fisik Kantor */}
                <div className="spec-item">
                  <div className="spec-top">
                    <span className="spec-label">
                      <Wifi style={{ width: 13, height: 13, color: "#0ba5ec" }} />
                      Jaringan Fisik Kantor
                    </span>
                    <span className="spec-val" style={{ color: "#0ba5ec" }}>{monMetrics.networkPing}ms</span>
                  </div>
                  <div className="spec-bar-track">
                    <div 
                      className="spec-bar-progress" 
                      style={{ 
                        width: `${Math.min(100, Math.max(10, monMetrics.networkPing * 15))}%`, 
                        background: "#0ba5ec" 
                      }} 
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)" }}>
                    <span>MikroTik &amp; CBN Dedicated 1G</span>
                    <span>SLA &lt; 5ms (Tercapai)</span>
                  </div>
                </div>

                {/* 3. ERP & Presensi Mobile */}
                <div className="spec-item">
                  <div className="spec-top">
                    <span className="spec-label">
                      <Globe style={{ width: 13, height: 13, color: "#2f6bff" }} />
                      ERP &amp; Presensi Web/Mobile
                    </span>
                    <span className="spec-val" style={{ color: "#2f6bff" }}>~{monMetrics.appAvg}ms</span>
                  </div>
                  <div className="spec-bar-track">
                    <div 
                      className="spec-bar-progress" 
                      style={{ 
                        width: `${Math.min(100, Math.max(20, Math.round((monMetrics.appAvg / 300) * 100)))}%`, 
                        background: "#2f6bff" 
                      }} 
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)" }}>
                    <span>Gesit Portal, HCM &amp; Absensi</span>
                    <span>SLA &lt; 300ms (Stabil)</span>
                  </div>
                </div>

                {/* 4. Eksternal Web */}
                <div className="spec-item">
                  <div className="spec-top">
                    <span className="spec-label">
                      <Cpu style={{ width: 13, height: 13, color: "#f79009" }} />
                      Layanan Eksternal
                    </span>
                    <span className="spec-val" style={{ color: "#f79009" }}>~{monMetrics.extPing}ms</span>
                  </div>
                  <div className="spec-bar-track">
                    <div 
                      className="spec-bar-progress" 
                      style={{ 
                        width: `${Math.min(100, Math.max(30, Math.round((monMetrics.extPing / 1200) * 100)))}%`, 
                        background: "#f79009" 
                      }} 
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--muted)" }}>
                    <span>Corporate Web / Vendor Luar</span>
                    <span>Hosting Publik</span>
                  </div>
                </div>
              </div>

              <div className="spec-footer">
                <span>Rata-rata Core: <b>{monMetrics.coreAvg}ms</b></span>
                <span>Rata-rata 8 Node: <b>{monMetrics.allAvg}ms</b></span>
              </div>
            </div>

            {/* Kolom 3: Keandalan Sistem & Live Diagnostic Check */}
            <div className="spec-box">
              <div className="chart-head" style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <ShieldCheck style={{ width: 16, height: 16, color: "#12b76a" }} />
                  <h4>Keandalan Sistem</h4>
                </div>
                <span className="chart-badge" style={{ marginLeft: "auto", background: "rgba(18, 183, 106, 0.08)", color: "#12b76a", borderColor: "rgba(18, 183, 106, 0.2)" }}>
                  24h Audit
                </span>
              </div>

              <div className="uptime-big-val">
                100.0% <span>ketersediaan</span>
              </div>
              <div className="uptime-sub">
                <CircleCheck style={{ width: 13, height: 13 }} />
                Nol Insiden Aktif · 8/8 Node Beroperasi Normal
              </div>

              <div className="health-checklist">
                <div className="health-check-row">
                  <span className="health-check-left">
                    <Wifi style={{ width: 12, height: 12, color: "#0ba5ec" }} />
                    Gateway ISP &amp; Router
                  </span>
                  <span style={{ fontWeight: 700, color: "#12b76a", fontSize: 11 }}>Normal</span>
                </div>
                <div className="health-check-row">
                  <span className="health-check-left">
                    <DatabaseIcon style={{ width: 12, height: 12, color: "#12b76a" }} />
                    Database Supabase (PostgreSQL)
                  </span>
                  <span style={{ fontWeight: 700, color: "#12b76a", fontSize: 11 }}>Terkoneksi</span>
                </div>
                <div className="health-check-row">
                  <span className="health-check-left">
                    <Zap style={{ width: 12, height: 12, color: "#f79009" }} />
                    API Autentikasi &amp; Sync
                  </span>
                  <span style={{ fontWeight: 700, color: "#12b76a", fontSize: 11 }}>Siap Melayani</span>
                </div>
              </div>

              <button
                type="button"
                className="health-btn-ping"
                onClick={testLivePing}
                disabled={isPinging}
                title="Jalankan pengetesan latensi real-time ke semua server"
              >
                <RefreshCw style={{ width: 13, height: 13 }} className={isPinging ? "animate-spin" : ""} />
                <span>{isPinging ? "Sedang Menguji Jaringan..." : "Uji Koneksi Realtime"}</span>
              </button>
            </div>
          </div>
        </div>


        {/* ================= JADWAL MEETING ================= */}
        <div className="r-detail" style={{ gridTemplateColumns: "1fr" }}>
          <div className="card sched-card">
            <div className="sched">
              <div className="cal-pane">
                <div className="cal-head">
                  <div>
                    <h3>Jadwal Meeting</h3>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>
                        {displayedMeetings.length} agenda meeting {isSelectedDateToday ? "hari ini" : `pada ${selectedCalDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                      </span>
                      {!isSelectedDateToday && (
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            setSelectedCalDate(now);
                            setCalCurrentDate(now);
                          }}
                          style={{
                            fontSize: 10.5,
                            color: "var(--blue, #385898)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            fontWeight: 600,
                            textDecoration: "underline",
                          }}
                        >
                          Tampilkan Hari Ini
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      className="btn-new"
                      onClick={() => setIsCreateMeetingOpen(true)}
                      style={{ border: "none", cursor: "pointer" }}
                    >
                      <Plus /> Buat Baru
                    </button>
                  </div>
                </div>
                <div className="cal-nav">
                  <a
                    className="cal-arrow"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCalCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m14.5 6-6 6 6 6" /></svg>
                  </a>
                  <span className="cal-my">
                    <span className="cal-month">
                      {calCurrentDate.toLocaleDateString("en-US", { month: "long" })}{" "}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
                    </span>
                    <span className="cal-year">{calCurrentDate.getFullYear()}</span>
                  </span>
                  <a
                    className="cal-arrow"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCalCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9.5 6 6 6-6 6" /></svg>
                  </a>
                </div>
                <div className="cal-grid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((h) => (
                    <div className="cal-h" key={h}>{h}</div>
                  ))}
                  {dynamicCalWeeks.flat().map((c, i) => {
                    const isSelected =
                      c.dateObj &&
                      c.dateObj.getFullYear() === selectedCalDate.getFullYear() &&
                      c.dateObj.getMonth() === selectedCalDate.getMonth() &&
                      c.dateObj.getDate() === selectedCalDate.getDate();

                    return (
                      <div
                        key={i}
                        className={`cal-d ${c.kind === "dim" ? "dim" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (c.dateObj) {
                            setSelectedCalDate(c.dateObj);
                            if (c.kind === "dim") {
                              setCalCurrentDate(new Date(c.dateObj.getFullYear(), c.dateObj.getMonth(), 1));
                            }
                          }
                        }}
                      >
                        {c.kind === "today" ? (
                          <span className="today">{c.d}</span>
                        ) : isSelected ? (
                          <span
                            className="today"
                            style={{
                              background: "transparent",
                              border: "2px solid var(--blue, #385898)",
                              color: "inherit",
                            }}
                          >
                            {c.d}
                          </span>
                        ) : (
                          c.d
                        )}
                        {(c.kind === "today" || c.kind === "dot") && <i className="cdot" />}
                      </div>
                    );
                  })}
                </div>
                <p className="sched-note">Kalender interaktif bulanan — terhubung dengan jadwal &amp; meeting dari weekly plans.</p>
              </div>
              <div className="meet-pane">
                {displayedMeetings.length > 0 ? (
                  displayedMeetings.map((m: any, idx: number) => {
                    const mDate = m.start_date || m.due_date || m.date;
                    const parsed = parseDateParts(mDate);
                    const dayStr = parsed
                      ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase()
                      : (isSelectedDateToday
                          ? `HARI INI · ${new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}`
                          : selectedCalDate.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase());
                    const timeStr = m.start_time && m.end_time
                      ? `${m.start_time.slice(0, 5)} – ${m.end_time.slice(0, 5)}`
                      : m.start_time
                      ? m.start_time.slice(0, 5)
                      : (m.time || "09:00 – 10:00");
                    const locStr = m.location || m.description || (m.isGoogle ? "Google Meet" : "Ruang Meeting Lt. 26");
                    const tagStr = m.category || (m.isGoogle ? "Google Calendar" : "Meeting");

                    return (
                      <div className="meet2" key={m.id || m.title + idx}>
                        <div className="meet2-day">{dayStr}</div>
                        <div className="meet2-top">
                          <b>{m.task || m.task_name || m.title || "Meeting Internal"}</b>
                          {m.id && !m.isGoogle && (
                            <span
                              className="meet2-dots"
                              style={{ cursor: "pointer" }}
                              title="Hapus meeting"
                              onClick={async () => {
                                if (confirm(`Hapus agenda meeting "${m.task || m.title}"?`)) {
                                  await supabase.from("weekly_plans").delete().eq("id", m.id);
                                  fetchLiveMetrics();
                                }
                              }}
                            >
                              ✕
                            </span>
                          )}
                        </div>
                        <div className="meet2-loc"><MeetIcon /><span>{locStr}</span></div>
                        <div className="meet2-bot">
                          <span className="tag2" style={{ background: m.isGoogle ? "rgba(26, 115, 232, 0.15)" : undefined, color: m.isGoogle ? "#4285f4" : undefined }}>
                            {tagStr}
                          </span>
                          <span className="meet2-time"><ClockIcon /> {timeStr}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: "48px 16px", textAlign: "center", color: "#888", fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, height: "100%" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--card-subtle, rgba(0,0,0,0.05))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                      <Calendar style={{ width: 22, height: 22 }} />
                    </div>
                    <div style={{ fontWeight: 500, color: "var(--foreground, #333)" }}>
                      Tidak ada agenda meeting {isSelectedDateToday ? "hari ini" : "pada tanggal yang dipilih"}.
                    </div>
                    <div style={{ fontSize: 11.5 }}>
                      Klik tanggal lain pada kalender atau buat agenda meeting baru.
                    </div>
                  </div>
                )}
              </div>
            </div>
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
            <Heatmap activityLogs={dbActivities} />
            <div className="hm-foot">
              <span>Aktivitas harian disinkronkan dari tabel log sistem &amp; helpdesk.</span>
              <span className="hm-legend">Less <i className="hm-cell lv0" /> <i className="hm-cell lv1" /> <i className="hm-cell lv2" /> <i className="hm-cell lv3" /> <i className="hm-cell lv4" /> More</span>
            </div>
          </div>
        </div>

        {/* ================= PURCHASE + INVENTORY ================= */}
        <div className="r-detail">
          <div className="card">
            <div className="head2">
              <div><h3>Purchase Record</h3><div className="sub">Ringkasan keuangan pengadaan — semua departemen</div></div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/purchases');
                }}
                className="mini-select"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Semua Waktu
              </a>
            </div>
            <div className="fin-kpis">
              <div className="fin-kpi"><span>Disbursed</span><b>{formatJuta(disbursedTotal, "Rp 401,9 Jt")}</b></div>
              <div className="fin-kpi"><span>Total Records</span><b>{totalPurchaseRecordsCount}</b></div>
              <div className="fin-kpi"><span>Liability</span><b>{formatJuta(liabilityTotal, "Rp 0")}</b></div>
            </div>
            <div className="fin-cols">
              <div>
                <div className="fin-h">Top Categories</div>
                {dynamicPurchaseCats.map((c) => (
                  <div className="bar-row" key={c.name}><span className="bl">{c.name}</span><div className="bar"><i style={{ width: `${c.pct}%` }} /></div><span className="bv">{c.val}</span></div>
                ))}
              </div>
              <div>
                <div className="fin-h">Department Spend</div>
                {dynamicPurchaseDepts.map((d) => (
                  <div className="bar-row dark" key={d.name}><span className="bl">{d.name}</span><div className="bar"><i style={{ width: `${d.pct}%` }} /></div><span className="bv">{d.val}</span></div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="head2">
              <div><h3>Inventory</h3><div className="sub">Komposisi {totalAssetsCount} aset terdaftar</div></div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/assets');
                }}
                className="mini-select"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                Kelola Aset
              </a>
            </div>
            <div className="donut-flex" style={{ marginTop: 14 }}>
              <div className="donut" style={{ width: 148, height: 148 }}>
                <svg width="148" height="148" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="52" fill="none" stroke="var(--donut-track, #eaecf0)" strokeWidth="15" />
                  {(() => {
                    const circum = 2 * Math.PI * 52; // ~326.7
                    let offsetAccum = 0;
                    return dynamicAssetCats.map((cat, i) => {
                      const share = totalAssetsCount > 0 ? cat.count / totalAssetsCount : 0.2;
                      const strokeDash = share * circum;
                      const currentOffset = offsetAccum;
                      offsetAccum += strokeDash;
                      return (
                        <circle
                          key={cat.label + i}
                          cx="64"
                          cy="64"
                          r="52"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="15"
                          strokeDasharray={`${strokeDash.toFixed(1)} ${circum.toFixed(1)}`}
                          strokeDashoffset={-currentOffset}
                          transform="rotate(-90 64 64)"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="donut-c"><b style={{ fontSize: 24 }}>{totalAssetsCount}</b><span>Total</span></div>
              </div>
              <ul className="dlegend">
                {dynamicAssetCats.map((cat, i) => (
                  <li key={cat.label + i}>
                    <i style={{ background: cat.color }} />
                    {cat.label}
                    <b>{cat.count}</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rowline" style={{ marginTop: 14 }}><span>Dalam produksi</span><b>{inProductionAssetsCount} aset</b></div>
            <div className="rowline"><span>Stok standby</span><b>{standbyAssetsCount} aset</b></div>
          </div>
        </div>

        {showTopbar && (
          <div className="foot">
            <span>© 2026 The Gesit Companies · GESIT Portal · Mockup Dashboard IT — tata letak &amp; tipografi mengikuti referensi Ketua; angka dari snapshot portal 26 Okt 2026, pola grafik &amp; heatmap ilustratif.</span>
            <span><span style={{ color: "#12b76a" }}>●</span> Online&nbsp;&nbsp;|&nbsp;&nbsp;v4.1.2</span>
          </div>
        )}
      </main>

      {/* Modal Buat Jadwal Meeting Baru */}
      {isCreateMeetingOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: modalBg,
              border: modalBorder,
              borderRadius: 16,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: modalBorder,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: modalTitleColor }}>
                Buat Jadwal Meeting
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateMeetingOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: modalSubColor,
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newMeetingForm.title.trim()) {
                  alert("Judul meeting wajib diisi");
                  return;
                }
                try {
                  await supabase.from("weekly_plans").insert([
                    {
                      task: newMeetingForm.title.trim(),
                      start_date: newMeetingForm.date,
                      due_date: newMeetingForm.date,
                      start_time: newMeetingForm.startTime,
                      location: newMeetingForm.location.trim() || "Google Meet",
                      category: newMeetingForm.category || "Meeting",
                      assignee: newMeetingForm.assignee || currentUser?.fullName || "Rudi",
                      assignee_email: currentUser?.email || "rudi.siarudin@gesit.co.id",
                      created_by: currentUser?.email || "rudi.siarudin@gesit.co.id",
                      status: "In Progress",
                    },
                  ]);
                  setIsCreateMeetingOpen(false);
                  setNewMeetingForm({
                    title: "",
                    date: new Date().toISOString().slice(0, 10),
                    startTime: "09:00",
                    endTime: "10:00",
                    location: "Google Meet",
                    category: "Meeting",
                    assignee: "Rudi",
                  });
                  fetchLiveMetrics();
                } catch (err: any) {
                  console.error("Gagal buat meeting:", err);
                  alert("Gagal menyimpan agenda meeting: " + (err.message || err));
                }
              }}
              style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div>
                <label style={{ fontSize: 12, color: modalSubColor, display: "block", marginBottom: 4 }}>
                  Judul / Agenda Meeting
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Briefing Tim IT / Review Infra"
                  value={newMeetingForm.title}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: inputBg,
                    border: inputBorder,
                    borderRadius: 8,
                    color: inputColor,
                    fontSize: 13,
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: modalSubColor, display: "block", marginBottom: 4 }}>
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={newMeetingForm.date}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, date: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      color: inputColor,
                      fontSize: 13,
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: modalSubColor, display: "block", marginBottom: 4 }}>
                    Waktu Mulai
                  </label>
                  <input
                    type="time"
                    value={newMeetingForm.startTime}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, startTime: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      color: inputColor,
                      fontSize: 13,
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: modalSubColor, display: "block", marginBottom: 4 }}>
                  Lokasi / Link Meet
                </label>
                <input
                  type="text"
                  placeholder="Contoh: On Google Meet · Ruang Meeting Lt. 26"
                  value={newMeetingForm.location}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, location: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: inputBg,
                    border: inputBorder,
                    borderRadius: 8,
                    color: inputColor,
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: modalSubColor, display: "block", marginBottom: 4 }}>
                    Kategori
                  </label>
                  <select
                    value={newMeetingForm.category}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      color: inputColor,
                      fontSize: 13,
                    }}
                  >
                    <option value="Meeting">Meeting Internal</option>
                    <option value="Eksternal">Meeting Eksternal / Vendor</option>
                    <option value="Briefing">Briefing Harian</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: modalSubColor, display: "block", marginBottom: 4 }}>
                    PIC / Assignee
                  </label>
                  <input
                    type="text"
                    value={newMeetingForm.assignee}
                    onChange={(e) => setNewMeetingForm({ ...newMeetingForm, assignee: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: inputBg,
                      border: inputBorder,
                      borderRadius: 8,
                      color: inputColor,
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 10,
                  paddingTop: 12,
                  borderTop: modalBorder,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCreateMeetingOpen(false)}
                  style={{
                    background: "transparent",
                    border: cancelBtnBorder,
                    color: cancelBtnColor,
                    borderRadius: 8,
                    padding: "7px 16px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#385898",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "7px 18px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan / Kelola Monitoring Online */}
      {isEditMonOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setIsEditMonOpen(false)}
        >
          <div
            style={{
              background: modalBg,
              border: modalBorder,
              borderRadius: 16,
              width: "100%",
              maxWidth: 720,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              color: modalTitleColor,
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: modalBorder,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Kelola Monitoring Online</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: modalSubColor }}>
                  Sesuaikan kartu ringkasan, link web layanan, atau daftar endpoint sistem
                </p>
              </div>
              <button
                type="button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: modalSubColor,
                  cursor: "pointer",
                  fontSize: 18,
                  padding: 4,
                }}
                onClick={async () => {
                  await saveMonConfigToSupabase();
                  setIsEditMonOpen(false);
                }}
                title="Tutup dan simpan perubahan ke Supabase"
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div style={{ display: "flex", gap: 8, padding: "12px 20px", borderBottom: modalBorder, background: modalTabBg, overflowX: "auto" }}>
              <button
                type="button"
                style={{
                  borderRadius: 50,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: editingCategory === "systems" ? "#385898" : "transparent",
                  color: editingCategory === "systems" ? "#fff" : "#888",
                  whiteSpace: "nowrap",
                }}
                onClick={() => setEditingCategory("systems")}
              >
                Status Sistem (3 Kolom Bawah)
              </button>
              <button
                type="button"
                style={{
                  borderRadius: 50,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: editingCategory === "links" ? "#385898" : "transparent",
                  color: editingCategory === "links" ? "#fff" : "#888",
                  whiteSpace: "nowrap",
                }}
                onClick={() => setEditingCategory("links")}
              >
                Tabel Web &amp; Endpoints
              </button>
              <button
                type="button"
                style={{
                  borderRadius: 50,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: editingCategory === "cards" ? "#385898" : "transparent",
                  color: editingCategory === "cards" ? "#fff" : "#888",
                  whiteSpace: "nowrap",
                }}
                onClick={() => setEditingCategory("cards")}
              >
                4 Kartu Atas
              </button>
              <button
                type="button"
                style={{
                  borderRadius: 50,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: editingCategory === "vlans" ? "#385898" : "transparent",
                  color: editingCategory === "vlans" ? "#fff" : "#888",
                  whiteSpace: "nowrap",
                }}
                onClick={() => setEditingCategory("vlans")}
              >
                VLAN Subnet
              </button>
            </div>

            {/* Modal Body / Form Fields */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              {editingCategory === "cards" && (
                <>
                  {monTopCards.map((card: any, idx: number) => (
                    <div
                      key={card.id || idx}
                      style={{
                        padding: 12,
                        background: modalItemBg,
                        border: modalBorder,
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#385898" }}>Kartu #{idx + 1}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Label Judul</label>
                          <input
                            type="text"
                            value={card.label}
                            onChange={(e) => {
                              const updated = [...monTopCards];
                              updated[idx].label = e.target.value;
                              saveMonConfig("cards", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Nilai / IP / Host</label>
                          <input
                            type="text"
                            value={card.value}
                            onChange={(e) => {
                              const updated = [...monTopCards];
                              updated[idx].value = e.target.value;
                              saveMonConfig("cards", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Status Tag (cth: Online / Connected)</label>
                          <input
                            type="text"
                            value={card.status}
                            onChange={(e) => {
                              const updated = [...monTopCards];
                              updated[idx].status = e.target.value;
                              saveMonConfig("cards", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Catatan Footer (Latency/Uptime)</label>
                          <input
                            type="text"
                            value={card.note}
                            onChange={(e) => {
                              const updated = [...monTopCards];
                              updated[idx].note = e.target.value;
                              saveMonConfig("cards", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {editingCategory === "links" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#777" }}>Total {monWebLinks.length} Layanan Web</span>
                    <button
                      type="button"
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#385898",
                        border: "none",
                        borderRadius: 6,
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const newLink = {
                          name: "Layanan Baru",
                          url: "https://",
                          desc: "Deskripsi sistem baru",
                          ip: "192.168.1.x",
                          status: "Online",
                          ping: "12ms",
                        };
                        saveMonConfig("links", [...monWebLinks, newLink]);
                      }}
                    >
                      + Tambah Layanan
                    </button>
                  </div>
                  {monWebLinks.map((wl: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        background: modalItemBg,
                        border: modalBorder,
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{wl.name || `Layanan #${idx + 1}`}</span>
                        <button
                          type="button"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#f04438",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            const updated = monWebLinks.filter((_: any, i: number) => i !== idx);
                            saveMonConfig("links", updated);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Nama Layanan / Web</label>
                          <input
                            type="text"
                            value={wl.name}
                            placeholder="cth: Website Perusahaan"
                            onChange={(e) => {
                              const updated = [...monWebLinks];
                              updated[idx].name = e.target.value;
                              saveMonConfig("links", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>URL Link Website</label>
                          <input
                            type="text"
                            value={wl.url}
                            placeholder="https://..."
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...monWebLinks];
                              updated[idx].url = val;
                              saveMonConfig("links", updated);

                              // Sync ke System Status jika ada nama yang cocok
                              if (wl.name) {
                                const updatedSys = monSystemStatus.map((s: any) =>
                                  s.name.toLowerCase() === wl.name.toLowerCase()
                                    ? { ...s, url: val, displayUrl: extractDomain(val) || val }
                                    : s
                                );
                                setMonSystemStatus(updatedSys);
                                try { localStorage.setItem("gesit_dash_mon_systems", JSON.stringify(updatedSys)); } catch (_) {}
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>
                            IP Address / Host <span style={{ color: "#888", fontWeight: "normal" }}>(Opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={wl.ip || ""}
                            placeholder="Kosongkan jika hanya link web"
                            onChange={(e) => {
                              const updated = [...monWebLinks];
                              updated[idx].ip = e.target.value;
                              saveMonConfig("links", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Status</label>
                          <input
                            type="text"
                            value={wl.status}
                            onChange={(e) => {
                              const updated = [...monWebLinks];
                              updated[idx].status = e.target.value;
                              saveMonConfig("links", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Ping Latensi</label>
                          <input
                            type="text"
                            value={wl.ping}
                            onChange={(e) => {
                              const updated = [...monWebLinks];
                              updated[idx].ping = e.target.value;
                              saveMonConfig("links", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {editingCategory === "systems" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#777" }}>Total {monSystemStatus.length} Sistem</span>
                    <button
                      type="button"
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#385898",
                        border: "none",
                        borderRadius: 6,
                        color: "#fff",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const newSys = {
                          name: "Node Baru",
                          url: "https://",
                          displayUrl: "node.gesit.co.id",
                          ip: "103.28.160.x",
                          type: "Service",
                          ping: "20ms",
                          pct: "100%",
                        };
                        saveMonConfig("systems", [...monSystemStatus, newSys]);
                      }}
                    >
                      + Tambah Sistem
                    </button>
                  </div>
                  {monSystemStatus.map((s: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        background: modalItemBg,
                        border: modalBorder,
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{s.name || `Sistem #${idx + 1}`}</span>
                        <button
                          type="button"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#f04438",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                          onClick={async () => {
                            const toDelete = monSystemStatus[idx];
                            const updated = monSystemStatus.filter((_: any, i: number) => i !== idx);
                            saveMonConfig("systems", updated);
                            if (toDelete?.id) {
                              try {
                                await supabase.from("system_monitoring").delete().eq("id", toDelete.id);
                              } catch (_) {}
                            }
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Nama Sistem / Web</label>
                          <input
                            type="text"
                            value={s.name}
                            placeholder="cth: GESIT PORTAL"
                            onChange={(e) => {
                              const updated = [...monSystemStatus];
                              updated[idx].name = e.target.value;
                              saveMonConfig("systems", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>URL Link Website</label>
                          <input
                            type="text"
                            value={s.url || ""}
                            placeholder="https://..."
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = [...monSystemStatus];
                              updated[idx].url = val;
                              updated[idx].displayUrl = extractDomain(val) || val;
                              saveMonConfig("systems", updated);

                              // Sync ke Web Links jika ada nama yang cocok
                              if (s.name) {
                                const updatedLinks = monWebLinks.map((wl: any) =>
                                  wl.name.toLowerCase() === s.name.toLowerCase() ? { ...wl, url: val } : wl
                                );
                                setMonWebLinks(updatedLinks);
                                try { localStorage.setItem("gesit_dash_mon_links", JSON.stringify(updatedLinks)); } catch (_) {}
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>
                            IP Address / Host <span style={{ color: "#888", fontWeight: "normal" }}>(Opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={s.ip || ""}
                            placeholder="Kosongkan jika hanya link web"
                            onChange={(e) => {
                              const updated = [...monSystemStatus];
                              updated[idx].ip = e.target.value;
                              saveMonConfig("systems", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Tipe</label>
                          <input
                            type="text"
                            value={s.type}
                            onChange={(e) => {
                              const updated = [...monSystemStatus];
                              updated[idx].type = e.target.value;
                              saveMonConfig("systems", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Uptime %</label>
                          <input
                            type="text"
                            value={s.pct}
                            onChange={(e) => {
                              const updated = [...monSystemStatus];
                              updated[idx].pct = e.target.value;
                              saveMonConfig("systems", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {editingCategory === "vlans" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const newVlan = {
                        id: `VLAN ${monVlans.length * 10 + 10}`,
                        name: "Subnet Baru",
                        subnet: "192.168.50.0/24",
                        active: 10,
                      };
                      saveMonConfig("vlans", [...monVlans, newVlan]);
                    }}
                    style={{
                      alignSelf: "flex-start",
                      padding: "8px 14px",
                      background: "#385898",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 6,
                    }}
                  >
                    + Tambah VLAN
                  </button>

                  {monVlans.map((v: any, idx: number) => (
                    <div
                      key={v.id || idx}
                      style={{
                        padding: 12,
                        background: modalItemBg,
                        border: modalBorder,
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f3f5f7" }}>VLAN #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = monVlans.filter((_: any, i: number) => i !== idx);
                            saveMonConfig("vlans", updated);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#f04438",
                            fontSize: 11,
                            cursor: "pointer",
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>ID VLAN</label>
                          <input
                            type="text"
                            value={v.id}
                            onChange={(e) => {
                              const updated = [...monVlans];
                              updated[idx].id = e.target.value;
                              saveMonConfig("vlans", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Nama Segmentasi</label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => {
                              const updated = [...monVlans];
                              updated[idx].name = e.target.value;
                              saveMonConfig("vlans", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Subnet CIDR</label>
                          <input
                            type="text"
                            value={v.subnet}
                            onChange={(e) => {
                              const updated = [...monVlans];
                              updated[idx].subnet = e.target.value;
                              saveMonConfig("vlans", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#777", display: "block", marginBottom: 4 }}>Host Aktif</label>
                          <input
                            type="number"
                            value={v.active}
                            onChange={(e) => {
                              const updated = [...monVlans];
                              updated[idx].active = Number(e.target.value);
                              saveMonConfig("vlans", updated);
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              background: inputBg,
                              border: inputBorder,
                              borderRadius: 8,
                              color: inputColor,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderTop: modalBorder,
                background: modalTabBg,
              }}
            >
              <button
                type="button"
                onClick={resetMonConfig}
                style={{
                  background: "transparent",
                  border: cancelBtnBorder,
                  color: cancelBtnColor,
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Reset ke Default
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {saveSuccessMsg && (
                  <span style={{ fontSize: 12, color: "#12b76a", fontWeight: 600 }}>
                    ✓ {saveSuccessMsg}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditMonOpen(false)}
                  style={{
                    background: "transparent",
                    border: cancelBtnBorder,
                    color: cancelBtnColor,
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await saveMonConfigToSupabase();
                    setIsEditMonOpen(false);
                  }}
                  disabled={isSavingMon}
                  style={{
                    background: "#2f6bff",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "7px 18px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isSavingMon ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {isSavingMon ? "Menyimpan ke Supabase..." : "Simpan ke Supabase"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { DashboardIT };

