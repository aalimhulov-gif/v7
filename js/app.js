// Budget App - Main Application Class
class BudgetApp {
  constructor() {
    this.data = {
      operations: [],
      categories: {
        income: ["salary", "bonus", "freelance", "other"],
        expense: [
          "food",
          "transport",
          "entertainment",
          "utilities",
          "shopping",
          "health",
          "other",
        ],
      },
      limits: {},
      goals: [],
      settings: {
        theme: "dark",
        fontSize: "medium",
        currency: "zł",
      },
    };
    // Don't call init() here - it will be called manually as async
  }

  // ===== INITIALIZATION =====
  async init() {
    try {
      // Initialize cloud storage
      await EnhancedStorage.init();
      
      // Load data from cloud or local storage
      await this.loadData();
      
      this.updateBalances();
      this.renderOperations();
      this.renderLimits();
      this.renderGoals();
      this.setCurrentDate();
      this.updateCategorySelects();
      this.applySettings();
      
      // Show storage status
      this.showStorageStatus();
    } catch (error) {
      console.error('App initialization error:', error);
      // Fallback to local storage only
      this.loadDataLocal();
      this.updateBalances();
      this.renderOperations();
      this.renderLimits();
      this.renderGoals();
      this.setCurrentDate();
      this.updateCategorySelects();
      this.applySettings();
    }
  }

  // ===== DATA MANAGEMENT =====
  async loadData() {
    try {
      const savedData = await EnhancedStorage.load();
      if (savedData) {
        this.data = { ...this.data, ...savedData };
      }
    } catch (error) {
      console.error('Load data error:', error);
      this.loadDataLocal();
    }
  }

  loadDataLocal() {
    const saved = localStorage.getItem("budgetAppData");
    if (saved) {
      this.data = { ...this.data, ...JSON.parse(saved) };
    }
  }

  async saveData() {
    try {
      await EnhancedStorage.save(this.data);
    } catch (error) {
      console.error('Save data error:', error);
      // Fallback to localStorage
      localStorage.setItem("budgetAppData", JSON.stringify(this.data));
    }
    
    this.updateBalances();
    this.renderOperations();
    this.renderLimits();
    this.renderGoals();
  }

  showStorageStatus() {
    const status = EnhancedStorage.getStatus();
    const statusText = status.cloudConnected ? 
      'Подключено к облаку' : 
      'Работает локально';
    
    console.log(`Storage Status: ${statusText}`);
    
    if (status.cloudConnected) {
      this.showNotification('Данные синхронизируются с облаком', 'success');
    }
  }

  // ===== OPERATIONS =====
  addOperation(type, formData) {
    const operation = {
      id: Date.now(),
      type: type,
      amount: parseFloat(formData.amount),
      person: formData.person,
      category: formData.category,
      description: formData.description || "",
      date: formData.date,
      timestamp: new Date().toISOString(),
    };

    this.data.operations.unshift(operation);
    this.saveData();
    this.showNotification(
      `${type === "income" ? "Доход" : "Расход"} добавлен успешно!`,
      "success"
    );
  }

  // ===== BALANCE CALCULATIONS =====
  updateBalances() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let arturBalance = 0;
    let valeriaBalance = 0;

    this.data.operations.forEach((op) => {
      const opDate = new Date(op.date);
      if (
        opDate.getMonth() === currentMonth &&
        opDate.getFullYear() === currentYear
      ) {
        const amount = op.type === "income" ? op.amount : -op.amount;
        if (op.person === "artur") {
          arturBalance += amount;
        } else if (op.person === "valeria") {
          valeriaBalance += amount;
        }
      }
    });

    document.getElementById("arturBalance").textContent =
      this.formatMoney(arturBalance);
    document.getElementById("valeriaBalance").textContent =
      this.formatMoney(valeriaBalance);
    document.getElementById("totalBalance").textContent =
      this.formatMoney(arturBalance + valeriaBalance);
  }

  getSpentByCategory(category, month, year) {
    return this.data.operations
      .filter((op) => {
        const opDate = new Date(op.date);
        return (
          op.type === "expense" &&
          op.category === category &&
          opDate.getMonth() === month &&
          opDate.getFullYear() === year
        );
      })
      .reduce((sum, op) => sum + op.amount, 0);
  }

  // ===== UTILITY FUNCTIONS =====
  getDaysLeft(deadline) {
    const today = new Date();
    const targetDate = new Date(deadline);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getCategoryName(category) {
    const names = {
      salary: "Зарплата",
      bonus: "Премия",
      freelance: "Фриланс",
      food: "Еда",
      transport: "Транспорт",
      entertainment: "Развлечения",
      utilities: "Коммуналка",
      shopping: "Покупки",
      health: "Здоровье",
      other: "Другое",
    };
    return names[category] || category;
  }

  getPersonName(person) {
    return person === "artur" ? "Артур" : "Валерия";
  }

  formatMoney(amount) {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  }

  setCurrentDate() {
    const today = new Date().toISOString().split("T")[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach((input) => {
      if (!input.value) {
        input.value = today;
      }
    });
  }

  // ===== NOTIFICATIONS =====
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: ${
        type === "success"
          ? "var(--accent-success)"
          : type === "error"
          ? "var(--accent-danger)"
          : "var(--accent-primary)"
      };
      color: white;
      border-radius: 8px;
      z-index: 400;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // ===== DATA IMPORT/EXPORT =====
  exportData() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    URL.revokeObjectURL(url);
    this.showNotification("Данные экспортированы успешно!", "success");
  }

  importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            this.data = { ...this.data, ...importedData };
            this.saveData();
            this.showNotification("Данные импортированы успешно!", "success");
          } catch (error) {
            this.showNotification("Ошибка импорта данных", "error");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
}