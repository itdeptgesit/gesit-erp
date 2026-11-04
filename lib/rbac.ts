import { UserAccount } from '../types';

export const isUserAdmin = (user?: Partial<UserAccount> | null): boolean => {
  if (!user) return false;
  const roleLower = (user.role || '').toLowerCase().trim();
  if (
    roleLower === 'admin' ||
    roleLower === 'super admin' ||
    roleLower === 'super_admin' ||
    roleLower === 'owner'
  ) {
    return true;
  }
  const groups = user.groups || [];
  return groups.some((g) => {
    const gl = (g || '').toLowerCase().trim();
    return (
      gl === 'admin' ||
      gl === 'super admin' ||
      gl === 'it_management' ||
      gl === 'management'
    );
  });
};

export const isUserStaff = (user?: Partial<UserAccount> | null): boolean => {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  const roleLower = (user.role || '').toLowerCase().trim();
  if (
    roleLower === 'staff' ||
    roleLower === 'it_staff' ||
    roleLower === 'it support' ||
    roleLower === 'it'
  ) {
    return true;
  }
  const groups = user.groups || [];
  return groups.some((g) => {
    const gl = (g || '').toLowerCase().trim();
    return (
      gl === 'staff' ||
      gl === 'it_staff' ||
      gl === 'it-operations' ||
      gl === 'support' ||
      gl === 'it'
    );
  });
};

export const canUserManage = (user?: Partial<UserAccount> | null): boolean => {
  return isUserStaff(user);
};

export const canUserDelete = (user?: Partial<UserAccount> | null): boolean => {
  return isUserAdmin(user);
};
