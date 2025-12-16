# Implementation Plan

- [x] 1. Create CalibrationService with anomaly detection




  - [ ] 1.1 Create `lib/calibration-service.ts` with weekly average calculation and anomaly detection
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 1.2 Write property test for anomaly detection
    - **Property 1: Sleep anomaly detection threshold**
    - **Validates: Requirements 4.2**
  - [x]* 1.3 Write property test for data serialization round-trip





    - **Property 2: Calibration data round-trip**

    - **Validates: Requirements 7.4**














- [ ] 2. Refactor DailyCheckin component to DailyCalibrationSheet
  - [ ] 2.1 Update `components/DailyCheckin.tsx` with new input controls (sleep slider, stress/exercise segmented controls)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ] 2.2 Add progressive inquiry flow after submit
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 2.3 Integrate CalibrationService for anomaly detection
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3. Add checkin_time setting and local notifications
  - [ ] 3.1 Add time picker to settings page for checkin_time
    - _Requirements: 2.1, 2.2_
  - [ ] 3.2 Implement local notification scheduling with @capacitor/local-notifications
    - _Requirements: 2.3, 2.4_

- [ ] 4. Update dashboard integration
  - [ ] 4.1 Update LandingContent to use new DailyCalibrationSheet
    - _Requirements: 6.1, 6.3, 6.4_
  - [ ] 4.2 Add task generation based on inquiry response
    - _Requirements: 6.2, 6.5_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
