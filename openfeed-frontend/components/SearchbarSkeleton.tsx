export function SearchbarSkeleton() {
  return (
    <div className="w-full px-4 pt-4">
      <div className="rounded-lg border border-base-300 px-4 pt-4 pb-3">
        {/* Textarea placeholder */}
        <div className="skeleton h-6 w-3/4 rounded-lg" />

        <hr className="border-base-300 -mx-4 my-3" />

        {/* Button row placeholder */}
        <div className="flex items-center justify-end gap-2">
          <div className="skeleton h-9 w-36 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
