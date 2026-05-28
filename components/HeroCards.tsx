const cards = [
  ['Corporate Governance', 'Board duties, shareholder rights and governance strategy.'],
  ['Contracts Review', 'Analyze clauses, obligations and hidden legal risks quickly.'],
  ['Regulatory Research', 'Search regulations, filings and jurisdiction requirements.'],
  ['Case Intelligence', 'Find precedents, summaries and strategic insights.'],
];

export default function HeroCards() {
  return (
    <div className="relative h-full w-full max-w-[1400px] mx-auto px-[20px] md:px-[80px] py-[8px] md:py-[28px] overflow-hidden z-10">
      <div className="absolute left-1/2 top-[-10vh] -translate-x-1/2 text-[320px] md:text-[420px] font-[family:var(--font-playfair)] text-slate-300/20 leading-none select-none pointer-events-none z-100">
        <img src="/tie.png" alt="tie" className="h-[76vh] w-auto object-contain opacity-100 z-100 drop-shadow-xs" />
      </div>

      <h2 className="relative z-10 text-[clamp(2.2rem,3.5vw+1rem,3.5rem)] leading-[1.05] font-['Playfair_Display',serif] font-bold text-[#1a2744] max-w-[620px] mt-[clamp(5px,1vh,18px)] mb-[clamp(25px,4vh,48px)]">
        HOW
        <br />
        MAY I
        <br />
        HELP
        <br />
        YOU?
      </h2>

      <div className="relative z-0 grid md:grid-cols-[1.4fr_110px_1.4fr] gap-0 max-w-6xl">
        <div className="space-y-4">
          <Card title={cards[0][0]} desc={cards[0][1]} rounded="rounded-tl-xl" />
          <Card title={cards[1][0]} desc={cards[1][1]} rounded="rounded-bl-xl border-t-0" />
        </div>
        <div />
        <div className="space-y-4">
          <Card title={cards[2][0]} desc={cards[2][1]} rounded="rounded-tr-xl" />
          <Card title={cards[3][0]} desc={cards[3][1]} rounded="rounded-br-xl border-t-0" />
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, rounded }: { title: string; desc: string; rounded: string }) {
  return (
    <div className={`border border-[#dde1ec] bg-white p-[14px] py-[16px] hover:bg-[#f8f9fd] ${rounded}`}>
      <h3 className="text-[14px] font-semibold text-[#1a2744] mb-1">{title}</h3>
      <p className="text-[12.5px] leading-5 text-[#6b7080]">{desc}</p>
    </div>
  );
}