import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlucoseInterpretation, { markerPercent } from '../components/readings/GlucoseInterpretation';

const rangeScale = { min: 40, max: 300, unit: 'mg/dL', segments: [
  { from: 40, to: 54, status: 'CRITICAL_LOW' }, { from: 54, to: 70, status: 'LOW' },
  { from: 70, to: 100, status: 'NORMAL' }, { from: 100, to: 126, status: 'MODERATE' },
  { from: 126, to: 250, status: 'HIGH' }, { from: 250, to: 300, status: 'VERY_HIGH' },
] };
const interpretations = {
  NORMAL: { status: 'NORMAL', label: 'Normal', emoji: '😊', icon: 'CheckCircle', color: 'green', reading_type: 'Fasting', reference_range: '70–99 mg/dL', explanation: 'Within the general reference range.', disclaimer: 'Educational reference.', range_scale: rangeScale },
  LOW: { status: 'LOW', label: 'Low', emoji: '⬇️', icon: 'TrendingDown', color: 'orange', reading_type: 'Fasting', reference_range: '54–69 mg/dL', explanation: 'Below the general reference range.', disclaimer: 'Educational reference.', range_scale: rangeScale },
  MODERATE: { status: 'MODERATE', label: 'Moderate', emoji: '⚠️', icon: 'AlertTriangle', color: 'orange', reading_type: 'Fasting', reference_range: '100–125 mg/dL', explanation: 'Above the normal range.', disclaimer: 'Educational reference.', range_scale: rangeScale },
  CRITICAL_LOW: { status: 'CRITICAL_LOW', label: 'Critical Low', emoji: '🚨', icon: 'AlertCircle', color: 'red', reading_type: 'Fasting', reference_range: '<54 mg/dL', explanation: 'Critically low.', disclaimer: 'Educational reference.', range_scale: rangeScale },
  HIGH: { status: 'HIGH', label: 'High', emoji: '🔺', icon: 'TrendingUp', color: 'red', reading_type: 'Fasting', reference_range: '126–249 mg/dL', explanation: 'Above the general reference range.', disclaimer: 'Educational reference.', range_scale: rangeScale },
  VERY_HIGH: { status: 'VERY_HIGH', label: 'Very High', emoji: '🚨', icon: 'AlertCircle', color: 'red', reading_type: 'Fasting', reference_range: '≥250 mg/dL', explanation: 'Very high.', disclaimer: 'Educational reference.', range_scale: rangeScale },
};

describe('GlucoseInterpretation', () => {
  test.each(Object.entries(interpretations))('renders %s with its shared three-colour badge', (_status, interpretation) => {
    const { container } = render(<GlucoseInterpretation reading={{ glucose_value: 100, reading_date: '2025-01-02', time_slot: 'MORNING_FASTING' }} interpretation={interpretation} compact />);
    expect(screen.getByText(interpretation.label)).toBeInTheDocument();
    expect(screen.getByText(interpretation.emoji)).toBeInTheDocument();
    expect(screen.getByTestId(`icon-${interpretation.icon}`)).toBeInTheDocument();
    expect(container.firstChild.className).toContain(`text-${interpretation.color}-`);
  });

  test('shows value, date, slot, range, explanation, scale, marker and disclaimer', () => {
    render(<GlucoseInterpretation reading={{ glucose_value: 92, reading_date: '2025-01-02', time_slot: 'MORNING_FASTING' }} interpretation={interpretations.NORMAL} />);
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('mg/dL')).toBeInTheDocument();
    expect(screen.getByText('Morning (Fasting)')).toBeInTheDocument();
    expect(screen.getByText('2 Jan 2025')).toBeInTheDocument();
    expect(screen.getByText('70–99 mg/dL')).toBeInTheDocument();
    expect(screen.getByText('Educational reference.')).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: /reference range indicator for fasting/i })).toBeInTheDocument();
  });

  test('positions the value marker linearly and clamps it to the scale', () => {
    expect(markerPercent(40, rangeScale)).toBe(0);
    expect(markerPercent(170, rangeScale)).toBe(50);
    expect(markerPercent(300, rangeScale)).toBe(100);
    expect(markerPercent(600, rangeScale)).toBe(100);
    expect(markerPercent(10, rangeScale)).toBe(0);
  });

  test('renders the general post-meal thresholds without claiming verified two-hour timing', () => {
    const postMeal = {
      ...interpretations.NORMAL,
      reading_type: 'General post-meal',
      reference_range: '70–139 mg/dL',
      timing_verified: false,
      range_scale: { ...rangeScale, segments: [
        { from: 40, to: 54, status: 'CRITICAL_LOW' }, { from: 54, to: 70, status: 'LOW' },
        { from: 70, to: 140, status: 'NORMAL' }, { from: 140, to: 180, status: 'MODERATE' },
        { from: 180, to: 250, status: 'HIGH' }, { from: 250, to: 300, status: 'VERY_HIGH' },
      ] },
    };
    render(<GlucoseInterpretation reading={{ glucose_value: 120, reading_date: '2025-01-02', time_slot: 'AFTER_DINNER' }} interpretation={postMeal} />);
    expect(screen.getByText('General post-meal reference:')).toBeInTheDocument();
    expect(screen.getByText('70–139 mg/dL')).toBeInTheDocument();
    expect(screen.getByText(/actual time since food is not verified/i)).toBeInTheDocument();
    expect(screen.queryByText(/2-hour post-meal/i)).not.toBeInTheDocument();
  });

  test('shows a non-guessing fallback for unavailable reading types', () => {
    render(<GlucoseInterpretation reading={{ glucose_value: 105, time_slot: 'UNKNOWN' }} interpretation={{ status: 'READING_TYPE_UNAVAILABLE', label: 'Reading type unavailable' }} />);
    expect(screen.getByText('Reading type unavailable')).toBeInTheDocument();
    expect(screen.queryByText(/reference:/i)).not.toBeInTheDocument();
  });

  test('keeps the card and indicator responsive', () => {
    const { container } = render(<GlucoseInterpretation reading={{ glucose_value: 92, time_slot: 'MORNING_FASTING' }} interpretation={interpretations.NORMAL} />);
    expect(container.querySelector('section').className).toContain('p-4');
    expect(container.querySelector('figure')).toHaveClass('mt-5');
  });
});
