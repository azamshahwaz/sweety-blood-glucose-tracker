const STATUS = Object.freeze({
  NORMAL: { label: 'Normal / Healthy', color: 'green' },
  MODERATE: { label: 'Moderate / Elevated', color: 'amber' },
  LOW: { label: 'Low', color: 'orange' },
  HIGH: { label: 'High', color: 'red' },
  CRITICAL_LOW: { label: 'Critical Low', color: 'dark-red' },
  VERY_HIGH: { label: 'Very High / Urgent Review', color: 'dark-red' },
  TIMING_REQUIRED: { label: 'Timing required', color: 'neutral' },
});

const DISCLAIMER = 'These are general reference values, not a medical diagnosis. Your personal glucose targets may differ. Consult your healthcare professional.';

function classify({ glucose_value, time_slot, fasting_confirmed, meal_timing_minutes }) {
  const value = Number(glucose_value);
  const fasting = time_slot === 'MORNING_FASTING';
  const validTiming = fasting ? fasting_confirmed === true : Number(meal_timing_minutes) === 120;
  if (!validTiming) {
    return {
      status: 'TIMING_REQUIRED', ...STATUS.TIMING_REQUIRED,
      reference_range: null,
      explanation: fasting
        ? 'Confirm that you had no caloric intake for at least 8 hours to interpret this as a fasting reading.'
        : 'Enter a confirmed reading taken exactly 120 minutes after the start of a meal to use post-meal reference values.',
      disclaimer: DISCLAIMER,
    };
  }

  const rangeType = fasting ? 'fasting' : '2-hour post-meal';
  let status;
  if (value < 54) status = 'CRITICAL_LOW';
  else if (value < 70) status = 'LOW';
  else if (fasting ? value <= 99 : value <= 139) status = 'NORMAL';
  else if (fasting ? value <= 125 : value <= 179) status = 'MODERATE';
  else if (value <= 249) status = 'HIGH';
  else status = 'VERY_HIGH';

  const ranges = fasting
    ? { CRITICAL_LOW: '<54 mg/dL', LOW: '54–69 mg/dL', NORMAL: '70–99 mg/dL', MODERATE: '100–125 mg/dL', HIGH: '126–249 mg/dL', VERY_HIGH: '≥250 mg/dL' }
    : { CRITICAL_LOW: '<54 mg/dL', LOW: '54–69 mg/dL', NORMAL: '70–139 mg/dL', MODERATE: '140–179 mg/dL', HIGH: '180–249 mg/dL', VERY_HIGH: '≥250 mg/dL' };
  const notes = {
    NORMAL: `Within the general ${rangeType} reference range for non-pregnant adults without diagnosed diabetes.`,
    MODERATE: `Above the general ${rangeType} reference range. One reading cannot diagnose prediabetes or diabetes.`,
    LOW: 'This is a low glucose reading. Follow your clinician’s low-glucose plan; seek help if symptoms worsen.',
    CRITICAL_LOW: 'This is critically low. Seek immediate medical advice; call emergency services for severe symptoms or confusion, seizure, or loss of consciousness.',
    HIGH: fasting
      ? 'This is above the general fasting reference range. A fasting value of 126 mg/dL or above needs appropriate clinical confirmation.'
      : 'This is above the general 2-hour post-meal reference range. Discuss repeated elevated readings with a healthcare professional.',
    VERY_HIGH: 'This is very high. Contact a healthcare professional promptly; seek emergency care for severe symptoms such as vomiting, trouble breathing, confusion, or loss of consciousness.',
  };
  return {
    status, ...STATUS[status], reference_range: ranges[status], range_type: rangeType,
    explanation: notes[status], disclaimer: DISCLAIMER,
  };
}

function withInterpretation(reading) {
  return { ...reading, interpretation: classify(reading) };
}

module.exports = { classify, withInterpretation, DISCLAIMER };
