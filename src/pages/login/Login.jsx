import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, X, ArrowLeft } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  signInWithIdentifier,
  signInWithGoogle,
  signUp,
  resetPassword,
} from "../../services/auth";
import {
  isRegisterFormValid,
  registerValidators,
} from "../../utils/registerValidators";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const InputField = ({
  type,
  label,
  id,
  validate,
  value,
  onChange,
  disabled,
  autoComplete,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [rules, setRules] = useState([]);

  const isPassword = type === "password";

  const handleBlur = (e) => {
    if (!e.target.value) setIsActive(false);
    if (validate) {
      setRules(validate(e.target.value));
      setShowRules(true);
    }
  };

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    if (validate) setRules(validate(v));
  };

  return (
    <div className="wrapper">
      <div style={{ position: 'relative' }}>
        <Input
          type={isPassword && !isVisible ? "password" : "text"}
          id={id}
          label={label}
          value={value}
          onChange={(e) => handleChange(e)}
          disabled={disabled}
          autoComplete={
            autoComplete ?? (isPassword ? "current-password" : "username")
          }
          onFocus={() => setIsActive(true)}
          onBlur={handleBlur}
          error={rules.find(r => !r.rule)?.message ?? null}
        />
        {isPassword && (
          <span
            className="toggle-visibility"
            onClick={() => setIsVisible((prev) => !prev)}
            style={{ position: 'absolute', right: '12px', top: 'calc(50% + 14px)', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--secondary-text)' }}
          >
            {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        )}
      </div>
    </div>
  );
};

export function Login() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [registerIsActive, setRegisterIsActive] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [pending, setPending] = useState(false);

  const loginRef = useRef(null);
  const registerRef = useRef(null);
  const [height, setHeight] = useState(0);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const loginCanSubmit = useMemo(
    () => Boolean(loginIdentifier.trim()) && Boolean(loginPassword.length),
    [loginIdentifier, loginPassword],
  );

  const registerCanSubmit = useMemo(
    () =>
      isRegisterFormValid({
        username: regUsername,
        email: regEmail,
        password: regPassword,
      }),
    [regUsername, regEmail, regPassword],
  );

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  useEffect(() => {
    if (!authLoading && session) {
      navigate("/home", { replace: true });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    const activeForm = registerIsActive
      ? registerRef.current
      : loginRef.current;
    if (!activeForm) return;
    setHeight(activeForm.offsetHeight);
    const observer = new ResizeObserver(() => {
      setHeight(activeForm.offsetHeight);
    });
    observer.observe(activeForm);
    return () => observer.disconnect();
  }, [registerIsActive, authError, authMessage, registerCanSubmit]);

  const toggleActive = () => {
    setRegisterIsActive((prev) => !prev);
    setAuthError("");
    setAuthMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (!loginIdentifier.trim() || !loginPassword) {
      setAuthError("Preencha e-mail ou usuário e a senha.");
      return;
    }
    setPending(true);
    const { error } = await signInWithIdentifier(
      loginIdentifier,
      loginPassword,
    );
    setPending(false);
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setAuthError("E-mail não confirmado. Verifique sua caixa de entrada.");
      } else {
        setAuthError(error.message);
      }
      return;
    }
    navigate("/home", { replace: true });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setAuthError("Digite seu e-mail.");
      return;
    }
    setForgotLoading(true);
    setAuthError("");
    const { error } = await resetPassword(forgotEmail);
    setForgotLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setForgotSent(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    if (
      !isRegisterFormValid({
        username: regUsername,
        email: regEmail,
        password: regPassword,
      })
    ) {
      setAuthError("Preencha todos os campos conforme as regras indicadas.");
      return;
    }
    setPending(true);
    const { data, error } = await signUp({
      email: regEmail,
      password: regPassword,
      username: regUsername,
    });
    setPending(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    if (data?.session) {
      addToast("Conta criada com sucesso!", "success");
      navigate("/home", { replace: true });
      return;
    }
    setAuthMessage("Verifique seu e-mail para confirmar e depois faça login.");
  };

  const handleGoogle = async () => {
    setAuthError("");
    setPending(true);
    const { error } = await signInWithGoogle();
    setPending(false);
    if (error) setAuthError(error.message);
  };

  if (authLoading) {
    return (
      <span style={{ color: "#fff", padding: "2rem" }}>Carregando...</span>
    );
  }

  if (forgotPassword) {
    return (
      <section id="login" style={{ minHeight: 400 }}>
        <form className="login active" onSubmit={handleForgotPassword}>
          <span onClick={() => { setForgotPassword(false); setForgotSent(false); setAuthError(""); }} 
              className="back-to-login">
            <ArrowLeft size={18} /> Voltar
          </span>
          <h1>Recuperar Senha<span>.</span></h1>
          {forgotSent ? (
            <p className="auth-banner auth-success" style={{ marginBottom: "20px" }}>
              E-mail de recuperação enviado! Verifique sua caixa de entrada.
            </p>
          ) : (
            <>
              <p style={{ color: "var(--secondary-text)", marginBottom: "20px" }}>
                Digite seu e-mail para receber o link de recuperação.
              </p>
              {authError && (
                <p className="auth-banner auth-error">{authError}</p>
              )}
              <div className="input-container">
                <InputField
                  type="email"
                  id="forgotEmail"
                  label="E-mail"
                  value={forgotEmail}
                  onChange={setForgotEmail}
                  disabled={forgotLoading}
                  autoComplete="email"
                />
              </div>
              <Button
                type="submit"
                disabled={forgotLoading || !forgotEmail.trim()}
                isLoading={forgotLoading}
                fullWidth
                style={{ marginTop: '10px' }}
              >
                Enviar Link
              </Button>
            </>
          )}
        </form>
      </section>
    );
  }

  return (
    <>
      <section
        id="login"
        style={{
          height: height > 0 ? height : undefined,
          minHeight: height > 0 ? undefined : 560,
        }}
      >
        <form
          className={`login ${!registerIsActive ? "active" : ""}`}
          ref={loginRef}
          onSubmit={handleLogin}
        >
          <h1>
            Faça seu Login<span>.</span>
          </h1>
          {authError && !registerIsActive && (
            <p className="auth-banner auth-error">{authError}</p>
          )}
          <div className="input-container">
            <InputField
              type="text"
              id="loginIdentifier"
              label="E-mail ou nome de usuário"
              value={loginIdentifier}
              onChange={setLoginIdentifier}
              disabled={pending}
              autoComplete="username"
            />
            <InputField
              type="password"
              id="senha"
              label="Senha"
              value={loginPassword}
              onChange={setLoginPassword}
              disabled={pending}
              autoComplete="current-password"
            />
          </div>
          <span onClick={() => { setForgotPassword(true); setAuthError(""); }} className="forgot-password hoverTextDecorationEffect">
            Esqueci a senha
          </span>
          <Button
            type="submit"
            disabled={pending || !loginCanSubmit}
            isLoading={pending}
            fullWidth
            style={{ marginTop: '10px' }}
          >
            Entrar
          </Button>
          <span
            onClick={toggleActive}
            className="go-register hoverTextDecorationEffect"
          >
            Não tem conta? Registre-se
          </span>
          <div className="social-login">
            <span>Ou continue com</span>
            <Button
              variant="secondary"
              type="button"
              className="social-google"
              onClick={handleGoogle}
              disabled={pending}
              fullWidth
              style={{ marginTop: '10px' }}
            >
              <FcGoogle size={22} style={{ marginRight: '8px' }} />
              Continuar com Google
            </Button>
          </div>
        </form>
        <form
          className={`register ${registerIsActive ? "active" : ""}`}
          ref={registerRef}
          onSubmit={handleRegister}
        >
          <h1>
            Registre sua conta<span>.</span>
          </h1>
          {authError && registerIsActive && (
            <p className="auth-banner auth-error">{authError}</p>
          )}
          {authMessage && (
            <p className="auth-banner auth-success">{authMessage}</p>
          )}
          <div className="input-container">
            <InputField
              type="text"
              id="registerUsername"
              label="Nome de Usuário"
              validate={registerValidators.username}
              value={regUsername}
              onChange={setRegUsername}
              disabled={pending}
              autoComplete="username"
            />
            <InputField
              type="text"
              id="registerEmail"
              label="E-mail"
              validate={registerValidators.email}
              value={regEmail}
              onChange={setRegEmail}
              disabled={pending}
              autoComplete="email"
            />
            <InputField
              type="password"
              id="registerPassword"
              label="Senha"
              validate={registerValidators.password}
              value={regPassword}
              onChange={setRegPassword}
              disabled={pending}
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            disabled={pending || !registerCanSubmit}
            isLoading={pending}
            fullWidth
            style={{ marginTop: '20px' }}
          >
            Criar Conta
          </Button>
          <span
            onClick={toggleActive}
            className="go-register hoverTextDecorationEffect"
          >
            Tem conta? Faça Login
          </span>
        </form>
      </section>
    </>
  );
}
