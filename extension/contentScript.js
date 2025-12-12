// NOTE: This extension performs local-only DOM scraping. Users are responsible
// for complying with site terms of service (e.g., LinkedIn ToS) and applicable laws.
// This is intended for internal/testing use only.

(function () {
  // Avoid injecting multiple buttons if the content script runs more than once
  if (document.getElementById("profile-json-floating-btn")) return;

  // Helper function to check if extension context is valid
  function isExtensionContextValid() {
    try {
      // Try to access chrome.runtime.id - this will throw if context is invalidated
      return chrome.runtime && chrome.runtime.id !== undefined;
    } catch (e) {
      return false;
    }
  }

  // Helper function to show extension reload message
  function showExtensionReloadMessage() {
    const existingMsg = document.getElementById("extension-reload-message");
    if (existingMsg) return;

    const msg = document.createElement("div");
    msg.id = "extension-reload-message";
    msg.textContent = "⚠️ Extension was reloaded. Please refresh this page to continue.";
    Object.assign(msg.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "2147483647",
      padding: "12px 16px",
      backgroundColor: "#ff9800",
      color: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      fontSize: "14px",
      fontWeight: "500",
      maxWidth: "300px",
      cursor: "pointer"
    });
    msg.onclick = () => window.location.reload();
    document.body.appendChild(msg);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (msg.parentNode) {
        msg.parentNode.removeChild(msg);
      }
    }, 10000);
  }

  function injectButton() {
    // Check if button already exists
    if (document.getElementById("profile-json-floating-btn")) return;

    // Wait for body to be available
    if (!document.body) {
      setTimeout(injectButton, 100);
      return;
    }

    const button = document.createElement("button");
    button.id = "profile-json-floating-btn";
    button.textContent = "Save Profile JSON";

    Object.assign(button.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "2147483647",
      padding: "10px 16px",
      borderRadius: "999px",
      border: "none",
      fontSize: "14px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      background: "#1a73e8",
      color: "#ffffff",
      opacity: "0.9"
    });

    button.addEventListener("mouseenter", () => {
      button.style.opacity = "1";
    });

    button.addEventListener("mouseleave", () => {
      button.style.opacity = "0.9";
    });

    button.addEventListener("click", () => {
      try {
        const profileDoc = buildProfileDocument();
        
        // Validate profile document before sending
        if (!profileDoc || typeof profileDoc !== 'object') {
          showToast("Error: Invalid profile data");
          console.error("Invalid profile document:", profileDoc);
          return;
        }

        // Check if extension context is valid before sending message
        if (!isExtensionContextValid()) {
          console.error("Extension context invalidated - extension was reloaded");
          showExtensionReloadMessage();
          showToast("Extension was reloaded. Please refresh this page.", true);
          return;
        }

        chrome.runtime.sendMessage(
          { type: "SAVE_PROFILE_DOCUMENT", payload: profileDoc },
          (response) => {
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message || "Error saving profile JSON";
              console.error("Runtime error:", chrome.runtime.lastError);
              
              // Check if it's an invalidated context error
              if (errorMsg.includes("Extension context invalidated") || 
                  errorMsg.includes("message port closed") ||
                  chrome.runtime.lastError.message === "Extension context invalidated.") {
                showExtensionReloadMessage();
                showToast("Extension was reloaded. Please refresh this page.", true);
                return;
              }
              
              showToast(`Error: ${errorMsg}`);
              return;
            }

            if (!response) {
              showToast("Error: No response from extension");
              console.error("No response received");
              return;
            }

            if (response.success) {
              // Check if auto-send is enabled and queue for batch send
              chrome.storage.local.get(["autoSendToVetted", "autoSendToSheets"], (settings) => {
                if (chrome.runtime.lastError) {
                  console.error("[DEBUG-CS] Error loading settings:", chrome.runtime.lastError);
                  showToast(`Profile saved (#${response.count})`, false);
                  return;
                }
                
                console.log("[DEBUG-CS] ========== Auto-send check ==========");
                console.log("[DEBUG-CS] autoSendToVetted:", settings.autoSendToVetted);
                console.log("[DEBUG-CS] autoSendToSheets:", settings.autoSendToSheets);
                
                if (settings.autoSendToVetted) {
                  console.log("[DEBUG-CS] Auto-send to Vetted is ENABLED");
                  // Check extension context before queuing
                  if (!isExtensionContextValid()) {
                    console.error("[DEBUG-CS] Extension context invalid!");
                    showExtensionReloadMessage();
                    showToast("Extension was reloaded. Please refresh this page.", true);
                    return;
                  }

                  console.log("[DEBUG-CS] Sending QUEUE_FOR_VETTED message...");
                  // Queue profile for batch auto-send to Vetted
                  chrome.runtime.sendMessage({
                    type: "QUEUE_FOR_VETTED",
                    payload: profileDoc
                  }, (queueResponse) => {
                    console.log("[DEBUG-CS] Queue response received:", queueResponse);
                    if (chrome.runtime.lastError) {
                      console.error("[DEBUG-CS] Queue error:", chrome.runtime.lastError);
                      const errorMsg = chrome.runtime.lastError.message || "Unknown error";
                      
                      // Check if it's an invalidated context error
                      if (errorMsg.includes("Extension context invalidated") || 
                          errorMsg.includes("message port closed")) {
                        showExtensionReloadMessage();
                        showToast("Extension was reloaded. Please refresh this page.", true);
                        return;
                      }
                      
                      showToast(`Profile saved but queue failed: ${errorMsg}`, true);
                    } else if (queueResponse && !queueResponse.success) {
                      console.error("[DEBUG-CS] Queue failed:", queueResponse.error);
                      showToast(`Queue failed: ${queueResponse.error || "Unknown error"}`, true);
                    } else {
                      const queuedCount = queueResponse?.queuedCount || 0;
                      console.log("[DEBUG-CS] Profile queued successfully, queue count:", queuedCount);
                      showToast(`Profile saved & queued for Vetted (${queuedCount} in queue)`);
                    }
                  });
                } else if (settings.autoSendToSheets) {
                  // Check extension context before sending
                  if (!isExtensionContextValid()) {
                    showExtensionReloadMessage();
                    showToast("Extension was reloaded. Please refresh this page.", true);
                    return;
                  }

                  // Request background script to auto-send to Google Sheets
                  chrome.runtime.sendMessage({
                    type: "AUTO_SEND_TO_SHEETS",
                    payload: profileDoc
                  }, (autoSendResponse) => {
                    if (chrome.runtime.lastError) {
                      console.error("Auto-send error:", chrome.runtime.lastError);
                      const errorMsg = chrome.runtime.lastError.message || "Unknown error";
                      
                      // Check if it's an invalidated context error
                      if (errorMsg.includes("Extension context invalidated") || 
                          errorMsg.includes("message port closed")) {
                        showExtensionReloadMessage();
                        showToast("Extension was reloaded. Please refresh this page.", true);
                        return;
                      }
                      
                      showToast(`Profile saved but auto-send failed: ${errorMsg}`, true);
                    }
                  });
                  showToast(`Profile saved & sending to Google Sheets (#${response.count})`);
                } else {
                  showToast(`Profile JSON saved (#${response.count})`);
                }
              });
            } else {
              const errorMsg = response.error || "Failed to save profile JSON";
              const storageInfo = response.storageInfo;
              
              // Log error with context
              if (storageInfo) {
                console.warn("Save failed - Storage info:", {
                  error: errorMsg,
                  used: `${(storageInfo.used / (1024 * 1024)).toFixed(2)}MB`,
                  limit: `${(storageInfo.limit / (1024 * 1024)).toFixed(0)}MB`,
                  percentage: `${storageInfo.percentage}%`
                });
              } else {
                console.error("Save failed:", errorMsg, response);
              }
              
              // Show user-friendly error message
              let userMessage = errorMsg;
              if (errorMsg.includes("quota") || errorMsg.includes("Storage") || errorMsg.includes("QUOTA_BYTES") || errorMsg.includes("Storage full")) {
                if (storageInfo) {
                  userMessage = `Storage full (${storageInfo.percentage}% used). Open extension popup and click 'Clear All' or delete individual profiles.`;
                } else {
                  userMessage = "Storage full! Open extension popup and click 'Clear All' or delete individual profiles.";
                }
              }
              
              showToast(userMessage, true);
            }
          }
        );
      } catch (error) {
        console.error("Error building/saving profile:", error);
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
          fileName: error.fileName,
          lineNumber: error.lineNumber
        });
        
        // Check if it's an extension context error
        const errorMessage = error.message || error.toString() || "Unknown error occurred";
        if (errorMessage.includes("Extension context invalidated") || 
            errorMessage.includes("message port closed")) {
          showExtensionReloadMessage();
          showToast("Extension was reloaded. Please refresh this page.", true);
        } else {
          showToast(`Error: ${errorMessage}. Check console for details.`);
        }
      }
    });

    document.body.appendChild(button);
  }

  // Start injection
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectButton);
  } else {
    injectButton();
  }

  // Simple toast notification
  function showToast(message) {
    if (!document.body) return;

    const existing = document.getElementById("profile-json-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "profile-json-toast";
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "60px",
      right: "20px",
      zIndex: "2147483647",
      padding: "8px 14px",
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "13px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      transition: "opacity 0.3s ease-in-out",
      opacity: "1"
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  // Helper: Find section by heading text
  function findSectionByHeading(headingTexts) {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    for (const heading of headings) {
      const text = heading.textContent.trim();
      if (headingTexts.some(h => text.toLowerCase().includes(h.toLowerCase()))) {
        // Find the parent section or container
        let current = heading.parentElement;
        while (current && current !== document.body) {
          if (current.tagName === "SECTION" || current.classList.contains("section") || 
              current.getAttribute("id")?.includes("section") ||
              current.getAttribute("class")?.includes("experience") ||
              current.getAttribute("class")?.includes("education")) {
            return current;
          }
          current = current.parentElement;
        }
        return heading.parentElement;
      }
    }
    return null;
  }

  // Helper: Extract text content safely
  function getTextContent(element) {
    if (!element) return null;
    const text = element.textContent?.trim();
    return text || null;
  }

  // Helper: Extract number from text
  function extractNumber(text) {
    if (!text) return null;
    const match = text.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ""), 10);
    }
    return null;
  }

  // Helper: Parse duration string to extract detailed date and tenure information
  function parseDurationDetailed(durationStr) {
    if (!durationStr) {
      return {
        start_date: null,
        end_date: null,
        start_month: null,
        start_year: null,
        end_month: null,
        end_year: null,
        is_current: false,
        years_in_tenure: null,
        months_in_tenure: null,
        tenure_string: null
      };
    }

    const result = {
      start_date: null,
      end_date: null,
      start_month: null,
      start_year: null,
      end_month: null,
      end_year: null,
      is_current: false,
      years_in_tenure: null,
      months_in_tenure: null,
      tenure_string: durationStr
    };

    // Check if current position
    result.is_current = /Present|Current/i.test(durationStr);

    // Pattern 1: "Aug 2025 - Present" or "Aug 2025 - Jul 2025"
    const datePattern1 = /([A-Z][a-z]{2,3})\s+(\d{4})\s*[-–—]\s*(?:Present|([A-Z][a-z]{2,3})\s+(\d{4}))/i;
    const match1 = durationStr.match(datePattern1);
    
    if (match1) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthAbbrevs = ['january', 'february', 'march', 'april', 'may', 'june', 
                            'july', 'august', 'september', 'october', 'november', 'december'];
      
      const startMonthName = match1[1];
      const startYear = parseInt(match1[2], 10);
      const startMonthIndex = monthNames.findIndex(m => m.toLowerCase() === startMonthName.toLowerCase()) + 1 ||
                              monthAbbrevs.findIndex(m => m.toLowerCase().startsWith(startMonthName.toLowerCase())) + 1;
      
      result.start_month = startMonthIndex || null;
      result.start_year = startYear;
      result.start_date = `${startMonthName} ${startYear}`;

      if (match1[3] && match1[4]) {
        const endMonthName = match1[3];
        const endYear = parseInt(match1[4], 10);
        const endMonthIndex = monthNames.findIndex(m => m.toLowerCase() === endMonthName.toLowerCase()) + 1 ||
                              monthAbbrevs.findIndex(m => m.toLowerCase().startsWith(endMonthName.toLowerCase())) + 1;
        
        result.end_month = endMonthIndex || null;
        result.end_year = endYear;
        result.end_date = `${endMonthName} ${endYear}`;
      } else if (result.is_current) {
        const now = new Date();
        result.end_month = now.getMonth() + 1;
        result.end_year = now.getFullYear();
        result.end_date = "Present";
      }

      // Calculate tenure
      if (result.start_year && result.end_year) {
        const startDate = new Date(result.start_year, (result.start_month || 1) - 1, 1);
        const endDate = result.is_current ? new Date() : new Date(result.end_year, (result.end_month || 1) - 1, 1);
        const diffTime = Math.abs(endDate - startDate);
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
        result.months_in_tenure = diffMonths;
        result.years_in_tenure = Math.floor(diffMonths / 12);
      }
    } else {
      // Pattern 2: "2020 - Present" or "2020 - 2023" (year only)
      const datePattern2 = /(\d{4})\s*[-–—]\s*(?:Present|(\d{4}))/;
      const match2 = durationStr.match(datePattern2);
      
      if (match2) {
        result.start_year = parseInt(match2[1], 10);
        result.start_date = String(result.start_year);
        
        if (match2[2]) {
          result.end_year = parseInt(match2[2], 10);
          result.end_date = String(result.end_year);
        } else if (result.is_current) {
          result.end_year = new Date().getFullYear();
          result.end_date = "Present";
        }

        // Calculate tenure
        if (result.start_year && result.end_year) {
          result.years_in_tenure = result.end_year - result.start_year;
          if (result.is_current) {
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            result.months_in_tenure = currentMonth;
            // Adjust years if we're partway through the year
            if (currentMonth > 6) {
              result.years_in_tenure += 1;
            }
          } else {
            result.months_in_tenure = 0;
          }
        }
      } else {
        // Pattern 3: Extract years/months from text like "2 yrs 3 mos"
        const yearMatch = durationStr.match(/(\d+)\s*(?:yr|yrs|year|years)/i);
        const monthMatch = durationStr.match(/(\d+)\s*(?:mo|mos|month|months)/i);
        
        if (yearMatch) {
          result.years_in_tenure = parseInt(yearMatch[1], 10);
        }
        if (monthMatch) {
          result.months_in_tenure = parseInt(monthMatch[1], 10);
        }
      }
    }

    return result;
  }

  // Helper: Extract company info from company field (handles patterns like "Company · Full-time")
  // Example input: "Clark Atlanta University · Full-time"
  // Example output: { company: "Clark Atlanta University", employment_type: "Full-time" }
  function extractCompanyInfo(companyText) {
    if (!companyText) return { company: null, employment_type: null, company_url: null };
    
    // Clean the text first - remove extra whitespace
    let cleaned = companyText.trim();
    
    // Handle LinkedIn format: "Clark Atlanta University · Full-time"
    // Split by middle dot (·) or bullet (•) - these are Unicode characters
    // Also handle variations like "Company · Full-time · Location" or just "Company · Full-time"
    const separators = /[·•\u2022\u00b7]/g;
    const parts = cleaned.split(separators).map(p => p.trim()).filter(p => p);
    
    // First part is usually the company name
    let company = parts[0] || null;
    
    // Find employment type in remaining parts
    let employmentType = null;
    const employmentPatterns = [
      /full-time/i,
      /part-time/i,
      /contract/i,
      /internship/i,
      /freelance/i,
      /self-employed/i,
      /volunteer/i
    ];
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      for (const pattern of employmentPatterns) {
        if (pattern.test(part)) {
          employmentType = part;
          break;
        }
      }
      if (employmentType) break;
    }
    
    // Clean company name - remove any trailing employment type indicators
    // This handles cases where the pattern wasn't split correctly
    if (company) {
      company = company
        .replace(/\s*[·•]\s*(?:Full-time|Part-time|Contract|Internship|Freelance|Self-employed|Volunteer).*$/i, '')
        .replace(/\s*\(.*?\)\s*$/, '') // Remove trailing parenthetical notes
        .trim();
      
      // Validate it's actually a company name (not just employment type)
      if (company && employmentPatterns.some(p => p.test(company))) {
        company = null; // This was just employment type, not company name
      }
    }
    
    return {
      company: company,
      employment_type: employmentType,
      company_url: null
    };
  }

  // Comprehensive HTML element extractor - extracts meaningful data from any element
  // HTML fields removed to reduce data size
  function extractElementData(element) {
    if (!element) return null;
    
    const data = {
      tag: element.tagName?.toLowerCase() || null,
      text: getTextContent(element),
      // Removed html and innerHTML to reduce data size (was causing 5MB+ files)
      attributes: {},
      classes: element.className ? (typeof element.className === 'string' ? element.className.split(' ').filter(c => c) : []) : [],
      id: element.id || null,
      href: element.href || null,
      src: element.src || null,
      alt: element.alt || null,
      title: element.title || null,
      role: element.getAttribute('role') || null,
      'data-attributes': {},
      aria_labels: {},
      children_count: element.children ? element.children.length : 0
    };

    // Extract all attributes
    if (element.attributes) {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          data['data-attributes'][attr.name] = attr.value;
        } else if (attr.name.startsWith('aria-')) {
          data.aria_labels[attr.name] = attr.value;
        } else {
          data.attributes[attr.name] = attr.value;
        }
      });
    }

    return data;
  }

  // Extract all sections from the page comprehensively
  function extractAllSections() {
    const sections = [];
    const seenTexts = new Set();
    
    // Find all potential section containers
    const sectionSelectors = [
      'section',
      '[role="region"]',
      '[role="main"]',
      '[role="article"]',
      '.section',
      '[class*="section"]',
      '[id*="section"]',
      '[id*="experience"]',
      '[id*="education"]',
      '[id*="skill"]',
      '[id*="project"]',
      '[id*="certification"]',
      '[id*="publication"]',
      '[id*="volunteer"]',
      '[id*="course"]',
      '[id*="award"]',
      '[id*="honor"]',
      '[id*="language"]',
      '[id*="organization"]',
      '[id*="patent"]',
      '[id*="test"]',
      '[id*="recommendation"]',
      '[id*="interest"]',
      '[id*="group"]',
      '[id*="company"]',
      '[id*="cause"]'
    ];

    sectionSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = getTextContent(el);
          if (text && text.length > 10 && !seenTexts.has(text.substring(0, 100))) {
            seenTexts.add(text.substring(0, 100));
            sections.push({
              type: 'section',
              selector: selector,
              heading: findSectionHeading(el),
              content: extractElementData(el),
              text: text
            });
          }
        });
      } catch (e) {
        // Invalid selector, skip
      }
    });

    return sections;
  }

  // Find section heading
  function findSectionHeading(element) {
    const heading = element.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
    return heading ? getTextContent(heading) : null;
  }

  // Extract all list items comprehensively
  function extractAllListItems() {
    const items = [];
    const lists = document.querySelectorAll('ul, ol, [role="list"]');
    
    lists.forEach(list => {
      const listItems = list.querySelectorAll('li, [role="listitem"]');
      listItems.forEach((item, index) => {
        const itemData = extractElementData(item);
        items.push({
          type: 'list_item',
          list_type: list.tagName.toLowerCase(),
          index: index,
          content: itemData,
          text: getTextContent(item)
        });
      });
    });

    return items;
  }

  // Extract all links comprehensively
  function extractAllLinks() {
    const links = [];
    const linkElements = document.querySelectorAll('a[href]');
    const seenUrls = new Set();
    
    linkElements.forEach(link => {
      const href = link.href;
      if (href && !seenUrls.has(href)) {
        seenUrls.add(href);
        links.push({
          type: 'link',
          href: href,
          text: getTextContent(link),
          title: link.title || null,
          content: extractElementData(link)
        });
      }
    });

    return links;
  }

  // Extract all images comprehensively
  function extractAllImages() {
    const images = [];
    const imgElements = document.querySelectorAll('img[src]');
    const seenSrcs = new Set();
    
    imgElements.forEach(img => {
      const src = img.src;
      if (src && !seenSrcs.has(src)) {
        seenSrcs.add(src);
        images.push({
          type: 'image',
          src: src,
          alt: img.alt || null,
          title: img.title || null,
          content: extractElementData(img)
        });
      }
    });

    return images;
  }

  // Extract all headings comprehensively
  function extractAllHeadings() {
    const headings = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    
    headingElements.forEach(heading => {
      headings.push({
        type: 'heading',
        level: heading.tagName ? parseInt(heading.tagName.charAt(1)) : null,
        text: getTextContent(heading),
        content: extractElementData(heading)
      });
    });

    return headings;
  }

  // Extract all tables comprehensively
  function extractAllTables() {
    const tables = [];
    const tableElements = document.querySelectorAll('table');
    
    tableElements.forEach(table => {
      const rows = [];
      const rowElements = table.querySelectorAll('tr');
      
      rowElements.forEach(row => {
        const cells = [];
        const cellElements = row.querySelectorAll('td, th');
        
        cellElements.forEach(cell => {
          cells.push({
            tag: cell.tagName.toLowerCase(),
            text: getTextContent(cell),
            content: extractElementData(cell)
          });
        });
        
        rows.push({
          cells: cells,
          text: getTextContent(row)
        });
      });
      
      tables.push({
        type: 'table',
        rows: rows,
        content: extractElementData(table)
      });
    });

    return tables;
  }

  // Extract structured data by semantic patterns
  function extractStructuredData() {
    const structured = {
      personal_info: {},
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      projects: [],
      publications: [],
      volunteer_experience: [],
      courses: [],
      honors_awards: [],
      organizations: [],
      patents: [],
      test_scores: [],
      recommendations: [],
      interests: {
        companies: [],
        groups: [],
        causes: []
      },
      activity: {},
      contact_info: {},
      social_links: []
    };

    const bodyText = document.body ? document.body.innerText : "";
    const bodyHTML = document.body ? document.body.innerHTML : "";

    // PERSONAL INFO - Try multiple selectors
    const nameSelectors = [
      "h1.text-heading-xlarge",
      "h1[data-anonymize='person-name']",
      "main h1",
      "h1",
      ".pv-text-details__left-panel h1",
      "[data-test-id='name']",
      "[aria-label*='name']"
    ];
    for (const selector of nameSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        structured.personal_info.name = getTextContent(el);
        break;
      }
    }

    // Headline
    const headlineSelectors = [
      ".text-body-medium.break-words",
      ".pv-text-details__left-panel .text-body-medium",
      "h2.text-body-medium",
      "h2",
      "[data-test-id='headline']"
    ];
    for (const selector of headlineSelectors) {
      const el = document.querySelector(selector);
      if (el && el !== document.querySelector("h1")) {
        structured.personal_info.headline = getTextContent(el);
        break;
      }
    }

    // Location
    const locationSelectors = [
      ".text-body-small.inline.t-black--light.break-words",
      ".pv-text-details__left-panel .text-body-small",
      "[data-test-id='location']",
      "[aria-label*='location']"
    ];
    for (const selector of locationSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        structured.personal_info.location = getTextContent(el);
        break;
      }
    }

    // Extract profile URL
    const profileUrlPattern = /(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s\)]+)/;
    const urlMatch = bodyText.match(profileUrlPattern);
    if (urlMatch) {
      structured.personal_info.profile_url = urlMatch[1].replace(/[.,;:!?)]+$/, "");
    }
    if (!structured.personal_info.profile_url) {
      structured.personal_info.profile_url = window.location.href;
    }

    // ACTIVITY - Followers, connections, etc.
    const followerTexts = Array.from(document.querySelectorAll("*")).map(el => el.textContent);
    for (const text of followerTexts) {
      if (text && /followers?/i.test(text)) {
        const num = extractNumber(text);
        if (num !== null) {
          structured.activity.followers = num;
          break;
        }
      }
    }
    
    // Connections
    for (const text of followerTexts) {
      if (text && /connections?/i.test(text)) {
        const num = extractNumber(text);
        if (num !== null) {
          structured.activity.connections = num;
          break;
        }
      }
    }

    // EXPERIENCE - Comprehensive extraction
    const experienceSection = findSectionByHeading(["Experience", "Work Experience", "Employment", "Professional Experience"]);
    if (experienceSection) {
      const items = experienceSection.querySelectorAll("li, .pvs-list__paged-list-item, [data-view-name='profile-component-entity'], article, [role='listitem']");
      items.forEach(item => {
        if (!item) return; // Skip null items
        
        const itemData = extractElementData(item);
        const itemText = getTextContent(item) || ""; // Ensure itemText is never null
        
        // Extract title - try multiple selectors
        const titleEl = item.querySelector("h3, .t-16.t-black.t-bold, span[aria-hidden='true'], [class*='title'], [class*='position'], .pvs-entity__summary-info-v2 h3");
        let title = getTextContent(titleEl);
        
        // If title contains company info, extract it separately
        if (title && /[·•]\s*(?:Full-time|Part-time)/i.test(title)) {
          // Title might have company info mixed in, try to extract just the title part
          const titleParts = title.split(/[·•]/);
          title = titleParts[0].trim();
        }
        
        let company = null;
        // Try multiple selectors to find company name
        const companySelectors = [
          ".t-14.t-black--light.t-normal",
          ".pvs-entity__subtitle",
          "[class*='company']",
          "[class*='organization']",
          "span[aria-hidden='true']", // LinkedIn often uses this for company names
          ".pvs-entity__secondary-title",
          ".t-14.t-normal.t-black--light"
        ];
        
        // Also try to find company by looking for elements that contain "· Full-time" or similar patterns
        const allTextElements = item.querySelectorAll("span, div, p");
        for (const el of allTextElements) {
          const text = getTextContent(el);
          if (text && /[·•]\s*(?:Full-time|Part-time|Contract)/i.test(text)) {
            company = text;
            break;
          }
        }
        
        // If not found, try selectors
        if (!company) {
          for (const selector of companySelectors) {
            const el = item.querySelector(selector);
            if (el && el !== titleEl) {
              const text = getTextContent(el);
              // Skip if it's the title or duration
              if (text && text !== title && !/^\d{4}|Present|Aug|Jan|Feb|Mar|Apr|May|Jun|Jul|Sep|Oct|Nov|Dec/i.test(text.trim())) {
                company = text;
                break;
              }
            }
          }
        }
        
        // Last resort: try to extract from raw text using pattern matching
        if (!company && itemText) {
          // Pattern: Title\nCompany · Full-time\nDuration
          const companyPattern = /^[^\n]+\n([A-Z][a-zA-Z0-9\s&.,'-]+(?: [A-Z][a-zA-Z0-9\s&.,'-]+)*)\s*[·•]\s*(?:Full-time|Part-time)/m;
          const match = itemText.match(companyPattern);
          if (match && match[1]) {
            company = match[1].trim();
          }
        }

        let duration = null;
        const durationEl = item.querySelector(".t-14.t-black--light, .pvs-entity__caption, [class*='duration'], [class*='date']");
        duration = getTextContent(durationEl);

        // Parse duration to get detailed date and tenure info
        const durationDetails = parseDurationDetailed(duration);

        // Extract company info (handles patterns like "Company · Full-time")
        // If company contains "· Full-time" pattern, extractCompanyInfo will clean it
        const companyInfo = extractCompanyInfo(company);
        let cleanCompany = companyInfo.company || company;
        
        // Additional cleaning - remove any remaining employment type indicators
        if (cleanCompany) {
          cleanCompany = cleanCompany
            .replace(/\s*[·•]\s*(?:Full-time|Part-time|Contract|Internship|Freelance|Self-employed|Volunteer).*$/i, '')
            .replace(/\s*\(.*?\)\s*$/, '') // Remove trailing parenthetical notes
            .trim();
        }
        
        // If still no company, try extracting from the item's text structure
        // LinkedIn format: Title\nCompany · Full-time\nDuration
        if (!cleanCompany && itemText) {
          const lines = itemText.split('\n').map(l => l.trim()).filter(l => l);
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Look for line that contains "· Full-time" or similar
            if (/[·•]\s*(?:Full-time|Part-time|Contract)/i.test(line)) {
              const extracted = extractCompanyInfo(line);
              if (extracted.company) {
                cleanCompany = extracted.company;
                break;
              }
            }
          }
        }

        // Try to find company URL
        const companyLink = item.querySelector("a[href*='company'], a[href*='organization']");
        const companyUrl = companyLink ? companyLink.href : null;

        let description = null;
        const descEl = item.querySelector(".pvs-list__outer-container .t-14.t-normal, .inline-show-more-text, [class*='description']");
        description = getTextContent(descEl);

        let expLocation = null;
        if (itemText && (itemText.match(/[A-Z][a-z]+,\s*[A-Z]{2}/) || itemText.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/))) {
          expLocation = itemText.match(/([A-Z][a-z]+(?:,\s*[A-Z]{2})?)/)?.[0] || null;
        }

        // Remove title from company if it's concatenated (e.g., "Director of RecruitingDirector of Recruiting Quantum")
        if (cleanCompany && title) {
          const titleLower = title.toLowerCase().trim();
          const companyLower = cleanCompany.toLowerCase().trim();
          
          // Check if company starts with title (possibly duplicated)
          if (companyLower.startsWith(titleLower)) {
            // Remove the title prefix
            let cleaned = cleanCompany.substring(title.length).trim();
            // If title appears twice, remove both
            if (cleaned.toLowerCase().startsWith(titleLower)) {
              cleaned = cleaned.substring(title.length).trim();
            }
            cleanCompany = cleaned;
          } else if (companyLower.includes(titleLower + titleLower)) {
            // Title appears twice in the middle
            const doubleTitle = title + title;
            cleanCompany = cleanCompany.replace(new RegExp(doubleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
          } else if (companyLower.includes(titleLower) && companyLower.length > titleLower.length * 1.5) {
            // Title is somewhere in the company name, try to remove it
            const titleRegex = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}?`, 'i');
            cleanCompany = cleanCompany.replace(titleRegex, '').trim();
          }
        }
        
        if (title || cleanCompany || itemText.length > 20) {
          // Ensure cleanCompany is properly set - this is the final cleaned company name
          // Example: "Clark Atlanta University · Full-time" -> "Clark Atlanta University"
          if (!cleanCompany && company) {
            // Fallback: if cleanCompany extraction failed, try again with the original company text
            const retryExtraction = extractCompanyInfo(company);
            cleanCompany = retryExtraction.company || company;
            // Final cleanup
            cleanCompany = cleanCompany
              .replace(/\s*[·•]\s*(?:Full-time|Part-time|Contract|Internship|Freelance|Self-employed|Volunteer).*$/i, '')
              .trim();
            
            // Remove title if it's in the company
            if (cleanCompany && title) {
              const titleLower = title.toLowerCase().trim();
              const companyLower = cleanCompany.toLowerCase().trim();
              if (companyLower.startsWith(titleLower)) {
                let cleaned = cleanCompany.substring(title.length).trim();
                if (cleaned.toLowerCase().startsWith(titleLower)) {
                  cleaned = cleaned.substring(title.length).trim();
                }
                cleanCompany = cleaned;
              }
            }
          }
          
          structured.experience.push({
            title,
            company: cleanCompany || company, // Use cleaned company, fallback to original
            company_info: companyInfo.employment_type || null,
            company_url: companyUrl,
            duration,
            // Detailed duration breakdown
            start_date: durationDetails.start_date,
            end_date: durationDetails.end_date,
            start_month: durationDetails.start_month,
            start_year: durationDetails.start_year,
            end_month: durationDetails.end_month,
            end_year: durationDetails.end_year,
            is_current: durationDetails.is_current,
            years_in_tenure: durationDetails.years_in_tenure,
            months_in_tenure: durationDetails.months_in_tenure,
            employment_type: companyInfo.employment_type,
            description,
            location: expLocation,
            // Removed raw_html to reduce data size
            raw_text: itemText,
            // Removed element_data to reduce data size
          });
        }
      });
    }

    // Process experience to create structured current_employer and past_employers
    structured.current_employer = null;
    structured.past_employers = [];
    structured.employment_summary = {}; // Aggregated years at each company

    // Sort experience by date (most recent first)
    const sortedExperience = [...structured.experience].sort((a, b) => {
      const aYear = a.start_year || a.end_year || 0;
      const bYear = b.start_year || b.end_year || 0;
      return bYear - aYear;
    });

    // Identify current employer and past employers
    for (const exp of sortedExperience) {
      // Get company name - ensure it's cleaned (no "· Full-time" suffix)
      let company = exp.company;
      
      // Clean company name if it still contains employment type indicators
      if (company) {
        company = company
          .replace(/\s*[·•]\s*(?:Full-time|Part-time|Contract|Internship|Freelance|Self-employed|Volunteer).*$/i, '')
          .trim();
      }
      
      if (!company || company.length < 2) continue;

      // Check if this is current employment - check multiple indicators
      const isCurrent = exp.is_current === true || 
                       (exp.duration && /Present/i.test(exp.duration)) ||
                       (exp.end_date === "Present") ||
                       (exp.end_date && /Present/i.test(exp.end_date)) ||
                       (exp.duration && /to\s+Present/i.test(exp.duration));
      
      if (isCurrent && !structured.current_employer) {
        structured.current_employer = {
          company: company, // Use cleaned company name
          title: exp.title,
          start_date: exp.start_date,
          end_date: exp.end_date || "Present",
          start_month: exp.start_month,
          start_year: exp.start_year,
          end_month: exp.end_month,
          end_year: exp.end_year,
          years_in_tenure: exp.years_in_tenure,
          months_in_tenure: exp.months_in_tenure,
          employment_type: exp.employment_type,
          location: exp.location,
          description: exp.description,
          company_url: exp.company_url,
          duration: exp.duration // Keep original duration for reference
        };
      } else if (!isCurrent) {
        // Past employer
        structured.past_employers.push({
          company: company,
          title: exp.title,
          start_date: exp.start_date,
          end_date: exp.end_date,
          start_month: exp.start_month,
          start_year: exp.start_year,
          end_month: exp.end_month,
          end_year: exp.end_year,
          years_in_tenure: exp.years_in_tenure,
          months_in_tenure: exp.months_in_tenure,
          employment_type: exp.employment_type,
          location: exp.location,
          description: exp.description,
          company_url: exp.company_url
        });
      }

      // Aggregate years at each company
      if (!structured.employment_summary[company]) {
        structured.employment_summary[company] = {
          company: company,
          total_years: 0,
          total_months: 0,
          positions: [],
          first_start_date: exp.start_date,
          last_end_date: exp.end_date,
          is_current: exp.is_current
        };
      }

      const summary = structured.employment_summary[company];
      summary.positions.push({
        title: exp.title,
        start_date: exp.start_date,
        end_date: exp.end_date,
        years_in_tenure: exp.years_in_tenure,
        months_in_tenure: exp.months_in_tenure
      });

      // Add to totals
      if (exp.years_in_tenure) {
        summary.total_years += exp.years_in_tenure;
      }
      if (exp.months_in_tenure) {
        summary.total_months += exp.months_in_tenure;
      }

      // Update date ranges
      if (exp.start_year && (!summary.first_start_year || exp.start_year < summary.first_start_year)) {
        summary.first_start_year = exp.start_year;
        summary.first_start_date = exp.start_date;
      }
      if (exp.end_year && (!summary.last_end_year || exp.end_year > summary.last_end_year)) {
        summary.last_end_year = exp.end_year;
        summary.last_end_date = exp.end_date;
      }
      if (exp.is_current) {
        summary.is_current = true;
        summary.last_end_date = "Present";
      }
    }

    // Convert employment_summary object to array and calculate total years properly
    structured.employment_summary_array = Object.values(structured.employment_summary).map(summary => {
      // Recalculate total years from months
      const totalMonths = summary.total_months || 0;
      const calculatedYears = Math.floor(totalMonths / 12);
      const remainingMonths = totalMonths % 12;
      
      return {
        ...summary,
        total_years: summary.total_years || calculatedYears,
        total_months: remainingMonths,
        total_years_decimal: totalMonths / 12,
        date_range: summary.first_start_date && summary.last_end_date 
          ? `${summary.first_start_date} - ${summary.last_end_date}`
          : null
      };
    }).sort((a, b) => {
      // Sort by most recent first
      const aYear = a.last_end_year || 0;
      const bYear = b.last_end_year || 0;
      return bYear - aYear;
    });

    // EDUCATION - Comprehensive extraction
    const educationSection = findSectionByHeading(["Education"]);
    if (educationSection) {
      const items = educationSection.querySelectorAll("li, .pvs-list__paged-list-item, [data-view-name='profile-component-entity'], article");
      items.forEach(item => {
        if (!item) return; // Skip null items
        
        const itemData = extractElementData(item);
        const itemText = getTextContent(item) || ""; // Ensure itemText is never null
        
        const schoolEl = item.querySelector("h3, .t-16.t-black.t-bold, [class*='school'], [class*='university']");
        const school = getTextContent(schoolEl);

        let degree = null;
        const degreeSelectors = [
          ".t-14.t-black--light",
          ".pvs-entity__subtitle",
          "[class*='degree']"
        ];
        for (const selector of degreeSelectors) {
          const el = item.querySelector(selector);
          if (el && el !== schoolEl) {
            degree = getTextContent(el);
            break;
          }
        }

        let fieldOfStudy = null;
        if (degree) {
          const fieldMatch = degree.match(/(?:in|,)\s*([^,]+)/i);
          if (fieldMatch) {
            fieldOfStudy = fieldMatch[1].trim();
          }
        }

        let dateRange = null;
        const dateEl = item.querySelector(".t-14.t-black--light, .pvs-entity__caption, [class*='date']");
        dateRange = getTextContent(dateEl);

        let description = null;
        const descEl = item.querySelector(".pvs-list__outer-container .t-14.t-normal, [class*='description']");
        description = getTextContent(descEl);

        if (school || degree || (itemText && itemText.length > 20)) {
          structured.education.push({
            degree,
            school,
            field_of_study: fieldOfStudy,
            date_range: dateRange,
            description
            // Removed raw_html and element_data to reduce data size
          });
        }
      });
    }

    // SKILLS - Comprehensive extraction
    const skillsSection = findSectionByHeading(["Skills", "Skills & Endorsements", "Endorsements"]);
    if (skillsSection) {
      const skillItems = skillsSection.querySelectorAll("li, .pvs-list__paged-list-item, span[data-anonymize='skill-name'], [class*='skill']");
      skillItems.forEach(item => {
        if (!item) return; // Skip null items
        
        const itemData = extractElementData(item);
        const nameEl = item.querySelector("span, a, .t-16.t-black.t-bold, [class*='skill-name']");
        const name = getTextContent(nameEl);

        let endorsements = null;
        const text = item.textContent || "";
        const endorsementMatch = text.match(/(\d+)\s*endorsements?/i);
        if (endorsementMatch) {
          endorsements = parseInt(endorsementMatch[1], 10);
        }

        if (name || (item.textContent && item.textContent.trim().length > 2)) {
          structured.skills.push({
            name: name || (item.textContent ? item.textContent.trim() : ""),
            endorsements,
            // Removed raw_html and element_data to reduce data size
          });
        }
      });
    }

    // CERTIFICATIONS
    const certSection = findSectionByHeading(["Certifications", "Licenses", "Licenses & Certifications"]);
    if (certSection) {
      const certItems = certSection.querySelectorAll("li, .pvs-list__paged-list-item, article");
      certItems.forEach(item => {
        if (!item) return; // Skip null items
        
        const itemData = extractElementData(item);
        structured.certifications.push({
          name: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item) || "",
          issuer: getTextContent(item.querySelector("[class*='issuer'], [class*='organization']")),
          date: getTextContent(item.querySelector("[class*='date']")),
          credential_id: getTextContent(item.querySelector("[class*='credential'], [class*='id']")),
          credential_url: item.querySelector("a")?.href || null,
          // Removed raw_html and element_data to reduce data size
          raw_text: getTextContent(item) || ""
        });
      });
    }

    // LANGUAGES
    const langSection = findSectionByHeading(["Languages"]);
    if (langSection) {
      const langItems = langSection.querySelectorAll("li, .pvs-list__paged-list-item");
      langItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.languages.push({
          name: getTextContent(item.querySelector("h3, [class*='language']")) || getTextContent(item),
          proficiency: getTextContent(item.querySelector("[class*='proficiency']")),
          // Removed raw_html and element_data to reduce data size
        });
      });
    }

    // PROJECTS
    const projectSection = findSectionByHeading(["Projects"]);
    if (projectSection) {
      const projectItems = projectSection.querySelectorAll("li, .pvs-list__paged-list-item, article");
      projectItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.projects.push({
          name: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          description: getTextContent(item.querySelector("[class*='description']")),
          url: item.querySelector("a")?.href || null,
          date: getTextContent(item.querySelector("[class*='date']")),
            // Removed raw_html and element_data to reduce data size
            raw_text: getTextContent(item)
        });
      });
    }

    // PUBLICATIONS
    const pubSection = findSectionByHeading(["Publications"]);
    if (pubSection) {
      const pubItems = pubSection.querySelectorAll("li, .pvs-list__paged-list-item, article");
      pubItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.publications.push({
          title: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          publisher: getTextContent(item.querySelector("[class*='publisher']")),
          date: getTextContent(item.querySelector("[class*='date']")),
          url: item.querySelector("a")?.href || null,
            // Removed raw_html and element_data to reduce data size
            raw_text: getTextContent(item)
        });
      });
    }

    // VOLUNTEER EXPERIENCE
    const volunteerSection = findSectionByHeading(["Volunteer", "Volunteer Experience"]);
    if (volunteerSection) {
      const volunteerItems = volunteerSection.querySelectorAll("li, .pvs-list__paged-list-item, article");
      volunteerItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.volunteer_experience.push({
          role: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          organization: getTextContent(item.querySelector("[class*='organization']")),
          cause: getTextContent(item.querySelector("[class*='cause']")),
          date: getTextContent(item.querySelector("[class*='date']")),
          description: getTextContent(item.querySelector("[class*='description']")),
            // Removed raw_html and element_data to reduce data size
            raw_text: getTextContent(item)
        });
      });
    }

    // COURSES
    const courseSection = findSectionByHeading(["Courses"]);
    if (courseSection) {
      const courseItems = courseSection.querySelectorAll("li, .pvs-list__paged-list-item");
      courseItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.courses.push({
          name: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          number: getTextContent(item.querySelector("[class*='number']")),
          // Removed raw_html and element_data to reduce data size
        });
      });
    }

    // HONORS & AWARDS
    const honorsSection = findSectionByHeading(["Honors", "Awards", "Honors & Awards"]);
    if (honorsSection) {
      const honorItems = honorsSection.querySelectorAll("li, .pvs-list__paged-list-item, article");
      honorItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.honors_awards.push({
          title: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          issuer: getTextContent(item.querySelector("[class*='issuer']")),
          date: getTextContent(item.querySelector("[class*='date']")),
          description: getTextContent(item.querySelector("[class*='description']")),
            // Removed raw_html and element_data to reduce data size
            raw_text: getTextContent(item)
        });
      });
    }

    // ORGANIZATIONS
    const orgSection = findSectionByHeading(["Organizations"]);
    if (orgSection) {
      const orgItems = orgSection.querySelectorAll("li, .pvs-list__paged-list-item");
      orgItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.organizations.push({
          name: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          role: getTextContent(item.querySelector("[class*='role']")),
          date: getTextContent(item.querySelector("[class*='date']")),
          // Removed raw_html and element_data to reduce data size
        });
      });
    }

    // PATENTS
    const patentSection = findSectionByHeading(["Patents"]);
    if (patentSection) {
      const patentItems = patentSection.querySelectorAll("li, .pvs-list__paged-list-item, article");
      patentItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.patents.push({
          title: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          patent_number: getTextContent(item.querySelector("[class*='number']")),
          date: getTextContent(item.querySelector("[class*='date']")),
          url: item.querySelector("a")?.href || null,
            // Removed raw_html and element_data to reduce data size
            raw_text: getTextContent(item)
        });
      });
    }

    // TEST SCORES
    const testSection = findSectionByHeading(["Test Scores"]);
    if (testSection) {
      const testItems = testSection.querySelectorAll("li, .pvs-list__paged-list-item");
      testItems.forEach(item => {
        const itemData = extractElementData(item);
        structured.test_scores.push({
          name: getTextContent(item.querySelector("h3, [class*='title']")) || getTextContent(item),
          score: getTextContent(item.querySelector("[class*='score']")),
          date: getTextContent(item.querySelector("[class*='date']")),
          // Removed raw_html and element_data to reduce data size
        });
      });
    }

    // RECOMMENDATIONS
    const recommendationsSection = findSectionByHeading(["Recommendations"]);
    if (recommendationsSection) {
      const recItems = recommendationsSection.querySelectorAll("li, .pvs-list__paged-list-item, article");
      recItems.forEach(item => {
        if (!item) return; // Skip null items
        
        const itemData = extractElementData(item);
        const text = item.textContent || "";
        const relationshipMatch = text.match(/worked\s+with[^.]*/i);
        const dateMatch = text.match(/(\w+\s+\d{4})/);
        structured.recommendations.push({
          direction: text.toLowerCase().includes("received") ? "received" : 
                     text.toLowerCase().includes("given") ? "given" : null,
          from_name: getTextContent(item.querySelector("h3, .t-16.t-black.t-bold, [class*='name']")),
          from_title: getTextContent(item.querySelector(".t-14.t-black--light, [class*='title']")),
          relationship: relationshipMatch ? relationshipMatch[0] : null,
          text: getTextContent(item.querySelector(".pvs-list__outer-container .t-14.t-normal, .inline-show-more-text, [class*='text']")),
          date: dateMatch ? dateMatch[1] : null,
            // Removed raw_html and element_data to reduce data size
            raw_text: text
        });
      });
    }

    // INTERESTS - Companies
    const companiesSection = findSectionByHeading(["Companies", "Following"]);
    if (companiesSection) {
      const companyItems = companiesSection.querySelectorAll("a, .pvs-list__paged-list-item, [class*='company']");
      companyItems.forEach(item => {
        const name = getTextContent(item);
        if (name && name.length > 2) {
          structured.interests.companies.push({
            name: name,
            url: item.href || null
            // Removed element_data to reduce data size
          });
        }
      });
    }

    // INTERESTS - Groups
    const groupsSection = findSectionByHeading(["Groups"]);
    if (groupsSection) {
      const groupItems = groupsSection.querySelectorAll("a, .pvs-list__paged-list-item, [class*='group']");
      groupItems.forEach(item => {
        const name = getTextContent(item);
        if (name && name.length > 2) {
          structured.interests.groups.push({
            name: name,
            url: item.href || null
            // Removed element_data to reduce data size
          });
        }
      });
    }

    // INTERESTS - Causes
    const causesSection = findSectionByHeading(["Causes"]);
    if (causesSection) {
      const causeItems = causesSection.querySelectorAll("a, .pvs-list__paged-list-item, [class*='cause']");
      causeItems.forEach(item => {
        const name = getTextContent(item);
        if (name && name.length > 2) {
          structured.interests.causes.push({
            name: name,
            url: item.href || null
            // Removed element_data to reduce data size
          });
        }
      });
    }

    // CONTACT INFO - Extract emails, phones, etc.
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = bodyText.match(emailPattern);
    if (emails) {
      structured.contact_info.emails = [...new Set(emails)];
    }

    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = bodyText.match(phonePattern);
    if (phones) {
      structured.contact_info.phones = [...new Set(phones)];
    }

    // SOCIAL LINKS
    const socialLinks = extractAllLinks().filter(link => {
      const href = link.href.toLowerCase();
      return href.includes('twitter.com') || href.includes('github.com') || 
             href.includes('facebook.com') || href.includes('instagram.com') ||
             href.includes('youtube.com') || href.includes('medium.com') ||
             href.includes('stackoverflow.com') || href.includes('behance.net') ||
             href.includes('dribbble.com') || href.includes('portfolio');
    });
    structured.social_links = socialLinks;

    return structured;
  }

  // Build the full profile document - COMPREHENSIVE VERSION
  function buildProfileDocument() {
    try {
      const url = window.location.href;
      // Removed full HTML extraction to reduce data size (was causing 5MB+ files)
      // Only keep a minimal HTML snippet for reference
      const rawHtml = "<!DOCTYPE html>\n<!-- HTML removed to reduce data size -->";
      const rawText = document.body ? document.body.innerText : "";
      const now = new Date().toISOString();

      // Extract ALL structured data
      let structured;
      try {
        structured = extractStructuredData();
      } catch (e) {
        console.error("Error in extractStructuredData:", e);
        throw new Error(`Failed to extract structured data: ${e.message}`);
      }

      // Extract ALL sections
      let allSections = [];
      try {
        allSections = extractAllSections();
      } catch (e) {
        console.warn("Error extracting sections:", e);
      }

      // Extract ALL list items
      let allListItems = [];
      try {
        allListItems = extractAllListItems();
      } catch (e) {
        console.warn("Error extracting list items:", e);
      }

      // Extract ALL links
      let allLinks = [];
      try {
        allLinks = extractAllLinks();
      } catch (e) {
        console.warn("Error extracting links:", e);
      }

      // Extract ALL images
      let allImages = [];
      try {
        allImages = extractAllImages();
      } catch (e) {
        console.warn("Error extracting images:", e);
      }

      // Extract ALL headings
      let allHeadings = [];
      try {
        allHeadings = extractAllHeadings();
      } catch (e) {
        console.warn("Error extracting headings:", e);
      }

      // Extract ALL tables
      let allTables = [];
      try {
        allTables = extractAllTables();
      } catch (e) {
        console.warn("Error extracting tables:", e);
      }

    // Build comprehensive JSON array with ALL extracted data, sorted by category
    const comprehensiveData = [
      // Metadata first
      {
        category: "metadata",
        type: "extraction_info",
        data: {
          source_url: url,
          extracted_at: now,
          extractor_version: "v2.0.0-comprehensive",
          page_title: document.title,
          page_description: document.querySelector('meta[name="description"]')?.content || null,
          page_keywords: document.querySelector('meta[name="keywords"]')?.content || null,
          user_agent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      },
      
      // Personal info
      {
        category: "personal_info",
        type: "personal_information",
        data: structured.personal_info
      },
      
      // Activity
      {
        category: "activity",
        type: "activity_metrics",
        data: structured.activity
      },
      
      // Current Employer
      ...(structured.current_employer ? [{
        category: "employment",
        type: "current_employer",
        data: structured.current_employer
      }] : []),
      
      // Past Employers
      ...structured.past_employers.map(emp => ({
        category: "employment",
        type: "past_employer",
        data: emp
      })),
      
      // Employment Summary (aggregated by company)
      ...structured.employment_summary_array.map(summary => ({
        category: "employment",
        type: "employment_summary",
        data: summary
      })),
      
      // Experience (sorted by date if available)
      ...structured.experience.map(exp => ({
        category: "experience",
        type: "work_experience",
        data: exp
      })),
      
      // Education (sorted by date if available)
      ...structured.education.map(edu => ({
        category: "education",
        type: "education_entry",
        data: edu
      })),
      
      // Skills (sorted alphabetically)
      ...structured.skills.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(skill => ({
        category: "skills",
        type: "skill",
        data: skill
      })),
      
      // Certifications
      ...structured.certifications.map(cert => ({
        category: "certifications",
        type: "certification",
        data: cert
      })),
      
      // Languages
      ...structured.languages.map(lang => ({
        category: "languages",
        type: "language",
        data: lang
      })),
      
      // Projects
      ...structured.projects.map(proj => ({
        category: "projects",
        type: "project",
        data: proj
      })),
      
      // Publications
      ...structured.publications.map(pub => ({
        category: "publications",
        type: "publication",
        data: pub
      })),
      
      // Volunteer Experience
      ...structured.volunteer_experience.map(vol => ({
        category: "volunteer_experience",
        type: "volunteer_entry",
        data: vol
      })),
      
      // Courses
      ...structured.courses.map(course => ({
        category: "courses",
        type: "course",
        data: course
      })),
      
      // Honors & Awards
      ...structured.honors_awards.map(honor => ({
        category: "honors_awards",
        type: "honor_award",
        data: honor
      })),
      
      // Organizations
      ...structured.organizations.map(org => ({
        category: "organizations",
        type: "organization",
        data: org
      })),
      
      // Patents
      ...structured.patents.map(patent => ({
        category: "patents",
        type: "patent",
        data: patent
      })),
      
      // Test Scores
      ...structured.test_scores.map(test => ({
        category: "test_scores",
        type: "test_score",
        data: test
      })),
      
      // Recommendations
      ...structured.recommendations.map(rec => ({
        category: "recommendations",
        type: "recommendation",
        data: rec
      })),
      
      // Interests - Companies
      ...structured.interests.companies.map(comp => ({
        category: "interests",
        type: "company_interest",
        data: comp
      })),
      
      // Interests - Groups
      ...structured.interests.groups.map(group => ({
        category: "interests",
        type: "group_interest",
        data: group
      })),
      
      // Interests - Causes
      ...structured.interests.causes.map(cause => ({
        category: "interests",
        type: "cause_interest",
        data: cause
      })),
      
      // Contact Info
      {
        category: "contact_info",
        type: "contact_information",
        data: structured.contact_info
      },
      
      // Social Links
      ...structured.social_links.map(link => ({
        category: "social_links",
        type: "social_link",
        data: link
      })),
      
      // All Sections
      ...allSections.map(section => ({
        category: "sections",
        type: "section",
        data: section
      })),
      
      // All List Items
      ...allListItems.map(item => ({
        category: "list_items",
        type: "list_item",
        data: item
      })),
      
      // All Links
      ...allLinks.map(link => ({
        category: "links",
        type: "link",
        data: link
      })),
      
      // All Images
      ...allImages.map(img => ({
        category: "images",
        type: "image",
        data: img
      })),
      
      // All Headings
      ...allHeadings.map(heading => ({
        category: "headings",
        type: "heading",
        data: heading
      })),
      
      // All Tables
      ...allTables.map(table => ({
        category: "tables",
        type: "table",
        data: table
      })),
      
      // Raw data last
      {
        category: "raw_data",
        type: "raw_html",
        data: {
          html: rawHtml,
          text: rawText,
          html_length: rawHtml.length,
          text_length: rawText.length
        }
      }
    ];

    // Return both the comprehensive array format AND the structured format for backward compatibility
    return {
      // Comprehensive JSON array format (NEW - sorted and categorized)
      comprehensive_data: comprehensiveData,
      
      // Structured format (for backward compatibility with existing processors)
      personal_info: structured.personal_info,
      activity: structured.activity,
      current_employer: structured.current_employer,
      past_employers: structured.past_employers,
      employment_summary: structured.employment_summary,
      employment_summary_array: structured.employment_summary_array,
      experience: structured.experience,
      education: structured.education,
      skills: structured.skills,
      recommendations: structured.recommendations,
      interests: structured.interests,
      certifications: structured.certifications,
      languages: structured.languages,
      projects: structured.projects,
      publications: structured.publications,
      volunteer_experience: structured.volunteer_experience,
      courses: structured.courses,
      honors_awards: structured.honors_awards,
      organizations: structured.organizations,
      patents: structured.patents,
      test_scores: structured.test_scores,
      contact_info: structured.contact_info,
      social_links: structured.social_links,
      
      // Raw data
      raw_html: rawHtml,
      raw_text: rawText,
      
      // Extraction metadata
      extraction_metadata: {
        source_url: url,
        extracted_at: now,
        extractor_version: "v2.0.0-comprehensive",
        total_items_extracted: comprehensiveData.length,
        categories_found: [...new Set(comprehensiveData.map(item => item.category))],
        html_size_bytes: rawHtml.length,
        text_size_bytes: rawText.length
      }
    };
    } catch (error) {
      console.error("Error in buildProfileDocument:", error);
      throw new Error(`Failed to build profile document: ${error.message}`);
    }
  }
})();
