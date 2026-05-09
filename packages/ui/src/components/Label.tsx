import * as React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = "", children, ...props }: LabelProps) {
  const cls = `eyebrow cone-label${className ? ` ${className}` : ""}`;
  return (
    <label {...props} className={cls}>
      {children}
    </label>
  );
}
