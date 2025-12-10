// Chrome storage utility for Vetted extension
// Uses chrome.storage.local for profile storage

const STORAGE_KEY = 'profileDocuments';

// Get all profiles from chrome.storage.local
async function getAllProfiles() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      const profiles = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      console.log(`Chrome storage getAllProfiles: Found ${profiles.length} profiles`);
      resolve(profiles);
    });
  });
}

// Add a profile
async function addProfile(profile) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      const profiles = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      
      // Add createdAt if not present
      if (!profile.createdAt) {
        profile.createdAt = new Date().toISOString();
      }
      
      profiles.push(profile);
      
      chrome.storage.local.set({ [STORAGE_KEY]: profiles }, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome storage addProfile error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Chrome storage addProfile: Success, total profiles:', profiles.length);
          resolve(profiles.length);
        }
      });
    });
  });
}

// Update a profile by index
async function updateProfileByIndex(index, profile) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      const profiles = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      
      if (index < 0 || index >= profiles.length) {
        reject(new Error('Invalid index'));
        return;
      }
      
      // Merge updates
      profiles[index] = { ...profiles[index], ...profile };
      profiles[index].updatedAt = new Date().toISOString();
      
      chrome.storage.local.set({ [STORAGE_KEY]: profiles }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}

// Delete a profile by index
async function deleteProfileByIndex(index) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      const profiles = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
      
      if (index < 0 || index >= profiles.length) {
        reject(new Error('Invalid index'));
        return;
      }
      
      profiles.splice(index, 1);
      
      chrome.storage.local.set({ [STORAGE_KEY]: profiles }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}

// Clear all profiles
async function clearAllProfiles() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Get storage size estimate
async function getStorageSize() {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse([STORAGE_KEY], (bytes) => {
      chrome.storage.local.get([STORAGE_KEY], (data) => {
        const profiles = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
        resolve({
          bytes: bytes || 0,
          mb: ((bytes || 0) / (1024 * 1024)).toFixed(2),
          count: profiles.length
        });
      });
    });
  });
}

// Settings storage (wrapper for chrome.storage.local)
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
const VettedStorage = {
  getAllProfiles,
  addProfile,
  updateProfileByIndex,
  deleteProfileByIndex,
  clearAllProfiles,
  getStorageSize,
  SettingsStorage
};

// Make available globally (for both window and service worker contexts)
if (typeof window !== 'undefined') {
  window.VettedStorage = VettedStorage;
  console.log("VettedStorage initialized in window context (chrome.storage.local)");
}

if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
  self.VettedStorage = VettedStorage;
  console.log("VettedStorage initialized in service worker context (chrome.storage.local)");
}

if (typeof globalThis !== 'undefined') {
  globalThis.VettedStorage = VettedStorage;
}
