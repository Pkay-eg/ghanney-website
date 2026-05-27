// =============================================================
// Live market tape data source.
//
// Pulls free, key-less, CORS-enabled feeds:
//   - CoinGecko  → BTC, ETH, SOL (24h % change)
//   - Frankfurter→ GHS, AED rates (vs prior weekday close)
//   - Yahoo!Finance v8 chart → S&P 500, NDX, NVDA (best-effort,
//     skipped silently if browser CORS blocks it)
//
// Writes results into `window.tradingTickers` IN PLACE so any
// React component referencing that array picks up the update on
// the next render (which we trigger via window.__bumpRev?.()).
//
// Polls every 60 seconds and exposes:
//   window.tickers.subscribe(fn) — fires whenever the cache mutates
//   window.tickers.snapshot()    — current cache + last fetch time
// =============================================================
(function () {
  "use strict";

  const POLL_MS = 60_000;

  // Order matters — this is the visible order on the tape.
  const TARGETS = [
    { sym: "S&P 500", source: "yahoo",       ref: "^GSPC",   priceDp: 2 },
    { sym: "NDX",     source: "yahoo",       ref: "^NDX",    priceDp: 2 },
    { sym: "NVDA",    source: "yahoo",       ref: "NVDA",    priceDp: 2 },
    { sym: "BTC",     source: "coingecko",   ref: "bitcoin", priceDp: 2 },
    { sym: "ETH",     source: "coingecko",   ref: "ethereum",priceDp: 2 },
    { sym: "SOL",     source: "coingecko",   ref: "solana",  priceDp: 2 },
    { sym: "USD/GHS", source: "frankfurter", ref: "GHS",     priceDp: 2 },
    { sym: "USD/AED", source: "frankfurter", ref: "AED",     priceDp: 2 },
  ];

  const state = {
    cache: new Map(),       // sym -> { price, delta }
    lastUpdated: null,
    listeners: new Set(),
  };

  const notify = () => {
    state.listeners.forEach((fn) => { try { fn(); } catch (e) {} });
    if (typeof window.__bumpRev === "function") window.__bumpRev();
  };

  // ---------- providers ----------
  async function loadCoinGecko() {
    const ids = TARGETS.filter((t) => t.source === "coingecko").map((t) => t.ref);
    if (ids.length === 0) return;
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=" + ids.join(",") +
                "&vs_currencies=usd&include_24hr_change=true";
    const res = await fetch(url);
    if (!res.ok) throw new Error("CoinGecko " + res.status);
    const data = await res.json();
    TARGETS.filter((t) => t.source === "coingecko").forEach((t) => {
      const row = data[t.ref];
      if (!row) return;
      state.cache.set(t.sym, {
        price: row.usd,
        delta: row.usd_24h_change ?? 0,
        priceDp: t.priceDp,
      });
    });
  }

  async function loadFrankfurter() {
    const codes = TARGETS.filter((t) => t.source === "frankfurter").map((t) => t.ref);
    if (codes.length === 0) return;
    // Latest snapshot
    const latestRes = await fetch("https://api.frankfurter.app/latest?from=USD&to=" + codes.join(","));
    if (!latestRes.ok) throw new Error("Frankfurter " + latestRes.status);
    const latest = await latestRes.json();
    // Prior trading day (Frankfurter follows ECB calendar; we go back 7d to be safe)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const priorRes = await fetch("https://api.frankfurter.app/" + sevenDaysAgo + "?from=USD&to=" + codes.join(","));
    const prior = priorRes.ok ? await priorRes.json() : { rates: {} };

    TARGETS.filter((t) => t.source === "frankfurter").forEach((t) => {
      const r = latest.rates?.[t.ref];
      const p = prior.rates?.[t.ref];
      if (r == null) return;
      // Frankfurter "USD->GHS" returns the # of GHS one USD buys, which is
      // exactly the conventional USD/GHS quote we want to display.
      const price = r;
      const delta = p ? ((r - p) / p) * 100 : 0;
      state.cache.set(t.sym, {
        price,
        delta,
        priceDp: t.priceDp,
      });
      // Also push the live rate into the conversion engine so all
      // money formatting across the app stays in sync.
      if (window.FX_RATES && t.ref in window.FX_RATES) {
        window.FX_RATES[t.ref] = r;
      }
      if (window.FX_RATES_PREV && t.ref in window.FX_RATES_PREV && p != null) {
        window.FX_RATES_PREV[t.ref] = p;
      }
    });
  }

  async function loadYahoo() {
    // Best-effort. The v8 chart endpoint usually serves CORS, but some
    // browsers / corporate proxies block it. We swallow failures silently
    // so the tape still renders the crypto + FX rows.
    const refs = TARGETS.filter((t) => t.source === "yahoo");
    if (refs.length === 0) return;
    await Promise.all(refs.map(async (t) => {
      try {
        const url = "https://query1.finance.yahoo.com/v8/finance/chart/" +
                    encodeURIComponent(t.ref) + "?interval=1d&range=5d";
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const result = data?.chart?.result?.[0];
        if (!result) return;
        const closes = (result.indicators?.quote?.[0]?.close || []).filter((v) => v != null);
        if (closes.length < 2) return;
        const last = closes[closes.length - 1];
        const prev = closes[closes.length - 2];
        state.cache.set(t.sym, {
          price: last,
          delta: ((last - prev) / prev) * 100,
          priceDp: t.priceDp,
        });
      } catch (e) {
        // ignored
      }
    }));
  }

  // ---------- writer ----------
  function flushToWindow() {
    const arr = TARGETS
      .map((t) => {
        const v = state.cache.get(t.sym);
        if (!v) return null;
        return {
          sym: t.sym,
          price: v.price,
          delta: v.delta,
          priceDp: v.priceDp,
        };
      })
      .filter(Boolean);

    if (Array.isArray(window.tradingTickers)) {
      window.tradingTickers.length = 0;
      arr.forEach((row) => window.tradingTickers.push(row));
    } else {
      window.tradingTickers = arr;
    }
    state.lastUpdated = new Date();
    notify();
  }

  // ---------- main loop ----------
  let timer = null;
  let inflight = false;

  async function refresh() {
    if (inflight) return;
    inflight = true;
    try {
      // Independent — failures in one don't abort the others.
      await Promise.allSettled([loadCoinGecko(), loadFrankfurter(), loadYahoo()]);
      flushToWindow();
    } catch (e) {
      console.warn("[tickers] refresh failed:", e);
    } finally {
      inflight = false;
    }
  }

  function start() {
    if (timer) return;
    refresh();
    timer = setInterval(refresh, POLL_MS);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  window.tickers = {
    start,
    stop,
    refresh,
    subscribe: (fn) => { state.listeners.add(fn); return () => state.listeners.delete(fn); },
    snapshot: () => ({ lastUpdated: state.lastUpdated, rows: [...(window.tradingTickers || [])] }),
  };

  // Auto-start as soon as the document is interactive. data.jsx is written
  // to defer to anything already populated here, so a fast fetch can't be
  // clobbered by the seed.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
