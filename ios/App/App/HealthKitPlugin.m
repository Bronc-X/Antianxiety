#import <Capacitor/Capacitor.h>

CAP_PLUGIN(HealthKitPlugin, "HealthKit",
           CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(querySleep, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(queryQuantitySamples, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(enableBackgroundDelivery, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getLastBackgroundUpdate, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(clearBackgroundUpdate, CAPPluginReturnPromise);
)
