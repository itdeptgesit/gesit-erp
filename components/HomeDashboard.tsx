import React from 'react';
import { UserAccount } from '../types';
import DashboardIT from './DashboardIT';
import { GesitExecutiveDashboard } from './GesitExecutiveDashboard';

interface HomeDashboardProps {
  currentUser: UserAccount | null;
  userName?: string;
  userRole?: string;
  onNavigate: (path: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ currentUser, userName, userRole, onNavigate }) => {
  const userGroups = (currentUser?.groups || []).map(g => g.toLowerCase());
  const role = (userRole || currentUser?.role || '').toLowerCase();
  const isIT =
    userGroups.some(g => g.startsWith('it') || g.includes('it_') || g.includes('it-') || g === 'support') ||
    role.includes('it') ||
    role === 'super admin' ||
    role === 'super_admin' ||
    role === 'admin';

  if (isIT) {
    return <DashboardIT onNavigate={onNavigate} currentUser={currentUser} />;
  }

  return (
    <GesitExecutiveDashboard
      currentUser={currentUser}
      userName={userName}
      userRole={userRole}
      onNavigate={onNavigate}
    />
  );
};