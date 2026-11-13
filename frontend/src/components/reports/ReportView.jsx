
import {
  CalendarDays,
  ArrowUp,
  ArrowDown,
  Sigma,
  FileBarChart
} from 'lucide-react';

import StatCard from '../common/StatCard';
import EmptyState from '../common/EmptyState';
import SlotBadge from '../common/SlotBadge';

import {
  ChartCard,
  DailyAverageBars,
  TrendChart
} from '../dashboard/Charts';

import { formatDate } from '../../utils/date';
import Interpretation from '../readings/Interpretation';

// Safe value formatter
const show = (v) =>
  v === null || v === undefined ? '—' : v;

// Report statistics
export function ReportStats({ stats = {} }) {
  const total = stats.total ?? 0;
  const unit = total > 0 ? 'mg/dl' : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

      <StatCard
        icon={CalendarDays}
        label="Readings"
        value={total}
      />

      <StatCard
        icon={ArrowUp}
        label="Highest"
        value={show(stats.highest)}
        unit={unit}
        tone="bg-rose-50 text-rose-600"
      />

      <StatCard
        icon={ArrowDown}
        label="Lowest"
        value={show(stats.lowest)}
        unit={unit}
        tone="bg-sky-50 text-sky-600"
      />

      <StatCard
        icon={Sigma}
        label="Average"
        value={show(stats.average)}
        unit={unit}
        tone="bg-amber-50 text-amber-600"
      />

    </div>
  );
}

// Empty report state
const EmptyReport = () => (
  <div className="card-sweety">
    <EmptyState
      icon={FileBarChart}
      title="No readings for this period"
      description="Once you add readings that fall in this date range, your report will appear here."
    />
  </div>
);

// Main Report View
export default function ReportView({
  tab,
  selectedDate,
  report
}) {

  // Handle missing report data
  if (!report || typeof report !== 'object') {
    return (
      <div className="card-sweety p-6 text-center">
        <p className="text-sm text-muted">
          Report data is unavailable. Please try again.
        </p>
      </div>
    );
  }

  // Safely normalize API response
  const stats = report.stats ?? {};

  const readings = Array.isArray(report.readings)
    ? report.readings
    : [];

  const dailyAverages = Array.isArray(report.dailyAverages)
    ? report.dailyAverages
    : [];

  const range = report.range ?? {};

  const isEmpty =
    report.isEmpty === true ||
    (report.isEmpty !== false && (stats.total ?? 0) === 0);

  // Empty report
  if (isEmpty) {
    return (
      <div className="space-y-4">
        <Meta
          tab={tab}
          selectedDate={selectedDate}
          range={range}
        />

        <ReportStats stats={stats} />

        <EmptyReport />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Report metadata */}
      <Meta
        tab={tab}
        selectedDate={selectedDate}
        range={range}
      />

      {/* Summary cards */}
      <ReportStats stats={stats} />

      {/* Daily Report */}
      {tab === 'daily' && (
        <section className="card-sweety p-4 sm:p-5">

          <h3 className="mb-2 font-semibold">
            Readings on {formatDate(selectedDate)}
          </h3>

          {readings.length > 0 ? (
            <div className="overflow-x-auto">

              <table className="table">

                <thead>
                  <tr className="text-xs uppercase text-muted">
                    <th>Time Slot</th>
                    <th>Glucose Value (mg/dl)</th>
                    <th>Interpretation</th>
                  </tr>
                </thead>

                <tbody>
                  {readings.map((r) => (
                    <tr key={r.id}>

                      <td>
                        <SlotBadge slot={r.time_slot} />
                      </td>

                      <td className="font-semibold">
                        {r.glucose_value}
                      </td>
                      <td className="min-w-56">
                        <Interpretation value={r.interpretation} compact />
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          ) : (
            <p className="py-4 text-sm text-muted">
              No readings available for this date.
            </p>
          )}

        </section>
      )}

      {/* Month-to-Date Report */}
      {tab === 'month-to-date' && (
        <ChartCard
          title="Readings Trend (Month-to-Date)"
          subtitle="Daily average (mg/dl)"
        >
          {dailyAverages.length > 0 ? (
            <TrendChart data={dailyAverages} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              No trend data available for this period.
            </p>
          )}
        </ChartCard>
      )}

      {/* Previous Month Report */}
      {tab === 'monthly' && (
        <ChartCard
          title={`Average Glucose by Day – ${
            range.from ? formatDate(range.from).slice(2) : 'Previous Month'
          }`}
          subtitle="Daily average (mg/dl)"
        >
          {dailyAverages.length > 0 ? (
            <DailyAverageBars data={dailyAverages} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              No daily average data available for this period.
            </p>
          )}
        </ChartCard>
      )}

    </div>
  );
}

// Report metadata
function Meta({ tab, selectedDate, range = {} }) {

  if (tab === 'daily') return null;

  return (
    <p className="text-sm text-muted">

      {tab === 'month-to-date' ? (
        <>
          Selected date:{' '}
          <b className="text-base-content">
            {formatDate(selectedDate)}
          </b>

          {range.from && range.to && (
            <>
              {' '}· Date range:{' '}
              <b className="text-base-content">
                {formatDate(range.from)} – {formatDate(range.to)}
              </b>
            </>
          )}
        </>
      ) : (
        <>
          Report period:{' '}

          <b className="text-base-content">
            {range.from && range.to
              ? `${formatDate(range.from)} – ${formatDate(range.to)}`
              : 'Previous Month'}
          </b>
        </>
      )}

    </p>
  );
}
