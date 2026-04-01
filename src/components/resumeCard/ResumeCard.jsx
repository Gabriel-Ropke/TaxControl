import "./resumeCard.css";

export function ResumeCard({ title, value, percent, date, color, valueColor, clickable, active, onClick }) {
  const isPositive = percent > 0;

  return (
    <div
      className={`card ${color ? "card--highlight" : ""} ${clickable ? "clickable" : ""} ${active ? "active" : ""}`}
      style={color ? { borderTopColor: color } : {}}
      onClick={onClick}
    >
      <span className="title">{title}</span>
      <span
        className={`value ${valueColor ? "colored" : ""}`}
        style={valueColor ? { color: valueColor } : {}}
      >
        {value}
      </span>

      {percent != null && (
        <span className={`alert ${percent >= 0 ? "positive" : "negative"}`}>
          {percent >= 0 ? "+" : ""}
          {Math.abs(percent).toFixed(1)}% {date}
        </span>
      )}

      {date && percent == null && <span className="alert colored" style={valueColor ? { color: valueColor } : {}}>{date}</span>}
    </div>
  );
}
