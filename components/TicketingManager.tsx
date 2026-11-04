import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGesitTheme } from "../lib/useGesitTheme";
import { supabase } from "../lib/supabaseClient";
import "./TicketingManager.css";

/* =====================================================================
   Ticketing Manager — GESIT PORTAL
   Patokan visual: Screenshot referensi (Chat, Tabel, Analytics) & DESIGN.md
   Semua selector di-scope ke .gesit-ticketing.
   ===================================================================== */

interface Message {
  id: number;
  sender: string;
  initials: string;
  avatarBg: string;
  time: string;
  text: string;
  isRequester: boolean;
}

interface TicketItem {
  id: string;
  dbId?: number;
  subject: string;
  requester: {
    name: string;
    email: string;
    phone: string;
    department: string;
    initials: string;
    avatarBg: string;
  };
  department: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved" | "Pending";
  handler: string;
  date: string;
  dateFull: string;
  time: string;
  snippet: string;
  unread: boolean;
  ageSla: string;
  messages: Message[];
  notes?: string;
}

const INITIAL_TICKETS: TicketItem[] = [
  {
    id: "#TKT-4584",
    subject: "Reset password Email",
    requester: {
      name: "Desi Rahmuni",
      email: "desi@gesit.co.id",
      phone: "Tidak ada nomor telepon",
      department: "General",
      initials: "DR",
      avatarBg: "#2f6bff",
    },
    department: "General",
    category: "General",
    priority: "Medium",
    status: "Open",
    handler: "Unassigned",
    date: "12 Sep",
    dateFull: "12 Sep 2026",
    time: "08:35",
    snippet: "hai IT, mohon bantuan nya untuk res...",
    unread: true,
    ageSla: "44 HARI - SLA LEWAT",
    messages: [
      {
        id: 1,
        sender: "Desi Rahmuni",
        initials: "DR",
        avatarBg: "#2f6bff",
        time: "08:35",
        text: "hai IT, mohon bantuan nya untuk reset password email saya",
        isRequester: true,
      },
    ],
    notes: "",
  },
  {
    id: "#TKT-6087",
    subject: "test",
    requester: {
      name: "K. Nisa Oktafiani",
      email: "nisa@gesit.co.id",
      phone: "Tidak ada nomor telepon",
      department: "General",
      initials: "NO",
      avatarBg: "#f79009",
    },
    department: "General",
    category: "General",
    priority: "Medium",
    status: "Resolved",
    handler: "Bendry",
    date: "15 Apr",
    dateFull: "15 Apr 2026",
    time: "15:44",
    snippet: "test",
    unread: false,
    ageSla: "DITUTUP",
    messages: [
      {
        id: 1,
        sender: "K. Nisa Oktafiani",
        initials: "NO",
        avatarBg: "#f79009",
        time: "15:10",
        text: "test pengujian tiket helpdesk operasional",
        isRequester: true,
      },
      {
        id: 2,
        sender: "Bendry",
        initials: "B",
        avatarBg: "#101828",
        time: "15:44",
        text: "Tiket pengujian sudah diverifikasi dan diselesaikan.",
        isRequester: false,
      },
    ],
    notes: "",
  },
  {
    id: "#TKT-3446",
    subject: "Reset password email",
    requester: {
      name: "IT Admin Gesit",
      email: "it-admin@gesit.co.id",
      phone: "Tidak ada nomor telepon",
      department: "General",
      initials: "IA",
      avatarBg: "#12b76a",
    },
    department: "General",
    category: "General",
    priority: "Medium",
    status: "Resolved",
    handler: "Rudi Si'arudin",
    date: "7 Apr",
    dateFull: "07 Apr 2026",
    time: "14:11",
    snippet: "Reset password email",
    unread: false,
    ageSla: "DITUTUP",
    messages: [
      {
        id: 1,
        sender: "IT Admin Gesit",
        initials: "IA",
        avatarBg: "#12b76a",
        time: "13:25",
        text: "Permohonan pergantian password akun email it-admin@gesit.co.id untuk pemeliharaan rutin kredensial tim IT.",
        isRequester: true,
      },
      {
        id: 2,
        sender: "Rudi Si'arudin",
        initials: "RS",
        avatarBg: "#0a2540",
        time: "14:11",
        text: "Password baru sudah digenerate dan dikirimkan via channel internal.",
        isRequester: false,
      },
    ],
    notes: "",
  },
];

/* ---------- Ikon Menu & Navigasi ---------- */
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
    badge: "1",
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

const Chev = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
);

export function TicketingManager({
  currentUser,
  onNavigate,
  showTopbar = false,
}: {
  currentUser?: any;
  onNavigate?: (path: string) => void;
  showTopbar?: boolean;
  [key: string]: any;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useGesitTheme();

  // Tab Utama: Chat | Tabel | Analytics (Default ke Chat sesuai screenshot 1)
  const [activeTab, setActiveTab] = useState<"Chat" | "Tabel" | "Analytics">("Chat");

  // State Tiket
  const [tickets, setTickets] = useState<TicketItem[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("#TKT-4584");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper Initials & Warna Avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarBg = (name?: string) => {
    const colors = ["#2f6bff", "#12b76a", "#f79009", "#7a5af8", "#ee46bc", "#0ba5ec", "#f04438"];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Sinkronisasi data dari tabel Supabase `helpdesk_tickets`
  const fetchTicketsFromSupabase = async () => {
    try {
      const { data: dbTickets, error } = await supabase
        .from("helpdesk_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Gagal mengambil helpdesk_tickets dari Supabase:", error.message);
        return;
      }

      if (dbTickets && dbTickets.length > 0) {
        // Ambil pesan tiket jika ada
        const { data: dbMessages } = await supabase
          .from("helpdesk_ticket_messages")
          .select("*")
          .order("created_at", { ascending: true });

        const mapped: TicketItem[] = dbTickets.map((t: any) => {
          const createdAt = new Date(t.created_at || Date.now());
          const dateStr = createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          const dateFullStr = createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
          const timeStr = createdAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

          // Hitung durasi hari untuk SLA
          const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const ageSla =
            t.status === "Resolved" || t.status === "Closed"
              ? "DITUTUP"
              : ageDays > 1
              ? `${ageDays} HARI - SLA LEWAT`
              : "DALAM SLA";

          const tMessages: Message[] = (dbMessages || [])
            .filter((m: any) => m.ticket_id === t.id)
            .map((m: any) => ({
              id: m.id,
              sender: m.sender_name || (m.sender_role === "IT" ? "IT Support" : t.requester_name || "User"),
              initials: getInitials(m.sender_name || (m.sender_role === "IT" ? "IT" : t.requester_name)),
              avatarBg: m.sender_role === "IT" ? "#0a2540" : getAvatarBg(m.sender_name || t.requester_name),
              time: new Date(m.created_at || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              text: m.message || "",
              isRequester: m.sender_role !== "IT",
            }));

          // Jika belum ada riwayat pesan, tampilkan deskripsi awal tiket sebagai pesan pertama
          if (tMessages.length === 0 && t.description) {
            tMessages.push({
              id: 1,
              sender: t.requester_name || "Pemohon",
              initials: getInitials(t.requester_name),
              avatarBg: getAvatarBg(t.requester_name),
              time: timeStr,
              text: t.description,
              isRequester: true,
            });
          }

          const ticketCode = t.ticket_id
            ? (t.ticket_id.startsWith("#") ? t.ticket_id : `#${t.ticket_id}`)
            : `#TKT-${t.id}`;

          return {
            id: ticketCode,
            dbId: t.id,
            subject: t.subject || "Permintaan Dukungan IT",
            requester: {
              name: t.requester_name || "User",
              email: t.requester_email || "-",
              phone: t.requester_phone || "Tidak ada nomor telepon",
              department: t.department || "General",
              initials: getInitials(t.requester_name),
              avatarBg: getAvatarBg(t.requester_name),
            },
            department: t.department || "General",
            category: t.category || "General",
            priority: (t.priority || "Medium") as TicketItem["priority"],
            status: (t.status === "Closed" ? "Resolved" : t.status || "Open") as TicketItem["status"],
            handler: t.assigned_to || "Unassigned",
            date: dateStr,
            dateFull: dateFullStr,
            time: timeStr,
            snippet: (t.description || t.subject || "").slice(0, 42) + "...",
            unread: t.status === "Open" && !t.assigned_to,
            ageSla: ageSla,
            messages: tMessages,
            notes: t.resolution || "",
          };
        });

        setTickets(mapped);
        if (mapped.length > 0) {
          setSelectedTicketId((prev) => (mapped.some((x) => x.id === prev) ? prev : mapped[0].id));
        }
      }
    } catch (err) {
      console.error("Error fetching tickets from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsFromSupabase();

    // Realtime channel listener untuk update otomatis
    const ticketChannel = supabase
      .channel("ticketing_manager_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "helpdesk_tickets" }, () => {
        fetchTicketsFromSupabase();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "helpdesk_ticket_messages" }, () => {
        fetchTicketsFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  // State Chat
  const [chatSearch, setChatSearch] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [rightActiveTab, setRightActiveTab] = useState<"detail" | "notes">("detail");

  // State Tabel
  const [tableSearch, setTableSearch] = useState("");
  const [subFilter, setSubFilter] = useState<"Semua" | "Belum Di-assign" | "Tiket Saya" | "Prioritas Tinggi" | "Lewat SLA">("Semua");

  // Accordion Left Rail
  const [openQueue, setOpenQueue] = useState(true);
  const [openInProgress, setOpenInProgress] = useState(true);
  const [openResolved, setOpenResolved] = useState(true);

  // Topbar dropdown
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement | null>(null);

  const handleNav = (path: string) => {
    setOpenMenu(null);
    if (onNavigate) {
      const clean = path.startsWith("/") ? path.substring(1) : path;
      onNavigate(clean || "dashboard");
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

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  // Aksi Chat: Kirim Pesan
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedTicket) return;

    const user = currentUser?.fullName || "Rudi Si'arudin";
    const initials = currentUser?.fullName
      ? currentUser.fullName.slice(0, 2).toUpperCase()
      : "RS";
    const textToSend = inputMessage.trim();

    const newMsg: Message = {
      id: Date.now(),
      sender: user,
      initials: initials,
      avatarBg: "#0a2540",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      text: textToSend,
      isRequester: false,
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            unread: false,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );
    setInputMessage("");

    // Sinkronkan ke Supabase jika terhubung
    if (selectedTicket.dbId) {
      try {
        await supabase.from("helpdesk_ticket_messages").insert([
          {
            ticket_id: selectedTicket.dbId,
            sender_name: user,
            sender_role: "IT",
            message: textToSend,
          },
        ]);
      } catch (err) {
        console.error("Gagal simpan pesan ke Supabase:", err);
      }
    }
  };

  // Aksi Tiket: Ambil Tiket Ini
  const handleAssignToMe = async (ticketId: string) => {
    const techName = currentUser?.fullName || "Rudi Si'arudin";
    const targetTicket = tickets.find((t) => t.id === ticketId);

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            handler: techName,
            status: "Open",
            unread: false,
          };
        }
        return t;
      })
    );

    if (targetTicket?.dbId) {
      try {
        await supabase
          .from("helpdesk_tickets")
          .update({ assigned_to: techName, assigned_to_email: currentUser?.email || null })
          .eq("id", targetTicket.dbId);
      } catch (err) {
        console.error("Gagal assign handler ke Supabase:", err);
      }
    }
  };

  // Aksi Tiket: Update Status
  const handleUpdateStatus = async (ticketId: string, status: TicketItem["status"]) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: status,
            ageSla: status === "Resolved" ? "DITUTUP" : t.ageSla,
          };
        }
        return t;
      })
    );

    if (targetTicket?.dbId) {
      try {
        await supabase
          .from("helpdesk_tickets")
          .update({
            status: status === "Resolved" ? "Resolved" : status,
            resolved_at: status === "Resolved" ? new Date().toISOString() : null,
          })
          .eq("id", targetTicket.dbId);
      } catch (err) {
        console.error("Gagal update status ke Supabase:", err);
      }
    }
  };

  // Aksi Tiket: Update Handler
  const handleUpdateHandler = async (ticketId: string, handler: string) => {
    const targetTicket = tickets.find((t) => t.id === ticketId);

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            handler: handler,
          };
        }
        return t;
      })
    );

    if (targetTicket?.dbId) {
      try {
        await supabase
          .from("helpdesk_tickets")
          .update({ assigned_to: handler })
          .eq("id", targetTicket.dbId);
      } catch (err) {
        console.error("Gagal update handler ke Supabase:", err);
      }
    }
  };

  // Filter Tiket untuk Tabel
  const filteredTableTickets = tickets.filter((t) => {
    const q = tableSearch.toLowerCase();
    const matchesSearch =
      t.id.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.requester.name.toLowerCase().includes(q) ||
      t.requester.email.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (subFilter === "Belum Di-assign") return t.handler === "Unassigned";
    if (subFilter === "Tiket Saya") {
      const me = currentUser?.fullName || "Rudi Si'arudin";
      return t.handler.toLowerCase().includes(me.toLowerCase().split(" ")[0]);
    }
    if (subFilter === "Prioritas Tinggi") return t.priority === "High" || t.priority === "Urgent";
    if (subFilter === "Lewat SLA") return t.ageSla.includes("LEWAT");
    return true;
  });

  // Filter Tiket untuk Chat Left Rail
  const filteredChatTickets = tickets.filter((t) => {
    const q = chatSearch.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.requester.name.toLowerCase().includes(q) ||
      t.snippet.toLowerCase().includes(q)
    );
  });

  const antreanTickets = filteredChatTickets.filter((t) => t.status === "Open" && t.handler === "Unassigned");
  const inProgressTickets = filteredChatTickets.filter((t) => t.status === "In Progress" || (t.status === "Open" && t.handler !== "Unassigned"));
  const resolvedTickets = filteredChatTickets.filter((t) => t.status === "Resolved");

  return (
    <div className="gesit-ticketing">
      {/* ================= 1. FIXED TOPBAR ================= */}
      {showTopbar && (
        <div className="topbar">
          <div className="brand" onClick={() => handleNav("/")} title="Kembali ke Dashboard">
            <img src="/image/logo.png" alt="Gesit" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
            Gesit Portal
          </div>

          <nav className="main" ref={menuRef}>
            <a
              className={location.pathname === "/" || location.pathname === "/dashboard" ? "on" : ""}
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNav("/");
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></svg>
              Dashboard
            </a>

            {MENU_ITEMS.slice(1).map((item) => {
              const isITOperations = item.id === "it-operations";
              return (
                <div className="nav-item-wrap" key={item.id}>
                  <a
                    href="#"
                    className={isITOperations ? "on" : openMenu === item.id ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenMenu(openMenu === item.id ? null : item.id);
                    }}
                  >
                    {item.label}
                    {item.badge && <span className="nav-badge-red">{item.badge}</span>}
                    <Chev />
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
              );
            })}
          </nav>

          <div className="top-ic" onClick={() => handleNav("/announcements")} title="Pemberitahuan">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
          </div>
          <div className="top-ic" onClick={() => handleNav("/announcements")} title="Notifikasi">
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
          <div className="avatar" onClick={() => handleNav("/users")} title="Profil RS">
            {currentUser?.fullName?.slice(0, 2).toUpperCase() || "RS"}
          </div>
        </div>
      )}

      {/* ================= KONTEN HALAMAN ================= */}
      <main className="wrap">
        {/* ================= 2. KEPALA HALAMAN ================= */}
        <div className="page-head">
          <div className="page-title">
            <h1>Ticketing Manager</h1>
            <p>Helpdesk IT - antrean, percakapan, dan laporan tiket.</p>
          </div>
        </div>

        {/* Segmen Pill Chat | Tabel | Analytics (Active: background hitam pekat) */}
        <div className="seg-row">
          <div className="seg">
            <button
              type="button"
              className={activeTab === "Chat" ? "on" : ""}
              onClick={() => setActiveTab("Chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={activeTab === "Tabel" ? "on" : ""}
              onClick={() => setActiveTab("Tabel")}
            >
              Tabel
            </button>
            <button
              type="button"
              className={activeTab === "Analytics" ? "on" : ""}
              onClick={() => setActiveTab("Analytics")}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* ================= TAB 1: VIEW CHAT (SCREENSHOT 1) ================= */}
        {activeTab === "Chat" && (
          <div className="chat-layout">
            {/* Left Rail: Percakapan */}
            <div className="chat-left-rail">
              <div className="chat-left-head">
                <h3>Percakapan</h3>
                <button type="button" className="btn-tool" onClick={() => alert("Filter percakapan")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                  Filter
                </button>
              </div>

              <div className="chat-left-search">
                <div className="chat-search-wrap">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
                  <input
                    type="text"
                    className="chat-search-input"
                    placeholder="Cari percakapan..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="chat-list-scroll">
                {/* Group 1: Antrean (1) */}
                <div className="chat-group-title" onClick={() => setOpenQueue(!openQueue)}>
                  <span>Antrean ({antreanTickets.length})</span>
                  <Chev />
                </div>
                {openQueue &&
                  antreanTickets.map((t) => (
                    <div
                      key={t.id}
                      className={`chat-item-card ${selectedTicket?.id === t.id ? "active" : ""}`}
                      onClick={() => setSelectedTicketId(t.id)}
                    >
                      <div className="chat-item-av-wrap">
                        <span className="chat-item-av" style={{ background: t.requester.avatarBg }}>
                          {t.requester.initials}
                        </span>
                        {t.unread && <span className="chat-unread-dot" />}
                      </div>
                      <div className="chat-item-body">
                        <div className="chat-item-top">
                          <span className="chat-item-name">{t.requester.name}</span>
                          <span className="chat-item-time urgent">{t.date}</span>
                        </div>
                        <div className="chat-item-snippet">{t.snippet}</div>
                        <div className="chat-item-badges">
                          <span className="chat-code">{t.id}</span>
                          <span className="pill-status open">{t.status.toUpperCase()}</span>
                          <span className="chat-handler-tag">Belum di-assign</span>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Group 2: Sedang Ditangani (0) */}
                <div className="chat-group-title" onClick={() => setOpenInProgress(!openInProgress)}>
                  <span>Sedang Ditangani ({inProgressTickets.length})</span>
                  <Chev />
                </div>
                {openInProgress && (
                  inProgressTickets.length === 0 ? (
                    <div className="chat-empty-hint">Belum ada tiket yang sedang ditangani.</div>
                  ) : (
                    inProgressTickets.map((t) => (
                      <div
                        key={t.id}
                        className={`chat-item-card ${selectedTicket?.id === t.id ? "active" : ""}`}
                        onClick={() => setSelectedTicketId(t.id)}
                      >
                        <div className="chat-item-av-wrap">
                          <span className="chat-item-av" style={{ background: t.requester.avatarBg }}>
                            {t.requester.initials}
                          </span>
                        </div>
                        <div className="chat-item-body">
                          <div className="chat-item-top">
                            <span className="chat-item-name">{t.requester.name}</span>
                            <span className="chat-item-time">{t.date}</span>
                          </div>
                          <div className="chat-item-snippet">{t.snippet}</div>
                          <div className="chat-item-badges">
                            <span className="chat-code">{t.id}</span>
                            <span className="pill-status open">{t.status.toUpperCase()}</span>
                            <span className="chat-handler-tag">{t.handler}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* Group 3: Selesai (2) */}
                <div className="chat-group-title" onClick={() => setOpenResolved(!openResolved)}>
                  <span>Selesai ({resolvedTickets.length})</span>
                  <Chev />
                </div>
                {openResolved &&
                  resolvedTickets.map((t) => (
                    <div
                      key={t.id}
                      className={`chat-item-card ${selectedTicket?.id === t.id ? "active" : ""}`}
                      onClick={() => setSelectedTicketId(t.id)}
                    >
                      <div className="chat-item-av-wrap">
                        <span className="chat-item-av" style={{ background: t.requester.avatarBg }}>
                          {t.requester.initials}
                        </span>
                      </div>
                      <div className="chat-item-body">
                        <div className="chat-item-top">
                          <span className="chat-item-name">{t.requester.name}</span>
                          <span className="chat-item-time">{t.date}</span>
                        </div>
                        <div className="chat-item-snippet">{t.snippet}</div>
                        <div className="chat-item-badges">
                          <span className="chat-code">{t.id}</span>
                          <span className="pill-status resolved">RESOLVED</span>
                          <span className="chat-handler-tag">{t.handler}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Footer Left Rail */}
              <div className="chat-left-foot">
                <span>✓ Selesai</span>
                <span className="chat-foot-badge">{resolvedTickets.length}</span>
              </div>
            </div>

            {/* Center Panel: Active Chat */}
            <div className="chat-center-panel">
              {/* Header Percakapan */}
              <div className="chat-center-head">
                <div className="chat-head-user">
                  <span
                    className="chat-item-av"
                    style={{ background: selectedTicket.requester.avatarBg, width: 38, height: 38 }}
                  >
                    {selectedTicket.requester.initials}
                  </span>
                  <div>
                    <div className="chat-head-name">{selectedTicket.requester.name}</div>
                    <div className="chat-head-sub">
                      {selectedTicket.requester.email} &middot; {selectedTicket.id}
                    </div>
                  </div>
                </div>
                <div className="chat-head-badges">
                  <span
                    className={`pill-status ${
                      selectedTicket.status === "Open" ? "open" : "resolved"
                    }`}
                  >
                    {selectedTicket.status.toUpperCase()}
                  </span>
                  <span className="pill-priority-outline">{selectedTicket.priority}</span>
                </div>
              </div>

              {/* Chat Canvas / Dotted Body */}
              <div className="chat-body">
                <div className="chat-date-divider">
                  <span className="chat-date-label">{selectedTicket.dateFull}</span>
                  <span className="chat-date-sub">Tiket dibuat &middot; Subjek: {selectedTicket.subject}</span>
                </div>

                {/* Pesan-pesan */}
                {selectedTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-msg-row ${m.isRequester ? "" : "out"}`}
                  >
                    {m.isRequester && (
                      <span
                        className="chat-item-av"
                        style={{ background: m.avatarBg, width: 32, height: 32, fontSize: 11 }}
                      >
                        {m.initials}
                      </span>
                    )}
                    <div className="chat-msg-content">
                      <div className="chat-msg-meta">
                        <span className="chat-msg-sender">{m.sender}</span>
                        <span className="chat-msg-time">{m.time}</span>
                      </div>
                      <div className="chat-bubble">{m.text}</div>
                    </div>
                  </div>
                ))}

                {/* Alert Box jika belum di-assign */}
                {selectedTicket.handler === "Unassigned" && (
                  <div className="chat-system-box">
                    Belum di-assign dan belum ada balasan sejak {selectedTicket.dateFull}.
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                <div className="chat-input-pill">
                  <input
                    type="text"
                    className="chat-text-input"
                    placeholder="Tulis pesan..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <button type="button" className="chat-ic-btn" title="Lampirkan file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                  </button>
                  <button type="button" className="chat-ic-btn" title="Emoji">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                  </button>
                  <button type="submit" className="chat-send-btn" title="Kirim">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Rail: Detail Tiket & Catatan */}
            <div className="chat-right-rail">
              <div className="chat-right-tabs">
                <button
                  type="button"
                  className={`right-tab-btn ${rightActiveTab === "detail" ? "active" : ""}`}
                  onClick={() => setRightActiveTab("detail")}
                >
                  Detail Tiket
                </button>
                <button
                  type="button"
                  className={`right-tab-btn ${rightActiveTab === "notes" ? "active" : ""}`}
                  onClick={() => setRightActiveTab("notes")}
                >
                  Catatan
                </button>
              </div>

              {rightActiveTab === "detail" ? (
                <>
                  {/* DATA PEMINTA */}
                  <div className="right-section-title">Data Peminta</div>
                  <div className="right-meta-list">
                    <div className="right-meta-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                      <span>{selectedTicket.requester.email}</span>
                    </div>
                    <div className="right-meta-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <span>{selectedTicket.requester.phone}</span>
                    </div>
                    <div className="right-meta-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" /></svg>
                      <span>{selectedTicket.department}</span>
                    </div>
                    <div className="right-meta-row">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2.5 2.5 0 0 0 0 5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2.5 2.5 0 0 0 0-5Z" /></svg>
                      <span>{selectedTicket.id} &middot; {selectedTicket.subject}</span>
                    </div>
                  </div>

                  {/* PENGATURAN TIKET */}
                  <div className="right-section-title" style={{ marginTop: 10 }}>Pengaturan Tiket</div>
                  <div className="right-form-group">
                    <label className="right-form-label">Status</label>
                    <select
                      className="right-select"
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div className="right-form-group">
                    <label className="right-form-label">Prioritas</label>
                    <select
                      className="right-select"
                      value={selectedTicket.priority}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTickets((prev) =>
                          prev.map((t) => (t.id === selectedTicket.id ? { ...t, priority: val } : t))
                        );
                      }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="right-form-group">
                    <label className="right-form-label">Kategori</label>
                    <select
                      className="right-select"
                      value={selectedTicket.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTickets((prev) =>
                          prev.map((t) => (t.id === selectedTicket.id ? { ...t, category: val } : t))
                        );
                      }}
                    >
                      <option value="General">General</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Hardware Issue">Hardware Issue</option>
                      <option value="Account & Access">Account &amp; Access</option>
                    </select>
                  </div>

                  <div className="right-form-group">
                    <label className="right-form-label">Assign To</label>
                    <select
                      className="right-select"
                      value={selectedTicket.handler}
                      onChange={(e) => handleUpdateHandler(selectedTicket.id, e.target.value)}
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="Bendry">Bendry</option>
                      <option value="Rudi Si'arudin">Rudi Si'arudin</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>

                  {/* Tombol Aksi */}
                  {selectedTicket.handler === "Unassigned" ? (
                    <button
                      type="button"
                      className="btn-right-action-black"
                      onClick={() => handleAssignToMe(selectedTicket.id)}
                    >
                      Ambil Tiket Ini
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="btn-right-action-white"
                    onClick={() =>
                      handleUpdateStatus(
                        selectedTicket.id,
                        selectedTicket.status === "Resolved" ? "Open" : "Resolved"
                      )
                    }
                  >
                    {selectedTicket.status === "Resolved" ? "Buka Kembali Tiket" : "Tandai Selesai"}
                  </button>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="right-section-title">Catatan Internal Petugas</div>
                  <textarea
                    rows={6}
                    className="form-textarea"
                    placeholder="Tulis catatan internal yang hanya terlihat oleh tim IT..."
                    value={selectedTicket.notes || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTickets((prev) =>
                        prev.map((t) => (t.id === selectedTicket.id ? { ...t, notes: val } : t))
                      );
                    }}
                  />
                  <button
                    type="button"
                    className="btn-right-action-black"
                    onClick={async () => {
                      if (selectedTicket.dbId) {
                        try {
                          await supabase
                            .from("helpdesk_tickets")
                            .update({ resolution: selectedTicket.notes || "" })
                            .eq("id", selectedTicket.dbId);
                        } catch (err) {
                          console.error("Gagal simpan catatan internal:", err);
                        }
                      }
                      alert("Catatan tersimpan!");
                    }}
                  >
                    Simpan Catatan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: VIEW TABEL (SCREENSHOT 2) ================= */}
        {activeTab === "Tabel" && (
          <div>
            {/* 4 Kartu KPI */}
            <div className="kpis">
              {/* Card 1: Belum Di-assign */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#fef3f2" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>
                  </span>
                  Belum Di-assign
                </div>
                <div className="num">
                  1 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>tiket</span>
                </div>
                <div className="delta">
                  <span style={{ color: "#dc2626", fontWeight: 800 }}>Perlu handler sekarang</span>
                </div>
              </div>

              {/* Card 2: Tiket Tertua */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#eef4ff" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </span>
                  Tiket Tertua
                </div>
                <div className="num">
                  44 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>hari</span>
                </div>
                <div className="delta">
                  <span>#TKT-4584 &middot; Desi Rahmuni</span>
                </div>
              </div>

              {/* Card 3: Sedang Diproses */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#eef4ff" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>
                  </span>
                  Sedang Diproses
                </div>
                <div className="num">
                  0 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>tiket</span>
                </div>
                <div className="delta">
                  <span>In progress &amp; pending</span>
                </div>
              </div>

              {/* Card 4: Selesai */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#ecfdf3" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#12805c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Selesai
                </div>
                <div className="num">
                  2 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>tiket</span>
                </div>
                <div className="delta">
                  <span style={{ color: "#12805c", fontWeight: 800 }}>Rata-rata resolusi 0,3 jam &middot; target 24 jam</span>
                </div>
              </div>
            </div>

            {/* Alert Strip Kuning */}
            <div
              className="alert-strip"
              title="Buka tiket ini di Chat"
              onClick={() => {
                setSelectedTicketId("#TKT-4584");
                setActiveTab("Chat");
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <div>
                <b>#TKT-4584</b> belum di-assign sejak 12 Sep 2026 — satu-satunya tiket terbuka saat ini.{" "}
                <span style={{ textDecoration: "underline", fontWeight: 800, marginLeft: 4 }}>Buka Tiket &rarr;</span>
              </div>
            </div>

            {/* Sub-Filter Pills */}
            <div className="sub-filters-row">
              <button
                type="button"
                className={`pill-subfilter ${subFilter === "Semua" ? "active" : ""}`}
                onClick={() => setSubFilter("Semua")}
              >
                Semua
              </button>
              <button
                type="button"
                className={`pill-subfilter ${subFilter === "Belum Di-assign" ? "active" : ""}`}
                onClick={() => setSubFilter("Belum Di-assign")}
              >
                Belum Di-assign <span className="subfilter-badge">1</span>
              </button>
              <button
                type="button"
                className={`pill-subfilter ${subFilter === "Tiket Saya" ? "active" : ""}`}
                onClick={() => setSubFilter("Tiket Saya")}
              >
                Tiket Saya
              </button>
              <button
                type="button"
                className={`pill-subfilter ${subFilter === "Prioritas Tinggi" ? "active" : ""}`}
                onClick={() => setSubFilter("Prioritas Tinggi")}
              >
                Prioritas Tinggi
              </button>
              <button
                type="button"
                className={`pill-subfilter ${subFilter === "Lewat SLA" ? "active" : ""}`}
                onClick={() => setSubFilter("Lewat SLA")}
              >
                Lewat SLA
              </button>
            </div>

            {/* Kartu Antrean (IT Support Queue) */}
            <div className="queue-card">
              <div className="queue-head">
                <div className="queue-title">
                  <h3>IT Support Queue</h3>
                  <div className="sub">Diurutkan dari yang paling lama menunggu</div>
                </div>
                <div className="queue-tools">
                  <button type="button" className="btn-tool" onClick={() => alert("Mengekspor antrean tiket ke Excel...")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                    Export Excel
                  </button>
                  <button type="button" className="btn-tool" onClick={() => alert("Filter antrean")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                    Filter
                  </button>
                </div>
              </div>

              {/* Kolom Pencarian */}
              <div className="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Cari ID tiket, subjek, peminta, email, departemen..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                />
              </div>

              {/* Tabel */}
              <div className="tbl-wrap">
                <table className="tix-table">
                  <thead>
                    <tr>
                      <th>TIKET</th>
                      <th>SUBJEK</th>
                      <th>PEMINTA</th>
                      <th>DEPARTEMEN</th>
                      <th>PRIORITAS</th>
                      <th>STATUS</th>
                      <th>DITANGANI</th>
                      <th>UMUR / SLA</th>
                      <th>AKSI CEPAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTableTickets.map((t) => (
                      <tr key={t.id}>
                        <td className="td-ticket">
                          <span
                            style={{ cursor: "pointer", textDecoration: "underline" }}
                            onClick={() => {
                              setSelectedTicketId(t.id);
                              setActiveTab("Chat");
                            }}
                          >
                            {t.id}
                          </span>
                        </td>
                        <td className="td-subject" title={t.subject}>
                          {t.subject}
                        </td>
                        <td>
                          <div className="td-user">
                            <span className="user-av" style={{ background: t.requester.avatarBg }}>
                              {t.requester.initials}
                            </span>
                            <div className="user-info">
                              <span className="user-name">{t.requester.name}</span>
                              <span className="user-email">{t.requester.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="td-dept">{t.department}</td>
                        <td>
                          <span className="pill-priority">{t.priority.toUpperCase()}</span>
                        </td>
                        <td>
                          <span className={`pill-status ${t.status === "Open" ? "open" : "resolved"}`}>
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                        <td className={`td-handler ${t.handler === "Unassigned" ? "unassigned" : ""}`}>
                          {t.handler}
                        </td>
                        <td>
                          {t.ageSla.includes("LEWAT") ? (
                            <span className="pill-sla-overdue">{t.ageSla}</span>
                          ) : (
                            <span style={{ fontSize: 12, color: "#667085", fontWeight: 700 }}>{t.ageSla}</span>
                          )}
                        </td>
                        <td>
                          <div className="tbl-actions-cell">
                            {t.handler === "Unassigned" ? (
                              <button
                                type="button"
                                className="btn-quick-black"
                                onClick={() => handleAssignToMe(t.id)}
                              >
                                Ambil
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-quick-white"
                                onClick={() => {
                                  setSelectedTicketId(t.id);
                                  setActiveTab("Chat");
                                }}
                              >
                                Buka Chat
                              </button>
                            )}

                            {t.handler === "Unassigned" && (
                              <select
                                className="btn-quick-white"
                                style={{ outline: "none", cursor: "pointer" }}
                                value={t.handler}
                                onChange={(e) => handleUpdateHandler(t.id, e.target.value)}
                              >
                                <option value="Unassigned">Assign &blacktriangledown;</option>
                                <option value="Bendry">Bendry</option>
                                <option value="Rudi Si'arudin">Rudi Si'arudin</option>
                              </select>
                            )}

                            <select
                              className="btn-quick-white"
                              style={{ outline: "none", cursor: "pointer" }}
                              value={t.status}
                              onChange={(e) => handleUpdateStatus(t.id, e.target.value as any)}
                            >
                              <option value="Open">Status &blacktriangledown;</option>
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer Tabel */}
                <div className="tbl-foot">
                  <div>
                    <b>{filteredTableTickets.length}</b> Total Tiket
                  </div>
                  <div className="pagination">
                    <button type="button" className="btn-page disabled">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <span>&lsaquo; 1 / 1 &rsaquo;</span>
                    <button type="button" className="btn-page disabled">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: VIEW ANALYTICS (SCREENSHOT 3) ================= */}
        {activeTab === "Analytics" && (
          <div>
            {/* 4 KPI Cards Analytics */}
            <div className="kpis">
              {/* Card 1: Rata-rata Resolusi */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#eef4ff" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </span>
                  Rata-rata Resolusi
                </div>
                <div className="num">
                  0,3 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>jam</span>
                </div>
                <div className="delta">
                  <span style={{ color: "#12805c", fontWeight: 800 }}>Target 24 jam &middot; jauh lebih cepat</span>
                </div>
              </div>

              {/* Card 2: Kepatuhan SLA */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#ecfdf3" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#12805c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  Kepatuhan SLA
                </div>
                <div className="num">
                  100 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>%</span>
                </div>
                <div className="delta">
                  <span style={{ color: "#12805c", fontWeight: 800 }}>Target 90% &middot; terpenuhi</span>
                </div>
              </div>

              {/* Card 3: Tiket Selesai */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#eef4ff" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2.5 2.5 0 0 0 0 5v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2.5 2.5 0 0 0 0-5Z" /></svg>
                  </span>
                  Tiket Selesai
                </div>
                <div className="num">
                  2 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>dari 3</span>
                </div>
                <div className="delta">
                  <span>1 masih terbuka &middot; belum di-assign</span>
                </div>
              </div>

              {/* Card 4: CSAT */}
              <div className="kpi">
                <div className="top">
                  <span className="ic" style={{ background: "#fffaeb" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b54708" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  </span>
                  CSAT
                </div>
                <div className="num">
                  0 <span style={{ fontSize: 15, fontWeight: 700, color: "#667085" }}>/ 5</span>
                </div>
                <div className="delta">
                  <span>Belum ada respons rating</span>
                </div>
              </div>
            </div>

            {/* 2x2 Grid Analytics */}
            <div className="analytics-grid">
              {/* Card 1: Status Tiket (Donut Chart) */}
              <div className="analytics-card">
                <div className="analytics-card-head">
                  <h4>Status Tiket</h4>
                  <div className="sub">Distribusi semua tiket tercatat</div>
                </div>
                <div className="donut-chart-wrap">
                  <div className="donut-chart-svg">
                    <svg width="150" height="150" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--donut-track, #f2f4f7)" strokeWidth="5" />
                      {/* Resolved: 67% (2 tickets) */}
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#2f6bff"
                        strokeWidth="5"
                        strokeDasharray="67 33"
                        strokeDashoffset="25"
                      />
                      {/* Open: 33% (1 ticket) */}
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="var(--donut-dark, #0a2540)"
                        strokeWidth="5"
                        strokeDasharray="33 67"
                        strokeDashoffset="58"
                      />
                    </svg>
                    <div className="donut-center-text">
                      <span className="donut-center-num">3</span>
                      <span className="donut-center-sub">Total Tiket</span>
                    </div>
                  </div>

                  <div className="donut-legend-list">
                    <div className="donut-legend-row">
                      <span className="donut-legend-label">
                        <span className="donut-dot" style={{ background: "#2f6bff" }} />
                        Resolved
                      </span>
                      <span className="donut-legend-val">2 &middot; 67%</span>
                    </div>
                    <div className="donut-legend-row">
                      <span className="donut-legend-label">
                        <span className="donut-dot" style={{ background: "var(--donut-dark, #0a2540)" }} />
                        Open
                      </span>
                      <span className="donut-legend-val">1 &middot; 33%</span>
                    </div>
                    <div className="donut-legend-row">
                      <span className="donut-legend-label">
                        <span className="donut-dot" style={{ background: "#06aed4" }} />
                        In Progress
                      </span>
                      <span className="donut-legend-val">0</span>
                    </div>
                    <div className="donut-legend-row">
                      <span className="donut-legend-label">
                        <span className="donut-dot" style={{ background: "#cbd5e1" }} />
                        Pending
                      </span>
                      <span className="donut-legend-val">0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Tiket Masuk per Bulan */}
              <div className="analytics-card">
                <div className="analytics-card-head">
                  <h4>Tiket Masuk per Bulan</h4>
                  <div className="sub">Tahun 2026 &middot; berdasarkan 3 tiket tercatat</div>
                </div>
                <div className="monthly-bars-wrap">
                  {[
                    { m: "Jan", v: 0 },
                    { m: "Feb", v: 0 },
                    { m: "Mar", v: 0 },
                    { m: "Apr", v: 2 },
                    { m: "Mei", v: 0 },
                    { m: "Jun", v: 0 },
                    { m: "Jul", v: 0 },
                    { m: "Agu", v: 0 },
                    { m: "Sep", v: 1 },
                    { m: "Okt", v: 0 },
                    { m: "Nov", v: 0 },
                    { m: "Des", v: 0 },
                  ].map((item) => (
                    <div className="month-col" key={item.m}>
                      <div
                        className="month-bar"
                        style={{
                          height: item.v === 0 ? "4px" : item.v === 2 ? "110px" : "60px",
                          background: item.v === 0 ? "var(--month-bar-empty, #eaecf0)" : "#2f6bff",
                        }}
                      >
                        {item.v > 0 && <span className="month-bar-val">{item.v}</span>}
                      </div>
                      <span className="month-name">{item.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Per Handler */}
              <div className="analytics-card">
                <div className="analytics-card-head">
                  <h4>Per Handler</h4>
                  <div className="sub">Tiket yang ditangani tiap petugas</div>
                </div>
                <table className="handler-table">
                  <thead>
                    <tr>
                      <th>HANDLER</th>
                      <th>SELESAI</th>
                      <th>TERBUKA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>Bendry</b></td>
                      <td>1</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td><b>Rudi Si'arudin</b></td>
                      <td>1</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td><b>Administrator</b></td>
                      <td>0</td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#dc2626", fontWeight: 800 }}>Belum di-assign</td>
                      <td>0</td>
                      <td style={{ color: "#dc2626", fontWeight: 800 }}>1</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Card 4: Per Kategori */}
              <div className="analytics-card">
                <div className="analytics-card-head">
                  <h4>Per Kategori</h4>
                  <div className="sub">Semua tiket saat ini berkategori General</div>
                </div>
                <div className="cat-list">
                  <div className="cat-item">
                    <span className="cat-label">General</span>
                    <div className="cat-bar-bg">
                      <div className="cat-bar-fill" style={{ width: "100%" }} />
                    </div>
                    <span className="cat-count">3</span>
                  </div>
                  <div className="cat-item">
                    <span className="cat-label">General Inquiry</span>
                    <div className="cat-bar-bg">
                      <div className="cat-bar-fill" style={{ width: "0%" }} />
                    </div>
                    <span className="cat-count">0</span>
                  </div>
                  <div className="cat-item">
                    <span className="cat-label">Technical Support</span>
                    <div className="cat-bar-bg">
                      <div className="cat-bar-fill" style={{ width: "0%" }} />
                    </div>
                    <span className="cat-count">0</span>
                  </div>
                  <div className="cat-item">
                    <span className="cat-label">Hardware Issue</span>
                    <div className="cat-bar-bg">
                      <div className="cat-bar-fill" style={{ width: "0%" }} />
                    </div>
                    <span className="cat-count">0</span>
                  </div>
                  <div className="cat-item">
                    <span className="cat-label">Account &amp; Access</span>
                    <div className="cat-bar-bg">
                      <div className="cat-bar-fill" style={{ width: "0%" }} />
                    </div>
                    <span className="cat-count">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= FOOTER HALAMAN ================= */}
        {showTopbar && (
          <div className="foot">
            <span>&copy; 2026 The Gesit Companies &middot; GESIT Portal &middot; Ticketing Manager</span>
            <span>
              <span style={{ color: "#12b76a" }}>&bull;</span> Online&nbsp;&nbsp;|&nbsp;&nbsp;v4.1.2
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

export default TicketingManager;
