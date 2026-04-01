
export const APP_NAME = 'GESIT PORTAL';

// For demo purposes, we simulate the logged-in user's groups if not found in DB
export const CURRENT_USER_GROUPS = ['admin'];

export const MOCK_GROUPS = [
    { id: 'admin', name: 'Administrators', description: 'Full Access', allowedMenus: ['dashboard', 'helpdesk', 'activity', 'weekly', 'purchase', 'purchase-record', 'assets', 'asset-loan', 'network', 'files', 'extension-directory', 'admin', 'users', 'system-settings', 'tracking-log', 'announcements', 'master-company', 'master-department', 'master-group', 'master-category', 'maintenance', 'credential'] },
    { id: 'staff', name: 'IT Staff', description: 'Operational Access', allowedMenus: ['dashboard', 'helpdesk', 'activity', 'weekly', 'assets', 'asset-loan', 'network', 'files', 'extension-directory', 'purchase-record'] },
    { id: 'user', name: 'Users', description: 'View Only', allowedMenus: ['dashboard', 'extension-directory', 'asset-loan', 'helpdesk'] }
];

export const APP_MENU_STRUCTURE = [
    { id: 'dashboard', label: 'Overview', iconName: 'LayoutDashboard' },
    { id: 'helpdesk', label: 'Helpdesk', iconName: 'LifeBuoy' },
    { id: 'activity', label: 'Activity Log', iconName: 'Activity' },
    { id: 'weekly', label: 'Weekly Plan', iconName: 'Calendar' },
    { id: 'purchase', label: 'Purchase Plan', iconName: 'ShoppingCart' },
    { id: 'purchase-record', label: 'Purchase Record', iconName: 'Briefcase' },
    { id: 'assets', label: 'Asset Management', iconName: 'Cpu' },
    { id: 'asset-loan', label: 'Asset Loan', iconName: 'Briefcase' },
    { id: 'network', label: 'Network & Wiring', iconName: 'Network' },
    { id: 'files', label: 'Documents', iconName: 'FolderOpen' },
    { id: 'extension-directory', label: 'Ext. Directory', iconName: 'Phone' },
    { id: 'admin', label: 'Administration', iconName: 'Shield' },
    { id: 'users', label: 'User Accounts', parentId: 'admin', iconName: 'Users' },
    { id: 'credential', label: 'Credentials', parentId: 'admin', iconName: 'Key' },
    { id: 'system-settings', label: 'System Settings', parentId: 'admin', iconName: 'Settings' },
    { id: 'tracking-log', label: 'Tracking Log', parentId: 'admin', iconName: 'Activity' },
    { id: 'announcements', label: 'Broadcasts', parentId: 'admin', iconName: 'Megaphone' },
    { id: 'master-company', label: 'Company Data', parentId: 'admin', iconName: 'Building2' },
    { id: 'master-department', label: 'Departments', parentId: 'admin', iconName: 'Briefcase' },
    { id: 'master-category', label: 'Asset Categories', parentId: 'admin', iconName: 'Layers' },
    { id: 'master-group', label: 'Groups & Access', parentId: 'admin', iconName: 'Layers' },
    { id: 'maintenance', label: 'System Wipe', parentId: 'admin', iconName: 'Zap' },
];
