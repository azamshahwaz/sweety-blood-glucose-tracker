
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserRound,
  Activity,
  Droplet,
  ClipboardList,
} from 'lucide-react';

import useApi from '../hooks/useApi';
import { doctorApi } from '../api';
import { todayLocal } from '../utils/date';

import ReportView from '../components/reports/ReportView';
import SlotBadge from '../components/common/SlotBadge';
import GlucoseInterpretation from '../components/readings/GlucoseInterpretation';

import {
  ErrorBlock,
  LoadingBlock,
} from '../components/common/StateBlock';

const REPORTS = [
  { id: 'daily', label: 'Daily' },
  { id: 'mtd', label: 'Month to date' },
  { id: 'monthly', label: 'Previous month' },
];

const getPayload = (response) =>
  response?.data?.data ?? response?.data ?? {};

const getReadingDate = (value) => {
  if (!value) return '—';
  return value;
};

export default function DoctorPatient() {
  const { patientId } = useParams();

  const [date, setDate] = useState(todayLocal());
  const [tab, setTab] = useState('daily');
  const [historyPage, setHistoryPage] = useState(1);

  // Reading history API
  const history = useApi(
    () =>
      doctorApi.readings(patientId, {
        page: historyPage,
        limit: 20,
      }),
    [patientId, historyPage]
  );

  // Patient reports API
  const report = useApi(
    () =>
      doctorApi[
        tab === 'daily'
          ? 'daily'
          : tab === 'mtd'
            ? 'monthToDate'
            : 'monthly'
      ](patientId, date),
    [patientId, tab, date]
  );

  // Safely handle API response structure
  const historyData = getPayload(history.data);
  const reportData = getPayload(report.data);

  const readings = Array.isArray(historyData.readings)
    ? historyData.readings
    : [];

  const pagination = historyData.pagination ?? {};
  const totalPages = pagination.totalPages ?? 0;

  const patient =
    reportData.patient ??
    historyData.patient ??
    null;

  const reportContent = reportData.report;

  const patientInitial = patient?.name
    ? patient.name.charAt(0).toUpperCase()
    : 'P';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">

      {/* Back navigation */}
      <Link
        to="/doctor"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:gap-3"
      >
        <ArrowLeft size={17} />
        Assigned patients
      </Link>

      {/* Loading and error states */}
      {history.loading && !history.data ? (
        <LoadingBlock />
      ) : history.error ? (
        <ErrorBlock
          message={history.error}
          onRetry={history.reload}
        />
      ) : (
        <>
          {/* Patient profile header */}
          <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">

            <div className="h-2 bg-primary" />

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">

              <div className="flex min-w-0 items-center gap-4">

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">
                    {patientInitial}
                  </span>
                </div>

                <div className="min-w-0">

                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                    {patient?.name || 'Patient details'}
                  </h1>

                  <p className="mt-1 truncate text-sm text-muted">
                    {patient?.email || 'Patient record'}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={14} />
                      Read-only access
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-base-content/70">
                      <UserRound size={13} />
                      Patient
                    </span>

                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-200/50 px-4 py-3">

                <Activity className="text-primary" size={20} />

                <div>
                  <p className="text-xs text-muted">
                    Medical record
                  </p>

                  <p className="text-sm font-semibold">
                    Patient overview
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* Reading history */}
          <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">

            {/* Section header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-5 py-5 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Droplet size={21} />
                </div>

                <div>
                  <h2 className="font-bold">
                    Reading history
                  </h2>

                  <p className="mt-0.5 text-xs text-muted">
                    Patient glucose records
                  </p>
                </div>

              </div>

              <span className="rounded-full bg-base-200 px-3 py-1 text-xs font-medium text-muted">
                {readings.length} records on this page
              </span>

            </div>

            {/* Reading table */}
            {history.loading ? (
              <div className="p-6">
                <LoadingBlock label="Loading reading history…" />
              </div>
            ) : readings.length > 0 ? (
              <>

                <div className="overflow-x-auto">

                  <table className="table w-full">

                    <thead>
                      <tr className="bg-base-200/60 text-xs uppercase tracking-wide text-muted">
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Time slot</th>
                        <th className="px-5 py-4">Glucose value</th>
                        <th className="px-5 py-4">Interpretation</th>
                      </tr>
                    </thead>

                    <tbody>
                      {readings.map((r) => (

                        <tr
                          key={r.id}
                          className="border-b border-base-200 transition hover:bg-base-200/40"
                        >

                          {/* Date */}
                          <td className="whitespace-nowrap px-5 py-4 text-sm">
                            {getReadingDate(r.reading_date)}
                          </td>

                          {/* Shared time slot badge */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <SlotBadge slot={r.time_slot} />
                          </td>

                          {/* Glucose value */}
                          <td className="whitespace-nowrap px-5 py-4">

                            <span className="font-semibold tabular-nums">
                              {r.glucose_value}
                            </span>

                            <span className="ml-1 text-xs text-muted">
                              mg/dL
                            </span>

                          </td>

                          {/* Shared interpretation badge */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <GlucoseInterpretation
                              reading={r}
                              compact
                            />
                          </td>

                        </tr>

                      ))}
                    </tbody>

                  </table>

                </div>

                {/* Pagination */}
                {totalPages > 1 && (

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 px-5 py-4 sm:px-6">

                    <p className="text-sm text-muted">
                      Page{' '}
                      <span className="font-semibold text-base-content">
                        {historyPage}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-base-content">
                        {totalPages}
                      </span>
                    </p>

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        className="btn btn-sm btn-outline gap-1"
                        disabled={
                          historyPage <= 1 || history.loading
                        }
                        onClick={() =>
                          setHistoryPage((p) => p - 1)
                        }
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-primary gap-1"
                        disabled={
                          historyPage >= totalPages ||
                          history.loading
                        }
                        onClick={() =>
                          setHistoryPage((p) => p + 1)
                        }
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>

                    </div>

                  </div>

                )}

              </>
            ) : (

              /* Empty state */
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center">

                <div className="mb-3 rounded-2xl bg-base-200 p-4 text-muted">
                  <ClipboardList size={28} />
                </div>

                <h3 className="font-semibold">
                  No readings available
                </h3>

                <p className="mt-1 max-w-sm text-sm text-muted">
                  No glucose readings have been recorded for this patient yet.
                </p>

              </div>

            )}

          </section>

          {/* Patient reports */}
          <section className="space-y-5">

            {/* Report heading and date selector */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <CalendarDays
                    size={21}
                    className="text-primary"
                  />

                  <h2 className="text-lg font-bold">
                    Patient reports
                  </h2>

                </div>

                <p className="mt-1 text-sm text-muted">
                  Review glucose summaries for selected periods.
                </p>

              </div>

              <label className="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-3 py-2.5 shadow-sm">

                <span className="text-sm font-medium text-muted">
                  Date
                </span>

                <input
                  aria-label="Report date"
                  type="date"
                  value={date}
                  onChange={(e) =>
                    e.target.value && setDate(e.target.value)
                  }
                  className="max-w-[155px] bg-transparent text-sm font-medium outline-none"
                />

              </label>

            </div>

            {/* Report tabs */}
            <div
              role="tablist"
              aria-label="Patient report period"
              className="flex flex-wrap gap-2 rounded-xl border border-base-300 bg-base-100 p-2 shadow-sm"
            >

              {REPORTS.map((r) => (

                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === r.id}
                  onClick={() => setTab(r.id)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    tab === r.id
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-muted hover:bg-base-200 hover:text-base-content'
                  }`}
                >
                  {r.label}
                </button>

              ))}

            </div>

            {/* Report content */}
            <div className="min-w-0">

              {report.loading && !report.data ? (

                <LoadingBlock label="Loading patient report…" />

              ) : report.error ? (

                <ErrorBlock
                  message={report.error}
                  onRetry={report.reload}
                />

              ) : reportContent ? (

                <ReportView
                  tab={
                    tab === 'mtd'
                      ? 'month-to-date'
                      : tab === 'monthly'
                        ? 'monthly'
                        : 'daily'
                  }
                  selectedDate={date}
                  report={reportContent}
                />

              ) : (

                !report.loading && (

                  <div className="rounded-2xl border border-base-300 bg-base-100 px-5 py-10 text-center">

                    <ClipboardList
                      size={28}
                      className="mx-auto mb-3 text-muted"
                    />

                    <p className="font-semibold">
                      No report data available
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      No report information is available for this period.
                    </p>

                  </div>

                )

              )}

            </div>

          </section>
        </>
      )}
    </div>
  );
}
