// Utility Functions for Budget App

// Date and Time Utilities
const DateUtils = {
  // Get current date in YYYY-MM-DD format
  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  },

  // Format date for display
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  },

  // Get current month and year
  getCurrentPeriod() {
    const now = new Date();
    return {
      month: now.getMonth(),
      year: now.getFullYear()
    };
  },

  // Calculate days between dates
  getDaysDifference(date1, date2) {
    const diffTime = new Date(date2) - new Date(date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Check if date is in current month
  isCurrentMonth(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  }
};

// Money Formatting Utilities
const MoneyUtils = {
  // Format money with currency
  format(amount, currency = 'zł') {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Parse money string to number
  parse(moneyString) {
    return parseFloat(moneyString.replace(/[^\d.-]/g, '')) || 0;
  },

  // Add currency symbol
  addCurrency(amount, currency = 'zł') {
    return `${amount} ${currency}`;
  }
};

// Validation Utilities
const ValidationUtils = {
  // Validate required field
  isRequired(value) {
    return value !== null && value !== undefined && value !== '';
  },

  // Validate positive number
  isPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  },

  // Validate date
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // Validate email (if needed in future)
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

// DOM Utilities
const DOMUtils = {
  // Safe querySelector
  $(selector) {
    return document.querySelector(selector);
  },

  // Safe querySelectorAll
  $$(selector) {
    return document.querySelectorAll(selector);
  },

  // Create element with attributes
  createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  },

  // Show/hide element
  toggle(element, show = null) {
    if (show === null) {
      element.style.display = element.style.display === 'none' ? '' : 'none';
    } else {
      element.style.display = show ? '' : 'none';
    }
  },

  // Add/remove class
  toggleClass(element, className, add = null) {
    if (add === null) {
      element.classList.toggle(className);
    } else {
      element.classList.toggle(className, add);
    }
  }
};

// Storage Utilities
const StorageUtils = {
  // Get item from localStorage with fallback
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return fallback;
    }
  },

  // Set item to localStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },

  // Remove item from localStorage
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  // Clear all localStorage
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// Array Utilities
const ArrayUtils = {
  // Remove item from array
  remove(array, item) {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
    return array;
  },

  // Group array by property
  groupBy(array, property) {
    return array.reduce((groups, item) => {
      const key = item[property];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  },

  // Sum array by property
  sumBy(array, property) {
    return array.reduce((sum, item) => sum + (item[property] || 0), 0);
  }
};

// Export utilities
if (typeof window !== 'undefined') {
  window.DateUtils = DateUtils;
  window.MoneyUtils = MoneyUtils;
  window.ValidationUtils = ValidationUtils;
  window.DOMUtils = DOMUtils;
  window.StorageUtils = StorageUtils;
  window.ArrayUtils = ArrayUtils;
}