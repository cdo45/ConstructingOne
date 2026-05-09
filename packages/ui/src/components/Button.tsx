import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const cls = `cone-button cone-button--${variant}${
    className ? ` ${className}` : ""
  }`;
  return <button {...props} type={type} className={cls} />;
}
