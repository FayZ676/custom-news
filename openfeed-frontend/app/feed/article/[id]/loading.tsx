export default function ArticleLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full py-6 px-4">
      <div className="skeleton h-4 w-28 rounded" />
      <div className="flex flex-col gap-2">
        <div className="skeleton h-8 w-full rounded" />
        <div className="skeleton h-8 w-2/3 rounded" />
      </div>
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton w-full aspect-video rounded-sm" />
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
      </div>
    </div>
  );
}
