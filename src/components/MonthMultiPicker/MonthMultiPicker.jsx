import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import "./monthMultiPicker.css";

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function MonthMultiPicker({ label, selected = [], onChange, singleMode = false }) {
  const [open, setOpen] = useState(false);
  const selectedArr = Array.isArray(selected) ? selected : (selected ? [selected] : []);
  const [year, setYear] = useState(() => {
    if (selectedArr.length > 0) {
      return parseInt(selectedArr[0].split("-")[0]);
    }
    return new Date().getFullYear();
  });
  const ref = useRef(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMonth = (monthIndex) => {
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    if (singleMode) {
      if (selected === key) onChange("");
      else {
        onChange(key);
        setOpen(false);
      }
    } else {
      if (selected.includes(key)) {
        onChange(selected.filter((m) => m !== key));
      } else {
        onChange([...selected, key]);
      }
    }
  };

  const removeMonth = (key, e) => {
    e.stopPropagation();
    if (singleMode) onChange("");
    else onChange(selected.filter((m) => m !== key));
  };

  const formatLabel = (key) => {
    const [y, m] = key.split("-");
    return `${MONTHS_SHORT[parseInt(m) - 1]}/${y.slice(2)}`;
  };

  return (
    <div className="month-picker-root" ref={ref}>
      <button
        className={`month-picker-trigger ${open ? "open" : ""} ${selectedArr.length > 0 ? "has-value" : ""}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="picker-label">{label}</span>
        {selectedArr.length === 0 ? (
          <span className="picker-placeholder">Selecione...</span>
        ) : (
          singleMode ? (
            <span className="picker-count">{formatLabel(selectedArr[0])}</span>
          ) : (
            <span className="picker-count">{selectedArr.length} período{selectedArr.length > 1 ? "s" : ""}</span>
          )
        )}
      </button>

      {/* Tags dos meses selecionados */}
      {!singleMode && selectedArr.length > 0 && (
        <div className="picker-tags">
          {selected.sort().map((key) => (
            <span key={key} className="picker-tag">
              {formatLabel(key)}
              <X size={14} onClick={(e) => removeMonth(key, e)} />
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="month-picker-dropdown">
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
              const key = `${year}-${String(idx + 1).padStart(2, "0")}`;
              const isSelected = selectedArr.includes(key);
              return (
                <button
                  key={name}
                  type="button"
                  className={`month-chip ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleMonth(idx)}
                >
                  {name}
                </button>
              );
            })}
          </div>
          {!singleMode && selectedArr.length > 0 && (
            <button type="button" className="clear-all-btn" onClick={() => onChange([])}>
              Limpar tudo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
