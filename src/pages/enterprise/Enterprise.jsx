import { useNavigate, useParams } from "react-router-dom";
import "./enterprise.css";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getCompanyById, getTaxesByCompany, deleteTax, deleteCompany } from "../../services/api";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { generateColor } from "../../utils/generateColor";
import { ResumeCard } from "../../components/ResumeCard/ResumeCard";

import { TaxChart } from "../../components/TaxChart/TaxChart";
import { TaxModal } from "../../components/TaxModal/TaxModal";
import { EnterpriseModal } from "../../components/EnterpriseModal/EnterpriseModal";
import { useToast } from "../../contexts/ToastContext";
import {
  taxFields,
  getTotalFromRecord,
  taxTypeConfig,
  FIELD_LABELS,
} from "../../utils/taxUtils";
import { formatBRL, formatMonthShortPt } from "../../utils/formatters";

export function Enterprise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { addToast } = useToast();
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);

  const fetchTaxesOnly = async () => {
    try {
      const taxesData = await getTaxesByCompany(id);
      setTaxes(taxesData);
    } catch (e) {
      console.error(e);
      addToast("Erro ao recarregar impostos", "error");
    }
  };

  const handleEdit = useCallback((tax) => {
    setSelectedTax(tax);
    setIsTaxModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (taxId) => {
    if (!window.confirm("Você tem certeza que deseja excluir esse registro? Essa ação não pode ser desfeita.")) return;
    try {
      await deleteTax(taxId);
      addToast("Imposto deletado com sucesso", "success");
      fetchTaxesOnly();
    } catch (e) {
      console.error(e);
      addToast("Falha ao deletar o imposto", "error");
    }
  }, [addToast, id]);

  const handleDeleteCompany = useCallback(async () => {
    if (!window.confirm(`Tem certeza que deseja excluir "${company?.name}"? Todos os registros de impostos desta empresa serão apagados. Esta ação é irreversível.`)) return;
    try {
      await deleteCompany(id);
      addToast(`Empresa "${company?.name}" excluída com sucesso.`, "success");
      navigate("/enterprises");
    } catch (e) {
      console.error(e);
      addToast("Falha ao excluir a empresa.", "error");
    }
  }, [addToast, id, company, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companyData, taxesData] = await Promise.all([
          getCompanyById(id),
          getTaxesByCompany(id),
        ]);
        setCompany(companyData);
        setTaxes(taxesData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const {
    sorted = [],
    latest = null,
    latestTotal = 0,
    variation = null,
    highest = null,
    accumulated = 0,
  } = useMemo(() => {
    if (!taxes.length) return {};

    const sorted = [...taxes].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const latest = sorted.at(-1);
    const previous = sorted.at(-2);
    const latestTotal = getTotalFromRecord(latest);
    const previousTotal = getTotalFromRecord(previous);
    const variation = previous
      ? ((latestTotal - previousTotal) / previousTotal) * 100
      : null;
    const highest = sorted.reduce(
      (max, t) => (getTotalFromRecord(t) > getTotalFromRecord(max) ? t : max),
      sorted[0],
    );
    const accumulated = sorted.reduce(
      (sum, t) => sum + getTotalFromRecord(t),
      0,
    );

    return {
      sorted,
      latest,
      latestTotal,
      variation,
      highest,
      accumulated,
    };
  }, [taxes]);

  if (loading) return <span>Carregando...</span>;

  const { label, badge } = taxTypeConfig[company.tax_type] ?? {};
  const { color, elementAlphaColor } = generateColor(company.name);
  return (
    <div
      id="enterpriseContainer"
      style={{ "--company-color": color, "--company-alpha": elementAlphaColor }}
    >
      <header>
        <div className="enterprise-name-container">
          <ArrowLeft size={32} onClick={() => navigate(-1)} />
          <span className="enterprise-letter">
            {company.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="enterprise-name">{company.name}</span>
          <span className={`enterprise-tax ${badge}`}>{label}</span>
        </div>
        <div className="header-buttons">
          <button 
            className="default" 
            onClick={() => setIsEnterpriseModalOpen(true)}
          >
            <Pencil size={14} /> Editar Empresa
          </button>
          <button
            className="delete-company-btn"
            onClick={handleDeleteCompany}
            title="Excluir empresa permanentemente"
          >
            <Trash2 size={14} /> Excluir Empresa
          </button>
        </div>
      </header>
      <section id="enterprise">
        <div className="resume-cards">
          <ResumeCard
            title="Total mais recente"
            value={latestTotal > 0 ? formatBRL(latestTotal) : "—"}
            date={latest ? formatMonthShortPt(latest.date) : "Sem Registros"}
            color={color}
          />
          <ResumeCard
            title="Variação"
            value={
              variation != null
                ? `${variation > 0 ? "+" : ""}${variation.toFixed(1)}%`
                : "—"
            }
            valueColor={
              variation == null
                ? undefined
                : variation >= 0
                  ? "var(--positive-color)"
                  : "var(--negative-color)"
            }
            date="vs mês anterior"
            color={color}
          />
          <ResumeCard
            title="Maior registro"
            value={highest ? formatBRL(getTotalFromRecord(highest)) : "—"}
            date={highest ? formatMonthShortPt(highest.date) : "Sem Registros"}
            color={color}
          />
          <ResumeCard
            title="Total acumulado"
            value={formatBRL(accumulated)}
            date={`últimos ${sorted.length} meses`}
            color={color}
          />
        </div>
        <div className="charts">
          <span className="charts-title">Evolução Mensal - {label}</span>
          <TaxChart taxes={taxes} field="total" color={color} />
        </div>
        <div className="table-wrapper">
          <div className="table-header">
            <span className="table-title">Histórico de Registros</span>
            <button 
              className="default new-register"
              onClick={() => { setSelectedTax(null); setIsTaxModalOpen(true); }}
            >
              + Novo Registro
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  {taxFields.map((field) => (
                    <th key={field}>{FIELD_LABELS[field]}</th>
                  ))}
                  <th>Total</th>
                  <th>Variação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {[...sorted].reverse().map((tax, idx, arr) => {
                  const total = getTotalFromRecord(tax);
                  const prevRecord = arr[idx + 1];
                  const prevTotal = prevRecord
                    ? getTotalFromRecord(prevRecord)
                    : null;
                  const variation = prevTotal
                    ? (((total - prevTotal) / prevTotal) * 100).toFixed(1)
                    : null;

                  return (
                    <tr key={tax.id}>
                      <td className="td-date">{formatMonthShortPt(tax.date)}</td>
                      {taxFields.map((field) => (
                        <td key={field}>
                          {tax[field] != null ? formatBRL(tax[field]) : "—"}
                        </td>
                      ))}
                      <td className="td-total">{formatBRL(total)}</td>
                      <td>
                        {variation != null ? (
                          <span
                            className={
                              Number(variation) >= 0 ? "positive" : "negative"
                            }
                          >
                            {Number(variation) >= 0 ? "+" : ""}
                            {variation}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="td-actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(tax)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(tax.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <TaxModal 
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        companyId={id}
        initialData={selectedTax}
        existingTaxes={taxes}
        onSuccess={fetchTaxesOnly}
      />

      <EnterpriseModal
        isOpen={isEnterpriseModalOpen}
        onClose={() => setIsEnterpriseModalOpen(false)}
        initialData={company}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
