export default function QueryBuilderLoading() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-4">
        <div className="skeleton h-9 w-1/2 rounded" />
        <div className="flex flex-col border-t border-base-300">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 py-4 border-b border-base-300"
            >
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-10.5 w-full rounded" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3">
          <div className="skeleton h-9 w-24 rounded" />
          <div className="skeleton h-9 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}
