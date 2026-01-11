#import <Capacitor/Capacitor.h>

CAP_PLUGIN(DeepLinkPlugin, "DeepLink",
           CAP_PLUGIN_METHOD(getLaunchUrl, CAPPluginReturnPromise);
)
