"use client";

import Image from "next/image";
import { useState } from "react";

type ArchiveImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  preserveRatio?: boolean;
};

export function ArchiveImage({ src, alt, priority = false, sizes = "(max-width: 760px) 100vw, 33vw", preserveRatio = false }: ArchiveImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="image-fallback" role="img" aria-label={alt + " — архивын зураг хадгалагдаагүй"}>
        <span>ХОРИОТОЙ</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onLoad={(event) => {
        if (!preserveRatio) return;
        const image = event.currentTarget;
        if (image.naturalWidth && image.naturalHeight && image.parentElement) {
          image.parentElement.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
        }
      }}
      onError={() => setFailed(true)}
    />
  );
}
