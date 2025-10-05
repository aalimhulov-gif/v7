// Firebase Storage Integration for Budget App - Clean Version

// Firebase Database References
let database = null;
let auth = null;

// Initialize Firebase when config is available
function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK не загружен');
    return false;
  }
  
  try {
    // Check if Firebase is initialized
    let app;
    try {
      app = firebase.app(); // This will throw if not initialized
      console.log('✅ Firebase уже инициализирован:', app.name);
    } catch (error) {
      // Firebase not initialized, try to initialize
      console.log('🔄 Пытаемся инициализировать Firebase...');
      if (typeof firebaseConfig !== 'undefined') {
        app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase инициализирован:', app.name);
      } else {
        console.error('❌ firebaseConfig не найден');
        return false;
      }
    }
    
    // Use Realtime Database instead of Firestore
    database = firebase.database();
    auth = firebase.auth();
    
    console.log('✅ Firebase успешно подключен к Realtime Database');
    return true;
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    return false;
  }
}

// Cloud Storage Utilities
const CloudStorage = {
  isAvailable: false,
  userId: null,
  familyId: 'artur-valeria-budget', // Общий ID для семьи

  // Initialize cloud storage
  async init() {
    // Initialize Firebase first
    if (!initializeFirebase()) {
      this.isAvailable = false;
      return false;
    }

    try {
      // Try to sign in anonymously for user identification
      const userCredential = await auth.signInAnonymously();
      this.userId = userCredential.user.uid;
      this.isAvailable = true;
      
      // Test write to Firebase immediately
      try {
        await database.ref(`families/${this.familyId}/test`).set({
          timestamp: Date.now(),
          message: 'Test connection successful'
        });
        // Remove test data
        await database.ref(`families/${this.familyId}/test`).remove();
        console.log('✅ Тест записи в Firebase успешен');
      } catch (testError) {
        console.error('❌ Тест записи в Firebase провален:', testError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации CloudStorage:', error);
      this.isAvailable = false;
      return false;
    }
  },

  // Register device in Firebase for tracking
  async registerDevice(deviceInfo) {
    if (!this.isAvailable || !database) {
      return;
    }

    try {
      const deviceData = {
        ...deviceInfo,
        userId: this.userId,
        lastActive: new Date().toISOString(),
        status: 'online'
      };

      // Save to active devices
      await database.ref(`families/${this.familyId}/activeDevices/${deviceInfo.sessionId}`).set(deviceData);
      
      // Also save to device history
      await database.ref(`families/${this.familyId}/deviceHistory/${deviceInfo.sessionId}`).set(deviceData);
      
      console.log(`✅ Устройство зарегистрировано: ${deviceInfo.displayName}`);
      
      // Set up automatic device cleanup on disconnect
      database.ref(`families/${this.familyId}/activeDevices/${deviceInfo.sessionId}`).onDisconnect().remove();
      
    } catch (error) {
      console.error('❌ Ошибка регистрации устройства:', error);
    }
  },

  // Update device status
  async updateDeviceStatus(sessionId, status = 'online') {
    if (!this.isAvailable || !database) {
      return;
    }

    try {
      await database.ref(`families/${this.familyId}/activeDevices/${sessionId}`).update({
        lastActive: new Date().toISOString(),
        status: status
      });
    } catch (error) {
      console.error('❌ Ошибка обновления статуса устройства:', error);
    }
  },

  // Save data to cloud (Realtime Database)
  async save(data) {
    if (!this.isAvailable || !database) {
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }

    try {
      const savePath = `families/${this.familyId}/budgetData`;
      
      // Save full data structure for app to work
      await database.ref(savePath).set(data);
      
      // Also save to localStorage as backup
      StorageUtils.set(APP_CONFIG.storageKey, data);
      return true;
    } catch (error) {
      // Fallback to localStorage
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }
  },

  // Save operation by device (for Firebase Console visibility)
  saveOperationByDevice(operation, deviceInfo) {
    if (!this.isAvailable || !database) {
      return;
    }

    try {
      const deviceType = deviceInfo.name; // Desktop, Mobile, Tablet
      const operationData = {
        id: operation.id,
        type: operation.type === 'income' ? 'ДОХОД' : 'РАСХОД',
        amount: `${operation.amount} zł`,
        person: operation.person === 'artur' ? 'АРТУР' : 'ВАЛЕРИЯ',
        category: operation.category,
        description: operation.description || '',
        date: operation.date,
        readableDate: new Date(operation.date).toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU')
      };

      // Save to device-specific path
      database.ref(`families/Device/${deviceType}/Operations/${operation.id}`).set(operationData);
    } catch (error) {
      // Silent error
    }
  },

  // Load data from cloud (Realtime Database)
  async load() {
    if (!this.isAvailable || !database) {
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }

    try {
      const snapshot = await database.ref(`families/${this.familyId}/budgetData`).once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Save to localStorage as backup
        StorageUtils.set(APP_CONFIG.storageKey, data);
        return data;
      } else {
        // No cloud data, try localStorage
        return StorageUtils.get(APP_CONFIG.storageKey, null);
      }
    } catch (error) {
      // Fallback to localStorage
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }
  },

  // Check connection status
  isConnected() {
    return this.isAvailable;
  },

  // Setup real-time listener for data changes
  setupRealtimeListener(callback) {
    if (!this.isAvailable || !database) {
      return null;
    }

    const listenPath = `families/${this.familyId}/budgetData`;
    const dataRef = database.ref(listenPath);
    
    const listener = dataRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Save to localStorage as backup
        StorageUtils.set(APP_CONFIG.storageKey, data);
        
        // Call the callback to update UI
        if (callback && typeof callback === 'function') {
          callback(data);
        }
      }
    }, (error) => {
      // Silent error
    });

    return listener;
  },

  // Remove real-time listener
  removeRealtimeListener(listener) {
    if (listener && this.isAvailable && database) {
      database.ref(`families/${this.familyId}/budgetData`).off('value', listener);
    }
  }
};

// Enhanced Storage that combines localStorage and cloud storage
const EnhancedStorage = {
  async init() {
    const cloudInitialized = await CloudStorage.init();
    return cloudInitialized;
  },

  async save(data) {
    // Try cloud storage first
    if (CloudStorage.isConnected()) {
      try {
        const result = await CloudStorage.save(data);
        if (result) {
          console.log('✅ Данные сохранены в облако');
          return true;
        }
      } catch (error) {
        console.error('❌ Ошибка сохранения в облако:', error);
        // Continue to localStorage fallback
      }
    }
    
    // Fallback to localStorage
    const localResult = StorageUtils.set(APP_CONFIG.storageKey, data);
    console.log('💾 Данные сохранены локально');
    return localResult;
  },

  async load() {
    // Try cloud storage first
    if (CloudStorage.isConnected()) {
      try {
        const cloudData = await CloudStorage.load();
        if (cloudData) {
          return cloudData;
        }
      } catch (error) {
        // Continue to localStorage fallback
      }
    }
    
    // Fallback to localStorage
    const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
    return localData;
  },

  isCloudAvailable() {
    return CloudStorage.isConnected();
  },

  // Save operation by device for Firebase Console visibility
  saveOperationByDevice(operation, deviceInfo) {
    return CloudStorage.saveOperationByDevice(operation, deviceInfo);
  },

  // Setup real-time synchronization
  setupRealtimeSync(callback) {
    return CloudStorage.setupRealtimeListener(callback);
  },

  // Remove real-time synchronization
  removeRealtimeSync(listener) {
    CloudStorage.removeRealtimeListener(listener);
  },

  // Register device
  async registerDevice(deviceInfo) {
    return CloudStorage.registerDevice(deviceInfo);
  },

  // Update device status
  async updateDeviceStatus(sessionId, status) {
    return CloudStorage.updateDeviceStatus(sessionId, status);
  },

  // Get current status
  getStatus() {
    return {
      cloudConnected: CloudStorage.isConnected(),
      lastSync: new Date().toLocaleTimeString(),
      familyId: CloudStorage.familyId
    };
  }
};