/**
 * Alert component for displaying messages
 */

import React from "react";
import { CSS_CLASSES } from "../../utils/constants";

interface AlertProps {
  type: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  children,
  onClose,
  className = "",
}) => {
  const icons = {
    info: "📘",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  return (
    <div className={`${CSS_CLASSES.alert[type]} ${className} relative`}>
      <div className="flex items-start">
        <span className="mr-2 text-lg">{icons[type]}</span>
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-lg hover:opacity-70 transition-opacity"
            aria-label="Close alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
