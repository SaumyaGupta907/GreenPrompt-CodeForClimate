import { useEffect, useRef, useState } from 'react';
import {
  FEED_PROMPTS, generateSavingsTimeline, topAvoidedRegions,
  pickGreenPromptRoute, pickDefaultRoute, truncate, timeAgo,
} from '../data.js';
import { AnimatedNumber, StatCard, Panel, LineChart, BarChart } from '../components/ui.jsx';

export default function Dashboard() {
  const timeline = useRef(generateSavingsTimeline()).current;
  const regions = useRef(topAvoidedRegions()).current;
  const [feed, setFeed] = useState(() => seedFeed(8));
  const tickRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      setFeed(prev => {
        const next = makeFeedEntry(tickRef.current);
        return [next, ...prev].slice(0, 18);
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="page-enter col gap-6">
      <Header />

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard
          label="Queries Routed · 30d"
          value={<AnimatedNumber value={2143891} />}
          trend="↑ 12.4%"
          subtitle="vs. previous 30d"
          accent="acid"
        />
        <StatCard
          label="CO₂ Avoided · 30d"
          value={<><AnimatedNumber value={18.4} decimals={1} /> <span style={{ fontSize: 22, color: 'var(--text-muted)' }}>t</span></>}
          subtitle="≈ 47 round-trip NYC → SF flights"
          accent="acid"
        />
        <StatCard
          label="Water Saved · 30d"
          value={<><AnimatedNumber value={42300} /> <span style={{ fontSize: 22, color: 'var(--text-muted)' }}>L</span></>}
          subtitle="≈ 1 day of NYC household water"
          accent="peri"
        />
        <StatCard
          label="Avg Latency"
          value={<><AnimatedNumber value={187} /> <span style={{ fontSize: 22, color: 'var(--text-muted)' }}>ms</span></>}
          subtitle={<span><span className="acid">Budget 500 ms</span> · under by 313 ms</span>}
          accent="acid"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16 }}>
        <Panel
          title="Carbon Savings Over Time"
          right={
            <div className="row gap-3" style={{ fontSize: 11.5 }}>
              <span className="row gap-2"><span style={{ width: 10, height: 2, background: 'var(--critical)', display: 'inline-block' }} /> Default routing</span>
              <span className="row gap-2"><span style={{ width: 10, height: 2, background: 'var(--acid)', display: 'inline-block' }} /> w/ GreenPrompt</span>
            </div>
          }
        >
          <LineChart data={timeline} />
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Last 30 days · kg CO₂ per day</span>
            <span className="acid mono">−63.4% net</span>
          </div>
        </Panel>

        <Panel title="Top Avoided Regions This Week" right={<span className="tag tag-coral">routed away from</span>}>
          <BarChart
            data={regions.map(r => ({ label: r.name, value: r.avoided_kg, suffix: 'kg CO₂' }))}
            maxValue={regions[0].avoided_kg}
          />
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-soft)', fontSize: 11.5, color: 'var(--text-muted)' }}>
            Ranked by tons of CO₂ that would have been emitted if traffic had defaulted there.
          </div>
        </Panel>
      </div>

      <Panel
        title="Live Activity Feed"
        right={
          <div className="row gap-2" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            <span className="dot" />
            <span>streaming · 1 query / 3s</span>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr 130px 170px 110px', gap: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 10, borderBottom: '1px solid var(--border-soft)' }}>
          <div>Time</div>
          <div>Prompt</div>
          <div>Model</div>
          <div>Region</div>
          <div style={{ textAlign: 'right' }}>gCO₂ saved</div>
        </div>
        <div style={{ marginTop: 6 }}>
          {feed.map((e) => (
            <div
              key={e.id}
              className="feed-row-enter"
              style={{
                display: 'grid',
                gridTemplateColumns: '92px 1fr 130px 170px 110px',
                gap: 0,
                padding: '11px 0',
                borderBottom: '1px solid var(--border-soft)',
                fontSize: 12.5,
              }}
            >
              <div className="mono dim">{e.relTime}</div>
              <div style={{ color: 'var(--text-h)' }}>{truncate(e.prompt, 60)}</div>
              <div><span className={'tag ' + (e.tier === 'large' ? 'tag-coral' : e.tier === 'medium' ? 'tag-amber' : 'tag-acid')}>{e.model}</span></div>
              <div className="mono" style={{ color: 'var(--text)' }}>{e.region}</div>
              <div className="mono acid" style={{ textAlign: 'right' }}>+{e.saved.toFixed(2)} g</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Header() {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
      <div>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <span className="tag tag-acid"><span className="dot" /> Live</span>
          <span className="tag" style={{ color: 'var(--text-muted)' }}>Brooklyn AI Co · production</span>
        </div>
        <h1>Carbon, water, and latency — all green.</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 640 }}>
          A 30-day snapshot of every query you served, the region we routed it through, and what your defaults would have cost.
        </p>
      </div>
      <div className="row gap-2">
        <button className="btn">Export 30d report</button>
        <button className="btn btn-primary">View receipts →</button>
      </div>
    </div>
  );
}

function seedFeed(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(makeFeedEntry(-i * 2 - 1, true));
  return out;
}

function makeFeedEntry(tick, seeded = false) {
  const idx = ((tick % FEED_PROMPTS.length) + FEED_PROMPTS.length) % FEED_PROMPTS.length;
  const prompt = FEED_PROMPTS[idx];
  const route = pickGreenPromptRoute(prompt, { tick });
  const def = pickDefaultRoute(prompt, { tick });
  const saved = def.totalCO2 - route.totalCO2;
  const ts = seeded ? Date.now() - Math.abs(tick) * 3000 : Date.now();
  return {
    id: 'f_' + tick + '_' + Math.random().toString(36).slice(2, 6),
    relTime: seeded ? Math.abs(tick * 3) + 's ago' : 'just now',
    prompt,
    model: route.model.name,
    tier: route.model.tier,
    region: route.region.name,
    saved,
  };
}
