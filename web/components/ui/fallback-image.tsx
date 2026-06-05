"use client";

/* eslint-disable @next/next/no-img-element -- User images can be private, tokenized, or served from arbitrary custom domains, so they should not be proxied through Next Image. */

import { useState, useCallback } from "react";

const DEFAULT_DOMAIN = "formality.life";

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  domain: string;
  imageId: string;
  isPrivate?: boolean;
  token?: string;
  onFallback?: (imageId: string) => void;
}

function buildUrl(domain: string, imageId: string, token?: string): string {
  let url = `https://${domain}/i/${imageId}`;
  if (token) {
    url = `${url}?token=${token}`;
  }
  return url;
}

export function FallbackImage({
  src,
  domain,
  imageId,
  isPrivate,
  token,
  onFallback,
  alt = "",
  ...props
}: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasFallback, setHasFallback] = useState(false);

  const handleError = useCallback(() => {
    if (!hasFallback && domain !== DEFAULT_DOMAIN) {
      const fallbackUrl = buildUrl(DEFAULT_DOMAIN, imageId, isPrivate ? token : undefined);
      setCurrentSrc(fallbackUrl);
      setHasFallback(true);
      onFallback?.(imageId);
    }
  }, [hasFallback, domain, imageId, isPrivate, token, onFallback]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={handleError}
    />
  );
}
