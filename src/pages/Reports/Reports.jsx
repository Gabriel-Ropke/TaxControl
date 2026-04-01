import { useEffect, useRef, useState, useMemo } from "react";
import { PageWithSidebar } from "../../components/PageWithSidebar/PageWithSidebar";
import { Chart } from "chart.js/auto";
import { generateColor } from "../../utils/generateColor";
import {
  FIELD_LABELS,
  getMonthOptionsFromTaxes,
  getTotalFromRecord,
} from "../../utils/taxUtils";
import { formatBRL, formatBRLCompact, getInitials } from "../../utils/formatters";
import { useCompaniesAndTaxes } from "../../hooks/useCompaniesAndTaxes";
import "./reports.css";
import { useNavigate } from "react-router-dom";

const DISCREPANCY_THRESHOLD = 15;

export function Reports() {
  const navigate = useNavigate();
  const { companies, taxes, loading } = useCompaniesAndTaxes();
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  const [activeField, setActiveField] = useState("simple");

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const scrollerRef = useRef(null);

  const availableMonths = useMemo(
    () => getMonthOptionsFromTaxes(taxes, { style: "short" }),
    [taxes],
  );

  // Inicializa no mês mais recente quando os dados chegarem
  useEffect(() => {
    if (availableMonths.length > 0) {
      setActiveMonthIdx(availableMonths.length - 1);
    }
  }, [availableMonths.length]);

  // ─── Dados computados para o mês ativo ───────────────────────────────────────

  const { discrepancies, missingCompanies, companyTotals, accumulated } =
    useMemo(() => {
      if (!companies.length || !taxes.length || !availableMonths.length) {
        return {
          discrepancies: [],
          missingCompanies: [],
          companyTotals: [],
          accumulated: [],
        };
      }

      const currentDate = availableMonths[activeMonthIdx]?.date;
      const previousDate = availableMonths[activeMonthIdx - 1]?.date;

      // Total de cada empresa no mês ativo
      const companyTotals = companies.map((company) => {
        const currentRecord = taxes.find(
          (t) => t.company_id === company.id && t.date === currentDate,
        );
        const previousRecord = previousDate
          ? taxes.find(
              (t) => t.company_id === company.id && t.date === previousDate,
            )
          : null;

        const currentTotal = getTotalFromRecord(currentRecord);
        const previousTotal = getTotalFromRecord(previousRecord);
        const variation =
          previousTotal > 0
            ? ((currentTotal - previousTotal) / previousTotal) * 100
            : null;

        return {
          company,
          currentRecord,
          currentTotal,
          previousTotal,
          variation,
        };
      });

      // Discrepâncias — variação acima do threshold
      const discrepancies = companyTotals
        .filter(
          (c) =>
            c.variation !== null &&
            Math.abs(c.variation) >= DISCREPANCY_THRESHOLD,
        )
        .sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation));

      // Empresas sem registro no mês ativo
      const missingCompanies = companyTotals.filter(
        (c) => c.currentTotal === 0,
      );

      // Ranking acumulado de todos os meses
      const accumulated = companies
        .map((company) => {
          const total = taxes
            .filter((t) => t.company_id === company.id)
            .reduce((sum, t) => sum + getTotalFromRecord(t), 0);
          return { company, total };
        })
        .sort((a, b) => b.total - a.total);

      return { discrepancies, missingCompanies, companyTotals, accumulated };
    }, [companies, taxes, availableMonths, activeMonthIdx]);

  // ─── Gráfico comparativo ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!chartRef.current || !companyTotals.length) return;

    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: companyTotals.map((c) => c.company.name),
        datasets: [
          {
            data: companyTotals.map((c) => c.currentRecord?.[activeField] ?? 0),
            backgroundColor: companyTotals.map((c) => {
              const value = c.currentRecord?.[activeField] ?? 0;
              return value > 0
                ? generateColor(c.company.name).color
                : "#2a2a2a";
            }),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) =>
                formatBRL(item.raw),
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#444",
              font: { size: 11 },
              callback: (v) => {
                const currency = localStorage.getItem("currency") || "BRL";
                const symbols = { BRL: "R$", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
                return (symbols[currency] || "R$") + (v / 1000).toFixed(0) + "k";
              },
            },
            grid: { color: "#1a1a1a" },
            border: { display: false },
          },
          y: {
            ticks: { color: "#888", font: { size: 11 } },
            grid: { display: false },
            border: { display: false },
          },
        },
        animation: { duration: 500, easing: "easeInOutQuart" },
      },
    });

    return () => chartInstance.current?.destroy();
  }, [companyTotals, activeField]);

  // ─── Scroll do seletor de mês ─────────────────────────────────────────────────

  const handleMonthSelect = (idx) => {
    setActiveMonthIdx(idx);
    const items = scrollerRef.current?.querySelectorAll(".month-item");
    items?.[idx]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const handleScrollerWheel = (e) => {
    e.preventDefault();
    const next =
      e.deltaY > 0
        ? Math.min(activeMonthIdx + 1, availableMonths.length - 1)
        : Math.max(activeMonthIdx - 1, 0);
    if (next !== activeMonthIdx) handleMonthSelect(next);
  };

  // ─── Ranking ─────────────────────────────────────────────────────────────────

  const maxAccumulated = accumulated[0]?.total ?? 1;

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <span className="loading">Carregando...</span>;

  return (
    <PageWithSidebar>
      <div id="reportsContainer">
        {/* Header */}
        <header className="reports-header">
          <div>
            <h1>Relatórios</h1>
            <p>Análise comparativa e detecção de anomalias</p>
          </div>
        </header>

        {/* Seletor de mês */}
        <div className="month-scroller-wrap">
          <div
            className="month-scroller"
            ref={scrollerRef}
            onWheel={handleScrollerWheel}
          >
            {availableMonths.map((month, idx) => {
              const diff = Math.abs(idx - activeMonthIdx);
              const className =
                diff === 0
                  ? "month-item active"
                  : diff === 1
                    ? "month-item near"
                    : "month-item";
              return (
                <span
                  key={month.date}
                  className={className}
                  onClick={() => handleMonthSelect(idx)}
                >
                  {month.label}
                </span>
              );
            })}
          </div>
          <div className="scroller-dots">
            {availableMonths.map((_, idx) => (
              <span
                key={idx}
                className={`scroller-dot ${idx === activeMonthIdx ? "active" : ""}`}
                onClick={() => handleMonthSelect(idx)}
              />
            ))}
          </div>
        </div>

        <div className="divider">
          <span className="divider-label">Anomalias do período</span>
        </div>

        {/* Cards de anomalias */}
        <div className="anomaly-cards-container">
          {/* Discrepâncias */}
          <div className="anomaly-card discrepancy">
            <div className="anomaly-card-header">
              <span className="anomaly-title">Discrepâncias</span>
              <span className="tag tag-danger">
                {discrepancies.length} encontrada
                {discrepancies.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="anomaly-list">
              {discrepancies.length > 0 ? (
                discrepancies.map(({ company, variation }) => {
                  const { color } = generateColor(company.name);
                  const isHigh = Math.abs(variation) > 20;
                  return (
                    <li
                      key={company.id}
                      className={`anomaly-item ${isHigh ? "danger" : "warn"}`}
                      onClick={() => navigate(`/enterprise/${company.id}`)}
                    >
                      <div
                        className="anomaly-avatar"
                        style={{ background: color + "22", color }}
                      >
                        {getInitials(company.name)}
                      </div>
                      <div className="anomaly-info">
                        <span className="anomaly-name">{company.name}</span>
                        <span className="anomaly-meta">
                          {availableMonths[activeMonthIdx - 1]?.label} →{" "}
                          {availableMonths[activeMonthIdx]?.label}
                        </span>
                      </div>
                      <span
                        className={`anomaly-badge ${isHigh ? "danger" : "warn"}`}
                      >
                        {variation > 0 ? "+" : ""}
                        {variation.toFixed(1)}%
                      </span>
                    </li>
                  );
                })
              ) : (
                <p className="empty">
                  {activeMonthIdx === 0
                    ? "Selecione um mês com histórico anterior"
                    : "Nenhuma discrepância encontrada"}
                </p>
              )}
            </ul>
          </div>

          {/* Sem registro */}
          <div className="anomaly-card no-register">
            <div className="anomaly-card-header">
              <span className="anomaly-title">Sem registro</span>
              <span className="tag tag-neutral">
                {missingCompanies.length} empresa
                {missingCompanies.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ul className="anomaly-list">
              {missingCompanies.length > 0 ? (
                missingCompanies.map(({ company }) => {
                  const { color } = generateColor(company.name);
                  return (
                    <li
                      key={company.id}
                      className="anomaly-item missing"
                      onClick={() => navigate(`/enterprise/${company.id}`)}
                    >
                      <div
                        className="anomaly-avatar"
                        style={{ background: color + "22", color }}
                      >
                        {getInitials(company.name)}
                      </div>
                      <div className="anomaly-info">
                        <span className="anomaly-name">{company.name}</span>
                        <span className="anomaly-meta">
                          nenhum valor registrado
                        </span>
                      </div>
                      <span className="tag tag-danger">Sem registro</span>
                    </li>
                  );
                })
              ) : (
                <p className="empty">
                  Todas as empresas têm registro neste mês
                </p>
              )}
            </ul>
          </div>
        </div>

        <div className="divider">
          <div className="divider-line" />
          <span className="divider-label">Comparativo</span>
          <div className="divider-line" />
        </div>

        {/* Gráfico e ranking */}
        <div className="charts-grid">
          {/* Gráfico comparativo */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">
                  Comparativo — {FIELD_LABELS[activeField]}
                </h2>
                <p className="chart-sub">
                  {availableMonths[activeMonthIdx]?.label}
                </p>
              </div>
              <select
                className="field-select"
                value={activeField}
                onChange={(e) => setActiveField(e.target.value)}
              >
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="chart-wrap">
              <canvas ref={chartRef} />
            </div>
          </div>

          {/* Ranking */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Ranking acumulado</h2>
                <p className="chart-sub">total de todos os meses</p>
              </div>
            </div>
            <div className="rank-list">
              {accumulated.map(({ company, total }, idx) => {
                const { color } = generateColor(company.name);
                return (
                  <div key={company.id} className="rank-item">
                    <span className="rank-pos">{idx + 1}</span>
                    <div className="rank-info">
                      <div className="rank-name-row">
                        <span className="rank-name">{company.name}</span>
                        <span className="rank-value">
                          {formatBRLCompact(total)}
                        </span>
                      </div>
                      <div className="rank-bar-wrap">
                        <div
                          className="rank-bar"
                          style={{
                            width: `${Math.round((total / maxAccumulated) * 100)}%`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageWithSidebar>
  );
}
