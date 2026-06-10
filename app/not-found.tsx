import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-start justify-center px-5 md:px-10">
      <p className="font-mono text-label tracking-[0.2em] text-ember uppercase">
        Err 404
      </p>
      <h1 className="mt-4 text-hero font-black uppercase stretch-110">
        Nothing
        <br />
        here.
      </h1>
      <Link
        href="/"
        className="mt-10 font-mono text-mono-sm text-ash underline-offset-4 hover:underline"
      >
        ← Return to the archive
      </Link>
    </div>
  );
}
