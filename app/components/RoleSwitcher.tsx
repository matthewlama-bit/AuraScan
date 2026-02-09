'use client'

import { useRole } from '../context/RoleContext';
import { UserRole } from '../types';
import { User, Truck, ShieldCheck } from 'lucide-react';

const ROLES: { key: UserRole; label: string; icon: typeof User; color: string; activeColor: string }[] = [
  { key: 'customer',   label: 'Customer',   icon: User,        color: 'text-stone-400', activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' },
  { key: 'removalist', label: 'Removalist', icon: Truck,       color: 'text-stone-400', activeColor: 'bg-blue-600 text-white shadow-lg shadow-blue-200' },
  { key: 'admin',      label: 'Admin',      icon: ShieldCheck, color: 'text-stone-400', activeColor: 'bg-violet-600 text-white shadow-lg shadow-violet-200' },
];

export default function RoleSwitcher() {
  const { role, setRole, user } = useRole();

  return (
    <div className="flex items-center gap-3">
      <div className="flex bg-stone-100 rounded-full p-0.5 gap-0.5">
        {ROLES.map(r => {
          const Icon = r.icon;
          const active = role === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-200 ${active ? r.activeColor : 'hover:bg-stone-200 ' + r.color}`}
            >
              <Icon size={12} />
              {r.label}
            </button>
          );
        })}
      </div>

      <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-stone-200">
        <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-black text-stone-500">
          {user.name.charAt(0)}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-stone-700 leading-none">{user.name}</p>
          <p className="text-[9px] text-stone-400 leading-none mt-0.5">{user.companyName || user.email}</p>
        </div>
      </div>
    </div>
  );
}
