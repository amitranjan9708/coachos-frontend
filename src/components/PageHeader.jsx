import React from "react";

export function PageHeader({ eyebrow, title, subtitle, actions, testId }) {
  return (
    <div data-testid={testId} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        {eyebrow && <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">{eyebrow}</div>}
        <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tighter text-slate-950 leading-none">{title}</h1>
        {subtitle && <p className="text-slate-600 mt-3 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KpiCard({ label, value, hint, accent = "slate", testId }) {
  const accentMap = {
    blue: "border-l-blue-700",
    emerald: "border-l-emerald-600",
    amber: "border-l-amber-500",
    red: "border-l-red-600",
    slate: "border-l-slate-900",
    violet: "border-l-violet-600",
  };
  return (
    <div data-testid={testId} className={`swiss-card p-6 border-l-4 ${accentMap[accent]}`}>
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="metric-number text-4xl sm:text-5xl mt-3 text-slate-950">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-2">{hint}</div>}
    </div>
  );
}

export function Section({ title, action, children }) {
  return (
    <section className="swiss-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="border border-dashed border-slate-300 p-10 text-center">
      <div className="font-display text-lg font-semibold text-slate-800">{title}</div>
      {hint && <div className="text-sm text-slate-500 mt-1">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
