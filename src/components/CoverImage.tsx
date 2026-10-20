import { useState, type ReactNode } from "react";

import { mediaContentUrl } from "@/lib/api/media";

/**
 * Cover image for a PUBLIC (approved) post card, using the post's coverMediaId
 * from the list response — no extra API call per card. Falls back to `fallback`
 * when the post has no image or the image fails to load.
 * (Private posts use AuthImage, which fetches with the user's token.)
 */
export function CoverImage({
  postId,
  mediaId,
  alt,
  className,
  fallback,
}: {
  postId: string;
  mediaId: string | null | undefined;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!mediaId || failed) return <>{fallback}</>;
  return (
    <img
      src={mediaContentUrl(postId, mediaId)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
