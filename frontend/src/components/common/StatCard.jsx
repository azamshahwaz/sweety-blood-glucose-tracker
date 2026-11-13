export default function StatCard({ icon: Icon, label, value, unit, tone = 'text-primary bg-primary/10' }) {
  return (
    <div className="card-sweety flex items-center gap-3 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted">{label}</p>
        <p className="text-xl font-bold leading-tight">
          {value}
          {unit && <span className="ml-1 text-xs font-medium text-muted">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
