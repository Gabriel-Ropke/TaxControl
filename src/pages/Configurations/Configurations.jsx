import { isPasswordValid, registerValidators } from "../../utils/registerValidators";
import { Sun, User, Lock, X, Eye, EyeOff, ChevronDown } from "lucide-react";
import { PageWithSidebar } from "../../components/PageWithSidebar/PageWithSidebar";
import "./configurations.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { EditContactModal } from "../../components/EditContactModal/EditContactModal";
import { AvatarUpload } from "../../components/AvatarUpload/AvatarUpload";

const CURRENCY_OPTIONS = [
  { value: "BRL", label: "R$ — Real Brasileiro", symbol: "R$" },
  { value: "USD", label: "$ — Dólar Americano", symbol: "$" },
  { value: "EUR", label: "€ — Euro", symbol: "€" },
  { value: "GBP", label: "£ — Libra Esterlina", symbol: "£" },
  { value: "JPY", label: "¥ — Iene Japonês", symbol: "¥" },
  { value: "CNY", label: "¥ — Yuan Chinês", symbol: "¥" },
  { value: "CHF", label: "CHF — Franco Suíço", symbol: "CHF" },
  { value: "CAD", label: "$ — Dólar Canadense", symbol: "$" },
  { value: "AUD", label: "$ — Dólar Australiano", symbol: "$" },
  { value: "INR", label: "₹ — Rupia Indiana", symbol: "₹" },
  { value: "MXN", label: "$ — Peso Mexicano", symbol: "$" },
  { value: "KRW", label: "₩ — Won Sul-Coreano", symbol: "₩" },
  { value: "SGD", label: "$ — Dólar de Singapura", symbol: "$" },
  { value: "HKD", label: "$ — Dólar de Hong Kong", symbol: "$" },
  { value: "BGN", label: "лв — Lev Búlgaro", symbol: "лв" },
  { value: "CZK", label: "Kč — Coroa Tcheca", symbol: "Kč" },
  { value: "DKK", label: "kr — Coroa Dinamarquesa", symbol: "kr" },
  { value: "NOK", label: "kr — Coroa Norueguesa", symbol: "kr" },
  { value: "SEK", label: "kr — Coroa Sueca", symbol: "kr" },
  { value: "PLN", label: "zł — Zloty Polonês", symbol: "zł" },
  { value: "RUB", label: "₽ — Rublo Russo", symbol: "₽" },
  { value: "TRY", label: "₺ — Lira Turca", symbol: "₺" },
  { value: "ZAR", label: "R — Rand Sul-Africano", symbol: "R" },
  { value: "ARS", label: "$ — Peso Argentino", symbol: "$" },
  { value: "CLP", label: "$ — Peso Chileno", symbol: "$" },
  { value: "COP", label: "$ — Peso Colombiano", symbol: "$" },
  { value: "UYU", label: "$ — Peso Uruguaio", symbol: "$" },
  { value: "PEN", label: "S/ — Sol Peruano", symbol: "S/" },
  { value: "BOB", label: "Bs — Boliviano", symbol: "Bs" },
  { value: "PYG", label: "₲ — Guarani Paraguaio", symbol: "₲" },
];

const ACCENT_COLORS = [
  { name: "Laranja",  value: "#ea580c", hover: "#c2410c", bg: "rgba(234,88,12,0.1)",    border: "rgba(234,88,12,0.3)"   },
  { name: "Roxo",    value: "#7c3aed", hover: "#6d28d9", bg: "rgba(124,58,237,0.1)",   border: "rgba(124,58,237,0.3)"  },
  { name: "Azul",    value: "#2563eb", hover: "#1d4ed8", bg: "rgba(37,99,235,0.1)",    border: "rgba(37,99,235,0.3)"   },
  { name: "Verde",   value: "#16a34a", hover: "#15803d", bg: "rgba(22,163,74,0.1)",    border: "rgba(22,163,74,0.3)"   },
  { name: "Rosa",    value: "#db2777", hover: "#be185d", bg: "rgba(219,39,119,0.1)",   border: "rgba(219,39,119,0.3)"  },
  { name: "Teal",    value: "#0d9488", hover: "#0f766e", bg: "rgba(13,148,136,0.1)",   border: "rgba(13,148,136,0.3)"  },
  { name: "Âmbar",   value: "#d97706", hover: "#b45309", bg: "rgba(217,119,6,0.1)",    border: "rgba(217,119,6,0.3)"   },
  { name: "Índigo",  value: "#4f46e5", hover: "#4338ca", bg: "rgba(79,70,229,0.1)",    border: "rgba(79,70,229,0.3)"   },
];

function applyAccentColor(colorObj) {
  const root = document.documentElement;
  root.style.setProperty("--color-accent", colorObj.value);
  root.style.setProperty("--accent-hover", colorObj.hover);
  root.style.setProperty("--accent-bg", colorObj.bg);
  root.style.setProperty("--accent-border", colorObj.border);
}

// ─── Modal de Senha ────────────────────────────────────────────────
function PasswordModal({ user, onClose, profile }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [validationRules, setValidationRules] = useState([]);

  const DAYS_TO_WAIT = 14;

  const canChangePassword = () => {
    if (!profile?.password_changed_at) return true;
    const lastChange = new Date(profile.password_changed_at);
    const now = new Date();
    const diffDays = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
    return diffDays >= DAYS_TO_WAIT;
  };

  const daysRemaining = () => {
    if (!profile?.password_changed_at) return 0;
    const lastChange = new Date(profile.password_changed_at);
    const now = new Date();
    const diffDays = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
    return DAYS_TO_WAIT - diffDays;
  };

  const handleNextChange = (value) => {
    setForm(p => ({ ...p, next: value }));
    setValidationRules(registerValidators.password(value));
    setShowRules(true);
  };

  const handleSubmit = async () => {
    if (!canChangePassword()) {
      return setFeedback({ type: "error", message: `Aguarde ${daysRemaining()} dias para alterar novamente.` });
    }
    setFeedback(null);
    if (!isPasswordValid(form.next)) {
      setShowRules(true);
      return setFeedback({ type: "error", message: "A senha não atende aos requisitos." });
    }
    if (form.next !== form.confirm)
      return setFeedback({ type: "error", message: "As senhas não coincidem." });
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: form.current });
    if (signInError) {
      setLoading(false);
      return setFeedback({ type: "error", message: "Senha atual incorreta." });
    }
    const { error } = await supabase.auth.updateUser({ password: form.next });
    if (error) {
      setFeedback({ type: "error", message: "Erro ao alterar senha." });
    } else {
      await supabase.from("profiles").update({ password_changed_at: new Date().toISOString() }).eq("id", user.id);
      setFeedback({ type: "success", message: "Senha alterada com sucesso!" });
      setTimeout(onClose, 1500);
    }
    setLoading(false);
  };

  if (!canChangePassword()) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Lock size={18} /> Alterar Senha</h3>
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body">
            <p style={{ textAlign: "center", color: "var(--secondary-text)" }}>
              Você só pode alterar a senha a cada {DAYS_TO_WAIT} dias.<br /><br />
              Aguarde <strong>{daysRemaining()} dias</strong> para alterar novamente.
            </p>
          </div>
          <div className="modal-footer">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Lock size={18} /> Alterar Senha</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>Senha Atual</label>
            <div className="password-input-wrapper">
              <input type={showCurrent ? "text" : "password"} value={form.current}
                onChange={(e) => setForm(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
              <button type="button" onClick={() => setShowCurrent(s => !s)}>
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="modal-field">
            <label>Nova Senha</label>
            <div className="password-input-wrapper">
              <input type={showNext ? "text" : "password"} value={form.next}
                onChange={(e) => handleNextChange(e.target.value)} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={() => setShowNext(s => !s)}>
                {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {showRules && validationRules.length > 0 && (
              <ul className="password-rules">
                {validationRules.map((r, i) => (
                  <li key={i} className={r.rule ? "valid" : "invalid"}>
                    {r.rule ? "✓" : "✗"} {r.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="modal-field">
            <label>Confirmar Nova Senha</label>
            <input type="password" value={form.confirm}
              onChange={(e) => setForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Repita a nova senha" />
          </div>
          {feedback && <span className={`feedback ${feedback.type}`}>{feedback.message}</span>}
        </div>
        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancelar</button>
          <Button onClick={handleSubmit} isLoading={loading}>Alterar Senha</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────
export function Configurations() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [openSelect, setOpenSelect] = useState(null);
  const [profile, setProfile] = useState(null);

  // Perfil
  const [form, setForm] = useState({ username: "", role: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Editar contato via modal
  const [editContactModal, setEditContactModal] = useState(null);

  // Aparência
  const [currency, setCurrency] = useState("BRL");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("accentColor") || ACCENT_COLORS[0].value);
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceFeedback, setAppearanceFeedback] = useState(null);
  const [currencyChanged, setCurrencyChanged] = useState(false);

  // Sistema
  const [toggling2FA, setToggling2FA] = useState(false);

  // Aplicar preferências salvas ao montar
  useEffect(() => {
    const savedColor = localStorage.getItem("accentColorObj");
    if (savedColor) { try { applyAccentColor(JSON.parse(savedColor)); } catch {} }
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setForm({ username: data.username ?? "", role: data.role ?? "", phone: data.phone ?? "" });
      if (data.currency) {
        setCurrency(data.currency);
        localStorage.setItem("currency", data.currency);
      }
    }
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const handleLogout = async () => { await signOut(); navigate("/", { replace: true }); };
  const handleSelect = (id) => setOpenSelect(prev => (prev === id ? null : id));

  const handleAvatarUpload = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${user.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);
    
    if (uploadError) {
      console.error("Erro upload:", uploadError);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    fetchProfile();
  };

  const handleSaveProfile = async () => {
    setSaving(true); setProfileFeedback(null);
    const { error } = await supabase.from("profiles").update({ ...form, updated_at: new Date().toISOString() }).eq("id", user.id);
    setProfileFeedback(error ? { type: "error", message: "Erro ao salvar." } : { type: "success", message: "Salvo com sucesso!" });
    if (!error) fetchProfile();
    setSaving(false);
  };

  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", t);
    setTheme(t);
  };

  const handleAccentSelect = (colorObj) => {
    applyAccentColor(colorObj);
    localStorage.setItem("accentColor", colorObj.value);
    localStorage.setItem("accentColorObj", JSON.stringify(colorObj));
    setAccentColor(colorObj.value);
  };

  const handleSaveAppearance = async () => {
    setAppearanceSaving(true); setAppearanceFeedback(null);
    const { error } = await supabase.from("profiles").update({ currency, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (!error) { 
      localStorage.setItem("currency", currency); 
      setAppearanceFeedback({ type: "success", message: "Preferências salvas!" }); 
      fetchProfile();
    }
    else setAppearanceFeedback({ type: "error", message: "Erro ao salvar." });
    setAppearanceSaving(false);
  };

  const selectedCurrencyLabel = CURRENCY_OPTIONS.find(o => o.value === currency)?.label ?? "R$ — Real Brasileiro";

  return (
    <PageWithSidebar>
      {showPasswordModal && <PasswordModal user={user} profile={profile} onClose={() => setShowPasswordModal(false)} />}
      {editContactModal && (
        <EditContactModal
          type={editContactModal.type}
          currentValue={editContactModal.current}
          user={user}
          onClose={() => setEditContactModal(null)}
          onSuccess={() => fetchProfile()}
        />
      )}

      <div id="configurationsContainer" className="single-section">
        <header>
          <h2 className="title">Configurações</h2>
        </header>

        <div className="configs-content">

          {/* ── PERFIL ── */}
          <div className="config-group">
            <div className="config-group-header">
              <User size={18} />
              <h3>Perfil do Usuário</h3>
              <span>Gerencie suas informações pessoais</span>
            </div>

            <div className="item-container">
              <div className="row change-pfp">
                <div className="userPfp">
                  <AvatarUpload
                    username={profile?.username}
                    currentAvatar={profile?.avatar_url}
                    onUpload={handleAvatarUpload}
                  />
                  <div className="user-info">
                    <span className="name">{profile?.username ?? "—"}</span>
                    <span className="role">{profile?.role ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="item-container">
              <div className="column">
                <div className="title-item"><span>Informações Pessoais</span></div>
                <div className="list-input-container">
                  <div className="input-container">
                    <input type="text" value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} />
                    <label>Nome de Usuário</label>
                  </div>
                  <div className="input-container locked">
                    <input type="text" value={form.role} readOnly tabIndex="-1" style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }} onFocus={(e) => e.target.blur()} onSelect={(e) => e.preventDefault()} />
                    <label>Cargo</label>
                  </div>
                  
                  <div className="input-row-edit">
                    <div className="input-container locked">
                      <input type="text" value={form.phone || "—"} readOnly tabIndex="-1" style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }} onFocus={(e) => e.target.blur()} onSelect={(e) => e.preventDefault()} />
                      <label>Telefone</label>
                    </div>
                    <Button variant="secondary" onClick={() => setEditContactModal({ type: "phone", current: form.phone })}>Alterar</Button>
                  </div>
                  
                  <div className="input-row-edit">
                    <div className="input-container locked">
                      <input type="text" value={user?.email ?? ""} readOnly tabIndex="-1" style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'default' }} onFocus={(e) => e.target.blur()} onSelect={(e) => e.preventDefault()} />
                      <label>E-mail</label>
                    </div>
                    <Button variant="secondary" onClick={() => setEditContactModal({ type: "email", current: user?.email })}>Alterar</Button>
                  </div>
                </div>
                {profileFeedback && <span className={`feedback ${profileFeedback.type}`}>{profileFeedback.message}</span>}
                <div className="button-container">
                  <Button onClick={handleSaveProfile} disabled={saving} isLoading={saving}>Salvar Alterações</Button>
                </div>
              </div>
            </div>

            <div className="item-container">
              <div className="row">
                <div className="title-item"><Lock size={16} /><span>Alterar Senha</span></div>
                <Button onClick={() => setShowPasswordModal(true)}>Alterar Senha</Button>
              </div>
            </div>

            <div className="item-container">
              <div className="row">
                <div className="title-item"><span>Sair da conta</span></div>
                <Button variant="danger" onClick={handleLogout}>Sair</Button>
              </div>
            </div>
          </div>

          {/* ── APARÊNCIA ── */}
          <div className="config-group">
            <div className="config-group-header">
              <Sun size={18} />
              <h3>Aparência</h3>
              <span>Personalize a interface do sistema</span>
            </div>

            {/* Tema */}
            <div className="item-container">
              <div className="column change-theme">
                <div className="title-item"><span>Tema</span></div>
                <div className="row start">
                  {[{ key: "dark", label: "Escuro" }, { key: "light", label: "Claro" }].map(t => (
                    <div key={t.key} className={`theme ${theme === t.key ? "selected" : ""}`} onClick={() => applyTheme(t.key)}>
                      <div className={`page ${t.key}`}>
                        <div className="sidebar"></div>
                      </div>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Formato de Moeda */}
            <div className="item-container">
              <div className="column change-idiom">
                <div className="title-item"><span>Preferências</span></div>
                <div className="list-select-container">
                  <div className="select-wrapper">
                    <span className="select-title">Formato de moeda</span>
                    <div className={`select-container ${openSelect === "currency" ? "active" : ""}`}>
                      <div className="selected-item" onClick={() => handleSelect("currency")}>
                        <ChevronDown />
                        <span className="item">{selectedCurrencyLabel}</span>
                      </div>
                      <ul className="select-options hidden-scrollbar">
                        {CURRENCY_OPTIONS.map(option => (
                          <li key={option.value} className={currency === option.value ? "selected" : ""}
                            onClick={() => { setCurrency(option.value); setCurrencyChanged(true); handleSelect(null); }}>
                            {option.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                {currencyChanged && <span className="feedback" style={{ color: "var(--warning)" }}>Para atualizar corretamente, é necessário reiniciar a página</span>}
                {appearanceFeedback && <span className={`feedback ${appearanceFeedback.type}`}>{appearanceFeedback.message}</span>}
                <div className="button-container">
                  <Button onClick={handleSaveAppearance} disabled={appearanceSaving} isLoading={appearanceSaving}>Salvar Alterações</Button>
                </div>
              </div>
            </div>

            {/* Cor de Destaque — estilo bolinha original */}
            <div className="item-container">
              <div className="column change-color">
                <div className="title-item"><span>Cor de Destaque</span></div>
                <div className="row start">
                  {ACCENT_COLORS.map(colorObj => (
                    <div
                      key={colorObj.value}
                      className={`color ${accentColor === colorObj.value ? "selected" : ""}`}
                      data-color={colorObj.name}
                      style={{ "--color": colorObj.value }}
                      onClick={() => handleAccentSelect(colorObj)}
                    >
                      <div className="triangle"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWithSidebar>
  );
}
