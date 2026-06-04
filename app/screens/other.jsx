// =========================================================
// Income / Projects / Net Worth screens
// =========================================================

// ---------- Income ----------
const IncomeScreen = () => {
  const $ = useMoney();
  const ytd = incomeMonthly.reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const accruedUsd = incomeStreams
    .filter((s) => s.status === "Deferred")
    .reduce((s, x) => s + convertFx(x.accrued, x.currency, "USD"), 0);
  const last3 = incomeMonthly.slice(-3).reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const prev3 = incomeMonthly.slice(-6, -3).reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
  const avg = last3 / 3;
  const ytdDelta = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : null;
  const accruedSpark = accruedUsd
    ? Array.from({ length: 12 }, (_, i) => Math.round(accruedUsd * (i + 1) / 12))
    : null;
  const inflowSpark = ytd ? incomeMonthly.map((m) => (m.commission || 0) + (m.referral || 0)) : null;
  const subStreams = incomeStreams.filter((s) => s.status === "Deferred").length;
  const deferredSub = subStreams > 0 ? `${subStreams} deferred salary stream${subStreams === 1 ? "" : "s"}` : "No deferred salaries";

  return (
    <div className="fade-in" data-screen-label="02 Income">
      <Topbar title="Income" subtitle="Earnings" />
      <div className="content">
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <KPI eyebrow="YTD earned · live" value={$.fmtK(ytd)} sub={ytd ? "Commissions + referrals · 12 mo" : "No income recorded yet"} delta={ytdDelta} sparkData={inflowSpark} sparkColor="var(--positive)" />
          <KPI eyebrow="3-mo avg" value={$.fmtK(avg)} sub={last3 ? "Trailing monthly" : "—"} />
          <KPI eyebrow="Salaries · accrued" value={$.fmtK(accruedUsd)} sub={deferredSub} sparkData={accruedSpark} sparkColor="var(--warn)" />
          <KPI eyebrow="Total income · 12mo" value={$.fmtK(ytd+accruedUsd)} sub={ytd + accruedUsd > 0 ? "If salaries were paid" : "—"} delta={null} />
        </div>

        <div className="grid-12">
          <div className="card span-8">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Monthly inflow</div>
                <div className="h-section" style={{ marginTop: 4 }}>Commission + Referrals</div>
              </div>
              <div className="row gap-2">
                <button className="btn sm">USD</button>
                <button className="btn sm">Monthly</button>
                <button className="btn sm"><Icon name="download" size={12} />Export</button>
              </div>
            </div>
            <StackedBars
              data={incomeMonthly} keys={["commission", "referral"]}
              colors={["var(--ink)", "var(--warn)"]} height={240}
              formatY={(v) => "$" + (v/1000).toFixed(0) + "K"}
            />
            <div className="row gap-4" style={{ marginTop: 12, fontSize: 12 }}>
              <span><span className="dot" style={{ background: "var(--ink)", marginRight: 6 }} />Brokered commission</span>
              <span><span className="dot" style={{ background: "var(--warn)", marginRight: 6 }} />Referral fees</span>
            </div>
          </div>

          <div className="card span-4">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Salaries — deferred</div>
            {incomeStreams.filter((s) => s.status === "Deferred").map((s) => {
              const pct = s.deferredMonths ? Math.min(100, Math.round(s.deferredMonths * 100 / 14)) : 0;
              return (
                <div key={s.id} className="card flat" style={{ marginBottom: 12 }}>
                  <div className="row between">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{s.label.replace(/^Salary[ —-]+/, "")}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{formatCurrency(s.gross, s.currency)} / mo · {s.deferredMonths || 0} mo deferred</div>
                    </div>
                    <Status label="Deferred" />
                  </div>
                  <div className="hr" style={{ margin: "12px 0" }} />
                  <div className="row between">
                    <span className="muted" style={{ fontSize: 11 }}>Accrued</span>
                    <span className="mono">{$.fmt(s.accrued, s.currency)}</span>
                  </div>
                  {s.currency !== $.display && (
                    <div className="row between" style={{ marginTop: 2 }}>
                      <span className="muted" style={{ fontSize: 10 }}>Native</span>
                      <span className="mono muted" style={{ fontSize: 10 }}>{formatCurrency(s.accrued, s.currency)}</span>
                    </div>
                  )}
                  <div className="bar warn" style={{ marginTop: 10 }}><i style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}

            {incomeStreams.filter((s) => s.status === "Deferred").length === 0 && (
              <div className="card flat" style={{ textAlign: "center", padding: 28, color: "var(--muted)", fontSize: 12 }}>
                No deferred salaries.<br />
                <button className="btn sm primary" onClick={() => window.__openForm?.("income")} style={{ marginTop: 12 }}>
                  Add income stream
                </button>
              </div>
            )}

            {incomeStreams.filter((s) => s.status === "Deferred").length > 0 && (
              <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                Salaries deferred. Review payout schedule with Finance.
              </div>
            )}
          </div>

          <div className="card span-12">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="h-section">Income streams</div>
              <button className="btn sm primary" onClick={() => window.__openForm?.("income")}><Icon name="plus" size={12} />Record income</button>
            </div>
            <table className="table">
              <thead>
                <tr><th>Source</th><th>Type</th><th>Native ccy</th><th>Cadence</th><th>Status</th><th className="num">Current</th><th className="num">YTD / Accrued</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {incomeStreams.map((s) => (
                  <tr key={s.id}>
                    <td><div style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</div></td>
                    <td><span className="chip ghost">{s.type}</span></td>
                    <td><span className="chip">{s.currency}</span></td>
                    <td style={{ fontSize: 12 }}>{s.cadence}</td>
                    <td><Status label={s.status} /></td>
                    <td className="num">
                      <div className="mono">{$.fmt(s.gross, s.currency)}</div>
                      {s.currency !== $.display && <div className="muted mono" style={{ fontSize: 10 }}>{formatCurrency(s.gross, s.currency)}</div>}
                    </td>
                    <td className="num">
                      <div className="mono">{$.fmt(s.ytd || s.accrued || 0, s.currency)}</div>
                      {s.currency !== $.display && <div className="muted mono" style={{ fontSize: 10 }}>{formatCurrency(s.ytd || s.accrued || 0, s.currency)}</div>}
                    </td>
                    <td className="muted" style={{ fontSize: 12, maxWidth: 300 }}>{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card span-12">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="h-section">Recent transactions</div>
              <div className="row gap-2">
                <button className="btn sm"><Icon name="filter" size={12} />Filter</button>
                <button className="btn sm"><Icon name="download" size={12} />Export</button>
              </div>
            </div>
            {(() => {
              const records = window.incomeRecords || [];
              if (records.length === 0) {
                return (
                  <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)" }}>
                    <div style={{ fontSize: 14, marginBottom: 8 }}>No transactions yet.</div>
                    <div style={{ fontSize: 12, marginBottom: 16 }}>Record your first commission, referral or distribution.</div>
                    <button className="btn primary" onClick={() => window.__openForm?.("income")}>
                      <Icon name="plus" size={12} />Record income
                    </button>
                  </div>
                );
              }
              const rows = records.slice(0, 12).map((r) => ({
                date: new Date(r.received_on).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
                desc: r.note || `${r.type} from ${r.source}`,
                type: r.type, who: r.source, amt: Number(r.amount), ccy: r.currency || "USD",
              }));
              return (
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Type</th><th>Source</th><th className="num">Amount</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: 12 }}>{r.date}</td>
                        <td>{r.desc}</td>
                        <td><span className="chip ghost">{r.type}</span></td>
                        <td style={{ fontSize: 12 }}>{r.who}</td>
                        <td className="num mono pos">+{formatCurrency(r.amt, r.ccy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Projects ----------
const ProjectsScreen = () => {
  return (
    <div className="fade-in" data-screen-label="06 Projects">
      <Topbar title="Projects" subtitle="Active work" />
      <div className="content">
        <div className="grid-3" style={{ gap: 18 }}>
          {projects.map((p) => (
            <div key={p.id} className="card pad-lg">
              <div className="row between" style={{ marginBottom: 12 }}>
                <Status label={p.status} />
                <button className="btn ghost sm"><Icon name="dots" size={14} /></button>
              </div>
              <div className="serif" style={{ fontSize: 24, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{p.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{p.note}</div>

              <div className="hr" style={{ margin: "18px 0" }} />

              <div className="row between" style={{ fontSize: 12 }}>
                <span className="muted">Owner</span>
                <span>{p.owner}</span>
              </div>
              <div className="row between" style={{ fontSize: 12, marginTop: 8 }}>
                <span className="muted">Deadline</span>
                <span className="mono">{p.deadline}</span>
              </div>

              <div className="hr" style={{ margin: "16px 0" }} />

              <div className="row between" style={{ marginBottom: 6, fontSize: 12 }}>
                <span className="muted">Progress</span>
                <span className="mono">{Math.round(p.progress * 100)}%</span>
              </div>
              <div className="bar"><i style={{ width: `${p.progress*100}%`, background: "var(--positive)" }} /></div>

              <div className="row gap-2" style={{ marginTop: 18 }}>
                <button className="btn sm">Open</button>
                <button className="btn sm ghost">Notes</button>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button className="card pad-lg" onClick={() => window.__openForm?.("project")} style={{
            border: "1.5px dashed var(--line)",
            background: "transparent",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            minHeight: 280,
            cursor: "pointer",
            color: "var(--muted)",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, border: "1.5px dashed var(--line)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="plus" size={18} />
            </div>
            <div style={{ fontSize: 14 }}>New project</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Track work, deadlines, partners</div>
          </button>
        </div>

        <div className="card" style={{ marginTop: 24 }}>
          <div className="row between" style={{ marginBottom: 14 }}>
            <div className="h-section">Project timeline</div>
            <div className="row gap-2">
              <button className="btn sm">Month</button>
              <button className="btn sm primary">Quarter</button>
              <button className="btn sm">Year</button>
            </div>
          </div>
          <div style={{ position: "relative", padding: "12px 0" }}>
            {/* gantt rows */}
            {projects.map((p, i) => (
              <div key={p.id} className="row gap-3" style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)" }}>
                <div style={{ width: 240, minWidth: 240 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{p.owner}</div>
                </div>
                <div style={{ flex: 1, position: "relative", height: 28, background: "var(--canvas)", borderRadius: 8 }}>
                  <div style={{
                    position: "absolute",
                    left: `${[5, 0, 25, 15][i]}%`,
                    width: `${[50, 70, 35, 60][i]}%`,
                    top: 4, bottom: 4,
                    background: ["var(--positive)", "var(--accent)", "var(--warn)", "var(--ink)"][i],
                    borderRadius: 6,
                    display: "flex", alignItems: "center", padding: "0 10px",
                    color: "var(--surface)", fontSize: 11,
                  }}>
                    {Math.round(p.progress * 100)}% · {p.deadline}
                  </div>
                </div>
              </div>
            ))}
            <div className="row" style={{ marginTop: 8, fontSize: 10, color: "var(--muted)" }}>
              {["Q2 26", "Q3 26", "Q4 26", "Q1 27", "Q2 27"].map((q) => (
                <div key={q} className="mono" style={{ flex: 1, textAlign: "center" }}>{q}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Net Worth ----------
const NETWORTH_GROWTH_LABEL = { "3M": "3-month growth", "6M": "6-month growth", "1Y": "12-month growth", "2Y": "24-month growth", "YTD": "year-to-date growth", "All": "all-time growth" };

const NetWorthScreen = () => {
  const $ = useMoney();
  const [nwPeriod, setNwPeriod] = React.useState("1Y");
  const nwChartData = sliceSeriesByPeriod(netWorthMonthly, nwPeriod);
  const last = netWorthMonthly[netWorthMonthly.length - 1]?.value || 0;
  const first = nwChartData[0]?.value || 0;
  const totalGrowth = last - first;
  const growthPct = first > 0 ? ((last - first) / first) * 100 : null;

  const hasData = (window.netWorthBreakdown || []).length > 0
    || (window.investments || []).length > 0
    || (window.loans || []).length > 0;

  if (!hasData) {
    return (
      <div className="fade-in" data-screen-label="07 Net Worth">
        <Topbar title="Net worth" subtitle="Balance sheet" />
        <div className="content">
          <div className="card pad-lg" style={{ textAlign: "center", padding: "64px 24px" }}>
            <div className="serif" style={{ fontSize: 24, marginBottom: 8 }}>Nothing tracked yet</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 22 }}>
              Add an investment, loan or holding and your balance sheet will build here.
            </div>
            <div className="row gap-3 center">
              <button className="btn primary" onClick={() => window.__openForm?.("investment")}><Icon name="plus" size={12} />Add investment</button>
              <button className="btn" onClick={() => window.__openForm?.("loan")}>Record a loan</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" data-screen-label="07 Net Worth">
      <Topbar title="Net worth" subtitle="Balance sheet" />
      <div className="content">
        <div className="grid-12">
          <div className="card pad-lg span-12">
            <div className="row between">
              <div>
                <div className="eyebrow">Net worth · {$.display}</div>
                <div style={{ marginTop: 10 }}><Display value={last} from="USD" /></div>
                <div className="row gap-3" style={{ marginTop: 12 }}>
                  <Delta value={growthPct} />
                  <span className="muted" style={{ fontSize: 12.5 }}>{NETWORTH_GROWTH_LABEL[nwPeriod] || "growth"} · </span>
                  <span className={`mono ${totalGrowth >= 0 ? "pos" : "neg"}`}>{totalGrowth >= 0 ? "+" : ""}{$.fmt(totalGrowth)}</span>
                </div>
              </div>
              <PeriodTabs periods={["3M", "6M", "1Y", "2Y", "All"]} value={nwPeriod} onChange={setNwPeriod} />
            </div>
            <div style={{ marginTop: 18 }}>
              <AreaChart data={nwChartData} valueKey="value" color="var(--positive)" height={260}
                formatY={(v) => $.fmtK(v)} formatTip={(v) => $.fmt(v)} />
            </div>
          </div>

          <div className="card pad-lg span-5">
            <div className="eyebrow" style={{ marginBottom: 18 }}>Assets vs Liabilities</div>
            <div className="row gap-4" style={{ alignItems: "center" }}>
              <Donut data={netWorthBreakdown} size={180} thickness={22} />
              <div className="col" style={{ flex: 1 }}>
                <div className="serif tabular" style={{ fontSize: 32, lineHeight: 1 }}>{$.fmtK(last)}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Total assets</div>
                <div className="hr" style={{ margin: "16px 0" }} />
                <div className="row between" style={{ fontSize: 13 }}>
                  <span>Liabilities</span>
                  <span className="mono">{$.fmt(0)}</span>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>No long-term debt</div>
              </div>
            </div>
          </div>

          <div className="card span-7">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Breakdown</div>
            {netWorthBreakdown.map((b) => (
              <div key={b.label} style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)" }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div className="row gap-3">
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: b.color }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{b.label}</span>
                  </div>
                  <div className="row gap-3">
                    <span className="muted mono" style={{ fontSize: 11 }}>{((b.value/last)*100).toFixed(1)}%</span>
                    <span className="mono" style={{ fontSize: 13 }}>{$.fmt(b.value)}</span>
                  </div>
                </div>
                <div className="bar"><i style={{ width: `${(b.value/last)*100}%`, background: b.color }} /></div>
              </div>
            ))}
          </div>

          {(() => {
            // Currency exposure derived from your real holdings: investment
            // values + outstanding loan principal, grouped by native currency.
            const exp = {};
            (window.investments || []).forEach((i) => {
              const c = i.currency || "USD";
              exp[c] = (exp[c] || 0) + (Number(i.valueNow) || 0);
            });
            (window.loans || []).forEach((l) => {
              const c = l.currency || "USD";
              exp[c] = (exp[c] || 0) + Math.max(0, (Number(l.principal) || 0) - (Number(l.paidBack) || 0));
            });
            const entries = Object.entries(exp).filter(([, v]) => v > 0);
            if (entries.length === 0) return null;
            const totalUsd = entries.reduce((s, [c, v]) => s + convertFx(v, c, "USD"), 0);
            entries.sort((a, b) => convertFx(b[1], b[0], "USD") - convertFx(a[1], a[0], "USD"));
            return (
              <div className="card span-6">
                <div className="eyebrow" style={{ marginBottom: 14 }}>Currency exposure</div>
                <div className="col gap-4">
                  {entries.map(([ccy, amt]) => {
                    const share = totalUsd ? Math.round((convertFx(amt, ccy, "USD") / totalUsd) * 100) : 0;
                    return (
                      <div key={ccy}>
                        <div className="row between" style={{ marginBottom: 8 }}>
                          <div className="row gap-3">
                            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--font-mono)" }}>{ccy}</span>
                            <span className="muted" style={{ fontSize: 11 }}>denominated assets</span>
                          </div>
                          <div className="col items-end">
                            <span className="mono" style={{ fontSize: 13 }}>{$.fmt(amt, ccy)}</span>
                            {ccy !== $.display && <span className="muted mono" style={{ fontSize: 10 }}>{formatCurrency(amt, ccy)}</span>}
                          </div>
                        </div>
                        <div className="bar"><i style={{ width: `${share}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { IncomeScreen, ProjectsScreen, NetWorthScreen });
