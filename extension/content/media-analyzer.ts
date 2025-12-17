/**
 * Media Analyzer - Analyzes images and videos on page
 */

export interface ImageAnalysis {
  src: string;
  description?: string;
  textContent?: string; // OCR text if any
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface VideoAnalysis {
  platform: string;
  title?: string;
  description?: string;
  currentTime?: number;
  duration?: number;
  transcript?: string;
  metadata?: VideoMetadata;
}

export interface VideoMetadata {
  platform: 'youtube' | 'vimeo' | 'twitch' | 'other';
  url?: string;
  videoId?: string;
}

class MediaAnalyzer {
  /**
   * Analyze an image by sending it to backend for vision model analysis
   */
  async analyzeImage(imageSrc: string, metadata?: ImageMetadata): Promise<ImageAnalysis> {
    try {
      // First, try to get the image as base64
      const base64 = await this.imageToBase64(imageSrc);
      if (!base64) {
        return {
          src: imageSrc,
          metadata,
        };
      }

      // Send to backend for analysis
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_IMAGE',
        payload: {
          imageBase64: base64,
          src: imageSrc,
        },
      });

      if (response && response.description) {
        return {
          src: imageSrc,
          description: response.description,
          metadata,
        };
      }

      return {
        src: imageSrc,
        metadata,
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        src: imageSrc,
        metadata,
      };
    }
  }

  /**
   * Convert image URL to base64
   */
  private async imageToBase64(imageSrc: string): Promise<string | null> {
    try {
      // If it's a data URL, return as is
      if (imageSrc.startsWith('data:')) {
        return imageSrc;
      }

      // Fetch the image
      const response = await fetch(imageSrc);
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  }

  /**
   * Analyze video metadata
   */
  analyzeVideo(videoElement?: HTMLVideoElement): VideoAnalysis | null {
    if (!videoElement) {
      return null;
    }

    const url = window.location.href;
    const platform = this.detectVideoPlatform(url);

    return {
      platform,
      currentTime: videoElement.currentTime,
      duration: videoElement.duration,
      metadata: {
        platform: platform as any,
        url,
      },
    };
  }

  /**
   * Detect video platform from URL
   */
  private detectVideoPlatform(url: string): string {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (hostname.includes('twitch.tv')) {
      return 'twitch';
    }

    return 'other';
  }

  /**
   * Extract YouTube video metadata
   */
  extractYouTubeMetadata(): VideoAnalysis | null {
    const hostname = window.location.hostname.toLowerCase();
    if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
      return null;
    }

    const videoId = this.extractYouTubeVideoId(window.location.href);
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.ytd-video-primary-info-renderer');
    const title = titleElement?.textContent?.trim() || undefined;

    const descriptionElement = document.querySelector('#description-text');
    const description = descriptionElement?.textContent?.trim() || undefined;

    const videoElement = document.querySelector('video');
    const currentTime = videoElement ? videoElement.currentTime : undefined;
    const duration = videoElement ? videoElement.duration : undefined;

    return {
      platform: 'youtube',
      title,
      description,
      currentTime,
      duration,
      metadata: {
        platform: 'youtube',
        url: window.location.href,
        videoId,
      },
    };
  }

  private extractYouTubeVideoId(url: string): string | undefined {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : undefined;
  }

  /**
   * Capture current video frame as image
   */
  async captureVideoFrame(videoElement: HTMLVideoElement): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing video frame:', error);
      return null;
    }
  }
}

// Export singleton instance
export const mediaAnalyzer = new MediaAnalyzer();
