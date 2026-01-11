import Foundation
import Capacitor

@objc(DeepLinkPlugin)
public class DeepLinkPlugin: CAPPlugin {
    public override func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(handleOpenUrl(_:)), name: .capacitorOpenURL, object: nil)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc func getLaunchUrl(_ call: CAPPluginCall) {
        if let url = ApplicationDelegateProxy.shared.lastURL {
            call.resolve(["url": url.absoluteString])
        } else {
            call.resolve([:])
        }
    }

    @objc private func handleOpenUrl(_ notification: Notification) {
        guard let data = notification.object as? [String: Any],
              let url = data["url"] as? URL else {
            return
        }

        notifyListeners("urlOpen", data: ["url": url.absoluteString], retainUntilConsumed: true)
    }
}
