import { LoginForm } from '@/features/auth/components/LoginForm';


export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#FFFFFF] relative overflow-hidden font-sans">
      {/* Very subtle, strictly compliant background depth (light gray only, no brand colors to violate rules) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-6 lg:py-0 grid lg:grid-cols-2 gap-8 lg:gap-24 items-center relative z-10">
        
        {/* Left Visual Area - Clean & Typographic */}
        <div className="hidden lg:flex flex-col justify-center max-w-xl animate-in slide-in-from-left-8 duration-700 fade-in">
          <div className="mb-12">
            {/* Primary Color on White BG Only */}
            <h1 className="text-5xl lg:text-[3.5rem] font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Unlock Your <br/>
              <span className="text-[#0A9AE2]">Academic Potential.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">
              Join 10,000+ educators and students on the most comprehensive learning platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-10">
            <div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">98%</h3>
              <p className="text-slate-500 font-medium">Exam Pass Rate</p>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">24/7</h3>
              <p className="text-slate-500 font-medium">AI Diagnostics</p>
            </div>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <LoginForm />
        </div>
        
      </div>
    </main>
  );
}
