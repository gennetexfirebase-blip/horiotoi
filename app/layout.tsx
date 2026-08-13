import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Хориотой — Монголын анхны аймшгийн сайт",
    template: "%s | Хориотой",
  },
  description: "HORIOTOI.ORG сайтын 2008–2013 оны бүрэн дижитал архив.",
  metadataBase: new URL("https://horiotoi.org"),
  openGraph: {
    title: "Хориотой",
    description: "Монголын анхны аймшгийн сайтын сэргээгдсэн архив",
    type: "website",
    locale: "mn_MN",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn">
      <body>
        <ClerkProvider appearance={{ elements: { footer: { display: "none" } } }}>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </ClerkProvider>
      </body>
    </html>
  );
}
