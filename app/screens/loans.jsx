// =========================================================
// Loans receivable
// =========================================================

const LoansScreen = ({ onNav, focused }) => {
  const $ = useMoney();
  const [tab, setTab] = useState("All");
  const [openId, setOpenId] = useState(focused || null);

  const tabs = ["All", "Active", "Overdue", "Due soon", "Family"];
  const filtered = loans.filter((l) => {
    if (tab === "All") return true;
    if (tab === "Active") return l.status === "On track";
    return l.status === tab;
  });

  // All totals normalized to USD then displayed in active currency
  const totalOutUsd = loans.reduce((s, l) => s + convertFx(l.principal - l.paidBack, l.currency || "USD", "USD"), 0);
  const totalPrincipalUsd = loans.reduce((s, l) => s + convertFx(l.principal, l.currency || "USD", "USD"), 0);
  const totalRepaidUsd = loans.reduce((s, l) => s + convertFx(l.paidBack, l.currency || "USD", "USD"), 0);
  const weightedRate = loans.reduce((s, l) => s + (convertFx(l.principal, l.currency || "USD", "USD") * l.interest), 0) / totalPrincipalUsd;

  if (openId) {
    const loan = loans.find((l) => l.id === openId);
    if (loan) return <LoanDetail loan={loan} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="fade-in" data-screen-label="05 Loans">
      <Topbar title="Loans receivable" subtitle="Borrowers" />
      <div className="content">
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <KPI eyebrow="Outstanding" value={$.fmtK(totalOutUsd)} sub={`Across ${loans.length} borrowers`} />
          <KPI eyebrow="Total principal" value={$.fmtK(totalPrincipalUsd)} sub="Lifetime issued" />
          <KPI eyebrow="Repaid to date" value={$.fmtK(totalRepaidUsd)} sub={`${Math.round((totalRepaidUsd/totalPrincipalUsd)*100)}% recovered`} delta={null} />
          <KPI eyebrow="Weighted rate" value={(weightedRate * 100).toFixed(1) + "%"} sub="Blended APR (paid loans)" delta={null} />
        </div>

        <div className="row between" style={{ marginBottom: 16 }}>
          <div className="row gap-2">
            {tabs.map((t) => (
              <button key={t} className={`btn sm ${tab === t ? "primary" : ""}`} onClick={() => setTab(t)}>
                {t}
                <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                  {t === "All" ? loans.length : loans.filter((l) => t === "Active" ? l.status === "On track" : l.status === t).length}
                </span>
              </button>
            ))}
          </div>
          <div className="row gap-2">
            <button className="btn sm"><Icon name="download" size={12} />Export CSV</button>
            <button className="btn sm primary" onClick={() => window.__openForm?.("loan")}><Icon name="plus" size={12} />Record loan</button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Type</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Age</th>
                <th className="num">Principal</th>
                <th>Repayment</th>
                <th className="num">Outstanding</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const remain = l.principal - l.paidBack;
                const ccy = l.currency || "USD";
                const age = monthsBetween(l.issued, "May 26, 2026");
                return (
                  <tr key={l.id} className="clickable" onClick={() => setOpenId(l.id)}>
                    <td>
                      <div className="row gap-3">
                        <div className="avatar">{l.borrower.split(" ").map((s)=>s[0]).slice(0,2).join("")}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{l.borrower}</div>
                          <div className="muted" style={{ fontSize: 11 }}>{l.interest > 0 ? `${(l.interest * 100).toFixed(0)}% APR` : "Interest free"} · {ccy}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip ghost">{l.type}</span></td>
                    <td style={{ fontSize: 12 }}>{l.issued}</td>
                    <td style={{ fontSize: 12 }}>{l.due}</td>
                    <td className="mono muted" style={{ fontSize: 12 }}>{age} mo</td>
                    <td className="num">
                      <div className="mono">{$.fmt(l.principal, ccy)}</div>
                      {ccy !== $.display && <div className="muted mono" style={{ fontSize: 10 }}>{formatCurrency(l.principal, ccy)}</div>}
                    </td>
                    <td>
                      <div style={{ width: 140 }}>
                        <div className="row between" style={{ fontSize: 11, marginBottom: 4 }}>
                          <span className="muted mono">{$.fmt(l.paidBack, ccy)}</span>
                          <span className="mono">{Math.round((l.paidBack/l.principal)*100)}%</span>
                        </div>
                        <div className={`bar ${l.status === "Overdue" ? "neg" : "pos"}`}>
                          <i style={{ width: `${(l.paidBack/l.principal)*100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="num mono">{$.fmt(remain, ccy)}</td>
                    <td><Status label={l.status} /></td>
                    <td><Icon name="chevRight" size={14} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const monthsBetween = (start, end) => {
  const s = new Date(start), e = new Date(end);
  return Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24 * 30)));
};

const LoanDetail = ({ loan, onBack }) => {
  const $ = useMoney();
  const remain = loan.principal - loan.paidBack;
  const ccy = loan.currency || "USD";
  const age = monthsBetween(loan.issued, "May 26, 2026");
  return (
    <div className="fade-in">
      <Topbar title={loan.borrower} subtitle="Loan detail" />
      <div className="content">
        <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>
          <Icon name="chevRight" size={12} stroke={2} /> Back to loans
        </button>

        <div className="grid-12">
          <div className="card pad-lg span-7">
            <div className="row gap-3" style={{ marginBottom: 18 }}>
              <div className="avatar lg">{loan.borrower.split(" ").map((s)=>s[0]).slice(0,2).join("")}</div>
              <div>
                <div className="serif" style={{ fontSize: 26, letterSpacing: "-0.01em" }}>{loan.borrower}</div>
                <div className="row gap-2" style={{ marginTop: 6 }}>
                  <span className="chip ghost">{loan.type}</span>
                  <Status label={loan.status} />
                  <span className="chip ghost">{loan.interest > 0 ? `${(loan.interest * 100).toFixed(0)}% APR` : "Interest free"}</span>
                  <span className="chip ghost">{ccy}</span>
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <div className="card flat">
                <div className="muted" style={{ fontSize: 11 }}>Outstanding</div>
                <div className="serif tabular" style={{ fontSize: 34, lineHeight: 1, marginTop: 6 }}>{$.fmt(remain, ccy)}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>of {$.fmt(loan.principal, ccy)} principal{ccy !== $.display && ` · ${formatCurrency(loan.principal, ccy)}`}</div>
              </div>
              <div className="card flat">
                <div className="muted" style={{ fontSize: 11 }}>Repaid</div>
                <div className="serif tabular" style={{ fontSize: 34, lineHeight: 1, marginTop: 6 }}>{$.fmt(loan.paidBack, ccy)}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{Math.round((loan.paidBack/loan.principal)*100)}% of principal</div>
              </div>
            </div>

            <div className="hr" style={{ margin: "20px 0" }} />

            <div className="grid-2" style={{ gap: 18 }}>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Issued</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{loan.issued}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Due</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{loan.due}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Age</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{age} months</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Next payment</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>
                  {loan.nextPayment.amount > 0
                    ? <>{$.fmt(loan.nextPayment.amount, ccy)} <span className="muted">· {loan.nextPayment.date}</span></>
                    : "—"}
                </div>
              </div>
            </div>

            <div className="hr" style={{ margin: "20px 0" }} />

            <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>{loan.notes}</div>

            <div className="row gap-2" style={{ marginTop: 20 }}>
              <button className="btn primary" onClick={() => window.__openForm?.("payment", { defaultLoanId: loan.id })}><Icon name="plus" size={14} />Log payment</button>
              <button className="btn"><Icon name="bell" size={14} />Send reminder</button>
              <button className="btn">Edit terms</button>
            </div>
          </div>

          <div className="card span-5">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Payment history</div>
            {loan.history.length === 0 && (
              <div className="muted" style={{ fontSize: 12, padding: 12 }}>No payments recorded yet.</div>
            )}
            {loan.history.map((h, i) => (
              <div key={i} className="row between" style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)" }}>
                <div className="row gap-3">
                  <span className="dot pos" />
                  <div>
                    <div style={{ fontSize: 13 }}>{h.d}</div>
                    <div className="muted" style={{ fontSize: 11 }}>Bank transfer · received</div>
                  </div>
                </div>
                <div className="mono pos" style={{ fontSize: 13 }}>+{$.fmt(h.a, ccy)}</div>
              </div>
            ))}

            <div className="hr" style={{ margin: "16px 0" }} />

            <div className="eyebrow" style={{ marginBottom: 12 }}>Upcoming</div>
            {loan.nextPayment.amount > 0 ? (
              <div className="row between" style={{ padding: "12px 0" }}>
                <div className="row gap-3">
                  <span className="dot warn" />
                  <div>
                    <div style={{ fontSize: 13 }}>{loan.nextPayment.date}</div>
                    <div className="muted" style={{ fontSize: 11 }}>Expected payment</div>
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 13 }}>{$.fmt(loan.nextPayment.amount, ccy)}</div>
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 12 }}>No scheduled payments.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

window.LoansScreen = LoansScreen;
