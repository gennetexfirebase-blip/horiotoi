create table public.profiles (
  clerk_user_id text primary key,
  email text unique not null,
  username text unique not null,
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 40)
);

alter table public.posts add column if not exists author_email text not null default '';
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft', 'published', 'rejected'));
alter table public.posts alter column author_name set default 'CasperXtina';
alter table public.admins add column if not exists email text unique;
alter table public.admins alter column display_name set default 'Admin';

create index if not exists profiles_username_idx on public.profiles (lower(username));
create index if not exists posts_author_email_idx on public.posts (author_email);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
grant select on public.profiles to anon, authenticated;
grant all on public.profiles to service_role;

create policy "Public profile names are readable" on public.profiles for select
to anon, authenticated using (true);

delete from public.admins where email is distinct from '6822103@gmail.com';
