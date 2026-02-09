'use client'

import { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, User } from '../types';

/* ── demo users (one per role) ────────────────────────────────── */
const DEMO_USERS: Record<UserRole, User> = {
  customer: {
    id: 'cust-001',
    email: 'sarah@email.com',
    name: 'Sarah Mitchell',
    role: 'customer',
    createdAt: '2026-01-15T10:00:00Z',
  },
  removalist: {
    id: 'rem-001',
    email: 'ops@swiftmovers.com.au',
    name: 'James Chen',
    role: 'removalist',
    companyName: 'Swift Movers',
    subscription: 'professional',
    subscriptionExpiresAt: '2026-12-31T23:59:59Z',
    abn: '12 345 678 901',
    phone: '0412 345 678',
    createdAt: '2025-06-01T10:00:00Z',
  },
  admin: {
    id: 'admin-001',
    email: 'admin@auralogistics.com',
    name: 'Admin',
    role: 'admin',
    createdAt: '2025-01-01T00:00:00Z',
  },
};

interface RoleContextValue {
  role: UserRole;
  setRole: (r: UserRole) => void;
  user: User;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('customer');
  const user = DEMO_USERS[role];

  return (
    <RoleContext.Provider value={{ role, setRole, user }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
