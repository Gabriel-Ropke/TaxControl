/** Regras alinhadas com as funções RPC / trigger no Supabase (migração de validação). */
export const registerValidators = {
  username: (value) => [
    { rule: value.length >= 4, message: "Mínimo de 4 caracteres" },
    { rule: value.length <= 18, message: "Máximo de 18 caracteres" },
  ],
  email: (value) => [
    {
      rule: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: "E-mail inválido",
    },
  ],
  password: (value) => [
    {
      rule: value.length >= 8,
      message: "Sua senha deve conter ao menos 8 caracteres",
    },
    {
      rule: /[!@#$%^&*]/.test(value),
      message: "Pelo menos 1 caractere especial (!@#$%^&*)",
    },
    {
      rule: /[0-9]/.test(value),
      message: "Sua senha deve conter ao menos um número",
    },
    {
      rule: /[A-Z]/.test(value),
      message: "Sua senha deve conter ao menos uma letra maiúscula",
    },
  ],
};

export function isUsernameValid(value) {
  return registerValidators.username(value).every((r) => r.rule);
}

export function isEmailValid(value) {
  return registerValidators.email(value).every((r) => r.rule);
}

export function isPasswordValid(value) {
  return registerValidators.password(value).every((r) => r.rule);
}

export function isRegisterFormValid({ username, email, password }) {
  return (
    isUsernameValid(username) &&
    isEmailValid(email) &&
    isPasswordValid(password)
  );
}
