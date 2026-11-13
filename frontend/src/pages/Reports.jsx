import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import useApi from '../hooks/useApi';
import { reportsApi } from '../api';
import { todayLocal } from '../utils/date';
import ReportView from '../components/reports/ReportView';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlock';
import Button from '../components/common/Button';

const TABS = [
  { id: 'daily', label: 'Daily Report', fetch: reportsApi.daily },
  { id: 'month-to-date', label: 'Month-to-Date', fetch: reportsApi.monthToDate },
  { id: 'monthly', label: 'Monthly (Previous Month)', fetch: reportsApi.monthly },
];

export default function Reports() {
  const [tab, setTab] = useState('daily');
  const [dateInput, setDateInput] = useState(todayLocal());
  const [date, setDate] = useState(todayLocal());

  const active = TABS.find((t) => t.id === tab);
  const { data, loading, error, reload } = useApi(() => active.fetch(date).then((r) => r.data), [tab, date]);

  const generate = () => {
    if (!dateInput) return;
    if (dateInput === date) reload();
    else setDate(dateInput);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted">View daily, month-to-date and monthly reports.</p>
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-white text-muted ring-1 ring-base-300 hover:text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-sweety flex flex-wrap items-end gap-3 p-4">
        <div>
          <label htmlFor="report-date" className="mb-1 block text-sm font-medium">Select Date</label>
          <input id="report-date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="field-input !w-auto" />
        </div>
        <Button icon={RefreshCw} onClick={generate} loading={loading} disabled={!dateInput}>Generate Report</Button>
      </div>

      {loading && !data ? <LoadingBlock label="Generating report…" /> : error ? <ErrorBlock message={error} onRetry={reload} /> : data ? (
        <ReportView tab={tab} selectedDate={date} report={data} />
      ) : null}
    </div>
  );
}
