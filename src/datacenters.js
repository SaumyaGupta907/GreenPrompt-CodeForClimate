/**
 * GreenPrompt — Top 10 Global Datacenter Simulation Data
 *
 * FORMAL TERMS GLOSSARY:
 * ─────────────────────────────────────────────────────────────
 * gCO₂/kWh    → Carbon Intensity: grams of CO₂ emitted per kilowatt-hour of electricity consumed.
 * PUE         → Power Usage Effectiveness: total facility power / IT equipment power.
 * IT Load     → Kilowatts drawn by active compute (servers, storage, networking).
 * Total Facility Power → IT Load × PUE. True wall-plug power draw.
 * WUE         → Water Usage Effectiveness: liters per kWh of IT energy.
 * Water Consumption → WUE × IT Load. Liters per hour for cooling.
 * Carbon Output → (Total Facility Power × gCO₂/kWh) / 1000.
 * Renewable Mix → % of power from solar, wind, hydro, nuclear.
 * ─────────────────────────────────────────────────────────────
 */

export const DATACENTERS = [
  {
    id: "dc-01",
    name: "The Dalles (Google)",
    operator: "Google",
    location: { city: "The Dalles, OR", country: "USA", lat: 45.5946, lng: -121.1787 },
    gridOperator: "BPA (Bonneville Power Administration)",
    carbonIntensity_gco2_per_kwh: 110,
    pue: 1.10,
    itLoad_kw: 180000,
    wue_liters_per_kwh: 1.06,
    renewableMix_pct: 91,
    gridRegion: "us-west",
  },
  {
    id: "dc-02",
    name: "Council Bluffs (Google)",
    operator: "Google",
    location: { city: "Council Bluffs, IA", country: "USA", lat: 41.2619, lng: -95.8608 },
    gridOperator: "MISO (Midcontinent Independent System Operator)",
    carbonIntensity_gco2_per_kwh: 480,
    pue: 1.11,
    itLoad_kw: 160000,
    wue_liters_per_kwh: 1.80,
    renewableMix_pct: 52,
    gridRegion: "us-central",
  },
  {
    id: "dc-03",
    name: "Ashburn (Equinix DC Campus)",
    operator: "Equinix / AWS / Azure co-location hub",
    location: { city: "Ashburn, VA", country: "USA", lat: 39.0438, lng: -77.4874 },
    gridOperator: "PJM Interconnection",
    carbonIntensity_gco2_per_kwh: 450,
    pue: 1.45,
    itLoad_kw: 300000,
    wue_liters_per_kwh: 1.80,
    renewableMix_pct: 38,
    gridRegion: "us-east",
  },
  {
    id: "dc-04",
    name: "Dublin (Microsoft)",
    operator: "Microsoft Azure",
    location: { city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
    gridOperator: "EirGrid",
    carbonIntensity_gco2_per_kwh: 290,
    pue: 1.18,
    itLoad_kw: 120000,
    wue_liters_per_kwh: 0.50,
    renewableMix_pct: 64,
    gridRegion: "eu-west",
  },
  {
    id: "dc-05",
    name: "Singapore (AWS)",
    operator: "Amazon Web Services",
    location: { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
    gridOperator: "EMA (Energy Market Authority)",
    carbonIntensity_gco2_per_kwh: 408,
    pue: 1.35,
    itLoad_kw: 130000,
    wue_liters_per_kwh: 2.20,
    renewableMix_pct: 3,
    gridRegion: "ap-southeast",
  },
  {
    id: "dc-06",
    name: "Tokyo (NTT / Google)",
    operator: "NTT / Google",
    location: { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
    gridOperator: "TEPCO (Tokyo Electric Power Co.)",
    carbonIntensity_gco2_per_kwh: 510,
    pue: 1.40,
    itLoad_kw: 100000,
    wue_liters_per_kwh: 1.90,
    renewableMix_pct: 22,
    gridRegion: "ap-northeast",
  },
  {
    id: "dc-07",
    name: "Hamina (Google)",
    operator: "Google",
    location: { city: "Hamina", country: "Finland", lat: 60.5692, lng: 27.1878 },
    gridOperator: "Fingrid",
    carbonIntensity_gco2_per_kwh: 58,
    pue: 1.09,
    itLoad_kw: 90000,
    wue_liters_per_kwh: 0.20,
    renewableMix_pct: 88,
    gridRegion: "eu-north",
  },
  {
    id: "dc-08",
    name: "Montreal (OVHcloud / AWS)",
    operator: "OVHcloud / AWS",
    location: { city: "Montréal, QC", country: "Canada", lat: 45.5017, lng: -73.5673 },
    gridOperator: "Hydro-Québec",
    carbonIntensity_gco2_per_kwh: 30,
    pue: 1.20,
    itLoad_kw: 80000,
    wue_liters_per_kwh: 0.40,
    renewableMix_pct: 99,
    gridRegion: "ca-central",
  },
  {
    id: "dc-09",
    name: "Sydney (Microsoft / Equinix)",
    operator: "Microsoft / Equinix",
    location: { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
    gridOperator: "AEMO (Australian Energy Market Operator)",
    carbonIntensity_gco2_per_kwh: 620,
    pue: 1.38,
    itLoad_kw: 70000,
    wue_liters_per_kwh: 2.60,
    renewableMix_pct: 28,
    gridRegion: "ap-southeast-2",
  },
  {
    id: "dc-10",
    name: "São Paulo (Google / Ascenty)",
    operator: "Google / Ascenty",
    location: { city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
    gridOperator: "ONS (Operador Nacional do Sistema Elétrico)",
    carbonIntensity_gco2_per_kwh: 90,
    pue: 1.30,
    itLoad_kw: 60000,
    wue_liters_per_kwh: 1.60,
    renewableMix_pct: 83,
    gridRegion: "sa-east",
  },
];

export function computeDerivedMetrics(dc) {
  const totalFacilityPower_kw = dc.itLoad_kw * dc.pue;
  const waterConsumption_L_per_hr = dc.wue_liters_per_kwh * dc.itLoad_kw;
  const carbonOutput_kg_per_hr = (totalFacilityPower_kw * dc.carbonIntensity_gco2_per_kwh) / 1000;
  return {
    totalFacilityPower_kw: Math.round(totalFacilityPower_kw),
    waterConsumption_L_per_hr: Math.round(waterConsumption_L_per_hr),
    carbonOutput_kg_per_hr: Math.round(carbonOutput_kg_per_hr * 10) / 10,
  };
}

/**
 * LIVE FLUCTUATION ENGINE
 * Deterministic pseudo-random walk: same tick → same values, smooth between ticks.
 */
export function getLiveSnapshot(dc, tick) {
  const seed = (dc.id.charCodeAt(3) + tick * 17) % 1000;
  const rand = (offset) => Math.sin(seed + offset) * 0.5 + 0.5;
  const fluctuate = (baseline, randVal, pct = 0.05) => baseline + baseline * pct * (randVal * 2 - 1);

  const liveCarbon = fluctuate(dc.carbonIntensity_gco2_per_kwh, rand(1));
  const livePUE    = fluctuate(dc.pue, rand(2), 0.03);
  const liveITLoad = fluctuate(dc.itLoad_kw, rand(3), 0.05);
  const liveWUE    = fluctuate(dc.wue_liters_per_kwh, rand(4), 0.05);

  const totalFacilityPower_kw     = liveITLoad * livePUE;
  const waterConsumption_L_per_hr = liveWUE * liveITLoad;
  const carbonOutput_kg_per_hr    = (totalFacilityPower_kw * liveCarbon) / 1000;

  return {
    id: dc.id,
    name: dc.name,
    operator: dc.operator,
    location: dc.location,
    gridOperator: dc.gridOperator,
    gridRegion: dc.gridRegion,
    renewableMix_pct: dc.renewableMix_pct,
    pue: Math.round(livePUE * 100) / 100,
    itLoad_kw: Math.round(liveITLoad),
    wue_liters_per_kwh: Math.round(liveWUE * 100) / 100,

    carbonIntensity_gco2_per_kwh: Math.round(liveCarbon),
    waterConsumption_L_per_hr: Math.round(waterConsumption_L_per_hr),
    totalFacilityPower_kw: Math.round(totalFacilityPower_kw),
    carbonOutput_kg_per_hr: Math.round(carbonOutput_kg_per_hr * 10) / 10,

    delta: {
      carbonIntensity: liveCarbon - dc.carbonIntensity_gco2_per_kwh,
      waterConsumption: waterConsumption_L_per_hr - (dc.wue_liters_per_kwh * dc.itLoad_kw),
      facilityPower: totalFacilityPower_kw - (dc.itLoad_kw * dc.pue),
      carbonOutput: carbonOutput_kg_per_hr - ((dc.itLoad_kw * dc.pue * dc.carbonIntensity_gco2_per_kwh) / 1000),
    },

    carbonRating: liveCarbon < 150 ? "clean" : liveCarbon < 400 ? "moderate" : liveCarbon < 550 ? "high" : "critical",
  };
}

export function getAllLiveSnapshots(tick) {
  return DATACENTERS.map((dc) => getLiveSnapshot(dc, tick));
}

export const CARBON_THRESHOLDS = {
  clean:    { max: 150,  label: "Clean",    color: "#C8FF3D", description: "Predominantly renewable — hydro, wind, solar, nuclear" },
  moderate: { max: 400,  label: "Moderate", color: "#FFB938", description: "Mixed grid — significant renewables with fossil backup" },
  high:     { max: 550,  label: "High",     color: "#FF6B9D", description: "Fossil-heavy — natural gas primary or coal secondary" },
  critical: { max: 9999, label: "Critical", color: "#FF4D5E", description: "Coal or unabated fossil dominant" },
};

export function ratingColor(rating) {
  return CARBON_THRESHOLDS[rating]?.color || '#888';
}

export function getGlobalAggregate(tick) {
  const snapshots = getAllLiveSnapshots(tick);
  const totalPower = snapshots.reduce((s, dc) => s + dc.totalFacilityPower_kw, 0);
  const totalWater = snapshots.reduce((s, dc) => s + dc.waterConsumption_L_per_hr, 0);
  const totalCarbon = snapshots.reduce((s, dc) => s + dc.carbonOutput_kg_per_hr, 0);
  const avgCarbonIntensity = snapshots.reduce((s, dc) => s + dc.carbonIntensity_gco2_per_kwh, 0) / snapshots.length;
  return {
    totalFacilityPower_mw: Math.round(totalPower / 1000 * 10) / 10,
    totalWaterConsumption_L_per_hr: Math.round(totalWater),
    totalCarbonOutput_tonne_per_hr: Math.round(totalCarbon / 1000 * 100) / 100,
    avgCarbonIntensity_gco2_per_kwh: Math.round(avgCarbonIntensity),
    cleanestDC: snapshots.reduce((a, b) => a.carbonIntensity_gco2_per_kwh < b.carbonIntensity_gco2_per_kwh ? a : b),
    dirtiestDC: snapshots.reduce((a, b) => a.carbonIntensity_gco2_per_kwh > b.carbonIntensity_gco2_per_kwh ? a : b),
  };
}
