'use client';

import { Info, Settings, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

const COUNTRIES = [
  "Global", "United States", "United Kingdom", "Canada", "Australia", 
  "India", "Pakistan", "Singapore", "European Union"
];

export default function Header() {
  const [country, setCountry] = useState("Global");

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
    <header className="h-[52px] shrink-0 border-b border-[#d8dce8] bg-white px-6 flex items-center justify-between">
      <h1 className="text-[15px] font-semibold text-[#1a2744]">Corp Law AI</h1>
      <div className="flex items-center gap-4 text-[#8891a8]">
        <div className="flex items-center gap-1.5 border border-[#d8dce8] rounded-md px-2 py-1 text-[13px] bg-[#f8f9fd] text-[#1a2744]">
          <Globe size={14} className="text-[#3d5494]" />
          <select 
            value={country}
            onChange={handleCountryChange}
            className="bg-transparent outline-none cursor-pointer appearance-none pr-1"
          >
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Info size={18} className="cursor-pointer hover:text-[#3d5494]" />
        <Settings size={18} className="cursor-pointer hover:text-[#3d5494]" />
      </div>
    </header>
  );
}