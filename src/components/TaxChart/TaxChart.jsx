import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getTotalFromRecord, taxFields } from "../../utils/taxUtils";
import { formatMonthShortPt, formatBRL } from "../../utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

function valueForField(record, field) {
  if (field == null || field === "total") return getTotalFromRecord(record);
  if (!taxFields.includes(field)) return getTotalFromRecord(record);
  return record?.[field] ?? 0;
}

export function TaxChart({ taxes, color, field = "total" }) {
  const sorted = [...taxes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const toHsla = (hsl, alpha) =>
    hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);
  const labels = sorted.map((t) => formatMonthShortPt(t.date));

  const values = sorted.map((t) => valueForField(t, field));

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, toHsla(color, 0.6));
          gradient.addColorStop(1, toHsla(color, 0.05));
          return gradient;
        },
        pointBackgroundColor: color,
        pointRadius: 4,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
            sorted[items[0].dataIndex]
              ? formatMonthShortPt(sorted[items[0].dataIndex].date)
              : "",
          label: (item) =>
            formatBRL(item.raw),
        },
      },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    backgroundColor: "transparent",
    scales: {
      x: {
        grid: { color: "#ffffff11" },
        ticks: { color: "#aaa" },
      },
      y: {
        min: 0,
        grid: { color: "#ffffff11" },
        ticks: {
          color: "#aaa",
          maxTicksLimit: 6,
          callback: (value) => `R$${(value / 1000).toFixed(1)}k`,
        },
      },
    },
  };

  return (
    <div style={{ width: "95%", height: "85%" }}>
      <Line key={`${color}-${field}`} data={data} options={options} />
    </div>
  );
}
