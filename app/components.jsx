// =========================================================
// Shared components — icons, charts, atoms
// =========================================================

const { useState, useEffect, useRef, useMemo } = React;

// ---------- Icons (line, 18px viewBox via stroke) ----------
const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" /><rect x="3" y="15" width="7" height="6" rx="1.5" /></>,
    income: <><path d="M3 17V7l9-4 9 4v10" /><path d="M7 17v-5h10v5" /><path d="M12 17v-5" /></>,
    invest: <><path d="M3 21h18" /><path d="M5 21V9l7-4 7 4v12" /><path d="M9 21v-7h6v7" /></>,
    loans: <><path d="M4 7h16v10H4z" /><circle cx="12" cy="12" r="2.5" /><path d="M8 10v.01M16 14v.01" /></>,
    trading: <><path d="M3 17l5-6 4 4 8-9" /><path d="M14 6h7v7" /></>,
    projects: <><path d="M3 7h7l2 2h9v11H3z" /><path d="M3 12h18" /></>,
    networth: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9 9h5a2 2 0 010 4H10a2 2 0 000 4h5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2L5 5.8 3 9.3l2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
    bell: <><path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" /><path d="M10 21a2 2 0 004 0" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7" /></>,
    arrowRight: <><path d="M5 12h14M13 5l7 7-7 7" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0112 6c6.5 0 10 7 10 7a17 17 0 01-3.4 4.3" /><path d="M6.6 6.6A17 17 0 002 13s3.5 7 10 7c1.6 0 3-.4 4.3-1" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>,
    download: <><path d="M12 3v12M6 11l6 6 6-6" /><path d="M3 21h18" /></>,
    filter: <><path d="M4 5h16l-6 8v6l-4-2v-4z" /></>,
    sort: <><path d="M3 6h18M6 12h12M9 18h6" /></>,
    check: <><path d="M5 12l4 4 10-10" /></>,
    x: <><path d="M5 5l14 14M19 5L5 19" /></>,
    chevDown: <><path d="M6 9l6 6 6-6" /></>,
    chevRight: <><path d="M9 6l6 6-6 6" /></>,
    dots: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    building: <><path d="M4 21V5l8-2v18" /><path d="M12 21V8l8 2v11" /><path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" /></>,
    storefront: <><path d="M3 9l1-5h16l1 5" /><path d="M4 9v12h16V9" /><path d="M3 9c0 2 2 3 4.5 3S12 11 12 9c0 2 2 3 4.5 3S21 11 21 9" /></>,
    contract: <><path d="M14 3H6v18h12V8z" /><path d="M14 3v5h4" /><path d="M9 13h6M9 17h4" /></>,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M9 9h4.5a2 2 0 010 4H10a2 2 0 000 4H15" /></>,
    flag: <><path d="M5 21V4l12 2-3 4 3 4-12 1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    refresh: <><path d="M3 12a9 9 0 0115-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
    bolt: <><path d="M13 3L4 14h7l-1 7 9-11h-7z" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>,
    command: <><rect x="6" y="6" width="12" height="12" rx="0" /><path d="M9 6V4a2 2 0 10-2 2h2zm6 0V4a2 2 0 112 2h-2zM9 18v2a2 2 0 11-2-2h2zm6 0v2a2 2 0 102-2h-2z" /></>,
    link: <><path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.41 1.41" /><path d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 007.07 7.07l1.41-1.41" /></>,
    plug: <><path d="M9 7V3M15 7V3" /><path d="M5 7h14v4a7 7 0 01-14 0z" /><path d="M12 18v3" /></>,
    shieldCheck: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
    alert: <><path d="M12 9v4M12 17v.01" /><path d="M10.3 3.7L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.7a2 2 0 00-3.4 0z" /></>,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      {paths[name] || null}
    </svg>
  );
};

// ---------- Big display number ----------
const Display = ({ value, from = "USD", currency, decimals = 0, blur = false }) => {
  const ctxCcy = React.useContext(window.CurrencyContext || React.createContext("USD"));
  const disp = currency || ctxCcy || "USD";
  const v = window.convertFx ? window.convertFx(value, from, disp) : value;
  const parts = Math.abs(v).toFixed(decimals).split(".");
  const whole = Number(parts[0]).toLocaleString();
  const cents = parts[1];
  return (
    <span className="h-display tabular" style={{ filter: blur ? "blur(8px)" : "none", display: "inline-flex", alignItems: "baseline" }}>
      <span className="currency">
        {disp === "AED"
          ? <window.AedMark style={{ fontSize: "0.85em", marginRight: "0.12em" }} />
          : ((window.SYMBOLS && window.SYMBOLS[disp]) || "$").trim()}
      </span>
      {v < 0 ? "−" : ""}{whole}
      {cents ? <span className="cents">.{cents}</span> : null}
    </span>
  );
};

// ---------- Delta chip ----------
const Delta = ({ value, suffix = "%", showSign = true }) => {
  if (value == null || isNaN(value) || !isFinite(value)) return null;
  const pos = value >= 0;
  return (
    <span className={`chip ${pos ? "pos" : "neg"}`}>
      <Icon name={pos ? "arrowUp" : "arrowDown"} size={11} stroke={2.2} />
      <span className="tabular">{showSign ? (pos ? "+" : "") : ""}{value.toFixed(2)}{suffix}</span>
    </span>
  );
};

// ---------- Sparkline ----------
const Sparkline = ({ data, color = "var(--ink)", fill = false, height = 36, strokeW = 1.6 }) => {
  if (!data || data.length === 0) return null;
  const w = 200;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const dArea = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {fill && <path d={dArea} fill={color} opacity="0.10" />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

// ---------- Area chart with grid + labels ----------
const ChartEmpty = ({ height = 240, label = "No data yet" }) => (
  <div style={{
    height, display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--muted)", fontSize: 12.5, border: "1px dashed var(--line)", borderRadius: 12,
  }}>{label}</div>
);

const AreaChart = ({ data, valueKey, labelKey = "m", color = "var(--ink)", height = 240, formatY = (v) => v, formatTip = (v) => v }) => {
  if (!data || data.length === 0) return <ChartEmpty height={height} />;
  const w = 800;
  const h = height;
  const pad = { l: 50, r: 16, t: 14, b: 28 };
  const values = data.map((d) => d[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const niceMin = min - range * 0.08;
  const niceMax = max + range * 0.05;
  const nRange = niceMax - niceMin;

  const x = (i) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - niceMin) / nRange) * (h - pad.t - pad.b);

  const pts = data.map((d, i) => [x(i), y(d[valueKey])]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = path + ` L ${pts[pts.length - 1][0]} ${h - pad.b} L ${pts[0][0]} ${h - pad.b} Z`;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => niceMin + (i / ticks) * nRange);

  const [hover, setHover] = useState(null);
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * w;
    const idx = Math.round(((px - pad.l) / (w - pad.l - pad.r)) * (data.length - 1));
    if (idx >= 0 && idx < data.length) setHover(idx);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line-2)" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "2 4"} />
            <text x={pad.l - 8} y={y(t) + 3} fontSize="10" textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">{formatY(t)}</text>
          </g>
        ))}
        <path d={area} fill={color} opacity="0.08" />
        <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <text key={i} x={x(i)} y={h - 8} fontSize="10" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)">{d[labelKey]}</text>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={h - pad.b} stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={x(hover)} cy={y(data[hover][valueKey])} r="4" fill={color} />
            <circle cx={x(hover)} cy={y(data[hover][valueKey])} r="7" fill={color} opacity="0.18" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div style={{
          position: "absolute", top: 8, right: 16,
          background: "var(--surface-2)", border: "1px solid var(--line)",
          borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "var(--shadow-md)",
        }}>
          <div className="muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>{data[hover][labelKey]}</div>
          <div className="tabular" style={{ fontSize: 16, fontFamily: "var(--font-serif)", letterSpacing: "-0.01em" }}>{formatTip(data[hover][valueKey])}</div>
        </div>
      )}
    </div>
  );
};

// ---------- Stacked bar chart (months) ----------
const StackedBars = ({ data, keys, colors, labelKey = "m", height = 200, formatY = (v) => v }) => {
  if (!data || data.length === 0) return <ChartEmpty height={height} />;
  const w = 800;
  const h = height;
  const pad = { l: 50, r: 16, t: 14, b: 28 };
  const totals = data.map((d) => keys.reduce((s, k) => s + d[k], 0));
  const max = Math.max(...totals) * 1.1;
  const x = (i) => pad.l + (i / data.length) * (w - pad.l - pad.r);
  const barW = ((w - pad.l - pad.r) / data.length) * 0.55;
  const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => p * max);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line-2)" strokeDasharray={i === 0 ? "0" : "2 4"} />
          <text x={pad.l - 8} y={y(t) + 3} fontSize="10" textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">{formatY(t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = x(i) + ((w - pad.l - pad.r) / data.length) * 0.5 - barW / 2;
        let stack = 0;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const v = d[k];
              const yTop = y(stack + v);
              const yBot = y(stack);
              stack += v;
              return (
                <rect key={k} x={cx} y={yTop} width={barW} height={Math.max(0, yBot - yTop)} fill={colors[ki]} rx="2" />
              );
            })}
            <text x={cx + barW / 2} y={h - 8} fontSize="10" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------- Donut ----------
const Donut = ({ data, size = 200, thickness = 22 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = (d.value / total) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
};

// ---------- Status pill ----------
const Status = ({ kind, label }) => {
  const map = {
    "On track": "pos",
    "Deferred": "warn",
    "Active": "pos",
    "Overdue": "neg",
    "Due soon": "warn",
    "Family": "",
    "In progress": "pos",
    "Evaluating": "warn",
  };
  return <span className={`chip ${map[label] || ""}`}><span className={`dot ${map[label] || "muted"}`} />{label}</span>;
};

// ---------- MarketTape — live ticker tape ----------
// Pulls from `window.tradingTickers` which is updated every 60s by
// tickers.js (CoinGecko, Frankfurter, Yahoo). Subscribes to refreshes
// so the tape re-renders without a parent re-mount.
const MarketTape = ({ variant = "scroll", compact = false }) => {
  const [, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    if (window.tickers?.subscribe) return window.tickers.subscribe(force);
  }, []);

  const rows = window.tradingTickers || [];
  const last = window.tickers?.snapshot?.().lastUpdated;
  const empty = rows.length === 0;

  const formatPrice = (v, dp) => {
    const decimals = dp != null ? dp : (Math.abs(v) >= 1 ? 2 : 4);
    return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  if (variant === "grid") {
    return (
      <div className="grid-3">
        {empty ? (
          <div className="muted" style={{ gridColumn: "span 3", fontSize: 12, padding: "8px 0" }}>
            Fetching live market data…
          </div>
        ) : rows.slice(0, 6).map((t) => (
          <div className="ticker" key={t.sym}>
            <span className="sym">{t.sym}</span>
            <span className="grow" />
            <span className="price">{formatPrice(t.price, t.priceDp)}</span>
            <span className={`delta ${t.delta >= 0 ? "pos" : "neg"}`}>
              {t.delta >= 0 ? "+" : ""}{t.delta.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    );
  }

  // scrolling / compact strip
  const tapeRows = empty ? [] : rows.concat(rows);
  return (
    <div className="card tight" style={{ overflow: "hidden", padding: 0 }}>
      <div className="row" style={{ overflowX: "auto" }}>
        {empty ? (
          <div className="muted" style={{ padding: compact ? "10px 18px" : "12px 20px", fontSize: 12 }}>
            Fetching live market data…
          </div>
        ) : tapeRows.map((t, i) => (
          <div
            key={i}
            className="row gap-2"
            style={{
              padding: compact ? "10px 18px" : "12px 20px",
              borderRight: "1px solid var(--line-2)",
              whiteSpace: "nowrap",
            }}
          >
            <span className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>{t.sym}</span>
            <span className="mono" style={{ fontSize: compact ? 11 : 12 }}>{formatPrice(t.price, t.priceDp)}</span>
            <span className={`mono ${t.delta >= 0 ? "pos" : "neg"}`} style={{ fontSize: 11 }}>
              {compact ? (t.delta >= 0 ? "+" : "") : (t.delta >= 0 ? "▲ " : "▼ ")}
              {compact ? t.delta.toFixed(2) : Math.abs(t.delta).toFixed(2)}%
            </span>
          </div>
        ))}
        {!empty && last && (() => {
          const gf = (window.integrations || []).find((i) => i.provider === "googlefinance" && i.status !== "paused" && i.status !== "error");
          const sourceLabel = gf ? "Google Finance" : "live";
          return (
            <div className="muted row" style={{ padding: compact ? "10px 18px" : "12px 20px", fontSize: 10, whiteSpace: "nowrap", marginLeft: "auto" }}>
              <span className="dot pos" style={{ marginRight: 6 }} />
              {sourceLabel} · {last.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ---------- Make components globally available ----------
Object.assign(window, { Icon, Display, Delta, Sparkline, AreaChart, StackedBars, Donut, Status, MarketTape });
