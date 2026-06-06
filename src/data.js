// ────────────────────────────────────────────────────────────
// GreenPrompt — seed data + deterministic routing logic
// ────────────────────────────────────────────────────────────

export const REGIONS = [
  { name: 'Quebec (hydro)',         code: 'ca-central-1',  gco2: 30,  water: 0.4, latency: 25,  group: 'ca', nonFossil: true  },
  { name: 'Stockholm',              code: 'eu-north-1',    gco2: 40,  water: 0.6, latency: 100, group: 'eu', nonFossil: true  },
  { name: 'Iowa (wind+nuclear)',    code: 'us-central1',   gco2: 150, water: 1.3, latency: 40,  group: 'us', nonFossil: true  },
  { name: 'Oregon',                 code: 'us-west-2',     gco2: 220, water: 1.1, latency: 70,  group: 'us', nonFossil: false },
  { name: 'Ireland',                code: 'eu-west-1',     gco2: 290, water: 1.5, latency: 80,  group: 'eu', nonFossil: false },
  { name: 'NYC (NYISO)',            code: 'nyc-edge',      gco2: 412, water: 1.8, latency: 5,   group: 'us', nonFossil: false },
  { name: 'N. Virginia',            code: 'us-east-1',     gco2: 450, water: 1.8, latency: 30,  group: 'us', nonFossil: false },
  { name: 'Tokyo',                  code: 'ap-northeast-1',gco2: 510, water: 1.9, latency: 180, group: 'ap', nonFossil: false },
];

// available_regions list expands to region codes.
const ALL = REGIONS.map(r => r.code);
const inGroups = (...g) => REGIONS.filter(r => g.includes(r.group)).map(r => r.code);

export const MODELS = [
  { name: 'Gemini Flash',  tier: 'small',  energy: 0.24, water: 0.3, regions: ALL,                       order: 1 },
  { name: 'Claude Haiku',  tier: 'small',  energy: 0.3,  water: 0.4, regions: inGroups('us','eu','ca'),  order: 2 },
  { name: 'GPT-4o-mini',   tier: 'small',  energy: 0.4,  water: 0.5, regions: inGroups('us'),            order: 3 },
  { name: 'GPT-4o',        tier: 'medium', energy: 0.42, water: 0.7, regions: inGroups('us','eu'),       order: 4 },
  { name: 'Claude Sonnet', tier: 'medium', energy: 0.8,  water: 1.0, regions: inGroups('us','eu','ca'),  order: 5 },
  { name: 'Gemini Pro',    tier: 'medium', energy: 1.2,  water: 0.6, regions: ALL,                       order: 6 },
  { name: 'Claude Opus',   tier: 'large',  energy: 3.0,  water: 2.5, regions: inGroups('us'),            order: 7 },
  { name: 'GPT-5',         tier: 'large',  energy: 18,   water: 39,  regions: inGroups('us'),            order: 8 },
];

export const CUSTOMER = {
  name: 'Brooklyn AI Co',
  product: 'AI Legal Assistant for NYC Tenants',
  monthly_volume: 2_100_000,
  latency_budget_ms: 500,
  default_model: 'Claude Sonnet',
  default_region: 'us-east-1',
  carbon_aware_routing: true,
};

// ──────── Prompts for the live feed + examples ────────
export const FEED_PROMPTS = [
  'draft a heat complaint letter to my landlord',
  'summarize my lease and flag unusual clauses',
  'what is the warranty of habitability in NYC?',
  'can my landlord increase rent mid-lease?',
  'how do I report a rodent infestation to HPD?',
  'explain my rights under NYC Admin Code §8-107',
  "my super hasn't fixed the leak in 3 weeks — what now?",
  'is my apartment rent-stabilized?',
  'how do I file a 311 complaint for no hot water?',
  'draft a withholding-of-rent notice',
  'translate this lease clause to plain English',
  'what is the legal noise level for apartments?',
  'can my landlord enter without notice?',
  'how do I break my lease early?',
  'what should I do about black mold in my bathroom?',
  'draft a security-deposit-return demand letter',
  'is a 60-day non-renewal notice required?',
  'walk me through housing court procedure',
  'summarize tenant rights for ESA (emotional support animals)',
  'explain the difference between rent-stabilized and rent-controlled',
];

export const EXAMPLE_PROMPTS = [
  { text: "What's the weather in Brooklyn?",                                              tier: 'small',  hint: 'small / casual' },
  { text: 'Summarize the attached lease and flag unusual clauses.',                       tier: 'medium', hint: 'medium / reasoning' },
  { text: 'Draft a 2,000-word fair-housing complaint citing NYC Admin Code §8-107.',      tier: 'large',  hint: 'large / drafting' },
];

// ──────── Heuristic classifier (deterministic) ────────
// "Classifying prompt complexity" — we hash some signals into a confidence + tier.
export function classifyPrompt(text) {
  const t = (text || '').trim().toLowerCase();
  const len = t.length;
  const words = t.split(/\s+/).filter(Boolean).length;

  const drafting = /\b(draft|write|compose|generate|produce)\b/.test(t);
  const longform = /\b(\d{3,4}|two\s*thousand|essay|brief|complaint|memo|paragraph)\b/.test(t);
  const reasoning = /\b(summari[sz]e|analy[sz]e|compare|explain|flag|reasoning|review|extract|evaluate)\b/.test(t);
  const trivial = /\b(weather|time|hello|hi |hey|what's up|joke|capital of)\b/.test(t);
  const code = /```|\bcode\b|function|sql|python|json/.test(t);

  let tier = 'small';
  let confidence = 0.82;

  if (drafting && longform)                  { tier = 'large';  confidence = 0.91; }
  else if (drafting || code || words > 60)   { tier = 'medium'; confidence = 0.78; }
  else if (reasoning || words > 18)          { tier = 'medium'; confidence = 0.74; }
  else if (trivial || words < 8)             { tier = 'small';  confidence = 0.88; }
  else                                       { tier = 'small';  confidence = 0.68; }

  // confidence-threshold escalation
  let escalated = false;
  if (confidence < 0.70) {
    escalated = true;
    if (tier === 'small') tier = 'medium';
    else if (tier === 'medium') tier = 'large';
    confidence = Math.min(0.92, confidence + 0.18);
  }

  return { tier, confidence, escalated, length: len, words };
}

// ──────── Current grid intensity ────────
// Wobbles deterministically based on a tick so the demo "lives".
export function currentIntensity(region, tick = 0) {
  const seed = (region.code.charCodeAt(0) + region.code.charCodeAt(1)) * 7;
  const swing = Math.sin((tick + seed) * 0.31) * 0.15;
  return Math.round(region.gco2 * (1 + swing));
}
export function regionsWithLive(tick = 0) {
  return REGIONS.map(r => ({ ...r, live_gco2: currentIntensity(r, tick) }));
}

// ──────── Routing logic ────────
export function pickGreenPromptRoute(prompt, opts = {}) {
  const tick = opts.tick ?? 0;
  const latencyBudget = opts.latencyBudget ?? CUSTOMER.latency_budget_ms;
  const classify = classifyPrompt(prompt);

  // candidate models = matching tier (or escalated)
  const candidates = MODELS.filter(m => m.tier === classify.tier);

  // for each candidate, find best region (lowest live gCO2 within latency budget)
  const live = regionsWithLive(tick);
  let best = null;

  for (const m of candidates) {
    const eligible = live
      .filter(r => m.regions.includes(r.code) && r.latency <= latencyBudget)
      .sort((a, b) => a.live_gco2 - b.live_gco2);
    if (!eligible.length) continue;
    const region = eligible[0];
    const totalCO2 = (m.energy * region.live_gco2) / 1000;       // grams
    const totalWater = m.water;                                   // mL per request, fixed
    const score = totalCO2 + (m.tier === 'large' ? 0.05 : 0);
    if (!best || score < best.score) {
      best = { model: m, region, totalCO2, totalWater, energy: m.energy, score, classify };
    }
  }

  if (!best) {
    // fall back to default
    return pickDefaultRoute(prompt, opts);
  }
  return best;
}

export function pickDefaultRoute(prompt, opts = {}) {
  const tick = opts.tick ?? 0;
  const m = MODELS.find(x => x.name === CUSTOMER.default_model);
  const r = regionsWithLive(tick).find(x => x.code === CUSTOMER.default_region);
  const totalCO2 = (m.energy * r.live_gco2) / 1000;
  return {
    model: m,
    region: r,
    totalCO2,
    totalWater: m.water,
    energy: m.energy,
    classify: classifyPrompt(prompt),
  };
}

// ──────── Past queries (250 over 7 days) ────────
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generatePastQueries() {
  const rand = seededRandom(1337);
  const out = [];
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  for (let i = 0; i < 250; i++) {
    const promptIdx = Math.floor(rand() * FEED_PROMPTS.length);
    const ts = now - Math.floor(rand() * week);
    const tickAtTs = Math.floor((now - ts) / 30000);
    const prompt = FEED_PROMPTS[promptIdx];
    const route = pickGreenPromptRoute(prompt, { tick: tickAtTs });
    const def = pickDefaultRoute(prompt, { tick: tickAtTs });
    out.push({
      id: 'q_' + (10000 + i).toString(36),
      ts,
      prompt,
      model: route.model.name,
      region: route.region.name,
      regionCode: route.region.code,
      gco2: +route.totalCO2.toFixed(3),
      water: +route.totalWater.toFixed(2),
      energy: +route.energy.toFixed(2),
      gco2_default: +def.totalCO2.toFixed(3),
      water_default: +def.totalWater.toFixed(2),
      exported: rand() > 0.78,
      response_chars: 280 + Math.floor(rand() * 1800),
    });
  }
  return out.sort((a, b) => b.ts - a.ts);
}

// ──────── Past 30 days of cumulative savings (for hero chart) ────────
export function generateSavingsTimeline() {
  const rand = seededRandom(7);
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Default: a stable high baseline (Sonnet/us-east-1)
    const defaultPerDay = 64 + rand() * 6; // kg CO2 per day
    const actualPerDay  = 41 - i * 0.22 + rand() * 4; // optimization improves over time
    days.push({
      date: d.toISOString().slice(0, 10),
      default: +defaultPerDay.toFixed(1),
      actual: +Math.max(8, actualPerDay).toFixed(1),
    });
  }
  return days;
}

// ──────── Top-avoided regions this week (bar chart) ────────
export function topAvoidedRegions() {
  // The regions that were routed away from, ranked by CO2 avoided this week
  return [
    { name: 'N. Virginia',  code: 'us-east-1',     avoided_kg: 2840 },
    { name: 'NYC (NYISO)',  code: 'nyc-edge',      avoided_kg: 1920 },
    { name: 'Tokyo',        code: 'ap-northeast-1',avoided_kg: 740  },
    { name: 'Ireland',      code: 'eu-west-1',     avoided_kg: 510  },
    { name: 'Oregon',       code: 'us-west-2',     avoided_kg: 380  },
  ];
}

// ──────── Scheduler jobs ────────
export const SCHED_JOBS = [
  {
    id: 'job_finetune',
    name: 'Weekly fine-tune of legal assistant',
    type: 'Fine-tuning',
    gpu_hours: 12,
    deadline_h: 7 * 24,
    status: 'pending',
    rec_region: 'Quebec (ca-central-1)',
    rec_time: 'Tue 03:42 UTC',
    projected_kg: 4.2,
  },
  {
    id: 'job_embed',
    name: 'Embedding refresh for 50,000 lease documents',
    type: 'Embedding pipeline',
    gpu_hours: 4,
    deadline_h: 24,
    status: 'running',
    rec_region: 'Stockholm (eu-north-1)',
    rec_time: 'Tonight 22:10 UTC',
    projected_kg: 1.6,
  },
  {
    id: 'job_eval',
    name: 'Nightly evaluation suite',
    type: 'Batch evaluation',
    gpu_hours: 1,
    deadline_h: 8,
    status: 'done',
    rec_region: 'Iowa (us-central1)',
    rec_time: 'Last night 02:15 ET',
    projected_kg: 0.4,
  },
];

// ──────── 72h heatmap (regions x hours) ────────
export function generateHeatmap() {
  const rand = seededRandom(42);
  return REGIONS.map(r => ({
    name: r.name,
    code: r.code,
    cells: Array.from({ length: 72 }, (_, h) => {
      const diurnal = Math.sin(((h % 24) - 4) / 24 * Math.PI * 2);
      // hydro/wind regions drop overnight; fossil-heavy stay high
      const baseSwing = r.nonFossil ? -0.22 : 0.18;
      const wobble = (rand() - 0.5) * 0.2;
      const factor = 1 + diurnal * baseSwing + wobble;
      return Math.max(15, Math.round(r.gco2 * factor));
    }),
  }));
}

// ──────── helpers ────────
export function formatNumber(n, decimals = 0) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
export function tierLabel(tier) {
  return tier[0].toUpperCase() + tier.slice(1);
}
export function intensityColor(g) {
  if (g <= 80)   return 'var(--acid)';
  if (g <= 200)  return '#a4e85a';
  if (g <= 320)  return 'var(--amber)';
  if (g <= 440)  return '#ff8a4d';
  return 'var(--critical)';
}
export function intensityTag(g) {
  if (g <= 80)   return 'tag-acid';
  if (g <= 220)  return 'tag-acid';
  if (g <= 360)  return 'tag-amber';
  return 'tag-crit';
}
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
export function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
