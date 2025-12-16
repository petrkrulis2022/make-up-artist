import React from "react";
import "./Card.css";

const Card = ({
  children,
  className = "",
  padding = "md",
  shadow = "md",
  ...props
}) => {
  const cardClasses = [
    "card",
    `card--padding-${padding}`,
    `card--shadow-${shadow}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;
