"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!username || !password) return setError("Username and password required");
    if (password !== confirm) return setError("Passwords do not match");
    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Registration failed");
      } else {
        setSuccess("Account created! You can now sign in.");
        setUsername(""); setPassword(""); setConfirm("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border p-6">
        <h1 className="text-xl font-semibold">Sign up</h1>
        <div className="space-y-1">
          <label className="text-sm">Username</label>
          <input className="w-full rounded-xl border px-3 py-2 text-sm" value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Confirm Password</label>
          <input type="password" className="w-full rounded-xl border px-3 py-2 text-sm" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-700">{success}</div>}
        <Button type="submit" disabled={loading} className="w-full">{loading ? "Signing up..." : "Sign up"}</Button>
        <div className="text-sm text-center text-muted-foreground pt-2">
          Already have an account? <a href="/" className="underline hover:text-primary">Sign in</a>
        </div>
      </form>
    </main>
  );
}
