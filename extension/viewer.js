document.addEventListener("DOMContentLoaded", () => {
  // Check if profileProcessor loaded (must be after DOMContentLoaded since scripts load in order)
  if (typeof ProfileProcessor === 'undefined') {
    console.error("[DEBUG-VIEWER] ERROR: ProfileProcessor not loaded!");
    console.error("[DEBUG-VIEWER] Check that profileProcessor.js exists and is accessible");
    // Show error to user
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = "background: #ffebee; color: #c62828; padding: 12px; margin: 12px; border-radius: 4px; border: 1px solid #ef5350;";
    errorDiv.innerHTML = "⚠️ <strong>Error:</strong> ProfileProcessor not loaded. Please reload the extension.";
    document.body.insertBefore(errorDiv, document.body.firstChild);
  } else {
    console.log("[DEBUG-VIEWER] ProfileProcessor loaded successfully");
  }

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
  const testApiBtn = document.getElementById("test-api-btn");
  const sendToVettedBtn = document.getElementById("send-to-vetted-btn");
  const clearBtn = document.getElementById("clear-btn");
  const autoSendToggle = document.getElementById("auto-send-toggle");

  let currentEditingIndex = -1;
  let profileDocuments = [];

  // Load and initialize auto-send setting
  chrome.storage.local.get(["autoSendToVetted"], (data) => {
    // Enable auto-send by default if not set
    const autoSendEnabled = data.autoSendToVetted !== undefined ? data.autoSendToVetted : true;
    if (autoSendToggle) {
      autoSendToggle.checked = autoSendEnabled;
      // Save default if it wasn't set
      if (data.autoSendToVetted === undefined) {
        chrome.storage.local.set({ autoSendToVetted: true });
      }
    }
  });

  // Handle auto-send toggle
  if (autoSendToggle) {
    autoSendToggle.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      chrome.storage.local.set({ autoSendToVetted: enabled }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving auto-send setting:", chrome.runtime.lastError);
        } else {
          console.log("[DEBUG-VIEWER] Auto-send to Vetted", enabled ? "enabled" : "disabled");
        }
      });
    });
  }

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
    if (!tableContainer) {
      console.error("renderTable: tableContainer not found");
      return;
    }
    
    console.log(`renderTable: Rendering ${documents ? documents.length : 0} documents`);
    
    tableContainer.innerHTML = "";
    profileDocuments = documents || [];

    if (!documents || documents.length === 0) {
      console.log("renderTable: No documents, showing empty state");
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

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

    // For small numbers, render directly. For large numbers, use batches
    const batchSize = 20;
    const useBatching = documents.length > batchSize;
    
    function renderRow(i, doc) {
      if (!doc) {
        console.warn(`renderRow: Document at index ${i} is undefined`);
        return null;
      }
      
      const tr = document.createElement("tr");
      tr.dataset.index = i;

      // Skip ProfileProcessor for table rendering to speed things up
      // Just use basic fields
      let currentCompany = "";
      let currentTitle = "";
      let tags = [];

      if (doc.personal_info) {
        currentCompany = doc.personal_info.current_employer || "";
        currentTitle = doc.personal_info.headline || "";
      }

      // Get tags from document metadata
      if (doc._metadata && doc._metadata.tags) {
        tags = [...(doc._metadata.tags.coreRoles || []), ...(doc._metadata.tags.domains || [])];
      }

      // #
      const tdIndex = document.createElement("td");
      tdIndex.textContent = (i + 1).toString();
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
        tags.slice(0, 3).forEach(tag => {
          const badge = document.createElement("span");
          badge.className = "badge badge-tagged";
          badge.textContent = tag;
          tdTags.appendChild(badge);
        });
        if (tags.length > 3) {
          const more = document.createElement("span");
          more.textContent = ` +${tags.length - 3}`;
          more.style.color = "#666";
          tdTags.appendChild(more);
        }
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
        openEditModal(i);
      };
      tdActions.appendChild(editBtn);
      tr.appendChild(tdActions);

      tr.onclick = () => openEditModal(i);
      return tr;
    }
    
    if (useBatching) {
      // Process documents in batches to prevent UI freeze
      let index = 0;
      
      function processBatch() {
        const end = Math.min(index + batchSize, documents.length);
        
        console.log(`processBatch: Processing rows ${index} to ${end - 1} of ${documents.length}`);
        
        for (let i = index; i < end; i++) {
          const tr = renderRow(i, documents[i]);
          if (tr) tbody.appendChild(tr);
        }
        
        index = end;
        
        if (index < documents.length) {
          // Process next batch asynchronously
          setTimeout(processBatch, 0);
        } else {
          // All done, append table
          console.log(`processBatch: Finished processing all ${documents.length} documents, appending table`);
          table.appendChild(tbody);
          if (tableContainer) {
            tableContainer.appendChild(table);
            console.log("processBatch: Table appended successfully");
          } else {
            console.error("processBatch: tableContainer not found when trying to append table");
          }
        }
      }
      
      // Start processing
      processBatch();
    } else {
      // Small number, render directly
      console.log(`renderTable: Rendering ${documents.length} documents directly (no batching)`);
      documents.forEach((doc, i) => {
        const tr = renderRow(i, doc);
        if (tr) tbody.appendChild(tr);
      });
      
      table.appendChild(tbody);
      if (tableContainer) {
        tableContainer.appendChild(table);
        console.log("renderTable: Table appended successfully");
      } else {
        console.error("renderTable: tableContainer not found when trying to append table");
      }
    }
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

  function saveProfile() {
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

    // Update in storage
    chrome.storage.local.get(["profileDocuments"], (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error loading profiles for save:", chrome.runtime.lastError);
        setTimeout(() => {
          alert("Error loading profiles: " + chrome.runtime.lastError.message);
        }, 0);
        return;
      }
      
      const docs = Array.isArray(data.profileDocuments) ? data.profileDocuments : [];
      if (currentEditingIndex < 0 || currentEditingIndex >= docs.length) {
        console.error("Invalid editing index:", currentEditingIndex);
        setTimeout(() => {
          alert("Error: Invalid profile index");
        }, 0);
        return;
      }
      
      docs[currentEditingIndex] = doc;
      chrome.storage.local.set({ profileDocuments: docs }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving profile:", chrome.runtime.lastError);
          setTimeout(() => {
            alert("Error saving profile: " + chrome.runtime.lastError.message);
          }, 0);
          return;
        }
        
        modal.style.display = "none";
        // Don't call loadData() here - let the storage.onChanged listener handle it
        // This prevents duplicate calls and potential loops
        console.log("Profile saved successfully");
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  let isLoadingData = false; // Prevent concurrent loads
  
  function loadData() {
    // Prevent concurrent loads that could cause issues
    if (isLoadingData) {
      console.log("loadData already in progress, skipping...");
      return;
    }
    
    isLoadingData = true;
    
    // Show loading state
    if (tableContainer) {
      tableContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Loading profiles...</div>';
    }
    if (emptyState) {
      emptyState.style.display = "none";
    }

    // Use setTimeout to make it non-blocking
    setTimeout(() => {
      chrome.storage.local.get(["profileDocuments", "vettedQueue"], (data) => {
        isLoadingData = false; // Reset flag
        
        if (chrome.runtime.lastError) {
          console.error("Error loading:", chrome.runtime.lastError);
          if (tableContainer) {
            tableContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #e53935;">Error loading profiles</div>';
          }
          return;
        }

        const documents = Array.isArray(data.profileDocuments) ? data.profileDocuments : [];
        const queueCount = Array.isArray(data.vettedQueue) ? data.vettedQueue.length : 0;
        
        console.log(`Loaded ${documents.length} saved profiles, ${queueCount} queued for Vetted`);
        
        // Update the global profileDocuments variable
        profileDocuments = documents;
        
        // Render table immediately
        if (documents.length > 0) {
          console.log("Calling renderTable with", documents.length, "documents");
          renderTable(documents);
        } else {
          console.log("No documents to render, showing empty state");
          renderTable([]);
        }
        
        // Show queue status if there are queued profiles (non-blocking)
        setTimeout(() => {
          if (queueCount > 0) {
            const queueStatus = document.createElement("div");
            queueStatus.id = "queue-status";
            queueStatus.style.cssText = "background: #e3f2fd; padding: 8px; margin-bottom: 12px; border-radius: 4px; font-size: 12px;";
            queueStatus.innerHTML = `📤 ${queueCount} profile(s) queued for auto-send to Vetted.`;
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
        }, 0);
        
        // Check storage usage (non-blocking, don't wait for it)
        chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
          if (bytesInUse !== undefined) {
            const mbUsed = (bytesInUse / (1024 * 1024)).toFixed(2);
            const mbLimit = 10;
            const percentage = ((bytesInUse / (1024 * 1024 * mbLimit)) * 100).toFixed(1);
            
            console.log(`Storage usage: ${mbUsed}MB / ${mbLimit}MB (${percentage}%)`);
            
            if (percentage > 80) {
              const storageWarning = document.createElement("div");
              storageWarning.style.cssText = "background: #fff3cd; padding: 8px; margin-bottom: 12px; border-radius: 4px; font-size: 12px; color: #856404;";
              storageWarning.innerHTML = `⚠️ Storage is ${percentage}% full.`;
              storageWarning.id = "storage-warning";
              const controls = document.getElementById("controls");
              const existing = document.getElementById("storage-warning");
              if (existing) existing.remove();
              if (controls) controls.insertBefore(storageWarning, controls.firstChild);
            }
          }
        });
      });
    }, 0);
  }

  // Settings functions removed - API URL is now hardcoded

  // Direct send function (fallback when background script doesn't respond)
  async function sendDirectlyToVetted(processedProfiles, apiKey) {
    const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
    console.log("[DEBUG-DIRECT] Sending directly to API, bypassing background script");
    console.log("[DEBUG-DIRECT] Profile count:", processedProfiles.length);
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    
    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    
    try {
      const response = await fetch(VETTED_API_URL, {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: JSON.stringify(processedProfiles),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) errorMessage += ` - ${errorText.substring(0, 200)}`;
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
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return { success: false, error: `Request timed out after ${timeoutMs/1000} seconds` };
      }
      return { success: false, error: error.message || "Unknown error" };
    }
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

    // Add timeout to prevent hanging
    const timeoutMs = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let response;
    try {
      console.log("Starting fetch request...");
      response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        credentials: "include", // Include cookies for session-based auth
        body: JSON.stringify(profiles),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log("Fetch completed, status:", response.status);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error:", fetchError);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs/1000} seconds. Check your API URL and network connection.`);
      }
      throw new Error(`Network error: ${fetchError.message}. Check your API URL and CORS settings.`);
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

  // Test API connection directly
  if (testApiBtn) {
    testApiBtn.onclick = async () => {
      try {
        testApiBtn.disabled = true;
        testApiBtn.textContent = "Testing...";
        
        const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
        console.log("[TEST] Testing API connection to:", VETTED_API_URL);
        
        // Get API key
        const vettedSettings = await new Promise((resolve) => {
          chrome.storage.local.get(["vettedApiKey"], (data) => {
            resolve(data);
          });
        });
        
        const headers = {
          "Content-Type": "application/json",
        };
        
        if (vettedSettings.vettedApiKey) {
          headers["Authorization"] = `Bearer ${vettedSettings.vettedApiKey}`;
          console.log("[TEST] Using API key authentication");
        } else {
          console.log("[TEST] Using session-based authentication (cookies)");
        }
        
        // Send a minimal test payload
        const testPayload = [{
          "Linkedin URL": "https://linkedin.com/in/test",
          "Full Name": "Test User",
          "Current Company": "Test Company"
        }];
        
        console.log("[TEST] Sending test request...");
        const startTime = Date.now();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 10000); // 10 second timeout for test
        
        try {
          const response = await fetch(VETTED_API_URL, {
            method: "POST",
            headers: headers,
            credentials: "include",
            body: JSON.stringify(testPayload),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const elapsed = Date.now() - startTime;
          
          console.log("[TEST] Response received in", elapsed, "ms");
          console.log("[TEST] Status:", response.status, response.statusText);
          console.log("[TEST] OK:", response.ok);
          
          if (response.ok) {
            const result = await response.json();
            console.log("[TEST] Success! Response:", result);
            alert(`✅ API Test Successful!\n\nStatus: ${response.status}\nTime: ${elapsed}ms\n\nResponse: ${JSON.stringify(result, null, 2).substring(0, 200)}`);
          } else {
            const errorText = await response.text();
            console.error("[TEST] Error response:", errorText);
            alert(`❌ API Test Failed!\n\nStatus: ${response.status} ${response.statusText}\n\nError: ${errorText.substring(0, 200)}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          const elapsed = Date.now() - startTime;
          console.error("[TEST] Fetch error after", elapsed, "ms:", fetchError);
          
          if (fetchError.name === 'AbortError') {
            alert(`❌ API Test Timed Out!\n\nRequest took longer than 10 seconds.\n\nThis suggests:\n- Network connectivity issues\n- API server is slow/down\n- CORS blocking the request\n\nCheck the console for details.`);
          } else {
            alert(`❌ API Test Failed!\n\nError: ${fetchError.message}\n\nTime: ${elapsed}ms\n\nCheck the console for details.`);
          }
        }
        
        testApiBtn.disabled = false;
        testApiBtn.textContent = "Test API";
      } catch (error) {
        console.error("[TEST] Test error:", error);
        alert("Test error: " + error.message);
        testApiBtn.disabled = false;
        testApiBtn.textContent = "Test API";
      }
    };
  }

  if (!sendToVettedBtn) {
    console.error("sendToVettedBtn element not found!");
  } else {
    sendToVettedBtn.onclick = async () => {
      const startTime = Date.now();
      console.log("[DEBUG] ========== Send to Vetted clicked ==========");
      console.log("[DEBUG] Initial profileDocuments length:", profileDocuments.length);
      console.log("[DEBUG] Chrome runtime available:", !!chrome.runtime);
      console.log("[DEBUG] Chrome runtime ID:", chrome.runtime?.id);
      
      try {
        // Reload data first to ensure we have the latest profiles
        console.log("[DEBUG] Step 1: Reloading profiles from storage...");
        await new Promise((resolve, reject) => {
          chrome.storage.local.get(["profileDocuments"], (data) => {
            if (chrome.runtime.lastError) {
              console.error("[DEBUG] Error loading profiles:", chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
            }
            const documents = Array.isArray(data.profileDocuments) ? data.profileDocuments : [];
            profileDocuments = documents;
            console.log("[DEBUG] Step 1 complete: Reloaded", documents.length, "profiles from storage");
            resolve(undefined);
          });
        });

        if (profileDocuments.length === 0) {
          console.log("[DEBUG] No profiles to send, aborting");
          setTimeout(() => {
            alert("No profiles to send. Please save a profile first using 'Save Profile JSON'.");
          }, 0);
          return;
        }

        console.log("[DEBUG] Step 2: Checking ProfileProcessor...");
        if (typeof ProfileProcessor === 'undefined') {
          console.error("[DEBUG] ProfileProcessor is undefined!");
          setTimeout(() => {
            alert("Profile processor not loaded. Please refresh the extension popup.");
          }, 0);
          return;
        }
        console.log("[DEBUG] Step 2 complete: ProfileProcessor available");

        // Disable button immediately to prevent multiple clicks
        sendToVettedBtn.disabled = true;
        sendToVettedBtn.textContent = "Processing...";

        // Hardcoded Vetted API URL
        const VETTED_API_URL = "https://vetted-production.up.railway.app/api/candidates/upload";
        console.log("[DEBUG] Step 3: Vetted API URL:", VETTED_API_URL);
        
        // Get API key if configured
        console.log("[DEBUG] Step 4: Loading API key from storage...");
        const vettedSettings = await new Promise((resolve, reject) => {
          chrome.storage.local.get(["vettedApiKey"], (data) => {
            if (chrome.runtime.lastError) {
              console.error("[DEBUG] Error loading API key:", chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
              return;
            }
            console.log("[DEBUG] Step 4 complete: API key loaded, has key:", !!data.vettedApiKey);
            resolve(data);
          });
        });

        // Process profiles asynchronously to prevent UI freeze
        // Use requestIdleCallback or setTimeout to yield to UI thread
        let processed;
        try {
          console.log("[DEBUG] Step 5: Processing", profileDocuments.length, "profiles...");
          const processStartTime = Date.now();
          
          // Process in async context to allow UI updates
          processed = await new Promise((resolve, reject) => {
            // Use requestIdleCallback if available, otherwise setTimeout
            const processFn = () => {
              try {
                console.log("[DEBUG] Step 5: Calling ProfileProcessor.processProfileDocuments...");
                const result = ProfileProcessor.processProfileDocuments(profileDocuments);
                const processTime = Date.now() - processStartTime;
                console.log("[DEBUG] Step 5 complete: Processed", result.length, "profiles in", processTime, "ms");
                console.log("[DEBUG] Step 5: First processed profile sample:", result[0] ? Object.keys(result[0]).slice(0, 5) : "none");
                resolve(result);
              } catch (error) {
                console.error("[DEBUG] Step 5 ERROR: Processing error:", error);
                console.error("[DEBUG] Error stack:", error.stack);
                reject(error);
              }
            };
            
            if (window.requestIdleCallback) {
              requestIdleCallback(processFn, { timeout: 100 });
            } else {
              setTimeout(processFn, 10);
            }
          });
          
          if (!processed || processed.length === 0) {
            console.error("[DEBUG] Step 5 ERROR: No valid processed profiles");
            sendToVettedBtn.disabled = false;
            sendToVettedBtn.textContent = "Send to Vetted";
            setTimeout(() => {
              alert("No valid profiles to send. Profiles may be invalid or corrupted.");
            }, 0);
            return;
          }
          
          console.log("[DEBUG] Step 6: Merging edited fields and tags...");
          // Merge edited fields and tags
          processed.forEach((profile, index) => {
            const doc = profileDocuments[index];
            if (doc && doc._metadata) {
              if (doc._metadata.editedFields) {
                Object.assign(profile, doc._metadata.editedFields);
              }
              if (doc._metadata.tags) {
                profile["Core Roles"] = doc._metadata.tags.coreRoles?.join("; ") || "";
                profile["Domains"] = doc._metadata.tags.domains?.join("; ") || "";
              }
            }
          });
          console.log("[DEBUG] Step 6 complete: Merged metadata into processed profiles");
        } catch (processingError) {
          sendToVettedBtn.disabled = false;
          sendToVettedBtn.textContent = "Send to Vetted";
          console.error("[DEBUG] Processing ERROR:", processingError);
          console.error("[DEBUG] Error details:", {
            message: processingError.message,
            stack: processingError.stack,
            name: processingError.name
          });
          setTimeout(() => {
            alert("Error processing profiles: " + (processingError.message || "Unknown error"));
          }, 0);
          return;
        }

        // Update button text
        sendToVettedBtn.textContent = "Sending...";
        const sendStartTime = Date.now();

        try {
          console.log("[DEBUG] Step 7: Sending", processed.length, "profiles directly to Vetted API...");
          console.log("[DEBUG] Step 7: Payload size:", JSON.stringify(processed).length, "bytes");
          console.log("[DEBUG] Step 7: Has API key:", !!vettedSettings.vettedApiKey);
          
          // Send directly from viewer (bypassing background script for reliability)
          // Since API test works, this should be more reliable
          const statusInterval = setInterval(() => {
            const elapsed = Date.now() - sendStartTime;
            const seconds = (elapsed / 1000).toFixed(1);
            console.log("[DEBUG] Step 7: Still sending...", seconds, "seconds elapsed");
            sendToVettedBtn.textContent = `Sending... (${seconds}s)`;
          }, 1000);
          
          sendDirectlyToVetted(processed, vettedSettings.vettedApiKey)
            .then((result) => {
              clearInterval(statusInterval);
              const elapsed = Date.now() - sendStartTime;
              const totalTime = Date.now() - startTime;
              
              sendToVettedBtn.disabled = false;
              sendToVettedBtn.textContent = "Send to Vetted";
              
              if (result.success) {
                console.log("[DEBUG] ========== SUCCESS ==========");
                console.log("[DEBUG] Successfully sent profiles:", result);
                console.log("[DEBUG] Send time:", elapsed, "ms");
                console.log("[DEBUG] Total time:", totalTime, "ms");
                console.log("[DEBUG] =============================");
                
                // Clear profiles from storage after successful send
                chrome.storage.local.set({ profileDocuments: [] }, () => {
                  if (chrome.runtime.lastError) {
                    console.error("[DEBUG] Error clearing profiles:", chrome.runtime.lastError);
                  } else {
                    console.log("[DEBUG] Profiles cleared after successful send");
                  }
                });
                
                setTimeout(() => {
                  alert(`✅ Successfully sent ${result.sent || processed.length} profile(s) to Vetted!`);
                }, 0);
              } else {
                console.error("[DEBUG] Step 7 ERROR: Send failed:", result.error);
                setTimeout(() => {
                  alert("❌ Error sending to Vetted: " + (result.error || "Unknown error"));
                }, 0);
              }
            })
            .catch((error) => {
              clearInterval(statusInterval);
              const elapsed = Date.now() - sendStartTime;
              console.error("[DEBUG] Step 7 EXCEPTION: Send error after", elapsed, "ms:", error);
              console.error("[DEBUG] Exception details:", {
                message: error.message,
                stack: error.stack,
                name: error.name
              });
              sendToVettedBtn.disabled = false;
              sendToVettedBtn.textContent = "Send to Vetted";
              setTimeout(() => {
                alert("❌ Error sending to Vetted: " + (error.message || error.toString() || "Unknown error occurred") + "\n\nCheck the console (F12) for detailed logs.");
              }, 0);
            });
          
        } catch (sendError) {
          const elapsed = Date.now() - sendStartTime;
          console.error("[DEBUG] Step 7 EXCEPTION: Send error after", elapsed, "ms:", sendError);
          console.error("[DEBUG] Exception details:", {
            message: sendError.message,
            stack: sendError.stack,
            name: sendError.name
          });
          sendToVettedBtn.disabled = false;
          sendToVettedBtn.textContent = "Send to Vetted";
          setTimeout(() => {
            alert("Error sending to Vetted: " + (sendError.message || sendError.toString() || "Unknown error occurred") + "\n\nCheck the console (F12) for detailed logs.");
          }, 0);
        }
      } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error("[DEBUG] ========== FATAL ERROR ==========");
        console.error("[DEBUG] Send to Vetted failed after", totalTime, "ms");
        console.error("[DEBUG] Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        console.error("[DEBUG] ==================================");
        // Use setTimeout to prevent blocking
        setTimeout(() => {
          alert("Error: " + (error.message || error.toString() || "Unknown error occurred") + "\n\nCheck the console (F12) for detailed logs.");
        }, 0);
        // Ensure button is re-enabled even if error occurs
        sendToVettedBtn.disabled = false;
        sendToVettedBtn.textContent = "Send to Vetted";
      }
    };
  }

  clearBtn.onclick = () => {
    // Use non-blocking confirmation
    const confirmed = window.confirm("Clear all logged profile documents?");
    if (!confirmed) return;
    
    clearBtn.disabled = true;
    clearBtn.textContent = "Clearing...";
    
    chrome.storage.local.set({ profileDocuments: [] }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error clearing profiles:", chrome.runtime.lastError);
        setTimeout(() => {
          alert("Error clearing profiles: " + chrome.runtime.lastError.message);
        }, 0);
        clearBtn.disabled = false;
        clearBtn.textContent = "Clear All";
        return;
      }
      
      // Don't call loadData() here - let the storage.onChanged listener handle it
      console.log("Profiles cleared successfully");
      clearBtn.disabled = false;
      clearBtn.textContent = "Clear All";
    });
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // Delay initialization slightly to ensure DOM is ready
  setTimeout(() => {
    loadData();
    
    // Check if there are queued profiles that need to be sent
    chrome.storage.local.get(["vettedQueue", "autoSendToVetted"], (data) => {
      const queue = Array.isArray(data.vettedQueue) ? data.vettedQueue : [];
      const autoSendEnabled = data.autoSendToVetted !== undefined ? data.autoSendToVetted : true;
      
      console.log("[DEBUG-VIEWER] On load - Queue length:", queue.length);
      console.log("[DEBUG-VIEWER] On load - Auto-send enabled:", autoSendEnabled);
      
      // If there are queued profiles and auto-send is enabled, trigger send immediately
      if (queue.length > 0 && autoSendEnabled) {
        console.log("[DEBUG-VIEWER] Found queued profiles, triggering batch send immediately...");
        chrome.runtime.sendMessage({
          type: "SEND_BATCH_TO_VETTED"
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("[DEBUG-VIEWER] Error triggering batch send:", chrome.runtime.lastError);
            console.error("[DEBUG-VIEWER] Error details:", chrome.runtime.lastError.message);
          } else {
            console.log("[DEBUG-VIEWER] Batch send triggered, response:", response);
            if (response && response.success) {
              console.log("[DEBUG-VIEWER] Successfully sent", response.sent, "profiles");
            } else if (response && response.error) {
              console.error("[DEBUG-VIEWER] Batch send failed:", response.error);
            }
          }
        });
      } else if (queue.length > 0) {
        console.log("[DEBUG-VIEWER] Queue has profiles but auto-send is disabled");
      } else {
        console.log("[DEBUG-VIEWER] No queued profiles");
      }
    });
  }, 50);

  // Listen for storage changes to auto-refresh when profiles are saved
  // Add debounce to prevent infinite loops
  let loadDataTimeout = null;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.profileDocuments) {
      console.log('Storage changed: profileDocuments updated, scheduling reload...');
      // Debounce: clear any pending reload and schedule a new one
      if (loadDataTimeout) {
        clearTimeout(loadDataTimeout);
      }
      loadDataTimeout = setTimeout(() => {
        loadData();
        loadDataTimeout = null;
      }, 100); // Small delay to prevent rapid-fire reloads
    }
  });
});
