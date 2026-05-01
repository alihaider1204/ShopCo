import React from 'react';
import '../../styles/admin-loader.css';
const SrOnly = ({ children }) => <span className="admin-loader-sr">{children}</span>;

function LoaderRings() {
  return (
    <div className="admin-loader-rings" aria-hidden>
      <div className="admin-loader-ring admin-loader-ring--outer" />
      <div className="admin-loader-ring admin-loader-ring--inner" />
    </div>
  );
}

/** Full dashboard-shaped skeleton (overview tab) */
export function AdminLoaderDashboard() {
  return (
    <div className="admin-loader-dash" role="status" aria-live="polite">
      <SrOnly>Loading dashboard</SrOnly>
      <div className="admin-loader-dash-intro">
        <div className="admin-loader-shimmer admin-loader-shimmer--lg" />
        <div className="admin-loader-shimmer admin-loader-shimmer--md" />
      </div>
      <div className="admin-loader-dash-kpis">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-loader-dash-card">
            <div className="admin-loader-shimmer admin-loader-shimmer--xs" />
            <div className="admin-loader-shimmer admin-loader-shimmer--xl" />
            <div className="admin-loader-shimmer admin-loader-shimmer--sm" />
          </div>
        ))}
      </div>
      <div className="admin-loader-dash-pills">
        <div className="admin-loader-shimmer admin-loader-shimmer--pill" />
        <div className="admin-loader-shimmer admin-loader-shimmer--pill" />
      </div>
      <div className="admin-loader-dash-charts">
        <div className="admin-loader-dash-chart">
          <div className="admin-loader-shimmer admin-loader-shimmer--title" />
          <div className="admin-loader-shimmer admin-loader-shimmer--chart" />
        </div>
        <div className="admin-loader-dash-chart">
          <div className="admin-loader-shimmer admin-loader-shimmer--title" />
          <div className="admin-loader-shimmer admin-loader-shimmer--chart" />
        </div>
      </div>
      <div className="admin-loader-dash-brand">
        <LoaderRings />
      </div>
    </div>
  );
}

/** Table / list placeholder with optional faux toolbar */
export function AdminLoaderTable({ rows = 8, columns = 6, showToolbar = true }) {
  const colKeys = Array.from({ length: columns }, (_, i) => i);
  return (
    <div className="admin-loader-table-wrap" role="status" aria-live="polite">
      <SrOnly>Loading table</SrOnly>
      {showToolbar ? (
        <div className="admin-loader-table-toolbar">
          <div className="admin-loader-shimmer admin-loader-shimmer--pill admin-loader-shimmer--pill-wide" />
          <div className="admin-loader-shimmer admin-loader-shimmer--pill" />
          <div className="admin-loader-shimmer admin-loader-shimmer--pill" />
        </div>
      ) : null}
      <div className="admin-loader-table-card">
        <div className="admin-loader-table-head">
          {colKeys.map((i) => (
            <div key={i} className="admin-loader-shimmer admin-loader-shimmer--cell" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="admin-loader-table-row">
            {colKeys.map((j) => (
              <div key={j} className="admin-loader-shimmer admin-loader-shimmer--cell admin-loader-shimmer--cell-sm" />
            ))}
          </div>
        ))}
      </div>
      <div className="admin-loader-table-footer">
        <LoaderRings />
      </div>
    </div>
  );
}

/** Centered loader for forms / full-page fetches */
export function AdminLoaderPanel() {
  return (
    <div className="admin-loader-panel" role="status" aria-live="polite">
      <SrOnly>Loading</SrOnly>
      <div className="admin-loader-panel-inner">
        <LoaderRings />
        <div className="admin-loader-panel-bars" aria-hidden>
          <span className="admin-loader-bar" style={{ animationDelay: '0ms' }} />
          <span className="admin-loader-bar" style={{ animationDelay: '120ms' }} />
          <span className="admin-loader-bar" style={{ animationDelay: '240ms' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {'dashboard' | 'table' | 'panel'} variant
 */
export default function AdminLoader({ variant = 'panel', tableRows, tableColumns, showTableToolbar }) {
  if (variant === 'dashboard') return <AdminLoaderDashboard />;
  if (variant === 'table')
    return (
      <AdminLoaderTable
        rows={tableRows ?? 8}
        columns={tableColumns ?? 6}
        showToolbar={showTableToolbar ?? true}
      />
    );
  return <AdminLoaderPanel />;
}
