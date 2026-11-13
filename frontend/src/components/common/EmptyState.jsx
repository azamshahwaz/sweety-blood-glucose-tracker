import { Droplet } from 'lucide-react';

export default function EmptyState({ title, description, action, icon: Icon = Droplet }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center" data-testid="empty-state">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
