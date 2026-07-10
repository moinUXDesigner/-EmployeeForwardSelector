/*
 * Local dev proxy for the EmployeeForwardSelector plain HTML example.
 *
 * The browser cannot be granted CORS access to poprdapp.hec.aptransco.gov.in
 * without that server opting in, and it should never hold the Basic Auth
 * credentials client-side. This server sits in between: it serves the
 * static example files on http://localhost:PORT (same-origin, so no CORS
 * is needed at all for the browser-to-proxy leg), and forwards employee
 * search requests to ZVBTS_EMP_DATA_MSTR_RFC with credentials attached
 * server-side.
 *
 * Run: copy .env.example to .env, fill in real credentials, then
 *   npm install
 *   npm start
 * Open http://localhost:3001/examples/plain-html.html
 *
 * ZVBTS_EMP_DATA_MSTR_RFC takes a POST body of { "IM_DATE": "YYYY-MM-DD" }
 * and returns the full employee master as of that date (it has no search
 * parameter of its own). This proxy sends today's date, fetches that full
 * list, then filters it in-memory by the plugin's searchText before
 * returning it to the browser.
 */
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

const EFS_API_BASE_URL = "https://poprdapp.hec.aptransco.gov.in:50001/RESTAdapter/ZVBTS_EMP_DATA_MSTR_RFC";
const EFS_API_USERNAME = process.env.EFS_API_USERNAME;
const EFS_API_PASSWORD = process.env.EFS_API_PASSWORD;

function getTodayDateString() {
  var now = new Date();
  var mm = String(now.getMonth() + 1).padStart(2, "0");
  var dd = String(now.getDate()).padStart(2, "0");
  return now.getFullYear() + "-" + mm + "-" + dd;
}

// ZVBTS_EMP_DATA_MSTR_RFC wraps its rows as { EX_ZVBTSDATA: { item: [...] } }.
// SAP's XML->JSON conversion collapses a single-row result to a plain object
// instead of a one-element array, so that case is normalized below.
function extractRecords(data) {
  var rawItems = data && data.EX_ZVBTSDATA && data.EX_ZVBTSDATA.item;
  if (Array.isArray(rawItems)) return rawItems;
  if (rawItems) return [rawItems];
  return [];
}

function mapEmployeeRecord(record) {
  return {
    employeeId: record.EMP_ID,
    employeeName: record.EMP_NAME,
    designation: record.JOB_KEY_TEXT,
    functionalHead: record.BUSINESS_AREA_TEXT || "",
    service: record.PSA_TEXT || "",
    positionId: record.POSITION_ID
  };
}

function matchesSearch(employee, searchText) {
  if (!searchText) return true;
  return (
    String(employee.employeeName || "").toLowerCase().indexOf(searchText) !== -1 ||
    String(employee.designation || "").toLowerCase().indexOf(searchText) !== -1 ||
    String(employee.employeeId || "").toLowerCase().indexOf(searchText) !== -1
  );
}

function matchesExact(employeeValue, filterValue) {
  if (!filterValue) return true;
  return String(employeeValue || "").toLowerCase() === filterValue.toLowerCase();
}

// The upstream RFC has no search parameter -- every request fetches the full
// employee master (1800+ rows). The typeahead suggestions call this endpoint
// on every keystroke, so the raw list is cached briefly to avoid hammering
// the SAP system with a full-table request per character typed.
var EMPLOYEE_CACHE_TTL_MS = 5 * 60 * 1000;
var employeeCache = { records: null, fetchedAt: 0 };

async function getEmployeeRecords() {
  var isFresh = employeeCache.records && Date.now() - employeeCache.fetchedAt < EMPLOYEE_CACHE_TTL_MS;
  if (isFresh) return employeeCache.records;

  var upstreamResponse = await fetch(EFS_API_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(EFS_API_USERNAME + ":" + EFS_API_PASSWORD).toString("base64"),
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ IM_DATE: getTodayDateString() })
  });

  if (!upstreamResponse.ok) {
    var err = new Error("ZVBTS_EMP_DATA_MSTR_RFC request failed: " + upstreamResponse.status);
    err.status = upstreamResponse.status;
    throw err;
  }

  var data = await upstreamResponse.json();
  employeeCache.records = extractRecords(data).map(mapEmployeeRecord);
  employeeCache.fetchedAt = Date.now();
  return employeeCache.records;
}

app.use(express.static(path.join(__dirname)));

app.get("/api/employees", async function (req, res) {
  if (!EFS_API_USERNAME || !EFS_API_PASSWORD) {
    res.status(500).json({
      error: "EFS_API_USERNAME/EFS_API_PASSWORD are not configured. Copy .env.example to .env and fill in real credentials."
    });
    return;
  }

  var searchText = (req.query.searchText || "").trim().toLowerCase();
  var functionalHead = (req.query.functionalHead || "").trim();
  var service = (req.query.service || "").trim();

  try {
    var employees = (await getEmployeeRecords()).filter(function (emp) {
      return (
        matchesSearch(emp, searchText) &&
        matchesExact(emp.functionalHead, functionalHead) &&
        matchesExact(emp.service, service)
      );
    });
    res.json(employees);
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message || "Failed to reach ZVBTS_EMP_DATA_MSTR_RFC" });
  }
});

app.get("/api/employees/filters", async function (req, res) {
  if (!EFS_API_USERNAME || !EFS_API_PASSWORD) {
    res.status(500).json({
      error: "EFS_API_USERNAME/EFS_API_PASSWORD are not configured. Copy .env.example to .env and fill in real credentials."
    });
    return;
  }

  try {
    var employees = await getEmployeeRecords();
    var functionalHeads = Array.from(new Set(employees.map(function (e) { return e.functionalHead; }).filter(Boolean))).sort();
    var services = Array.from(new Set(employees.map(function (e) { return e.service; }).filter(Boolean))).sort();
    res.json({ functionalHeads: functionalHeads, services: services });
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message || "Failed to reach ZVBTS_EMP_DATA_MSTR_RFC" });
  }
});

app.listen(PORT, function () {
  console.log("EmployeeForwardSelector dev proxy listening on http://localhost:" + PORT);
  console.log("Open http://localhost:" + PORT + "/examples/plain-html.html");
});
