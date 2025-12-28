-- Expand allowed data_type values for user_health_data

ALTER TABLE user_health_data
  DROP CONSTRAINT IF EXISTS user_health_data_data_type_check;

ALTER TABLE user_health_data
  ADD CONSTRAINT user_health_data_data_type_check CHECK (
    data_type IN (
      'sleep',
      'sleep_score',
      'deep_sleep_minutes',
      'rem_sleep_minutes',
      'light_sleep_minutes',
      'hrv',
      'resting_heart_rate',
      'steps',
      'active_calories',
      'activity',
      'heart_rate',
      'stress',
      'readiness',
      'spo2',
      'temperature'
    )
  );
