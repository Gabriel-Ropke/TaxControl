import React from "react";
import "./Skeleton.css";

export function SkeletonLoader({ type = "table", count = 3 }) {
  if (type === "table") {
    return (
      <div className="skeleton-container table-skeleton">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-row">
            <div className="skeleton-box w-1/4"></div>
            <div className="skeleton-box w-1/4"></div>
            <div className="skeleton-box w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="skeleton-container card-skeleton">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card">
            <div className="skeleton-circle"></div>
            <div className="skeleton-box w-3/4"></div>
            <div className="skeleton-box w-1/2 mt-2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-box default-skeleton"></div>
  );
}
