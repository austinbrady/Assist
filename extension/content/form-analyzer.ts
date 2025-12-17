/**
 * Form Analyzer - Detects and extracts form fields with metadata
 */

export interface FormField {
  id: string;
  type: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  selector: string;
  element: HTMLElement;
}

export interface FormAnalysis {
  forms: FormData[];
  totalFields: number;
}

export interface FormData {
  id: string;
  action?: string;
  method?: string;
  fields: FormField[];
  element: HTMLFormElement;
}

class FormAnalyzer {
  /**
   * Analyze all forms on the page
   */
  analyzeForms(): FormAnalysis {
    const forms = document.querySelectorAll('form');
    const formData: FormData[] = [];

    forms.forEach((form, formIndex) => {
      const fields = this.extractFormFields(form);
      if (fields.length > 0) {
        formData.push({
          id: form.id || `form-${formIndex}`,
          action: form.action || undefined,
          method: form.method || undefined,
          fields,
          element: form,
        });
      }
    });

    const totalFields = formData.reduce((sum, form) => sum + form.fields.length, 0);

    return {
      forms: formData,
      totalFields,
    };
  }

  /**
   * Extract all fields from a form
   */
  private extractFormFields(form: HTMLFormElement): FormField[] {
    const fields: FormField[] = [];
    const formElements = form.querySelectorAll('input, textarea, select');

    formElements.forEach((element, index) => {
      const field = this.extractFieldMetadata(element as HTMLElement, index);
      if (field) {
        fields.push(field);
      }
    });

    return fields;
  }

  /**
   * Extract metadata for a single form field
   */
  private extractFieldMetadata(element: HTMLElement, index: number): FormField | null {
    const tagName = element.tagName.toLowerCase();
    
    // Skip hidden fields
    if (tagName === 'input' && (element as HTMLInputElement).type === 'hidden') {
      return null;
    }

    const id = element.id || `field-${index}`;
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const name = 'name' in inputElement ? inputElement.name : undefined;
    const type = this.getFieldType(element);
    const placeholder = 'placeholder' in inputElement ? inputElement.placeholder : undefined;
    const value = 'value' in inputElement ? inputElement.value : undefined;
    const required = 'required' in inputElement ? inputElement.required : false;

    // Find label
    let label: string | undefined;
    if (element.id) {
      const labelElement = document.querySelector(`label[for="${element.id}"]`);
      label = labelElement?.textContent?.trim() || undefined;
    }

    // If no label, try to find nearby text
    if (!label) {
      label = this.findNearbyLabel(element);
    }

    // If still no label, use placeholder or name
    if (!label) {
      label = placeholder || name;
    }

    return {
      id,
      type,
      name,
      label,
      placeholder,
      value,
      required,
      selector: this.generateSelector(element),
      element,
    };
  }

  /**
   * Determine field type
   */
  private getFieldType(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'textarea') {
      return 'textarea';
    }
    if (tagName === 'select') {
      return 'select';
    }

    const inputElement = element as HTMLInputElement;
    const type = inputElement.type || 'text';

    // Map input types to semantic types
    const typeMap: Record<string, string> = {
      'email': 'email',
      'tel': 'phone',
      'password': 'password',
      'number': 'number',
      'date': 'date',
      'url': 'url',
      'search': 'search',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'submit': 'submit',
      'button': 'button',
    };

    return typeMap[type] || 'text';
  }

  /**
   * Find label text near the element
   */
  private findNearbyLabel(element: HTMLElement): string | undefined {
    // Check parent for label
    const parent = element.parentElement;
    if (parent) {
      const labelElement = parent.querySelector('label');
      if (labelElement) {
        return labelElement.textContent?.trim() || undefined;
      }

      // Check for text before the input
      const textBefore = this.getTextBeforeElement(element, parent);
      if (textBefore && textBefore.length < 50) {
        return textBefore;
      }
    }

    // Check previous sibling
    const prevSibling = element.previousElementSibling;
    if (prevSibling) {
      const text = prevSibling.textContent?.trim();
      if (text && text.length < 50) {
        return text;
      }
    }

    return undefined;
  }

  /**
   * Get text content before an element
   */
  private getTextBeforeElement(element: HTMLElement, container: HTMLElement): string | undefined {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    let lastText = '';
    while ((node = walker.nextNode())) {
      if (node.parentElement && node.parentElement.contains(element)) {
        break;
      }
      lastText = node.textContent?.trim() || '';
    }

    return lastText || undefined;
  }

  /**
   * Generate a unique selector for an element
   */
  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className
        .split(' ')
        .filter(c => c && !c.includes(' '))
        .join('.');
      if (classes) {
        const tagName = element.tagName.toLowerCase();
        return `${tagName}.${classes}`;
      }
    }

    // Use name attribute if available
    const inputElement = element as HTMLInputElement;
    if (inputElement.name) {
      return `${element.tagName.toLowerCase()}[name="${inputElement.name}"]`;
    }

    // Fallback to tag name
    return element.tagName.toLowerCase();
  }

  /**
   * Get field by selector
   */
  getFieldBySelector(selector: string): FormField | null {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) {
        return null;
      }

      return this.extractFieldMetadata(element, 0);
    } catch (error) {
      console.error('Error getting field by selector:', error);
      return null;
    }
  }

  /**
   * Detect field semantic type (email, name, address, etc.)
   */
  detectSemanticType(field: FormField): string {
    const label = (field.label || field.placeholder || field.name || '').toLowerCase();
    const name = (field.name || '').toLowerCase();
    const id = field.id.toLowerCase();

    // Email
    if (field.type === 'email' || 
        label.includes('email') || 
        name.includes('email') ||
        id.includes('email')) {
      return 'email';
    }

    // Phone
    if (field.type === 'tel' ||
        label.includes('phone') ||
        label.includes('tel') ||
        name.includes('phone') ||
        name.includes('tel')) {
      return 'phone';
    }

    // Name
    if (label.includes('name') ||
        name.includes('name') ||
        name.includes('firstname') ||
        name.includes('lastname')) {
      if (label.includes('first') || name.includes('first')) {
        return 'first-name';
      }
      if (label.includes('last') || name.includes('last')) {
        return 'last-name';
      }
      return 'name';
    }

    // Address
    if (label.includes('address') ||
        name.includes('address') ||
        label.includes('street') ||
        name.includes('street')) {
      return 'address';
    }

    // City
    if (label.includes('city') || name.includes('city')) {
      return 'city';
    }

    // State
    if (label.includes('state') || name.includes('state')) {
      return 'state';
    }

    // Zip/Postal
    if (label.includes('zip') ||
        label.includes('postal') ||
        name.includes('zip') ||
        name.includes('postal')) {
      return 'zip';
    }

    // Country
    if (label.includes('country') || name.includes('country')) {
      return 'country';
    }

    // Credit card
    if (label.includes('card') ||
        label.includes('credit') ||
        name.includes('card') ||
        name.includes('credit')) {
      return 'credit-card';
    }

    // CVV
    if (label.includes('cvv') ||
        label.includes('cvc') ||
        name.includes('cvv') ||
        name.includes('cvc')) {
      return 'cvv';
    }

    // Date of birth
    if (label.includes('birth') ||
        label.includes('dob') ||
        name.includes('birth') ||
        name.includes('dob')) {
      return 'date-of-birth';
    }

    return field.type;
  }
}

// Export singleton instance
export const formAnalyzer = new FormAnalyzer();
