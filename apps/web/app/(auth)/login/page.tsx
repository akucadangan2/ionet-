// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import NetworkBackground from "@/components/NetworkBackground";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

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

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    padding: "12px 16px",
    width: "100%",
    fontSize: "0.92rem",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg)" }}>
      {/* Left panel — network visualization */}
      <div
        className="hidden md:flex flex-col justify-between relative overflow-hidden"
        style={{ width: "45%", background: "var(--color-sidebar)", padding: "48px" }}
      >
        <NetworkBackground />

        <div className="relative z-10 stagger-1">
          {logoFailed ? (
            <span
              className="wordmark-animate"
              style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "white", fontWeight: 700 }}
            >
              IONET<span style={{ color: "var(--color-accent)" }}>+</span>
            </span>
          ) : (
            <img
              src="/logo.png"
              alt="IONET+"
              style={{ height: 40 }}
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>

        <div className="relative z-10 stagger-3" style={{ maxWidth: 340 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              color: "white",
              lineHeight: 1.3,
              marginBottom: 12,
            }}
          >
            Kelola jaringan Anda dari satu tempat.
          </h2>
          <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6 }}>
            Billing, monitoring, dan operasional RT RW Net — semuanya
            terhubung, real-time, dalam satu dashboard.
          </p>
        </div>

        <div className="relative z-10 stagger-5" style={{ color: "#6B7280", fontSize: 12 }}>
          © {new Date().getFullYear()} IONET+ Platform
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full" style={{ maxWidth: 360 }}>
          <div className="stagger-1 md:hidden mb-8">
            {logoFailed ? (
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>
                IONET<span style={{ color: "var(--color-accent)" }}>+</span>
              </span>
            ) : (
              <img src="/logo.png" alt="IONET+" style={{ height: 36 }} onError={() => setLogoFailed(true)} />
            )}
          </div>

          <div className="stagger-2 mb-8">
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 6 }}>
              Selamat datang kembali
            </h1>
            <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
              Masuk untuk melanjutkan ke dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="stagger-3">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-ink-muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-accent)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(30,136,229,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border)";
                  e.target.style.boxShadow = "none";
                }}
                required
              />
            </div>

            <div className="stagger-4">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--color-ink-muted)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-accent)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(30,136,229,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--color-border)";
                  e.target.style.boxShadow = "none";
                }}
                required
              />
            </div>

            {error && (
              <p className="text-sm stagger-4" style={{ color: "var(--color-signal-bad)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="stagger-5 w-full flex items-center justify-center gap-2"
              style={{
                background: "var(--color-accent)",
                color: "white",
                padding: "12px 0",
                borderRadius: 10,
                fontSize: "0.92rem",
                fontWeight: 500,
                border: "none",
                cursor: loading ? "default" : "pointer",
                marginTop: 4,
                transition: "opacity 0.15s ease, transform 0.1s ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
                  }}
                />
              )}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}