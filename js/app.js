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
  }

  // Get device information
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    // Detect device type
    let deviceType = 'Desktop';
    let deviceModel = 'Unknown';
    let deviceOS = 'Unknown';
    
    // iOS devices
    if (/iPhone/.test(userAgent)) {
      deviceType = 'iPhone';
      deviceModel = this.getIPhoneModel(userAgent);
      deviceOS = 'iOS';
    } else if (/iPad/.test(userAgent)) {
      deviceType = 'iPad';
      deviceModel = 'iPad';
      deviceOS = 'iOS';
    }
    // Android devices
    else if (/Android/.test(userAgent)) {
      deviceType = 'Android';
      deviceModel = this.getAndroidModel(userAgent);
      deviceOS = 'Android';
    }
    // Desktop
    else {
      deviceOS = this.getDesktopOS(userAgent);
      deviceModel = this.getBrowser(userAgent);
    }
    
    const timestamp = new Date();
    const sessionId = Date.now().toString(36);
    
    return {
      type: deviceType,
      model: deviceModel,
      os: deviceOS,
      name: `${deviceType}`,
      displayName: `${deviceType} (${deviceModel})`,
      timestamp: timestamp.getTime(),
      lastSeen: timestamp.toLocaleString('ru-RU'),
      sessionId: sessionId,
      userAgent: userAgent.substring(0, 100) + '...'
    };
  }

  getIPhoneModel(userAgent) {
    if (userAgent.includes('iPhone15')) return 'iPhone 15';
    if (userAgent.includes('iPhone14')) return 'iPhone 14';
    if (userAgent.includes('iPhone13')) return 'iPhone 13';
    if (userAgent.includes('iPhone12')) return 'iPhone 12';
    if (userAgent.includes('iPhone11')) return 'iPhone 11';
    return 'iPhone';
  }

  getAndroidModel(userAgent) {
    const samsungMatch = userAgent.match(/SM-([A-Z0-9]+)/);
    if (samsungMatch) return `Samsung ${samsungMatch[1]}`;
    
    if (userAgent.includes('Pixel')) return 'Google Pixel';
    if (userAgent.includes('Huawei')) return 'Huawei';
    if (userAgent.includes('Xiaomi')) return 'Xiaomi';
    
    return 'Android Device';
  }

  getDesktopOS(userAgent) {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Desktop';
  }

  getBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Browser';
  }

  // ===== INITIALIZATION =====
  async init() {
    try {
      // Initialize cloud storage
      const cloudInitialized = await EnhancedStorage.init();
      
      if (cloudInitialized) {
        // Register this device
        await EnhancedStorage.registerDevice(this.deviceInfo);
      }
      
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
    this.updateSyncStatus('connecting', 'Подключение...');
    
    if (EnhancedStorage.isCloudAvailable()) {
      const listener = EnhancedStorage.setupRealtimeSync((newData) => {
        this.updateSyncStatus('syncing', 'Синхронизация...');
        
        if (newData) {
          this.data = { ...this.data, ...newData };
          
          // Normalize operations to always be an array
          if (this.data.operations && !Array.isArray(this.data.operations)) {
            this.data.operations = Object.values(this.data.operations);
          }
          if (!this.data.operations) {
            this.data.operations = [];
          }
          
          this.updateUI();
          this.showSyncNotification('Данные обновлены с другого устройства');
        }
        
        setTimeout(() => {
          this.updateSyncStatus('connected', 'Подключено');
        }, 500);
      });
      
      // Store listener reference for cleanup
      this.realtimeListener = listener;
      
      // Set up periodic device status updates
      this.setupDeviceStatusUpdates();
      
      // Set connected status after successful setup
      setTimeout(() => {
        this.updateSyncStatus('connected', 'Подключено');
      }, 2000);
    } else {
      this.updateSyncStatus('error', 'Офлайн');
    }
  }

  // Setup periodic device status updates
  setupDeviceStatusUpdates() {
    if (this.deviceStatusInterval) {
      clearInterval(this.deviceStatusInterval);
    }
    
    // Update device status every 30 seconds
    this.deviceStatusInterval = setInterval(async () => {
      if (EnhancedStorage.isCloudAvailable()) {
        await EnhancedStorage.updateDeviceStatus(this.deviceInfo.sessionId, 'online');
      }
    }, 30000);
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
        
        // Normalize operations to always be an array
        if (this.data.operations && !Array.isArray(this.data.operations)) {
          this.data.operations = Object.values(this.data.operations);
        }
        if (!this.data.operations) {
          this.data.operations = [];
        }
      }
    } catch (error) {
      this.loadDataLocal();
    }
  }

  loadDataLocal() {
    const saved = localStorage.getItem("budgetAppData");
    if (saved) {
      this.data = { ...this.data, ...JSON.parse(saved) };
      
      // Normalize operations to always be an array
      if (this.data.operations && !Array.isArray(this.data.operations)) {
        this.data.operations = Object.values(this.data.operations);
      }
      if (!this.data.operations) {
        this.data.operations = [];
      }
    }
  }

  async saveData() {
    try {
      const saveResult = await EnhancedStorage.save(this.data);
      
      if (saveResult) {
        // Verify save by trying to load back
        setTimeout(async () => {
          try {
            const loadedData = await EnhancedStorage.load();
            // Silent verification
          } catch (verifyError) {
            // Silent error handling
          }
        }, 1000);
      }
    } catch (error) {
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
  async addOperation(type, formData) {
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
      device: this.deviceInfo,
    };
    
    // Ensure operations is an array
    if (!Array.isArray(this.data.operations)) {
      this.data.operations = [];
    }
    
    this.data.operations.unshift(operation);
    
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

    // Ensure operations is an array
    const operations = Array.isArray(this.data.operations) 
      ? this.data.operations 
      : Object.values(this.data.operations || {});

    operations.forEach((op) => {
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