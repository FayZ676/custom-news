import { ReactNode } from "react";

export function FeedDrawer({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">{left}</div>
      <div className="navbar-center">{center}</div>
      {right ? <div className="navbar-end">{right}</div> : null}
    </div>
  );
}
