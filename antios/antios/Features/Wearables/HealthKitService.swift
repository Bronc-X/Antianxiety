//
//  HealthKitService.swift
//  antios
//
//  H1: HealthKit 同步服务
//

import Foundation
import HealthKit

class HealthKitService: ObservableObject {
    static let shared = HealthKitService()
    
    private let healthStore = HKHealthStore()
    
    @Published var isAuthorized = false
    @Published var sleepData: SleepData?
    @Published var hrvData: HRVData?
    @Published var activityData: ActivityData?
    
    private init() {}
    
    // MARK: - Authorization
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthKitError.notAvailable
        }
        
        let readTypes: Set<HKObjectType> = [
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!
        ]
        
        try await healthStore.requestAuthorization(toShare: [], read: readTypes)
        
        await MainActor.run {
            self.isAuthorized = true
        }
    }
    
    // MARK: - Fetch Sleep Data
    
    func fetchSleepData(for date: Date = Date()) async throws -> SleepData {
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictEndDate)
        
        let samples = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[HKCategorySample], Error>) in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: samples as? [HKCategorySample] ?? [])
                }
            }
            healthStore.execute(query)
        }
        
        var totalSleep: TimeInterval = 0
        var deepSleep: TimeInterval = 0
        var remSleep: TimeInterval = 0
        
        for sample in samples {
            let duration = sample.endDate.timeIntervalSince(sample.startDate)
            
            switch sample.value {
            case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                totalSleep += duration
            case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                totalSleep += duration
                deepSleep += duration
            case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                totalSleep += duration
                remSleep += duration
            default:
                break
            }
        }
        
        let data = SleepData(
            date: date,
            totalHours: totalSleep / 3600,
            deepSleepHours: deepSleep / 3600,
            remSleepHours: remSleep / 3600
        )
        
        await MainActor.run {
            self.sleepData = data
        }
        
        return data
    }
    
    // MARK: - Fetch HRV Data
    
    func fetchHRVData(for date: Date = Date()) async throws -> HRVData {
        let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
        
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictEndDate)
        
        let samples = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[HKQuantitySample], Error>) in
            let query = HKSampleQuery(
                sampleType: hrvType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: samples as? [HKQuantitySample] ?? [])
                }
            }
            healthStore.execute(query)
        }
        
        let values = samples.map { $0.quantity.doubleValue(for: .secondUnit(with: .milli)) }
        let average = values.isEmpty ? 0 : values.reduce(0, +) / Double(values.count)
        
        let data = HRVData(date: date, averageHRV: average, measurements: values.count)
        
        await MainActor.run {
            self.hrvData = data
        }
        
        return data
    }
    
    // MARK: - Fetch Activity Data
    
    func fetchActivityData(for date: Date = Date()) async throws -> ActivityData {
        let stepsType = HKObjectType.quantityType(forIdentifier: .stepCount)!
        let energyType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
        
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictEndDate)
        
        let steps = try await fetchSum(for: stepsType, predicate: predicate, unit: .count())
        let energy = try await fetchSum(for: energyType, predicate: predicate, unit: .kilocalorie())

        let data = ActivityData(
            date: date,
            steps: Int(steps),
            activeCalories: Int(energy)
        )
        
        await MainActor.run {
            self.activityData = data
        }
        
        return data
    }
    
    private func fetchSum(for type: HKQuantityType, predicate: NSPredicate, unit: HKUnit) async throws -> Double {
        try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: type,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    let value = statistics?.sumQuantity()?.doubleValue(for: unit) ?? 0
                    continuation.resume(returning: value)
                }
            }
            healthStore.execute(query)
        }
    }
    
    // MARK: - Sync to Server
    
    func syncToServer() async throws {
        struct HardwareData: Encodable {
            let hrv: Double?
            let sleep_minutes: Int?
            let deep_sleep_minutes: Int?
            let rem_sleep_minutes: Int?
            let steps: Int?
            let active_calories: Int?
            let recorded_at: String
        }

        struct SyncRequest: Encodable {
            let source: String
            let data: HardwareData
        }

        let sleepMinutes = sleepData.map { Int(($0.totalHours * 60).rounded()) }
        let deepMinutes = sleepData.map { Int(($0.deepSleepHours * 60).rounded()) }
        let remMinutes = sleepData.map { Int(($0.remSleepHours * 60).rounded()) }
        let hrvValue = hrvData?.averageHRV
        let steps = activityData?.steps
        let activeCalories = activityData?.activeCalories

        let payload = SyncRequest(
            source: "healthkit",
            data: HardwareData(
                hrv: hrvValue,
                sleep_minutes: sleepMinutes,
                deep_sleep_minutes: deepMinutes,
                rem_sleep_minutes: remMinutes,
                steps: steps,
                active_calories: activeCalories,
                recorded_at: ISO8601DateFormatter().string(from: Date())
            )
        )

        let _: EmptyResponse = try await APIClient.shared.request(
            endpoint: "user/hardware-sync",
            method: .post,
            body: payload
        )
    }
}

// MARK: - Models

struct SleepData: Codable {
    let date: Date
    let totalHours: Double
    let deepSleepHours: Double
    let remSleepHours: Double
}

struct HRVData: Codable {
    let date: Date
    let averageHRV: Double
    let measurements: Int
}

struct ActivityData: Codable {
    let date: Date
    let steps: Int
    let activeCalories: Int
}

enum HealthKitError: Error {
    case notAvailable
    case authorizationDenied
}
