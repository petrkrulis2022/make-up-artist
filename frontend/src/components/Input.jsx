import React from "react";
import "./Input.css";

const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  disabled = false,
  multiline = false,
  rows = 4,
  className = "",
  ...props
}) => {
  const inputId = `input-${name}`;
  const inputClasses = [
    "input__field",
    error ? "input__field--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const InputElement = multiline ? "textarea" : "input";

  return (
    <div className="input">
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}
      <InputElement
        id={inputId}
        type={multiline ? undefined : type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={multiline ? rows : undefined}
        className={inputClasses}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="input__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
