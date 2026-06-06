import { useMemo, useState } from 'react';
import { generateHeatmap, SCHED_JOBS, intensityColor } from '../data.js';
import { Panel } from '../components/ui.jsx';

const REGION_FILTERS = [
  { id: 'any',         label: 'Any region' },
  { id: 'us',          label: 'US only' },
  { id: 'eu',          label: 'EU only' },
  { id: 'non-fossil',  label: 'Non-fossil only' },
];

export default function Scheduler() {
  const heat = useMemo(() => generateHeatmap(), []);
  const [name, setName] = useState('Quarterly tenant-FAQ fine-tune');
  const [type, setType] = useState('Fine-tuning');
  const [gpuH, setGpuH] = useState(8);
  const [filter, setFilter] = useState('non-fossil');
  const [deadline, setDeadline] = useState('72h');
  const [rec, setRec] = useState(null);
  const [jobs, setJobs] = useState(SCHED_JOBS);

  const findWindow = () => {
    // Animate to the recommendation. We'll always pick Quebec ~hour 27 (Tue 03:42)
    // for the demo since it has the lowest projected dip.
    const recRegionIdx = heat.findIndex(r => r.code === 'ca-central-1');
    const cells = heat[recRegionIdx].cells;
    const minIdx = cells.indexOf(Math.min(...cells.slice(20, 36)));
    const safeIdx = minIdx >= 0 ? minIdx : 27;
    setRec({
      region: heat[recRegionIdx].name,
      code: heat[recRegionIdx].code,
      regionIdx: recRegionIdx,
      hourIdx: safeIdx,
      live_gco2: cells[safeIdx],
      now_gco2: 450,           // assume queue-now lands in us-east-1
      kg_at_window: +(gpuH * cells[safeIdx] * 0.0073).toFixed(2),
      kg_now:       +(gpuH * 450 * 0.0073).toFixed(2),
    });
  };

  return (
    <div className="page-enter col gap-6">
      <div>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <span className="tag tag-peri">Time-shifting</span>
          <span className="tag" style={{ color: 'var(--text-muted)' }}>Workload scheduler</span>
        </div>
        <h1>Run your heaviest jobs when the grid is greenest.</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 660 }}>
          Tell us your deadline and we'll find the cleanest 72-hour window across 8 regions — backed by
          live grid forecasts and your acceptable region constraints.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        <Panel title="Schedule a workload">
          <div className="col gap-4">
            <Field label="Job name">
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Job type">
              <select className="select" value={type} onChange={e => setType(e.target.value)}>
                <option>Fine-tuning</option>
                <option>Embedding pipeline</option>
                <option>Batch evaluation</option>
                <option>Cron</option>
                <option>Software update</option>
              </select>
            </Field>
            <Field label={`Estimated compute · ${gpuH} GPU-hours`}>
              <input type="range" min={1} max={48} value={gpuH} onChange={e => setGpuH(+e.target.value)} style={{ width: '100%', accentColor: 'var(--acid)' }} />
            </Field>
            <Field label="Acceptable regions">
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {REGION_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className="btn-chip btn"
                    style={{
                      borderColor: filter === f.id ? 'var(--acid)' : 'var(--border)',
                      background: filter === f.id ? 'var(--acid-soft)' : undefined,
                      color: filter === f.id ? 'var(--acid)' : 'var(--text)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Must complete within">
              <select className="select" value={deadline} onChange={e => setDeadline(e.target.value)}>
                <option value="6h">6 hours</option>
                <option value="24h">24 hours</option>
                <option value="72h">72 hours</option>
                <option value="7d">7 days</option>
              </select>
            </Field>
            <button className="btn btn-primary" onClick={findWindow} style={{ alignSelf: 'flex-start' }}>
              Find Best Window
            </button>
          </div>
        </Panel>

        <div style={{ minHeight: 380 }}>
          {!rec ? (
            <Panel title="Recommendation" right={<span className="tag" style={{ color: 'var(--text-muted)' }}>awaiting input</span>}>
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text-h)', marginBottom: 8 }}>
                  Configure your job →
                </div>
                <div>We'll scan 8 regions × 72 hours and pick the cleanest slot inside your deadline.</div>
              </div>
            </Panel>
          ) : (
            <Recommendation rec={rec} />
          )}
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

      <Panel title="Scheduled Jobs">
        <table className="tbl" style={{ margin: '0 -22px', width: 'calc(100% + 44px)' }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 22 }}>Name</th>
              <th>Status</th>
              <th>Recommended region · time</th>
              <th className="right">Projected CO₂</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id}>
                <td style={{ paddingLeft: 22 }}>
                  <div style={{ color: 'var(--text-h)' }}>{j.name}</div>
                  <div className="mono dim" style={{ marginTop: 2, fontSize: 11 }}>{j.type} · {j.gpu_hours} GPU-h</div>
                </td>
                <td><StatusTag s={j.status} /></td>
                <td className="mono">{j.rec_region} · {j.rec_time}</td>
                <td className="right mono acid">{j.projected_kg.toFixed(2)} kg</td>
                <td className="right" style={{ paddingRight: 22 }}>
                  <button className="btn btn-chip" onClick={() => setJobs(j2 => j2.map(x => x.id === j.id ? { ...x, status: 'pending' } : x))}>Reschedule</button>{' '}
                  <button className="btn btn-chip" onClick={() => setJobs(j2 => j2.filter(x => x.id !== j.id))}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function Recommendation({ rec }) {
  const reduction = Math.round((1 - rec.kg_at_window / rec.kg_now) * 100);
  return (
    <div className="card" style={{ padding: 26, background: 'linear-gradient(135deg, rgba(200,255,61,0.08), rgba(124,141,255,0.04) 80%)', borderColor: 'rgba(200,255,61,0.3)' }}>
      <div className="row gap-2" style={{ marginBottom: 10 }}>
        <span className="tag tag-acid"><span className="dot" /> Recommended</span>
        <span className="tag" style={{ color: 'var(--text-muted)' }}>72-hour window</span>
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, marginBottom: 8 }}>
        {rec.region} · Tuesday 03:42 UTC
      </h2>
      <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6, maxWidth: 560 }}>
        Quebec's grid is sitting at <strong className="acid">{rec.live_gco2} gCO₂/kWh</strong> and projected to drop further
        as overnight hydro output peaks. Latency and availability constraints satisfied; no fossil generation in the mix.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
        <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Run in recommended window</div>
          <div className="bigstat acid" style={{ fontSize: 30, marginTop: 6 }}>{rec.kg_at_window} kg CO₂</div>
        </div>
        <div className="card" style={{ padding: 14, background: 'rgba(255,77,94,0.05)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>If you ran it now (us-east-1)</div>
          <div className="bigstat critical" style={{ fontSize: 30, marginTop: 6 }}>{rec.kg_now} kg CO₂</div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 18, justifyContent: 'space-between' }}>
        <div className="row gap-3">
          <button className="btn btn-primary">Schedule</button>
          <button className="btn">Show 3 alternatives</button>
        </div>
        <div className="num acid" style={{ fontSize: 30 }}>−{reduction}%</div>
      </div>
    </div>
  );
}

function Legend() {
  const stops = [40, 120, 240, 360, 480];
  return (
    <div className="row gap-2" style={{ alignItems: 'center', color: 'var(--text-muted)' }}>
      <span style={{ fontSize: 11 }}>cleaner</span>
      <div className="row" style={{ gap: 2 }}>
        {stops.map(s => <div key={s} style={{ width: 16, height: 10, background: intensityColor(s), borderRadius: 2 }} />)}
      </div>
      <span style={{ fontSize: 11 }}>dirtier</span>
    </div>
  );
}

function Heatmap({ heat, highlight }) {
  return (
    <div style={{ overflowX: 'auto', margin: '0 -22px', padding: '0 22px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, minWidth: 880 }}>
        <div /> {/* spacer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(72, 1fr)', gap: 2, marginBottom: 4, fontSize: 10, color: 'var(--text-dim)' }}>
          {Array.from({ length: 72 }).map((_, h) => (
            <div key={h} style={{ textAlign: 'center', fontFamily: 'var(--mono)' }}>
              {h % 6 === 0 ? `+${h}h` : ''}
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
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', paddingRight: 12, fontSize: 12 }}>
        <div>
          <div style={{ color: 'var(--text-h)' }}>{row.name}</div>
          <div className="mono dim" style={{ fontSize: 10.5, marginTop: 2 }}>{row.code}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(72, 1fr)', gap: 2 }}>
        {row.cells.map((v, h) => {
          const isHL = isHighlightRow && highlight.hourIdx === h;
          return (
            <div
              key={h}
              className="heat-cell"
              style={{
                background: intensityColor(v),
                opacity: 0.85,
                outline: isHL ? '2px solid var(--acid)' : undefined,
                boxShadow: isHL ? '0 0 0 4px rgba(200,255,61,0.25), 0 0 14px var(--acid-glow)' : undefined,
                animation: `cell-in 400ms ${(ri * 18 + h * 2)}ms both`,
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
  if (s === 'running') return <span className="tag tag-amber"><span className="dot dot-coral" />running</span>;
  if (s === 'done')    return <span className="tag tag-peri">done</span>;
  return <span className="tag">pending</span>;
}
