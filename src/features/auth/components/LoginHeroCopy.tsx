import Image from 'next/image';
import { LoginHeroHeadline } from './LoginHeroHeadline';
import { LoginHeroSubcopy } from './LoginHeroSubcopy';

export const LoginHeroCopy = () => {
  return (
    <div className="relative max-w-xl drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
      <div className="absolute -top-60 -left-2">
        <Image
          src="/logo.png"
          alt="Aspire Logo"
          width={210}
          height={70}
          priority
          className="object-contain"
        />
      </div>
      <LoginHeroHeadline />
      <LoginHeroSubcopy />
    </div>
  );
};
