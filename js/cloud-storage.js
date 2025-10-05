// Firebase Storage Integration - Clean Version
let database = null;
let auth = null;

function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    return false;
  }
  
  try {
    let app;
    try {
      app = firebase.app();
    } catch (error) {
      if (typeof firebaseConfig !== 'undefined') {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        return false;
      }
    }
    
    database = firebase.database();
    auth = firebase.auth();
    return true;
  } catch (error) {
    return false;
  }
}

const CloudStorage = {
  isAvailable: false,
  userId: null,
  familyId: 'artur-valeria-budget',

  async init() {
    if (!initializeFirebase()) {
      this.isAvailable = false;
      return false;
    }

    try {
      const userCredential = await auth.signInAnonymously();
      this.userId = userCredential.user.uid;
      this.isAvailable = true;
      
      try {
        await database.ref(`families/${this.familyId}/test`).set({
          timestamp: Date.now(),
          message: 'Test connection successful'
        });
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

      await database.ref(`families/${this.familyId}/activeDevices/${deviceInfo.sessionId}`).set(deviceData);
      await database.ref(`families/${this.familyId}/deviceHistory/${deviceInfo.sessionId}`).set(deviceData);
      
      database.ref(`families/${this.familyId}/activeDevices/${deviceInfo.sessionId}`).onDisconnect().remove();
    } catch (error) {
      // Silent error
    }
  },

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
      // Silent error
    }
  },

  async save(data) {
    if (!this.isAvailable || !database) {
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }

    try {
      const savePath = `families/${this.familyId}/budgetData`;
      await database.ref(savePath).set(data);
      StorageUtils.set(APP_CONFIG.storageKey, data);
      return true;
    } catch (error) {
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }
  },

  saveOperationByDevice(operation, deviceInfo) {
    if (!this.isAvailable || !database) {
      return;
    }

    try {
      const deviceType = deviceInfo.name;
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

      database.ref(`families/Device/${deviceType}/Operations/${operation.id}`).set(operationData);
    } catch (error) {
      // Silent error
    }
  },

  async load() {
    if (!this.isAvailable || !database) {
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }

    try {
      const snapshot = await database.ref(`families/${this.familyId}/budgetData`).once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        StorageUtils.set(APP_CONFIG.storageKey, data);
        return data;
      } else {
        return StorageUtils.get(APP_CONFIG.storageKey, null);
      }
    } catch (error) {
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }
  },

  isConnected() {
    return this.isAvailable;
  },

  setupRealtimeListener(callback) {
    if (!this.isAvailable || !database) {
      return null;
    }

    const listenPath = `families/${this.familyId}/budgetData`;
    const dataRef = database.ref(listenPath);
    
    const listener = dataRef.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        StorageUtils.set(APP_CONFIG.storageKey, data);
        
        if (callback && typeof callback === 'function') {
          callback(data);
        }
      }
    }, (error) => {
      // Silent error
    });

    return listener;
  },

  removeRealtimeListener(listener) {
    if (listener && this.isAvailable && database) {
      database.ref(`families/${this.familyId}/budgetData`).off('value', listener);
    }
  }
};

const EnhancedStorage = {
  async init() {
    const cloudInitialized = await CloudStorage.init();
    return cloudInitialized;
  },

  async save(data) {
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
    
    const localResult = StorageUtils.set(APP_CONFIG.storageKey, data);
    return localResult;
  },

  async load() {
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
    
    const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
    return localData;
  },

  isCloudAvailable() {
    return CloudStorage.isConnected();
  },

  saveOperationByDevice(operation, deviceInfo) {
    return CloudStorage.saveOperationByDevice(operation, deviceInfo);
  },

  setupRealtimeSync(callback) {
    return CloudStorage.setupRealtimeListener(callback);
  },

  removeRealtimeSync(listener) {
    CloudStorage.removeRealtimeListener(listener);
  },

  async registerDevice(deviceInfo) {
    return CloudStorage.registerDevice(deviceInfo);
  },

  async updateDeviceStatus(sessionId, status) {
    return CloudStorage.updateDeviceStatus(sessionId, status);
  },

  getStatus() {
    return {
      cloudConnected: CloudStorage.isConnected(),
      lastSync: new Date().toLocaleTimeString(),
      familyId: CloudStorage.familyId
    };
  }
};