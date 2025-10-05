// Global Functions and Event Handlers for Budget App

// Console styling for better debugging
const logStyle = {
  success: 'color: #4CAF50; font-weight: bold;',
  error: 'color: #f44336; font-weight: bold;',
  warning: 'color: #ff9800; font-weight: bold;',
  info: 'color: #2196F3; font-weight: bold;'
};

function debugLog(message, type = 'info') {
  console.log(`%c[BUDGET-DEBUG] ${message}`, logStyle[type]);
}

// Global app instance
let app;

// Firebase diagnostic function
async function testFirebaseConnection() {
  console.log('🧪 === FIREBASE DIAGNOSTIC TEST ===');
  
  try {
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK не загружен');
      return;
    }
    
    console.log('✅ Firebase SDK загружен');
    
    // Test database connection
    const testData = {
      test: true,
      timestamp: Date.now(),
      message: 'Direct test from console'
    };
    
    await firebase.database().ref('families/artur-valeria-budget/consoleTest').set(testData);
    console.log('✅ Прямая запись в Firebase успешна!');
    console.log('🔍 Проверьте Firebase Console -> Realtime Database -> families/artur-valeria-budget/consoleTest');
    
    // Clean up
    await firebase.database().ref('families/artur-valeria-budget/consoleTest').remove();
    console.log('🧹 Тестовые данные удалены');
    
  } catch (error) {
    console.error('❌ Ошибка теста Firebase:', error);
  }
}

// Make test function globally available
window.testFirebaseConnection = testFirebaseConnection;

// ===== UI INTERACTION FUNCTIONS =====
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
  toggleSidebar(); // Close sidebar when opening modal
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// ===== FORM HANDLERS =====
function addIncome(event) {
  event.preventDefault();
  debugLog("💰 Добавляем доход...", 'info');
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  debugLog(`💰 Данные дохода: ${JSON.stringify(data)}`, 'info');

  app.addOperation("income", data);
  event.target.reset();
  app.setCurrentDate();
  closeModal("incomeModal");
}

function addExpense(event) {
  event.preventDefault();
  debugLog("💸 Добавляем расход...", 'info');
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  debugLog(`💸 Данные расхода: ${JSON.stringify(data)}`, 'info');

  app.addOperation("expense", data);
  event.target.reset();
  app.setCurrentDate();
  closeModal("expenseModal");
}

function addCategory(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  app.addCategory(data.name, data.type);
  app.renderCategoriesList();
  event.target.reset();
}

function addGoal(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  app.addGoal(data);
  app.renderGoalsManagementList();
  app.renderGoals();
  event.target.reset();
}

function addLimit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  app.setLimit(data.category, data.amount);
  app.renderLimitsManagementList();
  app.renderLimits();
  event.target.reset();
}

// ===== NAVIGATION FUNCTIONS =====
function showAnalytics() {
  openModal("analyticsModal");
  app.renderAnalytics();
}

function updateAnalytics() {
  app.renderAnalytics();
}

function exportData() {
  app.exportData();
  toggleSidebar();
}

function importData() {
  app.importData();
  toggleSidebar();
}

// ===== SETTINGS FUNCTIONS =====
function changeTheme(theme) {
  app.updateSettings("theme", theme);
  app.showNotification("Тема изменена!", "success");
}

function changeFontSize(fontSize) {
  app.updateSettings("fontSize", fontSize);
  document.documentElement.style.fontSize = {
    small: "14px",
    medium: "16px",
    large: "18px",
  }[fontSize];
  app.showNotification("Размер шрифта изменен!", "success");
}

function changeCurrency(currency) {
  app.updateSettings("currency", currency);
  app.updateBalances();
  app.renderOperations();
  app.showNotification("Валюта изменена!", "success");
}

function toggleNotifications(enabled) {
  app.updateSettings("notifications", enabled);
  app.showNotification(
    enabled ? "Уведомления включены!" : "Уведомления отключены!",
    "success"
  );
}

function clearAllData() {
  app.clearAllData();
}

// ===== APP INITIALIZATION =====
document.addEventListener("DOMContentLoaded", async () => {
  debugLog("🚀 DOM загружен, начинаем инициализацию приложения...", 'info');
  
  // Initialize the main app
  debugLog("📱 Создаем экземпляр BudgetApp...", 'info');
  app = new BudgetApp();
  
  // Wait for async initialization to complete
  try {
    debugLog("⚙️ Запускаем app.init()...", 'info');
    await app.init();
    debugLog("✅ Приложение успешно инициализировано!", 'success');
  } catch (error) {
    debugLog(`❌ Ошибка инициализации приложения: ${error.message}`, 'error');
    console.error('App initialization failed:', error);
  }

  // Setup modal event listeners
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.classList.remove("active");
    }
  });

  // Setup modal content observers
  const categoryModal = document.getElementById("categoryModal");
  const goalModal = document.getElementById("goalModal");
  const limitModal = document.getElementById("limitModal");
  const settingsModal = document.getElementById("settingsModal");

  // Update modal content when opened
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;
        if (target.classList.contains("active")) {
          if (target.id === "categoryModal") {
            app.renderCategoriesList();
          } else if (target.id === "goalModal") {
            app.renderGoalsManagementList();
          } else if (target.id === "limitModal") {
            app.renderLimitsManagementList();
          } else if (target.id === "settingsModal") {
            app.applySettings();
          }
        }
      }
    });
  });

  [categoryModal, goalModal, limitModal, settingsModal].forEach((modal) => {
    if (modal) observer.observe(modal, { attributes: true });
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // Close all modals and sidebar
      document.querySelectorAll(".modal-overlay").forEach((modal) => {
        modal.classList.remove("active");
      });
      document.getElementById("sidebar").classList.remove("active");
      document.getElementById("overlay").classList.remove("active");
    }
  });

  // Add notification styles
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
});