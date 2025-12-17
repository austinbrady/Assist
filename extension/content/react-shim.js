// React shim for esbuild inject
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

// Make React available globally for the widget bundle
if (typeof window !== 'undefined') {
  window.React = React;
  window.ReactDOM = ReactDOM;
}
