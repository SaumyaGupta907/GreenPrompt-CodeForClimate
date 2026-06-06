import { useEffect, useRef, useState } from "react";
import { intensityColor } from "../data.js";

/* ── Animated counter ───────────────────────────────────────── */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1100,
  prefix = "",
  suffix = "",
  animateMount = true,
}) {
  const initial = animateMount ? 0 : Number(value) || 0;
  const [display, setDisplay] = useState(initial);
  const fromRef = useRef(initial);
  const startRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const to = Number(value) || 0;
    if (!mountedRef.current && !animateMount) {
      mountedRef.current = true;
      fromRef.current = to;
      setDisplay(to);
      return;
    }
    mountedRef.current = true;
    const from = fromRef.current;
    startRef.current = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, animateMount]);

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ── Stat Card ──────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon,
  accent = "acid",
  big = true,
}) {
  return (
    <div
      className="card hoverable"
      style={{
        padding: 22,
        position: "relative",
        overflow: "hidden",
        minHeight: 158,
      }}
    >
      <div
        className="row"
        style={{ justifyContent: "space-between", marginBottom: 18 }}
      >
        <h4 style={{ margin: 0 }}>{label}</h4>
        {icon && (
          <span
            className={"tag tag-" + accent}
            style={{ background: "transparent", border: "none", padding: 0 }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className={big ? "bigstat" : "num"}
        style={{ fontSize: big ? undefined : 28 }}
      >
        {value}
      </div>
      {(subtitle || trend) && (
        <div
          className="row gap-2"
          style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}
        >
          {trend && (
            <span className={"acid"} style={{ fontWeight: 500 }}>
              {trend}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
      {/* Subtle inner glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(circle at 100% 0%, var(--${accent === "acid" ? "acid-soft" : accent === "peri" ? "peri-soft" : "coral-soft"}), transparent 50%)`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

/* ── Section / panel wrappers ───────────────────────────────── */
export function Panel({ title, right, children, padding = 22, style }) {
  return (
    <div className="card" style={{ padding, ...style }}>
      {(title || right) && (
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 18,
          }}
        >
          {title && (
            <h3
              style={{
                fontFamily: "var(--serif)",
                fontSize: 17,
                color: "var(--text-h)",
              }}
            >
              {title}
            </h3>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          className="row"
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ fontFamily: "var(--serif)" }}>{title}</h3>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: "6px 10px" }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Slide-over ─────────────────────────────────────────────── */
export function SlideOver({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="slideover-overlay" onClick={onClose} />
      <div className="slideover-panel">
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "rgba(10,12,20,0.95)",
            backdropFilter: "blur(10px)",
            zIndex: 2,
          }}
        >
          <h3 style={{ fontFamily: "var(--serif)" }}>{title}</h3>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: "6px 10px" }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </>
  );
}

/* ── Line chart (custom SVG) ────────────────────────────────── */
export function LineChart({ data, height = 220 }) {
  // data: [{ date, default, actual }]
  const width = 720;
  const padX = 36,
    padY = 26;
  const max = Math.max(...data.flatMap((d) => [d.default, d.actual])) * 1.12;
  const min = 0;
  const x = (i) => padX + (i / (data.length - 1)) * (width - padX * 2);
  const y = (v) => padY + (1 - (v - min) / (max - min)) * (height - padY * 2);

  const pathDefault = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.default)}`)
    .join(" ");
  const pathActual = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.actual)}`)
    .join(" ");
  const fillActual =
    `M ${x(0)} ${y(0)} ` +
    data.map((d, i) => `L ${x(i)} ${y(d.actual)}`).join(" ") +
    ` L ${x(data.length - 1)} ${y(0)} Z`;

  // gridlines
  const lines = [0.25, 0.5, 0.75, 1].map((p) => padY + p * (height - padY * 2));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height, display: "block" }}
    >
      <defs>
        <linearGradient id="actualFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--acid)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--acid)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map((ly, i) => (
        <line
          key={i}
          x1={padX}
          x2={width - padX}
          y1={ly}
          y2={ly}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 4"
        />
      ))}
      <path d={fillActual} fill="url(#actualFill)" />
      <path
        d={pathDefault}
        fill="none"
        stroke="var(--critical)"
        strokeWidth="1.8"
        strokeDasharray="5 4"
        opacity="0.85"
        className="draw-in"
      />
      <path
        d={pathActual}
        fill="none"
        stroke="var(--acid)"
        strokeWidth="2.2"
        className="draw-in delay"
      />
      {/* End-point dots */}
      <circle
        cx={x(data.length - 1)}
        cy={y(data[data.length - 1].actual)}
        r="4"
        fill="var(--acid)"
      >
        <animate
          attributeName="r"
          values="4;6;4"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx={x(data.length - 1)}
        cy={y(data[data.length - 1].default)}
        r="3"
        fill="var(--critical)"
      />

      {/* labels */}
      <text
        x={padX}
        y={height - 6}
        fill="var(--text-dim)"
        fontSize="10"
        fontFamily="var(--mono)"
      >
        {data[0].date.slice(5)}
      </text>
      <text
        x={width - padX}
        y={height - 6}
        fill="var(--text-dim)"
        fontSize="10"
        fontFamily="var(--mono)"
        textAnchor="end"
      >
        {data[data.length - 1].date.slice(5)}
      </text>
      <text
        x={width - padX - 4}
        y={y(data[data.length - 1].actual) - 8}
        fill="var(--acid)"
        fontSize="11"
        fontFamily="var(--mono)"
        textAnchor="end"
      >
        {data[data.length - 1].actual} kg/day
      </text>
      <text
        x={width - padX - 4}
        y={y(data[data.length - 1].default) - 8}
        fill="var(--critical)"
        fontSize="11"
        fontFamily="var(--mono)"
        textAnchor="end"
      >
        {data[data.length - 1].default} kg/day
      </text>
    </svg>
  );
}

/* ── Bar chart (horizontal) ─────────────────────────────────── */
export function BarChart({ data, maxValue }) {
  const max = maxValue || Math.max(...data.map((d) => d.value));
  return (
    <div className="col gap-3" style={{ gap: 14 }}>
      {data.map((d, i) => (
        <div
          key={d.label}
          style={{ animation: `page-in 480ms ${i * 80}ms both` }}
        >
          <div
            className="row"
            style={{
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: 12.5,
            }}
          >
            <span style={{ color: "var(--text-h)" }}>{d.label}</span>
            <span className="mono" style={{ color: "var(--text-muted)" }}>
              {d.suffix
                ? `${d.value.toLocaleString()} ${d.suffix}`
                : d.value.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(d.value / max) * 100}%`,
                background:
                  i === 0
                    ? "linear-gradient(90deg, var(--coral), var(--critical))"
                    : i === 1
                      ? "linear-gradient(90deg, var(--coral), #ff9e8c)"
                      : "linear-gradient(90deg, var(--peri), var(--acid))",
                borderRadius: 999,
                animation: "grow-bar 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
                animationDelay: `${i * 80 + 150}ms`,
                transformOrigin: "left center",
              }}
            />
          </div>
        </div>
      ))}
      <style>{`@keyframes grow-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </div>
  );
}

/* ── Inline carbon-intensity meter ──────────────────────────── */
export function IntensityBar({ value, max = 600, height = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      style={{
        height,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 999,
        overflow: "hidden",
        minWidth: 80,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: intensityColor(value),
          borderRadius: 999,
          transition: "width 400ms ease",
        }}
      />
    </div>
  );
}
