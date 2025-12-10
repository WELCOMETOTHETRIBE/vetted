// NOTE: This extension performs local-only DOM scraping. Users are responsible
// for complying with site terms of service (e.g., LinkedIn ToS) and applicable laws.
// This is intended for internal/testing use only.

// Import profile processor functions
importScripts('profileProcessor.js');
importScripts('storage.js');

// Initialize storage on install
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize IndexedDB (no need to check profileDocuments - IndexedDB handles it)
  try {
    await VettedStorage.initDB();
    console.log("IndexedDB initialized");
  } catch (error) {
    console.error("Error initializing IndexedDB:", error);
  }
  
  // Set default Vetted API URL if not already configured (use chrome.storage for settings)
  chrome.storage.local.get(["vettedApiUrl"], (data) => {
    if (!data.vettedApiUrl) {
      const defaultVettedApiUrl = "https://vetted-production.up.railway.app/api/candidates/upload";
      chrome.storage.local.set({ vettedApiUrl: defaultVettedApiUrl }, () => {
        console.log("Default Vetted API URL set on install:", defaultVettedApiUrl);
      });
    }
  });
});

// Function to send profile to Google Sheets
async function sendProfileToSheets(profileDoc) {
  try {
    // Get settings
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(["googleSheetsUrl", "autoSendToSheets"], resolve);
    });

    if (!settings.autoSendToSheets || !settings.googleSheetsUrl) {
      return { success: false, error: "Auto-send not enabled or URL not configured" };
    }

    // Process the profile
    if (typeof ProfileProcessor === 'undefined') {
      return { success: false, error: "Profile processor not available" };
    }

    const processed = ProfileProcessor.processProfileDocument(profileDoc);
    if (!processed) {
      return { success: false, error: "Profile validation failed" };
    }

    // Send to Google Sheets
    const response = await fetch(settings.googleSheetsUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([processed]),
    });

    // With no-cors, we can't read response, but assume success
    return { success: true };
  } catch (error) {
    console.error("Error sending to Google Sheets:", error);
    return { success: false, error: error.message };
  }
}

// Helper function to estimate storage size
function estimateStorageSize(obj) {
  return new Blob([JSON.stringify(obj)]).size;
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_PROFILE_DOCUMENT" && typeof message.payload === "object" && message.payload !== null) {
    try {
      // Get current profiles
      chrome.storage.local.get(["profileDocuments"], (data) => {
        try {
          const currentList = Array.isArray(data.profileDocuments) ? data.profileDocuments : [];

          // Check if profile already exists (by URL) to avoid duplicates
          const profileUrl = message.payload.extraction_metadata?.source_url || 
                            message.payload.personal_info?.profile_url ||
                            message.payload.comprehensive_data?.find(item => 
                              item.category === 'metadata' && item.data?.source_url
                            )?.data?.source_url;

          // Check for duplicate by URL
          const isDuplicate = profileUrl && currentList.some(existing => {
            const existingUrl = existing.extraction_metadata?.source_url || 
                              existing.personal_info?.profile_url ||
                              existing.comprehensive_data?.find(item => 
                                item.category === 'metadata' && item.data?.source_url
                              )?.data?.source_url;
            return existingUrl === profileUrl;
          });

          if (isDuplicate) {
            sendResponse({ 
              success: false, 
              error: "Profile already exists",
              count: currentList.length 
            });
            return;
          }

          // Estimate size of new profile
          const newProfileSize = estimateStorageSize(message.payload);
          const currentListSize = estimateStorageSize(currentList);
          const estimatedNewSize = currentListSize + newProfileSize;
          
          // Chrome storage limit is ~10MB
          const STORAGE_LIMIT = 10 * 1024 * 1024; // 10MB
          const STORAGE_WARNING_THRESHOLD = STORAGE_LIMIT * 0.85; // 85% threshold
          
          // Check storage before attempting to save
          chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
            const currentUsage = bytesInUse || 0;
            const wouldExceed = (currentUsage + newProfileSize) > STORAGE_LIMIT;
            
            if (wouldExceed) {
              const mbUsed = (currentUsage / (1024 * 1024)).toFixed(2);
              const mbLimit = (STORAGE_LIMIT / (1024 * 1024)).toFixed(0);
              const errorMsg = `Storage full (${mbUsed}MB / ${mbLimit}MB). Please clear some profiles using the extension popup.`;
              console.warn("Storage would exceed limit:", {
                currentUsage: currentUsage,
                newProfileSize: newProfileSize,
                wouldExceed: wouldExceed
              });
              sendResponse({ 
                success: false, 
                error: errorMsg,
                count: currentList.length,
                storageInfo: {
                  used: currentUsage,
                  limit: STORAGE_LIMIT,
                  percentage: ((currentUsage / STORAGE_LIMIT) * 100).toFixed(1)
                }
              });
              return;
            }
            
            // Warn if approaching limit
            if (estimatedNewSize > STORAGE_WARNING_THRESHOLD) {
              console.warn("Storage approaching limit:", {
                estimatedSize: estimatedNewSize,
                percentage: ((estimatedNewSize / STORAGE_LIMIT) * 100).toFixed(1) + "%"
              });
            }

            currentList.push(message.payload);

            // Try to save with error handling
            chrome.storage.local.set({ profileDocuments: currentList }, () => {
              if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message || "Storage quota exceeded. Please clear some profiles.";
                
                // Get updated storage usage for accurate reporting
                chrome.storage.local.getBytesInUse(null, (bytesAfterError) => {
                  const finalUsage = bytesAfterError || currentUsage;
                  const storageInfo = {
                    used: finalUsage,
                    limit: STORAGE_LIMIT,
                    percentage: ((finalUsage / STORAGE_LIMIT) * 100).toFixed(1)
                  };
                  
                  console.error("Storage error:", {
                    error: chrome.runtime.lastError,
                    currentListSize: currentList.length,
                    estimatedSize: estimatedNewSize,
                    storageInfo: {
                      used: `${(storageInfo.used / (1024 * 1024)).toFixed(2)}MB`,
                      limit: `${(storageInfo.limit / (1024 * 1024)).toFixed(0)}MB`,
                      percentage: `${storageInfo.percentage}%`
                    }
                  });
                  
                  sendResponse({ 
                    success: false, 
                    error: errorMsg,
                    count: currentList.length - 1, // Don't count the failed one
                    storageInfo: storageInfo
                  });
                });
                return;
              }
              
              sendResponse({ success: true, count: currentList.length });
            });
          });
        } catch (error) {
          console.error("Error processing profile save:", error);
          sendResponse({ 
            success: false, 
            error: error.message || "Unknown error saving profile",
            count: 0
          });
        }
      });
    } catch (error) {
      console.error("Error in message handler:", error);
      sendResponse({ 
        success: false, 
        error: error.message || "Unknown error",
        count: 0
      });
    }

    // Keep the message channel open for async response
    return true;
  }

  // Handle auto-send request
  if (message.type === "AUTO_SEND_TO_SHEETS" && typeof message.payload === "object" && message.payload !== null) {
    sendProfileToSheets(message.payload).then((result) => {
      sendResponse(result);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });

    // Keep the message channel open for async response
    return true;
  }

  // Handle queue for batch auto-send to Vetted
  if (message.type === "QUEUE_FOR_VETTED" && typeof message.payload === "object" && message.payload !== null) {
    // Get current queue
    chrome.storage.local.get(["vettedQueue"], (data) => {
      const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
      
      // Add profile to queue
      queue.push(message.payload);
      
      // Save queue
      chrome.storage.local.set({ vettedQueue: queue }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving queue:", chrome.runtime.lastError);
          sendResponse({ 
            success: false, 
            error: chrome.runtime.lastError.message || "Failed to save queue",
            queuedCount: queue.length - 1
          });
          return;
        }
        
        sendResponse({ success: true, queuedCount: queue.length });
        
        // Auto-send batch if queue reaches 10 profiles or after 10 seconds
        if (queue.length >= 10) {
          sendBatchToVetted();
        } else if (queue.length === 1) {
          // Start timer for first item in queue
          setTimeout(() => {
            sendBatchToVetted();
          }, 10000); // 10 seconds
        }
      });
    });

    // Keep the message channel open for async response
    return true;
  }

  // Handle manual batch send request
  if (message.type === "SEND_BATCH_TO_VETTED") {
    sendBatchToVetted().then((result) => {
      sendResponse(result);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });

    return true;
  }

  // Handle auto-send to Vetted (legacy - for immediate single sends)
  if (message.type === "AUTO_SEND_TO_VETTED" && typeof message.payload === "object" && message.payload !== null) {
    sendProfileToVetted(message.payload).then((result) => {
      sendResponse(result);
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });

    // Keep the message channel open for async response
    return true;
  }
});

// Function to send batch of profiles to Vetted
async function sendBatchToVetted() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["vettedQueue", "vettedApiUrl", "vettedApiKey"], async (data) => {
      const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
      
      if (queue.length === 0) {
        resolve({ success: true, sent: 0, message: "No profiles in queue" });
        return;
      }

      if (!data.vettedApiUrl) {
        resolve({ success: false, error: "Vetted API URL not configured" });
        return;
      }

      try {
        // Process all profiles in queue
        if (typeof ProfileProcessor === 'undefined') {
          resolve({ success: false, error: "Profile processor not available" });
          return;
        }

        const processed = queue.map(profileDoc => {
          try {
            return ProfileProcessor.processProfileDocument(profileDoc);
          } catch (e) {
            console.error("Error processing profile:", e);
            return null;
          }
        }).filter(p => p !== null);

        if (processed.length === 0) {
          // Clear queue if all failed
          chrome.storage.local.set({ vettedQueue: [] }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error clearing queue:", chrome.runtime.lastError);
            }
          });
          resolve({ success: false, error: "No valid profiles to send" });
          return;
        }

        // Send batch to Vetted API
        const headers = {
          "Content-Type": "application/json",
        };

        if (data.vettedApiKey) {
          headers["Authorization"] = `Bearer ${data.vettedApiKey}`;
        }

        const response = await fetch(data.vettedApiUrl, {
          method: "POST",
          headers: headers,
          credentials: "include",
          body: JSON.stringify(processed),
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage += ` - ${errorText.substring(0, 200)}`;
              }
            } catch (textError) {
              // Ignore
            }
          }
          resolve({ success: false, error: errorMessage, sent: 0 });
          return;
        }

        const result = await response.json();
        
        // Clear sent profiles from storage after successful send
        // This prevents storage from filling up
        chrome.storage.local.get(["profileDocuments"], (data) => {
          const allProfiles = Array.isArray(data.profileDocuments) ? data.profileDocuments : [];
          
          // Remove sent profiles from storage (match by LinkedIn URL)
          const sentUrls = new Set(processed.map(p => p["Linkedin URL"] || p.linkedinUrl).filter(Boolean));
          const remainingProfiles = allProfiles.filter(profile => {
            const profileUrl = profile.extraction_metadata?.source_url || 
                              profile.personal_info?.profile_url ||
                              profile.comprehensive_data?.find(item => 
                                item.category === 'metadata' && item.data?.source_url
                              )?.data?.source_url;
            return !sentUrls.has(profileUrl);
          });
          
          // Clear queue and remove sent profiles from storage
          chrome.storage.local.set({ 
            vettedQueue: [],
            profileDocuments: remainingProfiles
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error clearing sent profiles from storage:", chrome.runtime.lastError);
            } else {
              console.log(`Cleared ${allProfiles.length - remainingProfiles.length} sent profiles from storage`);
            }
          });
        });
        
        resolve({ 
          success: true, 
          sent: processed.length,
          result: result,
          message: `Successfully sent ${processed.length} profile(s) to Vetted`
        });
      } catch (error) {
        console.error("Batch send error:", error);
        resolve({ success: false, error: error.message, sent: 0 });
      }
    });
  });
}

// Function to send profile to Vetted API
async function sendProfileToVetted(profileDoc) {
  try {
    // Get settings
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(["vettedApiUrl", "vettedApiKey", "autoSendToVetted"], resolve);
    });

    if (!settings.autoSendToVetted || !settings.vettedApiUrl) {
      return { success: false, error: "Auto-send to Vetted not enabled or URL not configured" };
    }

    // Process the profile
    if (typeof ProfileProcessor === 'undefined') {
      return { success: false, error: "Profile processor not available" };
    }

    const processed = ProfileProcessor.processProfileDocument(profileDoc);
    if (!processed) {
      return { success: false, error: "Profile validation failed" };
    }

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
    };

    if (settings.vettedApiKey) {
      headers["Authorization"] = `Bearer ${settings.vettedApiKey}`;
    }

    // Send to Vetted API
    const response = await fetch(settings.vettedApiUrl, {
      method: "POST",
      headers: headers,
      credentials: "include", // Include cookies for session-based auth
      body: JSON.stringify([processed]),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        // Include more details if available
        if (errorData.details) {
          errorMessage += ` - ${JSON.stringify(errorData.details)}`;
        }
      } catch (e) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 200)}`;
          }
        } catch (textError) {
          // If both fail, use the status
          console.error("Could not parse error response:", textError);
        }
      }
      
      // Provide helpful messages for common errors
      if (response.status === 401) {
        errorMessage = "Unauthorized: Please make sure you're logged into Vetted as an admin user";
      } else if (response.status === 403) {
        errorMessage = "Forbidden: You must be an admin user to upload candidates";
      } else if (response.status === 404) {
        errorMessage = "Not Found: Check that your API URL is correct (should end with /api/candidates/upload)";
      } else if (response.status === 0 || response.status === undefined) {
        errorMessage = "Network Error: Check CORS settings or that the API URL is accessible";
      }
      
      return { success: false, error: errorMessage };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    console.error("Error sending to Vetted:", error);
    let errorMessage = error.message || "Unknown error";
    
    // Provide more context for network errors
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      errorMessage = "Network Error: Could not reach Vetted API. Check your API URL and CORS settings.";
    } else if (error.message.includes("CORS")) {
      errorMessage = "CORS Error: The API server needs to allow requests from browser extensions.";
    }
    
    return { success: false, error: errorMessage };
  }
}


