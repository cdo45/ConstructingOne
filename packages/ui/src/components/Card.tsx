import * as React from "react";
import Link from "next/link";

type BaseProps = {
  className?: string;
  children: React.ReactNode;
};

type CardProps = BaseProps & {
  href?: string;
};

export function Card({ href, className = "", children }: CardProps) {
  const cls = `cone-card${href ? " cone-card--interactive" : ""}${
    className ? ` ${className}` : ""
  }`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}
