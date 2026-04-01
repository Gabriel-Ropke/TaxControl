-- Adicionar colunas currency e role com default na tabela profiles
alter table public.profiles
add column if not exists currency text default 'BRL',
add column if not exists role text default 'admin';

-- Atualizar usuários existentes que não têm currency ou role
update public.profiles set currency = 'BRL' where currency is null;
update public.profiles set role = 'admin' where role is null;

-- Atualizar função que cria perfil para incluir valores default
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
  insert into public.profiles (id, username, currency, role) values (new.id, uname, 'BRL', 'admin');
  return new;
end;
$$;
