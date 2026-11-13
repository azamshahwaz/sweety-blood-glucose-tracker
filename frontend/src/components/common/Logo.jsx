import { Droplet } from 'lucide-react';

export default function Logo({ light = false, size = 'md', showTagline = false }) {
  const big = size === 'lg';
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid place-items-center rounded-xl ${big ? 'h-11 w-11' : 'h-9 w-9'} ${light ? 'bg-white/10 text-mint' : 'bg-primary text-white shadow-sm shadow-primary/30'}`}>
        <Droplet className={big ? 'h-6 w-6' : 'h-5 w-5'} fill="currentColor" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className={`block font-extrabold ${big ? 'text-3xl' : 'text-xl'} ${light ? 'text-white' : 'text-primary'}`}>Sweety</span>
        {showTagline && <span className="block text-xs text-muted">Blood Glucose Tracker</span>}
      </span>
    </div>
  );
}
