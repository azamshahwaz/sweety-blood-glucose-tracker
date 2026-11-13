import { Pencil, Trash2, ClipboardList } from 'lucide-react';
import SlotBadge from '../common/SlotBadge';
import EmptyState from '../common/EmptyState';
import { IconButton } from '../common/Button';
import { formatDate } from '../../utils/date';

export default function ReadingsTable({ readings, onEdit, onDelete, emptyAction, emptyDescription }) {
  if (!readings.length) {
    return <EmptyState icon={ClipboardList} title="No readings found" description={emptyDescription || 'Add your first glucose reading to start tracking.'} action={emptyAction} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr className="text-xs uppercase text-muted">
            <th>Date</th>
            <th>Time Slot</th>
            <th>Value (mg/dl)</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.id} className="hover">
              <td className="whitespace-nowrap font-medium">{formatDate(r.reading_date)}</td>
              <td><SlotBadge slot={r.time_slot} /></td>
              <td className="font-semibold">{r.glucose_value}</td>
              <td>
                <div className="flex justify-end gap-1">
                  {onEdit && <IconButton label="Edit reading" icon={Pencil} onClick={() => onEdit(r)} />}
                  {onDelete && <IconButton label="Delete reading" icon={Trash2} tone="danger" onClick={() => onDelete(r)} />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
