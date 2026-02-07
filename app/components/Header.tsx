import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalQuote: number;
}

export default function Header({ viewMode, setViewMode, totalQuote }: HeaderProps) {
  return (
    <header className="p-4 md:p-6 bg-white border-b flex flex-col sm:flex-row justify-between items-center shadow-sm gap-4 sticky top-0 z-50">
      <div className="text-center sm:text-left">
        <h1 className="text-xl font-black uppercase tracking-tighter italic">AURA LOGISTICS</h1>
        <div className="flex gap-2 mt-2 justify-center sm:justify-start">
          <button
            onClick={() => setViewMode('survey')}
            className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${viewMode === 'survey' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}
          >
            Survey
          </button>
          <button
            onClick={() => setViewMode('unpack')}
            className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${viewMode === 'unpack' ? 'bg-purple-600 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}
          >
            Unpack
          </button>
          <button
            onClick={() => setViewMode('logistics')}
            className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${viewMode === 'logistics' ? 'bg-cyan-600 text-white shadow-md' : 'bg-stone-100 text-stone-400'}`}
          >
            Logistics
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-stone-50 px-4 py-2 rounded-xl border border-stone-100 w-full sm:w-auto justify-center">
        <div className="text-center sm:text-right">
          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Est. Quote</p>
          <p className="text-xl font-black text-cyan-600">${totalQuote.toLocaleString()}</p>
        </div>
      </div>
    </header>
  );
}