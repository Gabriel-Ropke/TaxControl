import { useNavigate, useParams } from "react-router-dom";
import "./enterprise.css";
import { useEffect, useState, useMemo } from "react";
import { getCompanyById, getTaxesByCompany } from "../../services/api";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { generateColor } from "../../utils/generateColor";
import { ResumeCard } from "../../components/resumeCard/ResumeCard";
import { TaxChart } from "../../components/TaxChart/TaxChart";
const taxFields = [
  "simple",
  "pis",
  "cofins",
  "csll",
  "irpj",
  "iss_icms",
  "efd_reinf",
];
const taxTypeConfig = {
  simple: { label: "Simples", badge: "badge-simples" },
  presumed: { label: "Presumido", badge: "badge-presumido" },
  simple_payroll: { label: "Simples c/ Folha", badge: "badge-folha" },
  presumed_no_movement: {
    label: "Presumido s/ Mov.",
    badge: "badge-sem-movimento",
  },
};

const getTotalFromRecord = (record) =>
  taxFields.reduce((sum, field) => sum + (record?.[field] ?? 0), 0);

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString("pt-BR", {
    month: "short",
    year: "2-digit",
  });

export function Enterprise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

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
    sorted,
    latest,
    previous,
    latestTotal,
    previousTotal,
    variation,
    highest,
    accumulated,
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
      previous,
      latestTotal,
      previousTotal,
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
      {console.log(company)}
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
          <button className="default">Editar Empresa</button>
        </div>
      </header>
      <section id="enterprise">
        <div className="resume-cards">
          <ResumeCard
            title="Total mais recente"
            value={formatCurrency(latestTotal)}
            date={formatDate(latest.date)}
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
              variation >= 0 ? "var(--positive-color)" : "var(--negative-color)"
            }
            date="vs mês anterior"
            color={color}
          />
          <ResumeCard
            title="Maior registro"
            value={formatCurrency(getTotalFromRecord(highest))}
            date={formatDate(highest.date)}
            color={color}
          />
          <ResumeCard
            title="Total acumulado"
            value={formatCurrency(accumulated)}
            date={`últimos ${sorted.length} meses`}
            color={color}
          />
        </div>
        <div className="charts">
          <span className="charts-title">Evolução Mensal - {label}</span>
          <TaxChart taxes={taxes} field="simple" color={color} />
        </div>
        <div className="table-wrapper">
          <div className="table-header">
            <span className="table-title">Histórico de Registros</span>
            <button className="default new-register">+ Novo Registro</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                {taxFields.map((field) => (
                  <th key={field}>{field.toUpperCase().replace("_", "/")}</th>
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
                    <td className="td-date">{formatDate(tax.date)}</td>
                    {taxFields.map((field) => (
                      <td key={field}>
                        {tax[field] != null ? formatCurrency(tax[field]) : "—"}
                      </td>
                    ))}
                    <td className="td-total">{formatCurrency(total)}</td>
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
      </section>
    </div>
  );
}
