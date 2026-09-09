
export const APP_NAME = 'GESIT PORTAL';

// For demo purposes, we simulate the logged-in user's groups if not found in DB
export const CURRENT_USER_GROUPS = ['admin'];

export const MOCK_GROUPS = [
    { id: 'admin', name: 'Administrators', description: 'Full Access', allowedMenus: ['dashboard', 'operations', 'helpdesk', 'activity', 'weekly', 'network', 'procurement', 'purchase', 'purchase-record', 'asset-management', 'assets', 'asset-loan', 'asset-handover', 'office-directory', 'office-layout', 'extension-directory', 'admin', 'users', 'system-settings', 'tracking-log', 'announcements', 'master-company', 'master-department', 'master-group', 'master-category', 'maintenance', 'credential'] },
    { id: 'staff', name: 'IT Staff', description: 'Operational Access', allowedMenus: ['dashboard', 'operations', 'helpdesk', 'activity', 'weekly', 'network', 'procurement', 'purchase', 'purchase-record', 'asset-management', 'assets', 'asset-loan', 'asset-handover', 'office-directory', 'office-layout', 'extension-directory'] },
    { id: 'user', name: 'Users', description: 'View Only', allowedMenus: ['dashboard', 'operations', 'helpdesk', 'asset-management', 'asset-loan', 'office-directory', 'office-layout', 'extension-directory'] }
];

export const APP_MENU_STRUCTURE = [
    // 1. Home (Standalone)
    { id: 'dashboard', label: 'Home', iconName: 'LayoutDashboard' },

    // 2. Operations (Ticketing, Activities, Planner, Infrastructure)
    { id: 'operations', label: 'Operations', iconName: 'Activity' },
    { id: 'helpdesk', label: 'Ticketing', parentId: 'operations', iconName: 'LifeBuoy' },
    { id: 'activity', label: 'Activities', parentId: 'operations', iconName: 'Activity' },
    { id: 'weekly', label: 'Planner', parentId: 'operations', iconName: 'Calendar' },
    { id: 'network', label: 'Infrastructure', parentId: 'operations', iconName: 'Network' },

    // 3. Procurement (Procurement, Purchase Record)
    { id: 'procurement', label: 'Procurement', iconName: 'ShoppingCart' },
    { id: 'purchase', label: 'Procurement', parentId: 'procurement', iconName: 'ShoppingCart' },
    { id: 'purchase-record', label: 'Purchase Record', parentId: 'procurement', iconName: 'Receipt' },

    // 4. Asset Management (Assets, Asset Loan, Asset Handover)
    { id: 'asset-management', label: 'Asset Management', iconName: 'Cpu' },
    { id: 'assets', label: 'Assets', parentId: 'asset-management', iconName: 'Cpu' },
    { id: 'asset-loan', label: 'Asset Loan', parentId: 'asset-management', iconName: 'ArrowLeftRight' },
    { id: 'asset-handover', label: 'Asset Handover', parentId: 'asset-management', iconName: 'FileCheck' },

    // 5. Office & Directory (Office Layout, Phone Directory)
    { id: 'office-directory', label: 'Office & Directory', iconName: 'Building2' },
    { id: 'office-layout', label: 'Office Layout', parentId: 'office-directory', iconName: 'MapPin' },
    { id: 'extension-directory', label: 'Phone Directory', parentId: 'office-directory', iconName: 'Phone' },

    // 6. Administration (Settings & Setup)
    { id: 'admin', label: 'Administration', iconName: 'Shield' },
    { id: 'users', label: 'User Accounts', parentId: 'admin', iconName: 'Users' },
    { id: 'credential', label: 'Credentials', parentId: 'admin', iconName: 'Key' },
    { id: 'system-settings', label: 'System Settings', parentId: 'admin', iconName: 'Settings' },
    { id: 'tracking-log', label: 'Tracking Log', parentId: 'admin', iconName: 'History' },
    { id: 'announcements', label: 'Broadcasts', parentId: 'admin', iconName: 'Megaphone' },
    { id: 'master-company', label: 'Company Data', parentId: 'admin', iconName: 'Building2' },
    { id: 'master-department', label: 'Departments', parentId: 'admin', iconName: 'Briefcase' },
    { id: 'master-category', label: 'Asset Categories', parentId: 'admin', iconName: 'Layers' },
    { id: 'master-group', label: 'Groups & Access', parentId: 'admin', iconName: 'Fingerprint' },
    { id: 'maintenance', label: 'System Wipe', parentId: 'admin', iconName: 'Zap' },
];

