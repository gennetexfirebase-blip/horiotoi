create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint unique,
  title text not null,
  slug text unique not null,
  excerpt text not null default '',
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_html text not null default '',
  cover_image text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  category_name text not null default 'Бусад',
  author_id text not null,
  author_name text not null default 'CasperXtina',
  author_avatar text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  views bigint not null default 0 check (views >= 0),
  published_at timestamptz,
  source_url text,
  archive_url text,
  archive_timestamp text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  legacy_post_id bigint,
  author_name text not null default 'Зочин',
  author_avatar text not null default '',
  body text not null,
  body_html text not null default '',
  legacy_number integer,
  legacy_key text unique,
  status text not null default 'published' check (status in ('pending', 'published', 'spam')),
  created_at timestamptz not null default now()
);

create table public.admins (
  clerk_user_id text primary key,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  display_name text not null default 'Admin',
  avatar_url text not null default '',
  created_at timestamptz not null default now()
);

create index posts_public_feed_idx on public.posts (published_at desc) where status = 'published';
create index posts_category_idx on public.posts (category_id, published_at desc);
create index posts_author_idx on public.posts (author_id);
create index comments_post_idx on public.comments (post_id, created_at);
create index comments_legacy_post_idx on public.comments (legacy_post_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at before update on public.posts
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.admins enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.posts, public.comments to anon, authenticated;
grant all on public.categories, public.posts, public.comments, public.admins to service_role;

create policy "Public categories are readable" on public.categories for select
to anon, authenticated using (true);

create policy "Published scheduled posts are readable" on public.posts for select
to anon, authenticated using (status = 'published' and published_at is not null and published_at <= now());

create policy "Published comments are readable" on public.comments for select
to anon, authenticated using (status = 'published');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into public.categories (name, slug)
values
  ('Зөгнөл', 'zognol'),
  ('Эх нийтлэл', 'eh-niitlel'),
  ('Түүх', 'tuuh'),
  ('Нууц', 'nuuts'),
  ('Мэдээ', 'medee'),
  ('Видео', 'video'),
  ('Бусад', 'busad')
on conflict (slug) do nothing;

