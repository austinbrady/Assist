//
//  DrumKitApp.swift
//  Complete SwiftUI Drum Kit App with Layout Fixes
//

import SwiftUI
import AVFoundation

// MARK: - Main App Entry
@main
struct DrumKitApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

// MARK: - Main Content View
struct ContentView: View {
    @State private var selectedTab: TabItem = .kit
    @StateObject private var audioManager = AudioManager()
    @State private var selectedKit: String = "Empty Kit"
    
    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                // Header Bar - Fixed to top with safe area
                HeaderView(selectedKit: $selectedKit)
                    .background(Color(.systemBackground))
                    .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 2)
                
                // Main Content - Fills available space
                ZStack {
                    switch selectedTab {
                    case .mixer:
                        MixerView()
                    case .kit:
                        KitView(audioManager: audioManager, selectedKit: selectedKit)
                    case .midi:
                        MIDIView()
                    case .metro:
                        MetroView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Footer Tab Bar - Fixed to bottom with safe area
                FooterView(selectedTab: $selectedTab)
                    .background(Color(.systemBackground))
                    .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: -2)
            }
            .ignoresSafeArea(.keyboard, edges: .bottom)
        }
    }
}

// MARK: - Header View
struct HeaderView: View {
    @Binding var selectedKit: String
    @State private var showSettings = false
    @State private var showKitPicker = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Safe area spacer for status bar
            Color.clear
                .frame(height: 0)
                .background(
                    GeometryReader { geometry in
                        Color.clear
                            .preference(
                                key: SafeAreaTopKey.self,
                                value: geometry.safeAreaInsets.top
                            )
                    }
                )
            
            // Header content
            HStack(spacing: 16) {
                // Gear icon (Settings)
                Button(action: {
                    showSettings.toggle()
                }) {
                    Image(systemName: "gearshape.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.primary)
                }
                
                // KIT label
                Text("KIT")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                // Kit dropdown
                Menu {
                    Button("Empty Kit") {
                        selectedKit = "Empty Kit"
                    }
                    Button("Acoustic Kit") {
                        selectedKit = "Acoustic Kit"
                    }
                    Button("Electronic Kit") {
                        selectedKit = "Electronic Kit"
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(selectedKit)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.primary)
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                }
                
                // User icon
                Button(action: {
                    // User profile action
                }) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(.primary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(Color(.systemBackground))
        }
        .background(
            GeometryReader { geometry in
                Color(.systemBackground)
                    .frame(height: geometry.safeAreaInsets.top + 60)
                    .offset(y: -geometry.safeAreaInsets.top)
            }
        )
    }
}

// MARK: - Footer View
struct FooterView: View {
    @Binding var selectedTab: TabItem
    
    var body: some View {
        VStack(spacing: 0) {
            // Tab bar content
            HStack(spacing: 0) {
                TabButton(
                    item: .mixer,
                    selectedTab: $selectedTab,
                    icon: "slider.horizontal.3",
                    label: "Mixer"
                )
                
                TabButton(
                    item: .kit,
                    selectedTab: $selectedTab,
                    icon: "square.grid.2x2",
                    label: "Kit"
                )
                
                TabButton(
                    item: .midi,
                    selectedTab: $selectedTab,
                    icon: "music.note",
                    label: "MIDI"
                )
                
                TabButton(
                    item: .metro,
                    selectedTab: $selectedTab,
                    icon: "metronome",
                    label: "Metro"
                )
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 8)
            .padding(.bottom, 0)
            .background(Color(.systemBackground))
            
            // Safe area spacer for bottom
            Color.clear
                .frame(height: 0)
                .background(
                    GeometryReader { geometry in
                        Color.clear
                            .preference(
                                key: SafeAreaBottomKey.self,
                                value: geometry.safeAreaInsets.bottom
                            )
                    }
                )
        }
        .background(
            GeometryReader { geometry in
                Color(.systemBackground)
                    .frame(height: geometry.safeAreaInsets.bottom + 60)
                    .offset(y: geometry.safeAreaInsets.bottom)
            }
        )
    }
}

// MARK: - Tab Button
struct TabButton: View {
    let item: TabItem
    @Binding var selectedTab: TabItem
    let icon: String
    let label: String
    
    var body: some View {
        Button(action: {
            selectedTab = item
        }) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 22))
                Text(label)
                    .font(.system(size: 11, weight: .medium))
            }
            .foregroundColor(selectedTab == item ? .blue : .secondary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }
}

// MARK: - Kit View (Main Drum Pad View)
struct KitView: View {
    @ObservedObject var audioManager: AudioManager
    let selectedKit: String
    
    let drumPads = [
        ("Crash L", "crash_left"),
        ("Crash R", "crash_right"),
        ("Ride", "ride"),
        ("Hi-Hat", "hihat"),
        ("Snare", "snare"),
        ("Kick", "kick"),
        ("Tom 1", "tom1"),
        ("Tom 2", "tom2"),
        ("Tom 3", "tom3"),
        ("Rack 1", "rack1"),
        ("Rack 2", "rack2"),
        ("Floor", "floor")
    ]
    
    var body: some View {
        ScrollView {
            LazyVGrid(columns: [
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12),
                GridItem(.flexible(), spacing: 12)
            ], spacing: 12) {
                ForEach(drumPads, id: \.0) { pad in
                    DrumPadView(
                        name: pad.0,
                        sampleName: pad.1,
                        audioManager: audioManager,
                        selectedKit: selectedKit
                    )
                }
            }
            .padding(16)
        }
        .background(Color(.systemGroupedBackground))
    }
}

// MARK: - Drum Pad View
struct DrumPadView: View {
    let name: String
    let sampleName: String
    @ObservedObject var audioManager: AudioManager
    let selectedKit: String
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            audioManager.playSample(sampleName: sampleName, kitName: selectedKit)
            withAnimation(.easeInOut(duration: 0.1)) {
                isPressed = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation {
                    isPressed = false
                }
            }
        }) {
            VStack {
                Text(name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                
                if audioManager.hasSample(sampleName: sampleName, kitName: selectedKit) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.system(size: 20))
                } else {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                        .font(.system(size: 20))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 120)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isPressed ? Color.blue.opacity(0.3) : Color(.systemGray5))
            )
            .scaleEffect(isPressed ? 0.95 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Other Views (Placeholders)
struct MixerView: View {
    var body: some View {
        Text("Mixer View")
            .font(.largeTitle)
            .foregroundColor(.secondary)
    }
}

struct MIDIView: View {
    var body: some View {
        Text("MIDI View")
            .font(.largeTitle)
            .foregroundColor(.secondary)
    }
}

struct MetroView: View {
    var body: some View {
        Text("Metro View")
            .font(.largeTitle)
            .foregroundColor(.secondary)
    }
}

// MARK: - Audio Manager
class AudioManager: ObservableObject {
    private var audioPlayers: [String: AVAudioPlayer] = [:]
    private var loadedSamples: Set<String> = []
    
    init() {
        loadAllSamples()
    }
    
    func hasSample(sampleName: String, kitName: String) -> Bool {
        let key = "\(kitName)_\(sampleName)"
        return loadedSamples.contains(key)
    }
    
    func playSample(sampleName: String, kitName: String) {
        let key = "\(kitName)_\(sampleName)"
        
        // Check if already loaded
        if let player = audioPlayers[key] {
            player.currentTime = 0
            player.play()
            return
        }
        
        // Try to load and play
        guard let url = getSampleURL(sampleName: sampleName, kitName: kitName) else {
            print("❌ Sample not found: \(key)")
            return
        }
        
        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.prepareToPlay()
            audioPlayers[key] = player
            player.play()
            print("✅ Playing sample: \(key)")
        } catch {
            print("❌ Error loading sample \(key): \(error.localizedDescription)")
        }
    }
    
    private func getSampleURL(sampleName: String, kitName: String) -> URL? {
        // Try multiple possible locations
        
        // 1. Main bundle resources
        if let url = Bundle.main.url(
            forResource: sampleName,
            withExtension: "wav",
            subdirectory: "Samples/\(kitName)"
        ) {
            return url
        }
        
        // 2. Direct in Samples folder
        if let url = Bundle.main.url(
            forResource: sampleName,
            withExtension: "wav",
            subdirectory: "Samples"
        ) {
            return url
        }
        
        // 3. Root bundle
        if let url = Bundle.main.url(
            forResource: sampleName,
            withExtension: "wav"
        ) {
            return url
        }
        
        // 4. Documents directory (for user-added samples)
        let documentsPath = FileManager.default.urls(
            for: .documentDirectory,
            in: .userDomainMask
        )[0]
        
        let kitPath = documentsPath.appendingPathComponent("Samples/\(kitName)/\(sampleName).wav")
        if FileManager.default.fileExists(atPath: kitPath.path) {
            return kitPath
        }
        
        // 5. Try alternative extensions
        let extensions = ["mp3", "aiff", "m4a", "caf"]
        for ext in extensions {
            if let url = Bundle.main.url(
                forResource: sampleName,
                withExtension: ext,
                subdirectory: "Samples/\(kitName)"
            ) {
                return url
            }
        }
        
        return nil
    }
    
    private func loadAllSamples() {
        let kits = ["Empty Kit", "Acoustic Kit", "Electronic Kit"]
        let samples = [
            "crash_left", "crash_right", "ride", "hihat",
            "snare", "kick", "tom1", "tom2", "tom3",
            "rack1", "rack2", "floor"
        ]
        
        for kit in kits {
            for sample in samples {
                let key = "\(kit)_\(sample)"
                if getSampleURL(sampleName: sample, kitName: kit) != nil {
                    loadedSamples.insert(key)
                    print("✅ Found sample: \(key)")
                } else {
                    print("⚠️ Missing sample: \(key)")
                }
            }
        }
        
        print("📊 Loaded \(loadedSamples.count) samples")
    }
}

// MARK: - Tab Item Enum
enum TabItem: String, CaseIterable {
    case mixer = "Mixer"
    case kit = "Kit"
    case midi = "MIDI"
    case metro = "Metro"
}

// MARK: - Safe Area Preference Keys
struct SafeAreaTopKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

struct SafeAreaBottomKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

