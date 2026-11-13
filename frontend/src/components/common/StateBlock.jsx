import Button from './Button';

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-muted" role="status" aria-live="polite">
      <span className="loading loading-spinner text-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" role="alert">
      <p className="text-sm text-error">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry} className="btn-sm">Try again</Button>}
    </div>
  );
}
