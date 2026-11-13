import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListOrdered, FileBarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { dashboardApi } from '../api';
import { currentMonthLocal, getGreeting, todayLocal } from '../utils/date';
import SummaryCards from '../components/dashboard/SummaryCards';
import { ChartCard, DailyDistributionChart, SlotDonut, TrendChart } from '../components/dashboard/Charts';
import ReadingsTable from '../components/readings/ReadingsTable';
import ReadingFormModal from '../components/readings/ReadingFormModal';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlock';
import Button from '../components/common/Button';
import { formatMonth } from '../utils/date';

export default function Dashboard() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonthLocal());
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const summary = useApi(() => dashboardApi.summary(todayLocal(), month).then((r) => r.data), [month]);
  const trends = useApi(() => dashboardApi.trends(month).then((r) => r.data), [month]);
  const refresh = () => {
    summary.reload();
    trends.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {user.name} <span aria-hidden="true">👋</span></h1>
          <p className="text-sm text-muted">Here&apos;s an overview of your glucose tracking.</p>
        </div>
        <input type="month" aria-label="Select month" value={month} max={currentMonthLocal()} onChange={(e) => e.target.value && setMonth(e.target.value)} className="field-input !w-auto" />
      </div>

      {summary.loading && !summary.data ? <LoadingBlock label="Loading your overview…" /> : summary.error ? <ErrorBlock message={summary.error} onRetry={refresh} /> : (
        <SummaryCards summary={summary.data} />
      )}

      {trends.error ? <ErrorBlock message={trends.error} onRetry={refresh} /> : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title={`Glucose Trend – ${formatMonth(month)}`} subtitle="Daily average (mg/dl)" className="lg:col-span-2">
              {trends.loading && !trends.data ? <LoadingBlock /> : <TrendChart data={trends.data?.dailyTrend} />}
            </ChartCard>
            <ChartCard title="Readings by Time Slot" subtitle={formatMonth(month)}>
              {trends.loading && !trends.data ? <LoadingBlock /> : <SlotDonut slotCounts={trends.data.slotCounts} total={trends.data.totalReadings} />}
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Daily Reading Distribution" subtitle="Number of readings logged per day" className="lg:col-span-2">
              {trends.loading && !trends.data ? <LoadingBlock /> : <DailyDistributionChart data={trends.data?.readingsPerDay} />}
            </ChartCard>
            <section className="card-sweety p-4 sm:p-5">
              <h3 className="font-semibold">Quick Actions</h3>
              <div className="mt-4 flex flex-col gap-3">
                <Button icon={Plus} onClick={() => setAdding(true)}>Add Reading</Button>
                <Link to="/readings" className="btn-sweety-secondary"><ListOrdered className="h-4 w-4" aria-hidden="true" />View All Readings</Link>
                <Link to="/reports" className="btn-sweety-secondary"><FileBarChart className="h-4 w-4" aria-hidden="true" />View Reports</Link>
              </div>
            </section>
          </div>
        </>
      )}

      <section className="card-sweety p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent Readings</h3>
          <Link to="/readings" className="text-sm font-semibold text-primary hover:underline">View all</Link>
        </div>
        {summary.data ? (
          <ReadingsTable
            readings={summary.data.recent}
            onEdit={setEditing}
            emptyAction={<Button icon={Plus} onClick={() => setAdding(true)}>Add Reading</Button>}
          />
        ) : summary.loading ? <LoadingBlock /> : null}
      </section>

      <ReadingFormModal open={adding || !!editing} reading={editing} onClose={() => { setAdding(false); setEditing(null); }} onSaved={refresh} />
    </div>
  );
}
