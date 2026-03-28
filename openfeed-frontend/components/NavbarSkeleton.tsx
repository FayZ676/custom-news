export function NavbarSkeleton() {
  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        {/* Menu button placeholder */}
        <div className="skeleton h-10 w-16 rounded-lg" />
      </div>
      <div className="navbar-center">
        {/* Title placeholder */}
        <div className="skeleton h-6 w-32 rounded-lg" />
      </div>
      <div className="navbar-end">
        {/* Right slot placeholder (e.g. pagination arrows) */}
        <div className="skeleton h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}
