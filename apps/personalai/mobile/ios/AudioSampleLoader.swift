//
//  AudioSampleLoader.swift
//  Enhanced Audio Sample Loading with Error Handling
//

import Foundation
import AVFoundation

class AudioSampleLoader {
    static let shared = AudioSampleLoader()
    
    private var audioPlayers: [String: AVAudioPlayer] = [:]
    private var loadedSamples: [String: URL] = [:]
    private var loadingErrors: [String: Error] = [:]
    
    init() {
        configureAudioSession()
        scanForSamples()
    }
    
    // MARK: - Audio Session Configuration
    private func configureAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try audioSession.setActive(true)
            print("✅ Audio session configured successfully")
        } catch {
            print("❌ Failed to configure audio session: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Sample Scanning
    func scanForSamples() {
        print("\n🔍 Scanning for audio samples...")
        
        let kits = ["Empty Kit", "Acoustic Kit", "Electronic Kit"]
        let samples = [
            "crash_left", "crash_right", "ride", "hihat",
            "snare", "kick", "tom1", "tom2", "tom3",
            "rack1", "rack2", "floor"
        ]
        
        var foundCount = 0
        var missingCount = 0
        
        for kit in kits {
            for sample in samples {
                let key = "\(kit)_\(sample)"
                
                if let url = findSampleURL(sampleName: sample, kitName: kit) {
                    loadedSamples[key] = url
                    foundCount += 1
                    print("✅ Found: \(key)")
                } else {
                    missingCount += 1
                    print("⚠️ Missing: \(key)")
                }
            }
        }
        
        print("\n📊 Scan Results:")
        print("   Found: \(foundCount)")
        print("   Missing: \(missingCount)")
        print("   Total: \(foundCount + missingCount)\n")
    }
    
    // MARK: - Sample URL Finding
    func findSampleURL(sampleName: String, kitName: String) -> URL? {
        let key = "\(kitName)_\(sampleName)"
        
        // Check cache first
        if let cachedURL = loadedSamples[key] {
            return cachedURL
        }
        
        // Search locations in priority order
        let searchLocations: [(String, () -> URL?)] = [
            ("Bundle - Kit Subdirectory", {
                Bundle.main.url(
                    forResource: sampleName,
                    withExtension: "wav",
                    subdirectory: "Samples/\(kitName)"
                )
            }),
            ("Bundle - Samples Root", {
                Bundle.main.url(
                    forResource: sampleName,
                    withExtension: "wav",
                    subdirectory: "Samples"
                )
            }),
            ("Bundle - Root", {
                Bundle.main.url(
                    forResource: sampleName,
                    withExtension: "wav"
                )
            }),
            ("Documents - Kit Subdirectory", {
                let documentsPath = FileManager.default.urls(
                    for: .documentDirectory,
                    in: .userDomainMask
                )[0]
                let url = documentsPath
                    .appendingPathComponent("Samples/\(kitName)/\(sampleName).wav")
                return FileManager.default.fileExists(atPath: url.path) ? url : nil
            }),
            ("Documents - Samples Root", {
                let documentsPath = FileManager.default.urls(
                    for: .documentDirectory,
                    in: .userDomainMask
                )[0]
                let url = documentsPath
                    .appendingPathComponent("Samples/\(sampleName).wav")
                return FileManager.default.fileExists(atPath: url.path) ? url : nil
            })
        ]
        
        // Try alternative extensions
        let extensions = ["wav", "mp3", "aiff", "m4a", "caf"]
        
        for ext in extensions {
            for (location, finder) in searchLocations {
                if let url = finder() {
                    // Verify file exists and is readable
                    if FileManager.default.fileExists(atPath: url.path) {
                        loadedSamples[key] = url
                        print("✅ Found \(key) at \(location) with .\(ext)")
                        return url
                    }
                }
            }
        }
        
        return nil
    }
    
    // MARK: - Sample Loading
    func loadSample(sampleName: String, kitName: String) -> AVAudioPlayer? {
        let key = "\(kitName)_\(sampleName)"
        
        // Check if already loaded
        if let player = audioPlayers[key] {
            return player
        }
        
        // Find URL
        guard let url = findSampleURL(sampleName: sampleName, kitName: kitName) else {
            print("❌ Sample not found: \(key)")
            return nil
        }
        
        // Load audio player
        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.prepareToPlay()
            audioPlayers[key] = player
            print("✅ Loaded sample: \(key)")
            return player
        } catch {
            loadingErrors[key] = error
            print("❌ Error loading \(key): \(error.localizedDescription)")
            return nil
        }
    }
    
    // MARK: - Sample Playback
    func playSample(sampleName: String, kitName: String) {
        let key = "\(kitName)_\(sampleName)"
        
        // Try to get existing player or load new one
        var player = audioPlayers[key]
        if player == nil {
            player = loadSample(sampleName: sampleName, kitName: kitName)
        }
        
        guard let player = player else {
            print("❌ Cannot play sample: \(key)")
            return
        }
        
        // Play sample
        player.currentTime = 0
        if player.play() {
            print("▶️ Playing: \(key)")
        } else {
            print("❌ Failed to play: \(key)")
        }
    }
    
    // MARK: - Sample Status
    func hasSample(sampleName: String, kitName: String) -> Bool {
        let key = "\(kitName)_\(sampleName)"
        return loadedSamples[key] != nil
    }
    
    func getSampleError(sampleName: String, kitName: String) -> Error? {
        let key = "\(kitName)_\(sampleName)"
        return loadingErrors[key]
    }
    
    // MARK: - Debug Information
    func printDebugInfo() {
        print("\n📊 Audio Sample Loader Debug Info:")
        print("   Loaded samples: \(loadedSamples.count)")
        print("   Cached players: \(audioPlayers.count)")
        print("   Errors: \(loadingErrors.count)")
        
        if !loadedSamples.isEmpty {
            print("\n✅ Available samples:")
            for (key, url) in loadedSamples.sorted(by: { $0.key < $1.key }) {
                print("   \(key): \(url.lastPathComponent)")
            }
        }
        
        if !loadingErrors.isEmpty {
            print("\n❌ Loading errors:")
            for (key, error) in loadingErrors {
                print("   \(key): \(error.localizedDescription)")
            }
        }
        
        // Print bundle contents
        if let resourcePath = Bundle.main.resourcePath {
            print("\n📁 Bundle resource path: \(resourcePath)")
            
            let samplesPath = (resourcePath as NSString).appendingPathComponent("Samples")
            if FileManager.default.fileExists(atPath: samplesPath) {
                if let contents = try? FileManager.default.contentsOfDirectory(atPath: samplesPath) {
                    print("📂 Samples directory contents:")
                    for item in contents {
                        print("   - \(item)")
                    }
                }
            } else {
                print("⚠️ Samples directory not found in bundle")
            }
        }
        
        print()
    }
    
    // MARK: - Cleanup
    func clearCache() {
        audioPlayers.removeAll()
        print("🗑️ Cleared audio player cache")
    }
}

