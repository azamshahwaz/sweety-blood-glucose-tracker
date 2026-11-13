import { CheckCircle2, Droplet } from 'lucide-react';
import Logo from '../common/Logo';

const POINTS = ['Log up to 4 readings daily', 'View daily & monthly reports', 'Track trends with charts'];

function Glucometer() {
  return (
    <div className="relative mx-auto h-44 w-28 rounded-[1.6rem] bg-primary p-3 shadow-xl shadow-primary/30" aria-hidden="true">
      <div className="rounded-xl bg-mint/90 px-2 py-3 text-center text-ink">
        <p className="text-3xl font-extrabold leading-none">105</p>
        <p className="text-[10px] font-medium">mg/dl</p>
      </div>
      <div className="mx-auto mt-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white">
        <Droplet className="h-5 w-5" fill="currentColor" />
      </div>
    </div>
  );
}

export default function AuthShell({ heading, description, showPoints = false, children }) {
  return (
    <div className="grid min-h-screen bg-gradient-to-br from-mint/40 via-base-200 to-white lg:grid-cols-2">
      <section className="hidden flex-col justify-center gap-6 px-12 py-10 lg:flex xl:px-20">
        <Logo size="lg" showTagline />
        <h1 className="max-w-md text-4xl font-extrabold leading-tight text-ink xl:text-5xl">{heading}</h1>
        <p className="max-w-sm text-muted">{description}</p>
        {showPoints && (
          <ul className="space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        )}
        <Glucometer />
      </section>
      <section className="flex flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 lg:hidden"><Logo size="lg" showTagline /></div>
        <div className="card-sweety w-full max-w-md p-6 sm:p-8">{children}</div>
      </section>
    </div>
  );
}
