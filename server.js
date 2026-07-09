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
    designation: record.JOB_KEY_TEXT
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

app.use(express.static(path.join(__dirname)));

app.get("/api/employees", async function (req, res) {
  if (!EFS_API_USERNAME || !EFS_API_PASSWORD) {
    res.status(500).json({
      error: "EFS_API_USERNAME/EFS_API_PASSWORD are not configured. Copy .env.example to .env and fill in real credentials."
    });
    return;
  }

  var searchText = (req.query.searchText || "").trim().toLowerCase();

  try {
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
      res.status(upstreamResponse.status).json({
        error: "ZVBTS_EMP_DATA_MSTR_RFC request failed: " + upstreamResponse.status
      });
      return;
    }

    var data = await upstreamResponse.json();
    var employees = extractRecords(data).map(mapEmployeeRecord).filter(function (emp) {
      return matchesSearch(emp, searchText);
    });
    res.json(employees);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach ZVBTS_EMP_DATA_MSTR_RFC: " + err.message });
  }
});

app.listen(PORT, function () {
  console.log("EmployeeForwardSelector dev proxy listening on http://localhost:" + PORT);
  console.log("Open http://localhost:" + PORT + "/examples/plain-html.html");
});
