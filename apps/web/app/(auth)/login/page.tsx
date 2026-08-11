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

  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Background decorative blobs */}
      <div
        className="login-blob absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(30,136,229,0.25), transparent 70%)",
          top: -100,
          left: -100,
          filter: "blur(40px)",
        }}
      />
      <div
        className="login-blob absolute rounded-full"
        style={{
          width: 350,
          height: 350,
          background: "radial-gradient(circle, rgba(229,57,53,0.15), transparent 70%)",
          bottom: -80,
          right: -80,
          filter: "blur(40px)",
          animationDelay: "2s",
        }}
      />

      {/* Subtle network dot grid overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      <div
        className="login-card-animate w-full max-w-sm p-8 rounded-2xl relative z-10"
        style={{
          background: "var(--color-surface)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <img src="/logo.png" alt="IONET+" style={{ height: 56, marginBottom: 12 }} />
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
              className="transition-all duration-150 focus:outline-none"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "10px 14px",
                width: "100%",
                fontSize: "0.9rem",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
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
              className="transition-all duration-150 focus:outline-none"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "10px 14px",
                width: "100%",
                fontSize: "0.9rem",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
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
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white mt-2 transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "var(--color-accent)" }}
          >
            {loading && (
              <span
                className="spinner"
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
            )}
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}