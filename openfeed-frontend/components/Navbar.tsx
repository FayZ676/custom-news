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
      <div className="navbar-start">{left}</div>
      <div className="navbar-center">{center}</div>
      <div className="navbar-end">{right}</div>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <div className="navbar bg-base-100 p-0">
      <div className="navbar-start">
        <div className="skeleton h-10 w-16 rounded-lg" />
      </div>
      <div className="navbar-center">
        <div className="skeleton h-6 w-32 rounded-lg" />
      </div>
      <div className="navbar-end">
        <div className="skeleton h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}
