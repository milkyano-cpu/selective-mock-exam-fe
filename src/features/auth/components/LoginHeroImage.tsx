import Image from 'next/image';

export const LoginHeroImage = () => {
  return (
    // Rendered at the image's natural aspect ratio (width-driven, height auto)
    // and pinned bottom-left, so the photo scales uniformly. The subjects keep
    // the same relative position regardless of resolution / display scaling /
    // browser zoom — unlike object-contain in a vw×vh box, which letterboxes
    // and drifts as the viewport ratio changes.
    <div className="pointer-events-none absolute bottom-0 left-0 z-10 hidden w-[58vw] max-w-[1040px] lg:block">
      <Image
        src="/image-login.png"
        alt="Students learning together"
        width={1105}
        height={1147}
        priority
        sizes="58vw"
        className="h-auto w-full object-contain object-left-bottom"
      />
    </div>
  );
};
