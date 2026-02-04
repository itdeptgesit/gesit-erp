
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MainDashboard } from './components/MainDashboard';
import { Navbar } from './components/Navbar';
import { supabase } from './lib/supabaseClient';
import { UserAccount, UserGroup } from './types';
import { MOCK_GROUPS } from './constants';
import { Language, translations, LanguageContext } from './translations';
import {
  LayoutGrid, LifeBuoy, Activity, Calendar, ShoppingCart, Package,
  Network, Folder, Shield, ChevronDown, ChevronRight, X, Users, Building2,
  Briefcase, Layers, Zap, ChevronLeft, PanelLeftClose, PanelLeft, Phone,
  Settings, Megaphone, Loader2
} from 'lucide-react';

// Lazy Load Managers for Better INP (Interaction responsiveness)
const NetworkDashboard = React.lazy(() => import('./components/NetworkDashboard').then(m => ({ default: m.NetworkDashboard })));
const AssetManager = React.lazy(() => import('./components/AssetManager').then(m => ({ default: m.AssetManager })));
const AssetLoanManager = React.lazy(() => import('./components/AssetLoanManager').then(m => ({ default: m.AssetLoanManager })));
const ActivityLogManager = React.lazy(() => import('./components/ActivityLogManager').then(m => ({ default: m.ActivityLogManager })));
const WeeklyPlanManager = React.lazy(() => import('./components/WeeklyPlanManager').then(m => ({ default: m.WeeklyPlanManager })));
const PurchasePlanManager = React.lazy(() => import('./components/PurchasePlanManager').then(m => ({ default: m.PurchasePlanManager })));
const PurchaseRecordManager = React.lazy(() => import('./components/PurchaseRecordManager').then(m => ({ default: m.PurchaseRecordManager })));
const UserManagement = React.lazy(() => import('./components/UserManagement').then(m => ({ default: m.UserManagement })));
const ProfileView = React.lazy(() => import('./components/ProfileView').then(m => ({ default: m.ProfileView })));
const MasterCompany = React.lazy(() => import('./components/MasterCompany').then(m => ({ default: m.MasterCompany })));
const MasterDepartment = React.lazy(() => import('./components/MasterDepartment').then(m => ({ default: m.MasterDepartment })));
const MasterCategory = React.lazy(() => import('./components/MasterCategory').then(m => ({ default: m.MasterCategory })));
const MasterGroup = React.lazy(() => import('./components/MasterGroup').then(m => ({ default: m.MasterGroup })));
const FileManager = React.lazy(() => import('./components/FileManager').then(m => ({ default: m.FileManager })));
const SystemMaintenance = React.lazy(() => import('./components/SystemMaintenance').then(m => ({ default: m.SystemMaintenance })));
const SystemSettings = React.lazy(() => import('./components/SystemSettings').then(m => ({ default: m.SystemSettings })));
const AnnouncementManager = React.lazy(() => import('./components/AnnouncementManager').then(m => ({ default: m.AnnouncementManager })));
const ExtensionDirectory = React.lazy(() => import('./components/ExtensionDirectory').then(m => ({ default: m.ExtensionDirectory })));
const AuditLogManager = React.lazy(() => import('./components/AuditLogManager').then(m => ({ default: m.AuditLogManager })));
const HelpdeskManager = React.lazy(() => import('./components/HelpdeskManager').then(m => ({ default: m.HelpdeskManager })));
const LoginPage = React.lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const AssetPublicDetail = React.lazy(() => import('./components/AssetPublicDetail').then(m => ({ default: m.AssetPublicDetail })));
const HelpdeskPublic = React.lazy(() => import('./components/HelpdeskPublic').then(m => ({ default: m.HelpdeskPublic })));
const DangerConfirmModal = React.lazy(() => import('./components/DangerConfirmModal').then(m => ({ default: m.DangerConfirmModal })));

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [groupDefinitions, setGroupDefinitions] = useState<UserGroup[]>(MOCK_GROUPS);
  const [appSettings, setAppSettings] = useState({
    name: 'Gesit ERP',
    logo: 'https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png'
  });

  const [isPublicAssetView, setIsPublicAssetView] = useState(false);
  const [publicAssetId, setPublicAssetId] = useState('');
  const [isPublicHelpdesk, setIsPublicHelpdesk] = useState(false);
  const [isPublicDirectory, setIsPublicDirectory] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');

  // Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assetId = params.get('id');
    const path = window.location.pathname;

    if (path.includes('/helpdesk')) {
      setIsPublicHelpdesk(true);
      setIsCheckingSession(false);
      return;
    }

    if (path.includes('/directory')) {
      setIsPublicDirectory(true);
      setIsCheckingSession(false);
      return;
    }

    if (assetId) {
      setIsPublicAssetView(true);
      setPublicAssetId(assetId);
      setIsCheckingSession(false);
      return;
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setLanguageState(savedLang);

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          await handleLogin(session.user.email);
        }
      } catch (err) {
        console.error("Session check failed", err);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('system_settings').select('*').single();
        if (data) {
          setAppSettings({
            name: data.app_name || 'Gesit ERP',
            logo: data.logo_url || 'https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png'
          });
        }
      } catch (err) { /* ignore */ }
    };
    fetchSettings();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await supabase.from('user_groups').select('*');
      if (data && data.length > 0) {
        const mapped = data.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          allowedMenus: g.allowed_menus || []
        }));
        setGroupDefinitions(mapped);
      }
    };
    if (isAuthenticated) fetchGroups();
  }, [isAuthenticated]);

  const updateUserActivity = async () => {
    if (!currentUser?.email) return;
    try {
      await supabase
        .from('user_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('email', currentUser.email);
    } catch (err) {
      console.warn("Heartbeat update failed", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // First heartbeat
      updateUserActivity();

      const interval = setInterval(updateUserActivity, 300000); // Pulse every 5 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser?.email]);

  const handleLogin = async (email: string) => {
    const { data } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('email', email)
      .single();

    if (data) {
      const userProfile: UserAccount = {
        id: data.id,
        email: data.email,
        username: data.username,
        fullName: data.full_name,
        role: data.role,
        groups: data.groups || [],
        status: data.status,
        department: data.department,
        phone: data.phone,
        address: data.address,
        jobTitle: data.job_title,
        supervisorId: data.supervisor_id?.toString(),
        managerId: data.manager_id?.toString(),
        avatarUrl: data.avatar_url,
        company: data.company
      };
      setCurrentUser(userProfile);
      setIsAuthenticated(true);

      // Update timestamp on login
      await supabase
        .from('user_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('email', email);
    } else {
      setIsAuthenticated(true);
    }
  };

  const executeLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    setIsLogoutModalOpen(false);
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  const refreshUserProfile = async () => {
    if (currentUser?.email) {
      await handleLogin(currentUser.email);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <MainDashboard onNavigate={handleNavigate} userName={currentUser?.fullName} />;
      case 'helpdesk':
        return <HelpdeskManager currentUser={currentUser} />;
      case 'activity':
        return <ActivityLogManager currentUser={currentUser} />;
      case 'weekly':
        return <WeeklyPlanManager currentUser={currentUser} />;
      case 'purchase':
        return <PurchasePlanManager currentUser={currentUser} />;
      case 'purchase-record':
        return <PurchaseRecordManager />;
      case 'network':
        return <NetworkDashboard onBack={() => handleNavigate('dashboard')} currentUser={currentUser} />;
      case 'assets':
        return <AssetManager currentUser={currentUser} />;
      case 'asset-loan':
        return <AssetLoanManager currentUser={currentUser} />;
      case 'files':
        return <FileManager currentUser={currentUser} />;
      case 'extension-directory':
        return <ExtensionDirectory currentUser={currentUser} />;
      case 'users':
        return <UserManagement onUpdateSuccess={refreshUserProfile} currentUser={currentUser} />;
      case 'master-company':
        return <MasterCompany currentUser={currentUser} />;
      case 'master-department':
        return <MasterDepartment currentUser={currentUser} />;
      case 'master-category':
        return <MasterCategory currentUser={currentUser} />;
      case 'master-group':
        return <MasterGroup currentUser={currentUser} />;
      case 'system-settings':
        return <SystemSettings currentUser={currentUser} />;
      case 'tracking-log':
        return <AuditLogManager currentUser={currentUser} />;
      case 'announcements':
        return <AnnouncementManager />;
      case 'maintenance':
        return <SystemMaintenance />;
      case 'profile':
        return <ProfileView onLogout={() => setIsLogoutModalOpen(true)} user={currentUser} onUpdateSuccess={refreshUserProfile} />;
      default:
        return <MainDashboard onNavigate={handleNavigate} userName={currentUser?.fullName} />;
    }
  };

  if (isPublicHelpdesk) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <React.Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
          <HelpdeskPublic />
        </React.Suspense>
      </LanguageContext.Provider>
    );
  }

  if (isPublicDirectory) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 md:p-10">
          <div className="max-w-7xl mx-auto">
            <React.Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
              <ExtensionDirectory />
            </React.Suspense>
          </div>
        </div>
      </LanguageContext.Provider>
    );
  }

  if (isPublicAssetView) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <React.Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
          <AssetPublicDetail assetId={publicAssetId} />
        </React.Suspense>
      </LanguageContext.Provider>
    );
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-10">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center">
            <Zap className="text-blue-600 animate-pulse" size={32} />
          </div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <React.Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
          <LoginPage onLogin={handleLogin} />
        </React.Suspense>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => { handleNavigate(view); setIsMobileSidebarOpen(false); }}
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          userGroups={currentUser?.groups || []}
          userName={currentUser?.fullName || 'User'}
          userRole={currentUser?.role}
          groupDefinitions={groupDefinitions}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          appName={appSettings.name}
          logoUrl={appSettings.logo}
        />

        <Header
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onLogout={() => setIsLogoutModalOpen(true)}
          onNavigate={handleNavigate}
          appName={appSettings.name}
          logoUrl={appSettings.logo}
          user={currentUser ? {
            name: currentUser.fullName,
            role: currentUser.role,
            email: currentUser.email,
            jobTitle: currentUser.jobTitle,
            avatarUrl: currentUser.avatarUrl
          } : undefined}
        />

        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          userGroups={currentUser?.groups || []}
          userRole={currentUser?.role}
          groupDefinitions={groupDefinitions}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <main className={`flex-1 overflow-y-auto flex flex-col custom-scrollbar`}>
            {/* Reserved space container for banner to prevent CLS */}
            <div className="min-h-[40px] md:min-h-[36px] bg-transparent">
              <AnnouncementBanner />
            </div>
            <div className="flex-1 p-4 md:p-8">
              <div className="max-w-[1800px] mx-auto h-full">
                <React.Suspense fallback={
                  <div className="h-full flex flex-col items-center justify-center gap-4 animate-pulse">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Module...</p>
                  </div>
                }>
                  {renderContent()}
                </React.Suspense>
              </div>
            </div>
            <Footer />
          </main>
        </div>

        <React.Suspense fallback={null}>
          <DangerConfirmModal
            isOpen={isLogoutModalOpen}
            onClose={() => setIsLogoutModalOpen(false)}
            onConfirm={executeLogout}
            title={t('signOutTitle')}
            message={t('signOutMsg')}
          />
        </React.Suspense>
      </div>
    </LanguageContext.Provider>
  );
};

export default App;

const AnnouncementBanner: React.FC = () => {
  const [activeAnnouncement, setActiveAnnouncement] = useState<any>(null);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const { data } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data) setActiveAnnouncement(data);
      } catch (err) {
        // Silent fail
      }
    };
    fetchActive();
  }, []);

  if (!activeAnnouncement) return null;

  const colorMap: any = {
    info: 'bg-blue-600',
    warning: 'bg-amber-500',
    error: 'bg-rose-600',
    success: 'bg-emerald-600'
  };

  return (
    <div className={`${colorMap[activeAnnouncement.type] || 'bg-blue-600'} text-white px-6 py-2.5 flex items-center justify-center gap-3 animate-in slide-in-from-top-full duration-500 shadow-lg relative z-20 h-full`}>
      <Megaphone size={16} className="shrink-0 animate-bounce" />
      <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] truncate">
        {activeAnnouncement.title}: <span className="font-medium normal-case tracking-normal ml-2">{activeAnnouncement.content}</span>
      </p>
      <button onClick={() => setActiveAnnouncement(null)} aria-label="Dismiss announcement" className="ml-4 hover:bg-white/20 p-1 rounded-lg transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};
