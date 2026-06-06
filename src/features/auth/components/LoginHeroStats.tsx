export const LoginHeroStats = () => {
  return (
    <div className="relative z-30 flex max-w-fit items-center gap-10 rounded-[1.5rem] bg-white px-8 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 font-[var(--font-poppins)]">
      <div className="text-center">
        <h3 className="mb-1 text-[36px] font-black tracking-tight text-[#0A9AE2]">98%</h3>
        <p className="text-[13px] font-bold text-slate-900">Exam Pass Rate</p>
      </div>
      
      <div className="h-14 w-[2px] bg-[#0A9AE2]/20" />

      <div className="text-center">
        <h3 className="mb-1 text-[36px] font-black tracking-tight text-[#0A9AE2]">24/7</h3>
        <p className="text-[13px] font-bold text-slate-900">AI Diagnostics</p>
      </div>
    </div>
  );
};
