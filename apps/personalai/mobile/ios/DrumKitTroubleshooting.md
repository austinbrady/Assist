# Drum Kit App - Troubleshooting Guide

## Issue 1: Header Bar Behind Status Bar

### Problem
Header bar is tucked behind the status bar and appears squished vertically.

### Solution
The fix uses:
- `.ignoresSafeArea()` with proper edges
- GeometryReader to respect safe area insets
- Proper VStack layout with spacing: 0
- Background color extension to cover safe area

### Key Code Changes:
```swift
VStack(spacing: 0) {
    HeaderView()
        .background(Color(.systemBackground))
        // Header content here
}
.ignoresSafeArea(.container, edges: .top)
```

## Issue 2: Footer Tab Bar Not Pinned to Bottom

### Problem
Footer tab bar is squished in the center instead of being pinned to the bottom.

### Solution
- Use VStack with spacing: 0
- Place footer at the bottom of VStack
- Use GeometryReader to handle safe area insets
- Ensure main content uses `.frame(maxHeight: .infinity)`

### Key Code Changes:
```swift
VStack(spacing: 0) {
    // Main content
    KitView()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    
    // Footer at bottom
    FooterView()
        .background(Color(.systemBackground))
}
```

## Issue 3: Audio Samples Not Loading

### Problem
"No samples found" even though kit is set to "Empty Kit".

### Troubleshooting Steps:

#### 1. Check File Structure
Ensure your Xcode project has the following structure:
```
YourApp/
├── Samples/
│   ├── Empty Kit/
│   │   ├── crash_left.wav
│   │   ├── crash_right.wav
│   │   ├── ride.wav
│   │   └── ...
│   ├── Acoustic Kit/
│   └── Electronic Kit/
```

#### 2. Verify Files Are in Bundle
1. Select your sample files in Xcode
2. In File Inspector (right panel), check "Target Membership"
3. Ensure your app target is checked

#### 3. Check File Names
- Use lowercase with underscores: `crash_left.wav`
- Avoid spaces in filenames
- Supported formats: `.wav`, `.mp3`, `.aiff`, `.m4a`, `.caf`

#### 4. Test Sample Loading
Add this debug code to check what's available:
```swift
func debugBundleContents() {
    if let resourcePath = Bundle.main.resourcePath {
        let samplesPath = (resourcePath as NSString).appendingPathComponent("Samples")
        print("📁 Samples path: \(samplesPath)")
        
        if let contents = try? FileManager.default.contentsOfDirectory(atPath: samplesPath) {
            print("📂 Contents: \(contents)")
        }
    }
}
```

#### 5. Alternative: Load from Documents Directory
If samples aren't in bundle, load from Documents:
```swift
let documentsPath = FileManager.default.urls(
    for: .documentDirectory,
    in: .userDomainMask
)[0]
let samplePath = documentsPath.appendingPathComponent("Samples/Empty Kit/crash_left.wav")
```

#### 6. Check AVAudioSession
Ensure audio session is configured:
```swift
do {
    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
    try AVAudioSession.sharedInstance().setActive(true)
} catch {
    print("Failed to set up audio session: \(error)")
}
```

#### 7. Verify File Permissions
- Check Info.plist for required permissions
- For user-added samples, request file access permissions

## Common Audio Loading Issues

### Issue: "File not found"
**Solution**: Check file path and ensure files are added to target

### Issue: "Format not supported"
**Solution**: Convert to WAV or AIFF format

### Issue: "Permission denied"
**Solution**: Add file access permissions to Info.plist

### Issue: "Audio won't play"
**Solution**: 
1. Check AVAudioSession configuration
2. Ensure device isn't in silent mode
3. Check volume level
4. Verify audio player is retained (not deallocated)

## Testing Checklist

- [ ] Files are in Xcode project
- [ ] Files have correct target membership
- [ ] File names match code exactly (case-sensitive)
- [ ] File extensions are correct
- [ ] AVAudioSession is configured
- [ ] Audio players are retained (not deallocated)
- [ ] Device volume is up
- [ ] Device is not in silent mode
- [ ] Test on physical device (simulator may have audio issues)

## Quick Fix: Add Sample Files to Project

1. Create `Samples` folder in your Xcode project
2. Add sample files to the folder
3. In Xcode, right-click project → "Add Files to [Project]"
4. Select your Samples folder
5. Check "Copy items if needed"
6. Check your app target
7. Click "Add"

## Alternative: Programmatic Sample Loading

If samples are downloaded or generated:
```swift
func downloadAndSaveSample(url: URL, sampleName: String, kitName: String) {
    let documentsPath = FileManager.default.urls(
        for: .documentDirectory,
        in: .userDomainMask
    )[0]
    
    let kitFolder = documentsPath.appendingPathComponent("Samples/\(kitName)")
    try? FileManager.default.createDirectory(at: kitFolder, withIntermediateDirectories: true)
    
    let destination = kitFolder.appendingPathComponent("\(sampleName).wav")
    
    URLSession.shared.downloadTask(with: url) { location, response, error in
        guard let location = location else { return }
        try? FileManager.default.moveItem(at: location, to: destination)
    }.resume()
}
```

