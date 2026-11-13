export default function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200" role="status" aria-live="polite">
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
