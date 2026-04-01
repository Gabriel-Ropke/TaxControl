import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { taxFields, FIELD_LABELS } from "../../utils/taxUtils";
import { formatCurrencyInput, parseCurrencyToFloat, formatBRL } from "../../utils/formatters";
import { createTax, updateTax } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { MonthMultiPicker } from "../MonthMultiPicker/MonthMultiPicker";
import "./taxModal.css";

// Utilitários auxiliares para converter e exibir datas de log
function formatLogDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export function TaxModal({ isOpen, onClose, companyId, initialData, existingTaxes = [], onSuccess }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(initialData);

  // Inicializa os dados. Preenche 0 ou vazio para não causar 'uncontrolled inputs'.
  const [formData, setFormData] = useState(() => {
    let f = { date: "" };
    taxFields.forEach(k => f[k] = "");
    return f;
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        // Extrai o 'YYYY-MM' da data completa do banco ('YYYY-MM-DD')
        const monthValue = initialData.date ? initialData.date.substring(0, 7) : "";
        
        let initialFields = { date: monthValue };
        taxFields.forEach(field => {
          // Usa formatBRL para inicializar com o formato correto de R$ 
          initialFields[field] = initialData[field] != null ? formatBRL(initialData[field]) : "";
        });
        setFormData(initialFields);
      } else {
        // Limpo para novo registro
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        let emptyFields = { date: currentMonth };
        taxFields.forEach(field => emptyFields[field] = "");
        setFormData(emptyFields);
      }
    }
  }, [isOpen, isEditing, initialData]);

  if (!isOpen) return null;

  // Verifica se o mês já existe no array existingTaxes
  const isMonthDuplicate = formData.date && existingTaxes.some(tax => {
    if (!tax.date) return false;
    const isSameMonth = tax.date.startsWith(formData.date);
    // Ignora a linha atual se estivermos em modo de Edição (para não bloquear se ele salvar o mesmo que está editando)
    if (isEditing && tax.id === initialData.id) return false;
    return isSameMonth;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    // Applica a máscara visual na hora que o usuário digita
    const maskedValue = formatCurrencyInput(value);
    setFormData(prev => ({ ...prev, [name]: maskedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      addToast("Selecione qual é o mês de referência", "error");
      return;
    }

    setLoading(true);

    try {
      // Monta o objeto formatado
      const payload = {
        company_id: companyId,
        // Supabase espera yyyy-mm-dd em campos puros date. Forçaremos dia 01
        date: `${formData.date}-01`,
      };

      taxFields.forEach(field => {
        // Usa o conversor auxiliar para virar float
        const val = parseCurrencyToFloat(formData[field]);
        payload[field] = val; // Se val = null, o DB limpará
      });

      if (isEditing) {
        await updateTax(initialData.id, payload);
        addToast("Registro de imposto atualizado!", "success");
      } else {
        await createTax(payload);
        addToast("Imposto registrado com sucesso!", "success");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      addToast("Houve um erro ao processar o imposto", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tax-modal-overlay" onClick={onClose}>
      <div className="tax-modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{isEditing ? "Editar Registro de Imposto" : "Adicionar Tributação"}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="modal-body">
          <form id="tax-form" onSubmit={handleSubmit}>
            <div className="field-group picker-field">
              <label>Mês de Referência</label>
              <MonthMultiPicker
                label="Selecione o mês"
                selected={formData.date}
                onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                singleMode={true}
              />
              {isMonthDuplicate && (
                <span style={{ color: "var(--negative-color)", fontSize: "12px", marginTop: "4px" }}>
                  Este mês já possui um registro.
                </span>
              )}
            </div>

            <div className="tax-grid">
              {taxFields.map(field => (
                <div className="field-group" key={field}>
                  <label htmlFor={field}>{FIELD_LABELS[field]}</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    id={field}
                    name={field}
                    placeholder="R$ 0,00"
                    value={formData[field]}
                    onChange={handleNumericChange}
                    disabled={loading}
                  />
                </div>
              ))}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <div className="actions">
            <Button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" form="tax-form" isLoading={loading} disabled={isMonthDuplicate || loading}>
              {isEditing ? "Salvar Alterações" : "Gravar Registro"}
            </Button>
          </div>
          
          {isEditing && (
            <div className="history-info">
              <span><strong>Registrado em:</strong> {formatLogDate(initialData.created_at)}</span>
              {initialData.updated_at && (
                <span><strong>Última Edição:</strong> {formatLogDate(initialData.updated_at)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
