import { CalendarDays, ArrowUp, ArrowDown, Sigma, FileBarChart } from 'lucide-react';
import StatCard from '../common/StatCard';
import EmptyState from '../common/EmptyState';
import SlotBadge from '../common/SlotBadge';
import { ChartCard, DailyAverageBars, TrendChart } from '../dashboard/Charts';
import { formatDate } from '../../utils/date';

const show = (v) => (v === null || v === undefined ? '—' : v);

export function ReportStats({ stats }) {
  const unit = stats.total ? 'mg/dl' : undefined;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={CalendarDays} label="Readings" value={stats.total} />
      <StatCard icon={ArrowUp} label="Highest" value={show(stats.highest)} unit={unit} tone="bg-rose-50 text-rose-600" />
      <StatCard icon={ArrowDown} label="Lowest" value={show(stats.lowest)} unit={unit} tone="bg-sky-50 text-sky-600" />
      <StatCard icon={Sigma} label="Average" value={show(stats.average)} unit={unit} tone="bg-amber-50 text-amber-600" />
    </div>
  );
}

const EmptyReport = () => (
  <div className="card-sweety">
    <EmptyState icon={FileBarChart} title="No readings for this period" description="Once you add readings that fall in this date range, your report will appear here." />
  </div>
);

export default function ReportView({ tab, selectedDate, report }) {
  if (report.isEmpty) {
    return (
      <div className="space-y-4">
        <Meta tab={tab} selectedDate={selectedDate} range={report.range} />
        <EmptyReport />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Meta tab={tab} selectedDate={selectedDate} range={report.range} />
      <ReportStats stats={report.stats} />
      {tab === 'daily' && (
        <section className="card-sweety p-4 sm:p-5">
          <h3 className="mb-2 font-semibold">Readings on {formatDate(selectedDate)}</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr className="text-xs uppercase text-muted"><th>Time Slot</th><th>Glucose Value (mg/dl)</th></tr></thead>
              <tbody>
                {report.readings.map((r) => (
                  <tr key={r.id}><td><SlotBadge slot={r.time_slot} /></td><td className="font-semibold">{r.glucose_value}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === 'month-to-date' && (
        <ChartCard title="Readings Trend (Month-to-Date)" subtitle="Daily average (mg/dl)"><TrendChart data={report.dailyAverages} /></ChartCard>
      )}
      {tab === 'monthly' && (
        <ChartCard title={`Average Glucose by Day – ${formatDate(report.range.from).slice(2)}`} subtitle="Daily average (mg/dl)"><DailyAverageBars data={report.dailyAverages} /></ChartCard>
      )}
    </div>
  );
}

function Meta({ tab, selectedDate, range }) {
  if (tab === 'daily') return null;
  return (
    <p className="text-sm text-muted">
      {tab === 'month-to-date' ? (
        <>Selected date: <b className="text-base-content">{formatDate(selectedDate)}</b> · Date range: <b className="text-base-content">{formatDate(range.from)} – {formatDate(range.to)}</b></>
      ) : (
        <>Report period: <b className="text-base-content">{formatDate(range.from)} – {formatDate(range.to)}</b></>
      )}
    </p>
  );
}
