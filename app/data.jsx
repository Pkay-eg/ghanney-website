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

// ---------- Income ----------
const incomeStreams = [
  {
    id: "sal-wewire-gh",
    label: "Salary — WeWire Ghana",
    type: "Salary",
    cadence: "Monthly",
    gross: 123250,         // ₵ 123,250 / mo ≈ $8,500
    currency: "GHS",
    status: "Deferred",
    deferredSince: "Jul 2025",
    deferredMonths: 11,
    accrued: 1355750,      // ₵
    note: "Deferring to fund SPV equity contribution & off-plan instalments.",
  },
  {
    id: "sal-wewire-dxb",
    label: "Salary — WeWire Dubai",
    type: "Salary",
    cadence: "Monthly",
    gross: 44040,          // د.إ 44,040 / mo ≈ $12,000
    currency: "AED",
    status: "Deferred",
    deferredSince: "Aug 2025",
    deferredMonths: 10,
    accrued: 440400,       // د.إ
    note: "Deferred. Reviewing payout schedule with finance Q3 2026.",
  },
  {
    id: "com-brokered",
    label: "Brokered Trade Commissions",
    type: "Commission",
    cadence: "Per deal",
    gross: 28400,
    currency: "USD",
    status: "Active",
    ytd: 184220,
    note: "WeWire FX flow — settled monthly.",
  },
  {
    id: "com-referral",
    label: "Referral Fees",
    type: "Referral",
    cadence: "Per deal",
    gross: 4100,
    currency: "USD",
    status: "Active",
    ytd: 41600,
    note: "Inbound corp-treasury intros to WeWire desk.",
  },
];

const incomeMonthly = [
  { m: "Jun 25", commission: 11200, referral: 1800, salary: 0 },
  { m: "Jul 25", commission: 14500, referral: 2200, salary: 0 },
  { m: "Aug 25", commission: 9800,  referral: 3100, salary: 0 },
  { m: "Sep 25", commission: 18200, referral: 4400, salary: 0 },
  { m: "Oct 25", commission: 22100, referral: 5200, salary: 0 },
  { m: "Nov 25", commission: 16700, referral: 3900, salary: 0 },
  { m: "Dec 25", commission: 24500, referral: 6100, salary: 0 },
  { m: "Jan 26", commission: 19800, referral: 4800, salary: 0 },
  { m: "Feb 26", commission: 21300, referral: 5500, salary: 0 },
  { m: "Mar 26", commission: 26900, referral: 7200, salary: 0 },
  { m: "Apr 26", commission: 31400, referral: 8800, salary: 0 },
  { m: "May 26", commission: 28400, referral: 4100, salary: 0 },
];

// ---------- Investments ----------
const investments = [
  {
    id: "apt-cantonments",
    name: "Cantonments Heights — Unit 8B",
    kind: "Real Estate",
    sub: "Off-plan apartment",
    location: "Accra, Ghana",
    developer: "Ridge Residences Ltd.",
    currency: "USD",
    priceTotal: 320000,
    paid: 184000,
    nextPayment: { amount: 32000, date: "Jul 15, 2026" },
    progress: 0.575,
    handover: "Q1 2027",
    valueNow: 348000,
    yieldExp: "5.8% rental",
    notes: "Title docs received. Construction 64% complete per dev update Apr 26.",
  },
  {
    id: "apt-east-legon",
    name: "East Legon Hills — Unit 14C",
    kind: "Real Estate",
    sub: "Off-plan apartment",
    location: "Accra, Ghana",
    developer: "Devtraco Plus",
    currency: "USD",
    priceTotal: 245000,
    paid: 98000,
    nextPayment: { amount: 24500, date: "Jun 30, 2026" },
    progress: 0.40,
    handover: "Q3 2027",
    valueNow: 252000,
    yieldExp: "6.1% rental",
    notes: "Slab cast on 6th floor. On schedule.",
  },
  {
    id: "apt-airport-res",
    name: "Airport Residential — Unit 22A",
    kind: "Real Estate",
    sub: "Off-plan apartment",
    location: "Accra, Ghana",
    developer: "Goldkey Properties",
    currency: "USD",
    priceTotal: 410000,
    paid: 287000,
    nextPayment: { amount: 41000, date: "Aug 02, 2026" },
    progress: 0.70,
    handover: "Q4 2026",
    valueNow: 445000,
    yieldExp: "6.4% rental",
    notes: "Snagging visit booked Sep 2026.",
  },
  {
    id: "apt-dxb-jvc",
    name: "Bloom Tower JVC — Unit 1109",
    kind: "Real Estate",
    sub: "Off-plan apartment",
    location: "Dubai, UAE",
    developer: "Bloom Holding",
    currency: "AED",
    priceTotal: 1450000, // AED
    paid: 580000,
    nextPayment: { amount: 145000, date: "Jul 01, 2026" },
    progress: 0.40,
    handover: "Q2 2027",
    valueNow: 1620000,
    yieldExp: "7.2% rental",
    notes: "20% milestone paid. Next instalment on slab completion.",
    fxToUsd: 0.272,
  },
  {
    id: "apt-sister-block",
    name: "6-Unit Block — Tema Comm. 25",
    kind: "Real Estate Development",
    sub: "Co-developed with sister",
    location: "Tema, Ghana",
    developer: "Self / Family JV",
    currency: "USD",
    priceTotal: 480000,   // total project cost
    paid: 168000,         // his 35% share funded
    equity: 0.50,         // 50/50 with sister
    nextPayment: { amount: 28000, date: "Jun 22, 2026" },
    progress: 0.35,
    handover: "Q2 2027",
    valueNow: 540000,
    yieldExp: "9.5% blended (6 units)",
    notes: "Foundation poured Feb 26. Block work begins next month. Sister managing site daily.",
  },
  {
    id: "biz-icecream",
    name: "Scoop & Co. — Ice Cream Parlour",
    kind: "Business",
    sub: "Equity investment",
    location: "East Legon, Accra",
    currency: "USD",
    priceTotal: 45000,   // total invested
    paid: 45000,
    equity: 0.40,
    progress: 1.0,
    valueNow: 62000,
    yieldExp: "Distributions: $1.2K/mo trailing",
    monthlyDistribution: 1200,
    notes: "Open 9 months. 2nd location under evaluation for Spintex.",
  },
  {
    id: "spv-road",
    name: "Eastern Corridor Road — SPV",
    kind: "Government Contract (SPV)",
    sub: "Construction co-investment",
    location: "Eastern Region, Ghana",
    currency: "USD",
    priceTotal: 220000,
    paid: 220000,
    equity: 0.15,
    progress: 0.62,
    handover: "Phase 1 — Q4 2026",
    valueNow: 285000,
    yieldExp: "Profit share on milestone payments",
    notes: "Milestone 3 invoice (GHS 18.4M) submitted to Ministry. Expected payment Jul 26.",
  },
];

// ---------- Net worth time series ----------
const netWorthMonthly = [
  { m: "Jun 25", value: 1180000 },
  { m: "Jul 25", value: 1212000 },
  { m: "Aug 25", value: 1248000 },
  { m: "Sep 25", value: 1295000 },
  { m: "Oct 25", value: 1340000 },
  { m: "Nov 25", value: 1382000 },
  { m: "Dec 25", value: 1428000 },
  { m: "Jan 26", value: 1455000 },
  { m: "Feb 26", value: 1502000 },
  { m: "Mar 26", value: 1568000 },
  { m: "Apr 26", value: 1612000 },
  { m: "May 26", value: 1684500 },
];

const netWorthBreakdown = [
  { label: "Real Estate (off-plan equity)", value: 757000, color: "#3B5D3A" },
  { label: "Sister JV (6-unit block)", value: 168000, color: "#5C7E5B" },
  { label: "Businesses (Scoop & Co.)", value: 62000, color: "#C99845" },
  { label: "Government SPV", value: 285000, color: "#7A6A4F" },
  { label: "Trading portfolio", value: 248500, color: "#B0492A" },
  { label: "Cash & equivalents", value: 51500, color: "#8C8579" },
  { label: "Loans receivable", value: 112500, color: "#2E4A3A" },
];

// ---------- Loans receivable ----------
const loans = [
  {
    id: "ln-akua",
    borrower: "Akua Mensah",
    type: "Individual",
    principal: 18000,
    currency: "USD",
    issued: "Nov 12, 2025",
    due: "Aug 12, 2026",
    interest: 0.08,
    status: "On track",
    paidBack: 6000,
    nextPayment: { amount: 2000, date: "Jun 12, 2026" },
    notes: "Bridging finance for shop fit-out. Paying $2K/mo consistently.",
    history: [
      { d: "Dec 12, 2025", a: 2000 },
      { d: "Jan 12, 2026", a: 2000 },
      { d: "Mar 18, 2026", a: 2000 },
    ],
  },
  {
    id: "ln-kontact",
    borrower: "Kontact Logistics Ltd.",
    type: "Business",
    principal: 45000,
    currency: "USD",
    issued: "Feb 04, 2026",
    due: "Feb 04, 2027",
    interest: 0.12,
    status: "On track",
    paidBack: 7500,
    nextPayment: { amount: 3750, date: "Jun 04, 2026" },
    notes: "Working capital. Personal guarantee from CEO + invoice assignment.",
    history: [
      { d: "Mar 04, 2026", a: 3750 },
      { d: "Apr 04, 2026", a: 3750 },
    ],
  },
  {
    id: "ln-yaw",
    borrower: "Yaw Boateng",
    type: "Individual",
    principal: 94250,            // ₵
    currency: "GHS",
    issued: "Jan 22, 2026",
    due: "May 22, 2026",
    interest: 0.05,
    status: "Overdue",
    paidBack: 21750,
    nextPayment: { amount: 72500, date: "May 22, 2026" },
    notes: "2 days late. Sent reminder. Says incoming next week.",
    history: [{ d: "Mar 01, 2026", a: 21750 }],
  },
  {
    id: "ln-rosewood",
    borrower: "Rosewood Properties",
    type: "Business",
    principal: 35000,
    currency: "USD",
    issued: "Oct 03, 2025",
    due: "Oct 03, 2026",
    interest: 0.15,
    status: "On track",
    paidBack: 13125,
    nextPayment: { amount: 4375, date: "Jul 03, 2026" },
    notes: "Quarterly interest + principal. Secured against vehicle fleet.",
    history: [
      { d: "Jan 03, 2026", a: 4375 },
      { d: "Apr 03, 2026", a: 8750 },
    ],
  },
  {
    id: "ln-amerley",
    borrower: "Amerley Tetteh",
    type: "Individual",
    principal: 50750,    // ₵
    currency: "GHS",
    issued: "Apr 18, 2026",
    due: "Oct 18, 2026",
    interest: 0,
    status: "Family",
    paidBack: 0,
    nextPayment: { amount: 0, date: "—" },
    notes: "Cousin. School fees. No interest, flexible repayment.",
    history: [],
  },
  {
    id: "ln-naa",
    borrower: "Naa Ayorkor",
    type: "Individual",
    principal: 8000,
    currency: "USD",
    issued: "Dec 01, 2025",
    due: "Jun 01, 2026",
    interest: 0.10,
    status: "Due soon",
    paidBack: 2000,
    nextPayment: { amount: 6000, date: "Jun 01, 2026" },
    notes: "Balloon payment due in 8 days.",
    history: [{ d: "Mar 01, 2026", a: 2000 }],
  },
];

// ---------- Trading ----------
const tradingPositions = [
  { sym: "NVDA",  name: "NVIDIA Corp.",     qty: 84,  avg: 412.80,  last: 487.20,  cls: "Stock" },
  { sym: "MSFT",  name: "Microsoft",        qty: 60,  avg: 388.40,  last: 422.15,  cls: "Stock" },
  { sym: "GOOGL", name: "Alphabet A",       qty: 110, avg: 142.20,  last: 168.90,  cls: "Stock" },
  { sym: "ASML",  name: "ASML Holding",     qty: 20,  avg: 712.10,  last: 868.40,  cls: "Stock" },
  { sym: "BTC",   name: "Bitcoin",          qty: 0.84, avg: 58400,  last: 67820,   cls: "Crypto" },
  { sym: "ETH",   name: "Ethereum",         qty: 4.20, avg: 3210,   last: 3580,    cls: "Crypto" },
  { sym: "SOL",   name: "Solana",           qty: 38,   avg: 132.40, last: 158.20,  cls: "Crypto" },
  { sym: "VOO",   name: "Vanguard S&P 500", qty: 42,   avg: 462.10, last: 498.30,  cls: "ETF" },
];

const tradingTickers = [
  { sym: "S&P 500", price: 5462.20,   delta: +0.42 },
  { sym: "NDX",     price: 19840.55,  delta: +0.68 },
  { sym: "BTC",     price: 67820.10,  delta: -1.12 },
  { sym: "ETH",     price: 3580.40,   delta: -0.84 },
  { sym: "GHS/USD", price: 0.0648,    delta: -0.22 },
  { sym: "AED/USD", price: 0.2722,    delta: +0.01 },
];

const tradingPnL = [
  { m: "Dec 25", v: 184200 },
  { m: "Jan 26", v: 192800 },
  { m: "Feb 26", v: 188400 },
  { m: "Mar 26", v: 208600 },
  { m: "Apr 26", v: 224500 },
  { m: "May 26", v: 248500 },
];

// ---------- Projects ----------
const projects = [
  {
    id: "pr-spv-road",
    name: "Eastern Corridor SPV — Milestone 3",
    status: "In progress",
    owner: "Ghanney + 4 partners",
    progress: 0.62,
    deadline: "Jul 30, 2026",
    note: "Invoice submitted. Awaiting Ministry release.",
  },
  {
    id: "pr-sister-block",
    name: "6-Unit Apartment Block — Tema",
    status: "In progress",
    owner: "Ghanney + Sister",
    progress: 0.35,
    deadline: "Q2 2027",
    note: "Block work next month.",
  },
  {
    id: "pr-scoop2",
    name: "Scoop & Co. — Spintex location",
    status: "Evaluating",
    owner: "Ghanney",
    progress: 0.15,
    deadline: "Decision: Aug 2026",
    note: "Site visit booked. Lease term draft received.",
  },
  {
    id: "pr-wewire-desk",
    name: "WeWire — Treasury Desk Expansion",
    status: "Active",
    owner: "Ghanney",
    progress: 0.55,
    deadline: "Ongoing",
    note: "3 enterprise pipelines in due diligence.",
  },
];

// ---------- Upcoming events ----------
// amount + currency = native currency of the event
const upcoming = [
  { d: "Jun 01", k: "Loan due",     who: "Naa Ayorkor",  amt: 6000,   ccy: "USD", cls: "warn" },
  { d: "Jun 04", k: "Loan payment", who: "Kontact Log.", amt: 3750,   ccy: "USD", cls: "pos" },
  { d: "Jun 22", k: "Construction", who: "Sister JV",    amt: 28000,  ccy: "USD", cls: "neg" },
  { d: "Jun 30", k: "Off-plan",     who: "East Legon",   amt: 24500,  ccy: "USD", cls: "neg" },
  { d: "Jul 01", k: "Off-plan",     who: "Bloom Tower",  amt: 145000, ccy: "AED", cls: "neg" },
  { d: "Jul 03", k: "Loan payment", who: "Rosewood",     amt: 4375,   ccy: "USD", cls: "pos" },
  { d: "Jul 15", k: "Off-plan",     who: "Cantonments",  amt: 32000,  ccy: "USD", cls: "neg" },
  { d: "Aug 02", k: "Off-plan",     who: "Airport Res.", amt: 41000,  ccy: "USD", cls: "neg" },
];

// ---------- Activity feed ----------
const activity = [
  { t: "12 min ago",  msg: "Akua Mensah — $2,000 loan payment received",         tag: "loan" },
  { t: "1 hr ago",    msg: "NVDA +2.4% — position up $6,250 today",              tag: "trade" },
  { t: "3 hrs ago",   msg: "Bloom Tower — 20% milestone confirmed by developer", tag: "real-estate" },
  { t: "Yesterday",   msg: "WeWire — May commission accrual: $28,400",           tag: "income" },
  { t: "Yesterday",   msg: "SPV — Milestone 3 invoice submitted (GHS 18.4M)",    tag: "spv" },
  { t: "2 days ago",  msg: "Scoop & Co. — April distribution: $1,200",           tag: "business" },
];

// expose to window so all babel scripts share
Object.assign(window, {
  fmt, usd, ghs, aed,
  incomeStreams, incomeMonthly,
  investments,
  netWorthMonthly, netWorthBreakdown,
  loans,
  tradingPositions, tradingTickers, tradingPnL,
  projects,
  upcoming,
  activity,
});
