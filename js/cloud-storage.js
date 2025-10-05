// Firebase Storage Integration for Budget App - Clean Version

// Firebase Database References
let database = null;
let auth = null;

// Initialize Firebase when config is available
function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    return false;
  }
  
  try {
    // Firebase should already be initialized by firebase-config.js
    if (!firebase.apps.length) {
      return false;
    }
    
    // Use Realtime Database instead of Firestore
    database = firebase.database();
    auth = firebase.auth();
    
    return true;
  } catch (error) {
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
      } catch (testError) {
        // Silent test error
      }
      
      return true;
    } catch (error) {
      this.isAvailable = false;
      return false;
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
          return true;
        }
      } catch (error) {
        // Continue to localStorage fallback
      }
    }
    
    // Fallback to localStorage
    const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
    return localData;
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

  // Get current status
  getStatus() {
    return {
      cloudConnected: CloudStorage.isConnected(),
      lastSync: new Date().toLocaleTimeString(),
      familyId: CloudStorage.familyId
    };
  }
};