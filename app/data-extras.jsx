// =========================================================
// Extended data — contracts, site updates, team, permissions
// =========================================================

// ---------- Contracts ----------
const CONTRACT_TYPES = [
  { value: "Purchase Agreement",      icon: "building" },
  { value: "JV / Partnership",        icon: "user" },
  { value: "Shareholders Agreement",  icon: "building" },
  { value: "Loan Agreement",          icon: "loans" },
  { value: "Employment",              icon: "user" },
  { value: "Lease",                   icon: "home" },
  { value: "Construction",            icon: "building" },
  { value: "SPV Agreement",           icon: "contract" },
  { value: "LOI",                     icon: "contract" },
  { value: "Insurance",               icon: "lock" },
  { value: "NDA",                     icon: "lock" },
  { value: "Service",                 icon: "settings" },
];

const STATUS_CHIP = {
  "Active":            "pos",
  "Pending signature": "warn",
  "Awaiting review":   "warn",
  "Expiring soon":     "warn",
  "Expired":           "neg",
  "Terminated":        "neg",
  "Draft":             "",
};

// Days until expiry helper
const daysUntil = (dateStr) => {
  if (!dateStr || !/^[A-Z]/.test(dateStr.split(" ")[0])) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date("May 24, 2026");
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
};

// No seed contracts — populated from Supabase on hydrate.
const contracts = [];

// ---------- Site updates (keyed by investment id) ----------
// No seed updates — populated from Supabase on hydrate.
const siteUpdates = {};

// ---------- Team ----------
const ROLE_PRESETS = {
  "Owner":               { color: "var(--ink)",       desc: "Full access. Can do anything in the portal." },
  "Personal Assistant":  { color: "var(--positive)",  desc: "Day-to-day management. Records loans, payments, income, calendar." },
  "Lawyer":              { color: "var(--warn)",      desc: "Contracts and legal. View loans / projects, upload contracts." },
  "Accountant":          { color: "var(--accent)",    desc: "Read-only on financials. Can export statements and books." },
  "Read-only":           { color: "var(--muted)",     desc: "Dashboard view only. No edits anywhere." },
  "Custom":              { color: "var(--negative)",  desc: "Granular permissions per module." },
};

const MODULES = [
  { key: "overview",    label: "Overview" },
  { key: "income",      label: "Income" },
  { key: "investments", label: "Investments" },
  { key: "trading",     label: "Trading" },
  { key: "loans",       label: "Loans" },
  { key: "projects",    label: "Projects" },
  { key: "contracts",   label: "Contracts" },
  { key: "networth",    label: "Net Worth" },
];

// permission level per module: "none" | "view" | "edit" | "full"
const ROLE_PERMS = {
  "Owner": {
    overview: "full", income: "full", investments: "full", trading: "full",
    loans: "full", projects: "full", contracts: "full", networth: "full",
  },
  "Personal Assistant": {
    overview: "view", income: "edit", investments: "view", trading: "none",
    loans: "edit", projects: "edit", contracts: "view", networth: "view",
  },
  "Lawyer": {
    overview: "view", income: "none", investments: "view", trading: "none",
    loans: "view", projects: "view", contracts: "full", networth: "none",
  },
  "Accountant": {
    overview: "view", income: "view", investments: "view", trading: "view",
    loans: "view", projects: "view", contracts: "view", networth: "view",
  },
  "Read-only": {
    overview: "view", income: "none", investments: "none", trading: "none",
    loans: "none", projects: "none", contracts: "none", networth: "none",
  },
};

// No seed team members — your real team loads from Supabase profiles on hydrate.
const team = [];

// No seed team activity — populated from the activity log on hydrate.
const teamActivity = [];

// Integrations start empty — they are populated from Supabase on hydrate.
const integrations = [];

Object.assign(window, {
  contracts, siteUpdates, team, teamActivity,
  integrations,
  ROLE_PRESETS, ROLE_PERMS, MODULES,
  CONTRACT_TYPES, STATUS_CHIP, daysUntil,
});
