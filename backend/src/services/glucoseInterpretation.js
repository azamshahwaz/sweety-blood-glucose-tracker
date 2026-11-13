const DISCLAIMER = 'These values are general educational reference ranges, not a medical diagnosis. Individual glucose targets may vary. Consult a qualified healthcare professional for personal guidance.';

const STATUS = Object.freeze({
  NORMAL: { label: 'Normal', emoji: '😊', color: 'green', icon: 'CheckCircle', explanation: 'Your reading is within the general reference range.' },
  LOW: { label: 'Low', emoji: '⬇️', color: 'orange', icon: 'TrendingDown', explanation: 'Your reading is below the general reference range. Follow appropriate medical guidance.' },
  MODERATE: { label: 'Moderate', emoji: '⚠️', color: 'orange', icon: 'AlertTriangle', explanation: 'Your reading is above the normal reference range.' },
  CRITICAL_LOW: { label: 'Critical Low', emoji: '🚨', color: 'red', icon: 'AlertCircle', explanation: 'Critically low glucose can be dangerous. Follow your prescribed emergency plan and seek urgent medical assistance when needed.' },
  HIGH: { label: 'High', emoji: '🔺', color: 'red', icon: 'TrendingUp', explanation: 'Your reading is above the general reference range. Consider discussing repeated high readings with a healthcare professional.' },
  VERY_HIGH: { label: 'Very High', emoji: '🚨', color: 'red', icon: 'AlertCircle', explanation: 'Your reading is very high. Seek appropriate medical guidance, particularly if you have symptoms.' },
});

const SLOT_TYPES = Object.freeze({
  MORNING_FASTING: { label: 'Fasting', kind: 'fasting' },
  AFTER_BREAKFAST: { label: 'General post-meal', kind: 'post-meal' },
  AFTER_LUNCH: { label: 'General post-meal', kind: 'post-meal' },
  AFTER_DINNER: { label: 'General post-meal', kind: 'post-meal' },
});

function unavailable() {
  return {
    status: 'READING_TYPE_UNAVAILABLE', label: 'Reading type unavailable', emoji: '', icon: null,
    reading_type: null, reference_range: null, range_scale: null,
    explanation: 'A reference comparison is unavailable because the reading type is missing or invalid.',
    disclaimer: DISCLAIMER,
  };
}

function classify({ glucose_value, time_slot } = {}) {
  const readingType = SLOT_TYPES[time_slot];
  if (!readingType) return unavailable();

  const value = Number(glucose_value);
  if (!Number.isFinite(value)) return unavailable();

  const fasting = readingType.kind === 'fasting';
  let status;
  if (value < 54) status = 'CRITICAL_LOW';
  else if (value < 70) status = 'LOW';
  else if (fasting ? value <= 99 : value <= 139) status = 'NORMAL';
  else if (fasting ? value <= 125 : value <= 179) status = 'MODERATE';
  else if (value <= 249) status = 'HIGH';
  else status = 'VERY_HIGH';

  const normalMax = fasting ? 99 : 139;
  const moderateMax = fasting ? 125 : 179;
  const ranges = {
    CRITICAL_LOW: '<54 mg/dL', LOW: '54–69 mg/dL',
    NORMAL: fasting ? '70–99 mg/dL' : '70–139 mg/dL',
    MODERATE: fasting ? '100–125 mg/dL' : '140–179 mg/dL',
    HIGH: fasting ? '126–249 mg/dL' : '180–249 mg/dL', VERY_HIGH: '≥250 mg/dL',
  };
  const segments = [
    { from: 40, to: 54, status: 'CRITICAL_LOW' },
    { from: 54, to: 70, status: 'LOW' },
    { from: 70, to: normalMax + 1, status: 'NORMAL' },
    { from: normalMax + 1, to: moderateMax + 1, status: 'MODERATE' },
    { from: moderateMax + 1, to: 250, status: 'HIGH' },
    { from: 250, to: 300, status: 'VERY_HIGH' },
  ];
  return {
    status, ...STATUS[status], reading_type: readingType.label,
    timing_verified: false,
    reference_range: ranges[status],
    range_scale: { min: 40, max: 300, unit: 'mg/dL', segments },
    explanation: STATUS[status].explanation,
    disclaimer: DISCLAIMER,
  };
}

function withInterpretation(reading) {
  return { ...reading, interpretation: classify(reading) };
}

module.exports = { classify, withInterpretation, DISCLAIMER, SLOT_TYPES };
