// =========================================================
// Beneficiaries — a reusable store of named counterparties.
//
// A "beneficiary" is just a name you've used before (an investment
// counterparty, a borrower, a developer…) plus whatever detail we know
// about it. Saving one lets you re-select the name on a future record and
// auto-fill the rest of the transaction instead of retyping it.
//
// Persisted to localStorage so it survives reloads regardless of whether
// the Supabase backend is configured. On read we also fold in names that
// already exist on the loaded investments/loans, so the picker is useful
// from the very first use.
// =========================================================
(function () {
  const LS_KEY = "ghanney.beneficiaries.v1";

  let store = [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (Array.isArray(raw)) store = raw;
  } catch (e) { store = []; }

  const persist = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) {}
  };

  // Normalised key for matching names case/space-insensitively.
  const slug = (s) => (s || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  const uid = () => "ben-" + Math.random().toString(36).slice(2, 9);

  const FIELDS = ["name", "type", "location", "org", "currency", "notes"];

  // Beneficiaries implied by records already in the portfolio.
  const derived = () => {
    const out = [];
    (window.investments || []).forEach((i) => {
      if (!i || !i.name) return;
      out.push({
        id: "auto-" + slug(i.name),
        name: i.name,
        type: "Investment",
        location: i.location || "",
        org: i.developer || "",
        currency: i.currency || "USD",
        derived: true,
      });
    });
    (window.loans || []).forEach((l) => {
      if (!l || !l.borrower) return;
      out.push({
        id: "auto-" + slug(l.borrower),
        name: l.borrower,
        type: l.type || "Individual",
        currency: l.currency || "USD",
        derived: true,
      });
    });
    return out;
  };

  // Full list = derived names, overlaid with anything explicitly saved
  // (saved wins, and carries usedCount). Sorted alphabetically.
  const list = () => {
    const byName = new Map();
    derived().forEach((b) => byName.set(slug(b.name), b));
    store.forEach((b) => {
      const k = slug(b.name);
      byName.set(k, { ...(byName.get(k) || {}), ...b });
    });
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  };

  const find = (name) => {
    const k = slug(name);
    if (!k) return null;
    return list().find((b) => slug(b.name) === k) || null;
  };

  // Insert or merge a beneficiary by name. Empty fields never overwrite
  // existing detail. Returns the stored record.
  const upsert = (data) => {
    const name = (data && data.name || "").toString().trim();
    if (!name) return null;
    const k = slug(name);

    const clean = {};
    FIELDS.forEach((f) => {
      if (data[f] != null && data[f] !== "") clean[f] = data[f];
    });
    clean.name = name;

    const idx = store.findIndex((b) => slug(b.name) === k);
    if (idx >= 0) {
      store[idx] = { ...store[idx], ...clean, usedCount: (store[idx].usedCount || 1) + 1 };
    } else {
      store.unshift({ id: uid(), usedCount: 1, ...clean });
    }
    persist();
    window.__bumpRev && window.__bumpRev();
    return store.find((b) => slug(b.name) === k);
  };

  const remove = (id) => {
    store = store.filter((b) => b.id !== id);
    persist();
    window.__bumpRev && window.__bumpRev();
  };

  // Count of explicitly-saved beneficiaries (not counting derived ones).
  const savedCount = () => store.length;

  window.bens = { list, find, upsert, remove, savedCount, slug };
})();
