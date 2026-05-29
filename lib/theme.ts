export type ThemeChoice = {
  sBg: string;
  sBorder: string;
  sTape: string;
  lA: string;
  tA: string;
  gradient: string;
};

export const themeChoices: ThemeChoice[] = [
  {
    // yellow
    sBg: 'bg-[#fbf5c6]',
    sBorder: 'border-[#edcd6f]',
    sTape: 'bg-[#e0d691]/50',
    lA: 'text-[#d4af37]',
    tA: 'text-[#4a4220]',
    gradient: 'linear-gradient(145deg, #fbf5c6 0%, #f7ec9e 100%)',
  },
  {
    // dark
    sBg: 'bg-[#1B3B9B]',
    sBorder: 'border-white',
    sTape: 'bg-white/20',
    lA: 'text-[#fbf5c6]/60',
    tA: 'text-white',
    gradient: 'linear-gradient(145deg, #1B3B9B 0%, #152e7a 100%)',
  },
  {
    // light blue
    sBg: 'bg-[#59ABE9]',
    sBorder: 'border-[#1B3B9B]',
    sTape: 'bg-white/30',
    lA: 'text-[#fbf5c6]',
    tA: 'text-white',
    gradient: 'linear-gradient(145deg, #59ABE9 0%, #1B3B9B 100%)',
  },
];

export default themeChoices;
