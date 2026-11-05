import illustration480 from "@/assets/sign_in_photo-480.webp";
import illustration800 from "@/assets/sign_in_photo-800.webp";
import illustration1086 from "@/assets/sign_in_photo-1086.webp";

export function AuthIllustration({ alt }: { alt: string }) {
  return (
    <img
      src={illustration480}
      srcSet={`${illustration480} 480w, ${illustration800} 800w, ${illustration1086} 1086w`}
      sizes="(min-width: 1024px) clamp(346px, calc(45vw - 61px), 394px), 394px"
      width={480}
      height={640}
      loading="lazy"
      decoding="async"
      alt={alt}
      className="h-full w-full rounded-t-[12.5rem] rounded-b-[1.15rem] object-cover"
    />
  );
}
