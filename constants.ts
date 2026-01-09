
export const APP_NAME = 'Gesit ERP';

// For demo purposes, we simulate the logged-in user's groups if not found in DB
export const CURRENT_USER_GROUPS = ['admin'];

export const MOCK_GROUPS = [
    { id: 'admin', name: 'Administrators', description: 'Full Access', allowedMenus: ['dashboard', 'helpdesk', 'activity', 'weekly', 'purchase', 'purchase-record', 'assets', 'network', 'files', 'admin', 'users', 'master-company', 'master-department', 'master-group', 'master-category', 'maintenance'] },
    { id: 'staff', name: 'IT Staff', description: 'Operational Access', allowedMenus: ['dashboard', 'helpdesk', 'activity', 'weekly', 'assets', 'network', 'files', 'purchase-record'] },
    { id: 'user', name: 'Users', description: 'View Only', allowedMenus: ['dashboard', 'purchase', 'purchase-record'] }
];

export const APP_MENU_STRUCTURE = [
    { id: 'dashboard', label: 'Overview', iconName: 'LayoutDashboard' },
    { id: 'helpdesk', label: 'Service Desk', iconName: 'LifeBuoy' },
    { id: 'activity', label: 'Activity Log', iconName: 'Activity' },
    { id: 'weekly', label: 'Weekly Plan', iconName: 'Calendar' },
    { id: 'purchase', label: 'Purchase Plan', iconName: 'ShoppingCart' },
    { id: 'purchase-record', label: 'Purchase Record', iconName: 'Briefcase' },
    { id: 'assets', label: 'Asset Management', iconName: 'Cpu' },
    { id: 'network', label: 'Network & Wiring', iconName: 'Network' },
    { id: 'files', label: 'Documents', iconName: 'FolderOpen' },
    { id: 'admin', label: 'Administration', iconName: 'Shield' },
    { id: 'users', label: 'User Accounts', parentId: 'admin', iconName: 'Users' },
    { id: 'system-settings', label: 'System Settings', parentId: 'admin', iconName: 'Settings' },
    { id: 'announcements', label: 'Broadcasts', parentId: 'admin', iconName: 'Megaphone' },
    { id: 'master-company', label: 'Company Data', parentId: 'admin', iconName: 'Building2' },
    { id: 'master-department', label: 'Departments', parentId: 'admin', iconName: 'Briefcase' },
    { id: 'master-category', label: 'Asset Categories', parentId: 'admin', iconName: 'Layers' },
    { id: 'master-group', label: 'Groups & Access', parentId: 'admin', iconName: 'Layers' },
    { id: 'maintenance', label: 'System Wipe', parentId: 'admin', iconName: 'Zap' },
];
