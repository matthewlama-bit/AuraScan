'use client'

import RoleSwitcher from './RoleSwitcher';

export default function PlatformHeader() {
  return (
    <header className="px-4 md:px-6 py-3 bg-white border-b flex flex-col sm:flex-row justify-between items-center shadow-sm gap-3 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <span className="text-white font-black text-xs italic">A</span>
        </div>
        <div>
          <h1 className="text-lg font-black uppercase tracking-tighter italic leading-none">
            AURA <span className="text-cyan-600">LOGISTICS</span>
          </h1>
          <p className="text-[8px] font-bold text-stone-400 tracking-[0.3em] uppercase leading-none mt-0.5">Moving Platform</p>
        </div>
      </div>
      <RoleSwitcher />
    </header>
  );
}
