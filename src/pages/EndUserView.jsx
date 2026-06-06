import { useState } from 'react';
import { Modal } from '../components/ui.jsx';

export default function EndUserView() {
  const [open, setOpen] = useState(false);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <span className="tag tag-peri">Customer surface</span>
          <span className="tag" style={{ color: 'var(--text-muted)' }}>brooklyn-ai.co · /assistant</span>
        </div>
        <h1 style={{ fontSize: 36 }}>Brooklyn AI Legal Assistant</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
          Your tenant-rights assistant. Type any question — get plain-English legal guidance with citations.
        </p>

        <div className="card" style={{ padding: 24, marginTop: 28, minHeight: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="bubble-user">
              My landlord won't fix my heat. Help.
            </div>

            <div className="bubble-ai" style={{ animation: 'page-in 600ms 100ms both' }}>
              <p style={{ marginBottom: 12 }}>
                <strong>You have strong protections here.</strong> Under New York's <em>Warranty of Habitability</em>
                {' '}(Real Property Law §235-b), your landlord is legally required to provide heat between
                {' '}<strong>October 1 and May 31</strong>. If indoor temperatures fall below <strong>68°F during the day</strong>{' '}
                or <strong>62°F at night</strong>, the apartment fails the warranty and you have grounds to act.
              </p>
              <p style={{ marginBottom: 12 }}>
                Practically, do three things this week. <strong>(1)</strong> File a complaint with{' '}
                <strong>NYC HPD</strong> by calling 311 or via the Housing Connect portal — keep the case number.{' '}
                <strong>(2)</strong> Log the temperature every few hours with timestamped photos of a thermometer.{' '}
                <strong>(3)</strong> Send your landlord a <strong>written demand letter</strong> citing §235-b
                and giving a reasonable cure period (10 days is standard).
              </p>
              <p>
                If the heat is still off after the cure period, you can pursue a <strong>rent abatement</strong>{' '}
                in Housing Court, or in some cases withhold rent in escrow. I can draft the demand letter for you —
                just say the word.
              </p>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
                <button className="receipt-badge" onClick={() => setOpen(true)}>
                  <span className="receipt-dot" />
                  0.3 g CO₂
                  <span className="sep">·</span> 0.5 mL water
                  <span className="sep">·</span> 0.4 Wh
                  <span className="sep">·</span> Cleanest region available
                  <span className="sep">·</span> Powered by GreenPrompt
                </button>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
                  Tap the badge for a plain-English breakdown.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
            <div className="row gap-2" style={{
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <input
                className="input"
                placeholder="Ask a follow-up…"
                style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 14 }}
                disabled
              />
              <button className="btn btn-primary" style={{ padding: '7px 14px' }}>Send</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
              Brooklyn AI doesn't replace a lawyer. For complex cases, contact Legal Aid NYC.
            </div>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Where your answer came from">
        <div className="col gap-4" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>
          <p>
            This response was processed by <strong className="text-h">Claude Haiku</strong>, a small, fast model — running in
            <strong className="text-h"> Quebec, Canada (ca-central-1)</strong>.
          </p>
          <p>
            Quebec's electricity grid is <strong>96% hydro-electric</strong>. When you sent your question, the local grid
            was emitting roughly <strong className="acid">30 gCO₂/kWh</strong> — about <strong>14× cleaner</strong> than the
            default region (N. Virginia, where most AI traffic ends up).
          </p>
          <p>
            We picked this combination because your question was conversational and concise: a small model could answer
            it well, and a clean grid could power the inference. Total impact: <strong>0.3 grams of CO₂</strong>,{' '}
            <strong>0.5 mL of water</strong>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            <Mini k="vs. default" v="1.5 g saved" accent="acid" />
            <Mini k="vs. default" v="1.3 mL saved" accent="peri" />
            <Mini k="Model" v="Claude Haiku" accent="acid" />
            <Mini k="Region grid" v="30 gCO₂/kWh" accent="peri" />
          </div>
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            GreenPrompt is the carbon-aware routing layer that picks the smallest capable model in the cleanest region for every request.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function Mini({ k, v, accent }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
      <div className={accent} style={{ fontFamily: 'var(--serif)', fontSize: 20, marginTop: 4 }}>{v}</div>
    </div>
  );
}
