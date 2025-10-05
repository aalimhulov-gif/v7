// Global Functions and Event Handlers for Budget App

// Global app instance
let app;

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
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  app.addOperation("income", data);
  event.target.reset();
  app.setCurrentDate();
  closeModal("incomeModal");
}

function addExpense(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

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
  // Initialize the main app
  app = new BudgetApp();
  
  // Wait for async initialization to complete
  try {
    await app.init();
  } catch (error) {
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