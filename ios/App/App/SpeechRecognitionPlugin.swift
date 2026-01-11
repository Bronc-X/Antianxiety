import Foundation
import Capacitor
import Speech
import AVFoundation

@objc(SpeechRecognitionPlugin)
public class SpeechRecognitionPlugin: CAPPlugin, SFSpeechRecognizerDelegate {
    private var speechRecognizer: SFSpeechRecognizer?
    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var lastTranscript: String = ""
    private var currentLocaleId: String = Locale.current.identifier

    @objc func isAvailable(_ call: CAPPluginCall) {
        let localeId = call.getString("locale") ?? Locale.current.identifier
        updateRecognizer(localeId)
        let available = speechRecognizer?.isAvailable ?? false
        call.resolve(["available": available])
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        let group = DispatchGroup()
        var speechStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined
        var micGranted = false

        group.enter()
        SFSpeechRecognizer.requestAuthorization { status in
            speechStatus = status
            group.leave()
        }

        group.enter()
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            micGranted = granted
            group.leave()
        }

        group.notify(queue: .main) {
            call.resolve([
                "speech": self.mapSpeechStatus(speechStatus),
                "microphone": micGranted ? "granted" : "denied"
            ])
        }
    }

    @objc func startListening(_ call: CAPPluginCall) {
        let localeId = call.getString("locale") ?? Locale.current.identifier
        let partialResults = call.getBool("partialResults") ?? true
        let onDevice = call.getBool("onDevice") ?? false

        updateRecognizer(localeId)

        guard let speechRecognizer = speechRecognizer else {
            call.reject("Speech recognition is not available for this locale.")
            return
        }

        if SFSpeechRecognizer.authorizationStatus() != .authorized {
            call.reject("Speech recognition permission not granted.")
            return
        }

        if AVAudioSession.sharedInstance().recordPermission != .granted {
            call.reject("Microphone permission not granted.")
            return
        }

        if #available(iOS 13.0, *), onDevice, speechRecognizer.supportsOnDeviceRecognition == false {
            call.reject("On-device speech recognition is not supported.")
            return
        }

        stopAudioEngine()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        lastTranscript = ""

        do {
            try configureAudioSession()
        } catch {
            call.reject("Failed to configure audio session.")
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = partialResults
        if #available(iOS 13.0, *), onDevice {
            request.requiresOnDeviceRecognition = true
        }
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        inputNode.removeTap(onBus: 0)

        recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString
                self.lastTranscript = text
                DispatchQueue.main.async {
                    if result.isFinal {
                        self.notifyListeners("speechFinal", data: ["text": text], retainUntilConsumed: false)
                    } else {
                        self.notifyListeners("speechPartial", data: ["text": text], retainUntilConsumed: false)
                    }
                }

                if result.isFinal {
                    self.stopAudioEngine()
                    self.recognitionRequest?.endAudio()
                    self.recognitionRequest = nil
                    self.recognitionTask = nil
                }
            }

            if let error = error {
                DispatchQueue.main.async {
                    self.notifyListeners("speechError", data: ["message": error.localizedDescription], retainUntilConsumed: false)
                }
                self.stopAudioEngine()
                self.recognitionRequest?.endAudio()
                self.recognitionRequest = nil
                self.recognitionTask = nil
            }
        }

        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
            call.resolve()
        } catch {
            call.reject("Failed to start audio engine.")
        }
    }

    @objc func stopListening(_ call: CAPPluginCall) {
        stopAudioEngine()
        recognitionRequest?.endAudio()
        call.resolve(["transcript": lastTranscript])
    }

    @objc func cancelListening(_ call: CAPPluginCall) {
        stopAudioEngine()
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        call.resolve()
    }

    private func updateRecognizer(_ localeId: String) {
        if localeId == currentLocaleId, speechRecognizer != nil {
            return
        }

        currentLocaleId = localeId
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: localeId))
        speechRecognizer?.delegate = self
    }

    private func configureAudioSession() throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: [.duckOthers, .allowBluetooth])
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    }

    private func stopAudioEngine() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
    }

    private func mapSpeechStatus(_ status: SFSpeechRecognizerAuthorizationStatus) -> String {
        switch status {
        case .authorized:
            return "granted"
        case .denied, .restricted:
            return "denied"
        case .notDetermined:
            return "prompt"
        @unknown default:
            return "denied"
        }
    }
}
