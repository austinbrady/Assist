/**
 * Video Detection Utility
 * Detects embedded video players (YouTube, Vimeo, HTML5) and extracts metadata
 */

export interface VideoInfo {
  platform: 'youtube' | 'vimeo' | 'html5' | 'unknown'
  videoId?: string
  title?: string
  channel?: string
  currentTime?: number
  duration?: number
  isPlaying: boolean
  url?: string
}

/**
 * Extract YouTube video ID from iframe src
 */
function extractYouTubeId(src: string): string | null {
  const patterns = [
    /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&\s?#]+)/,
    /youtube\.com\/v\/([^&\s?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = src.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

/**
 * Extract Vimeo video ID from iframe src
 */
function extractVimeoId(src: string): string | null {
  const match = src.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

/**
 * Detect YouTube iframe and extract info
 */
function detectYouTube(iframe: HTMLIFrameElement): VideoInfo | null {
  const src = iframe.src || ''
  const videoId = extractYouTubeId(src)
  
  if (!videoId) return null
  
  // Try to get title from iframe title attribute or parent
  let title: string | undefined
  if (iframe.title) {
    title = iframe.title
  } else {
    const parent = iframe.closest('[title]')
    if (parent) {
      title = parent.getAttribute('title') || undefined
    }
  }
  
  // Try to get channel from data attributes or parent
  let channel: string | undefined
  const channelAttr = iframe.getAttribute('data-channel') || 
                      iframe.closest('[data-channel]')?.getAttribute('data-channel')
  if (channelAttr) {
    channel = channelAttr
  }
  
  return {
    platform: 'youtube',
    videoId,
    title: title || `YouTube Video ${videoId}`,
    channel,
    isPlaying: false, // Can't reliably detect without API
    url: `https://www.youtube.com/watch?v=${videoId}`,
  }
}

/**
 * Detect Vimeo iframe and extract info
 */
function detectVimeo(iframe: HTMLIFrameElement): VideoInfo | null {
  const src = iframe.src || ''
  const videoId = extractVimeoId(src)
  
  if (!videoId) return null
  
  let title: string | undefined
  if (iframe.title) {
    title = iframe.title
  } else {
    const parent = iframe.closest('[title]')
    if (parent) {
      title = parent.getAttribute('title') || undefined
    }
  }
  
  return {
    platform: 'vimeo',
    videoId,
    title: title || `Vimeo Video ${videoId}`,
    isPlaying: false,
    url: `https://vimeo.com/${videoId}`,
  }
}

/**
 * Detect HTML5 video element
 */
function detectHTML5Video(video: HTMLVideoElement): VideoInfo {
  return {
    platform: 'html5',
    title: video.title || video.getAttribute('data-title') || 'Video',
    currentTime: video.currentTime || 0,
    duration: video.duration || 0,
    isPlaying: !video.paused && !video.ended && video.readyState > 2,
    url: video.src || video.currentSrc || undefined,
  }
}

/**
 * Detect all videos on the page
 */
export function detectVideos(): VideoInfo[] {
  const videos: VideoInfo[] = []
  
  // Detect YouTube iframes
  const iframes = document.querySelectorAll('iframe')
  iframes.forEach((iframe) => {
    const src = iframe.src || ''
    
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      const info = detectYouTube(iframe)
      if (info) videos.push(info)
    } else if (src.includes('vimeo.com')) {
      const info = detectVimeo(iframe)
      if (info) videos.push(info)
    }
  })
  
  // Detect HTML5 video elements
  const videoElements = document.querySelectorAll('video')
  videoElements.forEach((video) => {
    if (video.offsetParent !== null) { // Only visible videos
      videos.push(detectHTML5Video(video))
    }
  })
  
  return videos
}

/**
 * Get the primary/active video (first visible video)
 */
export function getActiveVideo(): VideoInfo | null {
  const videos = detectVideos()
  return videos.length > 0 ? videos[0] : null
}
