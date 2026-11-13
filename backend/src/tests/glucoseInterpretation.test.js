const { classify } = require('../services/glucoseInterpretation');

describe('glucose reference interpretation boundaries', () => {
  test.each([
    [53, 'CRITICAL_LOW'], [54, 'LOW'], [69, 'LOW'], [70, 'NORMAL'], [99, 'NORMAL'],
    [100, 'MODERATE'], [125, 'MODERATE'], [126, 'HIGH'], [249, 'HIGH'], [250, 'VERY_HIGH'],
  ])('fasting %i mg/dL is %s', (glucose_value, status) => {
    expect(classify({ glucose_value, time_slot: 'MORNING_FASTING', fasting_confirmed: true }).status).toBe(status);
  });

  test.each([
    [53, 'CRITICAL_LOW'], [54, 'LOW'], [69, 'LOW'], [70, 'NORMAL'], [139, 'NORMAL'],
    [140, 'MODERATE'], [179, 'MODERATE'], [180, 'HIGH'], [249, 'HIGH'], [250, 'VERY_HIGH'],
  ])('2-hour post-meal %i mg/dL is %s', (glucose_value, status) => {
    expect(classify({ glucose_value, time_slot: 'AFTER_LUNCH', meal_timing_minutes: 120 }).status).toBe(status);
  });

  test.each([
    [{ glucose_value: 95, time_slot: 'MORNING_FASTING' }],
    [{ glucose_value: 95, time_slot: 'MORNING_FASTING', fasting_confirmed: false }],
    [{ glucose_value: 95, time_slot: 'AFTER_BREAKFAST' }],
    [{ glucose_value: 95, time_slot: 'AFTER_BREAKFAST', meal_timing_minutes: 119 }],
    [{ glucose_value: 95, time_slot: 'AFTER_BREAKFAST', meal_timing_minutes: 121 }],
  ])('requires confirmed timing for %j', (input) => {
    expect(classify(input).status).toBe('TIMING_REQUIRED');
  });

  test('provides the corresponding range and medical disclaimer', () => {
    const result = classify({ glucose_value: 126, time_slot: 'MORNING_FASTING', fasting_confirmed: true });
    expect(result.reference_range).toBe('126–249 mg/dL');
    expect(result.explanation).toContain('clinical confirmation');
    expect(result.disclaimer).toContain('not a medical diagnosis');
  });
});
