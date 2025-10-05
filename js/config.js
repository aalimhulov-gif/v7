// Configuration and Constants for Budget App

// Application Configuration
const APP_CONFIG = {
  // Application Details
  name: "Совместный Бюджет - Артур & Валерия",
  version: "1.0.0",
  
  // Storage Keys
  storageKey: "budgetAppData",
  
  // Default Categories
  defaultCategories: {
    income: ["salary", "bonus", "freelance", "other"],
    expense: ["food", "transport", "entertainment", "utilities", "shopping", "health", "other"]
  },
  
  // Category Names (Russian)
  categoryNames: {
    salary: "Зарплата",
    bonus: "Премия", 
    freelance: "Фриланс",
    food: "Еда",
    transport: "Транспорт",
    entertainment: "Развлечения",
    utilities: "Коммуналка",
    shopping: "Покупки",
    health: "Здоровье",
    other: "Другое"
  },
  
  // Person Names
  persons: {
    artur: "Артур",
    valeria: "Валерия"
  },
  
  // Default Settings
  defaultSettings: {
    theme: "dark",
    fontSize: "medium",
    currency: "zł",
    notifications: false
  },
  
  // Font Size Options
  fontSizes: {
    small: "14px",
    medium: "16px", 
    large: "18px"
  },
  
  // Animation Durations
  animations: {
    notification: 3000,
    modal: 300,
    hover: 200
  },
  
  // Limits and Constraints
  limits: {
    maxRecentOperations: 10,
    maxAnalyticsOperations: 1000,
    minGoalAmount: 1,
    maxGoalAmount: 10000000
  },
  
  // Responsive Breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}

// Make available globally
window.APP_CONFIG = APP_CONFIG;