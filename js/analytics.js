// Analytics Methods for Budget App

BudgetApp.prototype.generateAnalytics = function(period = "month", filter = "all") {
  const now = new Date();
  let filteredOps = this.data.operations;

  // Filter by period
  if (period === "month") {
    filteredOps = filteredOps.filter((op) => {
      const opDate = new Date(op.date);
      return (
        opDate.getMonth() === now.getMonth() &&
        opDate.getFullYear() === now.getFullYear()
      );
    });
  } else if (period === "year") {
    filteredOps = filteredOps.filter((op) => {
      const opDate = new Date(op.date);
      return opDate.getFullYear() === now.getFullYear();
    });
  }

  // Filter by person
  if (filter !== "all") {
    filteredOps = filteredOps.filter((op) => op.person === filter);
  }

  // Calculate statistics
  const totalIncome = filteredOps
    .filter((op) => op.type === "income")
    .reduce((sum, op) => sum + op.amount, 0);
  const totalExpense = filteredOps
    .filter((op) => op.type === "expense")
    .reduce((sum, op) => sum + op.amount, 0);
  const balance = totalIncome - totalExpense;

  // Category breakdown
  const categoryStats = {};
  filteredOps.forEach((op) => {
    if (!categoryStats[op.category]) {
      categoryStats[op.category] = { income: 0, expense: 0 };
    }
    categoryStats[op.category][op.type] += op.amount;
  });

  return {
    totalOperations: filteredOps.length,
    totalIncome,
    totalExpense,
    balance,
    categoryStats,
    operations: filteredOps.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    ),
  };
};

BudgetApp.prototype.renderAnalytics = function() {
  const container = document.getElementById("analyticsContent");
  if (!container) return;

  const period = document.getElementById("periodSelect")?.value || "month";
  const filter = document.getElementById("filterSelect")?.value || "all";
  const analytics = this.generateAnalytics(period, filter);

  container.innerHTML = `
    <div class="grid-2" style="margin-bottom: 24px;">
      <div class="card">
        <h4 style="color: var(--accent-success); margin-bottom: 8px;">Доходы</h4>
        <div style="font-size: 24px; font-weight: 600;">${this.formatMoney(analytics.totalIncome)}</div>
      </div>
      <div class="card">
        <h4 style="color: var(--accent-danger); margin-bottom: 8px;">Расходы</h4>
        <div style="font-size: 24px; font-weight: 600;">${this.formatMoney(analytics.totalExpense)}</div>
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 16px;">Итого</h4>
      <div style="font-size: 28px; font-weight: 700; color: ${
        analytics.balance >= 0
          ? "var(--accent-success)"
          : "var(--accent-danger)"
      };">
        ${analytics.balance >= 0 ? "+" : ""}${this.formatMoney(analytics.balance)}
      </div>
      <div style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">
        Всего операций: ${analytics.totalOperations}
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <h4 style="margin-bottom: 16px;">По категориям</h4>
      <div id="categoryBreakdown">
        ${Object.keys(analytics.categoryStats)
          .map((category) => {
            const stats = analytics.categoryStats[category];
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span>${this.getCategoryName(category)}</span>
                <span style="font-weight: 500;">
                  ${stats.income > 0 ? `+${this.formatMoney(stats.income)}` : ""}
                  ${stats.expense > 0 ? `-${this.formatMoney(stats.expense)}` : ""}
                </span>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
    
    <div class="card">
      <h4 style="margin-bottom: 16px;">Все операции</h4>
      <div style="max-height: 300px; overflow-y: auto;">
        ${analytics.operations
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
          .join("")}
      </div>
    </div>
  `;
};