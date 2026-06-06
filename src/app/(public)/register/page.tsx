import { RegisterForm } from '@/features/auth/components/RegisterForm';
import Image from 'next/image';

export default function RegisterPage() {
  return (
    <main className="min-h-[100dvh] bg-transparent relative overflow-x-hidden font-sans pt-0 pb-8 lg:py-16 px-4 sm:px-6">
      {/* Fixed Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/image-register.png"
          alt="Background"
          fill
          className="object-cover opacity-100"
          priority
        />
        {/* Strong blur and white overlay for mobile, minimal for desktop */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-2xl lg:bg-white/10 lg:backdrop-blur-none transition-all duration-500" />
      </div>

      <div className="w-full max-w-4xl mx-auto relative z-10 animate-in slide-in-from-bottom-8 duration-700 fade-in">
        <RegisterForm />
      </div>
    </main>
  );
}
