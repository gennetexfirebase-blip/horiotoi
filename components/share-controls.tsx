"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function ShareControls({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function shareOnFacebook() {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "facebook-share", "popup=yes,width=680,height=680,noopener,noreferrer");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return <div className="share-controls" aria-label="Нийтлэлийг хуваалцах">
    <span>Хуваалцах</span>
    <button type="button" className="facebook-share" onClick={shareOnFacebook}><b className="facebook-mark" aria-hidden="true">f</b> Facebook-д нийтлэх</button>
    <button type="button" onClick={copyLink} aria-live="polite" title={`${title} нийтлэлийн холбоосыг хуулах`}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? "Хууллаа" : "Линк хуулах"}</button>
  </div>;
}
