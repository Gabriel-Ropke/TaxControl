import { useState, useEffect } from "react";
import { X, UserRound } from "lucide-react";
import { taxTypeConfig } from "../../utils/taxUtils";
import { createCompany, updateCompany } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import "./enterpriseModal.css";

export function EnterpriseModal({ isOpen, onClose, initialData, onSuccess }) {
  const { addToast } = useToast();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: "",
    tax_type: "simple"
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setFormData({
          name: initialData.name || "",
          tax_type: initialData.tax_type || "simple"
        });
      } else {
        setFormData({
          name: "",
          tax_type: "simple"
        });
      }
    }
  }, [isOpen, isEditing, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("O nome da empresa é obrigatório", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateCompany(initialData.id, formData);
        addToast("Empresa atualizada com sucesso!", "success");
      } else {
        await createCompany(formData);
        addToast("Empresa cadastrada com sucesso!", "success");
      }
      
      // Callback para atualizar a UI da página que invocou
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      addToast(
        isEditing ? "Erro ao atualizar a empresa" : "Erro ao criar a empresa",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Puxa o nome amigável do perfil, se não utiliza o email do provider 
  const displayAccountName = profile?.username || user?.email || "Usuário não identificado";

  return (
    <div className="enterprise-modal-overlay" onClick={onClose}>
      <div className="enterprise-modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="header-titles">
            <h3>{isEditing ? "Editar Empresa" : "Nova Empresa"}</h3>
            <p>
              {isEditing 
                ? "Modifique os campos abaixo para atualizar o perfil."
                : "Insira as informações básicas para cadastrá-la."}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>
        
        <div className="modal-body">
          <form id="enterprise-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="entName">Nome da Empresa</label>
              <Input
                id="entName"
                name="name"
                placeholder="Ex: ACME Corporation"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="entTaxType">Regime Tributário</label>
              <select
                id="entTaxType"
                name="tax_type"
                className="ui-select"
                value={formData.tax_type}
                onChange={handleChange}
                disabled={loading}
              >
                {Object.entries(taxTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <div className="actions">
            <Button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="enterprise-form"
              isLoading={loading}
            >
              {isEditing ? "Salvar Alterações" : "Criar Empresa"}
            </Button>
          </div>
          
          <div className="auth-info">
            <UserRound size={14} />
            <span>Autenticado como <strong>{displayAccountName}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
