import "./resumeCard.css";

export function ResumeCard({ title, value, percent, date, color, valueColor }) {
  const isPositive = percent > 0;

  return (
    <div
      className={`card ${color ? "card--highlight" : ""}`}
      style={color ? { borderTopColor: color } : {}}
    >
      <span className="title">{title}</span>
      <span
        className={`value ${valueColor ? "colored" : ""}`}
        style={valueColor ? { color: valueColor } : {}}
      >
        {value}
      </span>

      {percent != null && (
        <span className={`alert ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? "+" : ""}
          {percent}% vs mês anterior
        </span>
      )}

      {date && <span className="alert">{date}</span>}
    </div>
  );
}
