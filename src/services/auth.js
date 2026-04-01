/**
 * Autenticação via Supabase Auth. As senhas são processadas apenas no servidor
 * (GoTrue usa bcrypt; nunca armazenam texto plano). O cliente só envia a senha
 * em HTTPS. "Pepper" extra (segredo aplicado antes do hash) não é configurável
 * no Auth padrão; para isso seria necessário Edge Function ou API própria.
 */
import { supabase } from "../lib/supabase";

function mapAuthError(error) {
  if (!error?.message) return "Não foi possível concluir a operação.";
  const m = error.message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail/usuário ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme o e-mail antes de entrar (verifique a caixa de entrada).";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Este e-mail já está cadastrado.";
  if (m.includes("password should be at least"))
    return "A senha não atende aos requisitos mínimos do servidor.";
  if (m.includes("invalid_username_length") || m.includes("invalid_username"))
    return "Nome de usuário inválido: use entre 4 e 18 caracteres.";
  return error.message;
}

export async function signUp({ email, password, username }) {
  const trimmed = username.trim();

  const { data: uOk, error: uFmtErr } = await supabase.rpc(
    "validate_username_format",
    { p_username: trimmed },
  );
  if (uFmtErr) return { data: null, error: { message: uFmtErr.message } };
  if (uOk === false)
    return {
      data: null,
      error: {
        message: "Nome de usuário deve ter entre 4 e 18 caracteres.",
      },
    };

  const { data: pOk, error: pFmtErr } = await supabase.rpc(
    "validate_password_for_signup",
    { p_password: password },
  );
  if (pFmtErr) return { data: null, error: { message: pFmtErr.message } };
  if (pOk === false)
    return {
      data: null,
      error: {
        message:
          "Senha inválida: mínimo 8 caracteres e pelo menos 1 caractere especial (!@#$%^&*).",
      },
    };

  const { data: available, error: availErr } = await supabase.rpc(
    "is_username_available",
    { p_username: trimmed },
  );
  if (availErr) return { data: null, error: { message: availErr.message } };
  if (available === false)
    return {
      data: null,
      error: { message: "Este nome de usuário já está em uso." },
    };

  const result = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { username: trimmed },
    },
  });
  if (result.error)
    return {
      ...result,
      error: { ...result.error, message: mapAuthError(result.error) },
    };
  return result;
}

export async function signInWithIdentifier(identifier, password) {
  const id = identifier.trim();
  let email = id;
  if (!id.includes("@")) {
    const { data, error } = await supabase.rpc("get_email_by_username", {
      p_username: id,
    });
    if (error) return { data: null, error: { message: error.message } };
    if (!data)
      return {
        data: null,
        error: { message: "Usuário não encontrado." },
      };
    email = data;
  }
  const result = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (result.error)
    return { ...result, error: { ...result.error, message: mapAuthError(result.error) } };
  return result;
}

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) return { error };
  if (data?.url) window.location.assign(data.url);
  return { data };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email) {
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) return { error: { message: mapAuthError(error) } };
  return { data };
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: { message: mapAuthError(error) } };
  return { data };
}

export { mapAuthError };
