import { LoginForm } from '@/features/auth/components/LoginForm';
import Image from 'next/image';
import { LoginHeroCopy } from '@/features/auth/components/LoginHeroCopy';
import { LoginHeroImage } from '@/features/auth/components/LoginHeroImage';
import { LoginHeroStats } from '@/features/auth/components/LoginHeroStats';

export default function LoginPage() {
  return (
    <main className="min-h-[100dvh] bg-[#FFFFFF] relative overflow-hidden font-sans">
      {/* Background depth effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-slate-50 rounded-full blur-3xl opacity-60 transform -translate-x-1/3 translate-y-1/3" />
      </div>

      <LoginHeroImage />

      <div className="relative z-20 mx-auto grid min-h-[100dvh] w-full max-w-[1440px] gap-8 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
        
        {/* Left Visual Area (Desktop Only) */}
        <div className="hidden min-h-[100dvh] flex-col justify-between pt-40 pb-32 lg:flex animate-in slide-in-from-left-8 duration-700 fade-in 2xl:-ml-20">
          <LoginHeroCopy />
          <LoginHeroStats />
        </div>

        {/* Right Form Area (Mobile & Desktop) */}
        <div className="relative flex min-h-[100dvh] items-center justify-center py-10 lg:py-0">
          {/* Mobile Header - Absolute top-0 centered, full width */}
          <div className="lg:hidden absolute top-0 left-0 right-0 -mx-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="relative w-full">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                <Image 
                  src="/logo.png" 
                  alt="Aspire Logo" 
                  width={140} 
                  height={52} 
                  priority
                  className="object-contain drop-shadow-md"
                />
              </div>
              <Image
                src="/image-login-mobile.png"
                alt="Students learning"
                width={800}
                height={400}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full max-w-md lg:ml-auto relative z-20 px-4 mt-32 lg:mt-0">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
