// =========================================================
// db.js — Supabase data layer for ghanney. personal portal
//
// Bridges the prototype's window.investments / window.loans / etc.
// arrays with the Supabase backend. Screens & forms keep reading
// from window globals; this layer keeps them in sync with the DB.
// =========================================================

(function () {
  const sb = () => window.__supabase;
  const isConfigured = () => !!sb();

  // -------- mappers (db row <-> prototype object) --------
  const mapInvestmentFromDb = (r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    sub: r.sub,
    location: r.location,
    developer: r.developer,
    currency: r.currency || "USD",
    priceTotal: Number(r.price_total) || 0,
    paid: Number(r.paid) || 0,
    equity: r.equity != null ? Number(r.equity) : undefined,
    monthlyDistribution: r.monthly_distribution != null ? Number(r.monthly_distribution) : undefined,
    progress: Number(r.progress) || 0,
    handover: r.handover,
    valueNow: Number(r.value_now) || Number(r.price_total) || 0,
    yieldExp: r.yield_exp,
    fxToUsd: r.fx_to_usd != null ? Number(r.fx_to_usd) : undefined,
    notes: r.notes,
    nextPayment: r.next_payment_amount
      ? { amount: Number(r.next_payment_amount), date: fmtDate(r.next_payment_date) }
      : undefined,
  });

  const mapInvestmentToDb = (o) => ({
    name: o.name,
    kind: o.kind,
    sub: o.sub,
    location: o.location,
    developer: o.developer,
    currency: o.currency || "USD",
    price_total: o.priceTotal || 0,
    paid: o.paid || 0,
    equity: o.equity ?? null,
    monthly_distribution: o.monthlyDistribution ?? null,
    next_payment_amount: o.nextPayment?.amount ?? null,
    next_payment_date: parseDate(o.nextPayment?.date),
    progress: o.progress || 0,
    handover: o.handover,
    value_now: o.valueNow || o.priceTotal || 0,
    yield_exp: o.yieldExp,
    fx_to_usd: o.fxToUsd ?? null,
    notes: o.notes,
  });

  const mapLoanFromDb = (r, payments = []) => {
    const history = (payments || [])
      .filter((p) => p.loan_id === r.id)
      .sort((a, b) => (a.paid_on < b.paid_on ? 1 : -1))
      .map((p) => ({ d: fmtDate(p.paid_on), a: Number(p.amount) }));
    return {
      id: r.id,
      borrower: r.borrower,
      type: r.type,
      principal: Number(r.principal) || 0,
      currency: r.currency || "USD",
      issued: fmtDate(r.issued_on),
      due: fmtDate(r.due_on),
      interest: Number(r.interest) || 0,
      status: r.status,
      paidBack: Number(r.paid_back) || 0,
      nextPayment: r.next_payment_amount
        ? { amount: Number(r.next_payment_amount), date: fmtDate(r.next_payment_date) }
        : { amount: 0, date: "—" },
      notes: r.notes,
      history,
    };
  };

  const mapLoanToDb = (o) => ({
    borrower: o.borrower,
    type: o.type || "Individual",
    principal: o.principal || 0,
    currency: o.currency || "USD",
    issued_on: parseDate(o.issued),
    due_on: parseDate(o.due),
    interest: o.interest || 0,
    status: o.status || "On track",
    paid_back: o.paidBack || 0,
    next_payment_amount: o.nextPayment?.amount || null,
    next_payment_date: parseDate(o.nextPayment?.date),
    secured_by: o.securedBy || null,
    repayment_plan: o.repaymentPlan || "monthly",
    notes: o.notes,
  });

  const mapPositionFromDb = (r) => ({
    id: r.id,
    sym: r.symbol,
    name: r.name,
    qty: Number(r.qty),
    avg: Number(r.avg_price),
    last: Number(r.last_price),
    cls: r.cls,
    source: r.source || "manual",
    integrationId: r.integration_id || null,
    externalId: r.external_id || null,
    lastSyncedAt: r.last_synced_at || null,
  });

  const mapPositionToDb = (o) => ({
    symbol: o.sym,
    name: o.name,
    qty: o.qty,
    avg_price: o.avg,
    last_price: o.last,
    cls: o.cls,
    source: o.source || "manual",
    integration_id: o.integrationId || null,
    external_id: o.externalId || null,
    last_synced_at: o.lastSyncedAt || null,
  });

  const mapIntegrationFromDb = (r) => ({
    id: r.id,
    provider: r.provider,
    label: r.label,
    apiKey: r.api_key,
    apiSecret: r.api_secret,
    passphrase: r.passphrase,
    endpoint: r.endpoint,
    status: r.status || "connected",
    scope: r.scope || "read",
    lastSyncAt: r.last_sync_at,
    lastSyncStatus: r.last_sync_status,
    lastSyncCount: r.last_sync_count || 0,
    metadata: r.metadata || {},
    createdAt: r.created_at,
  });
  const mapIntegrationToDb = (o) => ({
    provider: o.provider,
    label: o.label,
    api_key: o.apiKey || null,
    api_secret: o.apiSecret || null,
    passphrase: o.passphrase || null,
    endpoint: o.endpoint || null,
    status: o.status || "connected",
    scope: o.scope || "read",
    metadata: o.metadata || {},
  });

  const mapProjectFromDb = (r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    owner: r.owner,
    progress: Number(r.progress) || 0,
    deadline: r.deadline,
    note: r.note,
  });

  const mapProjectToDb = (o) => ({
    name: o.name,
    status: o.status || "In progress",
    owner: o.owner || "Ghanney",
    progress: o.progress || 0,
    deadline: o.deadline,
    note: o.note,
  });

  const mapIncomeStreamFromDb = (r) => ({
    id: r.id,
    label: r.label,
    type: r.type,
    cadence: r.cadence,
    gross: Number(r.gross) || 0,
    currency: r.currency || "USD",
    status: r.status,
    deferredSince: r.deferred_since,
    deferredMonths: r.deferred_months,
    accrued: Number(r.accrued) || 0,
    ytd: Number(r.ytd) || 0,
    note: r.note,
  });

  const mapIncomeStreamToDb = (o) => ({
    label: o.label,
    type: o.type,
    cadence: o.cadence,
    gross: o.gross || 0,
    currency: o.currency || "USD",
    status: o.status || "Active",
    deferred_since: o.deferredSince,
    deferred_months: o.deferredMonths,
    accrued: o.accrued || 0,
    ytd: o.ytd || 0,
    note: o.note,
  });

  const mapContractFromDb = (r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    parties: r.parties || [],
    value: Number(r.value) || 0,
    currency: r.currency || "USD",
    linkedTo: r.linked_kind
      ? { kind: r.linked_kind, id: r.linked_id, label: r.linked_label }
      : null,
    status: r.status,
    signedDate: fmtDate(r.signed_date),
    effectiveDate: r.effective_date,
    expiresDate: r.expires_date,
    fileName: r.file_name,
    filePath: r.file_path,
    fileSize: r.file_size_bytes ? fmtFileSize(r.file_size_bytes) : null,
    pages: r.pages,
    uploadedBy: r.uploaded_by,
    uploadedAt: fmtDate(r.uploaded_at),
    notes: r.notes,
    attachments: r.attachments || 0,
  });

  const mapContractToDb = (o) => ({
    name: o.name,
    type: o.type,
    parties: o.parties || [],
    value: o.value || 0,
    currency: o.currency || "USD",
    linked_kind: o.linkedTo?.kind || null,
    linked_id: o.linkedTo?.id || null,
    linked_label: o.linkedTo?.label || null,
    status: o.status || "Active",
    signed_date: parseDate(o.signedDate),
    effective_date: o.effectiveDate,
    expires_date: o.expiresDate,
    file_path: o.filePath,
    file_name: o.fileName,
    file_size_bytes: o.fileSizeBytes,
    pages: o.pages,
    uploaded_by: o.uploadedBy,
    notes: o.notes,
    attachments: o.attachments || 0,
  });

  const mapTeamFromDb = (r) => ({
    id: r.id,
    name: r.full_name || (r.email ? r.email.split("@")[0] : "Member"),
    email: r.email,
    role: r.role,
    initials: r.initials || initialsFrom(r.full_name || r.email),
    status: r.status,
    lastActive: r.last_active_at ? relTime(r.last_active_at) : "—",
    twoFa: !!r.two_fa,
    joined: r.joined_at ? fmtDate(r.joined_at).replace(/, \d+/, "") : "—",
    location: r.location,
    external: r.external_org,
  });

  // -------- helpers --------
  function fmtDate(v) {
    if (!v) return "—";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      return new Date(v).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
    }
    return String(v);
  }

  function parseDate(s) {
    if (!s) return null;
    if (typeof s !== "string") return null;
    if (s === "—" || s === "TBD") return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }

  function fmtFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function initialsFrom(s) {
    if (!s) return "??";
    const parts = s.split(/[\s@]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return s.slice(0, 2).toUpperCase();
  }

  function replaceArray(target, items) {
    if (!Array.isArray(target)) return;
    target.length = 0;
    if (Array.isArray(items)) items.forEach((it) => target.push(it));
  }

  function replaceObject(target, src) {
    if (!target || typeof target !== "object") return;
    Object.keys(target).forEach((k) => { delete target[k]; });
    Object.assign(target, src || {});
  }

  function relTime(iso) {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 2) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  }

  // -------- auth --------
  const auth = {
    async signInWithPassword(email, password) {
      if (!isConfigured()) throw new Error("Supabase not configured");
      const { data, error } = await sb().auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signUp(email, password, fullName) {
      if (!isConfigured()) throw new Error("Supabase not configured");
      const { data, error } = await sb().auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || email.split("@")[0] } },
      });
      if (error) throw error;
      return data;
    },
    async signOut() {
      if (!isConfigured()) return;
      await sb().auth.signOut();
    },
    async getSession() {
      if (!isConfigured()) return null;
      const { data } = await sb().auth.getSession();
      return data?.session || null;
    },
    onChange(cb) {
      if (!isConfigured()) return () => {};
      const { data } = sb().auth.onAuthStateChange((event, session) => cb(event, session));
      return () => data.subscription.unsubscribe();
    },
    async resetPasswordForEmail(email) {
      if (!isConfigured()) throw new Error("Supabase not configured");
      const { error } = await sb().auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (error) throw error;
    },
  };

  // -------- generic crud --------
  async function list(table, opts = {}) {
    if (!isConfigured()) return [];
    let q = sb().from(table).select(opts.select || "*");
    if (opts.order) q = q.order(opts.order, { ascending: opts.asc ?? true });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) { console.error(`[db] list ${table}`, error); return []; }
    return data || [];
  }

  async function insert(table, row) {
    if (!isConfigured()) return row;
    const user = (await sb().auth.getUser()).data?.user;
    const payload = { ...row };
    if (user && !payload.user_id) payload.user_id = user.id;
    const { data, error } = await sb().from(table).insert(payload).select().single();
    if (error) { console.error(`[db] insert ${table}`, error); throw error; }
    return data;
  }

  async function update(table, id, patch) {
    if (!isConfigured()) return patch;
    const { data, error } = await sb().from(table).update(patch).eq("id", id).select().single();
    if (error) { console.error(`[db] update ${table}`, error); throw error; }
    return data;
  }

  async function remove(table, id) {
    if (!isConfigured()) return;
    const { error } = await sb().from(table).delete().eq("id", id);
    if (error) { console.error(`[db] delete ${table}`, error); throw error; }
  }

  async function logActivity({ entity, entity_id, action, message, tag }) {
    if (!isConfigured()) return;
    try {
      const user = (await sb().auth.getUser()).data?.user;
      const profile = user
        ? (await sb().from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data
        : null;
      await sb().from("activity_log").insert({
        user_id: user?.id,
        actor: user?.id,
        actor_name: profile?.full_name || user?.email || "Someone",
        action,
        entity,
        entity_id,
        message,
        tag,
      });
    } catch (e) {
      console.warn("[db] activity log failed:", e);
    }
  }

  // -------- hydration: load everything from DB and populate window globals --------
  async function hydrate() {
    if (!isConfigured()) {
      console.info("[db] running with seed data (Supabase not configured)");
      return;
    }
    try {
      const [
        investmentsRows,
        loansRows,
        loanPays,
        invPays,
        positionsRows,
        projectsRows,
        incomeStreamsRows,
        incomeRecordsRows,
        contractsRows,
        siteUpdatesRows,
        teamRows,
        activityRows,
        netWorthRows,
        integrationsRows,
      ] = await Promise.all([
        list("investments", { order: "updated_at", asc: false }),
        list("loans", { order: "due_on", asc: true }),
        list("loan_payments", { order: "paid_on", asc: false }),
        list("investment_payments", { order: "paid_on", asc: false }),
        list("positions", { order: "symbol" }),
        list("projects", { order: "updated_at", asc: false }),
        list("income_streams", { order: "created_at", asc: false }),
        list("income_records", { order: "received_on", asc: false }),
        list("contracts", { order: "uploaded_at", asc: false }),
        list("site_updates", { order: "date", asc: false }),
        list("profiles", { order: "joined_at", asc: false }),
        list("activity_log", { order: "created_at", asc: false, limit: 50 }),
        list("net_worth_snapshots", { order: "snapshot_date", asc: true }),
        list("integrations", { order: "created_at", asc: false }).catch(() => []),
      ]);

      // CRITICAL: mutate existing arrays in-place rather than reassign,
      // because top-level `const investments = [...]` bindings in the seed
      // files still point to the original references.
      replaceArray(window.investments, investmentsRows.map(mapInvestmentFromDb));
      replaceArray(window.loans, loansRows.map((l) => mapLoanFromDb(l, loanPays)));
      replaceArray(window.tradingPositions, positionsRows.map(mapPositionFromDb));
      replaceArray(window.projects, projectsRows.map(mapProjectFromDb));
      replaceArray(window.incomeStreams, incomeStreamsRows.map(mapIncomeStreamFromDb));
      replaceArray(window.contracts, contractsRows.map(mapContractFromDb));
      replaceArray(window.team, teamRows.map(mapTeamFromDb));
      replaceArray(window.integrations, (integrationsRows || []).map(mapIntegrationFromDb));

      window.__investmentPayments = invPays;

      // Site updates: grouped by investment id
      const groupedUpdates = {};
      siteUpdatesRows.forEach((u) => {
        if (!groupedUpdates[u.investment_id]) groupedUpdates[u.investment_id] = [];
        groupedUpdates[u.investment_id].push({
          id: u.id,
          date: fmtDate(u.date),
          milestone: u.milestone,
          progress: Number(u.progress) || 0,
          reporter: u.reporter,
          photos: u.photos || 0,
          notes: u.notes,
          status: u.status,
        });
      });
      replaceObject(window.siteUpdates, groupedUpdates);

      replaceArray(window.activity, activityRows.map((a) => ({
        t: relTime(a.created_at),
        msg: a.message,
        tag: a.tag,
      })));

      replaceArray(window.teamActivity, activityRows.map((a) => ({
        t: relTime(a.created_at),
        who: a.actor_name,
        msg: a.message,
        tag: a.tag,
      })));

      // Net worth time series
      if (netWorthRows.length) {
        replaceArray(window.netWorthMonthly, netWorthRows.map((r) => ({
          m: new Date(r.snapshot_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          value: Number(r.value),
        })));
      } else {
        replaceArray(window.netWorthMonthly, computeNetWorthSeries());
      }

      replaceArray(window.incomeMonthly, aggregateIncomeMonthly(incomeRecordsRows));
      if (!Array.isArray(window.incomeRecords)) window.incomeRecords = [];
      replaceArray(window.incomeRecords, incomeRecordsRows);
      replaceArray(window.upcoming, buildUpcoming());
      replaceArray(window.netWorthBreakdown, buildBreakdown());

      console.info("[db] hydrated", {
        investments: window.investments.length,
        loans: window.loans.length,
        positions: window.tradingPositions.length,
        projects: window.projects.length,
        contracts: window.contracts.length,
      });
    } catch (e) {
      console.error("[db] hydrate failed:", e);
    }
  }

  function aggregateIncomeMonthly(records) {
    const byMonth = {};
    (records || []).forEach((r) => {
      const d = new Date(r.received_on);
      const k = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!byMonth[k]) byMonth[k] = { m: k, commission: 0, referral: 0, salary: 0 };
      const t = (r.type || "").toLowerCase();
      const amt = Number(r.amount) || 0;
      if (t.includes("salary")) byMonth[k].salary += amt;
      else if (t.includes("referral")) byMonth[k].referral += amt;
      else byMonth[k].commission += amt;
    });
    const list = Object.values(byMonth);
    if (list.length === 0) {
      // empty placeholder so charts don't crash
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        list.push({
          m: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          commission: 0, referral: 0, salary: 0,
        });
      }
    }
    return list;
  }

  function buildUpcoming() {
    const items = [];
    (window.loans || []).forEach((l) => {
      if (l.nextPayment?.amount && l.nextPayment.date && l.nextPayment.date !== "—") {
        items.push({
          d: new Date(l.nextPayment.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
          k: "Loan payment", who: l.borrower,
          amt: l.nextPayment.amount, ccy: l.currency, cls: l.status === "Overdue" ? "warn" : "pos",
          _sort: new Date(l.nextPayment.date).getTime(),
        });
      }
    });
    (window.investments || []).forEach((i) => {
      if (i.nextPayment?.amount && i.nextPayment.date && i.nextPayment.date !== "—") {
        items.push({
          d: new Date(i.nextPayment.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
          k: i.kind === "Real Estate" ? "Off-plan" : i.kind === "Real Estate Development" ? "Construction" : "Investment",
          who: i.name, amt: i.nextPayment.amount, ccy: i.currency, cls: "neg",
          _sort: new Date(i.nextPayment.date).getTime(),
        });
      }
    });
    items.sort((a, b) => a._sort - b._sort);
    return items.slice(0, 12);
  }

  function buildBreakdown() {
    const colors = ["#3B5D3A", "#5C7E5B", "#C99845", "#7A6A4F", "#B0492A", "#8C8579", "#2E4A3A"];
    const buckets = {};
    (window.investments || []).forEach((i) => {
      const key = i.kind || "Other";
      buckets[key] = (buckets[key] || 0) + (Number(i.valueNow) || 0) * (window.convertFx?.(1, i.currency || "USD", "USD") || 1);
    });
    const tradingValue = (window.tradingPositions || []).reduce((s, p) => s + p.qty * p.last, 0);
    if (tradingValue) buckets["Trading portfolio"] = tradingValue;
    const loansValue = (window.loans || []).reduce((s, l) => {
      const outstanding = (l.principal - l.paidBack);
      const fx = window.convertFx?.(1, l.currency || "USD", "USD") || 1;
      return s + outstanding * fx;
    }, 0);
    if (loansValue) buckets["Loans receivable"] = loansValue;
    const list = Object.entries(buckets).map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
    // Always return at least one row so screens that index into it don't crash.
    if (list.length === 0) {
      return [{ label: "Nothing tracked yet", value: 0, color: colors[0] }];
    }
    return list;
  }

  function computeNetWorthSeries() {
    // Synthesize a 12-month series ending at the current portfolio value,
    // so charts don't break when there are no historical snapshots yet.
    const total = buildBreakdown().reduce((s, b) => s + b.value, 0) || 0;
    const now = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // simple linear ramp; final point = total
      const v = total * (1 - i * 0.015);
      out.push({
        m: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        value: Math.max(0, Math.round(v)),
      });
    }
    return out;
  }

  async function snapshotNetWorth() {
    if (!isConfigured()) return;
    const value = buildBreakdown().reduce((s, b) => s + b.value, 0);
    const breakdown = buildBreakdown().reduce((o, b) => ({ ...o, [b.label]: b.value }), {});
    try {
      const user = (await sb().auth.getUser()).data?.user;
      if (!user) return;
      await sb().from("net_worth_snapshots").upsert({
        user_id: user.id,
        snapshot_date: new Date().toISOString().slice(0, 10),
        value, breakdown,
      }, { onConflict: "user_id,snapshot_date" });
    } catch (e) {
      console.warn("[db] snapshot failed", e);
    }
  }

  // -------- storage (contracts files) --------
  async function uploadContractFile(file, path) {
    if (!isConfigured()) throw new Error("Supabase not configured");
    const user = (await sb().auth.getUser()).data?.user;
    if (!user) throw new Error("Not signed in");
    const fullPath = `${user.id}/${path || `${Date.now()}-${file.name}`}`;
    const { data, error } = await sb().storage.from("contracts").upload(fullPath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return data.path;
  }

  async function downloadContractFile(path) {
    if (!isConfigured()) throw new Error("Supabase not configured");
    const { data, error } = await sb().storage.from("contracts").createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  }

  // -------- entity-specific helpers (used by forms) --------
  const investments = {
    async create(o) {
      const row = await insert("investments", mapInvestmentToDb(o));
      const mapped = mapInvestmentFromDb(row);
      window.investments.unshift(mapped);
      replaceArray(window.netWorthBreakdown, buildBreakdown());
      replaceArray(window.upcoming, buildUpcoming());
      logActivity({
        entity: "investment", entity_id: row.id, action: "created",
        message: `Added investment: ${mapped.name}`, tag: "real-estate",
      });
      snapshotNetWorth();
      return mapped;
    },
    async update(id, patch) {
      const row = await update("investments", id, mapInvestmentToDb({ ...findInvestment(id), ...patch }));
      const idx = window.investments.findIndex((x) => x.id === id);
      if (idx >= 0) window.investments[idx] = mapInvestmentFromDb(row);
      replaceArray(window.netWorthBreakdown, buildBreakdown());
      return window.investments[idx];
    },
    async remove(id) {
      await remove("investments", id);
      replaceArray(window.investments, window.investments.filter((x) => x.id !== id));
      replaceArray(window.netWorthBreakdown, buildBreakdown());
    },
    async addPayment(investmentId, payment) {
      const inv = findInvestment(investmentId);
      if (!inv) return;
      await insert("investment_payments", {
        investment_id: investmentId,
        amount: payment.amount,
        currency: payment.currency || inv.currency,
        paid_on: parseDate(payment.date) || new Date().toISOString().slice(0, 10),
        method: payment.method,
        note: payment.note,
      });
      const newPaid = (inv.paid || 0) + Number(payment.amount);
      await investments.update(investmentId, {
        paid: newPaid,
        progress: inv.priceTotal ? Math.min(1, newPaid / inv.priceTotal) : 0,
      });
      logActivity({
        entity: "investment", entity_id: investmentId, action: "updated",
        message: `Payment recorded — ${inv.name}: ${payment.currency} ${payment.amount}`,
        tag: "real-estate",
      });
    },
    async addSiteUpdate(investmentId, update) {
      const inv = findInvestment(investmentId);
      if (!inv) return;
      const row = await insert("site_updates", {
        investment_id: investmentId,
        milestone: update.milestone,
        progress: update.progress,
        date: parseDate(update.date) || new Date().toISOString().slice(0, 10),
        reporter: update.reporter,
        photos: update.photos || 0,
        notes: update.notes,
        status: update.status || "verified",
      });
      if (!window.siteUpdates[investmentId]) window.siteUpdates[investmentId] = [];
      window.siteUpdates[investmentId].unshift({
        id: row.id, date: fmtDate(row.date), milestone: row.milestone,
        progress: Number(row.progress), reporter: row.reporter, photos: row.photos,
        notes: row.notes, status: row.status,
      });
      if (update.progress && update.progress > inv.progress) {
        await investments.update(investmentId, { progress: update.progress });
      }
    },
  };

  const loans = {
    async create(o) {
      const row = await insert("loans", mapLoanToDb(o));
      const mapped = mapLoanFromDb(row, []);
      window.loans.unshift(mapped);
      replaceArray(window.upcoming, buildUpcoming());
      logActivity({
        entity: "loan", entity_id: row.id, action: "created",
        message: `Loan issued to ${mapped.borrower}: ${mapped.currency} ${mapped.principal}`,
        tag: "loan",
      });
      return mapped;
    },
    async update(id, patch) {
      const existing = window.loans.find((l) => l.id === id);
      const row = await update("loans", id, mapLoanToDb({ ...existing, ...patch }));
      const idx = window.loans.findIndex((l) => l.id === id);
      if (idx >= 0) window.loans[idx] = mapLoanFromDb(row, []);
      replaceArray(window.upcoming, buildUpcoming());
      return window.loans[idx];
    },
    async remove(id) {
      await remove("loans", id);
      replaceArray(window.loans, window.loans.filter((l) => l.id !== id));
    },
    async addPayment(loanId, amount, paidOn, note) {
      const loan = window.loans.find((l) => l.id === loanId);
      if (!loan) return;
      await insert("loan_payments", {
        loan_id: loanId,
        amount,
        paid_on: parseDate(paidOn) || new Date().toISOString().slice(0, 10),
        note,
      });
      const newPaidBack = (loan.paidBack || 0) + Number(amount);
      const status = newPaidBack >= loan.principal ? "Paid" : loan.status;
      const updated = await update("loans", loanId, { paid_back: newPaidBack, status });
      loan.paidBack = newPaidBack;
      loan.status = status;
      loan.history = [
        { d: fmtDate(parseDate(paidOn) || new Date().toISOString().slice(0,10)), a: Number(amount) },
        ...(loan.history || []),
      ];
      logActivity({
        entity: "loan", entity_id: loanId, action: "updated",
        message: `${loan.borrower} — ${loan.currency} ${Number(amount).toLocaleString()} payment received`,
        tag: "loan",
      });
    },
  };

  const trading = {
    async upsertPosition(o) {
      if (!isConfigured()) return o;
      const user = (await sb().auth.getUser()).data?.user;
      const { data, error } = await sb().from("positions").upsert(
        { ...mapPositionToDb(o), user_id: user?.id },
        { onConflict: "user_id,symbol" }
      ).select().single();
      if (error) throw error;
      const mapped = mapPositionFromDb(data);
      const idx = window.tradingPositions.findIndex((p) => p.sym === mapped.sym);
      if (idx >= 0) window.tradingPositions[idx] = mapped;
      else window.tradingPositions.unshift(mapped);
      return mapped;
    },
    async logTrade(o) {
      await insert("trades", {
        symbol: o.sym, name: o.name, cls: o.cls, action: o.action,
        qty: o.qty, price: o.price, venue: o.venue, notes: o.notes,
      });
      logActivity({
        entity: "trade", action: "created",
        message: `${o.action} ${o.qty} × ${o.sym} @ $${o.price}`,
        tag: "trade",
      });
    },
  };

  const projects = {
    async create(o) {
      const row = await insert("projects", mapProjectToDb(o));
      const mapped = mapProjectFromDb(row);
      window.projects.unshift(mapped);
      logActivity({
        entity: "project", entity_id: row.id, action: "created",
        message: `Started project: ${mapped.name}`, tag: "project",
      });
      return mapped;
    },
    async update(id, patch) {
      const existing = window.projects.find((p) => p.id === id);
      const row = await update("projects", id, mapProjectToDb({ ...existing, ...patch }));
      const idx = window.projects.findIndex((p) => p.id === id);
      if (idx >= 0) window.projects[idx] = mapProjectFromDb(row);
      return window.projects[idx];
    },
    async remove(id) {
      await remove("projects", id);
      replaceArray(window.projects, window.projects.filter((p) => p.id !== id));
    },
  };

  const income = {
    async createStream(o) {
      const row = await insert("income_streams", mapIncomeStreamToDb(o));
      const mapped = mapIncomeStreamFromDb(row);
      window.incomeStreams.unshift(mapped);
      return mapped;
    },
    async updateStream(id, patch) {
      const existing = window.incomeStreams.find((s) => s.id === id);
      const row = await update("income_streams", id, mapIncomeStreamToDb({ ...existing, ...patch }));
      const idx = window.incomeStreams.findIndex((s) => s.id === id);
      if (idx >= 0) window.incomeStreams[idx] = mapIncomeStreamFromDb(row);
      return window.incomeStreams[idx];
    },
    async record(o) {
      const row = await insert("income_records", {
        type: o.type, source: o.source, amount: o.amount, currency: o.currency,
        received_on: parseDate(o.date) || new Date().toISOString().slice(0, 10),
        note: o.note,
      });
      logActivity({
        entity: "income", entity_id: row.id, action: "created",
        message: `${o.type} received: ${o.currency} ${Number(o.amount).toLocaleString()} from ${o.source}`,
        tag: "income",
      });
      const recs = await list("income_records", { order: "received_on", asc: false });
      replaceArray(window.incomeMonthly, aggregateIncomeMonthly(recs));
      if (!Array.isArray(window.incomeRecords)) window.incomeRecords = [];
      replaceArray(window.incomeRecords, recs);
      return row;
    },
  };

  const contracts = {
    async create(o) {
      const row = await insert("contracts", mapContractToDb(o));
      const mapped = mapContractFromDb(row);
      window.contracts.unshift(mapped);
      logActivity({
        entity: "contract", entity_id: row.id, action: "created",
        message: `Uploaded contract: ${mapped.name}`, tag: "contract",
      });
      return mapped;
    },
    async update(id, patch) {
      const existing = window.contracts.find((c) => c.id === id);
      const row = await update("contracts", id, mapContractToDb({ ...existing, ...patch }));
      const idx = window.contracts.findIndex((c) => c.id === id);
      if (idx >= 0) window.contracts[idx] = mapContractFromDb(row);
      return window.contracts[idx];
    },
    async remove(id) {
      const ctr = window.contracts.find((c) => c.id === id);
      if (ctr?.filePath) {
        try { await sb().storage.from("contracts").remove([ctr.filePath]); } catch (e) {}
      }
      await remove("contracts", id);
      replaceArray(window.contracts, window.contracts.filter((c) => c.id !== id));
    },
    uploadFile: uploadContractFile,
    downloadFile: downloadContractFile,
  };

  const team = {
    async invite(o) {
      const profile = {
        id: o.id || crypto.randomUUID(),
        email: o.email,
        full_name: o.name,
        initials: initialsFrom(o.name),
        role: o.role || "Read-only",
        location: o.location,
        external_org: o.external,
        two_fa: false,
        status: "Pending",
      };
      const row = await insert("profiles", profile);
      const mapped = mapTeamFromDb(row);
      window.team.unshift(mapped);
      logActivity({
        entity: "team", entity_id: row.id, action: "created",
        message: `Invited ${row.full_name} as ${row.role}`, tag: "team",
      });
      return mapped;
    },
    async update(id, patch) {
      const existing = window.team.find((m) => m.id === id);
      const dbPatch = {
        full_name: patch.name ?? existing?.name,
        role: patch.role ?? existing?.role,
        status: patch.status ?? existing?.status,
        location: patch.location ?? existing?.location,
        external_org: patch.external ?? existing?.external,
        two_fa: patch.twoFa ?? existing?.twoFa,
      };
      const row = await update("profiles", id, dbPatch);
      const idx = window.team.findIndex((m) => m.id === id);
      if (idx >= 0) window.team[idx] = mapTeamFromDb(row);
      return window.team[idx];
    },
    async remove(id) {
      await remove("profiles", id);
      replaceArray(window.team, window.team.filter((m) => m.id !== id));
    },
  };

  // ----------------------------------------------------------
  // Integrations — external account connections
  // ----------------------------------------------------------
  const integrations = {
    async create(o) {
      if (!isConfigured()) {
        const local = { ...o, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        window.integrations.unshift(local);
        return local;
      }
      const row = await insert("integrations", mapIntegrationToDb(o));
      const mapped = mapIntegrationFromDb(row);
      window.integrations.unshift(mapped);
      logActivity({
        entity: "integration", entity_id: row.id, action: "created",
        message: `Connected ${mapped.provider}${mapped.label ? ` · ${mapped.label}` : ""}`,
        tag: "integration",
      });
      return mapped;
    },
    async update(id, patch) {
      if (!isConfigured()) {
        const idx = window.integrations.findIndex((i) => i.id === id);
        if (idx >= 0) window.integrations[idx] = { ...window.integrations[idx], ...patch };
        return window.integrations[idx];
      }
      const dbPatch = {};
      if (patch.label != null) dbPatch.label = patch.label;
      if (patch.apiKey != null) dbPatch.api_key = patch.apiKey;
      if (patch.apiSecret != null) dbPatch.api_secret = patch.apiSecret;
      if (patch.passphrase != null) dbPatch.passphrase = patch.passphrase;
      if (patch.endpoint != null) dbPatch.endpoint = patch.endpoint;
      if (patch.status != null) dbPatch.status = patch.status;
      if (patch.scope != null) dbPatch.scope = patch.scope;
      if (patch.lastSyncAt !== undefined) dbPatch.last_sync_at = patch.lastSyncAt;
      if (patch.lastSyncStatus !== undefined) dbPatch.last_sync_status = patch.lastSyncStatus;
      if (patch.lastSyncCount !== undefined) dbPatch.last_sync_count = patch.lastSyncCount;
      if (patch.metadata !== undefined) dbPatch.metadata = patch.metadata;
      dbPatch.updated_at = new Date().toISOString();
      const row = await update("integrations", id, dbPatch);
      const idx = window.integrations.findIndex((i) => i.id === id);
      if (idx >= 0) window.integrations[idx] = mapIntegrationFromDb(row);
      return window.integrations[idx];
    },
    async remove(id) {
      const integration = window.integrations.find((i) => i.id === id);
      if (isConfigured()) {
        // Wipe synced positions from this integration. Manual entries are kept.
        const user = (await sb().auth.getUser()).data?.user;
        if (user) {
          await sb().from("positions").delete().eq("user_id", user.id).eq("integration_id", id);
        }
        await remove("integrations", id);
      }
      replaceArray(window.integrations, window.integrations.filter((i) => i.id !== id));
      replaceArray(window.tradingPositions, window.tradingPositions.filter((p) => p.integrationId !== id));
      if (integration) {
        logActivity({
          entity: "integration", entity_id: id, action: "deleted",
          message: `Disconnected ${integration.provider}${integration.label ? ` · ${integration.label}` : ""}`,
          tag: "integration",
        });
      }
    },
    // Replace all positions that came from this integration with the freshly
    // fetched list. Manually-entered positions are untouched.
    async syncPositions(integration, positions) {
      const now = new Date().toISOString();
      const stamped = positions.map((p) => ({
        ...p,
        source: integration.provider,
        integrationId: integration.id,
        lastSyncedAt: now,
      }));

      if (!isConfigured()) {
        replaceArray(
          window.tradingPositions,
          window.tradingPositions
            .filter((p) => p.integrationId !== integration.id)
            .concat(stamped)
        );
      } else {
        const user = (await sb().auth.getUser()).data?.user;
        if (!user) throw new Error("Not signed in.");
        await sb().from("positions").delete().eq("user_id", user.id).eq("integration_id", integration.id);
        if (stamped.length > 0) {
          const rows = stamped.map((p) => ({ ...mapPositionToDb(p), user_id: user.id }));
          const { data, error } = await sb().from("positions").insert(rows).select();
          if (error) throw error;
          const newOnes = data.map(mapPositionFromDb);
          replaceArray(
            window.tradingPositions,
            window.tradingPositions
              .filter((p) => p.integrationId !== integration.id)
              .concat(newOnes)
          );
        } else {
          replaceArray(
            window.tradingPositions,
            window.tradingPositions.filter((p) => p.integrationId !== integration.id)
          );
        }
      }

      // Update the integration's last-sync metadata
      await integrations.update(integration.id, {
        lastSyncAt: now,
        lastSyncStatus: "ok",
        lastSyncCount: stamped.length,
        status: "connected",
      });

      logActivity({
        entity: "integration", entity_id: integration.id, action: "synced",
        message: `${integration.provider}: ${stamped.length} position${stamped.length === 1 ? "" : "s"} synced`,
        tag: "integration",
      });

      return stamped;
    },
    async markError(id, message) {
      return integrations.update(id, {
        status: "error",
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: message,
      });
    },
  };

  function findInvestment(id) {
    return window.investments.find((x) => x.id === id);
  }

  // -------- expose globally --------
  window.db = {
    sb, isConfigured, auth,
    list, insert, update, remove, logActivity,
    hydrate, snapshotNetWorth,
    investments, loans, trading, projects, income, contracts, team, integrations,
    helpers: { fmtDate, parseDate, fmtFileSize, initialsFrom, relTime },
    builders: { aggregateIncomeMonthly, buildUpcoming, buildBreakdown, computeNetWorthSeries },
  };
})();
