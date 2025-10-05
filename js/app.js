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
    
    // Device info for real-time tracking
    this.deviceInfo = this.getDeviceInfo();
    console.log('🔧 Device Info:', this.deviceInfo);
    
    // Don't call init() here - it will be called manually as async
  }

  // Get device information
  getDeviceInfo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad/i.test(navigator.userAgent) || (isMobile && window.innerWidth > 600);
    
    let deviceType = 'desktop';
    let deviceIcon = 'fas fa-desktop';
    
    if (isTablet) {
      deviceType = 'tablet';
      deviceIcon = 'fas fa-tablet-alt';
    } else if (isMobile) {
      deviceType = 'mobile';
      deviceIcon = 'fas fa-mobile-alt';
    }
    
    return {
      type: deviceType,
      icon: deviceIcon,
      name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}`,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    };
  }

  // ===== INITIALIZATION =====
  async init() {
    try {
      // Initialize cloud storage
      await EnhancedStorage.init();
      
      // Load data from cloud or local storage
      await this.loadData();
      
      // Setup real-time synchronization
      this.setupRealtimeSync();
      
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

  // ===== REAL-TIME SYNCHRONIZATION =====
  setupRealtimeSync() {
    console.log('🔄 setupRealtimeSync() вызвана');
    this.updateSyncStatus('connecting', 'Подключение...');
    
    if (EnhancedStorage.isCloudAvailable()) {
      console.log('☁️ Cloud storage доступен, настраиваем real-time sync');
      const listener = EnhancedStorage.setupRealtimeSync((newData) => {
        console.log('📡 Получены обновления данных через real-time:', newData);
        this.updateSyncStatus('syncing', 'Синхронизация...');
        
        if (newData) {
          console.log('📊 Обновляем данные приложения:', newData);
          this.data = { ...this.data, ...newData };
          this.updateUI();
          this.showSyncNotification('Данные обновлены с другого устройства');
        }
        
        setTimeout(() => {
          this.updateSyncStatus('connected', 'Подключено');
        }, 500);
      });
      
      // Store listener reference for cleanup
      this.realtimeListener = listener;
      
      // Set connected status after successful setup
      setTimeout(() => {
        console.log('✅ Real-time sync настроен успешно');
        this.updateSyncStatus('connected', 'Подключено');
      }, 2000);
    } else {
      console.log('❌ Cloud storage недоступен');
      this.updateSyncStatus('error', 'Офлайн');
    }
  }

  updateSyncStatus(status, text) {
    const syncStatus = document.getElementById('syncStatus');
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    
    if (syncStatus && syncIcon && syncText) {
      syncStatus.className = `sync-status ${status}`;
      syncText.textContent = text;
      
      switch(status) {
        case 'connected':
          syncIcon.className = 'fas fa-wifi';
          break;
        case 'connecting':
          syncIcon.className = 'fas fa-wifi';
          break;
        case 'syncing':
          syncIcon.className = 'fas fa-sync-alt';
          break;
        case 'error':
          syncIcon.className = 'fas fa-wifi-slash';
          break;
      }
    }
  }

  showSyncNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'sync-notification';
    notification.innerHTML = `
      <i class="fas fa-sync-alt"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  updateUI() {
    console.log('🔄 Обновление UI после синхронизации...');
    this.updateBalances();
    this.renderOperations();
    this.renderLimits();
    this.renderGoals();
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
    console.log(`%c[BUDGET-APP] 💾 saveData() начат...`, 'color: #ff9800; font-weight: bold;');
    console.log(`%c[BUDGET-APP] 📊 Текущие данные:`, 'color: #ff9800;', this.data);
    
    try {
      console.log(`%c[BUDGET-APP] ☁️ Попытка сохранения через EnhancedStorage...`, 'color: #2196F3;');
      await EnhancedStorage.save(this.data);
      console.log(`%c[BUDGET-APP] ✅ Данные сохранены через EnhancedStorage!`, 'color: #4CAF50; font-weight: bold;');
    } catch (error) {
      console.error('%c[BUDGET-APP] ❌ Ошибка сохранения через EnhancedStorage:', 'color: #f44336; font-weight: bold;', error);
      // Fallback to localStorage
      console.log(`%c[BUDGET-APP] 🔄 Fallback: сохраняем в localStorage...`, 'color: #ff9800;');
      localStorage.setItem("budgetAppData", JSON.stringify(this.data));
    }
    
    console.log(`%c[BUDGET-APP] 🔄 Обновляем UI...`, 'color: #9c27b0;');
    this.updateBalances();
    this.renderOperations();
    this.renderLimits();
    this.renderGoals();
    console.log(`%c[BUDGET-APP] ✅ saveData() завершен!`, 'color: #4CAF50; font-weight: bold;');
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
  async addOperation(type, formData) {
    console.log(`%c[BUDGET-APP] 📝 addOperation вызван с типом: ${type}`, 'color: #2196F3; font-weight: bold;');
    console.log('%c[BUDGET-APP] 📋 Данные формы:', 'color: #2196F3;', formData);
    
    this.updateSyncStatus('syncing', 'Сохранение...');
    
    const operation = {
      id: Date.now(),
      type: type,
      amount: parseFloat(formData.amount),
      person: formData.person,
      category: formData.category,
      description: formData.description || "",
      date: formData.date,
      timestamp: new Date().toISOString(),
      device: this.deviceInfo, // Add device info
    };

    console.log(`%c[BUDGET-APP] ✏️ Создана операция:`, 'color: #4CAF50; font-weight: bold;', operation);
    
    this.data.operations.unshift(operation);
    console.log(`%c[BUDGET-APP] 💾 Вызываем saveData()...`, 'color: #ff9800; font-weight: bold;');
    
    // Save main data
    this.saveData();
    
    // Also save operation by device for Firebase Console visibility
    if (EnhancedStorage.isCloudAvailable()) {
      EnhancedStorage.saveOperationByDevice(operation, this.deviceInfo);
    }
    
    this.showNotification(
      `${type === "income" ? "Доход" : "Расход"} добавлен успешно!`,
      "success"
    );
    
    setTimeout(() => {
      this.updateSyncStatus('connected', 'Подключено');
    }, 1000);
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