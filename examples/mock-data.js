/*
 * Sample mock employee data for EmployeeForwardSelector examples/testing.
 * In a real app, replace mockSearchEmployees with a call to your own backend API.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EFSMockData = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var mockAllEmployees = [
    { employeeId: "EMP001", employeeName: "Sri. V. Ramanjaneyulu", designation: "Superintending Engineer (O&M)" },
    { employeeId: "EMP002", employeeName: "Smt. M. Anuradha", designation: "Deputy Chief Engineer (Projects)" },
    { employeeId: "EMP003", employeeName: "Sri. B. Srinivas Rao", designation: "Executive Engineer (EHV)" },
    { employeeId: "EMP004", employeeName: "Sri. K. Prabhakar", designation: "Assistant Executive Engineer (Civil)" },
    { employeeId: "EMP005", employeeName: "Smt. Ch. Lakshmi", designation: "Deputy Executive Engineer (Elect.)" },
    { employeeId: "EMP006", employeeName: "Sri. P. Ashok Kumar", designation: "Accounts Officer" },
    { employeeId: "EMP007", employeeName: "Sri. G. Suresh Babu", designation: "Assistant Accounts Officer" }
  ];

  var mockPreferredEmployees = [
    { employeeId: "EMP101", employeeName: "Employee One", designation: "Assistant Engineer" },
    { employeeId: "EMP102", employeeName: "Employee Three", designation: "Junior Engineer" }
  ];

  var mockPredefinedEmployees = [
    { employeeId: "EMP201", employeeName: "Employee Two", designation: "Divisional Engineer" },
    { employeeId: "EMP202", employeeName: "Employee Four", designation: "Chief Engineer" }
  ];

  function mockSearchEmployees(searchText) {
    var text = (searchText || "").trim().toLowerCase();
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (!text) {
          resolve(mockAllEmployees);
          return;
        }
        resolve(
          mockAllEmployees.filter(function (emp) {
            return (
              emp.employeeName.toLowerCase().indexOf(text) !== -1 ||
              emp.designation.toLowerCase().indexOf(text) !== -1 ||
              emp.employeeId.toLowerCase().indexOf(text) !== -1
            );
          })
        );
      }, 400);
    });
  }

  return {
    mockAllEmployees: mockAllEmployees,
    mockPreferredEmployees: mockPreferredEmployees,
    mockPredefinedEmployees: mockPredefinedEmployees,
    mockSearchEmployees: mockSearchEmployees
  };
});
