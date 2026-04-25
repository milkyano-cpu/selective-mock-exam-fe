import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { env } from '@/lib/env';

async function isTokenValid(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${env.apiUrl}/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return false;
    const body = await res.json();
    return body?.data?.valid === true;
  } catch {
    return false;
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token || !(await isTokenValid(token))) {
    redirect('/login?reason=invalid-reset-link');
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-[#FFFFFF] relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 py-6 lg:py-0 grid lg:grid-cols-2 gap-8 lg:gap-24 items-center relative z-10">

        <div className="hidden lg:flex flex-col justify-center max-w-xl animate-in slide-in-from-left-8 duration-700 fade-in">
          <div className="mb-12">
            <h1 className="text-5xl lg:text-[3.5rem] font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Create a New <br />
              <span className="text-[#0A9AE2]">Secure Password.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed font-medium">
              Pick a strong, unique password. We&apos;ll log out all other active sessions for your safety.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-10">
            <div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">256</h3>
              <p className="text-slate-500 font-medium">Bit Encryption</p>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">1×</h3>
              <p className="text-slate-500 font-medium">Use Per Link</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <ResetPasswordForm token={token} />
        </div>

      </div>
    </main>
  );
}
