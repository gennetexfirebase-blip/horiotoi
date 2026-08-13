revoke all on public.profiles from anon, authenticated;
drop policy if exists "Public profile names are readable" on public.profiles;
grant all on public.profiles to service_role;
