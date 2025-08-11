import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8 p-8 rounded-2xl border bg-white shadow">
        <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Welcome to SASA-LELE</h1>
        <p className="text-center text-muted-foreground mb-2">A modern sales and inventory management app.</p>
        <div className="text-center text-sm text-muted-foreground mb-2">
          <strong>Demo login:</strong> Use <span className="font-mono">"demo"</span> as username and password to try out the app.
        </div>
        <div className="flex gap-4 w-full justify-center">
          <Link href="/login" className="w-1/2">
            <Button className="w-full">Login</Button>
          </Link>
          <Link href="/signup" className="w-1/2">
            <Button variant="outline" className="w-full">Sign Up</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}