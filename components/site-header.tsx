"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Нүүр" }, { href: "/archive", label: "Бүх нийтлэл" },
  { href: "/archive?category=Болсон явдал", label: "Болсон явдал" },
  { href: "/archive?category=Сүнсний тухай", label: "Сүнс" },
  { href: "/archive?category=Paranormal", label: "Паранормаль" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="header-inner shell">
    <Link className="brand" href="/" aria-label="Хориотой нүүр хуудас"><Image src="/horiotoi-logo.png" alt="Хориотой" width={150} height={48} priority /></Link>
    <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="Үндсэн цэс">{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}</nav>
    <div className="header-actions"><Link href="/archive" className="icon-button" aria-label="Нийтлэл хайх"><Search size={18} /></Link><Show when="signed-out"><span className="auth-buttons"><SignInButton><button type="button">Нэвтрэх</button></SignInButton><SignUpButton><button type="button">Бүртгүүлэх</button></SignUpButton></span></Show><Show when="signed-in"><Link className="write-link" href="/write">Түүх бичих</Link><UserButton><UserButton.MenuItems><UserButton.Link label="Түүх бичих" labelIcon={<span>＋</span>} href="/write" /><UserButton.Link label="Миний нийтлэлүүд" labelIcon={<span>✎</span>} href="/my-posts" /><UserButton.Link label="Username" labelIcon={<span>@</span>} href="/profile" /></UserButton.MenuItems></UserButton></Show><button className="icon-button menu-button" type="button" aria-label={open ? "Цэс хаах" : "Цэс нээх"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={20} /> : <Menu size={20} />}</button></div>
  </div></header>;
}


