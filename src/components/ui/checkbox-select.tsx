"use client";

import ReactSelect, { StylesConfig, components } from "react-select";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxSelectOption {
  value: string;
  label: string;
}

interface CheckboxSelectProps {
  options: CheckboxSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  predefinedTasks?: CheckboxSelectOption[];
}

export function CheckboxSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  className = "",
  searchable = false,
  searchPlaceholder = "Search...",
  predefinedTasks = [],
}: CheckboxSelectProps) {
  // ✅ Build grouped options so predefined tasks show separately
  const groupedOptions =
    predefinedTasks.length > 0
      ? [
          { label: "Suggested", options: predefinedTasks },
          { label: "All Options", options },
        ]
      : options;

  const allOptions = [...predefinedTasks, ...options];

  // ✅ Find currently selected react-select option objects
  const selectedValues = allOptions.filter((opt) => value.includes(opt.value));

  // ✅ Custom Option with radio-style indicator
  const CustomOption = (props: any) => {
    const { data, isSelected, isFocused } = props;
    return (
      <components.Option {...props}>
        <div
          className={cn(
            "flex items-start gap-3 px-1 py-0.5 cursor-pointer"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
              isSelected
                ? "bg-[#3838EC] border-[#3838EC]"
                : "border-gray-300"
            )}
          >
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <span className="text-sm leading-relaxed">{data.label}</span>
        </div>
      </components.Option>
    );
  };

  // ✅ Custom styles — uses menuPortalTarget to escape Dialog
  const styles: StylesConfig = {
    control: (base, state) => ({
      ...base,
      height: "40px",
      minHeight: "40px",
      borderColor: state.isFocused ? "#3838EC" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 1px #3838EC" : "none",
      "&:hover": { borderColor: "#d1d5db" },
      borderRadius: "6px",
      cursor: "pointer",
      backgroundColor: "transparent",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
      fontSize: "14px",
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: "14px",
    }),
    // ✅ menuPortal z-index must be above Dialog (Dialog = z-50 = 50)
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "8px",
      border: "1px solid #e5e7eb",
      boxShadow:
        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      overflow: "hidden",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#eff6ff"
        : state.isFocused
        ? "#f9fafb"
        : "white",
      color: "#111827",
      padding: "10px 16px",
      cursor: "pointer",
      "&:active": { backgroundColor: "#eff6ff" },
    }),
    groupHeading: (base) => ({
      ...base,
      fontSize: "11px",
      fontWeight: "600",
      color: "#9ca3af",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      padding: "8px 16px 4px",
      backgroundColor: "#f9fafb",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: "#9ca3af",
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
      transition: "transform 0.2s",
      padding: "0 8px",
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "#9ca3af",
      padding: "0 4px",
      "&:hover": { color: "#6b7280" },
    }),
  };

  return (
    <div className={cn("w-full", className)}>
      <ReactSelect
        options={groupedOptions as any}
        value={selectedValues.length > 0 ? selectedValues[0] : null}
        onChange={(selected: any) => {
          onChange(selected ? [selected.value] : []);
        }}
        placeholder={placeholder}
        isSearchable={searchable}
        isClearable={value.length > 0}
        components={{ Option: CustomOption }}
        styles={styles}
        // ✅ THIS IS THE KEY FIX:
        // menuPortalTarget renders the dropdown menu at document.body
        // completely escaping the Dialog's DOM tree and stacking context
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : undefined
        }
        menuPosition="fixed"
        // ✅ Keeps menu open when clicking inside it
        closeMenuOnSelect={true}
        // ✅ Prevent Dialog from seeing these events
        onMenuOpen={() => {}}
        onMenuClose={() => {}}
        inputId="checkbox-select-input"
      />
    </div>
  );
}