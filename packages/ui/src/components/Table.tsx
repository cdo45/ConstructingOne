import * as React from "react";

type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

/**
 * Editorial table: hairline rows, generous padding, no zebra striping.
 * Consumers compose <thead>/<tbody>/<tr>/<th>/<td> as plain HTML.
 * For numeric columns, add `className="mono"` to th/td so digits use
 * the JetBrains Mono tabular figures.
 */
export function Table({ className = "", children, ...props }: TableProps) {
  const cls = `cone-table${className ? ` ${className}` : ""}`;
  return (
    <table {...props} className={cls}>
      {children}
    </table>
  );
}
