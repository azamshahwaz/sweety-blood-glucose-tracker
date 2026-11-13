import { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useApi from '../hooks/useApi';
import { readingsApi } from '../api';
import { getErrorMessage } from '../api/client';
import { currentMonthLocal } from '../utils/date';
import ReadingsTable from '../components/readings/ReadingsTable';
import ReadingFormModal from '../components/readings/ReadingFormModal';
import ConfirmModal from '../components/common/ConfirmModal';
import { ErrorBlock, LoadingBlock } from '../components/common/StateBlock';
import Button from '../components/common/Button';

const PAGE_SIZE = 10;

export default function Readings() {
  const [month, setMonth] = useState(currentMonthLocal());
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, loading, error, reload } = useApi(
    () => readingsApi.list({ month: month || undefined, search: search || undefined, page, limit: PAGE_SIZE }).then((r) => r.data),
    [month, search, page]
  );

  const pagination = data?.pagination;
  const hasFilters = !!(month || search);

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await readingsApi.remove(deleting.id);
      toast.success('Reading deleted successfully');
      setDeleting(null);
      if (data.readings.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const from = pagination && pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const to = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Readings</h1>
          <p className="text-sm text-muted">View, edit and manage your blood glucose readings.</p>
        </div>
        <Button icon={Plus} onClick={openAdd}>Add Reading</Button>
      </div>

      <section className="card-sweety p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <input type="month" aria-label="Filter by month" value={month} max={currentMonthLocal()} onChange={(e) => { setMonth(e.target.value); setPage(1); }} className="field-input !w-auto" />
            {month && <button type="button" className="btn btn-ghost btn-sm text-primary" onClick={() => { setMonth(''); setPage(1); }}>All dates</button>}
          </div>
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" aria-label="Search readings" placeholder="Search by date or slot…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="field-input pl-9" />
          </label>
        </div>

        {loading && !data ? <LoadingBlock label="Loading readings…" /> : error ? <ErrorBlock message={error} onRetry={reload} /> : (
          <div className={loading ? 'opacity-60 transition-opacity' : ''}>
            <ReadingsTable
              readings={data.readings}
              onEdit={(r) => { setEditing(r); setFormOpen(true); }}
              onDelete={setDeleting}
              emptyDescription={hasFilters ? 'No readings match your filters. Try a different month or search.' : undefined}
              emptyAction={<Button icon={Plus} onClick={openAdd}>Add Reading</Button>}
            />
            {pagination.total > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                <span>Showing {from}–{to} of {pagination.total} readings</span>
                <div className="join">
                  <button type="button" className="btn btn-sm join-item" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
                  <span className="btn btn-sm btn-primary join-item no-animation pointer-events-none">{page} / {pagination.totalPages}</span>
                  <button type="button" className="btn btn-sm join-item" aria-label="Next page" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <ReadingFormModal open={formOpen} reading={editing} onClose={() => setFormOpen(false)} onSaved={reload} />
      <ConfirmModal
        open={!!deleting}
        title="Delete reading?"
        message="This reading will be permanently removed. This action cannot be undone."
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
