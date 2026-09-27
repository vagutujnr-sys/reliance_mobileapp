"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">{error.message || "Please try that again."}</p>
        <button onClick={reset} className="mt-5 h-12 rounded-full bg-brand px-6 font-semibold text-white">Try again</button>
      </div>
    </main>
  );
}
