import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className = "", type = "text", ...props }, ref) {
    const cls = `cone-input${className ? ` ${className}` : ""}`;
    return <input {...props} ref={ref} type={type} className={cls} />;
  }
);
