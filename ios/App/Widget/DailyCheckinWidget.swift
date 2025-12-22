import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), emotion: "Neutral")
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), emotion: "Neutral")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []

        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, emotion: "Neutral")
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let emotion: String
}

struct DailyCheckinWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ZStack {
            // "Calm Luxury" Background
            ContainerRelativeShape()
                .fill(Color(hex: "FAF6EF")) // Warm Alabaster
            
            // Noise Overlay texture simulated with opacity
            Color.black.opacity(0.02)
                .background(.ultraThinMaterial)

            VStack(spacing: 12) {
                Text("How are you?")
                    .font(.system(size: 14, weight: .medium, design: .serif))
                    .foregroundColor(Color(hex: "1A1A1A"))
                    .opacity(0.8)

                HStack(spacing: 16) {
                    // Good Link
                    Link(destination: URL(string: "com.antianxiety.app://log?mood=good")!) {
                        Circle()
                            .fill(Color(hex: "9CAF88").opacity(0.2))
                            .overlay(
                                Image(systemName: "face.smiling")
                                    .font(.system(size: 16))
                                    .foregroundColor(Color(hex: "9CAF88"))
                            )
                            .frame(width: 44, height: 44)
                    }

                    // Neutral Link
                    Link(destination: URL(string: "com.antianxiety.app://log?mood=neutral")!) {
                        Circle()
                            .fill(Color(hex: "C4A77D").opacity(0.2))
                            .overlay(
                                Image(systemName: "face.dashed")
                                    .font(.system(size: 16))
                                    .foregroundColor(Color(hex: "C4A77D"))
                            )
                            .frame(width: 44, height: 44)
                    }
                    
                    // Bad Link
                    Link(destination: URL(string: "com.antianxiety.app://log?mood=bad")!) {
                        Circle()
                            .fill(Color(hex: "D4AF37").opacity(0.1)) // Gold
                            .overlay(
                                Image(systemName: "cloud.rain")
                                    .font(.system(size: 16))
                                    .foregroundColor(Color(hex: "D4AF37"))
                            )
                            .frame(width: 44, height: 44)
                    }
                }
            }
            .padding()
        }
    }
}

@main
struct DailyCheckinWidget: Widget {
    let kind: String = "DailyCheckinWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DailyCheckinWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Daily Balance")
        .description("Quickly log your state and find balance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Helper extension for Hex colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
