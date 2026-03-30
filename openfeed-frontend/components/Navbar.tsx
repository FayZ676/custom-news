import { ReactNode } from "react";

export function Navbar({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="navbar bg-base-100 p-0">
      <div className="navbar-start w-auto">{left}</div>
      <div className="navbar-center min-w-0 flex-1 justify-center">
        {center}
      </div>
      {right ? <div className="navbar-end w-auto">{right}</div> : null}
    </div>
  );
}
