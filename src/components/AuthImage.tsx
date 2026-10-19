import { useEffect, useState, type ReactNode } from "react";

import { fetchMediaBlob, pickPrimaryMedia } from "@/lib/api/media";
import { usePostMedia } from "@/lib/api/queries";

/**
 * AuthImage — shows a post's cover image even when the post is private
 * (draft / pending / rejected).
 *
 * <img> cannot send an Authorization header, so the binary is fetched through
 * the authenticated API client and shown as a local object URL, which is
 * revoked when the image changes or the component unmounts (no memory leak).
 */
export interface AuthImageProps {
  postId: string;
  alt: string;
  className?: string;
  /** Rendered while loading, when the post has no image, or if loading fails. */
  fallback: ReactNode;
}

export function AuthImage({ postId, alt, className, fallback }: AuthImageProps) {
  const media = usePostMedia(postId);
  const primaryId = media.data ? pickPrimaryMedia(media.data)?.id : undefined;
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!primaryId) {
      setUrl(null);
      return;
    }
    const controller = new AbortController();
    let objectUrl: string | null = null;

    fetchMediaBlob(postId, primaryId, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setUrl(null));

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [postId, primaryId]);

  if (!url) return <>{fallback}</>;
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}
