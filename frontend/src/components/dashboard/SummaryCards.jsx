import { Droplet, ArrowUp, ArrowDown, Sigma } from 'lucide-react';
import StatCard from '../common/StatCard';
import { MAX_READINGS_PER_DAY } from '../../utils/constants';

const show = (v) => (v === null || v === undefined ? '—' : v);

export default function SummaryCards({ summary }) {
  const { today, stats } = summary;
  const unit = stats.total ? 'mg/dl' : undefined;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={Droplet} label="Today's Readings" value={`${today.count} / ${MAX_READINGS_PER_DAY}`} />
      <StatCard icon={ArrowUp} label="Highest Reading" value={show(stats.highest)} unit={unit} tone="bg-rose-50 text-rose-600" />
      <StatCard icon={ArrowDown} label="Lowest Reading" value={show(stats.lowest)} unit={unit} tone="bg-sky-50 text-sky-600" />
      <StatCard icon={Sigma} label="Average Glucose" value={show(stats.average)} unit={unit} tone="bg-amber-50 text-amber-600" />
    </div>
  );
}
