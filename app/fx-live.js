// =============================================================
// Live FX engine — keeps window.FX_RATES continuously up to date.
//
// Source priority:
//   1. GOOGLE FINANCE — a published Google Sheet running =GOOGLEFINANCE()
//      ("CURRENCY:USDGHS" etc.), read via the public gviz CSV endpoint
//      (CORS-enabled, no API key). The sheet id comes from a connected
//      "googlefinance" integration, or window.__FX_SHEET_ID (config.js).
//   2. FALLBACK — open.er-api.com, a keyless CORS-enabled FX API that, unlike
//      Frankfurter/ECB, actually quotes GHS and AED. Keeps rates live even
//      before any Google Sheet is wired up.
//
// It writes USD→{code} rates into window.FX_RATES in place (and shifts the
// session baseline into FX_RATES_PREV for the trend arrows), then pings
// window.__bumpRev so every money figure across the app re-renders. Polls
// every 60s and on tab refocus; pauses while the tab is hidden.
//
// Exposes:
//   window.fxLive.refresh()        — force a fetch now
//   window.fxLive.status()         — { source, lastUpdated, ok, stale }
//   window.fxLive.setSheet(idOrUrl)— point it at a Google Sheet at runtime
//   window.__fxLive                — last published status (for the UI)
// =============================================================
(function () {
  "use strict";

  const POLL_MS = 60_000;

  // Currencies to keep live (USD is the pivot and always 1).
  const codes = () => Object.keys(window.FX_RATES || { GHS: 0, AED: 0 }).filter((c) => c !== "USD");

  const status = { source: null, lastUpdated: null, ok: false, stale: true, error: null };
  const baseline = {}; // first live rate seen this session — anchors the % change
  const publish = () => { window.__fxLive = Object.assign({}, status); };
  publish();

  function applyRates(rates, source) {
    if (!window.FX_RATES) return false;
    let changed = false;
    Object.keys(rates).forEach((code) => {
      const v = Number(rates[code]);
      if (!v || isNaN(v) || v <= 0) return;
      if (baseline[code] == null) baseline[code] = v;          // anchor on first live value
      if (window.FX_RATES_PREV) window.FX_RATES_PREV[code] = baseline[code];
      if (window.FX_RATES[code] !== v) changed = true;
      window.FX_RATES[code] = v;
    });
    status.source = source;
    status.lastUpdated = new Date().toISOString();
    status.ok = true;
    status.stale = false;
    status.error = null;
    publish();
    if (typeof window.__bumpRev === "function") window.__bumpRev();
    if (window.tickers && typeof window.tickers._notify === "function") window.tickers._notify();
    return changed;
  }

  // ---- Google Sheet (gviz) reader ----
  const extractSheetId = (input) => {
    if (!input) return "";
    const m = String(input).match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return (m ? m[1] : String(input)).trim();
  };

  function googleSheetId() {
    const integ = (window.integrations || []).find(
      (i) => i && i.provider === "googlefinance" && i.status !== "paused" && i.status !== "error"
    );
    if (integ && integ.endpoint) return extractSheetId(integ.endpoint);
    if (window.__FX_SHEET_ID) return extractSheetId(window.__FX_SHEET_ID);
    return "";
  }

  async function readGoogle() {
    const id = googleSheetId();
    if (!id) return null;
    const tab = window.__FX_SHEET_TAB || "tickers";
    const url = "https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Google Sheet " + res.status);
    const rows = parseCsv(await res.text());
    const out = {};
    rows.forEach((r) => {
      const joined = r.join(" ");
      // Accept either a "USD/GHS" display label or a raw "CURRENCY:USDGHS" symbol.
      const m = joined.match(/USD\s*\/\s*([A-Z]{3})/i) || joined.match(/CURRENCY:\s*USD([A-Z]{3})/i);
      if (!m) return;
      const code = m[1].toUpperCase();
      const price = r
        .map((c) => Number(String(c).replace(/[,$%\s]/g, "")))
        .find((n) => n && !isNaN(n) && n > 0);
      if (price) out[code] = price;
    });
    return Object.keys(out).length ? out : null;
  }

  // ---- public FX fallback (covers GHS + AED, unlike ECB/Frankfurter) ----
  async function readPublic() {
    const want = codes();
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("er-api " + res.status);
    const data = await res.json();
    const out = {};
    want.forEach((c) => { if (data.rates && data.rates[c] != null) out[c] = data.rates[c]; });
    return Object.keys(out).length ? out : null;
  }

  // ---- main loop ----
  let inflight = false, timer = null, bootRetries = 0;

  async function refresh() {
    if (inflight) return;
    if (!window.FX_RATES) {            // fx.jsx (babel) hasn't run yet — retry shortly
      if (bootRetries++ < 12) setTimeout(refresh, 600);
      return;
    }
    inflight = true;
    try {
      let rates = null, source = null;
      try { rates = await readGoogle(); if (rates) source = "Google Finance"; }
      catch (e) { /* fall through to public source */ }
      if (!rates) {
        try { rates = await readPublic(); if (rates) source = "Live FX"; }
        catch (e) { status.error = e && e.message ? e.message : String(e); }
      }
      if (rates) applyRates(rates, source);
      else { status.ok = false; status.stale = true; publish(); }
    } finally {
      inflight = false;
    }
  }

  function start() {
    if (timer) return;
    refresh();
    timer = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });

  window.fxLive = {
    start, stop, refresh,
    status: () => Object.assign({}, status),
    setSheet: (idOrUrl) => { window.__FX_SHEET_ID = idOrUrl; refresh(); },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  // Minimal CSV parser (quoted fields with embedded commas/quotes).
  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (inQuotes) {
        if (c === '"' && n === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n" || c === "\r") {
          if (field || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
          if (c === "\r" && n === "\n") i++;
        } else field += c;
      }
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }
})();
