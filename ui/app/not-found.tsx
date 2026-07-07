import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-xl font-black uppercase tracking-tight">Not found</h2>
      <p className="max-w-md text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Button asChild className="neobrutal-card">
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
