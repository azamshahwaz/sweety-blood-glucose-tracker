import { Droplet, Coffee, Utensils, Moon } from 'lucide-react';

export const GLUCOSE_MIN = 40;
export const GLUCOSE_MAX = 600;
export const MAX_READINGS_PER_DAY = 4;

export const SLOTS = [
  { value: 'MORNING_FASTING', label: 'Morning (Fasting)', short: 'Morning', messageLabel: 'Morning fasting', color: '#3B82F6', badge: 'bg-blue-50 text-blue-700', Icon: Droplet },
  { value: 'AFTER_BREAKFAST', label: 'After Breakfast', short: 'Breakfast', messageLabel: 'After breakfast', color: '#22C55E', badge: 'bg-green-50 text-green-700', Icon: Coffee },
  { value: 'AFTER_LUNCH', label: 'After Lunch', short: 'Lunch', messageLabel: 'After lunch', color: '#F59E0B', badge: 'bg-amber-50 text-amber-700', Icon: Utensils },
  { value: 'AFTER_DINNER', label: 'After Dinner', short: 'Dinner', messageLabel: 'After dinner', color: '#8B5CF6', badge: 'bg-violet-50 text-violet-700', Icon: Moon },
];

export const slotMeta = (value) => SLOTS.find((s) => s.value === value) || SLOTS[0];
