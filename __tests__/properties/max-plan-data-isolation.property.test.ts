/**
 * Property Test: Data Isolation for Max Plan Data Aggregator
 * 
 * Feature: max-plan-creation-dialog, Property 1: Data Isolation
 * Validates: Requirements 8.1, 8.2
 * 
 * For any user session and any data fetch operation, the returned health data
 * (inquiry, calibration, HRV) SHALL only contain records where user_id matches
 * the authenticated user's ID.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateDataStatus,
  validateUserDataIsolation,
  isDataStale,
  DATA_FRESHNESS_THRESHOLD_DAYS,
} from '@/lib/max/plan-data-aggregator';
import type {
  AggregatedPlanData,
  InquiryData,
  CalibrationData,
  HrvData,
} from '@/types/max-plan';

// ============================================
// Generators
// ============================================

/** Generate a valid UUID */
const uuidArb = fc.uuid();

/** Generate a recent date string (within freshness threshold) */
const recentDateArb = fc.integer({ 
  min: 1, 
  max: DATA_FRESHNESS_THRESHOLD_DAYS - 1 
}).map(daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
});

/** Generate a stale date string (older than threshold) */
const staleDateArb = fc.integer({ 
  min: DATA_FRESHNESS_THRESHOLD_DAYS + 1, 
  max: 60 
}).map(daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
});

/** Generate inquiry data */
const inquiryDataArb = (userId: string): fc.Arbitrary<InquiryData> =>
  fc.record({
    id: uuidArb,
    userId: fc.constant(userId),
    topic: fc.string({ minLength: 1, maxLength: 50 }),
    responses: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ maxLength: 100 })),
    extractedIndicators: fc.constant({}),
    createdAt: recentDateArb,
    updatedAt: recentDateArb,
  });

/** Generate calibration data */
const calibrationDataArb: fc.Arbitrary<CalibrationData> = fc.record({
  date: recentDateArb,
  sleepHours: fc.integer({ min: 0, max: 12 }),
  sleepQuality: fc.integer({ min: 0, max: 10 }),
  moodScore: fc.integer({ min: 0, max: 10 }),
  stressLevel: fc.integer({ min: 0, max: 10 }),
  energyLevel: fc.integer({ min: 0, max: 10 }),
});

/** Generate HRV data */
const hrvDataArb: fc.Arbitrary<HrvData> = fc.record({
  date: recentDateArb,
  avgHrv: fc.integer({ min: 20, max: 100 }),
  minHrv: fc.integer({ min: 10, max: 50 }),
  maxHrv: fc.integer({ min: 50, max: 150 }),
  restingHr: fc.integer({ min: 40, max: 100 }),
  hrvTrend: fc.constantFrom('improving' as const, 'stable' as const, 'declining' as const),
  source: fc.string({ minLength: 1, maxLength: 20 }),
});

/** Generate aggregated plan data with matching user ID */
const aggregatedDataArb = (userId: string): fc.Arbitrary<AggregatedPlanData> =>
  fc.record({
    userId: fc.constant(userId),
    inquiry: fc.option(inquiryDataArb(userId), { nil: null }),
    calibration: fc.option(calibrationDataArb, { nil: null }),
    hrv: fc.option(hrvDataArb, { nil: null }),
    profile: fc.constant(null),
    dataStatus: fc.record({
      hasInquiryData: fc.boolean(),
      hasCalibrationData: fc.boolean(),
      hasHrvData: fc.boolean(),
    }),
  });

/** Generate aggregated data with mismatched user ID in inquiry */
const mismatchedInquiryDataArb = (
  expectedUserId: string,
  wrongUserId: string
): fc.Arbitrary<AggregatedPlanData> =>
  fc.record({
    userId: fc.constant(expectedUserId),
    inquiry: inquiryDataArb(wrongUserId), // Wrong user ID
    calibration: fc.option(calibrationDataArb, { nil: null }),
    hrv: fc.option(hrvDataArb, { nil: null }),
    profile: fc.constant(null),
    dataStatus: fc.record({
      hasInquiryData: fc.boolean(),
      hasCalibrationData: fc.boolean(),
      hasHrvData: fc.boolean(),
    }),
  });

// ============================================
// Property Tests
// ============================================

describe('Feature: max-plan-creation-dialog, Property 1: Data Isolation', () => {
  it('should validate that aggregated data belongs to the correct user', () => {
    fc.assert(
      fc.property(
        uuidArb,
        (userId) => {
          fc.assert(
            fc.property(
              aggregatedDataArb(userId),
              (data) => {
                // Property: All data should belong to the expected user
                const isValid = validateUserDataIsolation(data, userId);
                expect(isValid).toBe(true);
              }
            ),
            { numRuns: 50 }
          );
        }
      ),
      { numRuns: 2 }
    );
  });

  it('should reject data with mismatched user IDs', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        (expectedUserId, wrongUserId) => {
          // Skip if IDs happen to match
          fc.pre(expectedUserId !== wrongUserId);

          fc.assert(
            fc.property(
              mismatchedInquiryDataArb(expectedUserId, wrongUserId),
              (data) => {
                // Property: Data with wrong user ID should be rejected
                const isValid = validateUserDataIsolation(data, expectedUserId);
                expect(isValid).toBe(false);
              }
            ),
            { numRuns: 50 }
          );
        }
      ),
      { numRuns: 2 }
    );
  });

  it('should correctly identify recent data as not stale', () => {
    fc.assert(
      fc.property(
        recentDateArb,
        (recentDate) => {
          // Property: Recent dates should not be stale
          expect(isDataStale(recentDate)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify old data as stale', () => {
    fc.assert(
      fc.property(
        staleDateArb,
        (staleDate) => {
          // Property: Old dates should be stale
          expect(isDataStale(staleDate)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle undefined dates as stale', () => {
    // Property: Undefined dates should always be considered stale
    expect(isDataStale(undefined)).toBe(true);
  });

  it('should calculate data status correctly based on data presence', () => {
    fc.assert(
      fc.property(
        fc.option(calibrationDataArb, { nil: null }),
        fc.option(hrvDataArb, { nil: null }),
        uuidArb,
        (calibration, hrv, userId) => {
          fc.assert(
            fc.property(
              fc.option(inquiryDataArb(userId), { nil: null }),
              (inquiry) => {
                const status = calculateDataStatus(inquiry, calibration, hrv);

                // Property: Status should reflect actual data presence
                if (inquiry === null) {
                  expect(status.hasInquiryData).toBe(false);
                  expect(status.inquirySummary).toBeUndefined();
                }
                if (calibration === null) {
                  expect(status.hasCalibrationData).toBe(false);
                  expect(status.calibrationSummary).toBeUndefined();
                }
                if (hrv === null || hrv.avgHrv === 0) {
                  expect(status.hasHrvData).toBe(false);
                  expect(status.hrvSummary).toBeUndefined();
                }
              }
            ),
            { numRuns: 25 }
          );
        }
      ),
      { numRuns: 4 }
    );
  });

  it('should generate summaries when data is present and fresh', () => {
    fc.assert(
      fc.property(
        uuidArb,
        calibrationDataArb,
        hrvDataArb.filter(h => h.avgHrv > 0),
        (userId, calibration, hrv) => {
          fc.assert(
            fc.property(
              inquiryDataArb(userId),
              (inquiry) => {
                const status = calculateDataStatus(inquiry, calibration, hrv);

                // Property: When data is present and fresh, summaries should be strings
                if (status.hasInquiryData) {
                  expect(typeof status.inquirySummary).toBe('string');
                  expect(status.inquirySummary!.length).toBeGreaterThan(0);
                }
                if (status.hasCalibrationData) {
                  expect(typeof status.calibrationSummary).toBe('string');
                  expect(status.calibrationSummary!.length).toBeGreaterThan(0);
                }
                if (status.hasHrvData) {
                  expect(typeof status.hrvSummary).toBe('string');
                  expect(status.hrvSummary!.length).toBeGreaterThan(0);
                }
              }
            ),
            { numRuns: 25 }
          );
        }
      ),
      { numRuns: 4 }
    );
  });
});
