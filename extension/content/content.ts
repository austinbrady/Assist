/**
 * Content Script Entry Point
 * Injects floating widget and initializes page analysis
 */

import { pageAnalyzer } from './page-analyzer';
import { contextExtractor, PageContext } from './context-extractor';
import { formAnalyzer } from './form-analyzer';

let widgetContainer: HTMLElement | null = null;
let currentContext: PageContext | null = null;
let pageAnalysisInterval: ReturnType<typeof setTimeout> | null = null;

/**
 * Inject floating widget by loading the widget bundle
 */
async function injectFloatingWidget(pageContext?: PageContext, suggestedActions?: string[]): Promise<HTMLElement> {
  // Remove existing widget if any
  const existing = document.getElementById('assist-floating-widget');
  if (existing) {
    existing.remove();
  }

  // Create container
  const container = document.createElement('div');
  container.id = 'assist-floating-widget';
  document.body.appendChild(container);

  // Load widget bundle script
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if ((window as any).__assistWidgetLoaded) {
      // Widget already loaded, just trigger init
      if (pageContext) {
        container.setAttribute('data-context', JSON.stringify(pageContext));
      }
      if (suggestedActions) {
        container.setAttribute('data-actions', JSON.stringify(suggestedActions));
      }
      
      const event = new CustomEvent('assist-init-widget', {
        detail: { pageContext, suggestedActions }
      });
      container.dispatchEvent(event);
      resolve(container);
      return;
    }

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('content/floating-widget.js');
    script.onload = () => {
      (window as any).__assistWidgetLoaded = true;
      // Widget bundle will initialize itself
      // Pass context via data attributes
      if (pageContext) {
        container.setAttribute('data-context', JSON.stringify(pageContext));
      }
      if (suggestedActions) {
        container.setAttribute('data-actions', JSON.stringify(suggestedActions));
      }
      
      // Trigger widget initialization
      const event = new CustomEvent('assist-init-widget', {
        detail: { pageContext, suggestedActions }
      });
      container.dispatchEvent(event);
      
      resolve(container);
    };
    script.onerror = () => {
      reject(new Error('Failed to load widget script'));
    };
    (document.head || document.documentElement).appendChild(script);
  });
}

/**
 * Initialize extension on page
 */
async function initialize() {
  // Check if widget should be shown (user preference)
  const settings = await chrome.storage.sync.get(['showWidget', 'autoContext']);
  const showWidget = settings.showWidget !== false; // Default to true
  const autoContext = settings.autoContext !== false; // Default to true

  if (!showWidget) {
    return;
  }

  // Analyze page
  const analysis = pageAnalyzer.analyze();
  const context = contextExtractor.extractContext(analysis);
  currentContext = context;

  // Get suggested actions
  const suggestedActions = contextExtractor.getSuggestedActions(context);

  // Inject widget
  try {
    widgetContainer = await injectFloatingWidget(autoContext ? context : undefined, suggestedActions);
  } catch (error) {
    console.error('Failed to inject widget:', error);
  }

  // Set up page monitoring for dynamic content
  setupPageMonitoring();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open for async
  });
}

/**
 * Set up monitoring for page changes (SPA navigation, dynamic content)
 */
let domObserver: MutationObserver | null = null;

function setupPageMonitoring() {
  // Clean up existing observer if any
  if (domObserver) {
    domObserver.disconnect();
  }

  // Monitor DOM changes
  domObserver = new MutationObserver(() => {
    // Debounce updates
    if (pageAnalysisInterval) {
      clearTimeout(pageAnalysisInterval);
    }

    pageAnalysisInterval = window.setTimeout(() => {
      updateContext();
    }, 1000);
  });

  if (document.body) {
    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Update context when page changes
 */
async function updateContext() {
  const analysis = pageAnalyzer.analyze();
  const context = contextExtractor.extractContext(analysis);
  currentContext = context;

  // Update widget if it exists
  if (widgetContainer) {
    const suggestedActions = contextExtractor.getSuggestedActions(context);
    // Notify widget of context update
    const event = new CustomEvent('assist-update-context', {
      detail: { context, suggestedActions }
    });
    widgetContainer.dispatchEvent(event);
  }
}

/**
 * Handle messages from background script
 */
async function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  switch (message.type) {
    case 'PAGE_LOADED':
      // Page finished loading, update context
      updateContext();
      sendResponse({ success: true });
      break;

    case 'ANALYZE_PAGE':
      // Request page analysis
      const analysis = pageAnalyzer.analyze();
      const context = contextExtractor.extractContext(analysis);
      sendResponse({ analysis, context });
      break;

    case 'GET_CONTEXT':
      // Get current page context
      sendResponse({ context: currentContext });
      break;

    case 'TOGGLE_WIDGET':
      // Toggle widget visibility
      if (widgetContainer) {
        widgetContainer.style.display = widgetContainer.style.display === 'none' ? 'block' : 'none';
        sendResponse({ success: true });
      } else {
        initialize().then(() => {
          sendResponse({ success: true });
        });
      }
      return true;

    case 'REQUEST_AUTOFILL_SUGGESTIONS':
      // Request autofill suggestions
      try {
        const formAnalysis = formAnalyzer.analyzeForms();
        if (formAnalysis.forms.length > 0) {
          // Send to background for AI analysis
          chrome.runtime.sendMessage({
            type: 'REQUEST_AUTOFILL_SUGGESTIONS',
            payload: {
              fields: formAnalysis.forms[0].fields.map(f => ({
                id: f.id,
                type: f.type,
                label: f.label,
                placeholder: f.placeholder,
                name: f.name,
                required: f.required,
              })),
              pageContext: currentContext,
            },
          }).then(response => {
            sendResponse(response || { suggestions: [] });
          }).catch(error => {
            console.error('Error requesting autofill suggestions:', error);
            sendResponse({ suggestions: [], error: error.message });
          });
          return true; // Keep channel open
        } else {
          sendResponse({ suggestions: [] });
        }
      } catch (error) {
        console.error('Error analyzing forms:', error);
        sendResponse({ suggestions: [], error: 'Failed to analyze forms' });
      }
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

  // Re-initialize on navigation (for SPAs)
  let lastUrl = window.location.href;
  let urlCheckInterval: number | null = null;
  
  const checkUrl = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Small delay to let page settle
      setTimeout(initialize, 500);
    }
  };
  
  urlCheckInterval = window.setInterval(checkUrl, 1000);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (urlCheckInterval !== null) {
      clearInterval(urlCheckInterval);
    }
    if (pageAnalysisInterval !== null) {
      clearTimeout(pageAnalysisInterval);
    }
    if (domObserver) {
      domObserver.disconnect();
    }
  });
