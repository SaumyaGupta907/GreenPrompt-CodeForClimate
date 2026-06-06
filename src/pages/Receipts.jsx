import { useMemo, useState } from 'react';
import { generatePastQueries, truncate, pickGreenPromptRoute, pickDefaultRoute } from '../data.js';
import { Panel, SlideOver, Modal } from '../components/ui.jsx';

const REPORTS = [
  { code: 'SEC',    title: 'SEC Climate Disclosure (10-K)', period: 'Q3 2025',      pages: 84, scope: 'Scope 1·2·3 + financial materiality' },
  { code: 'CSRD',   title: 'EU CSRD Annual Report',         period: 'FY 2025',      pages: 142, scope: 'ESRS E1 — climate change, double materiality' },
  { code: 'SB253',  title: 'California SB 253 Scope 3',     period: '2025 Annual', pages: 38,  scope: 'Cradle-to-grave inference emissions' },
];

export default function Receipts() {
  const queries = useMemo(() => generatePastQueries(), []);
  const [search, setSearch] = useState('');
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  const filtered = queries.filter(q => {
    if (search && !q.prompt.toLowerCase().includes(search.toLowerCase()) && !q.id.includes(search)) return false;
    const ageDays = (Date.now() - q.ts) / 86400000;
    return ageDays <= days;
  });

  return (
    <div className="page-enter col gap-6">
      <div>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <span className="tag tag-peri">Audit-ready</span>
          <span className="tag" style={{ color: 'var(--text-muted)' }}>Per-query receipts · compliance reports</span>
        </div>
        <h1>Receipts & Reports</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, maxWidth: 660 }}>
          Every query produces a tamper-evident receipt — model, region, grid intensity at the moment of inference,
          and the emissions you saved. Aggregated into the disclosures your finance team actually needs.
        </p>
      </div>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {REPORTS.map(r => <ReportCard key={r.code} report={r} />)}
      </div>

      <Panel
        title="Per-Query Audit Trail"
        right={
          <div className="row gap-3">
            <input className="input" placeholder="Search queries…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, padding: '7px 10px', fontSize: 12 }} />
            <select className="select" value={days} onChange={e => setDays(+e.target.value)} style={{ width: 130, padding: '7px 10px', fontSize: 12 }}>
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button className="btn" onClick={() => alert(`Exporting ${filtered.length} rows to CSV…`)}>Export CSV</button>
          </div>
        }
      >
        <div style={{ overflowX: 'auto', margin: '0 -22px' }}>
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Time</th>
                <th>Query ID</th>
                <th>Prompt</th>
                <th>Model</th>
                <th>Region</th>
                <th className="right">gCO₂</th>
                <th className="right">Water (mL)</th>
                <th className="right">Energy (Wh)</th>
                <th>Exported</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map(q => (
                <tr key={q.id} onClick={() => setOpen(q)} style={{ cursor: 'pointer' }}>
                  <td style={{ paddingLeft: 22 }} className="mono dim">{new Date(q.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="mono peri">{q.id}</td>
                  <td>{truncate(q.prompt, 48)}</td>
                  <td><span className="tag tag-acid">{q.model}</span></td>
                  <td className="mono">{q.regionCode}</td>
                  <td className="right mono acid">{q.gco2.toFixed(2)}</td>
                  <td className="right mono">{q.water.toFixed(2)}</td>
                  <td className="right mono">{q.energy.toFixed(2)}</td>
                  <td><span className={'tag ' + (q.exported ? 'tag-peri' : '')} style={{ opacity: q.exported ? 1 : 0.5 }}>{q.exported ? 'yes' : '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: 14, fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center' }}>
          showing {Math.min(60, filtered.length)} of {filtered.length} matching · click any row for the full receipt
        </div>
      </Panel>

      <Panel
        title="End-User Receipt Widget"
        right={<button className="btn" onClick={() => setEmbedOpen(true)}>View embed code</button>}
      >
        <p style={{ color: 'var(--text-muted)', maxWidth: 540, marginBottom: 18 }}>
          The badge that floats under every AI response inside Brooklyn AI Co's app. Tappable — opens
          a plain-English explanation of where the response was processed and what was saved.
        </p>
        <PreviewWidget />
      </Panel>

      <SlideOver open={!!open} onClose={() => setOpen(null)} title={open ? `Receipt · ${open.id}` : ''}>
        {open && <ReceiptDetail q={open} onShare={() => setShareOpen(true)} />}
      </SlideOver>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share this receipt">
        <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>
          Public, signed URL that anyone can open — useful for sharing with auditors or your sustainability lead.
        </p>
        <div className="card" style={{ padding: 14, background: 'rgba(255,255,255,0.02)' }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--acid)', wordBreak: 'break-all' }}>
            https://greenprompt.io/r/{open?.id}?sig=hk2x9p4q1m
          </div>
        </div>
        <div className="row gap-2" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setShareOpen(false)}>Close</button>
          <button className="btn btn-primary">Copy link</button>
        </div>
      </Modal>

      <Modal open={embedOpen} onClose={() => setEmbedOpen(false)} title="Embed the receipt widget">
        <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>
          Drop this snippet under any AI response. It calls GreenPrompt's receipt endpoint with the query id
          and renders the badge. Zero config.
        </p>
        <pre className="mono" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontSize: 12, color: 'var(--text-h)', overflow: 'auto' }}>
{`<script src="https://cdn.greenprompt.io/badge.js"></script>
<gp-receipt query-id="\${queryId}" />`}
        </pre>
      </Modal>
    </div>
  );
}

function ReportCard({ report }) {
  return (
    <div className="card hoverable" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 200 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{report.code}</span>
        <span className="tag tag-acid"><span className="dot" /> Ready</span>
      </div>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.2 }}>{report.title}</h3>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
        <div style={{ marginBottom: 4 }}><span className="dim">Period · </span><span className="text-h">{report.period}</span></div>
        <div style={{ marginBottom: 4 }}><span className="dim">Pages · </span><span className="text-h">{report.pages}</span></div>
        <div><span className="dim">Scope · </span>{report.scope}</div>
      </div>
      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Download PDF ↓</button>
    </div>
  );
}

function ReceiptDetail({ q, onShare }) {
  const route = pickGreenPromptRoute(q.prompt);
  const def = pickDefaultRoute(q.prompt);
  return (
    <div className="col gap-4">
      <div className="row gap-2">
        <span className="tag tag-acid"><span className="dot" /> Carbon-aware routed</span>
        <span className="mono dim" style={{ fontSize: 11 }}>{new Date(q.ts).toLocaleString()}</span>
      </div>

      <div>
        <h4>Prompt</h4>
        <div className="card" style={{ padding: 14, marginTop: 8, fontSize: 13, color: 'var(--text-h)' }}>
          "{q.prompt}"
        </div>
      </div>

      <div>
        <h4>Routing</h4>
        <div className="card" style={{ padding: 16, marginTop: 8 }}>
          <Row k="Model"    v={q.model} mono />
          <Row k="Region"   v={`${q.region} (${q.regionCode})`} mono />
          <Row k="Latency"  v={`${route.region.latency} ms`} />
          <Row k="Response" v={`${q.response_chars} chars`} />
        </div>
      </div>

      <div>
        <h4>Footprint</h4>
        <div className="card" style={{ padding: 16, marginTop: 8 }}>
          <Row k="CO₂"    v={`${q.gco2.toFixed(3)} g`}    hi="var(--acid)" />
          <Row k="Water"  v={`${q.water.toFixed(2)} mL`} />
          <Row k="Energy" v={`${q.energy.toFixed(2)} Wh`} />
        </div>
      </div>

      <div>
        <h4>Versus your default (Claude Sonnet / us-east-1)</h4>
        <div className="card" style={{ padding: 16, marginTop: 8, background: 'rgba(255,77,94,0.03)' }}>
          <Row k="CO₂"   v={`${q.gco2_default.toFixed(3)} g`}   hi="var(--critical)" />
          <Row k="Water" v={`${q.water_default.toFixed(2)} mL`} />
        </div>
      </div>

      <div className="card" style={{ padding: 16, background: 'linear-gradient(95deg, rgba(200,255,61,0.1), transparent)' }}>
        <h4 style={{ color: 'var(--acid)' }}>Routing reason</h4>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-h)' }}>
          Classified as <strong>{route.classify.tier}</strong>{' '}
          (confidence {(route.classify.confidence * 100).toFixed(0)}%). At the time of inference, {route.region.name} had
          the lowest live carbon intensity ({route.region.live_gco2} gCO₂/kWh) of all regions within the {500} ms latency budget.
        </p>
      </div>

      <div className="row gap-2">
        <button className="btn btn-primary" onClick={onShare}>Share Receipt</button>
        <button className="btn">Export JSON</button>
      </div>
    </div>
  );
}

function Row({ k, v, mono, hi }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</span>
      <span className={mono ? 'mono' : ''} style={{ color: hi || 'var(--text-h)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  );
}

function PreviewWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="card" style={{ padding: 24, background: 'rgba(255,255,255,0.012)' }}>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginBottom: 18, maxWidth: 540 }}>
          <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>Brooklyn AI Legal Assistant: </span>
          Under NYC's Warranty of Habitability (Real Property Law §235-b), your landlord is legally required
          to provide heat between October 1 and May 31. If indoor temperatures fall below 68°F during the day
          or 62°F at night, you have grounds to file a complaint with HPD…
        </div>
        <button className="receipt-badge" onClick={() => setOpen(true)}>
          <span className="receipt-dot" />
          0.4 mL <span className="sep">·</span> 0.3 Wh <span className="sep">·</span> 0.1 g CO₂
          <span className="sep">·</span> Powered by GreenPrompt
        </button>
        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-dim)' }}>↑ this is the actual widget your end users tap</div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="About this receipt">
        <div className="col gap-3" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
          <p>This response was processed by <strong className="text-h">Claude Haiku</strong> in <strong className="text-h">Quebec (ca-central-1)</strong>.</p>
          <p>
            Quebec runs on 96% hydro-electric power. When you asked your question, the local grid was emitting
            <strong className="acid"> ~30 gCO₂/kWh</strong> — about 14× cleaner than your default region.
          </p>
          <p>We routed the request there because the prompt was short and conversational — Claude Haiku is small, fast, and capable of answering it.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <Mini k="CO₂ saved"   v="1.4 g"     accent="acid" />
            <Mini k="Water saved" v="1.4 mL"    accent="peri" />
            <Mini k="Energy"      v="0.3 Wh"    accent="acid" />
            <Mini k="Latency"     v="187 ms"    accent="peri" />
          </div>
        </div>
      </Modal>
    </>
  );
}

function Mini({ k, v, accent }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
      <div className={accent} style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 4 }}>{v}</div>
    </div>
  );
}
