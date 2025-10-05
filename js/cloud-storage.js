// Firebase Storage Integration for Budget App

// Firebase Configuration (will be set from environment)
let firebaseConfig = null;
let db = null;
let auth = null;

// Initialize Firebase when config is available
function initializeFirebase(config) {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded. Falling back to localStorage');
    return false;
  }
  
  try {
    firebaseConfig = config;
    firebase.initializeApp(config);
    db = firebase.firestore();
    auth = firebase.auth();
    
    // Enable offline persistence
    db.enablePersistence({ synchronizeTabs: true })
      .catch(err => console.warn('Persistence error:', err));
    
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
}

// Cloud Storage Utilities
const CloudStorage = {
  isAvailable: false,
  userId: null,

  // Initialize cloud storage
  async init() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !db || !auth) {
      console.info('Firebase not available, using localStorage only');
      this.isAvailable = false;
      return false;
    }

    try {
      // Try to sign in anonymously
      const userCredential = await auth.signInAnonymously();
      this.userId = userCredential.user.uid;
      this.isAvailable = true;
      console.log('Cloud storage initialized successfully');
      return true;
    } catch (error) {
      console.error('Cloud storage initialization failed:', error);
      this.isAvailable = false;
      return false;
    }
  },

  // Save data to cloud
  async save(data) {
    if (!this.isAvailable || !this.userId) {
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }

    try {
      await db.collection('budgets').doc(this.userId).set({
        data: data,
        lastModified: firebase.firestore.FieldValue.serverTimestamp(),
        version: APP_CONFIG.version
      });
      
      // Also save to localStorage as backup
      StorageUtils.set(APP_CONFIG.storageKey, data);
      return true;
    } catch (error) {
      console.error('Cloud save error:', error);
      // Fallback to localStorage
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }
  },

  // Load data from cloud
  async load() {
    if (!this.isAvailable || !this.userId) {
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }

    try {
      const doc = await db.collection('budgets').doc(this.userId).get();
      
      if (doc.exists) {
        const cloudData = doc.data();
        const data = cloudData.data;
        
        // Save to localStorage as backup
        StorageUtils.set(APP_CONFIG.storageKey, data);
        return data;
      } else {
        // No cloud data, try localStorage
        return StorageUtils.get(APP_CONFIG.storageKey, null);
      }
    } catch (error) {
      console.error('Cloud load error:', error);
      // Fallback to localStorage
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }
  },

  // Check if cloud data is newer than local
  async checkForUpdates() {
    if (!this.isAvailable || !this.userId) {
      return false;
    }

    try {
      const doc = await db.collection('budgets').doc(this.userId).get();
      
      if (doc.exists) {
        const cloudData = doc.data();
        const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
        
        if (!localData) return true;
        
        // Compare timestamps if available
        if (cloudData.lastModified && localData.lastSaved) {
          return cloudData.lastModified.toDate() > new Date(localData.lastSaved);
        }
        
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Update check error:', error);
      return false;
    }
  },

  // Sync data between local and cloud
  async sync() {
    if (!this.isAvailable) {
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }

    try {
      const hasUpdates = await this.checkForUpdates();
      
      if (hasUpdates) {
        return await this.load();
      } else {
        const localData = StorageUtils.get(APP_CONFIG.storageKey, null);
        if (localData) {
          await this.save(localData);
        }
        return localData;
      }
    } catch (error) {
      console.error('Sync error:', error);
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }
  },

  // Get connection status
  isConnected() {
    return this.isAvailable && this.userId !== null;
  }
};

// Enhanced Storage Utilities with Cloud Integration
const EnhancedStorage = {
  // Initialize storage system
  async init() {
    try {
      await CloudStorage.init();
    } catch (error) {
      console.warn('Cloud storage initialization failed, using localStorage only:', error);
    }
  },

  // Save data (tries cloud first, falls back to local)
  async save(data) {
    // Add timestamp
    data.lastSaved = new Date().toISOString();
    
    try {
      if (CloudStorage.isConnected()) {
        return await CloudStorage.save(data);
      } else {
        return StorageUtils.set(APP_CONFIG.storageKey, data);
      }
    } catch (error) {
      console.warn('Save error, falling back to localStorage:', error);
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }
  },

  // Load data (tries cloud first, falls back to local)
  async load() {
    try {
      if (CloudStorage.isConnected()) {
        return await CloudStorage.load();
      } else {
        return StorageUtils.get(APP_CONFIG.storageKey, null);
      }
    } catch (error) {
      console.warn('Load error, falling back to localStorage:', error);
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }
  },

  // Sync data
  async sync() {
    try {
      return await CloudStorage.sync();
    } catch (error) {
      console.warn('Sync error:', error);
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }
  },

  // Get storage status
  getStatus() {
    return {
      cloudAvailable: CloudStorage.isAvailable,
      cloudConnected: CloudStorage.isConnected(),
      userId: CloudStorage.userId
    };
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.CloudStorage = CloudStorage;
  window.EnhancedStorage = EnhancedStorage;
  window.initializeFirebase = initializeFirebase;
}