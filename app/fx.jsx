// =========================================================
// FX — currency conversion engine
// All conversions go through USD as the pivot.
// =========================================================

// Mid-market rates · 1 USD = ...
const FX_RATES = {
  USD: 1,
  GHS: 14.50,
  AED: 3.67,
};

// 24h prior, for trend arrows
const FX_RATES_PREV = {
  USD: 1,
  GHS: 14.32,
  AED: 3.673,
};

const FX_UPDATED = "May 24, 2026 · 09:42 GMT";

const SYMBOLS = { USD: "$", GHS: "₵", AED: "Dh " };
const CCY_NAMES = { USD: "US Dollar", GHS: "Ghana Cedi", AED: "UAE Dirham" };

// ---------- AED symbol mark ----------
// The new UAE Dirham symbol (introduced March 2024) is a stylised capital D
// with two horizontal strokes through it. Unicode support is poor, so we
// render it inline with currentColor strokes.
const AedMark = ({ style }) => (
  <span aria-label="UAE Dirham" style={{
    position: "relative",
    display: "inline-block",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: 700,
    lineHeight: 1,
    fontStyle: "normal",
    paddingLeft: "0.2em",
    paddingRight: "0.06em",
    ...style,
  }}>
    D
    <span style={{ position: "absolute", left: 0, right: "0.04em", top: "34%", height: "0.09em", background: "currentColor", borderRadius: "0.04em" }} />
    <span style={{ position: "absolute", left: 0, right: "0.04em", top: "62%", height: "0.09em", background: "currentColor", borderRadius: "0.04em" }} />
  </span>
);

// ---------- Sym — picks the right visual symbol for a currency ----------
const Sym = ({ ccy, style }) => {
  if (ccy === "AED") return <AedMark style={style} />;
  return <span style={style}>{(SYMBOLS[ccy] || "").trim()}</span>;
};

// Convert any amount between supported currencies via USD pivot
const convertFx = (amount, from, to) => {
  if (!amount || from === to) return amount;
  const inUsd = (amount || 0) / FX_RATES[from || "USD"];
  return inUsd * FX_RATES[to || "USD"];
};

// Format helper
const formatCurrency = (amount, currency = "USD", opts = {}) => {
  const { decimals = 0, compact = false, sign = false, symbol = true } = opts;
  let n = amount;
  let suffix = "";
  if (compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1e6) { n = n / 1e6; suffix = "M"; }
    else if (Math.abs(n) >= 1e3) { n = n / 1e3; suffix = "K"; }
  }
  const abs = Math.abs(n);
  const decs = compact ? (abs >= 100 ? 0 : 1) : decimals;
  const str = abs.toLocaleString("en-US", { minimumFractionDigits: decs, maximumFractionDigits: decs });
  const prefix = (sign && amount > 0) ? "+" : (amount < 0 ? "−" : "");
  return prefix + (symbol ? SYMBOLS[currency] : "") + str + suffix;
};

// Shared Context — the active display currency
const CurrencyContext = React.createContext("USD");

// Hook — gives back convert + format functions bound to the active display ccy
const useMoney = () => {
  const display = React.useContext(window.CurrencyContext);
  return {
    display,
    symbol: SYMBOLS[display],
    convert: (a, from = "USD") => convertFx(a, from || "USD", display),
    fmt: (a, from = "USD", opts = {}) => formatCurrency(convertFx(a, from || "USD", display), display, opts),
    fmtK: (a, from = "USD") => formatCurrency(convertFx(a, from || "USD", display), display, { compact: true }),
    fmtSign: (a, from = "USD", opts = {}) => formatCurrency(convertFx(a, from || "USD", display), display, { ...opts, sign: true }),
  };
};

// ---------- Money — primary amount renderer ----------
// Props:
//   amount      number (in `from` currency)
//   from        "USD" | "GHS" | "AED" (default USD)
//   compact     -> shows K/M suffix
//   decimals    -> override decimal places
//   sign        -> show + for positive
//   hint        -> show native currency below if it differs from display
//   className   -> applied to wrapper span
const Money = ({
  amount, from = "USD", compact = false, decimals = 0, sign = false,
  hint = false, className = "", style,
}) => {
  const display = React.useContext(window.CurrencyContext);
  const converted = convertFx(amount, from, display);
  return (
    <span className={`mono tabular ${className}`} style={style}>
      {formatCurrency(converted, display, { compact, decimals, sign })}
      {hint && from !== display && (
        <span className="muted" style={{ fontSize: "0.8em", marginLeft: 6, fontWeight: 400 }}>
          {formatCurrency(amount, from, { compact, decimals })}
        </span>
      )}
    </span>
  );
};

// ---------- Display number (hero) ----------
const MoneyDisplay = ({ amount, from = "USD", decimals = 0, blur = false }) => {
  const display = React.useContext(window.CurrencyContext);
  const v = convertFx(amount, from, display);
  const parts = Math.abs(v).toFixed(decimals).split(".");
  const whole = Number(parts[0]).toLocaleString();
  const cents = parts[1];
  return (
    <span className="h-display tabular" style={{ filter: blur ? "blur(8px)" : "none" }}>
      <span className="currency">{SYMBOLS[display].trim()}</span>
      {v < 0 ? "−" : ""}{whole}
      {cents ? <span className="cents">.{cents}</span> : null}
    </span>
  );
};

// ---------- Currency switch (for topbar / anywhere) ----------
const CurrencySwitch = ({ size = "md" }) => {
  const display = React.useContext(window.CurrencyContext);
  const set = window.__setDisplayCurrency || (() => {});
  return (
    <div
      className="row"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: 2,
        height: size === "sm" ? 30 : 34,
      }}
      title="Display currency"
    >
      {["USD", "GHS", "AED"].map((c) => (
        <button
          key={c}
          onClick={() => set(c)}
          style={{
            height: "100%",
            padding: "0 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.02em",
            background: display === c ? "var(--ink)" : "transparent",
            color: display === c ? "var(--surface)" : "var(--muted)",
            transition: "background 120ms, color 120ms",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, display: "inline-flex", alignItems: "center" }}>
            {c === "AED" ? <AedMark style={{ fontSize: 13 }} /> : SYMBOLS[c].trim()}
          </span>
          {c}
        </button>
      ))}
    </div>
  );
};

// ---------- FX Rates widget ----------
const FxRatesWidget = ({ compact = false }) => {
  const display = React.useContext(window.CurrencyContext);

  // Show rates of the other currencies in terms of the display currency.
  const others = ["USD", "GHS", "AED"].filter((c) => c !== display);

  const rates = others.map((from) => {
    const cur = convertFx(1, from, display);
    const prev = (1 / FX_RATES_PREV[from]) * FX_RATES_PREV[display];
    const chg = ((cur - prev) / prev) * 100;
    return { pair: `${from}/${display}`, from, cur, chg };
  });

  // Cross pair too
  const crossA = others[0], crossB = others[1];
  const crossCur = convertFx(1, crossA, crossB);
  const crossPrev = (1 / FX_RATES_PREV[crossA]) * FX_RATES_PREV[crossB];
  const crossChg = ((crossCur - crossPrev) / crossPrev) * 100;
  rates.push({ pair: `${crossA}/${crossB}`, cur: crossCur, chg: crossChg });

  return (
    <div className={compact ? "" : "card"}>
      {!compact && (
        <div className="row between" style={{ marginBottom: 14 }}>
          <div>
            <div className="eyebrow">FX rates</div>
            <div className="h-section" style={{ marginTop: 4 }}>vs {display}</div>
          </div>
          <div className="row gap-2" style={{ fontSize: 11, color: "var(--muted)" }}>
            <span className="dot pos" /> Live · mid-market
          </div>
        </div>
      )}
      <div className="col gap-3">
        {rates.map((r) => (
          <div key={r.pair} className="row between">
            <div className="row gap-3">
              <span className="mono" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>{r.pair}</span>
              <span className="muted" style={{ fontSize: 11 }}>
                1 {r.pair.split("/")[0]} =
              </span>
            </div>
            <div className="row gap-3">
              <span className="mono" style={{ fontSize: 13 }}>
                {SYMBOLS[r.pair.split("/")[1]]}{r.cur.toLocaleString(undefined, { minimumFractionDigits: r.cur > 10 ? 2 : 4, maximumFractionDigits: r.cur > 10 ? 2 : 4 })}
              </span>
              <span className={`mono ${r.chg >= 0 ? "pos" : "neg"}`} style={{ fontSize: 11, width: 56, textAlign: "right" }}>
                {r.chg >= 0 ? "+" : ""}{r.chg.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      {!compact && (
        <>
          <div className="hr" style={{ margin: "14px 0" }} />
          <div className="row between" style={{ fontSize: 11, color: "var(--muted)" }}>
            <span>Updated</span>
            <span className="mono">{FX_UPDATED}</span>
          </div>
        </>
      )}
    </div>
  );
};

// ---------- A compact "native" hint that wraps in parens ----------
const NativeHint = ({ amount, from }) => {
  const display = React.useContext(window.CurrencyContext);
  if (from === display) return null;
  return (
    <span className="muted" style={{ fontSize: "0.8em" }}>
      · {formatCurrency(amount, from)}
    </span>
  );
};

// Expose to all babel scripts
// Expose to all babel scripts
Object.assign(window, {
  FX_RATES, FX_RATES_PREV, FX_UPDATED, SYMBOLS, CCY_NAMES,
  convertFx, formatCurrency,
  CurrencyContext, useMoney,
  Money, MoneyDisplay, CurrencySwitch, FxRatesWidget, NativeHint,
  AedMark, Sym,
});
