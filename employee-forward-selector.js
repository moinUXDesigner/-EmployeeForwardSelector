/*
 * EmployeeForwardSelector
 * Reusable, framework-agnostic JS popup plugin for selecting an employee + action type
 * when forwarding a file/application/workflow item. See README.md for full spec.
 *
 * Usage: <script src="employee-forward-selector.js"></script>
 *        EmployeeForwardSelector.init({ container: "#root", onConfirm: fn, ... });
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.EmployeeForwardSelector = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TAB_KEYS = ["allEmployees", "predefinedList", "preferredList"];

  var TAB_LABELS = {
    allEmployees: "All Employees",
    preferredList: "Employee Choice",
    predefinedList: "Workflow"
  };

  var VALIDATION_MESSAGES = {
    employee: "Please select an employee.",
    actionType: "Please select an action type.",
    both: "Please select an employee and action type."
  };

  var DEFAULT_CONFIG = {
    container: null,
    title: "RBAC Panel",
    subtitle: "Choose an employee and assign the forwarding action",
    preferredEmployees: [],
    predefinedEmployees: [],
    searchEmployees: null,
    onConfirm: function () {},
    onCancel: function () {},
    defaultActiveTab: "allEmployees",
    actionTypes: ["RO", "RVO", "AA", "DSC"],
    allowOutsideClickClose: false,
    resetSelectionOnClose: true,
    closeOnEscape: true
  };

  var CSS_TEXT =
    ".efs-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}" +
    ".efs-overlay,.efs-overlay *{box-sizing:border-box}" +
    ".efs-modal{background:#fff;width:900px;max-width:100%;max-height:80vh;border-radius:6px;box-shadow:0 12px 32px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden;font-size:13px;color:#1f2937}" +
    ".efs-header{display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px 12px;border-bottom:1px solid #e5e7eb;flex-shrink:0}" +
    ".efs-title{margin:0;font-size:18px;font-weight:600;color:#111827}" +
    ".efs-subtitle{margin:4px 0 0;font-size:12px;color:#6b7280}" +
    ".efs-close-btn{background:transparent;border:none;cursor:pointer;font-size:18px;line-height:1;color:#6b7280;padding:4px;border-radius:4px}" +
    ".efs-close-btn:hover{color:#111827;background:#f3f4f6}" +
    ".efs-tablist{display:flex;gap:4px;padding:0 20px;border-bottom:1px solid #e5e7eb;flex-shrink:0}" +
    ".efs-tab{background:transparent;border:none;border-bottom:2px solid transparent;padding:10px 12px;font-size:13px;font-weight:500;color:#4b5563;cursor:pointer;margin-bottom:-1px}" +
    ".efs-tab:hover{color:#1d4ed8}" +
    ".efs-tab-active{color:#1d4ed8;border-bottom-color:#1d4ed8}" +
    ".efs-content{padding:16px 20px;overflow-y:auto;flex:1 1 auto}" +
    ".efs-tabpanel[hidden]{display:none}" +
    ".efs-search-bar{display:flex;gap:8px;margin-bottom:12px}" +
    ".efs-search-input{flex:1 1 auto;padding:8px 10px;border:1px solid #d1d5db;border-radius:4px;font-size:13px}" +
    ".efs-search-input:focus{outline:2px solid #2563eb;outline-offset:1px;border-color:#2563eb}" +
    ".efs-search-btn{padding:8px 16px;background:#fff;border:1px solid #2563eb;color:#2563eb;border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap}" +
    ".efs-search-btn:hover:not(:disabled){background:#eff6ff}" +
    ".efs-search-btn:disabled{opacity:.6;cursor:not-allowed}" +
    ".efs-table-wrap{border:1px solid #e5e7eb;border-radius:4px;overflow:auto;max-height:320px}" +
    ".efs-table{width:100%;border-collapse:collapse;font-size:13px}" +
    ".efs-table th{position:sticky;top:0;background:#f9fafb;text-align:left;padding:8px 10px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;white-space:nowrap}" +
    ".efs-table td{padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#1f2937}" +
    ".efs-table tbody tr:hover{background:#f9fafb}" +
    ".efs-col-action{text-align:center;width:70px}" +
    ".efs-radio-label{display:inline-flex;align-items:center;justify-content:center;cursor:pointer;margin:0}" +
    ".efs-radio-label input{width:15px;height:15px;cursor:pointer}" +
    ".efs-radio-label input:focus-visible{outline:2px solid #2563eb;outline-offset:2px}" +
    ".efs-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
    ".efs-status-message{padding:20px 10px;text-align:center;color:#6b7280;font-size:13px}" +
    ".efs-status-message.efs-status-error{color:#b91c1c}" +
    ".efs-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 20px;border-top:1px solid #e5e7eb;background:#f9fafb;flex-shrink:0;flex-wrap:wrap}" +
    ".efs-action-types{display:flex;align-items:center;gap:14px;border:none;padding:0;margin:0}" +
    ".efs-action-types legend{font-weight:600;color:#374151;padding:0;margin-right:6px}" +
    ".efs-action-type-item{display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-size:13px;color:#1f2937}" +
    ".efs-action-type-item input{width:15px;height:15px;cursor:pointer}" +
    ".efs-action-type-item input:focus-visible{outline:2px solid #2563eb;outline-offset:2px}" +
    ".efs-footer-actions{display:flex;align-items:center;gap:10px}" +
    ".efs-btn{padding:8px 18px;border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid transparent}" +
    ".efs-btn:focus-visible{outline:2px solid #2563eb;outline-offset:2px}" +
    ".efs-btn-secondary{background:transparent;color:#2563eb;border-color:transparent}" +
    ".efs-btn-secondary:hover{text-decoration:underline}" +
    ".efs-btn-primary{background:#2563eb;color:#fff;border-color:#2563eb}" +
    ".efs-btn-primary:hover{background:#1d4ed8}" +
    ".efs-validation{width:100%;order:3;color:#b91c1c;font-size:12px;margin-top:8px}" +
    ".efs-validation:empty{display:none}" +
    "@media (max-width:760px){.efs-modal{width:100%;max-height:90vh}.efs-tab{padding:10px 8px;font-size:12px}.efs-footer{flex-direction:column;align-items:stretch}.efs-action-types{flex-wrap:wrap;row-gap:8px}.efs-footer-actions{justify-content:flex-end}.efs-table-wrap{overflow-x:auto}.efs-table{min-width:480px}}";

  var FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var state = null;

  function freshState() {
    return {
      config: null,
      isInitialized: false,
      isOpen: false,
      activeTab: "allEmployees",
      allEmployeesLoaded: false,
      employees: {
        allEmployees: [],
        preferredList: [],
        predefinedList: []
      },
      searchState: "idle",
      searchQuery: "",
      searchToken: 0,
      selectedEmployee: null,
      selectedActionType: null,
      dom: {
        overlay: null,
        modal: null,
        titleEl: null,
        subtitleEl: null,
        tabButtons: {},
        panels: {},
        tbody: {},
        statusEl: {},
        searchInput: null,
        searchBtn: null,
        validationEl: null,
        actionTypeInputs: {}
      },
      focus: { previouslyFocused: null },
      listeners: { persistent: [], session: [] }
    };
  }

  function injectStyles() {
    if (document.getElementById("efs-styles")) return;
    var styleEl = document.createElement("style");
    styleEl.id = "efs-styles";
    styleEl.textContent = CSS_TEXT;
    document.head.appendChild(styleEl);
  }

  function resolveContainer(container) {
    if (!container) return null;
    if (typeof container === "string") return document.querySelector(container);
    if (container && container.nodeType === 1) return container;
    return null;
  }

  function sanitizeEmployeeArray(data, label) {
    if (!Array.isArray(data)) return [];
    var result = [];
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      if (item && item.employeeId != null && item.employeeName && item.designation) {
        result.push(item);
      } else {
        console.warn("EmployeeForwardSelector: skipping malformed employee entry in " + label, item);
      }
    }
    return result;
  }

  function addListener(target, type, handler, scope) {
    target.addEventListener(type, handler);
    state.listeners[scope].push({ target: target, type: type, handler: handler });
  }

  function removeListenersInScope(scope) {
    var list = state.listeners[scope];
    for (var i = 0; i < list.length; i++) {
      list[i].target.removeEventListener(list[i].type, list[i].handler);
    }
    state.listeners[scope] = [];
  }

  // ---- DOM building ----

  function buildDOM() {
    var overlay = document.createElement("div");
    overlay.className = "efs-overlay";

    var modal = document.createElement("div");
    modal.className = "efs-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    var titleId = "efs-title-" + Date.now();
    var subtitleId = "efs-subtitle-" + Date.now();
    modal.setAttribute("aria-labelledby", titleId);
    overlay.appendChild(modal);

    // header
    var header = document.createElement("div");
    header.className = "efs-header";
    var titleWrap = document.createElement("div");
    var titleEl = document.createElement("h2");
    titleEl.className = "efs-title";
    titleEl.id = titleId;
    var subtitleEl = document.createElement("p");
    subtitleEl.className = "efs-subtitle";
    subtitleEl.id = subtitleId;
    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(subtitleEl);
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "efs-close-btn";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "✕";
    header.appendChild(titleWrap);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // tablist
    var tablist = document.createElement("div");
    tablist.className = "efs-tablist";
    tablist.setAttribute("role", "tablist");
    var tabButtons = {};
    for (var t = 0; t < TAB_KEYS.length; t++) {
      var key = TAB_KEYS[t];
      var tabBtn = document.createElement("button");
      tabBtn.type = "button";
      tabBtn.className = "efs-tab";
      tabBtn.setAttribute("role", "tab");
      tabBtn.id = "efs-tab-" + key;
      tabBtn.setAttribute("aria-controls", "efs-panel-" + key);
      tabBtn.setAttribute("data-tab-key", key);
      tabBtn.textContent = TAB_LABELS[key];
      tablist.appendChild(tabBtn);
      tabButtons[key] = tabBtn;
    }
    modal.appendChild(tablist);

    // content area
    var content = document.createElement("div");
    content.className = "efs-content";

    var panels = {};
    var tbody = {};
    var statusEl = {};
    var searchInput = null;
    var searchBtn = null;

    for (var p = 0; p < TAB_KEYS.length; p++) {
      var pKey = TAB_KEYS[p];
      var panel = document.createElement("div");
      panel.className = "efs-tabpanel";
      panel.id = "efs-panel-" + pKey;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", "efs-tab-" + pKey);
      panel.hidden = true;

      if (pKey === "allEmployees") {
        var searchBar = document.createElement("div");
        searchBar.className = "efs-search-bar";
        searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "efs-search-input";
        searchInput.placeholder = "Search by employee name, designation, or employee ID";
        searchInput.setAttribute("aria-label", "Search by employee name, designation, or employee ID");
        searchBtn = document.createElement("button");
        searchBtn.type = "button";
        searchBtn.className = "efs-search-btn";
        searchBtn.textContent = "Search";
        searchBar.appendChild(searchInput);
        searchBar.appendChild(searchBtn);
        panel.appendChild(searchBar);
      }

      var status = document.createElement("div");
      status.className = "efs-status-message";
      status.setAttribute("aria-live", "polite");
      status.hidden = true;
      panel.appendChild(status);
      statusEl[pKey] = status;

      var tableWrap = document.createElement("div");
      tableWrap.className = "efs-table-wrap";
      var table = document.createElement("table");
      table.className = "efs-table";
      var thead = document.createElement("thead");
      var headRow = document.createElement("tr");
      ["Sl No.", "Employee Name", "Designation", "Action"].forEach(function (label) {
        var th = document.createElement("th");
        th.textContent = label;
        if (label === "Action") th.className = "efs-col-action";
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      var tb = document.createElement("tbody");
      table.appendChild(thead);
      table.appendChild(tb);
      tableWrap.appendChild(table);
      panel.appendChild(tableWrap);
      tbody[pKey] = tb;

      content.appendChild(panel);
      panels[pKey] = panel;
    }

    modal.appendChild(content);

    // footer
    var footer = document.createElement("div");
    footer.className = "efs-footer";

    var fieldset = document.createElement("fieldset");
    fieldset.className = "efs-action-types";
    var legend = document.createElement("legend");
    legend.textContent = "Action:";
    fieldset.appendChild(legend);
    var actionTypeInputs = {};

    var footerActions = document.createElement("div");
    footerActions.className = "efs-footer-actions";
    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "efs-btn efs-btn-secondary";
    cancelBtn.textContent = "Cancel";
    var okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "efs-btn efs-btn-primary";
    okBtn.textContent = "OK";
    footerActions.appendChild(cancelBtn);
    footerActions.appendChild(okBtn);

    var validationEl = document.createElement("div");
    validationEl.className = "efs-validation";
    validationEl.setAttribute("role", "alert");
    validationEl.setAttribute("aria-live", "assertive");

    footer.appendChild(fieldset);
    footer.appendChild(footerActions);
    footer.appendChild(validationEl);
    modal.appendChild(footer);

    state.dom.overlay = overlay;
    state.dom.modal = modal;
    state.dom.tablist = tablist;
    state.dom.titleEl = titleEl;
    state.dom.subtitleEl = subtitleEl;
    state.dom.closeBtn = closeBtn;
    state.dom.tabButtons = tabButtons;
    state.dom.panels = panels;
    state.dom.tbody = tbody;
    state.dom.statusEl = statusEl;
    state.dom.searchInput = searchInput;
    state.dom.searchBtn = searchBtn;
    state.dom.validationEl = validationEl;
    state.dom.actionTypesFieldset = fieldset;
    state.dom.actionTypeInputs = actionTypeInputs;
    state.dom.cancelBtn = cancelBtn;
    state.dom.okBtn = okBtn;

    buildActionTypeInputs();
    attachPersistentListeners();

    var container = resolveContainer(state.config.container);
    container.appendChild(overlay);
  }

  function buildActionTypeInputs() {
    var fieldset = state.dom.actionTypesFieldset;
    var actionTypes = state.config.actionTypes;
    state.dom.actionTypeInputs = {};
    for (var i = 0; i < actionTypes.length; i++) {
      var value = actionTypes[i];
      var label = document.createElement("label");
      label.className = "efs-action-type-item";
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "efs-action-type";
      input.value = value;
      var span = document.createElement("span");
      span.textContent = value;
      label.appendChild(input);
      label.appendChild(span);
      fieldset.appendChild(label);
      state.dom.actionTypeInputs[value] = input;
    }
  }

  // ---- Rendering ----

  function applyStaticText() {
    state.dom.titleEl.textContent = state.config.title;
    if (state.config.subtitle) {
      state.dom.subtitleEl.textContent = state.config.subtitle;
      state.dom.subtitleEl.hidden = false;
    } else {
      state.dom.subtitleEl.hidden = true;
    }
  }

  function renderTabs() {
    for (var i = 0; i < TAB_KEYS.length; i++) {
      var key = TAB_KEYS[i];
      var isActive = key === state.activeTab;
      var btn = state.dom.tabButtons[key];
      btn.classList.toggle("efs-tab-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      btn.tabIndex = isActive ? 0 : -1;
      state.dom.panels[key].hidden = !isActive;
    }
  }

  function renderTable(tabKey) {
    var tbody = state.dom.tbody[tabKey];
    tbody.innerHTML = "";
    var list = state.employees[tabKey];
    var status = state.dom.statusEl[tabKey];

    if (tabKey === "allEmployees" && state.searchState === "loading") {
      showStatus(status, "Searching employees...", false);
      return;
    }
    if (tabKey === "allEmployees" && state.searchState === "error") {
      showStatus(status, "Unable to fetch employees. Please try again.", true);
      return;
    }
    if (!list.length) {
      showStatus(status, "No employees found.", false);
      return;
    }

    status.hidden = true;

    for (var i = 0; i < list.length; i++) {
      tbody.appendChild(buildRow(list[i], i + 1, tabKey));
    }
  }

  function showStatus(statusEl, message, isError) {
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.classList.toggle("efs-status-error", !!isError);
  }

  function buildRow(employee, index, sourceTab) {
    var tr = document.createElement("tr");

    var slTd = document.createElement("td");
    slTd.textContent = String(index);
    tr.appendChild(slTd);

    var nameTd = document.createElement("td");
    nameTd.textContent = employee.employeeName;
    tr.appendChild(nameTd);

    var desigTd = document.createElement("td");
    desigTd.textContent = employee.designation;
    tr.appendChild(desigTd);

    var actionTd = document.createElement("td");
    actionTd.className = "efs-col-action";
    var label = document.createElement("label");
    label.className = "efs-radio-label";
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "efs-employee-radio";
    radio.value = String(employee.employeeId);
    radio.checked = !!(
      state.selectedEmployee && String(state.selectedEmployee.employeeId) === String(employee.employeeId)
    );
    radio.addEventListener("change", function (emp, srcTab) {
      return function () {
        handleEmployeeSelected(emp, srcTab);
      };
    }(employee, sourceTab));
    var srLabel = document.createElement("span");
    srLabel.className = "efs-sr-only";
    srLabel.textContent = "Select " + employee.employeeName + ", " + employee.designation;
    label.appendChild(radio);
    label.appendChild(srLabel);
    actionTd.appendChild(label);
    tr.appendChild(actionTd);

    return tr;
  }

  function renderActionTypes() {
    var inputs = state.dom.actionTypeInputs;
    for (var value in inputs) {
      if (Object.prototype.hasOwnProperty.call(inputs, value)) {
        inputs[value].checked = value === state.selectedActionType;
      }
    }
  }

  // ---- Behavior ----

  function handleEmployeeSelected(employee, sourceTab) {
    state.selectedEmployee = {
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      designation: employee.designation,
      sourceTab: sourceTab
    };
    clearValidation();
  }

  function handleActionTypeChange(value) {
    state.selectedActionType = value;
    clearValidation();
  }

  function clearValidation() {
    state.dom.validationEl.textContent = "";
  }

  function validate() {
    var hasEmployee = !!state.selectedEmployee;
    var hasActionType = !!state.selectedActionType;
    if (!hasEmployee && !hasActionType) return VALIDATION_MESSAGES.both;
    if (!hasEmployee) return VALIDATION_MESSAGES.employee;
    if (!hasActionType) return VALIDATION_MESSAGES.actionType;
    return null;
  }

  function switchTab(tabKey) {
    if (TAB_KEYS.indexOf(tabKey) === -1 || tabKey === state.activeTab) return;
    state.activeTab = tabKey;
    renderTabs();
    if (tabKey === "allEmployees" && !state.allEmployeesLoaded) {
      runSearch("");
    } else {
      renderTable(tabKey);
    }
    state.dom.tabButtons[tabKey].focus();
  }

  function runSearch(query) {
    if (typeof state.config.searchEmployees !== "function") {
      console.warn("EmployeeForwardSelector: config.searchEmployees is not provided.");
      return;
    }
    state.searchQuery = query;
    state.searchState = "loading";
    state.allEmployeesLoaded = true;
    state.dom.searchBtn.disabled = true;
    renderTable("allEmployees");

    var token = ++state.searchToken;
    Promise.resolve(state.config.searchEmployees(query))
      .then(function (results) {
        if (token !== state.searchToken) return;
        state.employees.allEmployees = sanitizeEmployeeArray(results, "searchEmployees result");
        state.searchState = state.employees.allEmployees.length ? "success" : "empty";
        state.dom.searchBtn.disabled = false;
        renderTable("allEmployees");
      })
      .catch(function () {
        if (token !== state.searchToken) return;
        state.searchState = "error";
        state.dom.searchBtn.disabled = false;
        renderTable("allEmployees");
      });
  }

  function handleOkClick() {
    var message = validate();
    if (message) {
      state.dom.validationEl.textContent = message;
      return;
    }
    var data = {
      selectedEmployee: {
        employeeId: state.selectedEmployee.employeeId,
        employeeName: state.selectedEmployee.employeeName,
        designation: state.selectedEmployee.designation,
        sourceTab: state.selectedEmployee.sourceTab
      },
      actionType: state.selectedActionType
    };
    var onConfirm = state.config.onConfirm;
    closeModal(state.config.resetSelectionOnClose);
    if (typeof onConfirm === "function") onConfirm(data);
  }

  function handleCancelClick() {
    var onCancel = state.config.onCancel;
    closeModal(state.config.resetSelectionOnClose);
    if (typeof onCancel === "function") onCancel();
  }

  // ---- Focus trap / keyboard ----

  function getFocusableElements() {
    var nodeList = state.dom.modal.querySelectorAll(FOCUSABLE_SELECTOR);
    var result = [];
    for (var i = 0; i < nodeList.length; i++) {
      var el = nodeList[i];
      if (el.offsetParent !== null || el === document.activeElement) result.push(el);
    }
    return result;
  }

  function focusTrapKeydownHandler(e) {
    if (e.key !== "Tab") return;
    var focusable = getFocusableElements();
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function escapeKeyHandler(e) {
    if (e.key === "Escape" && state.config.closeOnEscape) {
      handleCancelClick();
    }
  }

  function outsideClickHandler(e) {
    if (state.config.allowOutsideClickClose && e.target === state.dom.overlay) {
      handleCancelClick();
    }
  }

  function tablistKeydownHandler(e) {
    var currentIndex = TAB_KEYS.indexOf(state.activeTab);
    var nextIndex = null;
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % TAB_KEYS.length;
    else if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = TAB_KEYS.length - 1;
    if (nextIndex !== null) {
      e.preventDefault();
      switchTab(TAB_KEYS[nextIndex]);
    }
  }

  // ---- Listener wiring ----

  function attachPersistentListeners() {
    addListener(state.dom.closeBtn, "click", handleCancelClick, "persistent");
    addListener(state.dom.cancelBtn, "click", handleCancelClick, "persistent");
    addListener(state.dom.okBtn, "click", handleOkClick, "persistent");

    TAB_KEYS.forEach(function (key) {
      addListener(
        state.dom.tabButtons[key],
        "click",
        function () {
          switchTab(key);
        },
        "persistent"
      );
    });
    addListener(state.dom.tablist, "keydown", tablistKeydownHandler, "persistent");

    if (state.dom.searchBtn) {
      addListener(state.dom.searchBtn, "click", function () {
        runSearch(state.dom.searchInput.value.trim());
      }, "persistent");
      addListener(state.dom.searchInput, "keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          runSearch(state.dom.searchInput.value.trim());
        }
      }, "persistent");
    }

    Object.keys(state.dom.actionTypeInputs).forEach(function (value) {
      addListener(state.dom.actionTypeInputs[value], "change", function () {
        handleActionTypeChange(value);
      }, "persistent");
    });
  }

  function attachSessionListeners() {
    addListener(document, "keydown", escapeKeyHandler, "session");
    addListener(document, "keydown", focusTrapKeydownHandler, "session");
    addListener(state.dom.overlay, "mousedown", outsideClickHandler, "session");
  }

  // ---- Open / close ----

  function closeModal(shouldReset) {
    if (!state.isOpen) return;
    state.isOpen = false;
    state.dom.overlay.style.display = "none";
    removeListenersInScope("session");

    state.employees.allEmployees = [];
    state.searchState = "idle";
    state.allEmployeesLoaded = false;
    state.searchQuery = "";
    state.searchToken++;

    if (shouldReset) {
      state.selectedEmployee = null;
      state.selectedActionType = null;
      state.activeTab = state.config.defaultActiveTab;
      clearValidation();
    }

    if (state.focus.previouslyFocused && document.contains(state.focus.previouslyFocused)) {
      state.focus.previouslyFocused.focus();
    }
    state.focus.previouslyFocused = null;
  }

  // ---- Public API ----

  var EmployeeForwardSelector = {
    init: function (userConfig) {
      if (state && state.isInitialized) {
        console.warn("EmployeeForwardSelector: already initialized; re-initializing.");
        EmployeeForwardSelector.destroy();
      }
      state = freshState();

      var config = {};
      for (var k in DEFAULT_CONFIG) {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, k)) config[k] = DEFAULT_CONFIG[k];
      }
      for (var k2 in userConfig || {}) {
        if (Object.prototype.hasOwnProperty.call(userConfig, k2)) config[k2] = userConfig[k2];
      }
      state.config = config;

      var container = resolveContainer(config.container);
      if (!container) {
        console.error("EmployeeForwardSelector: init() requires a valid config.container.");
        state = null;
        return;
      }
      if (typeof config.onConfirm !== "function") {
        console.error("EmployeeForwardSelector: init() requires a config.onConfirm function.");
      }

      state.activeTab = TAB_KEYS.indexOf(config.defaultActiveTab) !== -1 ? config.defaultActiveTab : "allEmployees";
      state.employees.preferredList = sanitizeEmployeeArray(config.preferredEmployees, "preferredEmployees");
      state.employees.predefinedList = sanitizeEmployeeArray(config.predefinedEmployees, "predefinedEmployees");

      injectStyles();
      buildDOM();
      applyStaticText();
      state.dom.overlay.style.display = "none";
      renderTabs();
      renderTable("preferredList");
      renderTable("predefinedList");
      renderActionTypes();

      state.isInitialized = true;
    },

    open: function () {
      if (!state || !state.isInitialized) {
        console.error("EmployeeForwardSelector: call init() before open().");
        return;
      }
      if (state.isOpen) return;
      state.isOpen = true;
      state.focus.previouslyFocused = document.activeElement;
      state.dom.overlay.style.display = "flex";
      renderTabs();
      if (state.activeTab === "allEmployees" && !state.allEmployeesLoaded) {
        runSearch("");
      } else {
        renderTable(state.activeTab);
      }
      attachSessionListeners();
      state.dom.tabButtons[state.activeTab].focus();
    },

    close: function () {
      if (!state || !state.isInitialized) return;
      closeModal(state.config.resetSelectionOnClose);
    },

    destroy: function () {
      if (!state || !state.isInitialized) return;
      if (state.isOpen) closeModal(true);
      removeListenersInScope("persistent");
      removeListenersInScope("session");
      if (state.dom.overlay && state.dom.overlay.parentNode) {
        state.dom.overlay.parentNode.removeChild(state.dom.overlay);
      }
      state = null;
    },

    setPreferredEmployees: function (data) {
      if (!state || !state.isInitialized) return;
      state.employees.preferredList = sanitizeEmployeeArray(data, "preferredEmployees");
      if (
        state.selectedEmployee &&
        state.selectedEmployee.sourceTab === "preferredList" &&
        !state.employees.preferredList.some(function (e) {
          return String(e.employeeId) === String(state.selectedEmployee.employeeId);
        })
      ) {
        state.selectedEmployee = null;
      }
      renderTable("preferredList");
    },

    setPredefinedEmployees: function (data) {
      if (!state || !state.isInitialized) return;
      state.employees.predefinedList = sanitizeEmployeeArray(data, "predefinedEmployees");
      if (
        state.selectedEmployee &&
        state.selectedEmployee.sourceTab === "predefinedList" &&
        !state.employees.predefinedList.some(function (e) {
          return String(e.employeeId) === String(state.selectedEmployee.employeeId);
        })
      ) {
        state.selectedEmployee = null;
      }
      renderTable("predefinedList");
    }
  };

  return EmployeeForwardSelector;
});
