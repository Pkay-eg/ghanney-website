// =========================================================
// Investments — list + detail. Display variations: cards / table / map
// =========================================================

const KIND_ICON = {
  "Real Estate": "building",
  "Real Estate Development": "building",
  "Business": "storefront",
  "Government Contract (SPV)": "contract",
};

const InvestmentsList = ({ onNav, display = "cards", focused }) => {
  const $ = useMoney();
  const [filter, setFilter] = useState("All");
  const kinds = ["All", "Real Estate", "Real Estate Development", "Business", "Government Contract (SPV)"];
  const filtered = filter === "All" ? investments : investments.filter((i) => i.kind === filter);

  if (focused) {
    const inv = investments.find((i) => i.id === focused);
    if (inv) return <InvestmentDetail inv={inv} onBack={() => onNav("investments")} />;
  }

  return (
    <div className="fade-in" data-screen-label="03 Investments">
      <Topbar title="Investments" subtitle="Portfolio" />
      <div className="content">
        {/* Summary band */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {(() => {
            const totalCommit = investments.reduce((s, i) => s + convertFx(i.priceTotal, i.currency, "USD"), 0);
            const totalPaid = investments.reduce((s, i) => s + convertFx(i.paid, i.currency, "USD"), 0);
            const totalNow = investments.reduce((s, i) => s + convertFx(i.valueNow, i.currency, "USD"), 0);
            const outstanding = totalCommit - totalPaid;
            return (
              <>
                <KPI eyebrow="Total committed" value={$.fmtK(totalCommit)} sub={investments.length ? `Across ${investments.length} position${investments.length === 1 ? "" : "s"}` : "No investments recorded"} />
                <KPI eyebrow="Funded to date" value={$.fmtK(totalPaid)} sub={totalCommit > 0 ? `${Math.round((totalPaid/totalCommit)*100)}% of commitments` : "—"} />
                <KPI eyebrow="Outstanding" value={$.fmtK(outstanding)} sub={outstanding > 0 ? "Remaining instalments" : "—"} delta={null} />
                <KPI eyebrow="Current value" value={$.fmtK(totalNow)} sub={totalCommit > 0 ? `${(((totalNow-totalCommit)/totalCommit) * 100 >= 0 ? "+" : "")}${(((totalNow-totalCommit)/totalCommit)*100).toFixed(1)}% unrealised` : "—"} delta={totalCommit > 0 ? ((totalNow-totalCommit)/totalCommit)*100 : null} />
              </>
            );
          })()}
        </div>

        {/* Toolbar */}
        <div className="row between" style={{ marginBottom: 16 }}>
          <div className="row gap-2 wrap">
            {kinds.map((k) => (
              <button key={k} className={`btn sm ${filter === k ? "primary" : ""}`} onClick={() => setFilter(k)}>{k}</button>
            ))}
          </div>
          <div className="row gap-2">
            <DisplayToggle value={display} onChange={(v) => window.__setInvestDisplay && window.__setInvestDisplay(v)} />
            <button className="btn sm primary" onClick={() => window.__openForm?.("investment")}><Icon name="plus" size={12} />Add investment</button>
          </div>
        </div>

        {display === "cards" && <InvestmentCards items={filtered} onOpen={(id) => onNav("investments", id)} />}
        {display === "table" && <InvestmentTable items={filtered} onOpen={(id) => onNav("investments", id)} />}
        {display === "map" && <InvestmentMap items={filtered} onOpen={(id) => onNav("investments", id)} />}
      </div>
    </div>
  );
};

const DisplayToggle = ({ value, onChange }) => (
  <div className="row" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: 2 }}>
    {[
      ["cards", "Cards"],
      ["table", "Table"],
      ["map", "Map"],
    ].map(([k, l]) => (
      <button
        key={k}
        onClick={() => onChange(k)}
        className="btn sm"
        style={{
          border: "none",
          background: value === k ? "var(--ink)" : "transparent",
          color: value === k ? "var(--surface)" : "var(--ink-2)",
          height: 28,
        }}
      >{l}</button>
    ))}
  </div>
);

const InvestmentCards = ({ items, onOpen }) => {
  const $ = useMoney();
  return (
  <div className="grid-3" style={{ gap: 18 }}>
    {items.map((i) => {
      const gain = ((i.valueNow - i.priceTotal) / i.priceTotal) * 100;
      return (
        <button
          key={i.id}
          className="card"
          style={{ textAlign: "left", padding: 0, overflow: "hidden", display: "block" }}
          onClick={() => onOpen(i.id)}
        >
          <div className="thumb xl" style={{ borderRadius: 0, height: 140 }} />
          <div style={{ padding: 18 }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <span className="chip ghost">
                <Icon name={KIND_ICON[i.kind] || "building"} size={11} />
                {i.kind.replace(" (SPV)","")}
              </span>
              <span className="tag">{i.currency}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" }}>{i.name}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{i.location}</div>

            <div className="hr" style={{ margin: "14px 0" }} />

            <div className="row between" style={{ fontSize: 12, marginBottom: 6 }}>
              <span className="muted">Funded</span>
              <span className="mono">{$.fmtK(i.paid, i.currency)} / {$.fmtK(i.priceTotal, i.currency)}</span>
            </div>
            <div className="bar"><i style={{ width: `${(i.paid/i.priceTotal)*100}%`, background: i.paid >= i.priceTotal ? "var(--positive)" : "var(--ink)" }} /></div>

            <div className="row between" style={{ marginTop: 14 }}>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Current value</div>
                <div className="serif tabular" style={{ fontSize: 22, lineHeight: 1 }}>{$.fmtK(i.valueNow, i.currency)}</div>
                {i.currency !== $.display && <div className="muted mono" style={{ fontSize: 10, marginTop: 2 }}>{formatCurrency(i.valueNow, i.currency, { compact: true })}</div>}
              </div>
              <Delta value={gain} />
            </div>

            {i.nextPayment && i.nextPayment.amount > 0 && (
              <div className="row between" style={{ marginTop: 14, padding: "10px 12px", background: "var(--canvas)", borderRadius: 8 }}>
                <div className="muted" style={{ fontSize: 11 }}>Next payment</div>
                <div style={{ fontSize: 12 }}>
                  <span className="mono">{$.fmt(i.nextPayment.amount, i.currency)}</span>
                  <span className="muted"> · {i.nextPayment.date}</span>
                </div>
              </div>
            )}
          </div>
        </button>
      );
    })}
  </div>
  );
};

const InvestmentTable = ({ items, onOpen }) => {
  const $ = useMoney();
  return (
  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
    <table className="table">
      <thead>
        <tr><th>Asset</th><th>Type</th><th>Loc.</th><th>Ccy</th><th>Progress</th><th className="num">Committed</th><th className="num">Funded</th><th className="num">Outstanding</th><th className="num">Now</th><th className="num">Gain</th><th></th></tr>
      </thead>
      <tbody>
        {items.map((i) => {
          const gain = ((i.valueNow - i.priceTotal) / i.priceTotal) * 100;
          return (
            <tr key={i.id} className="clickable" onClick={() => onOpen(i.id)}>
              <td>
                <div className="row gap-3">
                  <div className="thumb" style={{ width: 38, height: 38, borderRadius: 8 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{i.developer || i.sub}</div>
                  </div>
                </div>
              </td>
              <td><span className="chip ghost">{i.kind.replace(" (SPV)","")}</span></td>
              <td style={{ fontSize: 12 }}>{i.location}</td>
              <td><span className="chip">{i.currency}</span></td>
              <td>
                <div className="row gap-3" style={{ width: 140 }}>
                  <div className="bar" style={{ flex: 1 }}><i style={{ width: `${i.progress * 100}%`, background: i.progress >= 1 ? "var(--positive)" : "var(--ink)" }} /></div>
                  <span className="mono" style={{ fontSize: 11 }}>{Math.round(i.progress * 100)}%</span>
                </div>
              </td>
              <td className="num mono">{$.fmtK(i.priceTotal, i.currency)}</td>
              <td className="num mono">{$.fmtK(i.paid, i.currency)}</td>
              <td className="num mono">{$.fmtK(i.priceTotal - i.paid, i.currency)}</td>
              <td className="num mono">{$.fmtK(i.valueNow, i.currency)}</td>
              <td className="num pos mono">+{gain.toFixed(1)}%</td>
              <td><Icon name="chevRight" size={14} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
  );
};

const InvestmentMap = ({ items, onOpen }) => {
  const $ = useMoney();
  // Position pins on a stylized rectangle. Coordinates per item.
  const positions = {
    "apt-cantonments": { x: 0.32, y: 0.62, region: "Accra" },
    "apt-east-legon":  { x: 0.36, y: 0.58, region: "Accra" },
    "apt-airport-res": { x: 0.34, y: 0.60, region: "Accra" },
    "apt-sister-block":{ x: 0.40, y: 0.65, region: "Tema" },
    "biz-icecream":    { x: 0.37, y: 0.59, region: "Accra" },
    "spv-road":        { x: 0.45, y: 0.55, region: "E.Region" },
    "apt-dxb-jvc":     { x: 0.74, y: 0.40, region: "Dubai" },
  };

  return (
    <div className="grid-12">
      <div className="card span-8" style={{ padding: 16 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="eyebrow">Geography</div>
          <div className="row gap-2">
            <span className="chip"><span className="dot pos" />Ghana · 6</span>
            <span className="chip"><span className="dot warn" />UAE · 1</span>
          </div>
        </div>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", background: "var(--canvas)", border: "1px solid var(--line)" }}>
          {/* Decorative continent shapes */}
          <svg viewBox="0 0 800 450" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="var(--muted-2)" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="800" height="450" fill="url(#dots)" />
            {/* africa-ish */}
            <path d="M210,180 q-30,40 -10,90 q20,60 50,80 q40,20 80,0 q40,-20 50,-60 q10,-40 -10,-80 q-30,-50 -80,-50 q-50,0 -80,20 z" fill="var(--positive)" opacity="0.16" />
            {/* arabian peninsula-ish */}
            <path d="M540,150 q40,-10 70,20 q30,40 10,80 q-30,50 -70,40 q-40,-10 -50,-50 q-10,-50 40,-90 z" fill="var(--warn)" opacity="0.16" />
            <text x="280" y="280" fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)" letterSpacing="0.1em">GHANA</text>
            <text x="560" y="200" fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)" letterSpacing="0.1em">UAE</text>
          </svg>
          {items.map((i) => {
            const p = positions[i.id]; if (!p) return null;
            return (
              <button key={i.id}
                onClick={() => onOpen(i.id)}
                style={{
                  position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`,
                  transform: "translate(-50%, -100%)",
                  background: "var(--surface-2)", border: "1px solid var(--line)",
                  borderRadius: 10, padding: "8px 10px", display: "flex",
                  alignItems: "center", gap: 8, boxShadow: "var(--shadow-md)",
                  minWidth: 120,
                }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: p.region === "Dubai" ? "var(--warn)" : "var(--positive)" }} />
                <div className="col items-start" style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>{i.name.split(" — ")[0]}</div>
                  <div className="mono muted" style={{ fontSize: 10 }}>{$.fmtK(i.valueNow, i.currency)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="card span-4">
        <div className="eyebrow" style={{ marginBottom: 14 }}>By region</div>
        {[
          { region: "Accra, Ghana", count: 4, valueUsd: 770 + 252 + 348 + 62 },
          { region: "Tema, Ghana", count: 1, valueUsd: 540 },
          { region: "E. Region, Ghana", count: 1, valueUsd: 285 },
          { region: "Dubai, UAE", count: 1, valueUsd: 1620 * 0.272 },
        ].map((r) => (
          <div key={r.region} style={{ padding: "14px 0", borderBottom: "1px solid var(--line-2)" }}>
            <div className="row between">
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.region}</div>
                <div className="muted" style={{ fontSize: 11 }}>{r.count} {r.count === 1 ? "asset" : "assets"}</div>
              </div>
              <div className="mono" style={{ fontSize: 13 }}>{$.fmtK(r.valueUsd * 1000, "USD")}</div>
            </div>
            <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${Math.min(100, (r.valueUsd/1500)*100)}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Detail ----------
const InvestmentDetail = ({ inv, onBack }) => {
  const $ = useMoney();
  const gain = inv.priceTotal ? ((inv.valueNow - inv.priceTotal) / inv.priceTotal) * 100 : 0;

  // Real payments made toward this asset, most-recent first.
  const payments = (window.__investmentPayments || [])
    .filter((p) => p.investment_id === inv.id)
    .slice()
    .sort((a, b) => new Date(b.paid_on) - new Date(a.paid_on));
  const paymentsTotal = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const fmtPaidOn = (s) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  };
  const addPayment = () => window.__openForm?.("investment-payment", { defaultInvestmentId: inv.id });

  return (
    <div className="fade-in">
      <Topbar title={inv.name} subtitle={inv.kind} />
      <div className="content">
        <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>
          <Icon name="chevRight" size={12} stroke={2} /> Back to investments
        </button>

        <div className="grid-12">
          {/* hero */}
          <div className="card pad-lg span-7" style={{ padding: 0, overflow: "hidden" }}>
            <div className="thumb xl" style={{ borderRadius: 0, height: 280 }} />
            <div style={{ padding: 24 }}>
              <div className="row gap-3" style={{ marginBottom: 6 }}>
                <span className="chip ghost"><Icon name={KIND_ICON[inv.kind] || "building"} size={11} />{inv.kind}</span>
                <span className="chip">{inv.location}</span>
                <span className="chip">{inv.developer || inv.sub}</span>
              </div>
              <div className="serif" style={{ fontSize: 30, letterSpacing: "-0.01em" }}>{inv.name}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 12, maxWidth: 540 }}>{inv.notes}</div>
            </div>
          </div>

          {/* big stats */}
          <div className="card pad-lg span-5">
            <div className="eyebrow">Current value · {$.display}</div>
            <div style={{ marginTop: 10 }}><Display value={inv.valueNow} from={inv.currency} /></div>
            {inv.currency !== $.display && (
              <div className="muted mono" style={{ marginTop: 8, fontSize: 12 }}>Native: {formatCurrency(inv.valueNow, inv.currency)}</div>
            )}
            <div className="row gap-3" style={{ marginTop: 10 }}>
              <Delta value={gain} />
              <span className="muted" style={{ fontSize: 12 }}>vs committed cost basis</span>
            </div>

            <div className="hr" style={{ margin: "20px 0" }} />

            <div className="grid-2" style={{ gap: 14 }}>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Committed</div>
                <div className="mono" style={{ fontSize: 18 }}>{$.fmt(inv.priceTotal, inv.currency)}</div>
                {inv.currency !== $.display && <div className="muted mono" style={{ fontSize: 11 }}>{formatCurrency(inv.priceTotal, inv.currency)}</div>}
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Funded</div>
                <div className="mono" style={{ fontSize: 18 }}>{$.fmt(inv.paid, inv.currency)}</div>
                <div className="muted" style={{ fontSize: 11 }}>{Math.round((inv.paid/inv.priceTotal)*100)}% of total</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Outstanding</div>
                <div className="mono" style={{ fontSize: 18 }}>{$.fmt(inv.priceTotal - inv.paid, inv.currency)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Expected yield</div>
                <div style={{ fontSize: 14 }}>{inv.yieldExp}</div>
              </div>
            </div>

            <div className="hr" style={{ margin: "20px 0" }} />

            {inv.nextPayment && inv.nextPayment.amount > 0 && (
              <div className="card flat" style={{ marginTop: 0 }}>
                <div className="row between">
                  <div>
                    <div className="muted" style={{ fontSize: 11 }}>Next payment due</div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>{inv.nextPayment.date}</div>
                  </div>
                  <div className="col items-end">
                    <div className="mono" style={{ fontSize: 18 }}>{$.fmt(inv.nextPayment.amount, inv.currency)}</div>
                    {inv.currency !== $.display && <div className="muted mono" style={{ fontSize: 11 }}>{formatCurrency(inv.nextPayment.amount, inv.currency)}</div>}
                    <button className="btn sm primary" style={{ marginTop: 8 }} onClick={() => window.__openForm?.("investment-payment", { defaultInvestmentId: inv.id, defaultAmount: inv.nextPayment.amount })}>Mark paid</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Construction progress */}
          <div className="card span-12">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Construction / Payment progress</div>
                <div className="h-section" style={{ marginTop: 4 }}>{Math.round(inv.progress * 100)}% complete · handover {inv.handover || "TBD"}</div>
              </div>
              <div className="row gap-2">
                <button className="btn sm">Site updates</button>
                <button className="btn sm">Contract docs</button>
              </div>
            </div>
            <div style={{ position: "relative", padding: "30px 0 8px" }}>
              <div className="bar" style={{ height: 10 }}><i style={{ width: `${inv.progress * 100}%`, background: "var(--positive)" }} /></div>
              {["Foundation", "Structure", "Envelope", "MEP", "Finishing", "Handover"].map((stage, i, a) => {
                const pct = (i / (a.length - 1)) * 100;
                const done = inv.progress >= (i / (a.length - 1));
                return (
                  <div key={stage} style={{ position: "absolute", left: `${pct}%`, top: 0, transform: "translateX(-50%)", textAlign: "center" }}>
                    <div style={{ width: 12, height: 12, borderRadius: 999, background: done ? "var(--positive)" : "var(--surface-2)", border: "2px solid " + (done ? "var(--positive)" : "var(--line)"), margin: "0 auto" }} />
                    <div className="muted" style={{ fontSize: 10.5, marginTop: 6, whiteSpace: "nowrap" }}>{stage}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment history */}
          <div className="card span-7">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div>
                <div className="eyebrow">Payment history</div>
                {payments.length > 0 && (
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                    {payments.length} payment{payments.length > 1 ? "s" : ""} · {$.fmt(paymentsTotal, inv.currency)} logged
                  </div>
                )}
              </div>
              <button className="btn sm primary" onClick={addPayment}><Icon name="plus" size={12} />Add payment</button>
            </div>
            {payments.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: "32px 16px" }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>No payments logged yet.</div>
                <div style={{ fontSize: 12, marginBottom: 16 }}>Record the payments you've made toward this asset, with their real dates.</div>
                <button className="btn sm" onClick={addPayment}><Icon name="plus" size={12} />Add a payment</button>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Date</th><th className="num">Amount</th><th>Method</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="mono" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{fmtPaidOn(p.paid_on)}</td>
                      <td className="num mono">{$.fmt(Number(p.amount), p.currency || inv.currency)}</td>
                      <td style={{ fontSize: 12 }}>{p.method || "—"}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{p.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card span-5">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="eyebrow">Site updates</div>
              <button className="btn sm" onClick={() => window.__openForm?.("site-update", { defaultInvestmentId: inv.id })}>
                <Icon name="plus" size={12} />Log update
              </button>
            </div>
            <div className="col">
              {(window.siteUpdates?.[inv.id] || []).slice(0, 5).map((u) => (
                <div key={u.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{u.milestone}</div>
                    <span className={`chip ${u.status === "verified" ? "pos" : "warn"}`}>
                      {u.status === "verified" && <Icon name="check" size={10} stroke={2.4} />}
                      {u.status}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 8 }}>{u.notes}</div>
                  <div className="row between" style={{ fontSize: 11 }}>
                    <span className="muted mono" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{u.date} · {u.reporter}</span>
                    {u.photos > 0 && (
                      <span className="row gap-2 muted">
                        <Icon name="eye" size={11} />{u.photos} photo{u.photos !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {u.photos > 0 && (
                    <div className="row gap-2" style={{ marginTop: 8 }}>
                      {Array.from({ length: Math.min(4, u.photos) }).map((_, i) => (
                        <div key={i} className="thumb" style={{
                          width: 56, height: 42, borderRadius: 6,
                          flexShrink: 0,
                          background: `repeating-linear-gradient(${45 + i * 30}deg, var(--line) 0, var(--line) 1px, transparent 1px, transparent 6px), var(--line-2)`,
                        }} />
                      ))}
                      {u.photos > 4 && (
                        <div style={{
                          width: 56, height: 42, borderRadius: 6,
                          background: "var(--canvas)", border: "1px solid var(--line)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, color: "var(--muted)",
                        }}>+{u.photos - 4}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {(!window.siteUpdates?.[inv.id] || window.siteUpdates[inv.id].length === 0) && (
                <div className="muted" style={{ fontSize: 12.5, padding: "16px 0", textAlign: "center" }}>
                  No site updates yet. Click <strong>Log update</strong> to record one.
                </div>
              )}
            </div>
          </div>

          {/* Linked contracts */}
          <div className="card span-12">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="eyebrow">Linked contracts</div>
              <button className="btn sm" onClick={() => window.__openForm?.("contract", { defaultLinkedTo: { kind: "investment", id: inv.id } })}>
                <Icon name="plus" size={12} />Attach contract
              </button>
            </div>
            <div className="grid-3">
              {(window.contracts || []).filter((c) => c.linkedTo?.id === inv.id).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onBack && onBack()}
                  className="card"
                  style={{ textAlign: "left", padding: 14, background: "var(--surface-2)" }}
                >
                  <div className="row gap-3">
                    <div style={{
                      width: 32, height: 40, borderRadius: 3,
                      background: "var(--canvas)", border: "1px solid var(--line)",
                      display: "flex", alignItems: "flex-end", justifyContent: "center",
                      padding: "3px 1px", flexShrink: 0,
                      fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
                      fontWeight: 600,
                    }}>PDF</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{c.type} · {c.signedDate || "unsigned"}</div>
                    </div>
                  </div>
                </button>
              ))}
              {(window.contracts || []).filter((c) => c.linkedTo?.id === inv.id).length === 0 && (
                <div className="muted" style={{ fontSize: 12.5, padding: "16px 0" }}>
                  No contracts attached yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.InvestmentsList = InvestmentsList;
