import Link from "next/link";

export function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
        The Latest Times
      </h1>
      <p className="max-w-xl text-base-content/70">
        A simple, personalized news feed.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/feed"
          className="rounded-sm bg-base-content px-6 py-3 text-base-100 transition-opacity hover:opacity-90"
        >
          Open Feed
        </Link>
        <Link
          href="/auth/signin"
          className="rounded-sm border border-base-300 px-6 py-3 transition-colors hover:bg-base-200/50"
        >
          Sign In
        </Link>
      </div>
    </main>
  );
}
