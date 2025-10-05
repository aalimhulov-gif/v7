// Data Management Methods for Budget App

// ===== CATEGORIES =====
BudgetApp.prototype.addCategory = function(name, type) {
  const categoryId = name.toLowerCase().replace(/\s+/g, "_");
  if (!this.data.categories[type].includes(categoryId)) {
    this.data.categories[type].push(categoryId);
    this.saveData();
    this.updateCategorySelects();
    this.showNotification("Категория добавлена успешно!", "success");
  } else {
    this.showNotification("Категория уже существует", "error");
  }
};

BudgetApp.prototype.removeCategory = function(categoryId, type) {
  const index = this.data.categories[type].indexOf(categoryId);
  if (index > -1) {
    this.data.categories[type].splice(index, 1);
    this.saveData();
    this.updateCategorySelects();
    this.showNotification("Категория удалена", "success");
  }
};

BudgetApp.prototype.updateCategorySelects = function() {
  const selects = document.querySelectorAll('select[name="category"]');
  selects.forEach((select) => {
    const currentValue = select.value;
    const isIncome = select.closest("#incomeModal");
    const categories = isIncome
      ? this.data.categories.income
      : this.data.categories.expense;

    // Clear and repopulate
    select.innerHTML = '<option value="">Выберите</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = this.getCategoryName(cat);
      select.appendChild(option);
    });

    select.value = currentValue;
  });
};

// ===== GOALS =====
BudgetApp.prototype.addGoal = function(goalData) {
  const goal = {
    id: Date.now(),
    name: goalData.name,
    target: parseFloat(goalData.target),
    current: 0,
    deadline: goalData.deadline,
    description: goalData.description || "",
    created: new Date().toISOString(),
  };

  this.data.goals.push(goal);
  this.saveData();
  this.showNotification("Цель создана!", "success");
};

BudgetApp.prototype.removeGoal = function(goalId) {
  this.data.goals = this.data.goals.filter((goal) => goal.id !== goalId);
  this.saveData();
  this.showNotification("Цель удалена", "success");
};

BudgetApp.prototype.addToGoal = function(goalId, amount) {
  const goal = this.data.goals.find((g) => g.id === goalId);
  if (goal) {
    goal.current += amount;
    this.saveData();
    this.showNotification(
      `Добавлено ${this.formatMoney(amount)} к цели "${goal.name}"`,
      "success"
    );
  }
};

// ===== LIMITS =====
BudgetApp.prototype.setLimit = function(category, amount) {
  this.data.limits[category] = parseFloat(amount);
  this.saveData();
  this.showNotification("Лимит установлен!", "success");
};

BudgetApp.prototype.removeLimit = function(category) {
  delete this.data.limits[category];
  this.saveData();
  this.showNotification("Лимит удален", "success");
};

// ===== SETTINGS =====
BudgetApp.prototype.applySettings = function() {
  const themeSelect = document.getElementById("themeSelect");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const currencySelect = document.getElementById("currencySelect");
  const notificationsCheck = document.getElementById("notificationsCheck");

  if (themeSelect) themeSelect.value = this.data.settings.theme || "dark";
  if (fontSizeSelect) fontSizeSelect.value = this.data.settings.fontSize || "medium";
  if (currencySelect) currencySelect.value = this.data.settings.currency || "zł";
  if (notificationsCheck) notificationsCheck.checked = this.data.settings.notifications || false;

  // Apply font size
  document.documentElement.style.fontSize = {
    small: "14px",
    medium: "16px",
    large: "18px",
  }[this.data.settings.fontSize || "medium"];
};

BudgetApp.prototype.updateSettings = function(key, value) {
  this.data.settings[key] = value;
  this.saveData();
};

BudgetApp.prototype.clearAllData = function() {
  if (
    confirm(
      "Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!"
    )
  ) {
    localStorage.clear();
    location.reload();
  }
};