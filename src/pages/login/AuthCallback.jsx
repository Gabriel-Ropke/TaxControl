import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { isPasswordValid, registerValidators } from "../../utils/registerValidators";
import { Button } from "../../components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationRules, setValidationRules] = useState([]);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      const isRecovery = searchParams.get("type") === "recovery";
      const hasAccessToken = hash.includes("access_token=");
      
      if (isRecovery && hasAccessToken) {
        setIsResetPassword(true);
        setLoading(false);
        return;
      }
      
      navigate("/", { replace: true });
    };
    
    checkHash();
  }, [navigate, searchParams]);

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    setValidationRules(registerValidators.password(value));
  };

  const handleSubmit = async () => {
    setError("");
    if (!isPasswordValid(newPassword)) {
      setValidationRules(registerValidators.password(newPassword));
      setError("A senha não atende aos requisitos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    
    setSaving(true);
    
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    
    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      if (sessionError) {
        setSaving(false);
        setError("Link expirado ou inválido. Solicite novamente.");
        return;
      }
    }
    
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    
    if (err) {
      setError(err.message);
      return;
    }
    
    setSuccess(true);
    
    await supabase.auth.signOut();
    setTimeout(() => navigate("/"), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#fff" }}>
        Carregando...
      </div>
    );
  }

  if (isResetPassword) {
    if (success) {
      return (
        <div style={{ 
          padding: "2rem", 
          textAlign: "center", 
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh"
        }}>
          <h2 style={{ color: "#22c55e", marginBottom: "1rem" }}>Senha alterada!</h2>
          <p>Redirecionando para o login...</p>
        </div>
      );
    }

    return (
      <div style={{ 
        padding: "2rem", 
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh"
      }}>
        <div style={{ 
          background: "rgb(16, 16, 16)", 
          padding: "2rem", 
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px"
        }}>
          <h1 style={{ fontSize: "32px", marginBottom: "1rem" }}>Nova Senha<span style={{ color: "var(--color-accent)" }}>.</span></h1>
          
          <p style={{ color: "var(--secondary-text)", marginBottom: "1.5rem" }}>
            Digite sua nova senha. Ela deve ter:
          </p>
          <ul style={{ color: "var(--secondary-text)", marginBottom: "1.5rem", paddingLeft: "1.2rem" }}>
            <li>Mínimo 8 caracteres</li>
            <li> Pelo menos 1 caractere especial (!@#$%^&*)</li>
            <li> Pelo menos 1 número</li>
            <li> Pelo menos 1 letra maiúscula</li>
          </ul>

          {error && (
            <p style={{ 
              background: "#eb493b", 
              padding: "8px", 
              borderRadius: "6px", 
              marginBottom: "1rem",
              fontSize: "14px"
            }}>
              {error}
            </p>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>Nova Senha</label>
            <div style={{ position: "relative" }}>
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--item)",
                  color: "#fff",
                  fontSize: "16px"
                }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--secondary-text)",
                  cursor: "pointer"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {validationRules.length > 0 && (
              <ul style={{ listStyle: "none", padding: "8px 0 0 0", margin: "4px 0 0 0", fontSize: "12px" }}>
                {validationRules.map((r, i) => (
                  <li key={i} style={{ color: r.rule ? "#22c55e" : "#ef4444", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    {r.rule ? "✓" : "✗"} {r.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>Confirmar Senha</label>
            <input 
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--item)",
                color: "#fff",
                fontSize: "16px"
              }}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !newPassword || !confirmPassword}
            isLoading={saving}
            fullWidth
          >
            Alterar Senha
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "#fff" }}>
      Concluindo login...
    </div>
  );
}
