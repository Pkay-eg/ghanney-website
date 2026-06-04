// =========================================================
// Generated data for ghanney. — modeled on the user's actual situation
// All figures USD unless tagged
// =========================================================

const fmt = (n, opts = {}) => {
  const { decimals = 0, compact = false } = opts;
  if (compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace(/\.?0+$/, "") + "K";
  }
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const usd = (n, opts = {}) => "$" + fmt(n, opts);
const ghs = (n, opts = {}) => "₵" + fmt(n, opts);
const aed = (n, opts = {}) => "د.إ " + fmt(n, opts);

// =========================================================
// No seed/demo records. Everything below starts empty and is
// populated from your Supabase account on sign-in (see db.js → hydrate).
// Config/enums and helpers live in this file and in data-extras.jsx.
// =========================================================

// ---------- Income ----------
const incomeStreams = [];
const incomeMonthly = [];

// ---------- Investments ----------
const investments = [];

// ---------- Net worth time series ----------
const netWorthMonthly = [];
const netWorthBreakdown = [];

// ---------- Loans receivable ----------
const loans = [];

// ---------- Trading ----------
const tradingPositions = [];

// Market tape reference — live quotes are pushed by tickers.js. These are
// market data (not your transactions); left empty so nothing is faked until
// live rates load.
const tradingTickers = [];

const tradingPnL = [];

// ---------- Projects ----------
const projects = [];

// ---------- Upcoming events (rebuilt from loans/investments on hydrate) ----------
const upcoming = [];

// ---------- Activity feed ----------
const activity = [];

// expose to window so all babel scripts share
// (we DO NOT overwrite tradingTickers if tickers.js has already populated
//  it with live data — see early-return below)
const __seedTradingTickers = (window.tradingTickers && window.tradingTickers.length > 0)
  ? window.tradingTickers
  : tradingTickers;
Object.assign(window, {
  fmt, usd, ghs, aed,
  incomeStreams, incomeMonthly,
  investments,
  netWorthMonthly, netWorthBreakdown,
  loans,
  tradingPositions, tradingPnL,
  projects,
  upcoming,
  activity,
});
// Set tradingTickers separately, preferring any data tickers.js may have
// already pushed during the babel transpile gap.
window.tradingTickers = __seedTradingTickers;
