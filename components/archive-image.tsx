"use client";

import Image from "next/image";
import { useState } from "react";

type ArchiveImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
};

export function ArchiveImage({ src, alt, priority = false, sizes = "(max-width: 760px) 100vw, 33vw" }: ArchiveImageProps) {
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
      onError={() => setFailed(true)}
    />
  );
}
