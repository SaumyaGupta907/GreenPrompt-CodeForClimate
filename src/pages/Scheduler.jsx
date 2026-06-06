import { useMemo, useState } from "react";
import { generateHeatmap, SCHED_JOBS, intensityColor } from "../data.js";
import { Panel } from "../components/ui.jsx";

const REGION_FILTERS = [
  { id: "any", label: "Any region", filter: () => true },
  { id: "us", label: "US only", filter: (code) => /^us-/.test(code) },
  { id: "eu", label: "EU only", filter: (code) => /^eu-/.test(code) },
  {
    id: "non-fossil",
    label: "Non-fossil only",
    filter: (code) =>
      ["ca-central-1", "eu-north-1", "us-central1"].includes(code),
  },
];

const DEADLINE_HOURS = { "6h": 6, "24h": 24, "72h": 72, "7d": 168 };

const TYPE_OPTIONS = [
  "Fine-tuning",
  "Embedding pipeline",
  "Batch evaluation",
  "Cron",
  "Software update",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Scheduler() {
  const heat = useMemo(() => generateHeatmap(), []);
  const [name, setName] = useState("Quarterly tenant-FAQ fine-tune");
  const [type, setType] = useState("Fine-tuning");
  const [gpuH, setGpuH] = useState(8);
  const [filter, setFilter] = useState("non-fossil");
  const [deadline, setDeadline] = useState("72h");
  const [rec, setRec] = useState(null);
  const [alts, setAlts] = useState([]);
  const [showAlts, setShowAlts] = useState(false);
  const [jobs, setJobs] = useState(SCHED_JOBS);
  const [toast, setToast] = useState(null);

  const findWindow = () => {
    const f = REGION_FILTERS.find((x) => x.id === filter);
    const hoursWindow = Math.min(72, DEADLINE_HOURS[deadline] || 72);
    const eligibleRows = heat.filter((r) => f.filter(r.code));

    // For each (region, hour) within the deadline window, score = gco2 × gpuH
    const candidates = [];
    eligibleRows.forEach((row, ri) => {
      for (let h = 0; h < hoursWindow; h++) {
        const g = row.cells[h];
        candidates.push({
          regionIdx: heat.findIndex((x) => x.code === row.code),
          regionName: row.name,
          regionCode: row.code,
          hourIdx: h,
          live_gco2: g,
          kg: +(gpuH * g * 0.0073).toFixed(2),
        });
      }
    });
    candidates.sort((a, b) => a.kg - b.kg);

    if (!candidates.length) {
      setToast({
        kind: "warn",
        text: "No regions match those constraints — try widening the filter.",
      });
      return;
    }

    const winner = candidates[0];
    const now = currentGridNow();
    const kg_now = +(gpuH * now.gco2 * 0.0073).toFixed(2);
    const top3 = candidates
      .slice(1, 4)
      .map((c) => ({ ...c, label: formatWindowLabel(c.hourIdx) }));

    setRec({
      ...winner,
      label: formatWindowLabel(winner.hourIdx),
      kg_at_window: winner.kg,
      kg_now,
      now_region: now.regionName,
      now_gco2: now.gco2,
      gpuH,
      filterUsed: filter,
    });
    setAlts(top3);
    setShowAlts(false);
    setToast(null);
  };

  const handleSchedule = () => {
    if (!rec) return;
    const id = "job_" + Math.random().toString(36).slice(2, 8);
    const newJob = {
      id,
      name,
      type,
      gpu_hours: gpuH,
      status: "pending",
      rec_region: `${rec.regionName} (${rec.regionCode})`,
      rec_time: rec.label,
      projected_kg: rec.kg_at_window,
    };
    setJobs((j) => [newJob, ...j]);
    setToast({
      kind: "ok",
      text: `Scheduled "${name}" for ${rec.label} in ${rec.regionName}`,
    });
    setTimeout(() => setToast(null), 3500);
  };

  const handleReschedule = (job) => {
    setName(job.name);
    setType(job.type);
    setGpuH(job.gpu_hours);
    setJobs((j) =>
      j.map((x) => (x.id === job.id ? { ...x, status: "pending" } : x)),
    );
    setRec(null);
    setShowAlts(false);
    setToast({
      kind: "ok",
      text: `Loaded "${job.name}" into the form — adjust and re-schedule.`,
    });
    setTimeout(() => setToast(null), 3500);
    document
      .querySelector(".scheduler-form-anchor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancel = (job) => {
    setJobs((j) => j.filter((x) => x.id !== job.id));
    setToast({ kind: "warn", text: `Cancelled "${job.name}"` });
    setTimeout(() => setToast(null), 2500);
  };

  const pickAlternative = (alt) => {
    setRec(
      (r) =>
        r && {
          ...r,
          regionIdx: alt.regionIdx,
          regionName: alt.regionName,
          regionCode: alt.regionCode,
          hourIdx: alt.hourIdx,
          live_gco2: alt.live_gco2,
          kg_at_window: alt.kg,
          label: alt.label,
        },
    );
    setShowAlts(false);
  };

  return (
    <div className="page-enter col gap-6">
      <div>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <span className="tag tag-peri">Time-shifting</span>
          <span className="tag" style={{ color: "var(--text-muted)" }}>
            Workload scheduler
          </span>
        </div>
        <h1>Run your heaviest jobs when the grid is greenest.</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, maxWidth: 660 }}>
          Tell us your deadline and we'll find the cleanest 72-hour window
          across 8 regions — backed by live grid forecasts and your acceptable
          region constraints.
        </p>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}
        className="scheduler-form-anchor"
      >
        <Panel title="Schedule a workload">
          <div className="col gap-4">
            <Field label="Job name">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Job type">
              <select
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label={`Estimated compute · ${gpuH} GPU-hours`}>
              <input
                type="range"
                min={1}
                max={48}
                value={gpuH}
                onChange={(e) => setGpuH(+e.target.value)}
                style={{ width: "100%", accentColor: "var(--acid)" }}
              />
            </Field>
            <Field label="Acceptable regions">
              <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                {REGION_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className="btn-chip btn"
                    style={{
                      borderColor:
                        filter === f.id ? "var(--acid)" : "var(--border)",
                      background:
                        filter === f.id ? "var(--acid-soft)" : undefined,
                      color: filter === f.id ? "var(--acid)" : "var(--text)",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Must complete within">
              <select
                className="select"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              >
                <option value="6h">6 hours</option>
                <option value="24h">24 hours</option>
                <option value="72h">72 hours</option>
                <option value="7d">7 days</option>
              </select>
            </Field>
            <button
              className="btn btn-primary"
              onClick={findWindow}
              style={{ alignSelf: "flex-start" }}
            >
              Find Best Window
            </button>
          </div>
        </Panel>

        <div
          style={{
            minHeight: 380,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {!rec ? (
            <Panel
              title="Recommendation"
              right={
                <span className="tag" style={{ color: "var(--text-muted)" }}>
                  awaiting input
                </span>
              }
            >
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 22,
                    color: "var(--text-h)",
                    marginBottom: 8,
                  }}
                >
                  Configure your job →
                </div>
                <div>
                  We'll scan 8 regions × 72 hours and pick the cleanest slot
                  inside your deadline.
                </div>
              </div>
            </Panel>
          ) : (
            <>
              <Recommendation
                rec={rec}
                onSchedule={handleSchedule}
                onToggleAlts={() => setShowAlts((v) => !v)}
                showAlts={showAlts}
                altCount={alts.length}
              />
              {showAlts && (
                <Alternatives alts={alts} onPick={pickAlternative} />
              )}
            </>
          )}
          {toast && <Toast t={toast} />}
        </div>
      </div>

      <Panel
        title="72-hour Carbon Forecast"
        right={
          <div className="row gap-3" style={{ fontSize: 11.5 }}>
            <Legend />
          </div>
        }
      >
        <Heatmap heat={heat} highlight={rec} />
      </Panel>

      <Panel
        title="Scheduled Jobs"
        right={
          <span className="tag" style={{ color: "var(--text-muted)" }}>
            {jobs.length} active
          </span>
        }
      >
        {jobs.length === 0 ? (
          <div
            style={{
              padding: "40px 0",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No jobs scheduled. Use the form above to add one.
          </div>
        ) : (
          <table
            className="tbl"
            style={{ margin: "0 -22px", width: "calc(100% + 44px)" }}
          >
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Name</th>
                <th>Status</th>
                <th>Recommended region · time</th>
                <th className="right">Projected CO₂</th>
                <th style={{ width: 200 }}></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td style={{ paddingLeft: 22 }}>
                    <div style={{ color: "var(--text-h)" }}>{j.name}</div>
                    <div
                      className="mono dim"
                      style={{ marginTop: 2, fontSize: 11 }}
                    >
                      {j.type} · {j.gpu_hours} GPU-h
                    </div>
                  </td>
                  <td>
                    <StatusTag s={j.status} />
                  </td>
                  <td className="mono">
                    {j.rec_region} · {j.rec_time}
                  </td>
                  <td className="right mono acid">
                    {j.projected_kg.toFixed(2)} kg
                  </td>
                  <td className="right" style={{ paddingRight: 22 }}>
                    <button
                      className="btn btn-chip"
                      onClick={() => handleReschedule(j)}
                    >
                      Reschedule
                    </button>{" "}
                    <button
                      className="btn btn-chip"
                      onClick={() => handleCancel(j)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────── */

function formatWindowLabel(hourIdx) {
  const now = new Date();
  const target = new Date(now.getTime() + hourIdx * 3600 * 1000);
  const day = DAYS[target.getDay()];
  const hh = String(target.getUTCHours()).padStart(2, "0");
  const mm = String(target.getUTCMinutes()).padStart(2, "0");
  return `${day} ${hh}:${mm} UTC`;
}

function currentGridNow() {
  // Demo assumption: queueing the job "right now" lands it in us-east-1 default.
  return { regionName: "us-east-1", gco2: 450 };
}

function Field({ label, children }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/* ── Recommendation card ─────────────────────────────────── */

function Recommendation({ rec, onSchedule, onToggleAlts, showAlts, altCount }) {
  const reduction = Math.round((1 - rec.kg_at_window / rec.kg_now) * 100);
  return (
    <div
      className="card"
      style={{
        padding: 26,
        background:
          "linear-gradient(135deg, rgba(200,255,61,0.08), rgba(124,141,255,0.04) 80%)",
        borderColor: "rgba(200,255,61,0.3)",
      }}
    >
      <div className="row gap-2" style={{ marginBottom: 10 }}>
        <span className="tag tag-acid">
          <span className="dot" /> Recommended
        </span>
        <span className="tag" style={{ color: "var(--text-muted)" }}>
          {rec.gpuH} GPU-h · {rec.filterUsed}
        </span>
      </div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, marginBottom: 8 }}>
        {rec.regionName} · {rec.label}
      </h2>
      <p
        style={{
          color: "var(--text)",
          fontSize: 13,
          lineHeight: 1.6,
          maxWidth: 560,
        }}
      >
        Grid intensity at that window is{" "}
        <strong className="acid">{rec.live_gco2} gCO₂/kWh</strong> — among the
        cleanest slots in the next 72 hours within your constraints.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 18,
        }}
      >
        <div
          className="card"
          style={{ padding: 14, background: "rgba(255,255,255,0.02)" }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Run in recommended window
          </div>
          <div className="bigstat acid" style={{ fontSize: 28, marginTop: 6 }}>
            {rec.kg_at_window} kg CO₂
          </div>
        </div>
        <div
          className="card"
          style={{ padding: 14, background: "rgba(255,77,94,0.05)" }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            If you ran it now ({rec.now_region})
          </div>
          <div
            className="bigstat critical"
            style={{ fontSize: 28, marginTop: 6 }}
          >
            {rec.kg_now} kg CO₂
          </div>
        </div>
      </div>

      <div
        className="row"
        style={{ marginTop: 18, justifyContent: "space-between" }}
      >
        <div className="row gap-3">
          <button className="btn btn-primary" onClick={onSchedule}>
            Schedule
          </button>
          <button className="btn" onClick={onToggleAlts}>
            {showAlts ? "Hide" : "Show"} {altCount} alternatives
          </button>
        </div>
        <div className="num acid" style={{ fontSize: 30 }}>
          −{reduction}%
        </div>
      </div>
    </div>
  );
}

function Alternatives({ alts, onPick }) {
  return (
    <div
      className="card"
      style={{ padding: 18, animation: "page-in 320ms both" }}
    >
      <h4 style={{ marginBottom: 12 }}>Alternative windows</h4>
      <div className="col" style={{ gap: 8 }}>
        {alts.map((a, i) => (
          <button
            key={i}
            onClick={() => onPick(a)}
            className="row"
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.018)",
              cursor: "pointer",
              textAlign: "left",
              color: "var(--text-h)",
              fontSize: 13,
            }}
          >
            <div>
              <div style={{ color: "var(--text-h)" }}>{a.regionName}</div>
              <div className="mono dim" style={{ fontSize: 11, marginTop: 2 }}>
                {a.label} · {a.live_gco2} gCO₂/kWh
              </div>
            </div>
            <div className="row gap-3">
              <div className="num acid" style={{ fontSize: 18 }}>
                {a.kg} kg
              </div>
              <span className="dim" style={{ fontSize: 12 }}>
                swap →
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Toast({ t }) {
  return (
    <div
      className="card"
      style={{
        padding: "10px 14px",
        background:
          t.kind === "ok" ? "rgba(200,255,61,0.08)" : "rgba(255,185,56,0.08)",
        borderColor:
          t.kind === "ok" ? "var(--border-glow)" : "rgba(255,185,56,0.3)",
        fontSize: 12.5,
        color: t.kind === "ok" ? "var(--acid)" : "var(--amber)",
        animation: "page-in 280ms both",
      }}
    >
      {t.text}
    </div>
  );
}

function Legend() {
  const stops = [40, 120, 240, 360, 480];
  return (
    <div
      className="row gap-2"
      style={{ alignItems: "center", color: "var(--text-muted)" }}
    >
      <span style={{ fontSize: 11 }}>cleaner</span>
      <div className="row" style={{ gap: 2 }}>
        {stops.map((s) => (
          <div
            key={s}
            style={{
              width: 16,
              height: 10,
              background: intensityColor(s),
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11 }}>dirtier</span>
    </div>
  );
}

function Heatmap({ heat, highlight }) {
  return (
    <div style={{ overflowX: "auto", margin: "0 -22px", padding: "0 22px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr",
          gap: 8,
          minWidth: 880,
        }}
      >
        <div />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(72, 1fr)",
            gap: 2,
            marginBottom: 4,
            fontSize: 10,
            color: "var(--text-dim)",
          }}
        >
          {Array.from({ length: 72 }).map((_, h) => (
            <div
              key={h}
              style={{ textAlign: "center", fontFamily: "var(--mono)" }}
            >
              {h % 6 === 0 ? `+${h}h` : ""}
            </div>
          ))}
        </div>

        {heat.map((row, ri) => (
          <Row key={row.code} row={row} ri={ri} highlight={highlight} />
        ))}
      </div>
    </div>
  );
}

function Row({ row, ri, highlight }) {
  const isHighlightRow = highlight && highlight.regionIdx === ri;
  return (
    <>
      <div
        className="row"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          paddingRight: 12,
          fontSize: 12,
        }}
      >
        <div>
          <div style={{ color: "var(--text-h)" }}>{row.name}</div>
          <div className="mono dim" style={{ fontSize: 10.5, marginTop: 2 }}>
            {row.code}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(72, 1fr)",
          gap: 2,
        }}
      >
        {row.cells.map((v, h) => {
          const isHL = isHighlightRow && highlight.hourIdx === h;
          return (
            <div
              key={h}
              className="heat-cell"
              style={{
                background: intensityColor(v),
                opacity: 0.85,
                outline: isHL ? "2px solid var(--acid)" : undefined,
                boxShadow: isHL
                  ? "0 0 0 4px rgba(200,255,61,0.25), 0 0 14px var(--acid-glow)"
                  : undefined,
                animation: `cell-in 400ms ${ri * 18 + h * 2}ms both`,
              }}
              title={`${row.name} · +${h}h — ${v} gCO₂/kWh`}
            />
          );
        })}
      </div>
      <style>{`@keyframes cell-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 0.85; transform: scale(1); } }`}</style>
    </>
  );
}

function StatusTag({ s }) {
  if (s === "running")
    return (
      <span className="tag tag-amber">
        <span className="dot dot-coral" />
        running
      </span>
    );
  if (s === "done") return <span className="tag tag-peri">done</span>;
  return <span className="tag">pending</span>;
}
