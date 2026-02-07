
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { TopNavigation } from './components/TopNavigation';
import { Footer } from './components/Footer';

import { supabase } from './lib/supabaseClient';
import { UserAccount, UserGroup } from './types';
import { MOCK_GROUPS } from './constants';
import { Language, translations, LanguageContext } from './translations';
import {
  LayoutGrid, LifeBuoy, Activity, Calendar, ShoppingCart, Package,
  Network, Folder, Shield, ChevronDown, ChevronRight, X, Users, Building2,
  Briefcase, Layers, Zap, ChevronLeft, PanelLeftClose, PanelLeft, Phone,
  Settings, Megaphone, Loader2, CheckCircle2
} from 'lucide-react';

// Lazy Load Managers
const MainDashboard = React.lazy(() => import('./components/MainDashboard').then(m => ({ default: m.MainDashboard })));
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

const PublicLayout: React.FC<{
  children: React.ReactNode;
  appSettings: any;
  onLogout: () => void;
  currentUser: UserAccount | null;
  groupDefinitions: UserGroup[];
  variant?: 'admin' | 'public';
  searchProps?: {
    value: string;
    onChange: (val: string) => void;
  };
}> = ({ children, appSettings, onLogout, currentUser, groupDefinitions, variant = 'admin', searchProps }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      <TopNavigation
        onMenuClick={() => setIsMobileSidebarOpen(true)}
        onLogout={onLogout}
        userGroups={currentUser?.groups || []}
        userRole={currentUser?.role}
        groupDefinitions={groupDefinitions}
        user={currentUser ? {
          name: currentUser.fullName,
          role: currentUser.role,
          email: currentUser.email,
          jobTitle: currentUser.jobTitle,
          avatarUrl: currentUser.avatarUrl
        } : undefined}
        appName={appSettings.name}
        logoUrl={appSettings.logo}
        variant={variant}
        searchProps={searchProps}
        floorFilter={appSettings.floorFilter}
        onFloorFilterChange={appSettings.onFloorFilterChange}
        onShare={appSettings.onShare}
      />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>

      <Footer />

      <Sidebar
        currentView={location.pathname.substring(1) || 'dashboard'}
        onClose={() => setIsMobileSidebarOpen(false)}
        isMobileOpen={isMobileSidebarOpen}
        userGroups={currentUser?.groups || []}
        userName={currentUser?.fullName || 'User'}
        userRole={currentUser?.role}
        groupDefinitions={groupDefinitions}
        isCollapsed={false}
        setIsCollapsed={() => { }}
        appName={appSettings.name}
        logoUrl={appSettings.logo}
      />
    </div>
  );
};

const InternalApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [groupDefinitions, setGroupDefinitions] = useState<UserGroup[]>(MOCK_GROUPS);
  const [appSettings, setAppSettings] = useState({
    name: 'GESIT WORK',
    logo: '/image/logo.png',
    primaryColor: '#2563eb'
  });

  const [language, setLanguageState] = useState<Language>('en');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [globalFloorFilter, setGlobalFloorFilter] = useState<'All' | 26 | 27>('All');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const LOADING_MESSAGES = [
    "Synchronizing secure layers...",
    "Initializing core modules...",
    "Calibrating technical nodes...",
    "Authenticating credentials...",
    "Commencing Gesit Work..."
  ];

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isCheckingSession) {
      const interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isCheckingSession]);

  console.log("App.tsx: Rendering InternalApp, isCheckingSession:", isCheckingSession);

  useEffect(() => {
    console.log("App.tsx: Running initial effect...");
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
      console.log("App.tsx: Checking session...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("App.tsx: Session check result:", !!session);
        if (session?.user?.email) {
          await handleLogin(session.user.email);
        }
      } catch (err) {
        console.error("App.tsx: Session check failed", err);
      } finally {
        console.log("App.tsx: Session check complete, setting loading to false.");
        setIsCheckingSession(false);
      }
    };

    // Safety timeout
    const timeout = setTimeout(() => {
      if (isCheckingSession) {
        console.warn("App.tsx: Session check timing out, forcing UI render.");
        setIsCheckingSession(false);
      }
    }, 5000);

    checkSession();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('system_settings').select('*').single();
        if (data) {
          const newSettings = {
            name: data.app_name || 'GESIT WORK',
            logo: data.logo_url || '/image/logo.png',
            primaryColor: data.primary_color || '#2563eb'
          };
          setAppSettings(newSettings);

          // Apply primary color to CSS variables
          document.documentElement.style.setProperty('--primary', newSettings.primaryColor);
          document.documentElement.style.setProperty('--color-primary', newSettings.primaryColor);
        }
      } catch (err) { /* ignore */ }
    };
    if (!isCheckingSession) fetchSettings();
  }, [isCheckingSession]);

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
    console.log("App.tsx: Handling login for", email);
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
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
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const executeLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  const refreshUserProfile = async () => {
    if (currentUser?.email) {
      await handleLogin(currentUser.email);
    }
  };

  const handleGlobalShare = () => {
    const url = window.location.origin + '/directory';
    navigator.clipboard.writeText(url);
    showToast('Directory link copied to clipboard!', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <AnimatePresence mode="wait">
        {isCheckingSession ? (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#020617] overflow-hidden"
          >
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 180, 270, 360],
                  x: [0, 100, 0, -100, 0],
                  y: [0, -50, 50, -50, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[120px] transform-gpu"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 270, 180, 90, 0],
                  x: [0, -100, 0, 100, 0],
                  y: [0, 50, -50, 50, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[100px] transform-gpu"
              />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12">
              <div className="relative w-24 h-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-blue-500/20 rounded-[2.5rem]"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-2 border-blue-400/10 rounded-[2rem]"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 border border-blue-400/30">
                    <Zap className="text-white fill-white/20" size={32} />
                  </div>
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <h1 className="text-2xl font-black text-white tracking-[0.2em] mb-1">
                    GESIT<span className="text-blue-500">WORK</span>
                  </h1>
                  <div className="h-[2px] w-48 bg-slate-800 rounded-full overflow-hidden relative">
                    <motion.div
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMsgIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400/60 text-center min-w-[300px]"
                  >
                    {LOADING_MESSAGES[loadingMsgIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col min-h-screen"
          >
            <React.Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
              <Routes location={location} key={location.pathname}>
                <Route path="/helpdesk-public" element={
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                    <HelpdeskPublic />
                  </motion.div>
                } />
                <Route path="/directory" element={
                  <PublicLayout
                    onLogout={() => setIsLogoutModalOpen(true)}
                    currentUser={currentUser}
                    groupDefinitions={groupDefinitions}
                    variant="public"
                    searchProps={{ value: globalSearchTerm, onChange: setGlobalSearchTerm }}
                    appSettings={{
                      ...appSettings,
                      floorFilter: globalFloorFilter,
                      onFloorFilterChange: setGlobalFloorFilter,
                      onShare: handleGlobalShare
                    }}
                  >
                    <ExtensionDirectory
                      currentUser={currentUser}
                      variant="integrated"
                      externalSearchTerm={globalSearchTerm}
                      externalFloorFilter={globalFloorFilter}
                    />
                  </PublicLayout>
                } />
                <Route path="/asset/:id?" element={<AssetRouteWrapper />} />
                <Route path="/login" element={
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    {!isAuthenticated ? (
                      <LoginPage
                        onLogin={handleLogin}
                        appName={appSettings.name}
                        logoUrl={appSettings.logo}
                        primaryColor={appSettings.primaryColor}
                      />
                    ) : <Navigate to="/" />}
                  </motion.div>
                } />

                <Route path="/helpdesk" element={!isAuthenticated ? <Navigate to="/helpdesk-public" /> : <ProtectedRoute isAuthenticated={isAuthenticated}><DashboardLayout isCheckingSession={isCheckingSession} appSettings={appSettings} currentUser={currentUser} groupDefinitions={groupDefinitions} isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} setIsLogoutModalOpen={setIsLogoutModalOpen} floorFilter={globalFloorFilter} onFloorFilterChange={setGlobalFloorFilter} onShare={handleGlobalShare} children={<HelpdeskManager currentUser={currentUser} />} /></ProtectedRoute>} />

                <Route path="/*" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <DashboardLayout
                      appSettings={appSettings}
                      currentUser={currentUser}
                      groupDefinitions={groupDefinitions}
                      isMobileSidebarOpen={isMobileSidebarOpen}
                      setIsMobileSidebarOpen={setIsMobileSidebarOpen}
                      isSidebarCollapsed={isSidebarCollapsed}
                      setIsSidebarCollapsed={setIsSidebarCollapsed}
                      setIsLogoutModalOpen={setIsLogoutModalOpen}
                      refreshUserProfile={refreshUserProfile}
                      floorFilter={globalFloorFilter}
                      onFloorFilterChange={setGlobalFloorFilter}
                      onShare={handleGlobalShare}
                    />
                  </ProtectedRoute>
                } />
              </Routes>

              <DangerConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={executeLogout}
                title={t('signOutTitle')}
                message={t('signOutMsg')}
              />

              <AnimatePresence>
                {toast && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
                  >
                    <div className="flex items-center gap-3 px-6 py-4 bg-slate-900/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/10 dark:border-slate-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] min-w-[320px]">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notification</p>
                        <p className="text-[13px] font-bold text-white tracking-tight">{toast.message}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </LanguageContext.Provider>
  );
};

// Wrapper Component to provide Router Context
const App: React.FC = () => {
  return <InternalApp />;
};

export default App;

const AssetRouteWrapper: React.FC = () => {
  const { id } = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return { id: params.get('id') };
  }, []);
  const pathId = useLocation().pathname.split('/').pop();
  return <AssetPublicDetail assetId={id || pathId || ''} />;
};

const ProtectedRoute: React.FC<{ isAuthenticated: boolean; children: React.ReactNode }> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const DashboardLayout: React.FC<any & { children?: React.ReactNode }> = ({
  appSettings, currentUser, groupDefinitions,
  isMobileSidebarOpen, setIsMobileSidebarOpen,
  isSidebarCollapsed, setIsSidebarCollapsed,
  setIsLogoutModalOpen, refreshUserProfile,
  floorFilter, onFloorFilterChange, onShare,
  children
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.substring(1) || 'dashboard';

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar
        currentView={currentView}
        onClose={() => setIsMobileSidebarOpen(false)}
        isMobileOpen={isMobileSidebarOpen}
        userGroups={currentUser?.groups || []}
        userName={currentUser?.fullName || 'User'}
        userRole={currentUser?.role}
        groupDefinitions={groupDefinitions}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        appName={appSettings.name}
        logoUrl={appSettings.logo}
      />

      <TopNavigation
        onMenuClick={() => setIsMobileSidebarOpen(true)}
        onLogout={() => setIsLogoutModalOpen(true)}
        userGroups={currentUser?.groups || []}
        userRole={currentUser?.role}
        groupDefinitions={groupDefinitions}
        user={currentUser ? {
          name: currentUser.fullName,
          role: currentUser.role,
          email: currentUser.email,
          jobTitle: currentUser.jobTitle,
          avatarUrl: currentUser.avatarUrl
        } : undefined}
        appName={appSettings.name}
        logoUrl={appSettings.logo}
        floorFilter={floorFilter}
        onFloorFilterChange={onFloorFilterChange}
        onShare={onShare}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <main className={`flex-1 overflow-y-auto flex flex-col custom-scrollbar`}>
          <div className="min-h-[40px] md:min-h-[36px] bg-transparent">
            {/* Announcement Banner placeholder or similar */}
          </div>
          <div className="flex-1 p-4 md:p-8">
            <div className="max-w-[1800px] mx-auto h-full">
              {children ? children : (
                <Routes>
                  <Route index element={<MainDashboard onNavigate={(v) => navigate(`/${v}`)} userName={currentUser?.fullName} />} />
                  <Route path="helpdesk" element={<HelpdeskManager currentUser={currentUser} />} />
                  <Route path="activity" element={<ActivityLogManager currentUser={currentUser} />} />
                  <Route path="weekly" element={<WeeklyPlanManager currentUser={currentUser} />} />
                  <Route path="purchase" element={<PurchasePlanManager currentUser={currentUser} />} />
                  <Route path="purchase-record" element={<PurchaseRecordManager />} />
                  <Route path="network" element={<NetworkDashboard onBack={() => navigate('/')} currentUser={currentUser} />} />
                  <Route path="assets" element={<AssetManager currentUser={currentUser} />} />
                  <Route path="asset-loan" element={<AssetLoanManager currentUser={currentUser} />} />
                  <Route path="files" element={<FileManager currentUser={currentUser} />} />
                  <Route path="extension-directory" element={<ExtensionDirectory currentUser={currentUser} externalFloorFilter={floorFilter} />} />
                  <Route path="users" element={<UserManagement onUpdateSuccess={refreshUserProfile} currentUser={currentUser} />} />
                  <Route path="master-company" element={<MasterCompany currentUser={currentUser} />} />
                  <Route path="master-department" element={<MasterDepartment currentUser={currentUser} />} />
                  <Route path="master-category" element={<MasterCategory currentUser={currentUser} />} />
                  <Route path="master-group" element={<MasterGroup currentUser={currentUser} />} />
                  <Route path="system-settings" element={<SystemSettings currentUser={currentUser} />} />
                  <Route path="tracking-log" element={<AuditLogManager currentUser={currentUser} />} />
                  <Route path="announcements" element={<AnnouncementManager />} />
                  <Route path="maintenance" element={<SystemMaintenance />} />
                  <Route path="profile" element={<ProfileView onLogout={() => setIsLogoutModalOpen(true)} user={currentUser} onUpdateSuccess={refreshUserProfile} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              )}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};
