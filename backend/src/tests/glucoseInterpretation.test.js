const { classify, withInterpretation, DISCLAIMER } = require('../services/glucoseInterpretation');

describe('glucose reference interpretation boundaries', () => {
  test.each([
    [40, 'CRITICAL_LOW'], [54, 'LOW'], [69, 'LOW'], [70, 'NORMAL'], [99, 'NORMAL'],
    [100, 'MODERATE'], [125, 'MODERATE'], [126, 'HIGH'], [249, 'HIGH'], [250, 'VERY_HIGH'],
  ])('fasting %i mg/dL is %s', (glucose_value, status) => {
    expect(classify({ glucose_value, time_slot: 'MORNING_FASTING' }).status).toBe(status);
  });

  test.each([
    [40, 'CRITICAL_LOW'], [54, 'LOW'], [69, 'LOW'], [70, 'NORMAL'], [139, 'NORMAL'],
    [140, 'MODERATE'], [179, 'MODERATE'], [180, 'HIGH'], [249, 'HIGH'], [250, 'VERY_HIGH'],
  ])('general post-meal %i mg/dL is %s', (glucose_value, status) => {
    expect(classify({ glucose_value, time_slot: 'AFTER_LUNCH' }).status).toBe(status);
  });

  test.each(['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'])(
    'maps %s using its slot without timing confirmation', (time_slot) => {
      const result = classify({ glucose_value: 100, time_slot });
      expect(result.status).toBe(time_slot === 'MORNING_FASTING' ? 'MODERATE' : 'NORMAL');
      expect(result.timing_verified).toBe(false);
    },
  );

  test.each([undefined, null, 'UNKNOWN_SLOT'])(
    'does not guess when reading type is %p',
    (time_slot) => expect(classify({ glucose_value: 100, time_slot })).toMatchObject({
      status: 'READING_TYPE_UNAVAILABLE', label: 'Reading type unavailable', reference_range: null,
    }),
  );

  test('distinguishes fasting and general post-meal ranges and indicator segments', () => {
    const fasting = classify({ glucose_value: 126, time_slot: 'MORNING_FASTING' });
    const postMeal = classify({ glucose_value: 140, time_slot: 'AFTER_BREAKFAST' });
    expect(fasting).toMatchObject({ reading_type: 'Fasting', reference_range: '126–249 mg/dL', color: 'red', emoji: '🔺', icon: 'TrendingUp' });
    expect(postMeal).toMatchObject({ reading_type: 'General post-meal', reference_range: '140–179 mg/dL', color: 'orange', emoji: '⚠️', icon: 'AlertTriangle' });
    expect(fasting.range_scale.segments[2].to).toBe(100);
    expect(postMeal.range_scale.segments[2].to).toBe(140);
  });

  test('uses only the defined three status colours and includes educational guidance', () => {
    const colors = new Set([40, 60, 80, 110, 200, 250].map((glucose_value) =>
      classify({ glucose_value, time_slot: 'MORNING_FASTING' }).color));
    expect([...colors].sort()).toEqual(['green', 'orange', 'red']);
    expect(DISCLAIMER).toBe('These values are general educational reference ranges, not a medical diagnosis. Individual glucose targets may vary. Consult a qualified healthcare professional for personal guidance.');
    expect(classify({ glucose_value: 40, time_slot: 'MORNING_FASTING' }).explanation).toContain('urgent medical assistance');
  });

  test('classifies historical readings without timing fields and preserves the record', () => {
    const oldReading = { id: 'reading-1', glucose_value: 92, time_slot: 'MORNING_FASTING', reading_date: '2025-01-02' };
    const result = withInterpretation(oldReading);
    expect(result.interpretation.status).toBe('NORMAL');
    expect(result.reading_date).toBe(oldReading.reading_date);
    expect(result.fasting_confirmed).toBeUndefined();
  });
});
