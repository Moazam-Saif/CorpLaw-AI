'use client';

import { Info, Settings, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  "Global", "United States", "United Kingdom", "Canada", "Australia", 
  "India", "Pakistan", "Singapore", "European Union"
];

export default function Header() {
  const [country, setCountry] = useState("Global");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("corplaw_country");
    if (saved && COUNTRIES.includes(saved)) {
      setCountry(saved);
    }
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCountry(val);
    localStorage.setItem("corplaw_country", val);
  };

  return (
    <header className="relative h-13 shrink-0 border-b border-[#d8dce8] bg-white px-6">
      <div className="grid h-full grid-cols-1 md:grid-cols-[18rem_1fr] items-stretch">
        <div className="flex items-center justify-center md:justify-start">
          <div className="flex items-center gap-2 rounded-full border border-[#dbe2ef] bg-[#f8f9fd]/95 px-3 py-1.5 shadow-[0_6px_18px_rgba(26,39,68,0.05)] backdrop-blur-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3d5494] shadow-sm">
              <Globe size={12} />
            </div>
            <select
              value={country}
              onChange={handleCountryChange}
              className="min-w-36 bg-transparent text-center text-[12px] font-medium tracking-[0.06em] text-[#1a2744] outline-none cursor-pointer appearance-none"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="relative flex items-center justify-center md:justify-center">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="absolute left-1/2 -translate-x-1/2 font-['Playfair_Display',serif] text-[20px] md:text-[21px] font-bold uppercase tracking-[0.18em] text-[#1a2744] whitespace-nowrap text-center hover:text-[#3d5494] transition-colors cursor-pointer"
          >
            Corp Law AI
          </button>
          <div className="hidden md:flex items-center gap-4 text-[#8891a8] ml-auto">
            <Info size={18} className="cursor-pointer hover:text-[#3d5494] transition-colors" />
            <Settings size={18} className="cursor-pointer hover:text-[#3d5494] transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
}