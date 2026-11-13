import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Delete', loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={loading ? () => {} : onCancel} size="sm">
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
