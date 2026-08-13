"use client";
import { useEffect } from "react";
export function ViewTracker({ postId }: { postId?: string }) {
  useEffect(() => {
    if (!postId) return;
    const key = `horiotoi-view:${postId}`; const last = Number(localStorage.getItem(key) || 0);
    if (Date.now() - last < 30 * 60 * 1000) return;
    localStorage.setItem(key, String(Date.now()));
    void fetch("/api/views", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
  }, [postId]);
  return null;
}
