import { slotMeta } from '../../utils/constants';

export default function SlotBadge({ slot }) {
  const { label, badge, Icon } = slotMeta(slot);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${badge}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
