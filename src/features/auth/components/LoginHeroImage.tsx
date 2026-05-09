import Image from 'next/image';

export const LoginHeroImage = () => {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-10 hidden h-[90vh] w-[75vw] min-w-[64rem] max-w-none lg:block xl:h-[100vh] xl:w-[80vw]">
      <div className="relative h-full w-full">
        <Image
          src="/image-login.png"
          alt="Students learning together"
          fill
          priority
          sizes="(min-width: 1280px) 72vw, 68vw"
          className="object-contain object-left-bottom"
        />
      </div>
    </div>
  );
};
