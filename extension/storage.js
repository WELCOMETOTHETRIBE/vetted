// IndexedDB storage utility for Vetted extension
// Replaces chrome.storage.local with IndexedDB for unlimited storage

const DB_NAME = 'vettedExtensionDB';
const DB_VERSION = 1;
const STORE_NAME = 'profiles';

let dbInstance = null;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('linkedinUrl', 'linkedinUrl', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// Get all profiles
async function getAllProfiles() {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        console.log(`IndexedDB getAllProfiles: Found ${results.length} profiles`);
        if (results.length > 0) {
          console.log("First profile sample:", results[0]);
        }
        resolve(results);
      };

      request.onerror = () => {
        console.error('IndexedDB getAllProfiles error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting all profiles:', error);
    return [];
  }
}

// Add a profile
async function addProfile(profile) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Add createdAt if not present
      if (!profile.createdAt) {
        profile.createdAt = new Date().toISOString();
      }
      
      console.log('IndexedDB addProfile: Adding profile', {
        hasExtractionMetadata: !!profile.extraction_metadata,
        hasPersonalInfo: !!profile.personal_info,
        createdAt: profile.createdAt
      });
      
      const request = store.add(profile);

      request.onsuccess = () => {
        console.log('IndexedDB addProfile: Success, ID:', request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB addProfile error:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error adding profile:', error);
    throw error;
  }
}

// Update a profile by index
async function updateProfileByIndex(index, profile) {
  try {
    const profiles = await getAllProfiles();
    if (index < 0 || index >= profiles.length) {
      throw new Error('Invalid index');
    }
    
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Get the profile to update
      const profileToUpdate = profiles[index];
      if (!profileToUpdate) {
        reject(new Error('Profile not found'));
        return;
      }
      
      // Merge updates
      const updatedProfile = { ...profileToUpdate, ...profile };
      updatedProfile.updatedAt = new Date().toISOString();
      
      const request = store.put(updatedProfile);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Delete a profile by index
async function deleteProfileByIndex(index) {
  try {
    const profiles = await getAllProfiles();
    if (index < 0 || index >= profiles.length) {
      throw new Error('Invalid index');
    }
    
    const profileToDelete = profiles[index];
    if (!profileToDelete || !profileToDelete.id) {
      throw new Error('Profile not found');
    }
    
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(profileToDelete.id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

// Clear all profiles
async function clearAllProfiles() {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error clearing profiles:', error);
    throw error;
  }
}

// Get storage size estimate
async function getStorageSize() {
  try {
    const profiles = await getAllProfiles();
    const size = new Blob([JSON.stringify(profiles)]).size;
    return {
      bytes: size,
      mb: (size / (1024 * 1024)).toFixed(2),
      count: profiles.length
    };
  } catch (error) {
    console.error('Error getting storage size:', error);
    return { bytes: 0, mb: '0', count: 0 };
  }
}

// Settings storage (still use chrome.storage for settings as they're small)
const SettingsStorage = {
  async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (data) => {
        resolve(data);
      });
    });
  },

  async set(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  async getBytesInUse() {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        resolve(bytes || 0);
      });
    });
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAllProfiles,
    addProfile,
    updateProfileByIndex,
    deleteProfileByIndex,
    clearAllProfiles,
    getStorageSize,
    SettingsStorage
  };
}

// Make available globally (for both window and service worker contexts)
const VettedStorage = {
  getAllProfiles,
  addProfile,
  updateProfileByIndex,
  deleteProfileByIndex,
  clearAllProfiles,
  getStorageSize,
  SettingsStorage,
  initDB // Export initDB for initialization
};

// Export for window context (popup)
if (typeof window !== 'undefined') {
  window.VettedStorage = VettedStorage;
  console.log("VettedStorage initialized in window context");
}

// Export for service worker context
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.VettedStorage = VettedStorage;
  console.log("VettedStorage initialized in service worker context");
}

// Also make available globally without window/self prefix for compatibility
if (typeof globalThis !== 'undefined') {
  globalThis.VettedStorage = VettedStorage;
}

