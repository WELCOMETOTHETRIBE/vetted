document.addEventListener("DOMContentLoaded", () => {
  const tableContainer = document.getElementById("table-container");
  const emptyState = document.getElementById("empty");
  const modal = document.getElementById("profile-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close");
  const cancelBtn = document.getElementById("cancel-btn");
  const saveProfileBtn = document.getElementById("save-profile-btn");
  const refreshBtn = document.getElementById("refresh-btn");
  const copyCsvBtn = document.getElementById("copy-csv-btn");
  const downloadCsvBtn = document.getElementById("download-csv-btn");
  const sendToVettedBtn = document.getElementById("send-to-vetted-btn");
  const clearBtn = document.getElementById("clear-btn");
  const vettedApiUrlInput = document.getElementById("vetted-api-url");
  const vettedApiKeyInput = document.getElementById("vetted-api-key");
  const autoSendVettedCheckbox = document.getElementById("auto-send-vetted-checkbox");
  const sheetsUrlInput = document.getElementById("sheets-url");
  const autoSendCheckbox = document.getElementById("auto-send-checkbox");
  const saveSettingsBtn = document.getElementById("save-settings-btn");
  const settingsStatus = document.getElementById("settings-status");

  let currentEditingIndex = -1;
  let profileDocuments = [];

  // Tag options
  const CORE_ROLES = [
    "Software Engineer",
    "Backend",
    "Frontend",
    "Full Stack",
    "ML",
    "Infra / DevOps",
    "Data Engineer",
    "Security",
    "Product Designer",
    "Product Manager",
    "Recruiter",
    "Embedded Software Engineer",
    "Hardware Engineer",
    "Mechanical Engineer",
    "Electrical Engineer"
  ];

  const DOMAINS = [
    "Hardware",
    "SaaS",
    "FinTech",
    "Finance",
    "Consumer",
    "AI",
    "Crypto / Blockchain",
    "Ecomm / Marketplace",
    "Cybersecurity"
  ];

  function renderTable(documents) {
    tableContainer.innerHTML = "";
    profileDocuments = documents;

    if (!documents || documents.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["#", "Name", "Current Company", "Job Title", "Location", "Tags", "Actions"].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    documents.forEach((doc, index) => {
      const tr = document.createElement("tr");
      tr.dataset.index = index;

      // Process the document to get current company and title
      let currentCompany = "";
      let currentTitle = "";
      let tags = [];

      if (typeof ProfileProcessor !== 'undefined') {
        try {
          const processed = ProfileProcessor.processProfileDocument(doc);
          if (processed) {
            currentCompany = processed["Current Company"] || "";
            currentTitle = processed["Job title"] || "";
          }
        } catch (e) {
          console.error("Error processing:", e);
        }
      }

      // Get tags from document metadata
      if (doc._metadata) {
        tags = doc._metadata.tags || [];
      }

      // #
      const tdIndex = document.createElement("td");
      tdIndex.textContent = (index + 1).toString();
      tr.appendChild(tdIndex);

      // Name
      const tdName = document.createElement("td");
      tdName.textContent = doc.personal_info?.name || "—";
      tr.appendChild(tdName);

      // Current Company
      const tdCompany = document.createElement("td");
      tdCompany.textContent = currentCompany || "—";
      tr.appendChild(tdCompany);

      // Job Title
      const tdTitle = document.createElement("td");
      tdTitle.textContent = currentTitle || "—";
      tr.appendChild(tdTitle);

      // Location
      const tdLocation = document.createElement("td");
      tdLocation.textContent = doc.personal_info?.location || "—";
      tr.appendChild(tdLocation);

      // Tags
      const tdTags = document.createElement("td");
      if (tags.length > 0) {
        tags.forEach(tag => {
          const badge = document.createElement("span");
          badge.className = "badge badge-tagged";
          badge.textContent = tag;
          tdTags.appendChild(badge);
        });
      } else {
        tdTags.textContent = "—";
      }
      tr.appendChild(tdTags);

      // Actions
      const tdActions = document.createElement("td");
      const editBtn = document.createElement("button");
      editBtn.className = "btn-primary";
      editBtn.textContent = "Edit";
      editBtn.style.fontSize = "11px";
      editBtn.style.padding = "4px 8px";
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(index);
      };
      tdActions.appendChild(editBtn);
      tr.appendChild(tdActions);

      tr.onclick = () => openEditModal(index);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
  }

  function openEditModal(index) {
    currentEditingIndex = index;
    const doc = profileDocuments[index];

    // Process document to get all fields
    let processed = {};
    if (typeof ProfileProcessor !== 'undefined') {
      try {
        processed = ProfileProcessor.processProfileDocument(doc) || {};
      } catch (e) {
        console.error("Error processing:", e);
      }
    }

    // Get metadata (tags, edited fields)
    const metadata = doc._metadata || {};
    const tags = metadata.tags || { coreRoles: [], domains: [] };
    const editedFields = metadata.editedFields || {};

    // Merge edited fields with processed data
    const displayData = { ...processed, ...editedFields };

    // Generate JSON and CSV previews
    const jsonPreview = JSON.stringify(doc, null, 2);
    let csvPreview = "";
    try {
      if (typeof ProfileProcessor !== 'undefined') {
        const csvData = ProfileProcessor.processProfileDocuments([doc]);
        if (csvData && csvData.length > 0) {
          // Merge edited fields and tags
          const csvProfile = csvData[0];
          if (metadata.editedFields) {
            Object.assign(csvProfile, metadata.editedFields);
          }
          if (metadata.tags) {
            csvProfile["Core Roles"] = metadata.tags.coreRoles.join("; ");
            csvProfile["Domains"] = metadata.tags.domains.join("; ");
          }
          csvPreview = ProfileProcessor.convertToCSV([csvProfile]);
        }
      }
    } catch (e) {
      console.error("Error generating CSV preview:", e);
      csvPreview = "Error generating CSV preview: " + e.message;
    }

    modalBody.innerHTML = `
      <div class="tabs">
        <button class="tab active" onclick="switchTab('edit')">Edit</button>
        <button class="tab" onclick="switchTab('json')">JSON Preview</button>
        <button class="tab" onclick="switchTab('csv')">CSV Preview</button>
      </div>

      <div id="tab-edit" class="tab-content active">
      <div class="tags-section">
        <div class="tag-group">
          <label>Core Role</label>
          <select id="core-role-select" class="field-input" multiple>
            ${CORE_ROLES.map(role => 
              `<option value="${role}" ${tags.coreRoles.includes(role) ? 'selected' : ''}>${role}</option>`
            ).join('')}
          </select>
          <div class="tag-chips" id="core-role-chips"></div>
        </div>
        <div class="tag-group">
          <label>Domain</label>
          <select id="domain-select" class="field-input" multiple>
            ${DOMAINS.map(domain => 
              `<option value="${domain}" ${tags.domains.includes(domain) ? 'selected' : ''}>${domain}</option>`
            ).join('')}
          </select>
          <div class="tag-chips" id="domain-chips"></div>
        </div>
      </div>

      <div class="two-columns">
        <div class="field-group">
          <label class="field-label">LinkedIn URL</label>
          <input type="text" class="field-input" id="field-linkedin-url" value="${escapeHtml(displayData["Linkedin URL"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Full Name</label>
          <input type="text" class="field-input" id="field-full-name" value="${escapeHtml(displayData["Full Name"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Current Company</label>
          <input type="text" class="field-input" id="field-current-company" value="${escapeHtml(displayData["Current Company"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Current Company Start Date</label>
          <input type="text" class="field-input" id="field-current-start-date" value="${escapeHtml(displayData["Current Company Start Date"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Current Company End Date</label>
          <input type="text" class="field-input" id="field-current-end-date" value="${escapeHtml(displayData["Current Company End Date"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Current Company Tenure Years</label>
          <input type="text" class="field-input" id="field-current-tenure-years" value="${escapeHtml(displayData["Current Company Tenure Years"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Current Company Tenure Months</label>
          <input type="text" class="field-input" id="field-current-tenure-months" value="${escapeHtml(displayData["Current Company Tenure Months"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Job Title</label>
          <input type="text" class="field-input" id="field-job-title" value="${escapeHtml(displayData["Job title"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Location</label>
          <input type="text" class="field-input" id="field-location" value="${escapeHtml(displayData["Location"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Previous Target Company</label>
          <input type="text" class="field-input" id="field-prev-target-company" value="${escapeHtml(displayData["Previous target company"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Previous Target Start Date</label>
          <input type="text" class="field-input" id="field-prev-start-date" value="${escapeHtml(displayData["Previous target company Start Date"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Previous Target End Date</label>
          <input type="text" class="field-input" id="field-prev-end-date" value="${escapeHtml(displayData["Previous target company End Date"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Previous Target Tenure Years</label>
          <input type="text" class="field-input" id="field-prev-tenure-years" value="${escapeHtml(displayData["Previous target company Tenure Years"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Previous Target Tenure Months</label>
          <input type="text" class="field-input" id="field-prev-tenure-months" value="${escapeHtml(displayData["Previous target company Tenure Months"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Tenure at Previous Target</label>
          <input type="text" class="field-input" id="field-tenure-prev-target" value="${escapeHtml(displayData["Tenure at previous target (Year start to year end)"] || "")}" />
        </div>
        <div class="field-group full-width">
          <label class="field-label">Company 1</label>
          <input type="text" class="field-input" id="field-company-1" value="${escapeHtml(displayData["Company 1"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Company 2</label>
          <input type="text" class="field-input" id="field-company-2" value="${escapeHtml(displayData["Company 2"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Company 3</label>
          <input type="text" class="field-input" id="field-company-3" value="${escapeHtml(displayData["Company 3"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Company 4</label>
          <input type="text" class="field-input" id="field-company-4" value="${escapeHtml(displayData["Company 4"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Company 5</label>
          <input type="text" class="field-input" id="field-company-5" value="${escapeHtml(displayData["Company 5"] || "")}" />
        </div>
        <div class="field-group full-width">
          <label class="field-label">Previous Title(s)</label>
          <textarea class="field-input" id="field-previous-titles">${escapeHtml(displayData["Previous title(s)"] || "")}</textarea>
        </div>
        <div class="field-group">
          <label class="field-label">Total Years Experience</label>
          <input type="text" class="field-input" id="field-total-years" value="${escapeHtml(displayData["Total Years full time experience"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">University 1</label>
          <input type="text" class="field-input" id="field-university-1" value="${escapeHtml(displayData["University 1"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">University 2</label>
          <input type="text" class="field-input" id="field-university-2" value="${escapeHtml(displayData["University 2"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Field of Study 1</label>
          <input type="text" class="field-input" id="field-field-study-1" value="${escapeHtml(displayData["Field of Study 1"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Degrees</label>
          <input type="text" class="field-input" id="field-degrees" value="${escapeHtml(displayData["Degrees"] || "")}" />
        </div>
        <div class="field-group">
          <label class="field-label">Year of Undergrad Graduation</label>
          <input type="text" class="field-input" id="field-undergrad-year" value="${escapeHtml(displayData["Year of Undergrad Graduation"] || "")}" />
        </div>
      </div>
      </div>

      <div id="tab-json" class="tab-content">
        <div class="preview-container json">${escapeHtml(jsonPreview)}</div>
        <button class="copy-preview-btn btn-secondary" onclick="copyPreview('json')">Copy JSON</button>
      </div>

      <div id="tab-csv" class="tab-content">
        <div class="preview-container csv">${escapeHtml(csvPreview)}</div>
        <button class="copy-preview-btn btn-secondary" onclick="copyPreview('csv')">Copy CSV</button>
      </div>
    `;

    // Store previews globally for copy function
    window.currentJsonPreview = jsonPreview;
    window.currentCsvPreview = csvPreview;

    // Update tag chips when selection changes
    updateTagChips('core-role-select', 'core-role-chips');
    updateTagChips('domain-select', 'domain-chips');

    document.getElementById('core-role-select').addEventListener('change', () => {
      updateTagChips('core-role-select', 'core-role-chips');
    });

    document.getElementById('domain-select').addEventListener('change', () => {
      updateTagChips('domain-select', 'domain-chips');
    });

    // Set up tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabText = tab.textContent.trim();
        let tabName = 'edit';
        if (tabText.includes('JSON')) tabName = 'json';
        else if (tabText.includes('CSV')) tabName = 'csv';
        window.switchTab(tabName);
      });
    });

    modal.style.display = "block";
  }

  function updateTagChips(selectId, chipsId) {
    const select = document.getElementById(selectId);
    const chips = document.getElementById(chipsId);
    chips.innerHTML = '';

    Array.from(select.selectedOptions).forEach(option => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `${option.value}<span class="remove" onclick="removeTag('${selectId}', '${option.value}')">×</span>`;
      chips.appendChild(chip);
    });
  }

  window.removeTag = function(selectId, value) {
    const select = document.getElementById(selectId);
    const option = Array.from(select.options).find(opt => opt.value === value);
    if (option) {
      option.selected = false;
      updateTagChips(selectId, selectId === 'core-role-select' ? 'core-role-chips' : 'domain-chips');
    }
  };

  window.switchTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected tab
    const tabContent = document.getElementById(`tab-${tabName}`);
    if (tabContent) {
      tabContent.classList.add('active');
    }
    
    // Activate clicked tab button
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab.textContent.toLowerCase().includes(tabName.toLowerCase())) {
        tab.classList.add('active');
      }
    });
  };

  window.copyPreview = function(type) {
    const text = type === 'json' ? window.currentJsonPreview : window.currentCsvPreview;
    navigator.clipboard.writeText(text).then(
      () => alert(`${type.toUpperCase()} copied to clipboard!`),
      () => alert(`Failed to copy ${type.toUpperCase()} to clipboard.`)
    );
  };

  async function saveProfile() {
    if (currentEditingIndex === -1) return;

    const doc = profileDocuments[currentEditingIndex];

    // Collect all field values
    const editedFields = {
      "Linkedin URL": document.getElementById("field-linkedin-url").value,
      "Full Name": document.getElementById("field-full-name").value,
      "Current Company": document.getElementById("field-current-company").value,
      "Current Company Start Date": document.getElementById("field-current-start-date").value,
      "Current Company End Date": document.getElementById("field-current-end-date").value,
      "Current Company Tenure Years": document.getElementById("field-current-tenure-years").value,
      "Current Company Tenure Months": document.getElementById("field-current-tenure-months").value,
      "Job title": document.getElementById("field-job-title").value,
      "Location": document.getElementById("field-location").value,
      "Previous target company": document.getElementById("field-prev-target-company").value,
      "Previous target company Start Date": document.getElementById("field-prev-start-date").value,
      "Previous target company End Date": document.getElementById("field-prev-end-date").value,
      "Previous target company Tenure Years": document.getElementById("field-prev-tenure-years").value,
      "Previous target company Tenure Months": document.getElementById("field-prev-tenure-months").value,
      "Tenure at previous target (Year start to year end)": document.getElementById("field-tenure-prev-target").value,
      "Company 1": document.getElementById("field-company-1").value,
      "Company 2": document.getElementById("field-company-2").value,
      "Company 3": document.getElementById("field-company-3").value,
      "Company 4": document.getElementById("field-company-4").value,
      "Company 5": document.getElementById("field-company-5").value,
      "Previous title(s)": document.getElementById("field-previous-titles").value,
      "Total Years full time experience": document.getElementById("field-total-years").value,
      "University 1": document.getElementById("field-university-1").value,
      "University 2": document.getElementById("field-university-2").value,
      "Field of Study 1": document.getElementById("field-field-study-1").value,
      "Degrees": document.getElementById("field-degrees").value,
      "Year of Undergrad Graduation": document.getElementById("field-undergrad-year").value
    };

    // Collect tags
    const coreRoleSelect = document.getElementById("core-role-select");
    const domainSelect = document.getElementById("domain-select");
    const coreRoles = Array.from(coreRoleSelect.selectedOptions).map(opt => opt.value);
    const domains = Array.from(domainSelect.selectedOptions).map(opt => opt.value);

    // Save metadata
    if (!doc._metadata) {
      doc._metadata = {};
    }
    doc._metadata.editedFields = editedFields;
    doc._metadata.tags = {
      coreRoles: coreRoles,
      domains: domains
    };
    doc._metadata.lastEdited = new Date().toISOString();

    // Disable save button to prevent double-clicks
    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = "Saving...";

    try {
      // Update the profile in storage (don't send to Vetted yet)
      await VettedStorage.updateProfileByIndex(currentEditingIndex, doc);
      
      // Close modal immediately
      modal.style.display = "none";
      currentEditingIndex = -1;
      
      // Show success notification (non-blocking)
      const successNotif = document.createElement("div");
      successNotif.style.cssText = "position: fixed; top: 10px; right: 10px; background: #4caf50; color: white; padding: 12px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);";
      successNotif.textContent = "Profile saved! Use 'Send to Vetted' to upload.";
      document.body.appendChild(successNotif);
      setTimeout(() => successNotif.remove(), 3000);
      
      // Refresh the table (will happen automatically via storage listener, but do it explicitly)
      setTimeout(() => {
        loadData().catch(err => {
          console.error("Error refreshing after save:", err);
        });
      }, 100);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      
      // Show error notification (non-blocking)
      const errorNotif = document.createElement("div");
      errorNotif.style.cssText = "position: fixed; top: 10px; right: 10px; background: #e53935; color: white; padding: 12px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);";
      errorNotif.textContent = `Error saving: ${error.message || "Unknown error"}`;
      document.body.appendChild(errorNotif);
      setTimeout(() => errorNotif.remove(), 5000);
    } finally {
      // Re-enable save button
      saveProfileBtn.disabled = false;
      saveProfileBtn.textContent = "Save Changes";
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async function loadData() {
    // Show loading state immediately
    tableContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Loading profiles...</div>`;
    emptyState.style.display = "none";

    try {
      // Check if VettedStorage is available
      if (typeof VettedStorage === 'undefined') {
        console.error("VettedStorage is not available! Make sure storage.js is loaded.");
        tableContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #e53935;">Error: Storage system not loaded. Please reload the extension.</div>`;
        renderTable([]);
        return;
      }

      console.log("Starting to load profiles...");
      
      // Load profiles from chrome.storage.local (with timeout to prevent hanging)
      let documents;
      try {
        documents = await Promise.race([
          VettedStorage.getAllProfiles(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Load timeout after 5s")), 5000))
        ]);
        console.log("Raw documents from chrome.storage.local:", documents);
      } catch (loadError) {
        console.error("Error loading profiles:", loadError);
        // Try direct chrome.storage access as fallback
        documents = await new Promise((resolve) => {
          chrome.storage.local.get(['profileDocuments'], (data) => {
            if (chrome.runtime.lastError) {
              console.error("Direct chrome.storage error:", chrome.runtime.lastError);
              resolve([]);
            } else {
              resolve(Array.isArray(data.profileDocuments) ? data.profileDocuments : []);
            }
          });
        });
        console.log("Fallback: Loaded", documents.length, "profiles directly from chrome.storage");
      }
      
      // Ensure documents is an array
      const profilesArray = Array.isArray(documents) ? documents : [];
      console.log(`Loaded ${profilesArray.length} profiles, rendering table...`);
      
      // Render table immediately (don't wait for queue info)
      renderTable(profilesArray);
      
      // Load queue from chrome.storage (non-blocking, after rendering)
      let queueCount = 0;
      try {
        const settings = await Promise.race([
          VettedStorage.SettingsStorage.get(["vettedQueue"]),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Settings timeout")), 2000))
        ]);
        queueCount = Array.isArray(settings.vettedQueue) ? settings.vettedQueue.length : 0;
        console.log(`${queueCount} profiles queued for Vetted`);
      } catch (settingsError) {
        console.warn("Could not load queue:", settingsError);
        // Continue without queue info
      }
      
      // Show queue status if there are queued profiles
      if (queueCount > 0) {
        const queueStatus = document.createElement("div");
        queueStatus.id = "queue-status";
        queueStatus.style.cssText = "background: #e3f2fd; padding: 8px; margin-bottom: 12px; border-radius: 4px; font-size: 12px;";
        queueStatus.innerHTML = `📤 ${queueCount} profile(s) queued for auto-send to Vetted. They will be sent automatically in batches.`;
        const controls = document.getElementById("controls");
        if (controls && !document.getElementById("queue-status")) {
          controls.insertBefore(queueStatus, controls.firstChild);
        }
      } else {
        const queueStatus = document.getElementById("queue-status");
        if (queueStatus) {
          queueStatus.remove();
        }
      }
      
      // Check storage usage (chrome.storage.local) - non-blocking
      VettedStorage.getStorageSize().then(storageInfo => {
        console.log(`Chrome storage: ${storageInfo.mb}MB, ${storageInfo.count} profiles`);
        
        // Show storage info with warning if approaching limit
        const storageInfoDiv = document.createElement("div");
        storageInfoDiv.id = "storage-info";
        const mbUsed = parseFloat(storageInfo.mb);
        const isNearLimit = mbUsed > 8; // Warn if over 8MB (10MB is Chrome's limit)
        storageInfoDiv.style.cssText = `background: ${isNearLimit ? '#fff3cd' : '#e8f5e9'}; padding: 6px; margin-bottom: 12px; border-radius: 4px; font-size: 11px; color: ${isNearLimit ? '#856404' : '#2e7d32'};`;
        storageInfoDiv.innerHTML = `💾 Chrome Storage: ${storageInfo.mb}MB used, ${storageInfo.count} profiles stored${isNearLimit ? ' (near 10MB limit)' : ''}`;
        const controls = document.getElementById("controls");
        const existingInfo = document.getElementById("storage-info");
        if (existingInfo) {
          existingInfo.remove();
        }
        if (controls) {
          controls.insertBefore(storageInfoDiv, controls.firstChild);
        }
      }).catch(err => {
        console.warn("Could not get storage size:", err);
        // Don't block UI on storage size errors
      });
    } catch (error) {
      console.error("Error loading data:", error);
      const errorMsg = error.message || "Unknown error";
      tableContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #e53935;">Error loading profiles: ${errorMsg}<br/><button onclick="location.reload()" style="margin-top: 10px; padding: 6px 12px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload</button></div>`;
      renderTable([]);
    }
  }

  function loadSettings() {
    chrome.storage.local.get([
      "vettedApiUrl", 
      "vettedApiKey", 
      "autoSendToVetted",
      "googleSheetsUrl", 
      "autoSendToSheets"
    ], (data) => {
      // Pre-fill with default Vetted API URL if not already set
      const defaultVettedApiUrl = "https://vetted-production.up.railway.app/api/candidates/upload";
      if (data.vettedApiUrl) {
        vettedApiUrlInput.value = data.vettedApiUrl;
      } else {
        // Set default URL if not configured
        vettedApiUrlInput.value = defaultVettedApiUrl;
        // Auto-save the default URL so it persists
        chrome.storage.local.set({ vettedApiUrl: defaultVettedApiUrl }, () => {
          console.log("Default Vetted API URL set:", defaultVettedApiUrl);
        });
      }
      if (data.vettedApiKey) {
        vettedApiKeyInput.value = data.vettedApiKey;
      }
      if (data.autoSendToVetted !== undefined) {
        autoSendVettedCheckbox.checked = data.autoSendToVetted;
      }
      if (data.googleSheetsUrl) {
        sheetsUrlInput.value = data.googleSheetsUrl;
      }
      if (data.autoSendToSheets !== undefined) {
        autoSendCheckbox.checked = data.autoSendToSheets;
      }
      
      if (data.vettedApiUrl) {
        settingsStatus.textContent = "Vetted API configured";
        settingsStatus.style.color = "#4caf50";
      } else if (data.googleSheetsUrl) {
        settingsStatus.textContent = "Google Sheets configured (Vetted API not set)";
        settingsStatus.style.color = "#ff9800";
      } else {
        settingsStatus.textContent = "No API configured";
        settingsStatus.style.color = "#e53935";
      }
    });
  }

  function saveSettings() {
    const vettedUrl = vettedApiUrlInput.value.trim();
    const vettedKey = vettedApiKeyInput.value.trim();
    const autoSendVetted = autoSendVettedCheckbox.checked;
    const sheetsUrl = sheetsUrlInput.value.trim();
    const autoSendSheets = autoSendCheckbox.checked;

    // Validate Vetted API URL if provided
    if (vettedUrl && !vettedUrl.startsWith("http://") && !vettedUrl.startsWith("https://")) {
      settingsStatus.textContent = "Invalid Vetted API URL (must start with http:// or https://)";
      settingsStatus.style.color = "#e53935";
      return;
    }

    // Validate Google Sheets URL if provided
    if (sheetsUrl && !sheetsUrl.includes("script.google.com") && !sheetsUrl.includes("script.googleusercontent.com")) {
      settingsStatus.textContent = "Invalid Google Apps Script URL";
      settingsStatus.style.color = "#e53935";
      return;
    }

    const settingsToSave = {
      autoSendToSheets: autoSendSheets
    };

    if (vettedUrl) {
      settingsToSave.vettedApiUrl = vettedUrl;
      settingsToSave.autoSendToVetted = autoSendVetted;
    }
    if (vettedKey) {
      settingsToSave.vettedApiKey = vettedKey;
    }
    if (sheetsUrl) {
      settingsToSave.googleSheetsUrl = sheetsUrl;
    }

    chrome.storage.local.set(settingsToSave, () => {
      if (vettedUrl) {
        settingsStatus.textContent = "Vetted API settings saved!";
      } else if (sheetsUrl) {
        settingsStatus.textContent = "Google Sheets settings saved!";
      } else {
        settingsStatus.textContent = "Settings saved (no API configured)";
      }
      settingsStatus.style.color = "#4caf50";
    });
  }

  async function sendToVetted(profiles, apiUrl, apiKey) {
    if (!apiUrl) {
      throw new Error("Vetted API URL not configured.");
    }

    console.log("Sending to Vetted API:", {
      url: apiUrl,
      profileCount: profiles.length,
      hasApiKey: !!apiKey
    });

    const headers = {
      "Content-Type": "application/json",
    };

    // Add API key if provided
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    let response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        credentials: "include", // Include cookies for session-based auth
        body: JSON.stringify(profiles),
        mode: "cors", // Explicitly set CORS mode
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      // Ignore LinkedIn page errors (they're not related to our extension)
      if (fetchError.message && fetchError.message.includes("user-matching")) {
        console.warn("LinkedIn page error (ignored):", fetchError.message);
        // Continue - this is not our error
      } else {
        throw new Error(`Network error: ${fetchError.message}. Check your API URL and CORS settings.`);
      }
    }

    if (!response.ok) {
      console.error("Vetted API response not OK:", {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl
      });
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error("Error response data:", errorData);
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          errorMessage += ` - ${JSON.stringify(errorData.details)}`;
        }
      } catch (e) {
        console.error("Could not parse JSON error response:", e);
        try {
          const errorText = await response.text();
          console.error("Error response text:", errorText);
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 200)}`;
          }
        } catch (textError) {
          console.error("Could not parse error response:", textError);
        }
      }
      
      // Provide helpful messages for common errors
      if (response.status === 401) {
        errorMessage = "Unauthorized: Please make sure you're logged into Vetted as an admin user";
      } else if (response.status === 403) {
        errorMessage = "Forbidden: You must be an admin user to upload candidates";
      } else if (response.status === 404) {
        errorMessage = "Not Found: Check that your API URL is correct (should end with /api/candidates/upload). Make sure you're using your actual Railway domain, not the placeholder.";
      } else if (response.status === 405) {
        errorMessage = "Method Not Allowed: The API endpoint may not be deployed yet. Wait a few minutes and try again.";
      } else if (response.status === 0 || response.status === undefined) {
        errorMessage = "Network Error: Check CORS settings or that the API URL is accessible";
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  }

  async function sendToGoogleSheets(profiles) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(["googleSheetsUrl"], async (data) => {
        const sheetsUrl = data.googleSheetsUrl;

        if (!sheetsUrl) {
          reject(new Error("Google Sheets URL not configured."));
          return;
        }

        try {
          await fetch(sheetsUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profiles),
          });

          resolve({ success: true, count: profiles.length });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  function generateCSV() {
    if (typeof ProfileProcessor === 'undefined') {
      throw new Error("Profile processor not loaded");
    }

    const processed = ProfileProcessor.processProfileDocuments(profileDocuments);
    
    // Merge edited fields and tags into processed data
    processed.forEach((profile, index) => {
      const doc = profileDocuments[index];
      if (doc._metadata) {
        // Merge edited fields
        if (doc._metadata.editedFields) {
          Object.assign(profile, doc._metadata.editedFields);
        }
        
        // Add tags
        if (doc._metadata.tags) {
          profile["Core Roles"] = doc._metadata.tags.coreRoles.join("; ");
          profile["Domains"] = doc._metadata.tags.domains.join("; ");
        }
      }
    });

    return ProfileProcessor.convertToCSV(processed);
  }

  // Event listeners
  closeBtn.onclick = () => modal.style.display = "none";
  cancelBtn.onclick = () => modal.style.display = "none";
  saveProfileBtn.onclick = saveProfile;
  refreshBtn.onclick = loadData;
  saveSettingsBtn.onclick = saveSettings;

  copyCsvBtn.onclick = () => {
    try {
      const csv = generateCSV();
      navigator.clipboard.writeText(csv).then(
        () => alert(`CSV copied to clipboard! (${profileDocuments.length} profiles)`),
        () => alert("Failed to copy CSV to clipboard.")
      );
    } catch (error) {
      alert("Error generating CSV: " + error.message);
    }
  };

  downloadCsvBtn.onclick = () => {
    try {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "profiles.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error generating CSV: " + error.message);
    }
  };

  sendToVettedBtn.onclick = async () => {
    if (profileDocuments.length === 0) {
      alert("No profiles to send.");
      return;
    }

    if (typeof ProfileProcessor === 'undefined') {
      alert("Profile processor not loaded.");
      return;
    }

    try {
      const processed = ProfileProcessor.processProfileDocuments(profileDocuments);
      
      // Merge edited fields and tags
      processed.forEach((profile, index) => {
        const doc = profileDocuments[index];
        if (doc._metadata) {
          if (doc._metadata.editedFields) {
            Object.assign(profile, doc._metadata.editedFields);
          }
          if (doc._metadata.tags) {
            profile["Core Roles"] = doc._metadata.tags.coreRoles.join("; ");
            profile["Domains"] = doc._metadata.tags.domains.join("; ");
          }
        }
      });

      if (processed.length === 0) {
        alert("No valid profiles to send.");
        return;
      }

      sendToVettedBtn.disabled = true;
      sendToVettedBtn.textContent = "Sending...";

      // Try to send to Vetted API first, fallback to Google Sheets if not configured
      const vettedSettings = await new Promise((resolve) => {
        chrome.storage.local.get(["vettedApiUrl", "vettedApiKey"], resolve);
      });

      if (vettedSettings.vettedApiUrl) {
        try {
          // Send all profiles in batch
          await sendToVetted(processed, vettedSettings.vettedApiUrl, vettedSettings.vettedApiKey);
          alert(`Successfully sent ${processed.length} profile(s) to Vetted!`);
          
          // Clear sent profiles from chrome.storage.local after successful send
          const sentUrls = new Set(processed.map(p => p["Linkedin URL"] || p.linkedinUrl).filter(Boolean));
          try {
            const allProfiles = await VettedStorage.getAllProfiles();
            const remainingProfiles = allProfiles.filter(profile => {
              const profileUrl = profile.extraction_metadata?.source_url || 
                                profile.personal_info?.profile_url ||
                                profile.comprehensive_data?.find(item => 
                                  item.category === 'metadata' && item.data?.source_url
                                )?.data?.source_url;
              return !sentUrls.has(profileUrl);
            });
            
            // Delete sent profiles from chrome.storage.local
            const profilesToDelete = allProfiles.filter(profile => {
              const profileUrl = profile.extraction_metadata?.source_url || 
                                profile.personal_info?.profile_url ||
                                profile.comprehensive_data?.find(item => 
                                  item.category === 'metadata' && item.data?.source_url
                                )?.data?.source_url;
              return sentUrls.has(profileUrl);
            });
            
            // Delete each sent profile
            for (let i = allProfiles.length - 1; i >= 0; i--) {
              if (sentUrls.has(allProfiles[i].extraction_metadata?.source_url || 
                               allProfiles[i].personal_info?.profile_url ||
                               allProfiles[i].comprehensive_data?.find(item => 
                                 item.category === 'metadata' && item.data?.source_url
                               )?.data?.source_url)) {
                await VettedStorage.deleteProfileByIndex(i);
              }
            }
            
            // Clear queue from chrome.storage
            await VettedStorage.SettingsStorage.set({ vettedQueue: [] });
            
            console.log(`Cleared ${allProfiles.length - remainingProfiles.length} sent profiles from chrome.storage.local`);
            loadData(); // Refresh the table
          } catch (error) {
            console.error("Error clearing sent profiles:", error);
            loadData(); // Still refresh the table
          }
        } catch (vettedError) {
          console.error("Vetted API error:", vettedError);
          console.error("Error details:", {
            message: vettedError.message,
            stack: vettedError.stack,
            name: vettedError.name,
            url: vettedSettings.vettedApiUrl
          });
          // Don't fallback to Google Sheets - just show the Vetted error
          const errorMessage = vettedError.message || vettedError.toString() || "Unknown error";
          throw new Error(`Vetted API: ${errorMessage}`);
        }
      } else {
        // No Vetted URL configured
        throw new Error("Vetted API URL not configured. Please configure it in Settings.");
      }
      
      sendToVettedBtn.disabled = false;
      sendToVettedBtn.textContent = "Send to Vetted";
    } catch (error) {
      console.error("Send to Vetted failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert("Error: " + (error.message || error.toString() || "Unknown error occurred"));
      sendToVettedBtn.disabled = false;
      sendToVettedBtn.textContent = "Send to Vetted";
    }
  };

  clearBtn.onclick = async () => {
    if (!confirm("Clear all logged profile documents? This will also clear the send queue.")) return;
    
    try {
      // Get storage info before clearing
      const storageBefore = await VettedStorage.getStorageSize();
      
      // Clear chrome.storage.local profiles
      await VettedStorage.clearAllProfiles();
      
      // Clear queue from chrome.storage
      await VettedStorage.SettingsStorage.set({ vettedQueue: [] });
      
      console.log("Storage cleared successfully", {
        before: `${storageBefore.mb}MB`,
        profilesCleared: storageBefore.count
      });
      
      // Reload data to refresh the UI
      loadData();
      
      // Show success message (non-blocking)
      console.log(`All profiles and queue cleared! Freed ${storageBefore.mb}MB of storage (${storageBefore.count} profiles).`);
      // Show a non-blocking notification instead of alert
      const notification = document.createElement("div");
      notification.style.cssText = "position: fixed; top: 10px; right: 10px; background: #4caf50; color: white; padding: 12px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);";
      notification.textContent = `Cleared ${storageBefore.count} profiles`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (error) {
      console.error("Error clearing storage:", error);
      // Show non-blocking error
      const errorNotif = document.createElement("div");
      errorNotif.style.cssText = "position: fixed; top: 10px; right: 10px; background: #e53935; color: white; padding: 12px; border-radius: 4px; z-index: 10000; box-shadow: 0 2px 8px rgba(0,0,0,0.2);";
      errorNotif.textContent = "Error clearing storage";
      document.body.appendChild(errorNotif);
      setTimeout(() => errorNotif.remove(), 3000);
    }
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // Listen for storage changes to auto-refresh when profiles are added
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.profileDocuments) {
      console.log("Profile storage changed, refreshing table...");
      // Debounce rapid changes
      clearTimeout(window.refreshTimeout);
      window.refreshTimeout = setTimeout(() => {
        loadData().catch(err => {
          console.error("Error refreshing data:", err);
        });
      }, 300);
    }
  });

  // Simple initialization - don't wait, just try to load
  // If VettedStorage isn't ready, show empty state
  setTimeout(() => {
    if (typeof VettedStorage !== 'undefined') {
      console.log("VettedStorage is available, loading data...");
      loadData().catch(err => {
        console.error("Error loading data:", err);
        renderTable([]);
      });
      loadSettings();
    } else {
      console.warn("VettedStorage not available, showing empty state");
      renderTable([]);
      loadSettings(); // Settings can still load from chrome.storage
    }
  }, 100); // Small delay to let scripts load
});
