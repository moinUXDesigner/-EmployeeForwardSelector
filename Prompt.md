# Employee Selection Popup Plugin

## Objective

Create a reusable JavaScript plugin that can be integrated into any application, irrespective of the backend or frontend technology such as React JS, Angular, Vue, plain HTML/JavaScript, Python, Java, PHP, Node.js, Laravel, Django, Spring Boot, etc.

The plugin should work as a standalone popup/modal window. Its purpose is to allow a logged-in officer/user to select an employee and assign an action type before forwarding a file, application, approval flow, or workflow item.

The plugin should only handle the UI selection process. Further backend processing will be handled by the application developer using the selected output data returned by the plugin.

---

## Plugin Name

`EmployeeForwardSelector`

---

## Main Use Case

An officer logs into an application and wants to send or forward a file/application/workflow to a particular employee.

The officer should be able to:

1. Search and select an employee from all employees.
2. Select an employee from a preferred list.
3. Select an employee from a predefined list.
4. Select the role/action type: `RO`, `RVO`, `AA`, or `DSC`.
5. Click `OK` to return the selected employee and selected action type to the parent application.
6. Click `Cancel` to close the popup without selection.

---

## Popup Structure

The plugin should open as a centered modal popup.

The popup should contain only the following:

1. Header/title
2. Navigation tabs
3. Tab content area
4. Common footer with action type radio buttons and CTA buttons

No sidebar, no top navigation, and no unrelated layout elements should be included inside the plugin.

---

## Popup Title

Title suggestion:

`Select Employee`

Optional subtitle:

`Choose an employee and assign the forwarding action`

---

## Navigation Tabs

The popup should have three tabs:

1. `All Employees`
2. `Preferred List`
3. `Predefined List`

Only one tab should be active at a time.

---

## Tab 1: All Employees

### Purpose

This tab allows the user to search for any employee from the complete employee database.

### Components

1. Search input field
2. Search button
3. Employee results table

### Search Bar

Placeholder text:

`Search by employee name, designation, or employee ID`

Search button label:

`Search`

### Table Columns

| Column        | Description                         |
| ------------- | ----------------------------------- |
| Sl No.        | Serial number                       |
| Employee Name | Name of the employee                |
| Designation   | Employee designation                |
| Action        | Radio button for selecting employee |

### Behavior

* User enters search text and clicks `Search`.
* Matching employee records should be displayed in the table.
* Each row should have one radio button.
* Only one employee can be selected at a time.
* Selecting a radio button should store the selected employee details.

---

## Tab 2: Preferred List

### Purpose

This tab displays the logged-in user’s preferred employees.

### Table Columns

| Column        | Description                         |
| ------------- | ----------------------------------- |
| Sl No.        | Serial number                       |
| Employee Name | Name of the employee                |
| Designation   | Employee designation                |
| Action        | Radio button for selecting employee |

### Behavior

* Preferred employees should be passed to the plugin through configuration.
* Each row should have one radio button.
* Only one employee can be selected at a time.
* Selection should work the same way as Tab 1.

---

## Tab 3: Predefined List

### Purpose

This tab displays a predefined list of employees configured by the department/system/admin.

### Table Columns

| Column        | Description                         |
| ------------- | ----------------------------------- |
| Sl No.        | Serial number                       |
| Employee Name | Name of the employee                |
| Designation   | Employee designation                |
| Action        | Radio button for selecting employee |

### Behavior

* Predefined employees should be passed to the plugin through configuration.
* Each row should have one radio button.
* Only one employee can be selected at a time.
* Selection should work the same way as Tab 1.

---

## Common Footer

The footer should be visible for all three tabs.

### Footer Components

1. Action type radio buttons:

   * `RO`
   * `RVO`
   * `AA`
   * `DSC`

2. CTA buttons:

   * `Cancel`
   * `OK`

### Footer Layout

The footer should be visually distinct from the table area.

Suggested layout:

Left side:

`Action Type:  ○ RO   ○ RVO   ○ AA   ○ DSC`

Right side:

`Cancel` button and `OK` button

---

## Selection Rules

1. User must select one employee.
2. User must select one action type: `RO`, `RVO`, `AA`, or `DSC`.
3. If user clicks `OK` without selecting employee or action type, show validation message.
4. Only one employee can be selected across all tabs.
5. When a user selects an employee in one tab and then moves to another tab, the previous selection should either:

   * remain selected if data is still available, or
   * be cleared based on plugin configuration.
6. Default behavior should be to allow only one final selected employee.

---

## Validation Messages

If employee is not selected:

`Please select an employee.`

If action type is not selected:

`Please select an action type.`

If both are missing:

`Please select an employee and action type.`

---

## Output Data on OK

When the user clicks `OK`, the plugin should return the selected data to the parent application using a callback function.

Example output:

```json
{
  "selectedEmployee": {
    "employeeId": "EMP001",
    "employeeName": "Shaik Khaja Mynuddin",
    "designation": "Junior Accounts Officer",
    "sourceTab": "allEmployees"
  },
  "actionType": "RO"
}
```

---

## Cancel Behavior

When the user clicks `Cancel`:

* Close the popup.
* Do not return selected employee data.
* Trigger an optional `onCancel` callback.

Example:

```json
{
  "status": "cancelled"
}
```

---

## Plugin Initialization Example

The plugin should be usable in plain JavaScript like this:

```html
<div id="employee-selector-root"></div>

<script src="employee-forward-selector.js"></script>

<script>
  EmployeeForwardSelector.init({
    container: "#employee-selector-root",

    title: "Select Employee",

    preferredEmployees: [
      {
        employeeId: "EMP101",
        employeeName: "Employee One",
        designation: "Assistant Engineer"
      }
    ],

    predefinedEmployees: [
      {
        employeeId: "EMP201",
        employeeName: "Employee Two",
        designation: "Divisional Engineer"
      }
    ],

    searchEmployees: async function(searchText) {
      // Backend developer will replace this with API call
      return [
        {
          employeeId: "EMP001",
          employeeName: "Employee Name",
          designation: "Designation"
        }
      ];
    },

    onConfirm: function(data) {
      console.log("Selected employee and action:", data);

      // Backend/application developer will handle further workflow here
    },

    onCancel: function() {
      console.log("Employee selection cancelled");
    }
  });
</script>
```

---

## Required Plugin Methods

The plugin should expose the following methods:

```javascript
EmployeeForwardSelector.init(config)
EmployeeForwardSelector.open()
EmployeeForwardSelector.close()
EmployeeForwardSelector.destroy()
EmployeeForwardSelector.setPreferredEmployees(data)
EmployeeForwardSelector.setPredefinedEmployees(data)
```

---

## Configuration Options

```javascript
{
  container: "#employee-selector-root",

  title: "Select Employee",

  preferredEmployees: [],

  predefinedEmployees: [],

  searchEmployees: async function(searchText) {},

  onConfirm: function(data) {},

  onCancel: function() {},

  defaultActiveTab: "allEmployees",

  actionTypes: ["RO", "RVO", "AA", "DSC"],

  allowOutsideClickClose: false,

  resetSelectionOnClose: true
}
```

---

## Employee Data Format

Each employee object should follow this structure:

```json
{
  "employeeId": "EMP001",
  "employeeName": "Employee Name",
  "designation": "Designation"
}
```

Optional fields may include:

```json
{
  "department": "Accounts",
  "office": "Corporate Office",
  "mobile": "9999999999",
  "email": "employee@example.com"
}
```

Only `employeeName` and `designation` are required for display in the current table.

---

## UI Design Requirements

The design should be:

* Clean
* Compact
* Government/enterprise application suitable
* Easy to integrate into existing applications
* Font size should be small and professional
* Tabs, buttons, table rows, and footer should be compact
* Footer should be clearly visible and visually separated
* Popup should be responsive for desktop and tablet screens

---

## Suggested Modal Size

Desktop:

* Width: 850px to 1000px
* Max height: 80vh
* Table area should scroll if records are more

Mobile/tablet:

* Modal should adjust responsively
* Table may become horizontally scrollable if required

---

## Accessibility Requirements

The plugin should support:

* Keyboard navigation
* Tab focus states
* Escape key to close popup if enabled
* Proper radio button labels
* ARIA role for modal dialog
* Clear focus outline
* Screen-reader-friendly labels

---

## Loading, Empty, and Error States

### Loading State

When employee search is in progress, show:

`Searching employees...`

### Empty State

When no records are found, show:

`No employees found.`

### Error State

If search API fails, show:

`Unable to fetch employees. Please try again.`

---

## Security and Integration Notes

* The plugin should not directly handle authentication.
* The plugin should not directly call any fixed backend API.
* The parent application should provide the search function/API through configuration.
* The plugin should not store employee data permanently.
* The plugin should not expose sensitive data unless passed by the parent application.
* The plugin should sanitize displayed text to prevent XSS.
* The plugin should avoid global CSS conflicts by using scoped class names.

---

## Styling Requirements

The plugin should include its own CSS.

CSS class names should be prefixed to avoid conflicts.

Example prefix:

```css
.efs-modal
.efs-tabs
.efs-table
.efs-footer
.efs-button
```

The design should not disturb the parent application’s existing CSS.

---

## Deliverables Expected

Please generate:

1. Complete plugin architecture.
2. HTML structure.
3. CSS styling.
4. JavaScript plugin code.
5. Example usage in plain HTML/JavaScript.
6. Example usage in React JS.
7. Sample mock employee data.
8. Callback output example.
9. Validation handling.
10. Responsive behavior.

---

## Final Expected Result

A reusable JavaScript popup plugin where a user can search/select an employee from:

1. All Employees
2. Preferred List
3. Predefined List

Then select one action type:

* RO
* RVO
* AA
* DSC

And click `OK` to return the selected employee and action type to the parent application.

The backend developer will use this returned data to continue the file/application forwarding workflow.
