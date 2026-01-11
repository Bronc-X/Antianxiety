#import <Capacitor/Capacitor.h>

CAP_PLUGIN(SpeechRecognitionPlugin, "SpeechRecognition",
           CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startListening, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopListening, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(cancelListening, CAPPluginReturnPromise);
)
