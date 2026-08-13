import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="not-found shell">
      <span>404</span>
      <h1>Энэ мөр архивт алга.</h1>
      <p>Хуудас хадгалагдаагүй эсвэл холбоос нь өөрчлөгдсөн байж магадгүй.</p>
      <Link href="/archive"><ArrowLeft size={17} /> Архив руу очих</Link>
    </section>
  );
}
