//
//  antiosTests.swift
//  antiosTests
//
//  Created by Broncin on 2026/2/6.
//

import XCTest
@testable import antios

final class antiosTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testPredictMoodScoreClampsRange() throws {
        let service = BayesianAnalyticsService.shared

        let low = service.predictMoodScore(sleepHours: 3, stressLevel: 10, exerciseMinutes: 0)
        let high = service.predictMoodScore(sleepHours: 9, stressLevel: 1, exerciseMinutes: 60)

        XCTAssertGreaterThanOrEqual(low, 1)
        XCTAssertLessThanOrEqual(low, 10)
        XCTAssertGreaterThanOrEqual(high, 1)
        XCTAssertLessThanOrEqual(high, 10)
        XCTAssertGreaterThan(high, low)
    }

    func testGenerateNudgesPrioritizesHighStress() throws {
        let service = BayesianAnalyticsService.shared
        let nudges = service.generateNudges(
            sleepData: SleepData(date: Date(), totalHours: 5, deepSleepHours: 1, remSleepHours: 1),
            stressLevel: 8,
            lastCalibration: Date().addingTimeInterval(-26 * 3600),
            planCompletion: 0.2
        )

        XCTAssertFalse(nudges.isEmpty)
        XCTAssertEqual(nudges.first?.priority, .high)
        XCTAssertTrue(nudges.contains(where: { $0.actionType == "breathing_exercise" }))
    }

    func testConfidenceReturnsSleepMoodSignal() throws {
        let service = BayesianAnalyticsService.shared
        let sleepData = (0..<7).map { offset in
            SleepData(
                date: Date().addingTimeInterval(Double(offset) * 86400),
                totalHours: Double(6 + offset % 2),
                deepSleepHours: 1.2,
                remSleepHours: 1.0
            )
        }
        let moodScores = [5, 6, 5, 7, 6, 7, 6]
        let stressLevels = [7, 6, 6, 5, 5, 4, 4]

        let results = service.calculateConfidence(
            sleepData: sleepData,
            moodScores: moodScores,
            stressLevels: stressLevels
        )

        XCTAssertTrue(results.contains(where: { $0.factor == "睡眠-情绪" }))
        XCTAssertTrue(results.contains(where: { $0.factor == "压力趋势" }))
    }

}
