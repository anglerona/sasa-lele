"use client";
import { signIn, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { data: session } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (session?.accessToken) {
    redirect("/sales");
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) setError("Invalid credentials");
    else redirect("/sales");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <div className="space-y-1">
          <label className="text-sm">Username</label>
          <input className="w-full rounded-xl border px-3 py-2 text-sm" value={username} onChange={(e)=>setUsername(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Button type="submit" disabled={loading} className="w-full">{loading?"Signing in...":"Sign in"}</Button>
        <div className="text-sm text-center text-muted-foreground pt-2">
          New user? <a href="/signup" className="underline hover:text-primary">Sign up</a>
        </div>
      </form>
    </main>
  );
}