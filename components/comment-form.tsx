"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ postId, legacyPostId }: { postId?: string; legacyPostId?: number }) {
  const router = useRouter(); const [author, setAuthor] = useState(""); const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle"); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState("saving"); setError("");
    const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, legacyPostId, author, body, website: "" }) });
    const payload = await response.json();
    if (!response.ok) { setState("idle"); return setError(payload.error || "Сэтгэгдэл хадгалсангүй"); }
    setBody(""); setState("done"); router.refresh();
  }
  return <form className="comment-form" onSubmit={submit}><h3>Сэтгэгдэл үлдээх</h3><div className="honeypot" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div><label>Нэр<input value={author} onChange={(event) => setAuthor(event.target.value)} required minLength={2} /></label><label>Сэтгэгдэл<textarea value={body} onChange={(event) => setBody(event.target.value)} required minLength={2} rows={5} /></label>{error ? <p className="form-error">{error}</p> : null}{state === "done" ? <p className="form-success">Сэтгэгдэл нийтлэгдлээ.</p> : null}<button type="submit" disabled={state === "saving"}>{state === "saving" ? "Хадгалж байна..." : "Нийтлэх"}</button></form>;
}
