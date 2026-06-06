import { useEffect, useState } from "react";

/* ── Icons (declared first so NAV can reference them safely under React Fast Refresh) ── */
function IconBase({ children }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
const IconGrid = () => (
  <IconBase>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </IconBase>
);
const IconGlobe = () => (
  <IconBase>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </IconBase>
);
const IconRoute = () => (
  <IconBase>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
  </IconBase>
);
const IconReceipt = () => (
  <IconBase>
    <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </IconBase>
);
const IconClock = () => (
  <IconBase>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </IconBase>
);

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: IconGrid },
  { id: "map", label: "Global Map", icon: IconGlobe },
  { id: "routing", label: "Live Routing", icon: IconRoute },
  { id: "receipts", label: "Receipts & Reports", icon: IconReceipt },
  { id: "scheduler", label: "Scheduler", icon: IconClock },
];

export default function Layout({ page, setPage, view, setView, children }) {
  const [nycG, setNycG] = useState(412);
  useEffect(() => {
    const id = setInterval(() => {
      setNycG((v) =>
        Math.max(
          280,
          Math.min(540, v + Math.round((Math.random() - 0.5) * 40)),
        ),
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const isEndUser = view === "enduser";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        zIndex: 2,
      }}
    >
      {!isEndUser && (
        <aside
          style={{
            width: 232,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            background: "rgba(7,8,13,0.6)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <Logo />

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                padding: "0 12px 8px",
                fontSize: 11,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Workspace
            </div>
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={"nav-item" + (page === n.id ? " active" : "")}
                  onClick={() => setPage(n.id)}
                >
                  <Icon />
                  {n.label}
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "auto",
              padding: 14,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Customer
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 15,
                color: "var(--text-h)",
              }}
            >
              Brooklyn AI Co
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              2.1M queries / month
            </div>
            <div
              className="row gap-2"
              style={{ marginTop: 10, fontSize: 11, color: "var(--acid)" }}
            >
              <span className="dot" />
              Carbon-aware routing on
            </div>
          </div>
        </aside>
      )}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TopBar
          nycG={nycG}
          view={view}
          setView={setView}
          isEndUser={isEndUser}
        />
        <div
          style={{
            padding: "28px 36px 64px",
            maxWidth: 1320,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function TopBar({ nycG, view, setView, isEndUser }) {
  const trend = nycG > 412 ? "↑" : nycG < 412 ? "↓" : "→";
  const status =
    nycG > 460
      ? "peakers active"
      : nycG > 380
        ? "heat wave — peakers active"
        : "grid easing";
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        height: 60,
        borderBottom: "1px solid var(--border)",
        background: "rgba(7,8,13,0.7)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {isEndUser && <Logo compact />}
        {!isEndUser && (
          <div
            className="row gap-2"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            <span style={{ color: "var(--text-h)", fontWeight: 500 }}>
              Console
            </span>
            <span style={{ color: "var(--text-dim)" }}>/</span>
            <span>{view === "admin" ? "Admin" : "End User"}</span>
          </div>
        )}
      </div>

      <div className="banner-pill">
        <span className="dot dot-coral" />
        <span className="label">NYC Grid</span>
        <span className="val mono">{nycG} gCO₂/kWh</span>
        <span
          style={{
            color: nycG > 412 ? "var(--critical)" : "var(--acid)",
            fontWeight: 600,
          }}
        >
          {trend}
        </span>
        <span style={{ color: "var(--text-muted)" }}>{status}</span>
      </div>

      <div className="toggle">
        <button
          className={view === "admin" ? "on" : ""}
          onClick={() => setView("admin")}
        >
          Admin View
        </button>
        <button
          className={view === "enduser" ? "on" : ""}
          onClick={() => setView("enduser")}
        >
          End User View
        </button>
      </div>
    </header>
  );
}

export function Logo({ compact }) {
  return (
    <div
      className="row gap-2"
      style={{ alignItems: "center", padding: compact ? 0 : "0 8px" }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--acid)",
          boxShadow:
            "0 0 12px var(--acid-glow), 0 0 0 3px rgba(200,255,61,0.08)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--serif)",
          fontSize: 19,
          color: "var(--text-h)",
          letterSpacing: "-0.02em",
          fontWeight: 500,
        }}
      >
        GreenPrompt
      </span>
    </div>
  );
}
