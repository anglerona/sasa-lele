import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b flex items-center justify-between px-4 py-2 shadow-sm">
      <div className="flex gap-4 items-center">
        <span className="font-bold text-lg tracking-tight text-primary">SASA-LELE</span>
        <div className="flex gap-2 items-center">
          <Link href="/sales">
            <Button variant="ghost">Sales</Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost">Settings</Button>
          </Link>
          <Link href="/data">
            <Button variant="ghost">Data</Button>
          </Link>
        </div>
      </div>
      <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
        Sign out
      </Button>
    </nav>
  );
}
