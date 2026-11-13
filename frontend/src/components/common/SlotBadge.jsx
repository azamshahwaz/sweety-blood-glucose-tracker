
import { slotMeta } from '../../utils/constants';

export default function SlotBadge({ slot }) {
  const { label, badge, Icon } = slotMeta(slot);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${badge}`}
    >
      <Icon
        className="h-3.5 w-3.5 shrink-0"
        strokeWidth={2}
        aria-hidden="true"
      />

      {label}
    </span>
  );
}
