// NOTE: This extension performs local-only DOM scraping. Users are responsible
// for complying with site terms of service (e.g., LinkedIn ToS) and applicable laws.
// This is intended for internal/testing use only.

// Import profile processor functions
importScripts('profileProcessor.js');

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["profileDocuments"], (data) => {
    if (!Array.isArray(data.profileDocuments)) {
      chrome.storage.local.set({ profileDocuments: [] });
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

// Listen for messages from the content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message.type);
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
          
          // Chrome storage limit is ~10MB, warn if approaching limit
          const STORAGE_LIMIT = 10 * 1024 * 1024; // 10MB
          if (estimatedNewSize > STORAGE_LIMIT * 0.9) {
            console.warn("Storage approaching limit:", estimatedNewSize, "bytes");
          }

          currentList.push(message.payload);

          // Try to save with error handling
          chrome.storage.local.set({ profileDocuments: currentList }, () => {
            if (chrome.runtime.lastError) {
              console.error("Storage error:", chrome.runtime.lastError);
              sendResponse({ 
                success: false, 
                error: chrome.runtime.lastError.message || "Storage quota exceeded. Please clear some profiles.",
                count: currentList.length - 1 // Don't count the failed one
              });
              return;
            }
            
            sendResponse({ success: true, count: currentList.length });
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
        sendResponse({ success: true, queuedCount: queue.length });
        
        // Auto-send batch if queue reaches 5 profiles or after 10 seconds
        if (queue.length >= 5) {
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

  // Handle sending already-processed profiles from viewer
  if (message.type === "SEND_PROCESSED_TO_VETTED" && Array.isArray(message.payload)) {
    console.log("Received SEND_PROCESSED_TO_VETTED message with", message.payload.length, "profiles");
    
    // Capture sendResponse before async operation
    const respond = (result) => {
      try {
        sendResponse(result);
      } catch (e) {
        console.error("Error calling sendResponse:", e);
      }
    };
    
    // Use async/await pattern for better error handling
    sendProcessedProfilesToVetted(message.payload, message.apiKey)
      .then((result) => {
        console.log("sendProcessedProfilesToVetted result:", result);
        respond(result);
      })
      .catch((error) => {
        console.error("Error in SEND_PROCESSED_TO_VETTED:", error);
        respond({ success: false, error: error.message || "Unknown error" });
      });

    return true; // Keep channel open for async response
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
    // Hardcoded Vetted API URL
    const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
    
    chrome.storage.local.get(["vettedQueue", "vettedApiKey"], async (data) => {
      const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
      
      if (queue.length === 0) {
        resolve({ success: true, sent: 0, message: "No profiles in queue" });
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
          chrome.storage.local.set({ vettedQueue: [] });
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

        const response = await fetch(VETTED_API_URL, {
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
        
        // Clear queue after successful send
        chrome.storage.local.set({ vettedQueue: [] });
        
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

// Function to send already-processed profiles to Vetted API
async function sendProcessedProfilesToVetted(processedProfiles, apiKey) {
  try {
    // Hardcoded Vetted API URL
    const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
    
    if (!processedProfiles || processedProfiles.length === 0) {
      return { success: false, error: "No profiles to send" };
    }

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Send to Vetted API with timeout
    const timeoutMs = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let response;
    try {
      response = await fetch(VETTED_API_URL, {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: JSON.stringify(processedProfiles),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs/1000} seconds`);
      }
      throw new Error(`Network error: ${fetchError.message}`);
    }

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
      
      if (response.status === 401) {
        errorMessage = "Unauthorized: Please make sure you're logged into Vetted as an admin user";
      } else if (response.status === 403) {
        errorMessage = "Forbidden: You must be an admin user to upload candidates";
      } else if (response.status === 404) {
        errorMessage = "Not Found: Check that your API URL is correct";
      }
      
      return { success: false, error: errorMessage };
    }

    const result = await response.json();
    return { 
      success: true, 
      sent: processedProfiles.length,
      result: result 
    };
  } catch (error) {
    console.error("Error sending processed profiles to Vetted:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

// Function to send profile to Vetted API
async function sendProfileToVetted(profileDoc) {
  try {
    // Hardcoded Vetted API URL
    const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
    
    // Get settings
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(["vettedApiKey", "autoSendToVetted"], resolve);
    });

    if (!settings.autoSendToVetted) {
      return { success: false, error: "Auto-send to Vetted not enabled" };
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
    const response = await fetch(VETTED_API_URL, {
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


