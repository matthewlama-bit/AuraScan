'use client'

import { useRole } from './context/RoleContext';
import PlatformHeader from './components/PlatformHeader';
import CustomerDashboard from './components/CustomerDashboard';
import RemovalistDashboard from './components/RemovalistDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function PlatformRoot() {
  const { role } = useRole();

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col font-sans text-stone-900 overflow-x-hidden">
      <PlatformHeader />
      <main className="flex-1 overflow-y-auto bg-white/50">
        {role === 'customer'   && <CustomerDashboard />}
        {role === 'removalist' && <RemovalistDashboard />}
        {role === 'admin'      && <AdminDashboard />}
      </main>
    </div>
  );
}