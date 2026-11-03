'use client';

import React from 'react';
import { DashboardIT } from './DashboardIT';
import { UserAccount } from '../types';

interface ITOperationsDashboardProps {
  currentUser: UserAccount | null;
  userName?: string;
  onNavigate: (view: string) => void;
  realData?: {
    totalAssets?: number;
    activeAssets?: number;
    openTickets?: number;
    resolvedTickets?: number;
    monthlySpendIT?: number;
    lastITPurchase?: { title: string; date: string; amount: number };
  };
}

export const ITOperationsDashboard: React.FC<ITOperationsDashboardProps> = ({
  currentUser,
  userName = 'Rudi',
  onNavigate,
}) => {
  return (
    <DashboardIT
      currentUser={currentUser}
      userName={userName}
      onNavigate={onNavigate}
      showTopbar={true}
    />
  );
};

export default ITOperationsDashboard;
