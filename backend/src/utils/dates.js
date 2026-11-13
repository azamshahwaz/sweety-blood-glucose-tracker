// All dates are plain 'YYYY-MM-DD' strings. They are never converted to JS Date
// objects in local time, which avoids timezone-related day shifts.
const pad = (n) => String(n).padStart(2, '0');

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isValidMonthString(value) {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function todayInTimezone(timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function lastDayOfMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const firstOfMonth = (dateOrMonth) => `${dateOrMonth.slice(0, 7)}-01`;
const lastOfMonth = (dateOrMonth) => {
  const ym = dateOrMonth.slice(0, 7);
  return `${ym}-${pad(lastDayOfMonth(ym))}`;
};

function previousMonthRange(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const ym = `${py}-${pad(pm)}`;
  return { from: `${ym}-01`, to: `${ym}-${pad(lastDayOfMonth(ym))}` };
}

module.exports = {
  isValidDateString,
  isValidMonthString,
  todayInTimezone,
  firstOfMonth,
  lastOfMonth,
  previousMonthRange,
};
