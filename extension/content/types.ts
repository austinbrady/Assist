/**
 * Shared Type Definitions
 * Central location for all shared interfaces used across extension modules
 */

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
  element?: HTMLElement; // Optional for serialization (not included when sending to backend)
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
