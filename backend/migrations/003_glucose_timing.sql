ALTER TABLE glucose_readings
  ADD COLUMN fasting_confirmed BOOLEAN,
  ADD COLUMN meal_timing_minutes INTEGER,
  ADD CONSTRAINT meal_timing_minutes_range
    CHECK (meal_timing_minutes IS NULL OR meal_timing_minutes BETWEEN 0 AND 1440);
