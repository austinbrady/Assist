/**
 * Context Extractor - Builds rich context objects from page analysis
 */

import { PageAnalysis, PageType } from './page-analyzer';
import { ImageMetadata, VideoMetadata, FormField } from './types';

export interface PageContext {
  pageType: PageType;
  primaryContent: string;
  url: string;
  pageTitle: string;
  images?: ImageMetadata[];
  video?: VideoMetadata | null;
  forms?: FormField[];
  userActivity: 'reading' | 'watching' | 'typing' | 'scrolling' | 'idle';
  focusedElement: Element | null;
  timestamp: Date;
}


export interface ContextSummary {
  summary: string;
  keyPoints: string[];
  suggestedActions: string[];
}

class ContextExtractor {
  /**
   * Extract rich context from page analysis
   */
  extractContext(analysis: PageAnalysis): PageContext {
    return {
      pageType: analysis.pageType,
      primaryContent: this.summarizeContent(analysis.primaryContent),
      url: analysis.metadata.url,
      pageTitle: analysis.metadata.title,
      images: this.summarizeImages(analysis.images),
      video: analysis.video,
      forms: analysis.forms.length > 0 ? analysis.forms : undefined,
      userActivity: analysis.activityContext.userActivity,
      focusedElement: analysis.activityContext.focusedElement,
      timestamp: analysis.metadata.timestamp,
    };
  }

  /**
   * Create a human-readable context summary for AI
   */
  createContextSummary(context: PageContext): string {
    const parts: string[] = [];

    parts.push(`User is on: ${context.pageTitle}`);
    parts.push(`URL: ${context.url}`);
    parts.push(`Page type: ${context.pageType}`);
    parts.push(`Current activity: ${context.userActivity}`);

    if (context.primaryContent) {
      const contentPreview = context.primaryContent.substring(0, 500);
      parts.push(`\nPage content:\n${contentPreview}${context.primaryContent.length > 500 ? '...' : ''}`);
    }

    if (context.video) {
      parts.push(`\nVideo: ${context.video.title || 'Untitled'}`);
      if (context.video.platform === 'youtube') {
        parts.push(`Platform: YouTube`);
      }
      if (context.video.currentTime !== undefined) {
        parts.push(`Current time: ${Math.floor(context.video.currentTime)}s`);
      }
    }

    if (context.forms && context.forms.length > 0) {
      parts.push(`\nForm detected with ${context.forms.length} fields:`);
      context.forms.slice(0, 5).forEach((field, i) => {
        const label = field.label || field.placeholder || field.name || `Field ${i + 1}`;
        parts.push(`  - ${label} (${field.type})${field.required ? ' [required]' : ''}`);
      });
      if (context.forms.length > 5) {
        parts.push(`  ... and ${context.forms.length - 5} more fields`);
      }
    }

    if (context.images && context.images.length > 0) {
      parts.push(`\n${context.images.length} image(s) on page`);
      if (context.images[0]?.alt) {
        parts.push(`Main image: ${context.images[0].alt}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Create a minimal context (for when user wants less context)
   */
  createMinimalContext(context: PageContext): string {
    const parts: string[] = [];
    parts.push(`Page: ${context.pageTitle}`);
    parts.push(`Type: ${context.pageType}`);
    
    if (context.video) {
      parts.push(`Watching: ${context.video.title || 'video'}`);
    }
    
    if (context.forms && context.forms.length > 0) {
      parts.push(`Form with ${context.forms.length} fields`);
    }

    return parts.join(' | ');
  }

  /**
   * Create a detailed context (for when user wants more context)
   */
  createDetailedContext(context: PageContext, analysis: PageAnalysis): string {
    const summary = this.createContextSummary(context);
    const parts: string[] = [summary];

    // Add structure information
    if (analysis.structure.headings.length > 0) {
      parts.push(`\nPage structure:`);
      analysis.structure.headings.slice(0, 10).forEach((heading, i) => {
        parts.push(`  ${i + 1}. ${heading}`);
      });
    }

    // Add more text content
    if (analysis.textContent.length > 0) {
      parts.push(`\nAdditional content snippets:`);
      analysis.textContent.slice(0, 10).forEach((text, i) => {
        if (text.length > 50) {
          parts.push(`  - ${text.substring(0, 100)}...`);
        }
      });
    }

    // Add viewport content
    if (analysis.activityContext.viewportContent) {
      parts.push(`\nCurrently visible content:`);
      parts.push(analysis.activityContext.viewportContent.substring(0, 500));
    }

    return parts.join('\n');
  }

  /**
   * Summarize content (remove noise, keep important parts)
   */
  private summarizeContent(content: string): string {
    // Remove excessive whitespace
    let summarized = content.replace(/\s+/g, ' ').trim();
    
    // Limit length
    if (summarized.length > 2000) {
      summarized = summarized.substring(0, 2000) + '...';
    }

    return summarized;
  }

  /**
   * Summarize images (keep only relevant ones)
   */
  private summarizeImages(images: ImageMetadata[]): ImageMetadata[] {
    // Filter out very small images, icons, etc.
    return images
      .filter(img => {
        // Keep images with alt text (likely important)
        if (img.alt && img.alt.length > 3) {
          return true;
        }
        // Keep larger images
        if (img.width && img.height && img.width > 200 && img.height > 200) {
          return true;
        }
        return false;
      })
      .slice(0, 5); // Limit to 5 most relevant images
  }

  /**
   * Get suggested actions based on context
   */
  getSuggestedActions(context: PageContext): string[] {
    const actions: string[] = [];

    switch (context.pageType) {
      case 'social-media':
        actions.push('Help me respond to this post');
        actions.push('Analyze this post');
        actions.push('Suggest a comment');
        break;
      
      case 'video':
        actions.push('What is this video about?');
        actions.push('Summarize this video');
        actions.push('Help me understand this');
        break;
      
      case 'messaging':
        actions.push('Help me respond');
        actions.push('Suggest a reply');
        actions.push('Make this more professional');
        break;
      
      case 'form':
        actions.push('Fill this form for me');
        actions.push('Help me complete this');
        actions.push('What information do I need?');
        break;
      
      case 'article':
        actions.push('Summarize this article');
        actions.push('What are the key points?');
        actions.push('Explain this to me');
        break;
      
      case 'e-commerce':
        actions.push('Is this a good deal?');
        actions.push('Compare with alternatives');
        actions.push('What should I know about this?');
        break;
      
      default:
        actions.push('Help me with this page');
        actions.push('What can you tell me about this?');
    }

    return actions;
  }
}

// Export singleton instance
export const contextExtractor = new ContextExtractor();
