
import React from 'react';

export enum PortStatus {
  ACTIVE = 'ACTIVE', // Green
  IDLE = 'IDLE',     // Red/Gray
  ERROR = 'ERROR',   // Amber/Orange
  DISABLED = 'DISABLED' // Dark Gray
}

export enum DeviceType {
  PC = 'PC',
  SERVER = 'Server',
  PRINTER = 'Printer',
  AP = 'Access Point',
  CCTV = 'CCTV',
  NVR = 'NVR',
  DVR = 'DVR',
  IP_PHONE = 'IP Phone',
  ANALOG_PHONE = 'Analog Phone',
  PABX = 'PABX System',
  LSA = 'LSA Panel',
  ROUTER = 'Router',
  UPLINK = 'Uplink',
  UNKNOWN = 'Unknown',
  FACEPLATE = 'Faceplate Outlet'
}

export interface HelpdeskTicket {
  id: number;
  ticketId: string;
  requesterName: string;
  department: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  assignedTo?: string;
  resolution?: string;
}

export interface PurchaseRecord {
  id: number;
  transactionId: string;
  description: string;
  qty: number;
  price: number;
  vat: number;
  deliveryFee: number;
  insurance: number;
  appFee: number;
  otherCost: number;
  subtotal: number;
  totalVa: number;
  projectName: string;
  user: string;
  department: string;
  company: string;
  status: 'Paid' | 'Pending';
  purchaseDate: string;
  paymentDate?: string;
  vendor: string;
  platform: string;
  paymentMethod?: 'Transfer' | 'VA' | 'Debit/CC';
  category?: 'Hardware' | 'Software & License' | 'Cloud & Hosting' | 'Network & Internet' | 'Maintenance & Support' | 'IT Services' | 'Security' | 'Subscription' | string;
  evidenceLink?: string;
  inputBy?: string;
  remarks: string;
  items?: {
    description: string;
    qty: number;
    price: number;
    vendor?: string;
    deliveryFee?: number;
    insuranceFee?: number;
    itemDiscount?: number;
    shippingDiscount?: number;
  }[];
  docs: {
    prForm: boolean;
    cashAdvance: boolean;
    checkout: boolean;
    paymentSlip: boolean;
    invoice: boolean;
    expenseApproval: boolean;
    checkByRara: boolean;
  }
}

export interface SwitchPort {
  id: string;
  portNumber: number;
  status: PortStatus;
  deviceConnected?: string;
  deviceType: DeviceType;
  macAddress?: string;
  ipAddress?: string;
  vlan?: number;
  cableLength?: string;
  cableType?: 'Cat6' | 'Cat5e' | 'Coaxial' | 'Fiber' | 'Other';
  patchPanelPort?: string;
  lastActivity?: string;
  poeConsumption?: number;
  linkSpeed?: '10 Mbps' | '100 Mbps' | '1 Gbps' | '2.5 Gbps' | '10 Gbps';
  uplinkDeviceId?: string;
}

export interface NetworkSwitch {
  id: string;
  name: string;
  location: string;
  rack: string;
  model: string;
  ip: string;
  serialNumber?: string;
  totalPorts: number;
  uptime: string;
  ports: SwitchPort[];
  displayOrder?: number;
  posX?: number;
  posY?: number;
  uplinkId?: string;
  uplinkPort?: number;
  vlan?: number;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  trend?: string;
}

export interface UserAccount {
  id: number | string;
  authId?: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  groups: string[];
  status: 'Active' | 'Disabled';
  department: string;
  phone?: string;
  address?: string;
  jobTitle?: string;
  supervisorId?: string;
  managerId?: string;
  lastLogin?: string;
  avatarUrl?: string;
  company?: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  allowedMenus: string[];
}

export interface AssetCategory {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface ITAsset {
  id: number;
  assetId: string;
  item: string;
  category: string;
  brand?: string;
  serialNumber?: string;
  status: 'Active' | 'Used' | 'Idle' | 'Broken' | 'Repair' | 'Disposed';
  condition?: 'New' | 'Used' | 'Refurbished' | 'Fair' | 'Poor';
  location: string;
  user?: string;
  remarks?: string;
  company: string;
  department?: string;
  vendor?: string;
  price?: number;
  purchaseDate?: string;
  warrantyExp?: string;
  specs?: {
    storage?: string;
    ram?: string;
    vga?: string;
    processor?: string;
    os?: string;
  };
  image_url?: string;
}

export interface ITAssetLoan {
  id: number;
  loanId: string;
  assetId: number | string;
  assetName?: string;
  assetTag?: string;
  borrowerName: string;
  borrowerDept: string;
  borrowerPhone?: string;
  loanDate: string;
  expectedReturnDate: string;
  status: 'Active' | 'Returned' | 'Overdue';
  remarks?: string;
  itPersonnel?: string;
}

export interface ActivityLog {
  id: number;
  activityName: string;
  category: string;
  requester: string;
  department: string;
  itPersonnel: string;
  type: 'Minor' | 'Major' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  duration?: string;
  remarks?: string;
  location?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  avatarUrl?: string | null;
}

export interface WeeklyPlan {
  id: number;
  task: string;
  description?: string;
  remarks?: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Pending' | 'Done';
  dueDate: string;
  startTime?: string;
  week: string;
  category: string;
  relatedPurchaseId?: number;
}

export interface PurchasePlan {
  id: number;
  item: string;
  specs: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vendor?: string;
  status: 'Pending Supervisor' | 'Pending Manager' | 'Pending Approval' | 'Approved' | 'Rejected';
  requester: string;
  requestDate: string;
  justification: string;
  linkedTaskId?: number;
}

export interface Company {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  website: string;
}
export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Success' | 'Alert';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface PhoneExtension {
  id: number;
  name: string;
  dept: string;
  ext: string;
  floor: number;
  role?: string;
  pin?: string;
  photo_url?: string;
}
export interface AuditLog {
  id: number;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active: boolean;
  created_at?: string;
  expires_at?: string;
}
