// Firebase Storage Integration for Budget App

// Firebase Configuration
const firebaseConfig = {
  apiKey: "ATZaEVeSSGtLRpQq7e_ZQKPjOZkRq-YRKOpSjE",
  authDomain: "my-budżet.firebaseapp.com", 
  databaseURL: "https://my-budżet-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-budżet",
  storageBucket: "my-budżet.firebasestorage.app",
  messagingSenderId: "38303046323",
  appId: "1:38303046323:web:e60dbad863a6db92c6",
  measurementId: "G-3SWHMH2ZF8"
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
    
    console.log('Firebase Realtime Database initialized successfully');
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
    // Initialize Firebase first
    if (!initializeFirebase()) {
      console.info('Firebase not available, using localStorage only');
      this.isAvailable = false;
      return false;
    }

    try {
      // Try to sign in anonymously for user identification
      const userCredential = await auth.signInAnonymously();
      this.userId = userCredential.user.uid;
      this.isAvailable = true;
      console.log('Cloud storage initialized successfully with user:', this.userId);
      return true;
    } catch (error) {
      console.error('Cloud storage initialization failed:', error);
      this.isAvailable = false;
      return false;
    }
  },

  // Save data to cloud (Realtime Database)
  async save(data) {
    if (!this.isAvailable || !this.userId || !database) {
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }

    try {
      await database.ref(`budgets/${this.userId}`).set({
        data: data,
        lastModified: firebase.database.ServerValue.TIMESTAMP,
        version: APP_CONFIG.version
      });
      
      // Also save to localStorage as backup
      StorageUtils.set(APP_CONFIG.storageKey, data);
      console.log('Data saved to Firebase Realtime Database');
      return true;
    } catch (error) {
      console.error('Cloud save error:', error);
      // Fallback to localStorage
      return StorageUtils.set(APP_CONFIG.storageKey, data);
    }
  },

  // Load data from cloud (Realtime Database)
  async load() {
    if (!this.isAvailable || !this.userId || !database) {
      return StorageUtils.get(APP_CONFIG.storageKey, null);
    }

    try {
      const snapshot = await database.ref(`budgets/${this.userId}`).once('value');
      
      if (snapshot.exists()) {
        const cloudData = snapshot.val();
        const data = cloudData.data;
        
        // Save to localStorage as backup
        StorageUtils.set(APP_CONFIG.storageKey, data);
        console.log('Data loaded from Firebase Realtime Database');
        return data;
      } else {
        // No cloud data, try localStorage
        console.log('No cloud data found, using localStorage');
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
    if (!this.isAvailable || !this.userId || !database) {
      return false;
    }

    try {
      const snapshot = await database.ref(`budgets/${this.userId}/lastModified`).once('value');
      
      if (snapshot.exists()) {
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