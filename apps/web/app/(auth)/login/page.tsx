// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError("Email atau password salah");
      return;
    }

    router.push("/");
    router.refresh();
  }

  const inputStyle = {
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    padding: "10px 14px",
    width: "100%",
    fontSize: "0.9rem",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--color-sidebar)" }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-xl"
        style={{ background: "var(--color-surface)" }}
      >
        <img src="/logo.png" alt="IONET+" style={{ height: 40, marginBottom: 8 }} />
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
          Masuk ke dashboard
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-ink-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-ink-muted)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--color-signal-bad)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2"
            style={{ background: "var(--color-accent)" }}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}