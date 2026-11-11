import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAccount } from '../types';
import DashboardIT from './DashboardIT';

interface HomeDashboardProps {
  currentUser: UserAccount | null;
  userName?: string;
  userRole?: string;
  onNavigate: (path: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ currentUser, userRole, onNavigate }) => {
  const userGroups = (currentUser?.groups || []).map(g => g.toLowerCase());
  const role = (userRole || currentUser?.role || '').toLowerCase();
  const isIT =
    Boolean(currentUser?.isHelpdeskSupport) ||
    userGroups.some(g => g.startsWith('it') || g.includes('it_') || g.includes('it-') || g === 'support' || g === 'staff' || g === 'admin') ||
    role.includes('it') ||
    role.includes('staff') ||
    role === 'super admin' ||
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'owner';

  if (isIT) {
    return <DashboardIT onNavigate={onNavigate} currentUser={currentUser} />;
  }

  // Untuk akun user biasa, halaman Home dihilangkan dan langsung dialihkan ke Helpdesk
  return <Navigate to="/helpdesk" replace />;
};