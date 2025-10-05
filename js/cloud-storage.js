// Firebase Storage Integration for Budget App

// Firebase Database References
let database = null;
let auth = null;

// Initialize Firebase when config is available
function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded. Falling back to localStorage');
    return false;
  }
  
  try {
    // Firebase should already be initialized by firebase-config.js
    if (!firebase.apps.length) {
      console.error('❌ Firebase not initialized! Check firebase-config.js');
      return false;
    }
    
    // Use Realtime Database instead of Firestore
    database = firebase.database();
    auth = firebase.auth();
    
    console.log('✅ Firebase Realtime Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
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
    console.log('🔥 CloudStorage.init() - Начинаем инициализацию...');
    
    // Initialize Firebase first
    if (!initializeFirebase()) {
      console.info('Firebase not available, using localStorage only');
      this.isAvailable = false;
      return false;
    }

    try {
      console.log('🔑 Попытка анонимной аутентификации...');
      // Try to sign in anonymously for user identification
      const userCredential = await auth.signInAnonymously();
      this.userId = userCredential.user.uid;
      this.isAvailable = true;
      console.log(`✅ Cloud storage initialized successfully with user: ${this.userId}`);
      console.log(`👨‍👩‍👧‍👦 Using family ID: ${this.familyId}`);
      
      // Test write to Firebase immediately
      console.log('🧪 Тестируем запись в Firebase...');
      try {
        await database.ref(`families/${this.familyId}/test`).set({
          timestamp: Date.now(),
          message: 'Test connection successful'
        });
        console.log('✅ Тест записи в Firebase успешен!');
        // Remove test data
        await database.ref(`families/${this.familyId}/test`).remove();
      } catch (testError) {
        console.error('❌ Тест записи в Firebase провален:', testError);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Cloud storage initialization failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'PERMISSION_DENIED') {
        console.error('🔒 ПРОБЛЕМА: Правила Firebase блокируют доступ!');
        console.error('Решение: Обновите правила в Firebase Console');
      }
      
      this.isAvailable = false;
      return false;
    }
  },

  // Save data to cloud (Realtime Database)
  async save(data) {
    console.log('💾 CloudStorage.save() - Попытка сохранения данных...');
    console.log(`🏠 Family ID: ${this.familyId}`);
    console.log(`🔑 User ID: ${this.userId}`);
    console.log(`☁️ Available: ${this.isAvailable}`);
    
    if (!this.isAvailable || !database) {
      console.log('⚠️ Cloud storage недоступен, используем localStorage');
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }

    try {
      const savePath = `families/${this.familyId}/budgetData`;
      console.log(`📤 Сохраняем данные по пути: ${savePath}`);
      console.log(`📊 Данные для сохранения:`, data);
      
      // Save full data structure for app to work
      await database.ref(savePath).set(data);
      
      // Also save to localStorage as backup
      StorageUtils.set(APP_CONFIG.storageKey, data);
      console.log('✅ Data saved to Firebase Realtime Database');
      console.log(`✅ Путь сохранения: ${savePath}`);
      return true;
    } catch (error) {
      console.error('❌ Cloud save failed:', error);
      console.error('❌ Error details:', error.message);
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
      console.log(`📱 Operation saved to ${deviceType} section`);
    } catch (error) {
      console.error('❌ Error saving operation by device:', error);
    }
  },

  // Load data from cloud (Realtime Database)
  async load() {
    console.log('📥 CloudStorage.load() - Попытка загрузки данных...');
    
    if (!this.isAvailable || !database) {
      console.log('⚠️ Cloud storage недоступен, используем localStorage');
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }

    try {
      console.log(`📥 Загружаем данные для семьи: ${this.familyId}`);
      const snapshot = await database.ref(`families/${this.familyId}/budgetData`).once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('✅ Data loaded from Firebase Realtime Database');
        
        // Save to localStorage as backup
        StorageUtils.set(APP_CONFIG.storageKey, data);
        return data;
      } else {
        // No cloud data, try localStorage
        console.log('ℹ️ No cloud data found, using localStorage');
        return StorageUtils.get(APP_CONFIG.storageKey, null);
      }
    } catch (error) {
      console.error('❌ Cloud load error:', error);
      console.error('Error code:', error.code);
      
      if (error.code === 'PERMISSION_DENIED') {
        console.error('🔒 ПРОБЛЕМА: Нет прав для чтения данных!');
        console.error('Решение: Проверьте правила Firebase');
      }
      
      // Fallback to localStorage
      console.log('🔄 Fallback: загружаем из localStorage');
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
      console.log('⚠️ Real-time listener not available');
      return null;
    }

    console.log('🔄 Настройка real-time слушателя для синхронизации...');
    
    const listenPath = `families/${this.familyId}/budgetData`;
    console.log(`👂 Слушаем изменения по пути: ${listenPath}`);
    const dataRef = database.ref(listenPath);
    
    const listener = dataRef.on('value', (snapshot) => {
      console.log('👂 Real-time listener triggered');
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('📡 Получены обновления из Firebase:', data);
        console.log(`📊 Операций в данных: ${data.operations ? data.operations.length : 0}`);
        
        // Save to localStorage as backup
        StorageUtils.set(APP_CONFIG.storageKey, data);
        
        // Call the callback to update UI
        if (callback && typeof callback === 'function') {
          console.log('🔄 Вызываем callback для обновления UI');
          callback(data);
        }
      } else {
        console.log('📭 No data in snapshot');
      }
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
    });

    console.log(`✅ Real-time listener установлен для: ${listenPath}`);
    return listener;
  },

  // Remove real-time listener
  removeRealtimeListener(listener) {
    if (listener && this.isAvailable && database) {
      database.ref(`families/${this.familyId}/budgetData`).off('value', listener);
      console.log('🔄 Real-time слушатель отключен');
    }
  }
};

// Enhanced Storage that combines localStorage and cloud storage
const EnhancedStorage = {
  async init() {
    console.log('🚀 EnhancedStorage.init() - Инициализация хранилища...');
    const cloudInitialized = await CloudStorage.init();
    
    if (cloudInitialized) {
      console.log('☁️ Cloud storage available');
    } else {
      console.log('💾 Using localStorage only');
    }
    
    return cloudInitialized;
  },

  async save(data) {
    console.log('💾 EnhancedStorage.save() - Сохранение данных...');
    
    // Always save to localStorage first
    StorageUtils.set(APP_CONFIG.storageKey, data);
    
    // Try to save to cloud if available
    if (CloudStorage.isConnected()) {
      return await CloudStorage.save(data);
    }
    
    return true;
  },

  async load() {
    console.log('📥 EnhancedStorage.load() - Загрузка данных...');
    
    if (CloudStorage.isConnected()) {
      try {
        const cloudData = await CloudStorage.load();
        if (cloudData) {
          console.log('📊 Данные загружены из облака');
          return cloudData;
        }
      } catch (error) {
        console.error('Cloud load error:', error);
      }
    }
    
    // Fallback to localStorage
    const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
    console.log('📊 Данные загружены из localStorage');
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
    console.log('🔄 EnhancedStorage.setupRealtimeSync() - Настройка синхронизации...');
    return CloudStorage.setupRealtimeListener(callback);
  },

  // Remove real-time synchronization
  removeRealtimeSync(listener) {
    CloudStorage.removeRealtimeListener(listener);
  }
};