"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, User, CalendarCheck, Wallet, TrendingUp, Banknote } from "lucide-react";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export default function AsistenHrPage() {
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(function () {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatLog]);

  async function handleAction(action: string, label: string) {
    setChatLog(function (prev) { return [...prev, { role: "user", text: label }]; });
    setLoading(true);

    try {
      const res = await fetch("/api/bot-hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      setChatLog(function (prev) { return [...prev, { role: "bot", text: json.reply }]; });
    } catch {
      setChatLog(function (prev) { return [...prev, { role: "bot", text: "Terjadi kesalahan, coba lagi." }]; });
    } finally {
      setLoading(false);
    }
  }

  const menuList = [
    { action: "absensi_hari_ini", label: "Absensi Hari Ini", icon: CalendarCheck },
    { action: "kasbon_pending", label: "Kasbon Pending", icon: Wallet },
    { action: "komisi_pending", label: "Komisi Pending", icon: TrendingUp },
    { action: "payroll_bulan_ini", label: "Payroll Bulan Ini", icon: Banknote },
  ];

  return (
    <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <h1 className="text-2xl font-semibold mb-1">Bot HR</h1>
      <p className="text-sm mb-4" style={{ color: "var(--color-ink-muted)" }}>
        Klik tombol untuk cek data absensi, kasbon, payroll, dan komisi
      </p>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {menuList.map(function (m) {
          const Icon = m.icon;
          return (
            <button
              key={m.action}
              onClick={function () { handleAction(m.action, m.label); }}
              disabled={loading}
              className="p-3 rounded-lg text-sm font-medium flex flex-col items-center gap-2"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)", opacity: loading ? 0.6 : 1 }}
            >
              <Icon size={20} color="var(--color-accent)" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 rounded-lg p-4 overflow-y-auto"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {chatLog.length === 0 && (
          <div className="text-center py-8">
            <Bot size={32} color="var(--color-ink-muted)" style={{ margin: "0 auto 12px" }} />
            <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>Klik salah satu tombol di atas untuk mulai</p>
          </div>
        )}

        {chatLog.map(function (msg, i) {
          return (
            <div key={i} className="flex gap-2 mb-4" style={{ flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: msg.role === "user" ? "var(--color-accent)" : "var(--color-bg)" }}
              >
                {msg.role === "user" ? <User size={16} color="white" /> : <Bot size={16} color="var(--color-accent)" />}
              </div>
              <div
                className="px-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: msg.role === "user" ? "var(--color-accent)" : "var(--color-bg)",
                  color: msg.role === "user" ? "white" : "var(--color-ink)",
                  maxWidth: "75%",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
              <Bot size={16} color="var(--color-accent)" />
            </div>
            <div className="px-4 py-2.5 rounded-lg text-sm" style={{ background: "var(--color-bg)", color: "var(--color-ink-muted)" }}>
              Memuat...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}