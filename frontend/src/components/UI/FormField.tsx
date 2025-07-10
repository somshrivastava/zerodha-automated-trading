/**
 * Reusable Form Field component with consistent styling
 */

import React from "react";
import { CSS_CLASSES } from "../../utils/constants";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  required = false,
  helpText,
}) => {
  return (
    <div className="space-y-1">
      <label className={CSS_CLASSES.label}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {children}

      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

// ============================================================================
// SPECIALIZED INPUT COMPONENTS
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  required,
  ...inputProps
}) => {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      helpText={helpText}
    >
      <input
        {...inputProps}
        className={`${CSS_CLASSES.input} ${error ? "border-red-500" : ""}`}
      />
    </FormField>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helpText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helpText,
  required,
  ...selectProps
}) => {
  return (
    <FormField
      label={label}
      error={error}
      required={required}
      helpText={helpText}
    >
      <select
        {...selectProps}
        className={`${CSS_CLASSES.input} ${error ? "border-red-500" : ""}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};
