# Horiotoi

Монголын анхны аймшгийн сайтын 3,367 нийтлэлтэй сэргээгдсэн архив. Next.js, Supabase CMS, Clerk authentication, video/image archive, comments болон responsive UI ашиглана.

## Гол замууд

- Public архив: `/archive`
- User түүх бичих: `/write`
- User profile/username: `/profile`
- User-ийн нийтлэлүүд: `/my-posts`
- Нууц admin CMS: `/nuuts/admin`

Admin эрх зөвхөн `6822103@gmail.com` Clerk account-д олгогдоно. Бусад Clerk хэрэглэгч өөрийн username-тай түүхээ admin approval-гүй шууд нийтэлж болно.

## Ажиллуулах

```bash
npm install
copy .env.example .env.local
npm run dev
```

Supabase schema-г `supabase/migrations` дахь migration-аар үүсгээд archive data import хийх:

```bash
npx supabase db push --include-all
npm run migrate:archive
```

## Шалгалт

```bash
npm run typecheck
npm run lint
npm run build
clerk doctor
```
