import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Chart } from "chart.js/auto";
import "./enterprisecard.css";
import { useNavigate } from "react-router-dom";
import { generateColor } from "../../utils/generateColor";
const taxFields = [
  "simple",
  "pis",
  "cofins",
  "csll",
  "irpj",
  "iss_icms",
  "efd_reinf",
];

const taxTypeLabel = {
  simple: "Simples",
  presumed: "Presumido",
  simple_payroll: "Simples c/ Folha",
};

export function EnterpriseCard({ empresa, taxes }) {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const { color, alphaColor, elementAlphaColor } = generateColor(empresa.name);

  const orderedRegister = taxes
    .filter((t) => t.company_id === empresa.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const historico = orderedRegister.map((t) =>
    taxFields.reduce((total, field) => total + (t[field] ?? 0), 0),
  );

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
    return new Date(registro.date).toLocaleString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
  };

  const initials = empresa.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
                `R$ ${item.raw.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            },
          },
        },
        scales: { x: { display: false }, y: { display: false } },
      },
    });

    return () => chart.destroy();
  }, [historico.length]); // re-renderiza quando os dados chegarem

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
          <span className="enterprise-letter">{initials}</span>
          <span className="enterprise-name">{empresa.name}</span>
          <span className="enterprise-tax">
            {taxTypeLabel[empresa.tax_type]}
          </span>
        </div>
        <div className="value">
          <span className="date">{labelMes(ultimo)}</span>
          <span className="total-value">
            {totalAtual > 0
              ? `R$ ${totalAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
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
