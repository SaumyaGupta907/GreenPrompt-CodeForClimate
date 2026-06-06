import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Tooltip,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DATACENTERS,
  getAllLiveSnapshots,
  getGlobalAggregate,
  CARBON_THRESHOLDS,
  ratingColor,
} from "../datacenters.js";
import { AnimatedNumber, StatCard, Panel } from "../components/ui.jsx";

/* Tick faster than 30s for demo readability — every 4s */
const TICK_MS = 4000;

export default function GlobalMap() {
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState("dc-08"); // Montréal — cleanest
  const [routeMode, setRouteMode] = useState(false);
  const [sort, setSort] = useState("carbon");

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const snapshots = useMemo(() => getAllLiveSnapshots(tick), [tick]);
  const agg = useMemo(() => getGlobalAggregate(tick), [tick]);
  const selected = snapshots.find((s) => s.id === selectedId) || snapshots[0];

  const cleanestId = agg.cleanestDC.id;
  const dirtiestId = agg.dirtiestDC.id;
  const nyc = { lat: 40.7128, lng: -74.006 };
  const cleanest = snapshots.find((s) => s.id === cleanestId);

  const sorted = [...snapshots].sort((a, b) => {
    if (sort === "carbon")
      return a.carbonIntensity_gco2_per_kwh - b.carbonIntensity_gco2_per_kwh;
    if (sort === "power")
      return b.totalFacilityPower_kw - a.totalFacilityPower_kw;
    if (sort === "water")
      return b.waterConsumption_L_per_hr - a.waterConsumption_L_per_hr;
    if (sort === "output")
      return b.carbonOutput_kg_per_hr - a.carbonOutput_kg_per_hr;
    return 0;
  });

  return (
    <div className="page-enter col gap-6">
      <Header tick={tick} />

      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <StatCard
          label="Total facility power"
          value={
            <>
              <AnimatedNumber
                value={agg.totalFacilityPower_mw}
                decimals={1}
                animateMount={false}
              />{" "}
              <span style={{ fontSize: 18, color: "var(--text-muted)" }}>
                MW
              </span>
            </>
          }
          subtitle="across all 10 hyperscaler campuses"
          accent="peri"
        />
        <StatCard
          label="CO₂ output"
          value={
            <>
              <AnimatedNumber
                value={agg.totalCarbonOutput_tonne_per_hr}
                decimals={2}
                animateMount={false}
              />{" "}
              <span style={{ fontSize: 18, color: "var(--text-muted)" }}>
                t/hr
              </span>
            </>
          }
          subtitle={`≈ ${Math.round(agg.totalCarbonOutput_tonne_per_hr * 24).toLocaleString()} t / day · live`}
          accent="coral"
        />
        <StatCard
          label="Water consumption"
          value={
            <>
              <AnimatedNumber
                value={agg.totalWaterConsumption_L_per_hr / 1000}
                decimals={1}
                animateMount={false}
              />{" "}
              <span style={{ fontSize: 18, color: "var(--text-muted)" }}>
                kL/hr
              </span>
            </>
          }
          subtitle="for evaporative cooling"
          accent="peri"
        />
        <StatCard
          label="Avg grid intensity"
          value={
            <>
              <AnimatedNumber
                value={agg.avgCarbonIntensity_gco2_per_kwh}
                animateMount={false}
              />{" "}
              <span style={{ fontSize: 18, color: "var(--text-muted)" }}>
                gCO₂/kWh
              </span>
            </>
          }
          subtitle={
            <span>
              <span className="acid">
                {agg.cleanestDC.location.city.split(",")[0]}
              </span>{" "}
              cleanest ·{" "}
              <span className="coral">
                {agg.dirtiestDC.location.city.split(",")[0]}
              </span>{" "}
              dirtiest
            </span>
          }
          accent="acid"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <Panel
          title="Global infrastructure"
          right={
            <div className="row gap-2">
              <button
                className="btn btn-chip"
                style={{
                  borderColor: routeMode ? "var(--acid)" : "var(--border)",
                  background: routeMode ? "var(--acid-soft)" : undefined,
                  color: routeMode ? "var(--acid)" : "var(--text)",
                }}
                onClick={() => setRouteMode((v) => !v)}
              >
                {routeMode ? "Hide route" : "Spotlight optimal route"}
              </button>
            </div>
          }
          padding={0}
          style={{ overflow: "hidden" }}
        >
          <div
            style={{
              position: "relative",
              height: 560,
              borderTop: "1px solid var(--border)",
            }}
          >
            <MapContainer
              center={[28, 10]}
              zoom={2}
              minZoom={2}
              maxZoom={6}
              worldCopyJump
              scrollWheelZoom
              style={{ height: "100%", width: "100%", background: "#070912" }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                subdomains="abcd"
                maxZoom={19}
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                attribution=""
                subdomains="abcd"
                maxZoom={19}
                opacity={0.5}
              />
              <FlyTo target={selected} />
              {snapshots.map((s) => (
                <DCMarker
                  key={s.id}
                  s={s}
                  selected={s.id === selectedId}
                  onSelect={() => setSelectedId(s.id)}
                />
              ))}
              {routeMode && cleanest && (
                <RouteLine from={nyc} to={cleanest.location} />
              )}
            </MapContainer>

            {/* Legend */}
            <div
              className="card-glass"
              style={{
                position: "absolute",
                bottom: 14,
                left: 14,
                padding: 12,
                fontSize: 11.5,
                borderRadius: 10,
                maxWidth: 240,
                zIndex: 400,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                Carbon intensity · gCO₂/kWh
              </div>
              {Object.entries(CARBON_THRESHOLDS).map(([k, v], i, arr) => (
                <div
                  key={k}
                  className="row gap-2"
                  style={{ marginTop: 4, fontSize: 12 }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: v.color,
                      boxShadow: `0 0 8px ${v.color}66`,
                    }}
                  />
                  <span style={{ color: "var(--text-h)", minWidth: 64 }}>
                    {v.label}
                  </span>
                  <span className="mono dim" style={{ fontSize: 11 }}>
                    {i === 0
                      ? `< ${v.max}`
                      : i === arr.length - 1
                        ? `> ${arr[i - 1][1].max}`
                        : `${arr[i - 1][1].max}–${v.max}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Live indicator */}
            <div
              className="card-glass"
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                padding: "8px 12px",
                borderRadius: 999,
                fontSize: 11.5,
                zIndex: 400,
              }}
            >
              <div className="row gap-2">
                <span className="dot" />
                <span style={{ color: "var(--text-h)" }}>Live</span>
                <span className="dim">· tick {tick}</span>
              </div>
            </div>

            {routeMode && cleanest && (
              <div
                className="card-glass"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  padding: 12,
                  fontSize: 12,
                  borderRadius: 10,
                  maxWidth: 240,
                  zIndex: 400,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  Optimal route from NYC
                </div>
                <div
                  style={{
                    color: "var(--text-h)",
                    fontFamily: "var(--serif)",
                    fontSize: 14,
                  }}
                >
                  → {cleanest.location.city.split(",")[0]}
                </div>
                <div
                  className="mono acid"
                  style={{ fontSize: 11, marginTop: 4 }}
                >
                  {cleanest.carbonIntensity_gco2_per_kwh} gCO₂/kWh ·{" "}
                  {cleanest.renewableMix_pct}% renewable
                </div>
              </div>
            )}
          </div>
        </Panel>

        <DetailPanel
          s={selected}
          cleanestId={cleanestId}
          dirtiestId={dirtiestId}
        />
      </div>

      <Panel
        title="Ranked datacenters"
        right={
          <div className="row gap-2">
            {[
              { id: "carbon", label: "Carbon intensity" },
              { id: "output", label: "CO₂ output" },
              { id: "power", label: "Power draw" },
              { id: "water", label: "Water use" },
            ].map((s) => (
              <button
                key={s.id}
                className="btn btn-chip"
                onClick={() => setSort(s.id)}
                style={{
                  borderColor: sort === s.id ? "var(--acid)" : "var(--border)",
                  background: sort === s.id ? "var(--acid-soft)" : undefined,
                  color: sort === s.id ? "var(--acid)" : "var(--text)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      >
        <RankedTable
          rows={sorted}
          onSelect={setSelectedId}
          selectedId={selectedId}
          sort={sort}
        />
      </Panel>
    </div>
  );
}

function Header({ tick }) {
  return (
    <div
      className="row"
      style={{
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div>
        <div className="row gap-2" style={{ marginBottom: 8 }}>
          <span className="tag tag-acid">
            <span className="dot" /> Live
          </span>
          <span className="tag" style={{ color: "var(--text-muted)" }}>
            10 datacenters · 4 continents
          </span>
        </div>
        <h1>The world's compute, by carbon.</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, maxWidth: 660 }}>
          Every dot is a hyperscaler campus. Size is power draw, color is live
          grid intensity. Updates every {TICK_MS / 1000}s — same engine that
          powers GreenPrompt's routing decisions.
        </p>
      </div>
    </div>
  );
}

/* ── Map components ───────────────────────────────────────────── */

function makeDcIcon({ color, size, selected }) {
  return L.divIcon({
    className: "dc-pin-wrap",
    iconSize: [size + 18, size + 18],
    iconAnchor: [(size + 18) / 2, (size + 18) / 2],
    html: `
      <div class="dc-pin ${selected ? "is-selected" : ""}" style="--c: ${color}; --s: ${size}px;">
        <span class="dc-pin-ring"></span>
        <span class="dc-pin-emoji" role="img" aria-label="datacenter">🖥️</span>
      </div>
    `,
  });
}

function DCMarker({ s, selected, onSelect }) {
  const color = ratingColor(s.carbonRating);
  // Ring size scales with itLoad: 60MW → 26px, 300MW → 46px
  const size = Math.round(
    Math.max(26, Math.min(46, 26 + ((s.itLoad_kw - 60000) / 240000) * 20)),
  );
  const icon = makeDcIcon({ color, size, selected });
  return (
    <Marker
      position={[s.location.lat, s.location.lng]}
      icon={icon}
      eventHandlers={{ click: onSelect }}
    >
      <Tooltip
        direction="top"
        offset={[0, -size / 2 - 6]}
        opacity={1}
        className="dc-tooltip"
      >
        <div style={{ minWidth: 180 }}>
          <div
            style={{
              fontFamily: "var(--serif)",
              color: "var(--text-h)",
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            {s.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            {s.location.city}
          </div>
          <div className="mono" style={{ fontSize: 11.5, color }}>
            {s.carbonIntensity_gco2_per_kwh} gCO₂/kWh · {s.carbonRating}
          </div>
          <div className="mono dim" style={{ fontSize: 11, marginTop: 2 }}>
            {(s.totalFacilityPower_kw / 1000).toFixed(0)} MW ·{" "}
            {s.renewableMix_pct}% renewable
          </div>
        </div>
      </Tooltip>
    </Marker>
  );
}

const humanIcon = L.divIcon({
  className: "dc-pin-wrap",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `
    <div class="human-pin">
      <span class="human-pin-ring"></span>
      <span class="human-pin-emoji" role="img" aria-label="end user">🧑</span>
    </div>
  `,
});

function RouteLine({ from, to }) {
  return (
    <>
      <Polyline
        positions={[
          [from.lat, from.lng],
          [to.lat, to.lng],
        ]}
        pathOptions={{
          color: "#C8FF3D",
          weight: 2.5,
          opacity: 0.9,
          dashArray: "6 8",
          className: "route-line",
        }}
      />
      <Marker position={[from.lat, from.lng]} icon={humanIcon}>
        <Tooltip direction="top" offset={[0, -18]} permanent>
          <div style={{ fontSize: 11 }}>Brooklyn AI Co · NYC</div>
        </Tooltip>
      </Marker>
    </>
  );
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(
      [target.location.lat, target.location.lng],
      Math.max(map.getZoom(), 3),
      { duration: 0.9 },
    );
  }, [target?.id]);
  return null;
}

/* ── Detail panel ─────────────────────────────────────────────── */

function DetailPanel({ s, cleanestId, dirtiestId }) {
  if (!s) return null;
  const color = ratingColor(s.carbonRating);
  return (
    <Panel
      title={
        <span>
          <span
            style={{
              fontFamily: "var(--serif)",
              fontSize: 17,
              color: "var(--text-h)",
            }}
          >
            {s.name}
          </span>
        </span>
      }
      right={
        <div className="row gap-2">
          {s.id === cleanestId && (
            <span className="tag tag-acid">
              <span className="dot" /> cleanest now
            </span>
          )}
          {s.id === dirtiestId && (
            <span className="tag tag-crit">dirtiest now</span>
          )}
        </div>
      }
    >
      <div
        className="row gap-2"
        style={{ marginBottom: 18, color: "var(--text-muted)", fontSize: 12.5 }}
      >
        <span>
          {s.location.city}, {s.location.country}
        </span>
        <span className="dim">·</span>
        <span className="mono">{s.gridRegion}</span>
        <span className="dim">·</span>
        <span>{s.operator}</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <MetricCard
          label="Carbon intensity"
          value={s.carbonIntensity_gco2_per_kwh}
          unit="gCO₂/kWh"
          delta={s.delta.carbonIntensity}
          color={color}
        />
        <MetricCard
          label="CO₂ output"
          value={s.carbonOutput_kg_per_hr}
          unit="kg/hr"
          decimals={1}
          delta={s.delta.carbonOutput}
          color="var(--coral)"
        />
        <MetricCard
          label="Facility power"
          value={s.totalFacilityPower_kw / 1000}
          unit="MW"
          decimals={1}
          delta={s.delta.facilityPower / 1000}
          color="var(--peri)"
        />
        <MetricCard
          label="Water"
          value={s.waterConsumption_L_per_hr}
          unit="L/hr"
          delta={s.delta.waterConsumption}
          color="var(--peri)"
        />
      </div>

      <div
        className="card"
        style={{ padding: 14, background: "rgba(255,255,255,0.012)" }}
      >
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            marginBottom: 6,
            fontSize: 11.5,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <span>Renewable mix</span>
          <span className="mono acid">{s.renewableMix_pct}%</span>
        </div>
        <div
          style={{
            height: 6,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${s.renewableMix_pct}%`,
              background: "linear-gradient(90deg, var(--peri), var(--acid))",
              borderRadius: 999,
              transition: "width 500ms ease",
            }}
          />
        </div>
        <div
          style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 8 }}
        >
          Grid operator:{" "}
          <span style={{ color: "var(--text-h)" }}>{s.gridOperator}</span>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
        PUE <span className="mono text-h">{s.pue.toFixed(2)}</span> · WUE{" "}
        <span className="mono text-h">
          {s.wue_liters_per_kwh.toFixed(2)} L/kWh
        </span>{" "}
        · IT load{" "}
        <span className="mono text-h">
          {(s.itLoad_kw / 1000).toFixed(0)} MW
        </span>
      </div>
    </Panel>
  );
}

function MetricCard({ label, value, unit, decimals = 0, delta, color }) {
  const up = delta > 0;
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: "1px solid var(--border-soft)",
        background: "rgba(255,255,255,0.015)",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 24,
          marginTop: 4,
          color,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        <AnimatedNumber
          value={value}
          decimals={decimals}
          duration={600}
          animateMount={false}
        />
        <span
          style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}
        >
          {unit}
        </span>
      </div>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          color: up ? "var(--critical)" : "var(--acid)",
          marginTop: 2,
        }}
      >
        {up ? "▲" : "▼"} {Math.abs(delta).toFixed(decimals + 1)}
      </div>
    </div>
  );
}

/* ── Ranked table ─────────────────────────────────────────────── */

function RankedTable({ rows, onSelect, selectedId, sort }) {
  const maxByMetric = {
    carbon: Math.max(...rows.map((r) => r.carbonIntensity_gco2_per_kwh)),
    output: Math.max(...rows.map((r) => r.carbonOutput_kg_per_hr)),
    power: Math.max(...rows.map((r) => r.totalFacilityPower_kw)),
    water: Math.max(...rows.map((r) => r.waterConsumption_L_per_hr)),
  };

  const getVal = (r) => {
    if (sort === "carbon")
      return {
        v: r.carbonIntensity_gco2_per_kwh,
        u: "gCO₂/kWh",
        max: maxByMetric.carbon,
      };
    if (sort === "output")
      return {
        v: r.carbonOutput_kg_per_hr,
        u: "kg / hr",
        max: maxByMetric.output,
      };
    if (sort === "power")
      return {
        v: r.totalFacilityPower_kw / 1000,
        u: "MW",
        max: maxByMetric.power / 1000,
      };
    if (sort === "water")
      return {
        v: r.waterConsumption_L_per_hr,
        u: "L / hr",
        max: maxByMetric.water,
      };
  };

  return (
    <div style={{ overflowX: "auto", margin: "0 -22px" }}>
      <table className="tbl" style={{ minWidth: 800 }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 22, width: 32 }}>#</th>
            <th>Datacenter</th>
            <th>Location</th>
            <th>Grid</th>
            <th>
              {sort === "carbon"
                ? "Carbon intensity"
                : sort === "output"
                  ? "CO₂ output"
                  : sort === "power"
                    ? "Power"
                    : "Water"}
            </th>
            <th className="right">Renewables</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const m = getVal(r);
            const pct = (m.v / m.max) * 100;
            return (
              <tr
                key={r.id}
                onClick={() => onSelect(r.id)}
                style={{
                  cursor: "pointer",
                  background:
                    selectedId === r.id ? "rgba(200,255,61,0.04)" : undefined,
                }}
              >
                <td style={{ paddingLeft: 22 }} className="mono dim">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td>
                  <div className="row gap-2">
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: ratingColor(r.carbonRating),
                        boxShadow: `0 0 8px ${ratingColor(r.carbonRating)}66`,
                      }}
                    />
                    <span style={{ color: "var(--text-h)" }}>{r.name}</span>
                  </div>
                </td>
                <td className="mono dim" style={{ fontSize: 11.5 }}>
                  {r.location.city}
                </td>
                <td style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                  {r.gridOperator.split(" (")[0]}
                </td>
                <td style={{ minWidth: 220 }}>
                  <div className="row gap-3">
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: ratingColor(r.carbonRating),
                          borderRadius: 999,
                          transition: "width 400ms ease",
                        }}
                      />
                    </div>
                    <span
                      className="mono"
                      style={{
                        minWidth: 110,
                        textAlign: "right",
                        color: "var(--text-h)",
                      }}
                    >
                      {m.v.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}{" "}
                      <span className="dim">{m.u}</span>
                    </span>
                  </div>
                </td>
                <td
                  className="right mono"
                  style={{
                    color:
                      r.renewableMix_pct > 70 ? "var(--acid)" : "var(--text-h)",
                  }}
                >
                  {r.renewableMix_pct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
