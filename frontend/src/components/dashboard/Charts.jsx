import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { slotMeta } from '../../utils/constants';
import { formatDate, formatShortDate } from '../../utils/date';

const AXIS = { fontSize: 11, fill: '#64748B' };
const TOOLTIP_STYLE = { borderRadius: 12, border: '1px solid #DDEAE8', boxShadow: '0 4px 16px rgba(23,59,58,0.08)', fontSize: 12 };

export function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card-sweety p-4 sm:p-5 ${className}`}>
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ChartEmpty({ message = 'No readings to chart yet.' }) {
  return <div className="grid h-56 place-items-center text-sm text-muted" data-testid="chart-empty">{message}</div>;
}

// Average glucose per day (line/area) - used by dashboard trend and month-to-date report.
export function TrendChart({ data, height = 260 }) {
  if (!data?.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5EFED" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={AXIS} tickLine={false} axisLine={false} minTickGap={18} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[(min) => Math.max(0, Math.floor((min - 20) / 10) * 10), (max) => Math.ceil((max + 20) / 10) * 10]} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDate} formatter={(v) => [`${v} mg/dl`, 'Average']} />
        <Area type="monotone" dataKey="average" name="Average" stroke="#0D9488" strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: '#0D9488' }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Reading count by time slot (donut).
export function SlotDonut({ slotCounts, total }) {
  if (!total) return <ChartEmpty />;
  const data = slotCounts.map((s) => ({ name: slotMeta(s.time_slot).label, value: s.count, color: slotMeta(s.time_slot).color }));
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={2} stroke="none">
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v} readings`, n]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[98px] -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-2xl font-extrabold leading-none">{total}</p>
        <p className="text-[11px] text-muted">Readings</p>
      </div>
    </div>
  );
}

// Number of readings logged each day.
export function DailyDistributionChart({ data }) {
  if (!data?.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5EFED" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={AXIS} tickLine={false} axisLine={false} minTickGap={18} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDate} formatter={(v) => [`${v} readings`, 'Logged']} cursor={{ fill: 'rgba(13,148,136,0.06)' }} />
        <Bar dataKey="count" name="Readings" fill="#14B8A6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Average glucose per day as bars - used by the previous-month report.
export function DailyAverageBars({ data }) {
  if (!data?.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5EFED" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(d) => String(Number(d.slice(8)))} tick={AXIS} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={formatDate} formatter={(v) => [`${v} mg/dl`, 'Average']} cursor={{ fill: 'rgba(13,148,136,0.06)' }} />
        <Bar dataKey="average" name="Average" fill="#14B8A6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
