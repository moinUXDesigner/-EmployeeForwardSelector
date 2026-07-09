/*
 * EmployeeForwardSelector - React usage example.
 *
 * The plugin is plain vanilla JS, so it is wrapped imperatively: a container <div> is
 * rendered by React, and EmployeeForwardSelector.init/destroy manage the actual popup
 * markup inside it. init() accepts a raw DOM element for `container` (in addition to a
 * CSS selector string), which is what makes this ref-based pattern possible.
 *
 * Either import the plugin as a local module:
 *   import EmployeeForwardSelector from "../employee-forward-selector.js";
 * or, if you'd rather not bundle it, drop <script src="employee-forward-selector.js">
 * in your HTML and read window.EmployeeForwardSelector instead.
 */
import { useRef, useEffect } from "react";
import EmployeeForwardSelector from "../employee-forward-selector.js";
import EFSMockData from "./mock-data.js";

const { mockPreferredEmployees, mockPredefinedEmployees, mockSearchEmployees } = EFSMockData;

export default function ForwardFileButton({ onForward }) {
  const containerRef = useRef(null);
  const onForwardRef = useRef(onForward);
  onForwardRef.current = onForward;

  useEffect(() => {
    EmployeeForwardSelector.init({
      container: containerRef.current,
      title: "RBAC Panel",
      subtitle: "Choose an employee and assign the forwarding action",
      preferredEmployees: mockPreferredEmployees,
      predefinedEmployees: mockPredefinedEmployees,
      searchEmployees: mockSearchEmployees,
      onConfirm: (data) => {
        console.log("Selected employee and action:", data);
        onForwardRef.current && onForwardRef.current(data);
      },
      onCancel: () => {
        console.log("Employee selection cancelled");
      },
      onPreferredListChange: (updatedList, employee, isAdded) => {
        console.log("Preferred list changed:", updatedList, employee, isAdded);
      }
    });

    return () => {
      EmployeeForwardSelector.destroy();
    };
  }, []);

  return (
    <>
      <button type="button" onClick={() => EmployeeForwardSelector.open()}>
        Forward File
      </button>
      <div ref={containerRef} />
    </>
  );
}
