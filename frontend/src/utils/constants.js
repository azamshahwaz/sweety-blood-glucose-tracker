
import { Sun, Coffee, Utensils, Moon } from 'lucide-react';

export const GLUCOSE_MIN = 40;
export const GLUCOSE_MAX = 600;
export const MAX_READINGS_PER_DAY = 4;

export const SLOTS = [
  {
    value: 'MORNING_FASTING',
    label: 'Morning (Fasting)',
    short: 'Morning',
    messageLabel: 'Morning fasting',
    color: '#3B82F6',
    badge: 'bg-blue-50 text-blue-700 border border-blue-100',
    Icon: Sun,
  },
  {
    value: 'AFTER_BREAKFAST',
    label: 'After Breakfast',
    short: 'Breakfast',
    messageLabel: 'After breakfast',
    color: '#22C55E',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    Icon: Coffee,
  },
  {
    value: 'AFTER_LUNCH',
    label: 'After Lunch',
    short: 'Lunch',
    messageLabel: 'After lunch',
    color: '#F59E0B',
    badge: 'bg-orange-50 text-orange-700 border border-orange-100',
    Icon: Utensils,
  },
  {
    value: 'AFTER_DINNER',
    label: 'After Dinner',
    short: 'Dinner',
    messageLabel: 'After dinner',
    color: '#8B5CF6',
    badge: 'bg-purple-50 text-purple-700 border border-purple-100',
    Icon: Moon,
  },
];

export const slotMeta = (value) =>
  SLOTS.find((s) => s.value === value) || SLOTS[0];
