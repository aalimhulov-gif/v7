// Firebase Storage Integration for Budget App

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiB6veVSOVDVz5Nx8xZ9Eb_6dEp7JUTBo",
  authDomain: "budgetami.firebaseapp.com", 
  databaseURL: "https://budgetami-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "budgetami",
  storageBucket: "budgetami.firebasestorage.app",
  messagingSenderId: "446736675165",
  appId: "1:446736675165:web:00858e64e042e95bf1b8b4"
};

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
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
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
    
    if (!this.isAvailable || !this.userId || !database) {
      console.log('⚠️ Cloud storage недоступен, используем localStorage');
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }

    try {
      console.log(`📤 Сохраняем данные для пользователя: ${this.userId}`);
      
      // Create readable structure for Firebase Console
      const budgetData = {
        metadata: {
          lastModified: firebase.database.ServerValue.TIMESTAMP,
          version: APP_CONFIG.version,
          userId: this.userId,
          totalOperations: data.operations ? data.operations.length : 0,
          lastOperation: data.operations && data.operations.length > 0 ? data.operations[0] : null
        },
        operations: this.formatOperationsForFirebase(data.operations || []),
        goals: data.goals || [],
        limits: data.limits || {},
        categories: data.categories || {},
        settings: data.settings || {}
      };
      
      await database.ref(`users/${this.userId}/budgetData`).set(budgetData);
      
      // Also save to localStorage as backup
      StorageUtils.set(APP_CONFIG.storageKey, data);
      console.log('✅ Data saved to Firebase Realtime Database');
      return true;
    } catch (error) {
      console.error('❌ Cloud save failed:', error);
      // Fallback to localStorage
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }
  },

  // Format operations for better Firebase Console readability
  formatOperationsForFirebase(operations) {
    const formatted = {};
    operations.forEach((op, index) => {
      const key = `${op.date}_${op.id}`;
      formatted[key] = {
        ...op,
        index: index,
        readableDate: new Date(op.date).toLocaleDateString('ru-RU'),
        readableAmount: `${op.amount} zł`,
        readableType: op.type === 'income' ? 'ДОХОД' : 'РАСХОД',
        readablePerson: op.person === 'artur' ? 'АРТУР' : 'ВАЛЕРИЯ',
        deviceInfo: op.device ? `${op.device.name} (${op.device.type})` : 'Unknown'
      };
    });
    return formatted;
  },

  // Load data from cloud (Realtime Database)
  async load() {
    console.log('📥 CloudStorage.load() - Попытка загрузки данных...');
    
    if (!this.isAvailable || !this.userId || !database) {
      console.log('⚠️ Cloud storage недоступен, используем localStorage');
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }

    try {
      console.log(`📥 Загружаем данные для пользователя: ${this.userId}`);
      const snapshot = await database.ref(`users/${this.userId}/budgetData`).once('value');
      
      if (snapshot.exists()) {
        const cloudData = snapshot.val();
        console.log('✅ Data loaded from Firebase Realtime Database');
        
        // Convert Firebase format back to app format
        const data = this.convertFromFirebaseFormat(cloudData);
        
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

  // Convert Firebase format back to app format
  convertFromFirebaseFormat(firebaseData) {
    const data = {
      operations: [],
      goals: firebaseData.goals || [],
      limits: firebaseData.limits || {},
      categories: firebaseData.categories || {},
      settings: firebaseData.settings || {}
    };

    // Convert operations back from Firebase format
    if (firebaseData.operations) {
      data.operations = Object.values(firebaseData.operations).sort((a, b) => b.id - a.id);
    }

    return data;
  },

  // Check if cloud data is newer than local
  async checkForUpdates() {
    if (!this.isAvailable || !this.userId || !database) {
      return false;
    }

    try {
      const snapshot = await database.ref(`budgets/${this.userId}/lastModified`).once('value');
      
      if (snapshot.exists()) {
        const cloudTimestamp = snapshot.val();
        const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
        
        if (!localData || !localData.lastModified) {
          return true; // Cloud has data, local doesn't
        }
        
        return cloudTimestamp > localData.lastModified;
      }
      
      return false;
    } catch (error) {
      console.error('Update check error:', error);
      return false;
    }
  },

  // Sync data between cloud and local
  async sync() {
    if (!this.isAvailable) {
      console.log('Cloud sync not available');
      return false;
    }

    try {
      const hasUpdates = await this.checkForUpdates();
      
      if (hasUpdates) {
        console.log('Syncing from cloud...');
        const cloudData = await this.load();
        return cloudData;
      } else {
        console.log('Local data is up to date');
        return null;
      }
    } catch (error) {
      console.error('Sync error:', error);
      return null;
    }
  },

  // Check connection status
  isConnected() {
    return this.isAvailable && this.userId !== null;
  },

  // Setup real-time listener for data changes
  setupRealtimeListener(callback) {
    if (!this.isAvailable || !this.userId || !database) {
      console.log('⚠️ Real-time listener not available');
      return null;
    }

    console.log('🔄 Настройка real-time слушателя для синхронизации...');
    
    const dataRef = database.ref(`users/${this.userId}/budgetData`);
    
    const listener = dataRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        console.log('🔄 Получены обновления из Firebase:', firebaseData);
        
        // Convert Firebase format to app format
        const data = this.convertFromFirebaseFormat(firebaseData);
        
        // Save to localStorage as backup
        StorageUtils.set(APP_CONFIG.storageKey, data);
        
        // Call the callback to update UI
        if (callback && typeof callback === 'function') {
          callback(data);
        }
      }
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
    });

    return listener;
  },

  // Remove real-time listener
  removeRealtimeListener(listener) {
    if (listener && this.isAvailable && this.userId && database) {
      database.ref(`users/${this.userId}/budgetData`).off('value', listener);
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
    
    return true;
  },

  async save(data) {
    console.log('💾 EnhancedStorage.save() - Сохранение данных...');
    
    // Always save to localStorage first
    const localSuccess = StorageUtils.set(APP_CONFIG.storageKey, data);
    
    // Try to save to cloud if available
    if (CloudStorage.isAvailable) {
      const cloudSuccess = await CloudStorage.save(data);
      console.log(`Результат сохранения: localStorage=${localSuccess}, cloud=${cloudSuccess}`);
      return cloudSuccess;
    }
    
    console.log(`Результат сохранения: localStorage=${localSuccess}, cloud=unavailable`);
    return localSuccess;
  },

  async load() {
    console.log('📥 EnhancedStorage.load() - Загрузка данных...');
    
    // Try cloud first if available
    if (CloudStorage.isAvailable) {
      const cloudData = await CloudStorage.load();
      if (cloudData) {
        console.log('📊 Данные загружены из облака');
        return cloudData;
      }
    }
    
    // Fallback to localStorage
    const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
    console.log('📊 Данные загружены из localStorage');
    return localData;
  },

  async sync() {
    return await CloudStorage.sync();
  },

  isCloudAvailable() {
    return CloudStorage.isConnected();
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