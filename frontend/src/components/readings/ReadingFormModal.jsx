import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormField from '../common/FormField';
import { readingsApi } from '../../api';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { GLUCOSE_MAX, GLUCOSE_MIN, SLOTS } from '../../utils/constants';
import { todayLocal } from '../../utils/date';
import { validateReading } from '../../utils/validation';
import Interpretation from './Interpretation';

// Reusable Add / Edit modal. Pass `reading` to edit, omit it to add.
export default function ReadingFormModal({ open, reading, onClose, onSaved, defaultDate }) {
  const isEdit = !!reading;
  const [form, setForm] = useState({ date: todayLocal(), slot: SLOTS[0].value, value: '', fasting_confirmed: false, meal_timing_minutes: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dayReadings, setDayReadings] = useState([]);
  const [interpretation, setInterpretation] = useState(null);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError('');
    setSubmitting(false);
    setInterpretation(reading?.interpretation || null);
    setForm(
      reading
        ? { date: reading.reading_date, slot: reading.time_slot, value: String(reading.glucose_value), fasting_confirmed: reading.fasting_confirmed === true, meal_timing_minutes: reading.meal_timing_minutes ?? '' }
        : { date: defaultDate || todayLocal(), slot: SLOTS[0].value, value: '', fasting_confirmed: false, meal_timing_minutes: '' }
    );
  }, [open, reading, defaultDate]);

  useEffect(() => {
    if (!open || !/^\d+$/.test(form.value) || Number(form.value) < GLUCOSE_MIN || Number(form.value) > GLUCOSE_MAX) {
      setInterpretation(null);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(() => readingsApi.interpret({
      glucose_value: Number(form.value), time_slot: form.slot,
      fasting_confirmed: form.slot === 'MORNING_FASTING' ? form.fasting_confirmed : null,
      meal_timing_minutes: form.slot === 'MORNING_FASTING' || form.meal_timing_minutes === '' ? null : Number(form.meal_timing_minutes),
    }).then((res) => active && setInterpretation(res.data.interpretation)).catch(() => active && setInterpretation(null)), 200);
    return () => { active = false; clearTimeout(timer); };
  }, [open, form.value, form.slot, form.fasting_confirmed, form.meal_timing_minutes]);

  // Load the readings already recorded on the selected date (powers the slot overview).
  useEffect(() => {
    if (!open || !form.date || form.date > todayLocal()) {
      setDayReadings([]);
      return undefined;
    }
    let active = true;
    readingsApi
      .list({ date: form.date, limit: 100 })
      .then((res) => active && setDayReadings(res.data.readings))
      .catch(() => active && setDayReadings([]));
    return () => {
      active = false;
    };
  }, [open, form.date]);

  const others = useMemo(() => dayReadings.filter((r) => r.id !== reading?.id), [dayReadings, reading]);
  const recorded = Object.fromEntries(others.map((r) => [r.time_slot, r.glucose_value]));

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions
    const found = validateReading(form, others.map((r) => r.time_slot));
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    const payload = {
      reading_date: form.date, time_slot: form.slot, glucose_value: Number(form.value),
      fasting_confirmed: form.slot === 'MORNING_FASTING' ? form.fasting_confirmed : null,
      meal_timing_minutes: form.slot === 'MORNING_FASTING' || form.meal_timing_minutes === '' ? null : Number(form.meal_timing_minutes),
    };
    try {
      if (isEdit) await readingsApi.update(reading.id, payload);
      else await readingsApi.create(payload);
      toast.success(isEdit ? 'Reading updated successfully' : 'Reading added successfully');
      onSaved?.();
      onClose();
    } catch (err) {
      const server = getFieldErrors(err);
      setErrors({ date: server.reading_date, slot: server.time_slot, value: server.glucose_value, meal_timing_minutes: server.meal_timing_minutes });
      setFormError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={isEdit ? 'Edit Reading' : 'Add Reading'} onClose={submitting ? () => {} : onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && !errors.date && !errors.slot && !errors.value && (
          <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-error">{formError}</div>
        )}

        <FormField id="date" label="Date" error={errors.date}>
          <input id="date" name="date" type="date" max={todayLocal()} value={form.date} onChange={onChange} className={`field-input ${errors.date ? 'input-error' : ''}`} aria-invalid={!!errors.date} />
        </FormField>

        <FormField id="slot" label="Time Slot" error={errors.slot}>
          <select id="slot" name="slot" value={form.slot} onChange={onChange} disabled={isEdit} className={`field-input select select-bordered ${errors.slot ? 'select-error' : ''}`}>
            {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FormField>

        {form.slot === 'MORNING_FASTING' ? (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="fasting_confirmed" checked={form.fasting_confirmed} onChange={(e) => setForm((f) => ({ ...f, fasting_confirmed: e.target.checked }))} className="checkbox checkbox-sm checkbox-primary" />
            <span>Confirm at least 8 hours without caloric intake</span>
          </label>
        ) : (
          <FormField id="meal_timing_minutes" label="Minutes after meal started" error={errors.meal_timing_minutes}>
            <input id="meal_timing_minutes" name="meal_timing_minutes" type="number" min="0" max="1440" step="1" value={form.meal_timing_minutes} onChange={onChange} className={`field-input ${errors.meal_timing_minutes ? 'input-error' : ''}`} placeholder="Enter to confirm timing" aria-invalid={!!errors.meal_timing_minutes} />
            <p className="mt-1 text-xs text-muted">Post-meal reference values apply only at exactly 120 minutes.</p>
          </FormField>
        )}

        <div aria-label="Slots recorded for this date">
          <p className="mb-1.5 text-xs font-medium text-muted">Slots for this date</p>
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map(({ value, short, Icon, color }) => {
              const taken = recorded[value] !== undefined;
              return (
                <div key={value} data-testid={`slot-${value}`} data-taken={taken} className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-xs ${taken ? 'border-primary/30 bg-primary/5' : 'border-dashed border-base-300 text-muted'}`}>
                  <span className="flex items-center gap-1.5 font-medium"><Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden="true" />{short}</span>
                  {taken ? <span className="flex items-center gap-1 font-semibold text-primary"><Check className="h-3 w-3" aria-hidden="true" />{recorded[value]}</span> : <span>Empty</span>}
                </div>
              );
            })}
          </div>
        </div>

        <FormField id="value" label="Glucose Value (mg/dl)" error={errors.value}>
          <div className="relative">
            <input id="value" name="value" type="number" inputMode="numeric" min={GLUCOSE_MIN} max={GLUCOSE_MAX} step="1" placeholder="e.g. 110" value={form.value} onChange={onChange} className={`field-input pr-16 ${errors.value ? 'input-error' : ''}`} aria-invalid={!!errors.value} />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">mg/dl</span>
          </div>
          {!errors.value && <p className="mt-1 text-xs text-muted">Value must be between {GLUCOSE_MIN} and {GLUCOSE_MAX} mg/dl.</p>}
        </FormField>

        {interpretation && <Interpretation value={interpretation} />}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>{isEdit ? 'Update' : 'Add Reading'}</Button>
        </div>
      </form>
    </Modal>
  );
}
