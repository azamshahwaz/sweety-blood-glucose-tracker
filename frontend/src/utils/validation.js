import { GLUCOSE_MAX, GLUCOSE_MIN, MAX_READINGS_PER_DAY, SLOTS } from './constants';
import { todayLocal } from './date';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Full name is required.';
  else if (name.trim().length > 100) errors.name = 'Full name must be at most 100 characters.';
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

/**
 * Validates the reading form. `otherSlots` = slots already recorded for that date
 * (excluding the reading being edited), used for the duplicate-slot and 4-per-day rules.
 */
export function validateReading({ date, slot, value }, otherSlots = []) {
  const errors = {};
  if (!date) errors.date = 'Please select a date.';
  else if (date > todayLocal()) errors.date = 'Date cannot be in the future.';

  const raw = String(value ?? '').trim();
  if (raw === '') errors.value = 'Please enter a glucose value.';
  else if (!/^\d+$/.test(raw) || Number(raw) < GLUCOSE_MIN || Number(raw) > GLUCOSE_MAX) {
    errors.value = `Value must be a whole number between ${GLUCOSE_MIN} and ${GLUCOSE_MAX} mg/dl.`;
  }

  if (!errors.date) {
    if (otherSlots.length >= MAX_READINGS_PER_DAY) errors.date = `You can add only ${MAX_READINGS_PER_DAY} readings per day.`;
    else if (otherSlots.includes(slot)) {
      const label = SLOTS.find((s) => s.value === slot)?.messageLabel;
      const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
      errors.slot = `You already have ${article} ${label} reading for this date.`;
    }
  }
  return errors;
}
