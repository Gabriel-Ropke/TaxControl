import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { supabase } from "../../lib/supabase";
import "./editContactModal.css";

export function EditContactModal({ type, currentValue, user, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [newValue, setNewValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatPhone = (value) => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    if (nums.length === 0) return "";
    if (nums.length <= 2) return nums;
    if (nums.length <= 3) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2, 3)} ${nums.slice(3, 7)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 3)} ${nums.slice(3, 7)}-${nums.slice(7)}`;
  };

  const handlePhoneChange = (e) => {
    setNewValue(formatPhone(e.target.value));
  };

  const handleVerifyAndChange = async () => {
    setError(null);
    setLoading(true);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });
    
    if (signInError) {
      setError({ type: "error", message: "Senha incorreta." });
      setLoading(false);
      return;
    }

    if (type === "phone") {
      const { error } = await supabase.from("profiles").update({ phone: newValue }).eq("id", user.id);
      if (error) {
        setError({ type: "error", message: "Erro ao alterar telefone." });
      } else {
        onSuccess();
        onClose();
      }
    } else {
      console.log("Alterando e-mail para:", newValue);
      const { data, error } = await supabase.auth.updateUser({ email: newValue });
      console.log("Resultado:", data, error);
      if (error) {
        setError({ type: "error", message: "Erro ao alterar e-mail: " + error.message });
      } else {
        setStep(2);
        onSuccess();
      }
    }
    setLoading(false);
  };

  const title = type === "phone" ? "Alterar Telefone" : "Alterar E-mail";
  const inputLabel = type === "phone" ? "Novo Telefone" : "Novo E-mail";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          {step === 0 && (
            <>
              <div className="current-value">
                <span className="label">Atual:</span>
                <span className="value">{currentValue || "—"}</span>
              </div>
              <div className="input-container">
                <input 
                  type={type === "phone" ? "tel" : "email"} 
                  value={newValue} 
                  onChange={type === "phone" ? handlePhoneChange : (e) => setNewValue(e.target.value)} 
                  placeholder=" "
                />
                <label>{inputLabel}</label>
              </div>
              <div className="input-container">
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder=" "
                  />
                <label>Senha Atual</label>
              </div>
              <Button onClick={handleVerifyAndChange} disabled={!newValue || newValue === currentValue || !password} isLoading={loading}>
                Confirmar
              </Button>
            </>
          )}
          
          {step === 2 && (
            <div className="success-message">
              <p>E-mail alternativo enviado para <strong>{newValue}</strong>.</p>
              <p>Confirme a alteração pelo link no seu novo e-mail.</p>
              <Button onClick={onClose}>Fechar</Button>
            </div>
          )}
          
          {error && <span className={`feedback ${error.type}`}>{error.message}</span>}
        </div>
      </div>
    </div>
  );
}