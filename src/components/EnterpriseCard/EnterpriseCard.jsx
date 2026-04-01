import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Chart } from "chart.js/auto";
import "./enterprisecard.css";
import { useNavigate } from "react-router-dom";
import { generateColor } from "../../utils/generateColor";
import { getTotalFromRecord, taxTypeConfig } from "../../utils/taxUtils";
import { formatMonthShortPt, getInitials, formatBRL } from "../../utils/formatters";

export function EnterpriseCard({ empresa, taxes }) {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const { color, alphaColor, elementAlphaColor } = generateColor(empresa.name);

  const orderedRegister = taxes
    .filter((t) => t.company_id === empresa.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const historico = orderedRegister.map((t) => getTotalFromRecord(t));

  const ultimo = orderedRegister.at(-1);
  const penultimo = orderedRegister.at(-2);
  const totalAtual = historico.at(-1) ?? 0;
  const totalAnterior = historico.at(-2) ?? 0;
  const variacao =
    totalAnterior > 0
      ? (((totalAtual - totalAnterior) / totalAnterior) * 100).toFixed(1)
      : null;

  const labelMes = (registro) => {
    if (!registro) return "—";
    return formatMonthShortPt(registro.date);
  };

  const taxLabel = taxTypeConfig[empresa.tax_type]?.label ?? "";

  useEffect(() => {
    if (!chartRef.current || historico.length === 0) return;

    const chart = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: orderedRegister.map((t) => labelMes(t)),
        datasets: [
          {
            data: historico,
            borderColor: color,
            backgroundColor: alphaColor,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: "#1a1a1a",
            borderColor: color,
            borderWidth: 1,
            titleColor: color,
            bodyColor: "#fff",
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (items) =>
                orderedRegister[items[0].dataIndex]
                  ? labelMes(orderedRegister[items[0].dataIndex])
                  : "",
              label: (item) =>
                formatBRL(item.raw),
            },
          },
        },
        scales: { x: { display: false }, y: { display: false } },
      },
    });

    return () => chart.destroy();
  }, [historico.length]);

  return (
    <div
      className="enterprise"
      onClick={() => navigate(`/enterprise/${empresa.id}`)}
      style={{
        "--enterprise-color": color,
        "--enterprise-alpha-color": elementAlphaColor,
      }}
    >
      <div className="top">
        <div className="name">
          <span className="enterprise-letter">{getInitials(empresa.name)}</span>
          <span className="enterprise-name">{empresa.name}</span>
          <span className="enterprise-tax">{taxLabel}</span>
        </div>
        <div className="value">
          <span className="date">{labelMes(ultimo)}</span>
          <span className="total-value">
            {totalAtual > 0
              ? formatBRL(totalAtual)
              : "—"}
          </span>
          <span
            className={`value-change ${variacao > 0 ? "negative" : "positive"}`}
          >
            {variacao
              ? `${variacao > 0 ? "+" : ""}${variacao}% vs ${labelMes(penultimo)}`
              : "—"}
          </span>
        </div>
      </div>
      <div className="charts">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="bottom">
        <span className="last-register">
          Último registro: {labelMes(ultimo)}
        </span>
        <ArrowRight />
      </div>
    </div>
  );
}
