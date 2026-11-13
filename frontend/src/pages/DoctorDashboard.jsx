
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import useApi from '../hooks/useApi';
import { doctorApi } from '../api';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlock';
import EmptyState from '../components/common/EmptyState';

export default function DoctorDashboard() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const result = useApi(
    () => doctorApi.patients({ search, page, limit: 20 }),
    [search, page]
  );

  // Handle the standard sendSuccess response wrapper.
  const responseData = result.data?.data ?? result.data ?? {};

  const patients = Array.isArray(responseData.patients)
    ? responseData.patients
    : [];

  const pagination = responseData.pagination ?? {};
  const total = pagination.total ?? 0;
  const totalPages = pagination.totalPages ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
          <p className="text-sm text-muted">
            Read-only overview of your assigned patients.
          </p>
        </div>

        <div className="stat rounded-xl bg-white shadow-sm">
          <div className="stat-title">Assigned patients</div>
          <div className="stat-value text-primary">
            {result.loading && !result.data ? '—' : total}
          </div>
        </div>
      </div>

      <label className="input input-bordered flex max-w-md items-center gap-2 bg-white">
        <Search className="h-4 w-4 text-muted" />
        <input
          aria-label="Search patients"
          className="grow"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </label>

      {result.loading && !result.data ? (
        <LoadingBlock label="Loading assigned patients…" />
      ) : result.error ? (
        <ErrorBlock message={result.error} onRetry={result.reload} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No matching patients' : 'No patients assigned'}
          description={
            search
              ? 'Try another name or email.'
              : 'An administrator can assign patients to your account.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((p) => (
            <Link
              key={p.id}
              to={`/doctor/patients/${p.id}`}
              className="card-sweety block p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{p.name}</h2>
                  <p className="text-sm text-muted">{p.email}</p>
                </div>

                {p.interpretation && (
                  <span
                    className={`badge ${
                      p.interpretation.color === 'green'
                        ? 'badge-success'
                        : p.interpretation.color === 'orange'
                          ? 'badge-warning'
                          : 'badge-error'
                    }`}
                  >
                    {p.interpretation.status}
                  </span>
                )}
              </div>

              <div className="mt-5 border-t border-base-300 pt-4 text-sm">
                <p className="font-medium">
                  Latest reading:{' '}
                  {p.latest_glucose == null
                    ? 'No readings yet'
                    : `${p.latest_glucose} mg/dL`}
                </p>

                {p.latest_date && (
                  <p className="mt-1 text-muted">
                    {p.latest_date} · {p.interpretation?.reading_type}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((v) => v - 1)}
          >
            Previous
          </button>

          <span className="self-center text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            className="btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((v) => v + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
