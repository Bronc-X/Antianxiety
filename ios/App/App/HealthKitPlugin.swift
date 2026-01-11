import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()
    private let isoFormatter = ISO8601DateFormatter()
    private let isoFormatterNoFraction = ISO8601DateFormatter()
    private let backgroundUpdateKey = "HealthKitBackgroundUpdateTimestamp"
    private var observerQueries: [HKObserverQuery] = []

    public override func load() {
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        isoFormatterNoFraction.formatOptions = [.withInternetDateTime]
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        let readIdentifiers = call.getArray("read", String.self) ?? []
        let writeIdentifiers = call.getArray("write", String.self) ?? []

        let readTypes = Set(readIdentifiers.compactMap { objectType(for: $0) })
        let writeTypes = Set(writeIdentifiers.compactMap { sampleType(for: $0) })

        if readTypes.isEmpty && writeTypes.isEmpty {
            call.resolve()
            return
        }

        healthStore.requestAuthorization(toShare: writeTypes, read: readTypes) { success, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject(error.localizedDescription)
                    return
                }

                if !success {
                    call.reject("HealthKit authorization was not granted.")
                    return
                }

                call.resolve()
            }
        }
    }

    @objc func querySleep(_ call: CAPPluginCall) {
        guard let startDate = parseDate(call.getString("startDate")),
              let endDate = parseDate(call.getString("endDate")) else {
            call.reject("Invalid or missing startDate/endDate.")
            return
        }

        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.reject("Sleep analysis is not available on this device.")
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { [weak self] _, results, error in
            guard let self = self else { return }

            DispatchQueue.main.async {
                if let error = error {
                    call.reject(error.localizedDescription)
                    return
                }

                let samples = (results as? [HKCategorySample] ?? []).map { sample in
                    return [
                        "startDate": self.isoString(sample.startDate),
                        "endDate": self.isoString(sample.endDate),
                        "value": self.sleepValueLabel(sample.value),
                        "sourceBundle": sample.sourceRevision.source.bundleIdentifier
                    ]
                }

                call.resolve(["samples": samples])
            }
        }

        healthStore.execute(query)
    }

    @objc func queryQuantitySamples(_ call: CAPPluginCall) {
        guard let sampleTypeValue = call.getString("sampleType"),
              let startDate = parseDate(call.getString("startDate")),
              let endDate = parseDate(call.getString("endDate")) else {
            call.reject("Invalid or missing sampleType/startDate/endDate.")
            return
        }

        guard let quantityType = quantityType(for: sampleTypeValue) else {
            call.reject("Unsupported HealthKit sampleType.")
            return
        }

        let unit = unitFromString(call.getString("unit")) ?? HKUnit.count()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)

        let query = HKSampleQuery(sampleType: quantityType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { [weak self] _, results, error in
            guard let self = self else { return }

            DispatchQueue.main.async {
                if let error = error {
                    call.reject(error.localizedDescription)
                    return
                }

                let samples = (results as? [HKQuantitySample] ?? []).map { sample in
                    return [
                        "startDate": self.isoString(sample.startDate),
                        "endDate": self.isoString(sample.endDate),
                        "quantity": sample.quantity.doubleValue(for: unit),
                        "sourceBundle": sample.sourceRevision.source.bundleIdentifier
                    ]
                }

                call.resolve(["samples": samples])
            }
        }

        healthStore.execute(query)
    }

    @objc func enableBackgroundDelivery(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["enabled": false])
            return
        }

        let identifiers = call.getArray("sampleTypes", String.self) ?? []
        let sampleTypes = identifiers.isEmpty
            ? HEALTHKIT_DEFAULT_SAMPLE_TYPES.compactMap { sampleType(for: $0) }
            : identifiers.compactMap { sampleType(for: $0) }

        if sampleTypes.isEmpty {
            call.resolve(["enabled": false])
            return
        }

        observerQueries.forEach { healthStore.stop($0) }
        observerQueries.removeAll()

        let group = DispatchGroup()
        var errors: [String] = []

        sampleTypes.forEach { sampleType in
            group.enter()
            healthStore.enableBackgroundDelivery(for: sampleType, frequency: .immediate) { success, error in
                DispatchQueue.main.async {
                    if !success {
                        errors.append(error?.localizedDescription ?? "Background delivery failed")
                    }
                    group.leave()
                }
            }

            let query = HKObserverQuery(sampleType: sampleType, predicate: nil) { [weak self] _, completionHandler, error in
                if error == nil {
                    self?.recordBackgroundUpdate()
                }
                completionHandler()
            }
            observerQueries.append(query)
            healthStore.execute(query)
        }

        group.notify(queue: .main) {
            call.resolve([
                "enabled": errors.isEmpty,
                "errors": errors
            ])
        }
    }

    @objc func getLastBackgroundUpdate(_ call: CAPPluginCall) {
        if let timestamp = UserDefaults.standard.string(forKey: backgroundUpdateKey) {
            call.resolve(["timestamp": timestamp])
        } else {
            call.resolve([:])
        }
    }

    @objc func clearBackgroundUpdate(_ call: CAPPluginCall) {
        UserDefaults.standard.removeObject(forKey: backgroundUpdateKey)
        call.resolve()
    }

    private func parseDate(_ raw: String?) -> Date? {
        guard let raw = raw else { return nil }

        if let date = isoFormatter.date(from: raw) {
            return date
        }
        return isoFormatterNoFraction.date(from: raw)
    }

    private func isoString(_ date: Date) -> String {
        return isoFormatter.string(from: date)
    }

    private func recordBackgroundUpdate() {
        let timestamp = isoString(Date())
        UserDefaults.standard.set(timestamp, forKey: backgroundUpdateKey)
        DispatchQueue.main.async { [weak self] in
            self?.notifyListeners("healthkitBackgroundUpdate", data: ["timestamp": timestamp], retainUntilConsumed: true)
        }
    }

    private func objectType(for identifier: String) -> HKObjectType? {
        return sampleType(for: identifier)
    }

    private func sampleType(for identifier: String) -> HKSampleType? {
        if identifier == "HKCategoryTypeIdentifierSleepAnalysis" || identifier == "sleepAnalysis" {
            return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
        }
        return quantityType(for: identifier)
    }

    private func quantityType(for identifier: String) -> HKQuantityType? {
        switch identifier {
        case "HKQuantityTypeIdentifierHeartRateVariabilitySDNN", "heartRateVariabilitySDNN":
            return HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)
        case "HKQuantityTypeIdentifierRestingHeartRate", "restingHeartRate":
            return HKQuantityType.quantityType(forIdentifier: .restingHeartRate)
        case "HKQuantityTypeIdentifierHeartRate", "heartRate":
            return HKQuantityType.quantityType(forIdentifier: .heartRate)
        case "HKQuantityTypeIdentifierStepCount", "stepCount":
            return HKQuantityType.quantityType(forIdentifier: .stepCount)
        case "HKQuantityTypeIdentifierActiveEnergyBurned", "activeEnergyBurned":
            return HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)
        default:
            return nil
        }
    }

    private func unitFromString(_ raw: String?) -> HKUnit? {
        guard let raw = raw else { return nil }
        let lower = raw.lowercased()

        switch lower {
        case "ms":
            return HKUnit.secondUnit(with: .milli)
        case "count":
            return HKUnit.count()
        case "count/min":
            return HKUnit.count().unitDivided(by: HKUnit.minute())
        case "kcal":
            return HKUnit.kilocalorie()
        default:
            return HKUnit(from: raw)
        }
    }

    private func sleepValueLabel(_ value: Int) -> String {
        if value == HKCategoryValueSleepAnalysis.inBed.rawValue {
            return "inbed"
        }

        if value == HKCategoryValueSleepAnalysis.awake.rawValue {
            return "awake"
        }

        if #available(iOS 16.0, *) {
            if value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue ||
                value == HKCategoryValueSleepAnalysis.asleepCore.rawValue ||
                value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue ||
                value == HKCategoryValueSleepAnalysis.asleepREM.rawValue {
                return "asleep"
            }
        } else {
            if value == HKCategoryValueSleepAnalysis.asleep.rawValue {
                return "asleep"
            }
        }

        return "unknown"
    }
}

private let HEALTHKIT_DEFAULT_SAMPLE_TYPES = [
    "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
    "HKQuantityTypeIdentifierRestingHeartRate",
    "HKQuantityTypeIdentifierStepCount",
    "HKQuantityTypeIdentifierActiveEnergyBurned",
    "HKCategoryTypeIdentifierSleepAnalysis"
]
