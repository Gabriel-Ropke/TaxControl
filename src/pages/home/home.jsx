import { useEffect, useState, useMemo } from "react";
import { PageWithSidebar } from "../../components/PageWithSidebar/PageWithSidebar";
import "./home.css";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResumeCard } from "../../components/resumeCard/ResumeCard";
import {
  getMonthOptionsFromTaxes,
  homeTableColumns,
  taxTypeConfig,
  getTotalFromRecord,
} from "../../utils/taxUtils";
import { formatBRL } from "../../utils/formatters";
import { useCompaniesAndTaxes } from "../../hooks/useCompaniesAndTaxes";
import { EnterpriseModal } from "../../components/EnterpriseModal/EnterpriseModal";

export function Home() {
  const navigate = useNavigate();
  const { companies, taxes, loading } = useCompaniesAndTaxes();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [tableFilter, setTableFilter] = useState("with-record");

  const months = useMemo(
    () => getMonthOptionsFromTaxes(taxes, { style: "long" }),
    [taxes],
  );

  useEffect(() => {
    if (!months.length) return;
    setSelectedMonth((prev) => {
      if (prev && months.some((m) => m.date === prev.date)) return prev;
      return months.at(-1) ?? null;
    });
  }, [months]);

  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
    setIsSelectOpen(false);
  };

  const stats = useMemo(() => {
    if (!selectedMonth || loading) return null;

    const currentMonthTaxes = taxes.filter(t => t.date === selectedMonth.date);
    const totalMonth = currentMonthTaxes.reduce((acc, t) => acc + getTotalFromRecord(t), 0);
    const activeCompaniesCount = new Set(currentMonthTaxes.map(t => t.company_id)).size;
    const companiesWithRecord = new Set(currentMonthTaxes.map(t => t.company_id));
    const companiesWithoutRecord = companies.filter(c => !companiesWithRecord.has(c.id)).length;

    // Variação e Discrepâncias
    // Encontrar mês anterior
    const currentIdx = months.findIndex(m => m.date === selectedMonth.date);
    const prevMonth = currentIdx > 0 ? months[currentIdx - 1] : null;
    
    let totalVariation = null;
    let discrepancies = 0;

    if (prevMonth) {
      const prevMonthTaxes = taxes.filter(t => t.date === prevMonth.date);
      const totalPrev = prevMonthTaxes.reduce((acc, t) => acc + getTotalFromRecord(t), 0);
      
      if (totalPrev > 0) {
        totalVariation = ((totalMonth - totalPrev) / totalPrev) * 100;
      }

      // Discrepâncias (> 15% individual)
      companies.forEach(company => {
        const currRecord = currentMonthTaxes.find(t => String(t.company_id) === String(company.id));
        const prevRecord = prevMonthTaxes.find(t => String(t.company_id) === String(company.id));
        
        if (currRecord && prevRecord) {
          const vCurr = getTotalFromRecord(currRecord);
          const vPrev = getTotalFromRecord(prevRecord);
          if (vPrev > 0) {
            const diff = Math.abs((vCurr - vPrev) / vPrev);
            if (diff > 0.15) discrepancies++;
          }
        }
      });
    }

    return {
      totalMonth,
      activeCompaniesCount,
      companiesWithoutRecord,
      totalVariation,
      discrepancies,
      prevMonthLabel: prevMonth ? prevMonth.label.toLowerCase() : ""
    };
  }, [selectedMonth, taxes, companies, months, loading]);

  const companiesWithRecord = useMemo(() => {
    if (!selectedMonth) return { withRecord: [], withoutRecord: [] };
    const companiesWithRecordSet = new Set(
      taxes.filter(t => t.date === selectedMonth.date).map(t => t.company_id)
    );
    return {
      withRecord: companies.filter(c => companiesWithRecordSet.has(c.id)),
      withoutRecord: companies.filter(c => !companiesWithRecordSet.has(c.id))
    };
  }, [selectedMonth, taxes, companies]);

  if (loading) return <span>Carregando...</span>;
  const s = stats;

  return (
    <PageWithSidebar>
      <section id="homeContainer">
        <header>
          <span className="header-title">Visão Geral</span>
          <div className="select-custom">
            <div
              className="select-trigger"
              onClick={() => setIsSelectOpen((prev) => !prev)}
            >
              <span>{selectedMonth?.label ?? "Selecione um mês"}</span>
              <ChevronDown size={24} className={isSelectOpen ? "open" : ""} />
            </div>
            <div className="wrapper">
              <ul role="listbox" className={isSelectOpen ? "open" : ""}>
                {months.map((month) => (
                  <li
                    key={month.date}
                    role="option"
                    className={
                      selectedMonth?.date === month.date ? "active" : ""
                    }
                    onClick={() => handleSelectMonth(month)}
                  >
                    <span>{month.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button 
            className="default add-enterprise"
            onClick={() => setIsEnterpriseModalOpen(true)}
          >
            + Adicionar Empresa
          </button>
        </header>
        <div className="general-container">
          <div className="resume-cards">
            <ResumeCard
              title="Total do mês"
              value={formatBRL(s?.totalMonth)}
              percent={s?.totalVariation}
              date={s?.prevMonthLabel ? `vs ${s.prevMonthLabel}` : ""}
            />
            <ResumeCard
              title="Empresas ativas"
              value={s?.activeCompaniesCount || "0"}
              date="cadastradas"
              clickable
              active={tableFilter === "with-record"}
              onClick={() => setTableFilter("with-record")}
            />
            <ResumeCard
              title="Sem registro"
              value={s?.companiesWithoutRecord || "0"}
              date="no mês"
              valueColor={s?.companiesWithoutRecord > 0 ? "var(--negative-color)" : undefined}
              clickable
              active={tableFilter === "without-record"}
              onClick={() => setTableFilter("without-record")}
            />
            <ResumeCard
              title="Discrepâncias"
              value={s?.discrepancies || "0"}
              date="variação acima de 15%"
              valueColor={s?.discrepancies > 0 ? "var(--negative-color)" : undefined}
            />
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {homeTableColumns.map(({ key, label }) => (
                    <th key={key}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tableFilter === "with-record" ? companiesWithRecord.withRecord : companiesWithRecord.withoutRecord).map((company) => {
                  const tax = taxes.find(
                    (t) =>
                      t.company_id === company.id &&
                      t.date === selectedMonth?.date,
                  );
                  return (
                    <tr key={company.id}>
                      {homeTableColumns.map(({ key }) => (
                        <td key={key}>
                          {key === "tax_type" ? (
                            <span
                              className={
                                taxTypeConfig[company.tax_type]?.badge ?? ""
                              }
                            >
                              {taxTypeConfig[company.tax_type]?.label}
                            </span>
                          ) : key === "name" ? (
                            <span
                              onClick={() =>
                                navigate(`/enterprise/${company.id}`)
                              }
                            >
                              {company.name}
                            </span>
                          ) : (
                            formatBRL(tax?.[key])
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <EnterpriseModal
        isOpen={isEnterpriseModalOpen}
        onClose={() => setIsEnterpriseModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </PageWithSidebar>
  );
}
