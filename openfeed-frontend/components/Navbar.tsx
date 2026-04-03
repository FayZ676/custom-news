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
    <div className="grid grid-cols-[1fr_4fr_1fr] items-center bg-base-100 min-h-16 w-full">
      <div className="justify-self-start">{left}</div>
      <div className="min-w-0 px-2">
        <div className="truncate text-center">{center}</div>
      </div>
      <div className="justify-self-end">{right}</div>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-base-100 min-h-16 w-full">
      <div className="justify-self-start">
        <div className="skeleton h-10 w-16 rounded-lg" />
      </div>
      <div className="min-w-0 px-2">
        <div className="skeleton h-6 w-32 rounded-lg" />
      </div>
      <div className="justify-self-end">
        <div className="skeleton h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}
