// =========================================================
// Notifications — derive "needs attention" items from live data.
//
// Pure derivation: reads the same window.* arrays the screens use and
// returns a sorted list of notifications. Nothing is stored except which
// items the user has marked read (localStorage), so notifications stay in
// sync with reality — when a loan is repaid or a contract renewed, its
// notification simply stops being produced.
//
// Severity:
//   urgent — overdue / failed / expired (red, drives the badge)
//   warn   — due soon / expiring soon / needs signature (amber, drives badge)
//   info   — FYI: accruals, paused syncs, deadlines a couple weeks out
// =========================================================
(function () {
  const LS_READ = "ghanney.notifs.read.v1";

  let readSet = new Set();
  try {
    const a = JSON.parse(localStorage.getItem(LS_READ) || "[]");
    if (Array.isArray(a)) readSet = new Set(a);
  } catch (e) {}
  const persist = () => { try { localStorage.setItem(LS_READ, JSON.stringify([...readSet])); } catch (e) {} };

  const SEV_RANK = { urgent: 0, warn: 1, info: 2 };
  const SYM = { USD: "$", GHS: "₵", AED: "د.إ " };

  const fmtAmt = (a, c) => (SYM[c] || (c ? c + " " : "$")) + Math.round(Number(a) || 0).toLocaleString();

  // Parse a display date ("Jul 15, 2026") to a Date, or null for free text
  // ("Q1 2027", "Ongoing", "—", "TBD", "Indefinite").
  const parseDate = (s) => {
    if (!s || typeof s !== "string") return null;
    if (/^(—|tbd|ongoing|indefinite|n\/a)$/i.test(s.trim())) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  const startOfToday = () => { const n = new Date(); n.setHours(0, 0, 0, 0); return n; };
  const daysFromNow = (d) => Math.round((d.getTime() - startOfToday().getTime()) / 86400000);
  const whenSuffix = (days) => (days <= 0 ? " today" : days === 1 ? " tomorrow" : ` in ${days} days`);

  // Tunable windows (days)
  const LOAN_SOON = 7;
  const INV_SOON = 14;
  const PROJECT_SOON = 14;

  function build() {
    const out = [];
    const add = (n) => out.push(n);

    // ---- Loans receivable: overdue + due soon ----
    (window.loans || []).forEach((l) => {
      if (!l) return;
      const np = l.nextPayment || {};
      const npDate = parseDate(np.date);
      const amt = np.amount;
      const ccy = l.currency || "USD";
      const who = l.borrower || "Borrower";

      const overdueByStatus = l.status === "Overdue";
      const overdueByDate = npDate && amt && daysFromNow(npDate) < 0;
      if (overdueByStatus || overdueByDate) {
        add({
          id: `loan-overdue-${l.id}`, severity: "urgent", icon: "loans", nav: "loans",
          title: `${who}'s loan is overdue`,
          detail: amt ? `${fmtAmt(amt, ccy)} was due ${np.date}` : "Repayment overdue — follow up.",
          sort: npDate ? npDate.getTime() : 0,
        });
      } else if (l.status === "Due soon" || (npDate && amt && daysFromNow(npDate) <= LOAN_SOON)) {
        const dd = npDate ? daysFromNow(npDate) : null;
        add({
          id: `loan-due-${l.id}`, severity: "warn", icon: "loans", nav: "loans",
          title: `${who} — repayment due${dd != null ? whenSuffix(dd) : " soon"}`,
          detail: amt ? `${fmtAmt(amt, ccy)} due ${np.date}` : `Due ${np.date || "soon"}`,
          sort: npDate ? npDate.getTime() : Infinity,
        });
      }
    });

    // ---- Investments: instalment overdue / due soon ----
    (window.investments || []).forEach((i) => {
      if (!i) return;
      const np = i.nextPayment || {};
      const npDate = parseDate(np.date);
      if (!np.amount || !npDate) return;
      const dd = daysFromNow(npDate);
      const ccy = i.currency || "USD";
      if (dd < 0) {
        add({
          id: `inv-overdue-${i.id}`, severity: "urgent", icon: "invest", nav: "investments",
          title: `${i.name} — instalment overdue`,
          detail: `${fmtAmt(np.amount, ccy)} was due ${np.date}`, sort: npDate.getTime(),
        });
      } else if (dd <= INV_SOON) {
        add({
          id: `inv-due-${i.id}`, severity: "warn", icon: "invest", nav: "investments",
          title: `${i.name} — instalment due${whenSuffix(dd)}`,
          detail: `${fmtAmt(np.amount, ccy)} due ${np.date}`, sort: npDate.getTime(),
        });
      }
    });

    // ---- Contracts: status-driven ----
    (window.contracts || []).forEach((c) => {
      if (!c) return;
      const sort = parseDate(c.expiresDate)?.getTime() ?? Infinity;
      const base = { icon: "contract", nav: "contracts", sort };
      if (c.status === "Expired") {
        add({ ...base, id: `ct-expired-${c.id}`, severity: "urgent", title: `${c.name} has expired`, detail: c.expiresDate ? `Expired ${c.expiresDate}` : "Renew or archive." });
      } else if (c.status === "Expiring soon") {
        add({ ...base, id: `ct-expiring-${c.id}`, severity: "warn", title: `${c.name} expiring soon`, detail: c.expiresDate ? `Expires ${c.expiresDate}` : "Renewal needed." });
      } else if (c.status === "Pending signature") {
        add({ ...base, id: `ct-sign-${c.id}`, severity: "warn", title: `${c.name} awaiting signature`, detail: "Pending signatures from parties." });
      } else if (c.status === "Awaiting review") {
        add({ ...base, id: `ct-review-${c.id}`, severity: "info", title: `${c.name} awaiting review`, detail: "Counsel review pending." });
      }
    });

    // ---- Projects: deadlines (only when parseable) ----
    (window.projects || []).forEach((p) => {
      if (!p) return;
      const d = parseDate(p.deadline);
      if (!d) return;
      const dd = daysFromNow(d);
      if (dd < 0 && p.status !== "Done" && p.progress < 1) {
        add({ id: `pr-late-${p.id}`, severity: "warn", icon: "projects", nav: "projects", title: `${p.name} — deadline passed`, detail: `Was due ${p.deadline}`, sort: d.getTime() });
      } else if (dd >= 0 && dd <= PROJECT_SOON) {
        add({ id: `pr-due-${p.id}`, severity: "info", icon: "projects", nav: "projects", title: `${p.name} — due${whenSuffix(dd)}`, detail: `Deadline ${p.deadline}`, sort: d.getTime() });
      }
    });

    // ---- Integrations: sync health ----
    (window.integrations || []).forEach((g) => {
      if (!g) return;
      const label = g.label || g.provider || "Integration";
      if (g.status === "error") {
        add({ id: `int-error-${g.id}`, severity: "urgent", icon: "plug", nav: "integrations", title: `${label} sync failed`, detail: "Reconnect to resume syncing balances.", sort: 0 });
      } else if (g.status === "paused") {
        add({ id: `int-paused-${g.id}`, severity: "info", icon: "plug", nav: "integrations", title: `${label} sync paused`, detail: "Resume to keep positions current.", sort: Infinity });
      }
    });

    // ---- Income: deferred salary accruing (FYI) ----
    (window.incomeStreams || []).forEach((s) => {
      if (!s) return;
      if (s.status === "Deferred" && Number(s.accrued) > 0) {
        add({
          id: `inc-deferred-${s.id}`, severity: "info", icon: "income", nav: "income",
          title: `${s.label || "Salary"} — deferred & accruing`,
          detail: `${fmtAmt(s.accrued, s.currency || "USD")} accrued${s.deferredMonths ? ` over ${s.deferredMonths} mo` : ""}, not yet drawn.`,
          sort: Infinity,
        });
      }
    });

    out.sort((a, b) => (SEV_RANK[a.severity] - SEV_RANK[b.severity]) || ((a.sort || 0) - (b.sort || 0)));
    return out.map((n) => ({ ...n, read: readSet.has(n.id) }));
  }

  // Count of unread items that genuinely need attention (urgent + warn).
  const attentionCount = () => build().filter((n) => n.severity !== "info" && !n.read).length;

  const markRead = (id) => { readSet.add(id); persist(); window.__bumpRev && window.__bumpRev(); };
  const markAllRead = () => { build().forEach((n) => readSet.add(n.id)); persist(); window.__bumpRev && window.__bumpRev(); };

  window.notify = { build, attentionCount, markRead, markAllRead };
})();
