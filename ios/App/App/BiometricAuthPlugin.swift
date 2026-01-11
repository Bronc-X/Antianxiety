import Foundation
import Capacitor
import LocalAuthentication

@objc(BiometricAuthPlugin)
public class BiometricAuthPlugin: CAPPlugin {
    private var activeContext: LAContext?

    @objc func isAvailable(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        let biometryType = biometryTypeLabel(context.biometryType)

        call.resolve([
            "available": available,
            "biometryType": biometryType,
            "error": error?.localizedDescription ?? NSNull()
        ])
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?
        let reason = call.getString("reason") ?? "Authenticate to continue"

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            call.reject(error?.localizedDescription ?? "Biometric authentication is not available")
            return
        }

        activeContext = context
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { [weak self] success, authError in
            DispatchQueue.main.async {
                if success {
                    call.resolve(["success": true])
                } else {
                    call.reject(authError?.localizedDescription ?? "Authentication failed")
                }
                self?.activeContext = nil
            }
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        activeContext?.invalidate()
        activeContext = nil
        call.resolve()
    }

    private func biometryTypeLabel(_ type: LABiometryType) -> String {
        switch type {
        case .faceID:
            return "face"
        case .touchID:
            return "touch"
        default:
            return "none"
        }
    }
}
