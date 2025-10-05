// UI Rendering Methods for Budget App
BudgetApp.prototype.renderOperations = function() {
  const container = document.getElementById("operationsList");
  const recent = this.data.operations.slice(0, 10);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-receipt"></i>
        <h3>Операций пока нет</h3>
        <p>Добавьте первую операцию, чтобы начать отслеживать бюджет</p>
      </div>
    `;
    return;
  }

  container.innerHTML = recent
    .map(
      (op) => `
        <div class="operation-item">
          <div class="operation-header">
            <div class="operation-info">
              <h4>${this.getCategoryName(op.category)}</h4>
              <div class="operation-meta">
                ${this.getPersonName(op.person)} • ${this.formatDate(op.date)}
                ${op.description ? ` • ${op.description}` : ""}
              </div>
            </div>
            <div class="operation-amount ${op.type}">
              ${op.type === "income" ? "+" : "-"}${this.formatMoney(op.amount)}
            </div>
          </div>
        </div>
      `
    )
    .join("");
};

BudgetApp.prototype.renderLimits = function() {
  const container = document.getElementById("categoryLimits");
  const limits = Object.keys(this.data.limits);

  if (limits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-chart-pie"></i>
        <h3>Лимиты не настроены</h3>
        <p>Установите лимиты для контроля расходов</p>
      </div>
    `;
    return;
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  container.innerHTML = limits
    .map((category) => {
      const limit = this.data.limits[category];
      const spent = this.getSpentByCategory(category, currentMonth, currentYear);
      const percentage = Math.min((spent / limit) * 100, 100);

      return `
        <div class="progress-item">
          <div class="progress-header">
            <span class="progress-name">${this.getCategoryName(category)}</span>
            <span class="progress-value">${this.formatMoney(spent)} / ${this.formatMoney(limit)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
};

BudgetApp.prototype.renderGoals = function() {
  const container = document.getElementById("goalsList");

  if (this.data.goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bullseye"></i>
        <h3>Целей пока нет</h3>
        <p>Создайте цель для накопления</p>
      </div>
    `;
    return;
  }

  container.innerHTML = this.data.goals
    .map((goal) => {
      const percentage = Math.min((goal.current / goal.target) * 100, 100);
      const daysLeft = this.getDaysLeft(goal.deadline);

      return `
        <div class="progress-item">
          <div class="progress-header">
            <span class="progress-name">${goal.name}</span>
            <span class="progress-value">${this.formatMoney(goal.current)} / ${this.formatMoney(goal.target)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
            ${daysLeft > 0 ? `Осталось ${daysLeft} дн.` : "Просрочено"}
          </div>
        </div>
      `;
    })
    .join("");
};

BudgetApp.prototype.renderCategoriesList = function() {
  const container = document.getElementById("categoriesList");
  if (!container) return;

  const allCategories = [
    ...this.data.categories.income.map((cat) => ({ id: cat, type: "income" })),
    ...this.data.categories.expense.map((cat) => ({ id: cat, type: "expense" })),
  ];

  if (allCategories.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Категорий пока нет</p></div>';
    return;
  }

  container.innerHTML = allCategories
    .map(
      (cat) => `
        <div class="operation-item" style="justify-content: space-between; display: flex; align-items: center;">
          <div>
            <strong>${this.getCategoryName(cat.id)}</strong>
            <div style="font-size: 12px; color: var(--text-tertiary);">
              ${cat.type === "income" ? "Доход" : "Расход"}
            </div>
          </div>
          <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" 
                  onclick="app.removeCategory('${cat.id}', '${cat.type}'); app.renderCategoriesList();">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `
    )
    .join("");
};

BudgetApp.prototype.renderGoalsManagementList = function() {
  const container = document.getElementById("goalsManagementList");
  if (!container) return;

  if (this.data.goals.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Целей пока нет</p></div>';
    return;
  }

  container.innerHTML = this.data.goals
    .map((goal) => {
      const percentage = Math.min((goal.current / goal.target) * 100, 100);
      const daysLeft = this.getDaysLeft(goal.deadline);

      return `
        <div class="card" style="margin-bottom: 16px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h4 style="margin-bottom: 4px;">${goal.name}</h4>
              <div style="font-size: 12px; color: var(--text-tertiary);">
                ${daysLeft > 0 ? `Осталось ${daysLeft} дн.` : "Просрочено"}
              </div>
            </div>
            <button class="btn btn-danger" style="padding: 6px 10px; font-size: 12px;" 
                    onclick="app.removeGoal(${goal.id}); app.renderGoalsManagementList(); app.renderGoals();">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          
          <div class="progress-header">
            <span class="progress-value">${this.formatMoney(goal.current)} / ${this.formatMoney(goal.target)}</span>
          </div>
          <div class="progress-bar" style="margin-bottom: 12px;">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
          
          <div style="display: flex; gap: 8px;">
            <input type="number" placeholder="Сумма" id="goalAmount${goal.id}" 
                   style="flex: 1; padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);">
            <button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px;" 
                    onclick="
                      const amount = parseFloat(document.getElementById('goalAmount${goal.id}').value);
                      if (amount > 0) {
                        app.addToGoal(${goal.id}, amount);
                        document.getElementById('goalAmount${goal.id}').value = '';
                        app.renderGoalsManagementList();
                        app.renderGoals();
                      }
                    ">
              Добавить
            </button>
          </div>
        </div>
      `;
    })
    .join("");
};

BudgetApp.prototype.renderLimitsManagementList = function() {
  const container = document.getElementById("limitsManagementList");
  if (!container) return;

  const limits = Object.keys(this.data.limits);
  if (limits.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Лимиты не установлены</p></div>';
    return;
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  container.innerHTML = limits
    .map((category) => {
      const limit = this.data.limits[category];
      const spent = this.getSpentByCategory(category, currentMonth, currentYear);
      const percentage = Math.min((spent / limit) * 100, 100);

      return `
        <div class="card" style="margin-bottom: 16px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h4 style="margin-bottom: 4px;">${this.getCategoryName(category)}</h4>
              <div style="font-size: 12px; color: var(--text-tertiary);">
                Лимит: ${this.formatMoney(limit)}
              </div>
            </div>
            <button class="btn btn-danger" style="padding: 6px 10px; font-size: 12px;" 
                    onclick="app.removeLimit('${category}'); app.renderLimitsManagementList(); app.renderLimits();">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          
          <div class="progress-header">
            <span class="progress-value">${this.formatMoney(spent)} / ${this.formatMoney(limit)}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%; background: ${
        percentage > 90
          ? "var(--accent-danger)"
          : "linear-gradient(90deg, var(--accent-primary), var(--accent-success))"
      }"></div>
          </div>
          
          ${
            percentage > 100
              ? `<div style="font-size: 12px; color: var(--accent-danger); margin-top: 8px;">
                  ⚠️ Превышение на ${this.formatMoney(spent - limit)}
                </div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
};