// NOTE: This extension performs local-only DOM scraping. Users are responsible
// for complying with site terms of service (e.g., LinkedIn ToS) and applicable laws.
// This is intended for internal/testing use only.

// Import profile processor functions with error handling
try {
  importScripts('profileProcessor.js');
  console.log("[DEBUG-BG] profileProcessor.js loaded successfully");
} catch (error) {
  console.error("[DEBUG-BG] ERROR loading profileProcessor.js:", error);
  console.error("[DEBUG-BG] Error details:", {
    message: error.message,
    name: error.name,
    stack: error.stack
  });
  // Continue anyway - ProfileProcessor might be loaded elsewhere or we'll handle errors gracefully
}

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("[DEBUG-BG] Extension installed/reloaded");
  console.log("[DEBUG-BG] Extension context valid:", isExtensionContextValid());
  console.log("[DEBUG-BG] ProfileProcessor available:", typeof ProfileProcessor !== 'undefined');
  
  if (!isExtensionContextValid()) {
    console.error("[DEBUG-BG] WARNING: Extension context invalid during install");
    return;
  }
  
  chrome.storage.local.get(["profileDocuments"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("[DEBUG-BG] Error accessing storage:", chrome.runtime.lastError);
      return;
    }
    if (!Array.isArray(data.profileDocuments)) {
      chrome.storage.local.set({ profileDocuments: [] }, () => {
        if (chrome.runtime.lastError) {
          console.error("[DEBUG-BG] Error initializing storage:", chrome.runtime.lastError);
        } else {
          console.log("[DEBUG-BG] Storage initialized successfully");
        }
      });
    } else {
      console.log("[DEBUG-BG] Storage already initialized with", data.profileDocuments.length, "profiles");
    }
  });
});

// Listen for alarms - this handles the 10-second delay for batch sending and keep-alive
chrome.alarms.onAlarm.addListener((alarm) => {
  // Handle keep-alive alarm (just wake up, do nothing)
  if (alarm.name === "keepAlive") {
    console.log("[DEBUG-BG] Keep-alive alarm triggered");
    return;
  }
  
  console.log("[DEBUG-BG] ========== ALARM TRIGGERED ==========");
  console.log("[DEBUG-BG] Alarm name:", alarm.name);
  console.log("[DEBUG-BG] Alarm scheduled time:", alarm.scheduledTime);
  console.log("[DEBUG-BG] Current time:", Date.now());
  console.log("[DEBUG-BG] Extension context valid:", isExtensionContextValid());
  console.log("[DEBUG-BG] ProfileProcessor available:", typeof ProfileProcessor !== 'undefined');
  
  if (alarm.name === "sendBatchToVetted") {
    console.log("[DEBUG-BG] Processing sendBatchToVetted alarm...");
    
    sendBatchToVetted().then((result) => {
      console.log("[DEBUG-BG] Batch send result:", result);
    }).catch((error) => {
      console.error("[DEBUG-BG] Batch send error:", error);
    });
    
    // Clear the alarm
    chrome.alarms.clear("sendBatchToVetted", (wasCleared) => {
      console.log("[DEBUG-BG] Alarm cleared:", wasCleared);
    });
  }
});

// Also check for queued profiles when service worker wakes up
chrome.runtime.onStartup.addListener(() => {
  console.log("[DEBUG-BG] Service worker started, checking for queued profiles...");
  chrome.storage.local.get(["vettedQueue"], (data) => {
    const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
    if (queue.length > 0) {
      console.log("[DEBUG-BG] Found", queue.length, "queued profiles on startup, sending...");
      sendBatchToVetted();
    }
  });
});

// Check for queued profiles when extension is loaded/reloaded
chrome.runtime.onInstalled.addListener(() => {
  console.log("[DEBUG-BG] Extension installed/reloaded, checking for queued profiles...");
  setTimeout(() => {
    chrome.storage.local.get(["vettedQueue"], (data) => {
      const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
      if (queue.length > 0) {
        console.log("[DEBUG-BG] Found", queue.length, "queued profiles after install, sending...");
        sendBatchToVetted();
      }
    });
  }, 2000); // Wait 2 seconds for everything to initialize
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

// Check if extension context is valid
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id !== undefined;
  } catch (e) {
    return false;
  }
}

// Keep service worker alive by setting up periodic alarms
chrome.alarms.create("keepAlive", { periodInMinutes: 1 }, () => {
  if (chrome.runtime.lastError) {
    console.log("[DEBUG-BG] Could not create keepAlive alarm:", chrome.runtime.lastError);
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    // Just wake up the service worker, do nothing
    console.log("[DEBUG-BG] Keep-alive alarm triggered");
    return;
  }
});

// Listen for messages from the content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[DEBUG-BG] ========== Message listener called ==========");
  console.log("[DEBUG-BG] Message type:", message?.type);
  console.log("[DEBUG-BG] Has sendResponse:", typeof sendResponse === 'function');
  console.log("[DEBUG-BG] Service worker active:", self.serviceWorker?.state || "unknown");
  
  // Check extension context validity
  if (!isExtensionContextValid()) {
    console.error("[DEBUG-BG] ERROR: Extension context invalidated");
    try {
      sendResponse({ success: false, error: "Extension context invalidated. Please reload the extension." });
    } catch (e) {
      console.error("[DEBUG-BG] Could not send error response:", e);
    }
    return false;
  }
  
  // Validate message
  if (!message || !message.type) {
    console.error("[DEBUG-BG] Invalid message received:", message);
    try {
      sendResponse({ success: false, error: "Invalid message format" });
    } catch (e) {
      console.error("[DEBUG-BG] Could not send error response:", e);
    }
    return false;
  }
  
  console.log("[DEBUG-BG] ========== Message received ==========");
  console.log("[DEBUG-BG] Message type:", message.type);
  console.log("[DEBUG-BG] Sender:", sender);
  console.log("[DEBUG-BG] Has payload:", !!message.payload);
  if (message.payload && Array.isArray(message.payload)) {
    console.log("[DEBUG-BG] Payload is array, length:", message.payload.length);
  }
  console.log("[DEBUG-BG] Extension context valid:", isExtensionContextValid());
  console.log("[DEBUG-BG] ProfileProcessor available:", typeof ProfileProcessor !== 'undefined');
  console.log("[DEBUG-BG] =====================================");
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
    console.log("[DEBUG-BG] ========== QUEUE_FOR_VETTED received ==========");
    console.log("[DEBUG-BG] Profile payload:", !!message.payload);
    console.log("[DEBUG-BG] Extension context valid:", isExtensionContextValid());
    console.log("[DEBUG-BG] ProfileProcessor available:", typeof ProfileProcessor !== 'undefined');
    
    // Get current queue
    chrome.storage.local.get(["vettedQueue"], (data) => {
      if (chrome.runtime.lastError) {
        console.error("[DEBUG-BG] Error getting queue:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      
      const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
      console.log("[DEBUG-BG] Current queue length:", queue.length);
      
      // Add profile to queue
      queue.push(message.payload);
      console.log("[DEBUG-BG] Added profile to queue, new length:", queue.length);
      
      // Save queue
      chrome.storage.local.set({ vettedQueue: queue }, () => {
        if (chrome.runtime.lastError) {
          console.error("[DEBUG-BG] Error saving queue:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        console.log("[DEBUG-BG] Queue saved successfully");
        sendResponse({ success: true, queuedCount: queue.length });
        
        // Auto-send batch if queue reaches 5 profiles or after 10 seconds
        if (queue.length >= 5) {
          console.log("[DEBUG-BG] Queue reached 5 profiles, sending immediately...");
          sendBatchToVetted().then((result) => {
            console.log("[DEBUG-BG] Batch send result:", result);
          }).catch((error) => {
            console.error("[DEBUG-BG] Batch send error:", error);
          });
        } else if (queue.length === 1) {
          // Use chrome.alarms instead of setTimeout - alarms persist across service worker restarts
          console.log("[DEBUG-BG] Starting 10-second alarm for auto-send...");
          chrome.alarms.create("sendBatchToVetted", { delayInMinutes: 10 / 60 }, () => {
            if (chrome.runtime.lastError) {
              console.error("[DEBUG-BG] Error creating alarm:", chrome.runtime.lastError);
              // Fallback: send immediately if alarm creation fails
              console.log("[DEBUG-BG] Alarm creation failed, sending immediately as fallback...");
              sendBatchToVetted().then((result) => {
                console.log("[DEBUG-BG] Fallback batch send result:", result);
              }).catch((error) => {
                console.error("[DEBUG-BG] Fallback batch send error:", error);
              });
            } else {
              console.log("[DEBUG-BG] Alarm created successfully");
              // Verify alarm was created
              chrome.alarms.get("sendBatchToVetted", (alarm) => {
                if (chrome.runtime.lastError) {
                  console.error("[DEBUG-BG] Error getting alarm:", chrome.runtime.lastError);
                } else if (alarm) {
                  console.log("[DEBUG-BG] Alarm verified, scheduled for:", new Date(alarm.scheduledTime));
                } else {
                  console.warn("[DEBUG-BG] Alarm not found after creation!");
                }
              });
            }
          });
        } else {
          console.log("[DEBUG-BG] Queue length is", queue.length, "- waiting for more profiles or alarm");
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
    const startTime = Date.now();
    console.log("[DEBUG-BG] ========== Received SEND_PROCESSED_TO_VETTED ==========");
    console.log("[DEBUG-BG] Profile count:", message.payload.length);
    console.log("[DEBUG-BG] Has API key:", !!message.apiKey);
    console.log("[DEBUG-BG] Payload size:", JSON.stringify(message.payload).length, "bytes");
    console.log("[DEBUG-BG] Extension context valid:", isExtensionContextValid());
    
    // IMPORTANT: Return true immediately to keep message channel open
    // Then handle async operation
    const respond = (result) => {
      const elapsed = Date.now() - startTime;
      try {
        console.log("[DEBUG-BG] Attempting to send response after", elapsed, "ms");
        console.log("[DEBUG-BG] Response data:", result);
        const responseSent = sendResponse(result);
        console.log("[DEBUG-BG] sendResponse called, result:", responseSent);
        console.log("[DEBUG-BG] Response sent successfully");
      } catch (e) {
        console.error("[DEBUG-BG] ERROR calling sendResponse after", elapsed, "ms:", e);
        console.error("[DEBUG-BG] Error details:", {
          message: e.message,
          stack: e.stack,
          name: e.name
        });
        // Try to send error response
        try {
          sendResponse({ success: false, error: "Failed to send response: " + e.message });
        } catch (e2) {
          console.error("[DEBUG-BG] Could not send error response either:", e2);
        }
      }
    };
    
    // Use async/await pattern for better error handling
    console.log("[DEBUG-BG] Calling sendProcessedProfilesToVetted...");
    sendProcessedProfilesToVetted(message.payload, message.apiKey)
      .then((result) => {
        const elapsed = Date.now() - startTime;
        console.log("[DEBUG-BG] sendProcessedProfilesToVetted completed after", elapsed, "ms");
        console.log("[DEBUG-BG] Result:", result);
        respond(result);
      })
      .catch((error) => {
        const elapsed = Date.now() - startTime;
        console.error("[DEBUG-BG] ERROR in SEND_PROCESSED_TO_VETTED after", elapsed, "ms");
        console.error("[DEBUG-BG] Error:", error);
        console.error("[DEBUG-BG] Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        respond({ success: false, error: error.message || "Unknown error" });
      });

    // CRITICAL: Return true to keep message channel open for async response
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
    console.log("[DEBUG-BG] ========== sendBatchToVetted START ==========");
    // Hardcoded Vetted API URL
    const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
    console.log("[DEBUG-BG] API URL:", VETTED_API_URL);
    console.log("[DEBUG-BG] ProfileProcessor available:", typeof ProfileProcessor !== 'undefined');
    
    chrome.storage.local.get(["vettedQueue", "vettedApiKey"], async (data) => {
      const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
      console.log("[DEBUG-BG] Queue length:", queue.length);
      console.log("[DEBUG-BG] Has API key:", !!data.vettedApiKey);
      
      if (queue.length === 0) {
        console.log("[DEBUG-BG] Queue is empty, nothing to send");
        resolve({ success: true, sent: 0, message: "No profiles in queue" });
        return;
      }
      
      console.log("[DEBUG-BG] Processing", queue.length, "profiles from queue...");

      try {
        // Process all profiles in queue
        if (typeof ProfileProcessor === 'undefined') {
          resolve({ success: false, error: "Profile processor not available" });
          return;
        }

        const processed = queue.map((profileDoc, index) => {
          try {
            console.log(`[DEBUG-BG] Processing profile ${index + 1}/${queue.length}...`);
            const result = ProfileProcessor.processProfileDocument(profileDoc);
            console.log(`[DEBUG-BG] Profile ${index + 1} processed successfully`);
            return result;
          } catch (e) {
            console.error(`[DEBUG-BG] Error processing profile ${index + 1}:`, e);
            return null;
          }
        }).filter(p => p !== null);

        console.log("[DEBUG-BG] Processed profiles:", processed.length, "out of", queue.length);

        if (processed.length === 0) {
          // Clear queue if all failed
          console.error("[DEBUG-BG] All profiles failed processing, clearing queue");
          chrome.storage.local.set({ vettedQueue: [] });
          resolve({ success: false, error: "No valid profiles to send" });
          return;
        }
        
        console.log("[DEBUG-BG] Sending", processed.length, "processed profiles to API...");

        // Send batch to Vetted API
        const headers = {
          "Content-Type": "application/json",
        };

        if (data.vettedApiKey) {
          headers["Authorization"] = `Bearer ${data.vettedApiKey}`;
        }

        console.log("[DEBUG-BG] Fetch request details:", {
          url: VETTED_API_URL,
          method: "POST",
          headers: Object.keys(headers),
          bodySize: JSON.stringify(processed).length
        });
        
        const fetchStartTime = Date.now();
        const response = await fetch(VETTED_API_URL, {
          method: "POST",
          headers: headers,
          credentials: "include",
          body: JSON.stringify(processed),
        });
        
        const fetchTime = Date.now() - fetchStartTime;
        console.log("[DEBUG-BG] Fetch completed in", fetchTime, "ms");
        console.log("[DEBUG-BG] Response status:", response.status, response.statusText);
        console.log("[DEBUG-BG] Response ok:", response.ok);

        if (!response.ok) {
          console.error("[DEBUG-BG] Response not OK, parsing error...");
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
        console.log("[DEBUG-BG] Batch send successful, result:", result);
        
        // Clear queue after successful send
        chrome.storage.local.set({ vettedQueue: [] }, () => {
          console.log("[DEBUG-BG] Queue cleared after successful send");
        });
        
        console.log("[DEBUG-BG] ========== sendBatchToVetted SUCCESS ==========");
        resolve({ 
          success: true, 
          sent: processed.length,
          result: result,
          message: `Successfully sent ${processed.length} profile(s) to Vetted`
        });
      } catch (error) {
        console.error("[DEBUG-BG] ========== sendBatchToVetted ERROR ==========");
        console.error("[DEBUG-BG] Batch send error:", error);
        console.error("[DEBUG-BG] Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        resolve({ success: false, error: error.message, sent: 0 });
      }
    });
  });
}

// Function to send already-processed profiles to Vetted API
async function sendProcessedProfilesToVetted(processedProfiles, apiKey) {
  const startTime = Date.now();
  console.log("[DEBUG-BG] ========== sendProcessedProfilesToVetted START ==========");
  console.log("[DEBUG-BG] Profile count:", processedProfiles?.length || 0);
  console.log("[DEBUG-BG] Has API key:", !!apiKey);
  
  try {
    // Hardcoded Vetted API URL
    const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
    console.log("[DEBUG-BG] API URL:", VETTED_API_URL);
    
    if (!processedProfiles || processedProfiles.length === 0) {
      console.error("[DEBUG-BG] ERROR: No profiles to send");
      return { success: false, error: "No profiles to send" };
    }

    // Prepare headers
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      console.log("[DEBUG-BG] Authorization header added (key length:", apiKey.length, ")");
    } else {
      console.log("[DEBUG-BG] No API key provided, using session-based auth");
    }

    // Prepare request body
    const requestBody = JSON.stringify(processedProfiles);
    const bodySize = requestBody.length;
    console.log("[DEBUG-BG] Request body size:", bodySize, "bytes");
    console.log("[DEBUG-BG] Request headers:", headers);

    // Send to Vetted API with timeout
    const timeoutMs = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error("[DEBUG-BG] TIMEOUT: Request timeout after", timeoutMs, "ms");
      controller.abort();
    }, timeoutMs);

    let response;
    try {
      console.log("[DEBUG-BG] Starting fetch request...");
      console.log("[DEBUG-BG] URL:", VETTED_API_URL);
      console.log("[DEBUG-BG] Method: POST");
      console.log("[DEBUG-BG] Headers:", JSON.stringify(headers, null, 2));
      console.log("[DEBUG-BG] Body size:", bodySize, "bytes");
      const fetchStartTime = Date.now();
      
      // Add a heartbeat log every 5 seconds
      const heartbeatInterval = setInterval(() => {
        const elapsed = Date.now() - fetchStartTime;
        console.log("[DEBUG-BG] Fetch still in progress...", elapsed, "ms elapsed");
      }, 5000);
      
      response = await fetch(VETTED_API_URL, {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: requestBody,
        signal: controller.signal
      });
      
      clearInterval(heartbeatInterval);
      const fetchTime = Date.now() - fetchStartTime;
      clearTimeout(timeoutId);
      console.log("[DEBUG-BG] Fetch completed in", fetchTime, "ms");
      console.log("[DEBUG-BG] Response status:", response.status, response.statusText);
      console.log("[DEBUG-BG] Response ok:", response.ok);
      console.log("[DEBUG-BG] Response headers:", Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      const fetchTime = Date.now() - startTime;
      clearTimeout(timeoutId);
      console.error("[DEBUG-BG] FETCH ERROR after", fetchTime, "ms:", fetchError);
      console.error("[DEBUG-BG] Error details:", {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack
      });
      
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs/1000} seconds`);
      }
      throw new Error(`Network error: ${fetchError.message}`);
    }

    if (!response.ok) {
      console.error("[DEBUG-BG] Response not OK:", response.status, response.statusText);
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.error("[DEBUG-BG] Error response JSON:", errorData);
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          console.error("[DEBUG-BG] Error details:", errorData.details);
          errorMessage += ` - ${JSON.stringify(errorData.details)}`;
        }
      } catch (e) {
        console.error("[DEBUG-BG] Could not parse error as JSON, trying text...");
        try {
          const errorText = await response.text();
          console.error("[DEBUG-BG] Error response text:", errorText);
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 200)}`;
          }
        } catch (textError) {
          console.error("[DEBUG-BG] Could not read error response:", textError);
        }
      }
      
      if (response.status === 401) {
        errorMessage = "Unauthorized: Please make sure you're logged into Vetted as an admin user";
      } else if (response.status === 403) {
        errorMessage = "Forbidden: You must be an admin user to upload candidates";
      } else if (response.status === 404) {
        errorMessage = "Not Found: Check that your API URL is correct";
      } else if (response.status === 405) {
        errorMessage = "Method Not Allowed: The API endpoint may not be deployed yet";
      } else if (response.status === 500) {
        errorMessage = "Server Error: The Vetted API encountered an error. Check server logs.";
      }
      
      const totalTime = Date.now() - startTime;
      console.error("[DEBUG-BG] Returning error after", totalTime, "ms:", errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log("[DEBUG-BG] Response OK, parsing JSON...");
    let result;
    try {
      result = await response.json();
      console.log("[DEBUG-BG] Response JSON parsed successfully");
      console.log("[DEBUG-BG] Response data:", result);
    } catch (jsonError) {
      console.error("[DEBUG-BG] ERROR parsing response JSON:", jsonError);
      const textResult = await response.text();
      console.error("[DEBUG-BG] Response text:", textResult.substring(0, 500));
      throw new Error("Invalid JSON response from server");
    }
    
    const totalTime = Date.now() - startTime;
    console.log("[DEBUG-BG] ========== sendProcessedProfilesToVetted SUCCESS ==========");
    console.log("[DEBUG-BG] Total time:", totalTime, "ms");
    console.log("[DEBUG-BG] =========================================================");
    
    return { 
      success: true, 
      sent: processedProfiles.length,
      result: result 
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[DEBUG-BG] ========== sendProcessedProfilesToVetted ERROR ==========");
    console.error("[DEBUG-BG] Error after", totalTime, "ms:", error);
    console.error("[DEBUG-BG] Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.error("[DEBUG-BG] =========================================================");
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


