-- Validação no servidor (Postgres) alinhada ao frontend.
-- Executar no SQL Editor do Supabase depois da migração inicial de profiles.

-- Username: 4–18 caracteres (registo por e-mail/senha).
create or replace function public.validate_username_format(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select char_length(trim(p_username)) between 4 and 18;
$$;

-- Senha: mínimo 8 caracteres e pelo menos um dos especiais indicados (mesmo conjunto do cliente).
create or replace function public.validate_password_for_signup(p_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select length(p_password) >= 8
    and p_password ~ '[!@#$%^&*]';
$$;

grant execute on function public.validate_username_format(text) to anon, authenticated;
grant execute on function public.validate_password_for_signup(text) to anon, authenticated;

-- Garante que o trigger rejeita username inválido vindo do metadata (defesa em profundidade).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  meta_u text;
begin
  meta_u := nullif(trim(new.raw_user_meta_data->>'username'), '');
  if meta_u is not null then
    if char_length(meta_u) < 4 or char_length(meta_u) > 18 then
      raise exception 'invalid_username_length'
        using errcode = 'check_violation',
        hint = 'Use entre 4 e 18 caracteres no nome de usuário.';
    end if;
    uname := meta_u;
  else
    uname := split_part(new.email, '@', 1) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
    uname := left(uname, 18);
  end if;

  insert into public.profiles (id, username) values (new.id, uname);
  return new;
end;
$$;
