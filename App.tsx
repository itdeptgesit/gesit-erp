
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NetworkDashboard } from './components/NetworkDashboard';
import { AssetManager } from './components/AssetManager';
import { ActivityLogManager } from './components/ActivityLogManager';
import { WeeklyPlanManager } from './components/WeeklyPlanManager';
import { PurchasePlanManager } from './components/PurchasePlanManager';
import { PurchaseRecordManager } from './components/PurchaseRecordManager';
import { UserManagement } from './components/UserManagement';
import { ProfileView } from './components/ProfileView';
import { MainDashboard } from './components/MainDashboard';
import { MasterCompany } from './components/MasterCompany';
import { MasterDepartment } from './components/MasterDepartment';
import { MasterCategory } from './components/MasterCategory';
import { MasterGroup } from './components/MasterGroup';
import { FileManager } from './components/FileManager';
import { SystemMaintenance } from './components/SystemMaintenance';
import { SystemSettings } from './components/SystemSettings';
import { AnnouncementManager } from './components/AnnouncementManager';
import { LoginPage } from './components/LoginPage';
import { AssetPublicDetail } from './components/AssetPublicDetail';
import { HelpdeskPublic } from './components/HelpdeskPublic';
import { HelpdeskManager } from './components/HelpdeskManager';
import { DangerConfirmModal } from './components/DangerConfirmModal';
import { supabase } from './lib/supabaseClient';
import { UserAccount, UserGroup } from './types';
import { MOCK_GROUPS } from './constants';
import { Language, translations, LanguageContext } from './translations';
import {
  LayoutGrid, LifeBuoy, Activity, Calendar, ShoppingCart, Package,
  Network, Folder, Shield, ChevronDown, ChevronRight, X, Users, Building2,
  Briefcase, Layers, Zap, ChevronLeft, PanelLeftClose, PanelLeft, Phone,
  Settings, Megaphone
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [groupDefinitions, setGroupDefinitions] = useState<UserGroup[]>(MOCK_GROUPS);
  const [appSettings, setAppSettings] = useState({
    name: 'Gesit ERP',
    logo: 'https://raw.githubusercontent.com/rudisiarudin/gesit-it/refs/heads/main/public/logo.png'
  });

  const [isPublicAssetView, setIsPublicAssetView] = useState(false);
  const [publicAssetId, setPublicAssetId] = useState('');
  const [isPublicHelpdesk, setIsPublicHelpdesk] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const assetId = params.get('id');
    const path = window.location.pathname;

    if (path.includes('/helpdesk')) {
      setIsPublicHelpdesk(true);
      return;
    }

    if (assetId) {
      setIsPublicAssetView(true);
      setPublicAssetId(assetId);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        handleLogin(session.user.email);
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
    setIsMobileMenuOpen(false);
  };

  const refreshUserProfile = async () => {
    if (currentUser?.email) {
      await handleLogin(currentUser.email);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <MainDashboard onNavigate={handleNavigate} />;
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
      case 'files':
        return <FileManager currentUser={currentUser} />;
      case 'users':
        return <UserManagement onUpdateSuccess={refreshUserProfile} />;
      case 'master-company':
        return <MasterCompany />;
      case 'master-department':
        return <MasterDepartment />;
      case 'master-category':
        return <MasterCategory />;
      case 'master-group':
        return <MasterGroup />;
      case 'system-settings':
        return <SystemSettings />;
      case 'announcements':
        return <AnnouncementManager />;
      case 'maintenance':
        return <SystemMaintenance />;
      case 'profile':
        return <ProfileView onLogout={() => setIsLogoutModalOpen(true)} user={currentUser} onUpdateSuccess={refreshUserProfile} />;
      default:
        return <MainDashboard onNavigate={handleNavigate} />;
    }
  };

  if (isPublicHelpdesk) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <HelpdeskPublic />
      </LanguageContext.Provider>
    );
  }

  if (isPublicAssetView) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <AssetPublicDetail assetId={publicAssetId} />
      </LanguageContext.Provider>
    );
  }

  if (!isAuthenticated) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <LoginPage onLogin={handleLogin} />
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="flex h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          userGroups={currentUser?.groups || []}
          userName={currentUser?.fullName || 'User'}
          userRole={currentUser?.role}
          groupDefinitions={groupDefinitions}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          appName={appSettings.name}
          logoUrl={appSettings.logo}
        />
        <div className={`flex-1 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} flex flex-col h-screen overflow-hidden transition-all duration-300`}>
          <Header
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onLogout={() => setIsLogoutModalOpen(true)}
            onNavigate={handleNavigate}
            user={currentUser ? {
              name: currentUser.fullName,
              role: currentUser.role,
              email: currentUser.email,
              jobTitle: currentUser.jobTitle,
              avatarUrl: currentUser.avatarUrl
            } : undefined}
          />
          <main className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
            <AnnouncementBanner />
            <div className="flex-1 p-4 md:p-10">
              <div className="max-w-7xl mx-auto h-full">
                {renderContent()}
              </div>
            </div>
            <Footer />
          </main>
        </div>

        <DangerConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={executeLogout}
          title={t('signOutTitle')}
          message={t('signOutMsg')}
        />
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
    <div className={`${colorMap[activeAnnouncement.type] || 'bg-blue-600'} text-white px-6 py-2.5 flex items-center justify-center gap-3 animate-in slide-in-from-top-full duration-500 shadow-lg relative z-20`}>
      <Megaphone size={16} className="shrink-0 animate-bounce" />
      <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] truncate">
        {activeAnnouncement.title}: <span className="font-medium normal-case tracking-normal ml-2">{activeAnnouncement.content}</span>
      </p>
      <button onClick={() => setActiveAnnouncement(null)} className="ml-4 hover:bg-white/20 p-1 rounded-lg transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};
