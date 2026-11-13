const tones = {
  green: 'border-green-200 bg-green-50 text-green-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  orange: 'border-orange-200 bg-orange-50 text-orange-900',
  red: 'border-red-200 bg-red-50 text-red-900',
  'dark-red': 'border-red-900 bg-red-100 text-red-950',
  neutral: 'border-base-300 bg-base-200 text-base-content',
};

export default function Interpretation({ value, compact = false }) {
  if (!value) return null;
  return (
    <section className={`rounded-xl border p-3 ${tones[value.color] || tones.neutral}`} aria-label={`Glucose interpretation: ${value.label}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>{value.label}</strong>
        {value.reference_range && <span className="text-sm">Reference: {value.reference_range}</span>}
      </div>
      <p className="mt-1 text-sm">{value.explanation}</p>
      {!compact && <p className="mt-2 text-xs">{value.disclaimer}</p>}
    </section>
  );
}
