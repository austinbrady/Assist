//
//  LayoutFixes.swift
//  Simplified Layout Fixes for Header and Footer
//

import SwiftUI

// MARK: - Simplified Content View with Fixed Layout
struct FixedLayoutContentView: View {
    @State private var selectedTab: TabItem = .kit
    
    var body: some View {
        // Use ZStack with proper safe area handling
        ZStack(alignment: .top) {
            // Main content
            VStack(spacing: 0) {
                // Header - Fixed to top
                FixedHeaderView()
                    .zIndex(1)
                
                // Main content area - fills remaining space
                Group {
                    switch selectedTab {
                    case .kit:
                        KitView()
                    case .mixer:
                        MixerView()
                    case .midi:
                        MIDIView()
                    case .metro:
                        MetroView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Footer - Fixed to bottom
                FixedFooterView(selectedTab: $selectedTab)
                    .zIndex(1)
            }
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
    }
}

// MARK: - Fixed Header View
struct FixedHeaderView: View {
    @State private var selectedKit = "Empty Kit"
    
    var body: some View {
        VStack(spacing: 0) {
            // Header content
            HStack(spacing: 16) {
                // Gear icon
                Button(action: {}) {
                    Image(systemName: "gearshape.fill")
                        .font(.system(size: 20))
                }
                
                // KIT label
                Text("KIT")
                    .font(.system(size: 24, weight: .bold))
                
                Spacer()
                
                // Kit dropdown
                Menu {
                    Button("Empty Kit") { selectedKit = "Empty Kit" }
                    Button("Acoustic Kit") { selectedKit = "Acoustic Kit" }
                } label: {
                    HStack(spacing: 4) {
                        Text(selectedKit)
                            .font(.system(size: 16, weight: .medium))
                        Image(systemName: "chevron.down")
                            .font(.system(size: 12))
                    }
                }
                
                // User icon
                Button(action: {}) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 24))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemBackground))
        }
        .safeAreaInset(edge: .top) {
            Color.clear.frame(height: 0)
        }
    }
}

// MARK: - Fixed Footer View
struct FixedFooterView: View {
    @Binding var selectedTab: TabItem
    
    var body: some View {
        VStack(spacing: 0) {
            Divider()
            
            HStack(spacing: 0) {
                TabButton(item: .mixer, selectedTab: $selectedTab, icon: "slider.horizontal.3", label: "Mixer")
                TabButton(item: .kit, selectedTab: $selectedTab, icon: "square.grid.2x2", label: "Kit")
                TabButton(item: .midi, selectedTab: $selectedTab, icon: "music.note", label: "MIDI")
                TabButton(item: .metro, selectedTab: $selectedTab, icon: "metronome", label: "Metro")
            }
            .padding(.top, 8)
            .background(Color(.systemBackground))
        }
        .safeAreaInset(edge: .bottom) {
            Color.clear.frame(height: 0)
        }
    }
}

// MARK: - Alternative: Using GeometryReader Approach
struct GeometryReaderLayoutView: View {
    @State private var selectedTab: TabItem = .kit
    
    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                // Header with safe area padding
                HeaderView()
                    .padding(.top, geometry.safeAreaInsets.top)
                    .background(Color(.systemBackground))
                
                // Main content
                KitView()
                    .frame(
                        width: geometry.size.width,
                        height: geometry.size.height - 
                                (60 + geometry.safeAreaInsets.top) - 
                                (60 + geometry.safeAreaInsets.bottom)
                    )
                
                // Footer with safe area padding
                FooterView(selectedTab: $selectedTab)
                    .padding(.bottom, geometry.safeAreaInsets.bottom)
                    .background(Color(.systemBackground))
            }
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
    }
}

// MARK: - Key Points for Layout Fixes

/*
 HEADER FIX:
 1. Use VStack(spacing: 0) to prevent unwanted spacing
 2. Add .padding(.top, safeAreaInsets.top) to respect status bar
 3. Use .background() to extend color into safe area
 4. Ensure header is first element in VStack

 FOOTER FIX:
 1. Place footer as last element in VStack
 2. Add .padding(.bottom, safeAreaInsets.bottom) for home indicator
 3. Use .frame(maxHeight: .infinity) on main content to fill space
 4. Ensure VStack uses spacing: 0

 MAIN CONTENT FIX:
 1. Use .frame(maxWidth: .infinity, maxHeight: .infinity)
 2. Calculate height: totalHeight - headerHeight - footerHeight - safeAreas
 3. Use ScrollView if content exceeds available space
 */

