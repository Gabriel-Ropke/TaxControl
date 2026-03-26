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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

export function TaxChart({ taxes, color }) {
  const sorted = [...taxes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const toHsla = (hsl, alpha) =>
    hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);
  const labels = sorted.map((t) =>
    new Date(t.date).toLocaleString("pt-BR", {
      month: "short",
      year: "2-digit",
    }),
  );

  const values = sorted.map((t) => getTotalFromRecord(t));

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
              ? new Date(sorted[items[0].dataIndex].date).toLocaleString(
                  "pt-BR",
                  {
                    month: "short",
                    year: "2-digit",
                  },
                )
              : "",
          label: (item) =>
            `R$ ${item.raw.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
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
          maxTicksLimit: 6, // <- limita a quantidade de ticks
          callback: (value) => `R$${(value / 1000).toFixed(1)}k`,
        },
      },
    },
  };

  return (
    <div style={{ width: "95%", height: "85%" }}>
      {" "}
      {/* <- controla o tamanho aqui */}
      <Line key={color} data={data} options={options} />
    </div>
  );
}
