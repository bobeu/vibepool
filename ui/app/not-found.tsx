import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-xl font-black uppercase tracking-tight">Not found</h2>
      <p className="max-w-md text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="neobrutal-btn inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        Return home
      </Link>
    </div>
  );
}
