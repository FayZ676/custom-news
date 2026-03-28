export function CardArticleSkeleton() {
  return (
    <div className="border border-base-300 rounded-xl p-4 flex flex-col gap-2">
      {/* Title placeholder */}
      <div className="skeleton h-5 w-3/4 rounded-lg" />
      {/* Summary placeholder */}
      <div className="skeleton h-4 w-full rounded-lg" />
      {/* Source / time footer */}
      <div className="flex justify-between mt-1">
        <div className="skeleton h-3 w-24 rounded-lg" />
        <div className="skeleton h-3 w-16 rounded-lg" />
      </div>
    </div>
  );
}
