import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FFFFFF] relative overflow-hidden font-sans py-8 lg:py-16 px-4 sm:px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10 animate-in slide-in-from-bottom-8 duration-700 fade-in">
        <RegisterForm />
      </div>
    </main>
  );
}
