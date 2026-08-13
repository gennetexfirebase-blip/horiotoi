insert into public.categories (name, slug) values ('Болсон явдал', 'bolson-yavdal') on conflict (slug) do update set name = excluded.name;
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));
