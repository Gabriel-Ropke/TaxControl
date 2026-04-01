-- Executar no SQL Editor do Supabase (ou via CLI) antes de usar registo/login por nome.
-- Cria perfis com username único e funções RPC usadas pelo frontend (login por nome, disponibilidade).

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profile_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profile_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1) || '_' || substr(replace(new.id::text, '-', ''), 1, 8)
  );
  insert into public.profiles (id, username) values (new.id, uname);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select u.email::text
  from auth.users u
  inner join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(p_username))
  );
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
