import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, CircleCheck, CircleX } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import "./login.css";
import { useNavigate } from "react-router-dom";

const validators = {
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
    { rule: value.length >= 8, message: "Mínimo de 8 caracteres" },
    {
      rule: /[!@#$%^&*]/.test(value),
      message: "Pelo menos 1 caractere especial",
    },
  ],
};

const InputField = ({ type, label, id, validate }) => {
  const [isActive, setIsActive] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [rules, setRules] = useState([]);
  const [showRules, setShowRules] = useState(false); // só aparece após primeiro blur

  const handleblur = (e) => {
    if (!e.target.value) setIsActive(false);
    if (validate) setShowRules(true);
  };

  const isPassword = type === "password";

  return (
    <div className="wrapper">
      <div
        className={`input ${isActive ? "active" : ""} ${hasValue ? "filled" : ""}`}
      >
        <input
          type={isPassword && !isVisible ? "password" : "text"}
          id={id}
          onFocus={() => setIsActive(true)}
          onBlur={handleblur}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0);
            if (validate) setRules(validate(e.target.value));
          }}
        />
        <label htmlFor={id}>{label}</label>
        {isPassword && (
          <span
            className="toggle-visibility"
            onClick={() => setIsVisible((prev) => !prev)}
          >
            {isVisible ? <EyeOff size={24} /> : <Eye size={24} />}
          </span>
        )}
      </div>
      {showRules && (
        <ul className="input-rules">
          {rules.map((item, index) => (
            <li key={index} className={item.rule ? "valid" : "invalid"}>
              {item.rule ? <CircleCheck size={14} /> : <CircleX size={14} />}
              {item.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export function Login() {
  useEffect(() => {
    document.body.classList.add("login-page");

    return () => {
      document.body.classList.remove("login-page");
    };
  });
  const navigate = useNavigate();
  // useState para alterar entre os forms
  const [registerIsActive, setRegisterIsActive] = useState(false);
  const toggleActive = () => {
    setRegisterIsActive((prev) => !prev);
  };
  // InputField
  const loginRef = useRef(null);
  const registerRef = useRef(null);
  const [height, setHeight] = useState(0);
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  useEffect(() => {
    const activeForm = registerIsActive
      ? loginRef.current
      : registerRef.current;
    setHeight(activeForm.offsetHeight);
    const observer = new ResizeObserver(() => {
      setHeight(activeForm.offsetHeight);
    });
    observer.observe(activeForm);

    return () => observer.disconnect();
  }, [registerIsActive]);
  return (
    <>
      <section id="login" style={{ height: height }}>
        <form
          action="POST"
          className={`login ${registerIsActive ? "active" : ""}`}
          ref={loginRef}
          onSubmit={handleSubmit}
        >
          <h1>
            Faça seu Login<span>.</span>
          </h1>
          <div className="input-container">
            <InputField type="text" id="email" label="E-mail" />
            <InputField type="password" id="senha" label="Senha" />
          </div>
          <a href="#" className="forgot-password hoverTextDecorationEffect">
            Esqueci a senha
          </a>
          <button className="login-button">Entrar</button>
          <span
            onClick={toggleActive}
            className="go-register hoverTextDecorationEffect"
          >
            Não tem conta? Registre-se
          </span>
          <div className="social-login">
            <span>Ou, se preferir</span>
            <button className="social" style={{ "--social-color": "#ff2a17" }}>
              <FcGoogle size={28} />
              google
            </button>
            <button className="social" style={{ "--social-color": "#4286F5" }}>
              <FaFacebook size={28} />
              facebook
            </button>
          </div>
        </form>
        <form
          action="POST"
          className={`register ${registerIsActive ? "" : "active"}`}
          ref={registerRef}
          onSubmit={handleSubmit}
        >
          <h1>
            Registre sua conta<span>.</span>
          </h1>
          <div className="input-container">
            <InputField
              type="text"
              id="registerUsername"
              label="Nome de Usuário"
              validate={validators.username}
            />
            <InputField
              type="text"
              id="registerEmail"
              label="E-mail"
              validate={validators.email}
            />
            <InputField
              type="password"
              id="registerPassword"
              label="Senha"
              validate={validators.password}
            />
          </div>
          <button className="login-button">Criar Conta</button>
          <span
            className="go-register hoverTextDecorationEffect"
            onClick={toggleActive}
          >
            Tem conta? Faça Login
          </span>
          <div className="social-login">
            <span>Ou, se preferir</span>
            <button className="social" style={{ "--social-color": "#ff2a17" }}>
              <FcGoogle size={28} />
              google
            </button>
            <button className="social" style={{ "--social-color": "#4286F5" }}>
              <FaFacebook size={28} />
              facebook
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
