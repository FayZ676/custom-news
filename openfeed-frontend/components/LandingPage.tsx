import Link from "next/link";

export function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="heading-page">
        The Latest Times
      </h1>
      <p className="max-w-xl text-base-content/70">
        A simple, personalized news feed.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/feed" className="btn-primary">
          Open Feed
        </Link>
        <Link href="/auth/signin" className="btn-primary">
          Sign In
        </Link>
      </div>
    </main>
  );
}
