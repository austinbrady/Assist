/**
 * Page Analyzer - Analyzes ALL page content (text, images, videos, structure)
 */

export interface PageAnalysis {
  pageType: PageType;
  primaryContent: string;
  textContent: string[];
  images: ImageMetadata[];
  video: VideoMetadata | null;
  forms: FormField[];
  structure: PageStructure;
  activityContext: ActivityContext;
  metadata: PageMetadata;
}

export type PageType = 
  | 'social-media' 
  | 'video' 
  | 'article' 
  | 'form' 
  | 'messaging' 
  | 'gaming' 
  | 'e-commerce'
  | 'other';

export interface ImageMetadata {
  src: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  description?: string;
}

export interface VideoMetadata {
  platform: 'youtube' | 'vimeo' | 'twitch' | 'other';
  url?: string;
  title?: string;
  description?: string;
  currentTime?: number;
  duration?: number;
  videoId?: string;
}

export interface FormField {
  id: string;
  type: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  selector: string;
}

export interface PageStructure {
  title: string;
  headings: string[];
  mainContent: string;
  navigation: string[];
  footer: string;
}

export interface ActivityContext {
  userActivity: 'reading' | 'watching' | 'typing' | 'scrolling' | 'idle';
  focusedElement: Element | null;
  scrollPosition: number;
  viewportContent: string;
}

export interface PageMetadata {
  url: string;
  title: string;
  description?: string;
  timestamp: Date;
}

class PageAnalyzer {
  /**
   * Analyze the entire page
   */
  analyze(): PageAnalysis {
    const pageType = this.detectPageType();
    const textContent = this.extractTextContent();
    const primaryContent = this.extractPrimaryContent();
    const images = this.extractImages();
    const video = this.extractVideo();
    const forms = this.extractForms();
    const structure = this.extractStructure();
    const activityContext = this.getActivityContext();
    const metadata = this.getMetadata();

    return {
      pageType,
      primaryContent,
      textContent,
      images,
      video,
      forms,
      structure,
      activityContext,
      metadata,
    };
  }

  /**
   * Detect page type based on URL, structure, and content
   */
  private detectPageType(): PageType {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    // Social media
    if (hostname.includes('twitter.com') || hostname.includes('x.com') ||
        hostname.includes('facebook.com') || hostname.includes('linkedin.com') ||
        hostname.includes('instagram.com') || hostname.includes('reddit.com')) {
      return 'social-media';
    }

    // Video platforms
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be') ||
        hostname.includes('vimeo.com') || hostname.includes('twitch.tv')) {
      return 'video';
    }

    // Messaging
    if (hostname.includes('whatsapp.com') || hostname.includes('discord.com') ||
        hostname.includes('slack.com') || hostname.includes('telegram.org') ||
        hostname.includes('messenger.com')) {
      return 'messaging';
    }

    // Gaming
    if (hostname.includes('steam') || hostname.includes('epicgames') ||
        hostname.includes('roblox') || hostname.includes('game')) {
      return 'gaming';
    }

    // E-commerce
    if (hostname.includes('amazon') || hostname.includes('shopify') ||
        hostname.includes('ebay') || hostname.includes('etsy')) {
      return 'e-commerce';
    }

    // Forms
    const forms = document.querySelectorAll('form');
    if (forms.length > 0 && forms.length < 3) {
      // Likely a form page if there are 1-2 forms
      return 'form';
    }

    // Articles
    const article = document.querySelector('article, [role="article"]');
    const mainContent = document.querySelector('main, [role="main"]');
    if (article || (mainContent && mainContent.textContent && mainContent.textContent.length > 1000)) {
      return 'article';
    }

    return 'other';
  }

  /**
   * Extract all visible text content
   */
  private extractTextContent(): string[] {
    const textElements: string[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and hidden elements
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'meta'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if parent is hidden
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }

          // Only include meaningful text
          const text = node.textContent?.trim();
          if (text && text.length > 3) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text) {
        textElements.push(text);
      }
    }

    return textElements;
  }

  /**
   * Extract primary content (main article, post, etc.)
   */
  private extractPrimaryContent(): string {
    // Try to find main content areas
    const selectors = [
      'article',
      '[role="article"]',
      'main',
      '[role="main"]',
      '.post',
      '.content',
      '.main-content',
      '#content',
      '#main',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.length > 100) {
          return text.substring(0, 5000); // Limit to 5000 chars
        }
      }
    }

    // Fallback: get body text
    const bodyText = document.body.textContent?.trim() || '';
    return bodyText.substring(0, 5000);
  }

  /**
   * Extract images from page
   */
  private extractImages(): ImageMetadata[] {
    const images: ImageMetadata[] = [];
    const imgElements = document.querySelectorAll('img');

    imgElements.forEach((img) => {
      // Skip very small images (likely icons)
      if (img.width < 50 || img.height < 50) {
        return;
      }

      // Skip data URIs (likely icons/sprites)
      if (img.src.startsWith('data:')) {
        return;
      }

      images.push({
        src: img.src,
        alt: img.alt || undefined,
        title: img.title || undefined,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    });

    return images;
  }

  /**
   * Extract video information
   */
  private extractVideo(): VideoMetadata | null {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = this.extractYouTubeVideoId(url);
      const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.ytd-video-primary-info-renderer');
      const title = titleElement?.textContent?.trim() || undefined;
      
      const videoElement = document.querySelector('video');
      const currentTime = videoElement ? videoElement.currentTime : undefined;
      const duration = videoElement ? videoElement.duration : undefined;

      return {
        platform: 'youtube',
        url,
        title,
        videoId,
        currentTime,
        duration,
      };
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      const titleElement = document.querySelector('h1');
      const title = titleElement?.textContent?.trim() || undefined;
      
      const videoElement = document.querySelector('video');
      const currentTime = videoElement ? videoElement.currentTime : undefined;
      const duration = videoElement ? videoElement.duration : undefined;

      return {
        platform: 'vimeo',
        url,
        title,
        currentTime,
        duration,
      };
    }

    // Twitch
    if (hostname.includes('twitch.tv')) {
      const titleElement = document.querySelector('h2[data-a-target="stream-title"]');
      const title = titleElement?.textContent?.trim() || undefined;

      return {
        platform: 'twitch',
        url,
        title,
      };
    }

    // Generic video element
    const videoElement = document.querySelector('video');
    if (videoElement) {
      return {
        platform: 'other',
        url: videoElement.src || url,
        currentTime: videoElement.currentTime,
        duration: videoElement.duration,
      };
    }

    return null;
  }

  private extractYouTubeVideoId(url: string): string | undefined {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : undefined;
  }

  /**
   * Extract form fields
   */
  private extractForms(): FormField[] {
    const fields: FormField[] = [];
    const formElements = document.querySelectorAll('input, textarea, select');

    formElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const id = element.id || `field-${index}`;
      const name = (element as HTMLInputElement).name || undefined;
      const type = (element as HTMLInputElement).type || tagName;
      const placeholder = (element as HTMLInputElement).placeholder || undefined;
      const value = (element as HTMLInputElement).value || undefined;
      const required = (element as HTMLInputElement).required || false;

      // Find label
      let label: string | undefined;
      if (element.id) {
        const labelElement = document.querySelector(`label[for="${element.id}"]`);
        label = labelElement?.textContent?.trim() || undefined;
      }

      // If no label, try to find nearby text
      if (!label) {
        const parent = element.parentElement;
        if (parent) {
          const labelCandidate = parent.querySelector('label');
          label = labelCandidate?.textContent?.trim() || undefined;
        }
      }

      fields.push({
        id,
        type,
        name,
        label,
        placeholder,
        value,
        required,
        selector: this.generateSelector(element),
      });
    });

    return fields;
  }

  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }
    return element.tagName.toLowerCase();
  }

  /**
   * Extract page structure
   */
  private extractStructure(): PageStructure {
    const title = document.title;
    const headings: string[] = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headingElements.forEach((h) => {
      const text = h.textContent?.trim();
      if (text) {
        headings.push(text);
      }
    });

    const mainContent = this.extractPrimaryContent();
    
    const navigation: string[] = [];
    const navElements = document.querySelectorAll('nav a, [role="navigation"] a');
    navElements.forEach((a) => {
      const text = a.textContent?.trim();
      if (text) {
        navigation.push(text);
      }
    });

    const footer = document.querySelector('footer')?.textContent?.trim() || '';

    return {
      title,
      headings,
      mainContent,
      navigation,
      footer,
    };
  }

  /**
   * Get current activity context
   */
  private getActivityContext(): ActivityContext {
    const focusedElement = document.activeElement;
    const scrollPosition = window.scrollY;
    
    // Determine user activity
    let userActivity: ActivityContext['userActivity'] = 'idle';
    if (focusedElement && (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA')) {
      userActivity = 'typing';
    } else if (document.querySelector('video:not([paused])')) {
      userActivity = 'watching';
    } else if (scrollPosition > 100) {
      userActivity = 'scrolling';
    } else {
      userActivity = 'reading';
    }

    // Get viewport content (what's currently visible)
    const viewportHeight = window.innerHeight;
    const viewportElements: string[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      const rect = (node.parentElement as Element)?.getBoundingClientRect();
      if (rect && rect.top >= 0 && rect.top < viewportHeight) {
        const text = node.textContent?.trim();
        if (text && text.length > 10) {
          viewportElements.push(text);
        }
      }
    }

    return {
      userActivity,
      focusedElement,
      scrollPosition,
      viewportContent: viewportElements.join(' ').substring(0, 1000),
    };
  }

  /**
   * Get page metadata
   */
  private getMetadata(): PageMetadata {
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');

    return {
      url: window.location.href,
      title: document.title,
      description: metaDescription || undefined,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const pageAnalyzer = new PageAnalyzer();
