-- Adicionar coluna avatar_url na tabela profiles
alter table public.profiles
add column if not exists avatar_url text;

-- Atualizar função que cria perfil para incluir avatar_url
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'role',
    null
  );
  return new;
end;
$$ language plpgsql security definer;

-- Adicionar campo avatar_url na função de signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();