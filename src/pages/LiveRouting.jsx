import { useEffect, useRef, useState } from 'react';
import {
  EXAMPLE_PROMPTS, pickGreenPromptRoute, pickDefaultRoute,
  classifyPrompt, tierLabel, intensityColor, REGIONS,
} from '../data.js';
import { Panel } from '../components/ui.jsx';

const STEPS = [
  { id: 0, label: 'Classifying prompt complexity', detail: t => t ? `detected tier: ${tierLabel(t)}` : 'inspecting tokens & signals…' },
  { id: 1, label: 'Scanning 8 regions for current carbon intensity', detail: () => 'NYC 412 · us-east-1 450 · Quebec 30 …' },
  { id: 2, label: 'Filtering by 500 ms latency budget', detail: () => 'dropping ap-northeast-1 (180 ms — kept)…' },
  { id: 3, label: 'Selected route', detail: (t, r) => r ? `${r.model.name} in ${r.region.name}` : '' },
];

export default function LiveRouting() {
  const [text, setText] = useState('');
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState(null);   // green route
  const [naive, setNaive] = useState(null);     // default route
  const [showLogic, setShowLogic] = useState(true);
  const [busy, setBusy] = useState(false);
  const tickRef = useRef(0);

  useEffect(() => () => clearTimeout(window.__gp_to), []);

  const reset = () => { setStep(-1); setResult(null); setNaive(null); };

  const runGreen = () => {
    if (!text.trim() || busy) return;
    reset();
    setBusy(true);
    tickRef.current += 1;
    const tick = tickRef.current;
    const route = pickGreenPromptRoute(text, { tick });
    const def = pickDefaultRoute(text, { tick });
    const timings = [0, 650, 1250, 1900, 2500];
    timings.forEach((ms, i) => {
      setTimeout(() => {
        setStep(i - 1);
        if (i === timings.length - 1) {
          setResult(route);
          setNaive(def);
          setBusy(false);
        }
      }, ms);
    });
  };

  const runNaive = () => {
    if (!text.trim() || busy) return;
    reset();
    tickRef.current += 1;
    const tick = tickRef.current;
    const def = pickDefaultRoute(text, { tick });
    const route = pickGreenPromptRoute(text, { tick });
    setStep(3);
    setResult(route);
    setNaive(def);
  };

  const classify = text ? classifyPrompt(text) : null;
  const detail = (idx) => STEPS[idx].detail(classify?.tier, result);

  return (
    <div className="page-enter col gap-6">
      <div>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <span className="tag tag-acid"><span className="dot" /> Live</span>
          <span className="tag" style={{ color: 'var(--text-muted)' }}>Decision engine</span>
        </div>
        <h1>Try it live.</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 660 }}>
          Type a query like one of your end users would. Watch GreenPrompt classify it, scan grids in real time,
          and select the smallest capable model in the cleanest region — within your 500&nbsp;ms budget.
        </p>
      </div>

      <Panel padding={26}>
        <textarea
          className="textarea"
          rows={3}
          placeholder="Type a query as your end user would..."
          value={text}
          onChange={e => setText(e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
          {EXAMPLE_PROMPTS.map(ex => (
            <button key={ex.text} className="example-chip" onClick={() => { setText(ex.text); reset(); }}>
              <span className="tier">{ex.hint}</span>
              <span style={{ color: 'var(--text-h)' }}>{ex.text}</span>
            </button>
          ))}
        </div>

        <div className="row gap-3" style={{ marginTop: 18 }}>
          <button className="btn btn-primary" onClick={runGreen} disabled={!text.trim() || busy}>
            {busy ? 'Routing…' : 'Route with GreenPrompt'}
          </button>
          <button className="btn" onClick={runNaive} disabled={!text.trim() || busy}>
            Route Naïvely (default)
          </button>
          <div className="row gap-2" style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-muted)' }}>
            <kbd className="kbd">Latency budget</kbd>
            <span className="mono" style={{ color: 'var(--text-h)' }}>500 ms</span>
          </div>
        </div>
      </Panel>

      {step >= 0 && (
        <Panel title="Decision sequence" right={<span className="tag" style={{ color: 'var(--text-muted)' }}>≈ 2.5s</span>}>
          <div className="col gap-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className={'step' + (step === i ? ' active' : step > i ? ' done' : '')}>
                <div className="step-icon">{step > i ? '✓' : i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-h)', fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                  <div className="mono" style={{ color: 'var(--text-muted)', marginTop: 3, fontSize: 11.5 }}>
                    {step >= i ? detail(i) : '—'}
                  </div>
                </div>
                {step === i && <div className="shimmer" style={{ width: 80, height: 20, borderRadius: 4 }} />}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {result && naive && <ComparePanels green={result} naive={naive} />}

      <Panel
        title="Routing logic"
        right={<button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setShowLogic(v => !v)}>{showLogic ? 'Hide' : 'Show'}</button>}
      >
        {showLogic && <LogicTree />}
      </Panel>
    </div>
  );
}

/* ─────── compare side-by-side ─────── */
function ComparePanels({ green, naive }) {
  const co2Ratio = naive.totalCO2 / green.totalCO2;
  const waterRatio = naive.totalWater / green.totalWater;
  return (
    <div className="col gap-4">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <RouteReceipt route={green} good />
        <RouteReceipt route={naive} />
      </div>
      <div
        className="card"
        style={{
          padding: 22,
          background: 'linear-gradient(95deg, rgba(200,255,61,0.12), rgba(124,141,255,0.06) 80%)',
          borderColor: 'rgba(200,255,61,0.3)',
        }}
      >
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net savings on this query</div>
            <div className="bigstat" style={{ marginTop: 6 }}>
              <span className="acid">{co2Ratio.toFixed(1)}×</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 24, marginLeft: 8 }}>less CO₂</span>
              <span className="dim" style={{ fontSize: 28, margin: '0 14px' }}>·</span>
              <span className="acid">{waterRatio.toFixed(1)}×</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 24, marginLeft: 8 }}>less water</span>
            </div>
          </div>
          <div className="col gap-2" style={{ minWidth: 220 }}>
            <SavingsBar label="CO₂" green={green.totalCO2} naive={naive.totalCO2} unit="g" />
            <SavingsBar label="Water" green={green.totalWater} naive={naive.totalWater} unit="mL" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteReceipt({ route, good }) {
  return (
    <div className="card" style={{ padding: 24, position: 'relative' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--serif)' }}>{good ? 'With GreenPrompt' : 'Without GreenPrompt'}</h3>
        <span className={'tag ' + (good ? 'tag-acid' : 'tag-crit')}>
          {good ? <><span className="dot" /> optimized</> : 'default'}
        </span>
      </div>
      <div className="col gap-3" style={{ gap: 12 }}>
        <ReceiptRow k="Model"     v={route.model.name} mono />
        <ReceiptRow k="Region"    v={`${route.region.name} (${route.region.code})`} mono />
        <ReceiptRow k="Grid now"  v={`${route.region.live_gco2} gCO₂/kWh`} hi={intensityColor(route.region.live_gco2)} />
        <ReceiptRow k="Latency"   v={`${route.region.latency} ms`} />
        <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />
        <ReceiptRow k="Energy"    v={`${route.energy.toFixed(2)} Wh`} />
        <ReceiptRow k="Water"     v={`${route.totalWater.toFixed(2)} mL`} />
        <ReceiptRow k="CO₂"       v={`${route.totalCO2.toFixed(3)} g`} big hi={good ? 'var(--acid)' : 'var(--critical)'} />
      </div>
    </div>
  );
}

function ReceiptRow({ k, v, mono, big, hi }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
      <span className={mono ? 'mono' : ''} style={{
        color: hi || 'var(--text-h)',
        fontFamily: big ? 'var(--serif)' : undefined,
        fontSize: big ? 22 : 13,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: big ? 500 : 400,
      }}>
        {v}
      </span>
    </div>
  );
}

function SavingsBar({ label, green, naive, unit }) {
  const pct = Math.min(100, (green / naive) * 100);
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4, fontSize: 11.5, color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span className="mono"><span className="acid">{green.toFixed(2)}</span> <span className="dim">/ {naive.toFixed(2)} {unit}</span></span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'rgba(255,77,94,0.18)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'var(--acid)', borderRadius: 999, transition: 'width 600ms ease' }} />
      </div>
    </div>
  );
}

function LogicTree() {
  const items = [
    { k: 'Classify',  v: 'Hash signals → tier (small / medium / large)', sub: 'If classifier confidence < 0.70, escalate one tier.' },
    { k: 'Enumerate', v: 'List models matching that tier', sub: 'Small: Flash, Haiku, 4o-mini · Medium: 4o, Sonnet, Gemini Pro · Large: Opus, GPT-5' },
    { k: 'Eligible',  v: 'Filter regions per model availability', sub: 'Drop any region the model is not deployed to.' },
    { k: 'Latency',   v: 'Filter by 500 ms budget from NYC edge', sub: 'Tokyo (180 ms) survives; nothing else gets close to the cap.' },
    { k: 'Pick',      v: 'Lowest current gCO₂/kWh wins', sub: 'Grid intensity refreshes every 30 seconds per region.' },
  ];
  return (
    <div className="col gap-3" style={{ marginTop: 4 }}>
      {items.map((it, i) => (
        <div key={it.k} style={{
          display: 'grid',
          gridTemplateColumns: '100px 1fr',
          gap: 18, padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--border-soft)',
          background: 'rgba(255,255,255,0.012)',
          animation: `page-in 360ms ${i * 60}ms both`,
        }}>
          <div className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: 2 }}>
            Step {i + 1} · {it.k}
          </div>
          <div>
            <div style={{ color: 'var(--text-h)', fontSize: 13.5 }}>{it.v}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{it.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
