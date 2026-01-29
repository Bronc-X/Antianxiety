import ActivityKit
import WidgetKit
import SwiftUI

struct AntiAnxietynewWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AnxietyTrackingAttributes.self) { context in
            // Lock screen/banner UI
            AnxietyLiveActivityView(context: context)
                .activityBackgroundTint(Color.black.opacity(0.8))
                .activitySystemActionForegroundColor(Color.white)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    AnxietyLiveActivityCompactLeading(context: context)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    AnxietyLiveActivityCompactTrailing(context: context)
                }
                DynamicIslandExpandedRegion(.center) {
                    // Expanded center content if needed
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.sessionName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            } compactLeading: {
                AnxietyLiveActivityCompactLeading(context: context)
            } compactTrailing: {
                AnxietyLiveActivityCompactTrailing(context: context)
            } minimal: {
                AnxietyLiveActivityMinimal(context: context)
            }
            .widgetURL(URL(string: "antianxiety://activity"))
            .keylineTint(Color.cyan)
        }
    }
}
