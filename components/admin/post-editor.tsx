"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { useRef, useState } from "react";
import type { CmsCategory, CmsPostRow } from "@/lib/cms-types";
import { slugify } from "@/lib/post-schema";

type Props = { post?: CmsPostRow | null; initialCategories: CmsCategory[]; mode?: "admin" | "user" };

export function PostEditor({ post, initialCategories, mode = "admin" }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [coverImage, setCoverImage] = useState(post?.cover_image || "");
  const [categoryId, setCategoryId] = useState(post?.category_id || (mode === "user" ? initialCategories.find((item) => item.slug === "bolson-yavdal")?.id || "" : ""));
  const [categories, setCategories] = useState(initialCategories);
  const [status, setStatus] = useState<"draft" | "published">(post?.status === "published" || (!post && mode === "user") ? "published" : "draft");
  const [publishedAt, setPublishedAt] = useState(post?.published_at?.slice(0, 16) || new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const coverInput = useRef<HTMLInputElement>(null);
  const editorImageInput = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, LinkExtension.configure({ openOnClick: false }), TiptapImage.configure({ inline: false })],
    content: post?.content && Object.keys(post.content).length ? post.content : post?.content_html || "<p></p>",
  });

  async function upload(file: File) {
    const body = new FormData(); body.append("file", file);
    const response = await fetch(mode === "admin" ? "/api/admin/upload" : "/api/user/upload", { method: "POST", body });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Upload амжилтгүй");
    return payload.url as string;
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    try { setError(""); setCoverImage(await upload(file)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Upload амжилтгүй"); }
  }

  async function insertEditorImage(file?: File) {
    if (!file || !editor) return;
    try {
      setError("");
      const url = await upload(file);
      const caption = window.prompt("Зургийн тайлбар (заавал биш)", "") || "";
      editor.chain().focus().setImage({ src: url, alt: caption, title: caption }).run();
      if (caption) editor.chain().focus().insertContent(`<p><em>${caption.replace(/[<>]/g, "")}</em></p>`).run();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Upload амжилтгүй"); }
  }

  async function addCategory() {
    const name = window.prompt("Шинэ ангиллын нэр");
    if (!name) return;
    const response = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const payload = await response.json();
    if (!response.ok) return setError(payload.error || "Ангилал нэмсэнгүй");
    setCategories((current) => [...current, payload]); setCategoryId(payload.id);
  }

  async function save() {
    if (!editor) return;
    const category = categories.find((item) => item.id === categoryId);
    if (!title.trim() || !slug.trim() || !category) return setError("Гарчиг, slug, ангиллаа бүрэн оруулна уу.");
    setSaving(true); setError("");
    const endpoint = mode === "admin" ? (post ? `/api/admin/posts/${post.id}` : "/api/admin/posts") : "/api/user/posts";
    const response = await fetch(endpoint, {
      method: mode === "admin" && post ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, excerpt, content: editor.getJSON(), contentHtml: editor.getHTML(), coverImage,
        categoryId, categoryName: category.name, status, publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null }),
    });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) return setError(payload.error || "Хадгалж чадсангүй");
    router.push(mode === "admin" ? "/nuuts/admin/posts" : "/my-posts"); router.refresh();
  }

  return (
    <div className="post-editor-form">
      {error ? <div className="admin-error">{error}</div> : null}
      <div className="admin-form-grid">
        <label>Гарчиг<input value={title} onChange={(event) => { const value = event.target.value; setTitle(value); if (!slugTouched) setSlug(slugify(value)); }} /></label>
        <label>URL slug<input value={slug} onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)); }} /></label>
      </div>
      <label>Богино тайлбар<textarea rows={4} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="Энэ охиныг төрнө гэж Ванга зөнч өөрөө хэлсэн удаатай..." /></label>
      <div className="admin-form-grid">
        {mode === "user" ? <label>Ангилал<input value="Болсон явдал" disabled /></label> : <label>Ангилал<span className="inline-control"><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Сонгох</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={addCategory}>+ Нэмэх</button></span></label>}
        <label>Cover image URL<input value={coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="https://..." /></label>
      </div>
      <div className="cover-upload-row">
        <input ref={coverInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => uploadCover(event.target.files?.[0])} />
        <button type="button" onClick={() => coverInput.current?.click()}>Cover зураг upload</button>
        {coverImage ? <Image src={coverImage} alt="Cover preview" width={220} height={130} unoptimized /> : <span>Preview байхгүй</span>}
      </div>
      <div className="editor-shell">
        <div className="editor-toolbar">
          <button type="button" onClick={() => editor?.chain().focus().setParagraph().run()}>P</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
          <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
          <button type="button" onClick={() => { const href = window.prompt("Link URL"); if (href) editor?.chain().focus().setLink({ href }).run(); }}>Link</button>
          <button type="button" onClick={() => editorImageInput.current?.click()}>Image + caption</button>
          <input ref={editorImageInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => insertEditorImage(event.target.files?.[0])} />
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="publish-row">
        <label>Төлөв<select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")}><option value="draft">Ноорог</option><option value="published">Шууд нийтлэх</option></select></label>
        <label>Нийтлэх огноо<input type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} /></label>
        <button className="admin-primary" type="button" disabled={saving} onClick={save}>{saving ? "Хадгалж байна..." : post ? "Өөрчлөлт хадгалах" : status === "published" ? "Шууд нийтлэх" : "Ноорог хадгалах"}</button>
      </div>
    </div>
  );
}



