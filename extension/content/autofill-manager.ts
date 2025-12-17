/**
 * Autofill Manager - Manages autofill operations with undo/redo
 */

import { FormField } from './form-analyzer';

export interface AutofillOperation {
  fieldId: string;
  selector: string;
  originalValue: string;
  newValue: string;
  timestamp: Date;
  confidence?: number;
}

export interface AutofillSuggestion {
  fieldId: string;
  selector: string;
  value: string;
  confidence: number;
  source: string;
  label?: string;
}

class AutofillManager {
  private operations: Map<string, AutofillOperation> = new Map();
  private undoStack: AutofillOperation[] = [];
  private redoStack: AutofillOperation[] = [];

  /**
   * Apply autofill suggestion to a field
   */
  async fillField(
    field: FormField,
    value: string,
    confidence?: number
  ): Promise<boolean> {
    try {
      const element = field.element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      
      // Store original value
      const originalValue = 'value' in element ? element.value : '';

      // Apply the value
      if ('value' in element) {
        element.value = value;
        
        // Trigger input events so form validation works
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Store operation
      const operation: AutofillOperation = {
        fieldId: field.id,
        selector: field.selector,
        originalValue,
        newValue: value,
        timestamp: new Date(),
        confidence,
      };

      this.operations.set(field.id, operation);
      this.undoStack.push(operation);
      this.redoStack = []; // Clear redo stack when new operation

      // Add visual indicator
      this.addVisualIndicator(element, operation);

      return true;
    } catch (error) {
      console.error('Error filling field:', error);
      return false;
    }
  }

  /**
   * Undo last autofill operation
   */
  undo(fieldId?: string): boolean {
    if (fieldId) {
      // Undo specific field
      const operation = this.operations.get(fieldId);
      if (!operation) {
        return false;
      }

      return this.undoOperation(operation);
    } else {
      // Undo last operation
      const operation = this.undoStack.pop();
      if (!operation) {
        return false;
      }

      return this.undoOperation(operation);
    }
  }

  /**
   * Undo a specific operation
   */
  private undoOperation(operation: AutofillOperation): boolean {
    try {
      const element = document.querySelector(operation.selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!element) {
        return false;
      }

      // Restore original value
      if ('value' in element) {
        element.value = operation.originalValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Remove from operations
      this.operations.delete(operation.fieldId);
      this.redoStack.push(operation);
      this.removeVisualIndicator(element);

      return true;
    } catch (error) {
      console.error('Error undoing operation:', error);
      return false;
    }
  }

  /**
   * Redo last undone operation
   */
  redo(): boolean {
    const operation = this.redoStack.pop();
    if (!operation) {
      return false;
    }

    try {
      const element = document.querySelector(operation.selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!element) {
        return false;
      }

      // Restore new value
      if ('value' in element) {
        element.value = operation.newValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Restore operation
      this.operations.set(operation.fieldId, operation);
      this.undoStack.push(operation);
      this.addVisualIndicator(element, operation);

      return true;
    } catch (error) {
      console.error('Error redoing operation:', error);
      return false;
    }
  }

  /**
   * Undo all autofill operations
   */
  undoAll(): number {
    let count = 0;
    const operations = Array.from(this.operations.values());
    
    operations.forEach((operation) => {
      if (this.undoOperation(operation)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Get all current operations
   */
  getOperations(): AutofillOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Check if field has been autofilled
   */
  isFieldFilled(fieldId: string): boolean {
    return this.operations.has(fieldId);
  }

  /**
   * Get operation for a field
   */
  getOperation(fieldId: string): AutofillOperation | undefined {
    return this.operations.get(fieldId);
  }

  /**
   * Clear all operations
   */
  clear(): void {
    // Undo all operations
    this.undoAll();
    this.operations.clear();
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Add visual indicator to filled field
   */
  private addVisualIndicator(element: HTMLElement, operation: AutofillOperation): void {
    // Remove existing indicator
    this.removeVisualIndicator(element);

    // Add CSS class
    element.classList.add('assist-autofilled');

    // Add undo button
    const undoButton = document.createElement('button');
    undoButton.className = 'assist-undo-button';
    undoButton.innerHTML = '↶';
    undoButton.title = 'Undo autofill';
    undoButton.setAttribute('data-field-id', operation.fieldId);
    undoButton.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.undo(operation.fieldId);
    };

    // Position button relative to field
    const parent = element.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(undoButton);
    }
  }

  /**
   * Remove visual indicator from field
   */
  private removeVisualIndicator(element: HTMLElement): void {
    element.classList.remove('assist-autofilled');
    
    const undoButton = element.parentElement?.querySelector('.assist-undo-button');
    if (undoButton) {
      undoButton.remove();
    }
  }

  /**
   * Request autofill suggestions from AI
   */
  async requestSuggestions(fields: FormField[], pageContext?: any): Promise<AutofillSuggestion[]> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REQUEST_AUTOFILL_SUGGESTIONS',
        payload: {
          fields: fields.map(f => ({
            id: f.id,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder,
            name: f.name,
            required: f.required,
          })),
          pageContext,
        },
      });

      if (response && response.suggestions) {
        return response.suggestions;
      }

      return [];
    } catch (error) {
      console.error('Error requesting autofill suggestions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const autofillManager = new AutofillManager();
