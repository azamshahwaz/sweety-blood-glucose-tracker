const VARIANTS = {
  primary: 'btn-sweety',
  secondary: 'btn-sweety-secondary',
  danger: 'btn-sweety-danger',
};

// Consistent button with loading state. `icon` is an optional lucide component.
export default function Button({ variant = 'primary', loading = false, icon: Icon, children, className = '', disabled, type = 'button', ...rest }) {
  return (
    <button type={type} className={`${VARIANTS[variant]} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function IconButton({ label, icon: Icon, tone = 'default', onClick, disabled }) {
  const tones = { default: 'text-primary hover:bg-primary/10', danger: 'text-error hover:bg-red-50' };
  return (
    <span className="tooltip tooltip-left" data-tip={label}>
      <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={`btn btn-ghost btn-sm btn-square ${tones[tone]}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </span>
  );
}
