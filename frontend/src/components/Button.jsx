import React from "react";
import "./Button.css";

const Button = ({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const buttonClasses = [
    "button",
    `button--${variant}`,
    fullWidth ? "button--full-width" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
