
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

import { formatDate } from '../../utils/date';
import { SLOTS } from '../../utils/constants';

const STATUS_STYLE = {
  green:
    'border-emerald-200 bg-emerald-50 text-emerald-700',

  orange:
    'border-amber-200 bg-amber-50 text-amber-700',

  red:
    'border-rose-200 bg-rose-50 text-rose-700',
};

const BAR_STYLE = {
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  red: 'bg-rose-500',
};

const ICONS = {
  CheckCircle,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
};

export function markerPercent(value, scale) {
  if (
    !scale ||
    !Number.isFinite(Number(value)) ||
    scale.max <= scale.min
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      ((Number(value) - scale.min) /
        (scale.max - scale.min)) *
        100
    )
  );
}

function StatusBadge({ interpretation }) {
  const Icon = ICONS[interpretation.icon];

  if (!Icon || !STATUS_STYLE[interpretation.color]) {
    return (
      <span className="text-sm font-semibold text-base-content">
        {interpretation.label || 'Reading type unavailable'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_STYLE[interpretation.color]}`}
    >
      <Icon
        className="h-3.5 w-3.5 shrink-0"
        strokeWidth={2}
        aria-hidden="true"
      />

      <span>{interpretation.label}</span>
    </span>
  );
}

function RangeIndicator({ interpretation, value }) {
  const scale = interpretation.range_scale;

  if (!scale?.segments?.length) return null;

  const position = markerPercent(value, scale);

  const thresholdLabels = [
    ...new Set([
      scale.min,
      ...scale.segments.map((s) => s.to),
      scale.max,
    ]),
  ];

  return (
    <figure
      className="mt-5"
      aria-label={`Reference range indicator for ${interpretation.reading_type}`}
    >
      <div className="relative px-0 pb-7 pt-7">
        <div
          className="flex h-3.5 overflow-hidden rounded-full ring-1 ring-black/10"
          aria-hidden="true"
        >
          {scale.segments.map((segment, index) => (
            <div
              key={`${segment.from}-${segment.to}-${index}`}
              className={
                BAR_STYLE[
                  segment.status === 'NORMAL'
                    ? 'green'
                    : ['LOW', 'MODERATE'].includes(segment.status)
                      ? 'orange'
                      : 'red'
                ]
              }
              style={{
                width: `${
                  ((segment.to - segment.from) /
                    (scale.max - scale.min)) *
                  100
                }%`,
              }}
            />
          ))}
        </div>

        <div
          className="absolute top-0 -translate-x-1/2 text-xs font-bold"
          style={{ left: `${position}%` }}
        >
          <span className="whitespace-nowrap rounded bg-base-100 px-1.5 py-0.5 shadow-sm">
            {value} mg/dL
          </span>
        </div>

        <div
          className={`absolute top-6 h-7 w-0.5 ${BAR_STYLE[interpretation.color]}`}
          style={{
            left: `${position}%`,
            transform:
              position === 0
                ? 'none'
                : position === 100
                  ? 'translateX(-100%)'
                  : 'translateX(-50%)',
          }}
          aria-hidden="true"
        />

        <div
          className="absolute inset-x-0 top-[3.25rem] h-5"
          aria-hidden="true"
        >
          {thresholdLabels.map((threshold, index) => {
            const pct = markerPercent(threshold, scale);

            const transform =
              pct === 0
                ? 'translateX(0)'
                : pct === 100
                  ? 'translateX(-100%)'
                  : 'translateX(-50%)';

            return (
              <span
                key={`${threshold}-${index}`}
                className="absolute text-[9px] leading-none text-base-content sm:text-[10px]"
                style={{
                  left: `${pct}%`,
                  transform,
                }}
              >
                {threshold}
              </span>
            );
          })}
        </div>
      </div>

      <figcaption
        className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted"
        aria-label="Reference range categories"
      >
        {scale.segments.map((segment, index) => (
          <span
            key={`${segment.status}-${index}`}
            className="inline-flex items-center gap-1"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                BAR_STYLE[
                  segment.status === 'NORMAL'
                    ? 'green'
                    : ['LOW', 'MODERATE'].includes(segment.status)
                      ? 'orange'
                      : 'red'
                ]
              }`}
              aria-hidden="true"
            />

            {segment.status.replace('_', ' ')}
          </span>
        ))}
      </figcaption>

      <p className="mt-2 text-[11px] text-muted">
        Scale: {scale.min}–{scale.max} {scale.unit}; readings above{' '}
        {scale.max} appear at the scale end.
      </p>
    </figure>
  );
}

export default function GlucoseInterpretation({
  reading,
  interpretation = reading?.interpretation,
  compact = false,
}) {
  if (!interpretation) return null;

  const slot = SLOTS.find(
    (item) => item.value === reading?.time_slot
  );

  if (
    interpretation.status === 'READING_TYPE_UNAVAILABLE' ||
    !slot
  ) {
    return (
      <p className="text-sm font-medium text-base-content">
        Reading type unavailable
      </p>
    );
  }

  if (compact) {
    return <StatusBadge interpretation={interpretation} />;
  }

  const value = Number(reading?.glucose_value);
  const validValue = Number.isFinite(value);

  return (
    <section
      className="card-sweety p-4 sm:p-5"
      aria-label="Glucose interpretation"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Glucose interpretation
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tabular-nums">
              {reading?.glucose_value ?? '—'}
            </span>

            <span className="text-sm font-semibold text-muted">
              mg/dL
            </span>
          </div>

          <p className="mt-1 text-sm font-medium">
            {slot.label}
          </p>

          {reading?.reading_date && (
            <p className="text-xs text-muted">
              {formatDate(reading.reading_date)}
            </p>
          )}
        </div>

        <StatusBadge interpretation={interpretation} />
      </div>

      <div className="mt-4 rounded-xl border border-base-300 bg-base-200/70 p-3">
        <p className="text-sm">
          <span className="font-semibold">
            {interpretation.reading_type} reference:
          </span>{' '}
          {interpretation.reference_range || 'Unavailable'}
        </p>

        <p className="mt-1 text-sm">
          {interpretation.explanation}
        </p>

        {interpretation.timing_verified === false && (
          <p className="mt-1 text-xs text-muted">
            The selected slot identifies the general comparison;
            actual time since food is not verified.
          </p>
        )}
      </div>

      {validValue && (
        <RangeIndicator
          interpretation={interpretation}
          value={value}
        />
      )}

      <p className="mt-4 border-t border-base-300 pt-3 text-xs leading-relaxed text-muted">
        {interpretation.disclaimer}
      </p>
    </section>
  );
}
