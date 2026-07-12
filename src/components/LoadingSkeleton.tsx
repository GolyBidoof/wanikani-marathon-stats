export default function LoadingSkeleton() {
  return (
    <div
      className="loading-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading statistics"
    >
      <div className="skeleton-block skeleton-search" aria-hidden="true" />

      <div className="skeleton-panel" aria-hidden="true">
        <div className="skeleton-line skeleton-line-short" />
        <div className="skeleton-row">
          <div className="skeleton-block skeleton-pills" />
          <div className="skeleton-block skeleton-buttons" />
        </div>
      </div>

      <div className="skeleton-block skeleton-customizer-bar" aria-hidden="true" />

      <div className="skeleton-block skeleton-card" aria-hidden="true">
        <div className="skeleton-card-center">
          <div className="skeleton-line skeleton-line-time" />
          <div className="skeleton-line skeleton-line-sub" />
        </div>
      </div>

      <div className="skeleton-panel skeleton-chart" aria-hidden="true">
        <div className="skeleton-row skeleton-chart-tabs">
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
        </div>
        <div className="skeleton-block skeleton-chart-area" />
      </div>
    </div>
  );
}
