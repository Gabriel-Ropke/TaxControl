import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import "../MonthMultiPicker/monthMultiPicker.css";
import "./monthSinglePicker.css";

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// value: "YYYY-MM" | onChange: (value: "YYYY-MM") => void
export function MonthSinglePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => {
    if (value) return parseInt(value.split("-")[0]);
    return new Date().getFullYear();
  });
  const ref = useRef(null);

  // Atualiza o ano do picker quando o valor externo mudar
  useEffect(() => {
    if (value) setYear(parseInt(value.split("-")[0]));
  }, [value]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectMonth = (monthIndex) => {
    const newValue = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    onChange(newValue);
    setOpen(false);
  };

  const formatDisplay = (val) => {
    if (!val) return "Selecionar mês";
    const [y, m] = val.split("-");
    return `${MONTHS_FULL[parseInt(m) - 1]} de ${y}`;
  };

  const selectedMonthIndex = value ? parseInt(value.split("-")[1]) - 1 : -1;
  const selectedYear = value ? parseInt(value.split("-")[0]) : null;

  return (
    <div className="month-picker-root single-picker" ref={ref}>
      <button
        className={`single-picker-trigger ${open ? "open" : ""} ${value ? "has-value" : ""}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <Calendar size={16} className="calendar-icon" />
        <span className="single-picker-label">{formatDisplay(value)}</span>
        <ChevronRight size={14} className={`chevron-icon ${open ? "rotated" : ""}`} />
      </button>

      {open && (
        <div className="month-picker-dropdown single-dropdown">
          <div className="picker-year-nav">
            <button type="button" onClick={() => setYear((y) => y - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{year}</span>
            <button type="button" onClick={() => setYear((y) => y + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="picker-months-grid">
            {MONTHS_SHORT.map((name, idx) => {
              const isSelected = idx === selectedMonthIndex && year === selectedYear;
              return (
                <button
                  key={name}
                  type="button"
                  className={`month-chip ${isSelected ? "selected" : ""}`}
                  onClick={() => selectMonth(idx)}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
