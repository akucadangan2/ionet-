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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
    background: "white",
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--color-bg)" }}
    >
      {/* =====================================================
          LEFT PANEL
          WIFI TECHNICIAN PLATFORMER
      ====================================================== */}
      <div
        className="wifi-world hidden md:flex flex-col justify-between relative overflow-hidden"
        style={{
          width: "50%",
          background: "var(--color-sidebar)",
          padding: "48px",
        }}
      >
        {/* Existing network background */}
        <NetworkBackground />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

        {/* =====================================================
            LOGO
        ====================================================== */}
        <div className="relative z-20 stagger-1">
          {logoFailed ? (
            <span
              className="wordmark-animate"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                color: "white",
                fontWeight: 700,
              }}
            >
              IONET
              <span style={{ color: "var(--color-accent)" }}>+</span>
            </span>
          ) : (
            <img
              src="/logo.png"
              alt="IONET+"
              style={{
                height: 42,
                width: "auto",
                objectFit: "contain",
              }}
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>

        {/* =====================================================
            HERO TEXT
        ====================================================== */}
        <div
          className="relative z-20 stagger-3"
          style={{ maxWidth: 380 }}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
            <span className="status-dot" />
            <span
              style={{
                color: "#D1D5DB",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              NETWORK ONLINE
            </span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              color: "white",
              lineHeight: 1.25,
              marginBottom: 12,
            }}
          >
            Teknisi siap.
            <br />
            Jaringan terkoneksi.
          </h2>

          <p
            style={{
              color: "#9CA3AF",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            Kelola billing, pelanggan, monitoring, dan operasional
            RT RW Net dari satu dashboard.
          </p>
        </div>

        {/* =====================================================
            WIFI GAME SCENE
        ====================================================== */}
        <div className="absolute bottom-0 left-0 right-0 h-[260px] z-10 pointer-events-none">
          {/* Floor */}
          <div className="absolute bottom-0 left-0 right-0 h-20 wifi-floor">
            <div className="floor-grid" />
          </div>

          {/* Platform */}
          <div className="platform platform-one" />
          <div className="platform platform-two" />

          {/* Router */}
          <div className="router-box">
            <div className="router-top">
              <span />
              <span />
              <span />
            </div>

            <div className="router-lights">
              <i />
              <i />
              <i />
            </div>

            <div className="router-label">WiFi</div>

            {/* Antenna */}
            <div className="router-antenna antenna-left" />
            <div className="router-antenna antenna-right" />
          </div>

          {/* WiFi waves */}
          <div className="wifi-signal">
            <span />
            <span />
            <span />
          </div>

          {/* Network Nodes */}
          <div className="network-node node-one">
            <div className="node-core" />
          </div>

          <div className="network-node node-two">
            <div className="node-core" />
          </div>

          <div className="network-node node-three">
            <div className="node-core" />
          </div>

          {/* Connection lines */}
          <div className="connection-line line-one" />
          <div className="connection-line line-two" />
          <div className="connection-line line-three" />

          {/* Coin / signal pickups */}
          <div className="signal-coin signal-one">+</div>
          <div className="signal-coin signal-two">+</div>
          <div className="signal-coin signal-three">+</div>

          {/* =================================================
              TECHNICIAN CHARACTER
          ================================================== */}
          <div className="technician">
            {/* Backpack */}
            <div className="tech-backpack" />

            {/* Head */}
            <div className="tech-head">
              <div className="tech-hair" />
              <div className="tech-eye eye-left" />
              <div className="tech-eye eye-right" />

              <div className="tech-smile" />
            </div>

            {/* Cap */}
            <div className="tech-cap">
              <span>+</span>
            </div>

            {/* Body */}
            <div className="tech-body">
              <div className="tech-logo">+</div>
            </div>

            {/* Arm */}
            <div className="tech-arm tech-arm-left">
              <div className="tech-hand" />
            </div>

            <div className="tech-arm tech-arm-right">
              <div className="tech-hand" />
            </div>

            {/* Legs */}
            <div className="tech-legs">
              <div className="tech-leg tech-leg-left">
                <div className="tech-shoe" />
              </div>

              <div className="tech-leg tech-leg-right">
                <div className="tech-shoe" />
              </div>
            </div>

            {/* Tool */}
            <div className="wifi-tool">
              <div className="tool-handle" />
              <div className="tool-head" />
            </div>
          </div>

          {/* Cable */}
          <div className="ethernet-cable">
            <div className="cable-plug" />
          </div>

          {/* Flag / checkpoint */}
          <div className="checkpoint">
            <div className="checkpoint-pole" />
            <div className="checkpoint-flag">
              IONET+
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="relative z-20 stagger-5"
          style={{
            color: "#6B7280",
            fontSize: 12,
          }}
        >
          © {new Date().getFullYear()} IONET+ Platform
        </div>
      </div>

      {/* =====================================================
          RIGHT PANEL — LOGIN
      ====================================================== */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full" style={{ maxWidth: 360 }}>
          {/* Mobile Logo */}
          <div className="stagger-1 md:hidden mb-8">
            {logoFailed ? (
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                IONET
                <span style={{ color: "var(--color-accent)" }}>+</span>
              </span>
            ) : (
              <img
                src="/logo.png"
                alt="IONET+"
                style={{
                  height: 36,
                  width: "auto",
                  objectFit: "contain",
                }}
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>

          {/* Heading */}
          <div className="stagger-2 mb-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="login-status-dot" />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-ink-muted)" }}
              >
                Secure connection
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                marginBottom: 6,
              }}
            >
              Selamat datang kembali
            </h1>

            <p
              className="text-sm"
              style={{ color: "var(--color-ink-muted)" }}
            >
              Masuk untuk melanjutkan ke dashboard
            </p>
          </div>

          {/* Login */}
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-4"
          >
            {/* Email */}
            <div className="stagger-3">
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--color-ink-muted)" }}
              >
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="nama@email.com"
                onFocus={(e) => {
                  e.target.style.borderColor =
                    "var(--color-accent)";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(30,136,229,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor =
                    "var(--color-border)";
                  e.target.style.boxShadow = "none";
                }}
                required
              />
            </div>

            {/* Password */}
            <div className="stagger-4">
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: "var(--color-ink-muted)" }}
              >
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Masukkan password"
                onFocus={(e) => {
                  e.target.style.borderColor =
                    "var(--color-accent)";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(30,136,229,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor =
                    "var(--color-border)";
                  e.target.style.boxShadow = "none";
                }}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-sm stagger-4"
                style={{ color: "var(--color-signal-bad)" }}
              >
                {error}
              </p>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-button stagger-5 w-full flex items-center justify-center gap-2"
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
              }}
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

          <div
            className="mt-8 text-center text-xs"
            style={{ color: "var(--color-ink-muted)" }}
          >
            <span>IONET+ Network Management Platform</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ====================================================== */}
      <style jsx>{`
        /* Online indicator */
        .status-dot,
        .login-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .login-status-dot {
          width: 6px;
          height: 6px;
        }

        /* Clouds / network movement */
        .wifi-world {
          perspective: 900px;
        }

        /* Floor */
        .wifi-floor {
          background: #111827;
          border-top: 2px solid #374151;
        }

        .floor-grid {
          width: 100%;
          height: 100%;
          opacity: 0.35;
          background-image:
            linear-gradient(#374151 1px, transparent 1px),
            linear-gradient(90deg, #374151 1px, transparent 1px);
          background-size: 30px 20px;
          transform: perspective(300px) rotateX(35deg);
          transform-origin: bottom;
        }

        /* Platforms */
        .platform {
          position: absolute;
          height: 13px;
          border-radius: 4px;
          background: #374151;
          border: 2px solid #4b5563;
          box-shadow: 0 5px 0 #111827;
        }

        .platform-one {
          left: 8%;
          bottom: 88px;
          width: 110px;
          animation: platformFloat 3s ease-in-out infinite;
        }

        .platform-two {
          right: 10%;
          bottom: 122px;
          width: 90px;
          animation: platformFloat 3s ease-in-out infinite reverse;
        }

        /* Router */
        .router-box {
          position: absolute;
          right: 18%;
          bottom: 79px;
          width: 86px;
          height: 48px;
          border-radius: 8px;
          background: #f3f4f6;
          border: 3px solid #9ca3af;
          box-shadow: 0 7px 0 #111827;
          animation: routerFloat 2.5s ease-in-out infinite;
        }

        .router-top {
          display: flex;
          gap: 4px;
          padding: 7px 8px 3px;
        }

        .router-top span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6b7280;
        }

        .router-lights {
          display: flex;
          gap: 5px;
          position: absolute;
          left: 9px;
          bottom: 7px;
        }

        .router-lights i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: routerBlink 1s infinite;
        }

        .router-lights i:nth-child(2) {
          animation-delay: 0.3s;
        }

        .router-lights i:nth-child(3) {
          animation-delay: 0.6s;
        }

        .router-label {
          position: absolute;
          right: 7px;
          bottom: 6px;
          font-size: 7px;
          font-weight: 800;
          color: #374151;
        }

        .router-antenna {
          position: absolute;
          width: 3px;
          height: 18px;
          top: -17px;
          background: #6b7280;
          border-radius: 3px;
        }

        .antenna-left {
          left: 18px;
          transform: rotate(-15deg);
        }

        .antenna-right {
          right: 18px;
          transform: rotate(15deg);
        }

        /* WiFi signal */
        .wifi-signal {
          position: absolute;
          right: 13%;
          bottom: 132px;
          width: 90px;
          height: 70px;
        }

        .wifi-signal span {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          border: 3px solid var(--color-accent);
          border-left-color: transparent;
          border-bottom-color: transparent;
          border-radius: 50%;
          transform-origin: bottom center;
          animation: wifiWave 1.8s ease-out infinite;
        }

        .wifi-signal span:nth-child(1) {
          width: 24px;
          height: 24px;
          animation-delay: 0s;
        }

        .wifi-signal span:nth-child(2) {
          width: 50px;
          height: 50px;
          animation-delay: 0.3s;
        }

        .wifi-signal span:nth-child(3) {
          width: 78px;
          height: 78px;
          animation-delay: 0.6s;
        }

        /* Network nodes */
        .network-node {
          position: absolute;
          width: 18px;
          height: 18px;
          border: 2px solid var(--color-accent);
          border-radius: 50%;
          background: #111827;
          box-shadow: 0 0 18px rgba(30, 136, 229, 0.7);
          animation: nodePulse 2s ease-in-out infinite;
        }

        .node-core {
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: var(--color-accent);
        }

        .node-one {
          left: 16%;
          bottom: 145px;
        }

        .node-two {
          left: 31%;
          bottom: 190px;
          animation-delay: 0.5s;
        }

        .node-three {
          right: 7%;
          bottom: 190px;
          animation-delay: 1s;
        }

        /* Lines */
        .connection-line {
          position: absolute;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--color-accent),
            transparent
          );
          opacity: 0.6;
          transform-origin: left center;
          animation: dataFlow 2s linear infinite;
        }

        .line-one {
          width: 130px;
          left: 17%;
          bottom: 151px;
          transform: rotate(-19deg);
        }

        .line-two {
          width: 110px;
          left: 31%;
          bottom: 192px;
          transform: rotate(2deg);
          animation-delay: 0.4s;
        }

        .line-three {
          width: 120px;
          right: 12%;
          bottom: 188px;
          transform: rotate(-22deg);
          animation-delay: 0.8s;
        }

        /* Signal coins */
        .signal-coin {
          position: absolute;
          width: 27px;
          height: 27px;
          border-radius: 50%;
          border: 2px solid #60a5fa;
          background: #1e3a8a;
          color: #93c5fd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 15px;
          animation: coinFloat 1.7s ease-in-out infinite;
        }

        .signal-one {
          left: 24%;
          bottom: 120px;
        }

        .signal-two {
          left: 38%;
          bottom: 157px;
          animation-delay: 0.4s;
        }

        .signal-three {
          right: 31%;
          bottom: 112px;
          animation-delay: 0.8s;
        }

        /* =================================================
           TECHNICIAN
        ================================================== */
        .technician {
          position: absolute;
          left: 47%;
          bottom: 79px;
          width: 75px;
          height: 130px;
          animation: technicianWalk 1s steps(2) infinite;
          z-index: 20;
        }

        .tech-backpack {
          position: absolute;
          left: 5px;
          top: 48px;
          width: 25px;
          height: 48px;
          border-radius: 7px;
          background: #374151;
          border: 2px solid #111827;
          transform: rotate(5deg);
        }

        .tech-head {
          position: absolute;
          left: 21px;
          top: 16px;
          width: 38px;
          height: 40px;
          border-radius: 12px 12px 15px 15px;
          background: #f2b27b;
          border: 2px solid #9a5b35;
          z-index: 3;
        }

        .tech-hair {
          position: absolute;
          left: -2px;
          top: -2px;
          width: 40px;
          height: 13px;
          border-radius: 12px 12px 5px 5px;
          background: #292524;
        }

        .tech-eye {
          position: absolute;
          top: 19px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #111827;
        }

        .eye-left {
          left: 9px;
        }

        .eye-right {
          right: 9px;
        }

        .tech-smile {
          position: absolute;
          left: 14px;
          bottom: 7px;
          width: 10px;
          height: 5px;
          border-bottom: 2px solid #7c2d12;
          border-radius: 0 0 10px 10px;
        }

        .tech-cap {
          position: absolute;
          left: 16px;
          top: 7px;
          width: 48px;
          height: 15px;
          border-radius: 10px 10px 3px 3px;
          background: #2563eb;
          border: 2px solid #1e40af;
          z-index: 5;
        }

        .tech-cap::after {
          content: "";
          position: absolute;
          left: -6px;
          bottom: -2px;
          width: 22px;
          height: 6px;
          border-radius: 5px;
          background: #1e40af;
        }

        .tech-cap span {
          position: absolute;
          right: 7px;
          top: 1px;
          color: white;
          font-size: 9px;
          font-weight: 900;
        }

        .tech-body {
          position: absolute;
          left: 15px;
          top: 53px;
          width: 50px;
          height: 45px;
          border-radius: 10px;
          background: #2563eb;
          border: 2px solid #1e40af;
          z-index: 2;
        }

        .tech-logo {
          position: absolute;
          left: 50%;
          top: 11px;
          transform: translateX(-50%);
          color: white;
          font-weight: 900;
          font-size: 18px;
        }

        .tech-arm {
          position: absolute;
          top: 56px;
          width: 14px;
          height: 38px;
          border-radius: 8px;
          background: #2563eb;
          border: 2px solid #1e40af;
          z-index: 1;
        }

        .tech-arm-left {
          left: 8px;
          transform: rotate(25deg);
          animation: armLeft 1s steps(2) infinite;
        }

        .tech-arm-right {
          right: 6px;
          transform: rotate(-25deg);
          animation: armRight 1s steps(2) infinite;
        }

        .tech-hand {
          position: absolute;
          bottom: -5px;
          left: 1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #f2b27b;
        }

        .tech-legs {
          position: absolute;
          left: 20px;
          top: 96px;
          width: 40px;
          height: 35px;
          display: flex;
          gap: 5px;
        }

        .tech-leg {
          position: relative;
          width: 17px;
          height: 31px;
          border-radius: 0 0 7px 7px;
          background: #1f2937;
        }

        .tech-leg-left {
          animation: legLeft 1s steps(2) infinite;
        }

        .tech-leg-right {
          animation: legRight 1s steps(2) infinite;
        }

        .tech-shoe {
          position: absolute;
          bottom: -3px;
          width: 22px;
          height: 9px;
          border-radius: 8px;
          background: #111827;
        }

        .tech-leg-right .tech-shoe {
          right: -5px;
        }

        /* Tool */
        .wifi-tool {
          position: absolute;
          right: -22px;
          top: 62px;
          width: 22px;
          height: 35px;
          transform: rotate(-15deg);
          animation: toolMove 1s steps(2) infinite;
        }

        .tool-handle {
          position: absolute;
          bottom: 0;
          left: 8px;
          width: 6px;
          height: 17px;
          border-radius: 3px;
          background: #374151;
        }

        .tool-head {
          position: absolute;
          top: 0;
          width: 22px;
          height: 17px;
          border-radius: 4px;
          background: #9ca3af;
          border: 2px solid #4b5563;
        }

        /* Cable */
        .ethernet-cable {
          position: absolute;
          left: 50%;
          bottom: 75px;
          width: 150px;
          height: 40px;
          border-bottom: 3px solid #22c55e;
          border-radius: 0 0 80px 80px;
          opacity: 0.8;
          animation: cablePulse 2s ease-in-out infinite;
        }

        .cable-plug {
          position: absolute;
          right: -4px;
          bottom: -5px;
          width: 13px;
          height: 9px;
          background: #22c55e;
          border-radius: 2px;
        }

        /* Checkpoint */
        .checkpoint {
          position: absolute;
          right: 2%;
          bottom: 78px;
          height: 110px;
        }

        .checkpoint-pole {
          width: 3px;
          height: 110px;
          background: #9ca3af;
        }

        .checkpoint-flag {
          position: absolute;
          left: 3px;
          top: 3px;
          padding: 5px 9px;
          background: var(--color-accent);
          color: white;
          font-size: 8px;
          font-weight: 800;
          border-radius: 0 5px 5px 0;
          animation: flagWave 1.4s ease-in-out infinite;
        }

        /* =================================================
           LOGIN
        ================================================== */
        .login-button {
          transition:
            transform 0.15s ease,
            opacity 0.15s ease,
            box-shadow 0.15s ease;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(30, 136, 229, 0.2);
        }

        .login-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        /* =================================================
           KEYFRAMES
        ================================================== */
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: 0.45;
            transform: scale(0.75);
          }
        }

        @keyframes technicianWalk {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes legLeft {
          0%,
          100% {
            transform: rotate(8deg);
          }

          50% {
            transform: rotate(-15deg);
          }
        }

        @keyframes legRight {
          0%,
          100% {
            transform: rotate(-15deg);
          }

          50% {
            transform: rotate(8deg);
          }
        }

        @keyframes armLeft {
          0%,
          100% {
            transform: rotate(25deg);
          }

          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes armRight {
          0%,
          100% {
            transform: rotate(-25deg);
          }

          50% {
            transform: rotate(-5deg);
          }
        }

        @keyframes toolMove {
          0%,
          100% {
            transform: rotate(-15deg);
          }

          50% {
            transform: rotate(8deg);
          }
        }

        @keyframes routerFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes routerBlink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.25;
          }
        }

        @keyframes wifiWave {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.7);
          }

          30% {
            opacity: 0.9;
          }

          100% {
            opacity: 0;
            transform: translateX(-50%) scale(1.15);
          }
        }

        @keyframes nodePulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.25);
          }
        }

        @keyframes dataFlow {
          0% {
            opacity: 0.1;
            transform: translateX(-15px) rotate(-19deg);
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0.1;
            transform: translateX(15px) rotate(-19deg);
          }
        }

        @keyframes coinFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }

        @keyframes platformFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes cablePulse {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes flagWave {
          0%,
          100% {
            transform: skewY(0deg);
          }

          50% {
            transform: skewY(-4deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
