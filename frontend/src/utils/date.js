// Dates are handled as 'YYYY-MM-DD' strings and never passed through Date parsing,
// which avoids timezone-related day shifts.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

export function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const currentMonthLocal = () => todayLocal().slice(0, 7);

export function formatDate(value) {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function formatShortDate(value) {
  const [, m, d] = value.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

export function formatMonth(value) {
  if (!value) return '';
  const [y, m] = value.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function getGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
