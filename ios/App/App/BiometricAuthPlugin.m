#import <Capacitor/Capacitor.h>

CAP_PLUGIN(BiometricAuthPlugin, "BiometricAuth",
           CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(authenticate, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(cancel, CAPPluginReturnPromise);
)
