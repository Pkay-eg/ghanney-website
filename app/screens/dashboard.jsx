// =========================================================
// Dashboard / Overview — with layout variations
// Layouts: "executive" (default), "operator" (denser, data-first), "calm" (single column, editorial)
// =========================================================

const KPI = ({ eyebrow, value, sub, delta, sparkData, sparkColor }) => (
  <div className="card">
    <div className="row between" style={{ alignItems: "flex-start" }}>
      <div className="eyebrow">{eyebrow}</div>
      {delta != null && <Delta value={delta} />}
    </div>
    <div className="h-num tabular" style={{ marginTop: 16 }}>{value}</div>
    {sub && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{sub}</div>}
    {sparkData && (
      <div style={{ marginTop: 14 }}>
        <Sparkline data={sparkData} color={sparkColor || "var(--ink)"} fill />
      </div>
    )}
  </div>
);

const Dashboard = ({ layout = "executive", onNav, showSensitive = true }) => {
  if (layout === "operator") return <DashboardOperator onNav={onNav} showSensitive={showSensitive} />;
  if (layout === "calm") return <DashboardCalm onNav={onNav} showSensitive={showSensitive} />;
  return <DashboardExecutive onNav={onNav} showSensitive={showSensitive} />;
};

// Safe percentage change. Returns null when undefined (no base period yet).
const pctChange = (curr, prev) => {
  if (prev == null || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
};

// Slice a monthly series (entries shaped { m: "May 26", value }) down to a
// selected time period. "1M"/"3M"/... include one extra point at the start so
// the chart can draw the change across that window. "YTD" anchors on the last
// point of the prior year; "All" returns the whole series untouched.
const PERIOD_MONTHS = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "2Y": 24 };
const yearOf = (entry) => parseInt((entry.m || "").split(" ")[1] || "0", 10);
const sliceSeriesByPeriod = (series, period) => {
  if (!Array.isArray(series) || series.length === 0 || period === "All") return series;
  if (period === "YTD") {
    const latestYear = yearOf(series[series.length - 1]);
    let start = series.findIndex((e) => yearOf(e) === latestYear);
    if (start === -1) return series;
    if (start > 0) start -= 1; // include prior year-end as the YTD baseline
    return series.slice(start);
  }
  const months = PERIOD_MONTHS[period];
  if (!months) return series;
  return series.slice(Math.max(0, series.length - (months + 1)));
};

// Period filter buttons for a net-worth chart. Controlled by the caller's state.
const PeriodTabs = ({ periods, value, onChange }) => (
  <div className="row gap-2 period-tabs">
    {periods.map((t) => (
      <button
        key={t}
        className={`btn sm ${t === value ? "primary" : ""}`}
        onClick={() => onChange(t)}
      >
        {t}
      </button>
    ))}
  </div>
);

// First-run guide — shown on the dashboard while the portfolio is empty.
const GetStarted = () => {
  const steps = [
    { done: (window.investments || []).length > 0, label: "Add your first investment", desc: "Property, business equity or an SPV", icon: "invest", type: "investment" },
    { done: (window.loans || []).length > 0, label: "Record a loan you've given", desc: "Track repayments and due dates", icon: "loans", type: "loan" },
    { done: (window.incomeRecords || []).length > 0, label: "Log income received", desc: "Commissions, referrals, distributions", icon: "income", type: "income" },
    { done: (window.integrations || []).length > 0, label: "Connect a trading account", desc: "Binance, Kraken, Coinbase, IBKR…", icon: "link", type: "integration" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <div className="card pad-lg span-12" style={{ background: "var(--surface)" }}>
      <div className="row between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow">Get started</div>
          <div className="h-section" style={{ marginTop: 6 }}>Build your portfolio</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 6, maxWidth: 460 }}>
            Your portal is empty. Add what you own and owe — everything else (net worth, notifications, charts) fills in automatically.
          </div>
        </div>
        <div className="muted mono" style={{ fontSize: 12 }}>{doneCount} / {steps.length} done</div>
      </div>
      <div className="grid-2" style={{ gap: 12, marginTop: 18 }}>
        {steps.map((s) => (
          <button
            key={s.type}
            className="card flat"
            onClick={() => window.__openForm?.(s.type)}
            style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: 14, cursor: "pointer" }}
          >
            <span className="notif-ic" style={{ flexShrink: 0, background: s.done ? "var(--positive-soft)" : "var(--line-2)", color: s.done ? "var(--positive)" : "var(--ink-2)" }}>
              <Icon name={s.done ? "check" : s.icon} size={15} stroke={s.done ? 2.6 : 1.6} />
            </span>
            <span className="col" style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}>{s.label}</span>
              <span className="muted" style={{ fontSize: 11.5 }}>{s.desc}</span>
            </span>
            {!s.done && <Icon name="arrowRight" size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------- Executive — hero net worth + scannable grid ----------
const DashboardExecutive = ({ onNav, showSensitive }) => {
  const $ = useMoney();
  const [nwPeriod, setNwPeriod] = React.useState("1Y");
  const [compMode, setCompMode] = React.useState("value"); // "value" | "pct"
  const nwChartData = sliceSeriesByPeriod(netWorthMonthly, nwPeriod);
  const compTotal = netWorthBreakdown.reduce((s, d) => s + (d.value || 0), 0) || 1;
  const nwSeries = netWorthMonthly.map((d) => d.value);
  const lastNW = nwSeries[nwSeries.length - 1] || 0;
  const monthDelta = pctChange(lastNW, nwSeries[nwSeries.length - 2]);
  const ytdDelta = pctChange(lastNW, nwSeries[0]);

  const ytdIncome = incomeMonthly.reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const incomeLast3 = incomeMonthly.slice(-3).reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const incomePrev3 = incomeMonthly.slice(-6, -3).reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const incomeDelta = pctChange(incomeLast3, incomePrev3);

  const accruedSalariesUsd = incomeStreams
    .filter((s) => s.status === "Deferred")
    .reduce((s, x) => s + convertFx(x.accrued, x.currency, "USD"), 0);
  // Synthesize a 12-point ramp ending at current accrual, for the spark
  const accruedSpark = accruedSalariesUsd
    ? Array.from({ length: 12 }, (_, i) => Math.round(accruedSalariesUsd * (i + 1) / 12))
    : [];

  const totalLoansOut = loans.reduce((s, l) => s + convertFx(l.principal - l.paidBack, l.currency || "USD", "USD"), 0);
  const overdueLoans = loans.filter((l) => l.status === "Overdue" || l.status === "Due soon");
  // Build a small synthetic outstanding-over-time series for the loan KPI sparkline
  const loanSpark = loans.length
    ? Array.from({ length: 7 }, (_, i) => totalLoansOut * (1 - (6 - i) * 0.005))
    : [];

  const tradingValue = tradingPositions.reduce((s, p) => s + p.qty * p.last, 0);
  const tradingCost  = tradingPositions.reduce((s, p) => s + p.qty * p.avg, 0);
  const tradingPnLAbs = tradingValue - tradingCost;
  const tradingPnLPct = tradingCost > 0 ? (tradingPnLAbs / tradingCost) * 100 : null;

  const realEstateValue = investments.filter((i) => (i.kind || "").includes("Real Estate")).reduce((s, i) => {
    return s + convertFx(i.valueNow, i.currency, "USD");
  }, 0);

  return (
    <div className="fade-in" data-screen-label="01 Overview">
      <Topbar title={`Welcome back, ${(window.__myInfo?.() || {}).first || "there"}.`} subtitle={`${new Date().toLocaleDateString("en-GB",{weekday:"long"})} · ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})}`} />

      <div className="content">
        {(investments || []).length === 0 && (loans || []).length === 0 && (tradingPositions || []).length === 0 && (netWorthBreakdown || []).length === 0 && (
          <div className="grid-12" style={{ marginBottom: 20 }}>
            <GetStarted />
          </div>
        )}
        {/* Hero net worth */}
        <div className="grid-12">
          <div className="card pad-lg span-8" style={{ position: "relative", overflow: "hidden" }}>
            <div className="row between">
              <div>
                <div className="eyebrow">Net Worth · {$.display}</div>
                <div style={{ marginTop: 8 }}>
                  <Display value={lastNW} blur={!showSensitive} />
                </div>
                <div className="row gap-3" style={{ marginTop: 10 }}>
                  <Delta value={monthDelta} />
                  <span className="muted" style={{ fontSize: 12.5 }}>vs last month</span>
                  <span className="dot muted" />
                  <Delta value={ytdDelta} />
                  <span className="muted" style={{ fontSize: 12.5 }}>YTD</span>
                </div>
              </div>
              <div className="col items-end gap-3">
                <PeriodTabs periods={["1M", "3M", "6M", "YTD", "1Y", "All"]} value={nwPeriod} onChange={setNwPeriod} />
                <button className="btn sm" onClick={() => onNav("networth")}>
                  Details <Icon name="arrowRight" size={12} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <AreaChart
                data={nwChartData}
                valueKey="value"
                color="var(--positive)"
                height={220}
                formatY={(v) => $.fmtK(v)}
                formatTip={(v) => $.fmt(v)}
              />
            </div>
          </div>

          {/* Composition */}
          <div className="card pad-lg span-4">
            <div className="row between">
              <div className="eyebrow">Composition</div>
              <button className="btn ghost sm" onClick={() => setCompMode((m) => (m === "value" ? "pct" : "value"))}>
                {compMode === "value" ? "By value" : "By %"}
              </button>
            </div>
            <div className="row gap-4" style={{ marginTop: 18, alignItems: "center" }}>
              <Donut data={netWorthBreakdown} size={160} thickness={20} />
              <div className="col gap-3" style={{ flex: 1, fontSize: 12 }}>
                {netWorthBreakdown.slice(0, 5).map((d) => (
                  <div className="row between gap-3" key={d.label}>
                    <span className="row gap-2" style={{ minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>{d.label.split(" (")[0]}</span>
                    </span>
                    <span className="mono" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>{compMode === "value" ? $.fmtK(d.value) : `${Math.round((d.value / compTotal) * 100)}%`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hr" style={{ margin: "16px 0" }} />
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="muted" style={{ whiteSpace: "nowrap" }}>Liquid · cash + trading</span>
              <span className="mono" style={{ whiteSpace: "nowrap" }}>{$.fmtK((netWorthBreakdown[5]?.value || 0) + (netWorthBreakdown[4]?.value || 0))}</span>
            </div>
            <div className="row between" style={{ fontSize: 12, marginTop: 6 }}>
              <span className="muted" style={{ whiteSpace: "nowrap" }}>Illiquid · property + SPV</span>
              <span className="mono" style={{ whiteSpace: "nowrap" }}>{$.fmtK(realEstateValue)}</span>
            </div>
          </div>

          {/* KPI row */}
          <div className="span-3">
            <KPI
              eyebrow="Income · YTD"
              value={$.fmtK(ytdIncome)}
              sub={ytdIncome ? "Commissions + referrals · 12 mo" : "No income recorded yet"}
              delta={incomeDelta}
              sparkData={ytdIncome ? incomeMonthly.map((m) => (m.commission || 0) + (m.referral || 0)) : null}
              sparkColor="var(--positive)"
            />
          </div>
          <div className="span-3">
            <KPI
              eyebrow="Deferred Salaries"
              value={$.fmtK(accruedSalariesUsd)}
              sub={accruedSalariesUsd ? "Across deferred salary streams" : "No deferred salaries"}
              delta={null}
              sparkData={accruedSpark.length ? accruedSpark : null}
              sparkColor="var(--warn)"
            />
          </div>
          <div className="span-3">
            <KPI
              eyebrow="Trading P&L · MTD"
              value={tradingCost ? $.fmtK(tradingPnLAbs) : "—"}
              sub={tradingPnLPct == null ? "No positions yet" : `${tradingPnLPct >= 0 ? "+" : ""}${tradingPnLPct.toFixed(2)}% unrealised`}
              delta={tradingPnLPct}
              sparkData={tradingCost && tradingPnL?.length ? tradingPnL.map((p) => p.v) : null}
              sparkColor="var(--positive)"
            />
          </div>
          <div className="span-3">
            <KPI
              eyebrow="Loans Outstanding"
              value={$.fmtK(totalLoansOut)}
              sub={loans.length ? `${loans.length} active · ${overdueLoans.length} need attention` : "No loans on the books"}
              delta={null}
              sparkData={loanSpark.length ? loanSpark : null}
              sparkColor="var(--negative)"
            />
          </div>
        </div>

        {/* Section 2: Activity + Upcoming + Investments */}
        <div className="grid-12" style={{ marginTop: 20 }}>
          {/* Investments quick view */}
          <div className="card span-8">
            <div className="row between" style={{ marginBottom: 18 }}>
              <div>
                <div className="eyebrow">Investments</div>
                <div className="h-section" style={{ marginTop: 4 }}>Portfolio at a glance</div>
              </div>
              <button className="btn sm" onClick={() => onNav("investments")}>
                View all <Icon name="arrowRight" size={12} />
              </button>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Status</th>
                  <th className="num">Committed</th>
                  <th className="num">Funded</th>
                  <th className="num">Current Value</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {investments.slice(0, 5).map((inv) => {
                  return (
                    <tr key={inv.id} className="clickable" onClick={() => onNav("investments", inv.id)}>
                      <td>
                        <div className="row gap-3">
                          <div className="thumb" style={{ width: 40, height: 40, borderRadius: 8 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{inv.name}</div>
                            <div className="muted" style={{ fontSize: 11 }}>{inv.location} · {inv.kind}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ width: 120 }}>
                          <div className="row between" style={{ fontSize: 11, marginBottom: 4 }}>
                            <span className="muted">{Math.round(inv.progress * 100)}%</span>
                            <span className="muted mono">{inv.handover || "—"}</span>
                          </div>
                          <div className="bar"><i style={{ width: `${inv.progress * 100}%`, background: inv.progress >= 1 ? "var(--positive)" : "var(--ink)" }} /></div>
                        </div>
                      </td>
                      <td className="num">
                        <div>{$.fmtK(inv.priceTotal, inv.currency)}</div>
                        {inv.currency !== $.display && <div className="muted mono" style={{ fontSize: 10 }}>{formatCurrency(inv.priceTotal, inv.currency, { compact: true })}</div>}
                      </td>
                      <td className="num mono">{$.fmtK(inv.paid, inv.currency)}</td>
                      <td className="num">
                        <div className="mono">{$.fmtK(inv.valueNow, inv.currency)}</div>
                        <div className="pos" style={{ fontSize: 11 }}>+{(((inv.valueNow - inv.priceTotal)/inv.priceTotal) * 100).toFixed(1)}%</div>
                      </td>
                      <td><Icon name="chevRight" size={14} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Upcoming + FX */}
          <div className="span-4 col" style={{ gap: 20 }}>
            <div className="card">
              <div className="row between" style={{ marginBottom: 14 }}>
                <div>
                  <div className="eyebrow">Upcoming</div>
                  <div className="h-section" style={{ marginTop: 4 }}>Next 60 days</div>
                </div>
                <button className="btn ghost sm"><Icon name="calendar" size={14} /></button>
              </div>

              <div className="col">
                {upcoming.length === 0 ? (
                  <div className="muted" style={{ fontSize: 12.5, padding: "20px 0" }}>
                    Nothing scheduled. Loan & investment due dates appear here automatically.
                  </div>
                ) : (
                  upcoming.map((u, i) => (
                    <div key={i} className="row gap-3" style={{
                      padding: "12px 0",
                      borderBottom: i < upcoming.length - 1 ? "1px solid var(--line-2)" : "none",
                    }}>
                      <div className="col items-start" style={{ minWidth: 44 }}>
                        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{u.d.split(" ")[0]}</div>
                        <div className="serif" style={{ fontSize: 20, lineHeight: 1 }}>{u.d.split(" ")[1]}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5 }}>{u.who}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{u.k}{u.ccy && u.ccy !== $.display ? ` · ${formatCurrency(u.amt, u.ccy, { compact: true })}` : ""}</div>
                      </div>
                      <div className={`mono ${u.cls === "neg" ? "neg" : u.cls === "pos" ? "pos" : ""}`} style={{ fontSize: 12.5 }}>
                        {u.cls === "neg" ? "−" : u.cls === "pos" ? "+" : ""}{$.fmtK(u.amt, u.ccy || "USD")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <FxRatesWidget />
          </div>

          {/* Trading mini */}
          <div className="card span-8">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Trading</div>
                <div className="h-section" style={{ marginTop: 4 }}>Market tape · live</div>
              </div>
              <button className="btn sm" onClick={() => onNav("trading")}>
                Open desk <Icon name="arrowRight" size={12} />
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <MarketTape variant="grid" />
            </div>

            {tradingPositions.length === 0 ? (
              <div className="muted" style={{ padding: "32px 0", textAlign: "center", fontSize: 13 }}>
                No open positions. <a style={{ cursor: "pointer", color: "var(--ink)" }} onClick={() => window.__openForm?.("trade")}>Record your first trade</a>.
              </div>
            ) : (
            <table className="table">
              <thead>
                <tr><th>Position</th><th>Class</th><th className="num">Qty</th><th className="num">Avg</th><th className="num">Last</th><th className="num">P&L</th></tr>
              </thead>
              <tbody>
                {tradingPositions.slice(0, 5).map((p) => {
                  const pnl = (p.last - p.avg) * p.qty;
                  const pct = p.avg > 0 ? ((p.last - p.avg) / p.avg) * 100 : 0;
                  return (
                    <tr key={p.sym}>
                      <td>
                        <div className="row gap-3">
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11 }}>{p.sym.slice(0,1)}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.sym}</div>
                            <div className="muted" style={{ fontSize: 11 }}>{p.name}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="chip ghost">{p.cls}</span></td>
                      <td className="num mono">{p.qty}</td>
                      <td className="num mono">${p.avg.toLocaleString()}</td>
                      <td className="num mono">${p.last.toLocaleString()}</td>
                      <td className="num">
                        <div className={`mono ${pnl >= 0 ? "pos" : "neg"}`}>{pnl >= 0 ? "+" : ""}${(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className={pct >= 0 ? "pos" : "neg"} style={{ fontSize: 11 }}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>

          {/* Activity */}
          <div className="card span-4">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Recent activity</div>
                <div className="h-section" style={{ marginTop: 4 }}>Today</div>
              </div>
              <button className="btn ghost sm"><Icon name="refresh" size={14} /></button>
            </div>
            <div className="col">
              {activity.length === 0 ? (
                <div className="muted" style={{ fontSize: 12.5, padding: "20px 0" }}>
                  No activity yet. Recording income, loans, or trades will show up here.
                </div>
              ) : (
                activity.map((a, i) => (
                  <div key={i} className="row gap-3" style={{
                    padding: "12px 0",
                    borderBottom: i < activity.length - 1 ? "1px solid var(--line-2)" : "none",
                    alignItems: "flex-start",
                  }}>
                    <span className="dot" style={{ marginTop: 6, background:
                      a.tag === "loan" ? "var(--positive)" :
                      a.tag === "trade" ? "var(--ink)" :
                      a.tag === "real-estate" ? "var(--accent)" :
                      a.tag === "income" ? "var(--positive)" :
                      a.tag === "business" ? "var(--warn)" : "var(--muted)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{a.msg}</div>
                      <div className="muted mono" style={{ fontSize: 10.5, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{a.t} · {a.tag}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Loans summary card */}
          <div className="card span-6">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Loans receivable</div>
                <div className="h-section" style={{ marginTop: 4 }}>{$.fmtK(totalLoansOut)} outstanding</div>
              </div>
              <button className="btn sm" onClick={() => onNav("loans")}>Manage <Icon name="arrowRight" size={12} /></button>
            </div>
            <div className="col gap-3">
              {loans.slice(0,4).map((l) => {
                const remain = l.principal - l.paidBack;
                return (
                  <div key={l.id} className="row gap-3" style={{ padding: "10px 0", borderBottom: "1px solid var(--line-2)" }}>
                    <div className="avatar">{l.borrower.split(" ").map((s)=>s[0]).slice(0,2).join("")}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row between">
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{l.borrower}</div>
                        <Status label={l.status} />
                      </div>
                      <div className="row between" style={{ marginTop: 6 }}>
                        <div className="muted" style={{ fontSize: 11 }}>{l.type} · due {l.due}</div>
                        <div className="mono" style={{ fontSize: 12 }}>{$.fmt(remain, l.currency)}</div>
                      </div>
                      <div className="bar" style={{ marginTop: 6 }}>
                        <i style={{ width: `${(l.paidBack/l.principal)*100}%`, background: l.status === "Overdue" ? "var(--negative)" : "var(--positive)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projects summary */}
          <div className="card span-6">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Active projects</div>
                <div className="h-section" style={{ marginTop: 4 }}>{projects.length} in flight</div>
              </div>
              <button className="btn sm" onClick={() => onNav("projects")}>All projects <Icon name="arrowRight" size={12} /></button>
            </div>
            <div className="col gap-3">
              {projects.map((p) => (
                <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <div className="row between">
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <Status label={p.status} />
                  </div>
                  <div className="row between" style={{ marginTop: 6 }}>
                    <div className="muted" style={{ fontSize: 11 }}>{p.owner}</div>
                    <div className="muted mono" style={{ fontSize: 11 }}>{p.deadline}</div>
                  </div>
                  <div className="row gap-3" style={{ marginTop: 8, alignItems: "center" }}>
                    <div className="bar" style={{ flex: 1 }}><i style={{ width: `${p.progress * 100}%` }} /></div>
                    <span className="mono" style={{ fontSize: 11 }}>{Math.round(p.progress * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Operator — denser, more like a trading terminal ----------
const DashboardOperator = ({ onNav, showSensitive }) => {
  const $ = useMoney();
  const nwSeries = netWorthMonthly.map((d) => d.value);
  const lastNW = nwSeries[nwSeries.length - 1] || 0;
  const opMonthDelta = pctChange(lastNW, nwSeries[nwSeries.length - 2]);
  const opYtdDelta = pctChange(lastNW, nwSeries[0]);

  const opIncomeYtd = incomeMonthly.reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const opIncomeLast3 = incomeMonthly.slice(-3).reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const opIncomePrev3 = incomeMonthly.slice(-6, -3).reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const opIncomeDelta = pctChange(opIncomeLast3, opIncomePrev3);

  const opTradingValue = tradingPositions.reduce((s, p) => s + p.qty * p.last, 0);
  const opTradingCost = tradingPositions.reduce((s, p) => s + p.qty * p.avg, 0);
  const opTradingDelta = opTradingCost > 0 ? ((opTradingValue - opTradingCost) / opTradingCost) * 100 : null;

  return (
    <div className="fade-in" data-screen-label="01 Overview (Operator)">
      <Topbar title="Operator view" subtitle="Personal Portal · Dense" />
      <div className="content">
        {/* tape across top */}
        <div style={{ marginBottom: 16 }}>
          <MarketTape compact />
        </div>

        <div className="grid-12">
          {/* Big NW number — column */}
          <div className="card pad-lg span-4">
            <div className="eyebrow">Net Worth</div>
            <div style={{ marginTop: 14 }}><Display value={lastNW} /></div>
            <div className="row gap-3" style={{ marginTop: 12 }}>
              <Delta value={opMonthDelta} />
              <span className="muted" style={{ fontSize: 12 }}>this month</span>
            </div>
            <div className="hr" style={{ margin: "20px 0" }} />
            {(netWorthBreakdown || []).length === 0 || (netWorthBreakdown[0]?.value || 0) === 0 ? (
              <div className="muted" style={{ fontSize: 12, padding: "8px 0" }}>
                Nothing tracked yet. Start with{" "}
                <a style={{ cursor: "pointer", color: "var(--ink)" }} onClick={() => window.__openForm?.("investment")}>an investment</a>{" "}
                or <a style={{ cursor: "pointer", color: "var(--ink)" }} onClick={() => window.__openForm?.("loan")}>a loan</a>.
              </div>
            ) : (
              netWorthBreakdown.map((b) => (
                <div key={b.label} className="row between" style={{ padding: "8px 0", borderBottom: "1px dashed var(--line-2)", fontSize: 12.5 }}>
                  <span className="muted">{b.label}</span>
                  <span className="mono">{$.fmtK(b.value)}</span>
                </div>
              ))
            )}
          </div>

          {/* Multi-chart column */}
          <div className="span-8">
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="card">
                <div className="row between"><div className="eyebrow">Net worth · 12mo</div><Delta value={opYtdDelta} /></div>
                <div style={{ marginTop: 8 }}>
                  <AreaChart data={netWorthMonthly} valueKey="value" color="var(--positive)" height={180}
                    formatY={(v) => $.fmtK(v)} formatTip={(v) => $.fmt(v)} />
                </div>
              </div>
              <div className="card">
                <div className="row between"><div className="eyebrow">Income · 12mo</div><Delta value={opIncomeDelta} /></div>
                <div style={{ marginTop: 8 }}>
                  <StackedBars
                    data={incomeMonthly} keys={["commission", "referral"]}
                    colors={["var(--ink)", "var(--warn)"]} height={180}
                    formatY={(v) => $.fmtK(v)}
                  />
                </div>
                <div className="row gap-4" style={{ marginTop: 8, fontSize: 11 }}>
                  <span><span className="dot" style={{ background: "var(--ink)", marginRight: 6 }} />Commission</span>
                  <span><span className="dot" style={{ background: "var(--warn)", marginRight: 6 }} />Referral</span>
                </div>
              </div>
              <div className="card">
                <div className="row between"><div className="eyebrow">Trading P&L</div><Delta value={opTradingDelta} /></div>
                <div style={{ marginTop: 8 }}>
                  <AreaChart data={tradingPnL} valueKey="v" color="var(--accent)" height={180}
                    formatY={(v) => $.fmtK(v)} formatTip={(v) => $.fmt(v)} />
                </div>
              </div>
              <div className="card">
                <div className="row between"><div className="eyebrow">FX rates</div><span className="chip pos"><span className="dot pos" />Live</span></div>
                <div style={{ marginTop: 12 }}>
                  <FxRatesWidget compact />
                </div>
              </div>
            </div>
          </div>

          {/* Investment table full width */}
          <div className="card span-12">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="h-section">All positions</div>
              <div className="row gap-2">
                <button className="btn sm" onClick={() => onNav?.("investments")}><Icon name="filter" size={12} />Filter & sort</button>
                <button className="btn sm" onClick={() => window.__export?.("investments")}><Icon name="download" size={12} />Export</button>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr><th>Asset</th><th>Kind</th><th>Loc.</th><th>Progress</th><th className="num">Committed</th><th className="num">Funded</th><th className="num">Now</th><th className="num">Δ</th></tr>
              </thead>
              <tbody>
                {investments.map((i) => {
                  const gain = ((i.valueNow - i.priceTotal) / i.priceTotal) * 100;
                  return (
                    <tr key={i.id} className="clickable" onClick={() => onNav("investments", i.id)}>
                      <td><div style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</div><div className="muted" style={{ fontSize: 11 }}>{i.developer || i.sub} · {i.currency}</div></td>
                      <td><span className="chip ghost">{i.kind}</span></td>
                      <td style={{ fontSize: 12 }}>{i.location}</td>
                      <td><div className="bar" style={{ width: 100 }}><i style={{ width: `${i.progress*100}%`, background: i.progress >= 1 ? "var(--positive)" : "var(--ink)" }} /></div></td>
                      <td className="num mono">{$.fmtK(i.priceTotal, i.currency)}</td>
                      <td className="num mono">{$.fmtK(i.paid, i.currency)}</td>
                      <td className="num mono">{$.fmtK(i.valueNow, i.currency)}</td>
                      <td className="num pos mono">+{gain.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Calm — editorial, single column, big text ----------
const DashboardCalm = ({ onNav, showSensitive }) => {
  const $ = useMoney();
  const nwSeries = netWorthMonthly.map((d) => d.value);
  const lastNW = nwSeries[nwSeries.length - 1] || 0;
  const priorNW = nwSeries[nwSeries.length - 2] || 0;
  const monthDelta = lastNW - priorNW;
  const calmYtdIncome = incomeMonthly.reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const calmAccrued = incomeStreams
    .filter((s) => s.status === "Deferred")
    .reduce((s, x) => s + convertFx(x.accrued, x.currency, "USD"), 0);
  // Build the "what needs attention" list from real loans + investments
  const dueSoon = [];
  loans.forEach((l) => {
    if (l.status === "Overdue" || l.status === "Due soon") {
      dueSoon.push({
        kind: "Loan",
        title: `${l.borrower} — ${l.status === "Overdue" ? "overdue" : "due " + l.nextPayment?.date}`,
        amt: l.nextPayment?.amount || (l.principal - l.paidBack),
        ccy: l.currency,
        note: l.notes || (l.status === "Overdue" ? "Reach out today." : "Reminder this week."),
        cls: l.status === "Overdue" ? "neg" : "warn",
      });
    }
  });
  investments.forEach((i) => {
    if (i.nextPayment?.amount && i.nextPayment?.date && i.nextPayment.date !== "—") {
      dueSoon.push({
        kind: (i.kind || "").includes("Real Estate") ? "Off-plan" : "Investment",
        title: `${i.name} — instalment`,
        amt: i.nextPayment.amount, ccy: i.currency,
        note: `Due ${i.nextPayment.date}.`, cls: "warn",
      });
    }
  });
  dueSoon.sort((a, b) => (a.cls === "neg" ? -1 : 1));

  return (
    <div className="fade-in" data-screen-label="01 Overview (Calm)">
      <Topbar title="Today" subtitle="Personal Portal · Calm" />
      <div className="content" style={{ maxWidth: 880 }}>
        <div style={{ textAlign: "left", padding: "24px 0 40px" }}>
          <div className="eyebrow">As of {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}, you have</div>
          <div className="tabular" style={{ marginTop: 16 }}>
            <span className="serif" style={{ fontSize: 92, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {$.fmt(lastNW)}
            </span>
          </div>
          <div style={{ marginTop: 18, fontSize: 16, color: "var(--ink-2)", maxWidth: 620 }}>
            {lastNW > 0 ? (
              <>
                {monthDelta >= 0 ? "Up " : "Down "}
                <span className={monthDelta >= 0 ? "pos" : "neg"}>{$.fmtSign(monthDelta)} this month</span>.{" "}
                {dueSoon.length > 0 && <span className="muted">{dueSoon.length} item{dueSoon.length === 1 ? "" : "s"} need{dueSoon.length === 1 ? "s" : ""} your attention this week.</span>}
              </>
            ) : (
              <span className="muted">Your portfolio is empty. Use <a style={{ cursor: "pointer", color: "var(--ink)" }} onClick={() => window.__openForm?.("investment")}>+ New</a> to record your first asset, loan, or income.</span>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <AreaChart
            data={netWorthMonthly} valueKey="value" color="var(--positive)" height={260}
            formatY={(v) => $.fmtK(v)} formatTip={(v) => $.fmt(v)}
          />
        </div>

        <div style={{ marginTop: 48 }}>
          <div className="eyebrow">This week</div>
          <h2 className="serif" style={{ fontSize: 32, margin: "8px 0 24px", letterSpacing: "-0.01em", fontWeight: 400 }}>What needs your attention.</h2>

          {dueSoon.length === 0 ? (
            <div className="muted" style={{ padding: "24px 0", fontSize: 14 }}>Nothing flagged. Add loans and investments to start seeing due dates here.</div>
          ) : (
            dueSoon.map((it, i) => (
              <div key={i} className="row gap-4" style={{ padding: "20px 0", borderTop: "1px solid var(--line)" }}>
                <div className="tag" style={{ minWidth: 80 }}>{it.kind}</div>
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>
                    {it.title}{it.amt != null && <span className="muted" style={{ fontSize: 16, marginLeft: 10, fontFamily: "var(--font-mono)" }}>{$.fmt(it.amt, it.ccy)}</span>}
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{it.note}</div>
                </div>
                <span className={`dot ${it.cls}`} />
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 48 }}>
          <div className="eyebrow">Income, the past year</div>
          <h2 className="serif" style={{ fontSize: 32, margin: "8px 0 24px", letterSpacing: "-0.01em", fontWeight: 400 }}>
            {calmYtdIncome > 0
              ? <>{$.fmt(calmYtdIncome)} in commissions and referrals{calmAccrued > 0 ? " — your salaries continue to accrue." : "."}</>
              : <span className="muted">No income recorded yet. Use Record income to start tracking.</span>}
          </h2>
          <div className="card" style={{ padding: 16 }}>
            <StackedBars
              data={incomeMonthly} keys={["commission", "referral"]}
              colors={["var(--ink)", "var(--warn)"]} height={200}
              formatY={(v) => $.fmtK(v)}
            />
          </div>
          <div className="row gap-4" style={{ marginTop: 12, fontSize: 12 }}>
            <span><span className="dot" style={{ background: "var(--ink)", marginRight: 6 }} />Brokered commission</span>
            <span><span className="dot" style={{ background: "var(--warn)", marginRight: 6 }} />Referral fees</span>
            <span className="grow" />
            {calmAccrued > 0 && <span className="muted">Salaries deferred · {$.fmtK(calmAccrued)} accrued</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
