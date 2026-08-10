// components/SignalIndicator.tsx
interface SignalIndicatorProps {
  level: 0 | 1 | 2 | 3 | 4; // 0 = offline, 4 = sinyal penuh
  label?: string;
}

export default function SignalIndicator({ level, label }: SignalIndicatorProps) {
  const color =
    level === 0 ? "var(--color-signal-bad)" : level <= 2 ? "var(--color-signal-warn)" : "var(--color-signal-good)";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-[2px] h-3.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            style={{
              width: 3,
              height: `${bar * 3.5}px`,
              background: bar <= level ? color : "var(--color-border)",
              borderRadius: 1,
            }}
          />
        ))}
      </div>
      {label && <span className="text-sm" style={{ color }}>{label}</span>}
    </div>
  );
}