// =========================================================
// Contracts page — list, filters, detail panel
// (constants CONTRACT_TYPES / STATUS_CHIP / daysUntil live in data-extras.jsx)
// =========================================================

const ContractsScreen = ({ onNav, focused }) => {
  const $ = useMoney();
  const [filter, setFilter] = React.useState("All");
  const [openId, setOpenId] = React.useState(focused || null);

  const filtered = filter === "All" ? contracts :
    filter === "Expiring" ? contracts.filter((c) => { const d = daysUntil(c.expiresDate); return d != null && d < 90; }) :
    filter === "Real Estate" ? contracts.filter((c) => ["Purchase Agreement", "Lease", "Construction"].includes(c.type)) :
    filter === "Financial" ? contracts.filter((c) => ["Loan Agreement", "Insurance", "Employment"].includes(c.type)) :
    filter === "Corporate" ? contracts.filter((c) => ["JV / Partnership", "Shareholders Agreement", "SPV Agreement", "LOI"].includes(c.type)) :
    contracts;

  const totalValueUsd = contracts.reduce((s, c) => s + convertFx(c.value, c.currency, "USD"), 0);
  const activeCount = contracts.filter((c) => c.status === "Active").length;
  const expiringCount = contracts.filter((c) => { const d = daysUntil(c.expiresDate); return d != null && d < 90; }).length;
  const pendingCount = contracts.filter((c) => c.status !== "Active").length;

  if (openId) {
    const ct = contracts.find((c) => c.id === openId);
    if (ct) return <ContractDetail contract={ct} onBack={() => setOpenId(null)} onNav={onNav} />;
  }

  return (
    <div className="fade-in" data-screen-label="08 Contracts">
      <Topbar title="Contracts" subtitle="Document vault" />
      <div className="content">
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <KPI eyebrow="Total contract value" value={$.fmtK(totalValueUsd)} sub={contracts.length ? `Across ${contracts.length} document${contracts.length === 1 ? "" : "s"}` : "No contracts yet"} />
          <KPI eyebrow="Active" value={String(activeCount)} sub={activeCount ? "In force right now" : "—"} delta={null} />
          <KPI eyebrow="Expiring · 90 days" value={String(expiringCount)} sub={expiringCount ? "Renew or terminate" : "—"} delta={null} />
          <KPI eyebrow="Pending / drafts" value={String(pendingCount)} sub={pendingCount ? "Need attention" : "—"} delta={null} />
        </div>

        <div className="row between" style={{ marginBottom: 16, gap: 14, flexWrap: "wrap" }}>
          <div className="row gap-2 wrap">
            {["All", "Real Estate", "Financial", "Corporate", "Expiring"].map((k) => (
              <button key={k} className={`btn sm ${filter === k ? "primary" : ""}`} onClick={() => setFilter(k)}>{k}</button>
            ))}
          </div>
          <div className="row gap-2">
            <button className="btn sm"><Icon name="filter" size={12} />Type</button>
            <button className="btn sm"><Icon name="download" size={12} />Export</button>
            <button className="btn sm primary" onClick={() => window.__openForm?.("contract")}><Icon name="plus" size={12} />Add contract</button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Contract</th>
                <th>Type</th>
                <th>Parties</th>
                <th>Linked to</th>
                <th className="num">Value</th>
                <th>Signed</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const days = daysUntil(c.expiresDate);
                return (
                  <tr key={c.id} className="clickable" onClick={() => setOpenId(c.id)}>
                    <td>
                      <div className="row gap-3">
                        <div style={{
                          width: 38, height: 46, borderRadius: 4,
                          background: "var(--canvas)", border: "1px solid var(--line)",
                          display: "flex", alignItems: "flex-end", justifyContent: "center",
                          padding: "4px 2px", flexShrink: 0,
                          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)",
                          fontWeight: 600, letterSpacing: "0.04em",
                        }}>
                          PDF
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>{c.name}</div>
                          <div className="muted mono" style={{ fontSize: 11 }}>{c.fileName} · {c.pages}p · {c.fileSize}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip ghost">{c.type}</span></td>
                    <td style={{ fontSize: 12 }}>
                      <div>{c.parties[0]}</div>
                      <div className="muted">{c.parties.slice(1).join(" · ")}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                        {c.linkedTo?.label || "—"}
                      </div>
                      {c.linkedTo && <div className="muted mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.linkedTo.kind}</div>}
                    </td>
                    <td className="num">
                      <div className="mono">{c.value ? $.fmt(c.value, c.currency) : "—"}</div>
                      {c.currency !== $.display && c.value > 0 && <div className="muted mono" style={{ fontSize: 10 }}>{formatCurrency(c.value, c.currency)}</div>}
                    </td>
                    <td style={{ fontSize: 12 }}>{c.signedDate || <span className="muted">Unsigned</span>}</td>
                    <td style={{ fontSize: 12 }}>
                      <div>{c.expiresDate}</div>
                      {days != null && days < 90 && days > 0 && <div className="warn mono" style={{ fontSize: 10, color: "#8a6618" }}>in {days}d</div>}
                      {days != null && days <= 0 && <div className="neg mono" style={{ fontSize: 10 }}>overdue</div>}
                    </td>
                    <td><span className={`chip ${STATUS_CHIP[c.status] || ""}`}>{c.status}</span></td>
                    <td><Icon name="chevRight" size={14} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 32 }} className="grid-2">
          <div className="card">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div className="eyebrow">Expiring soon</div>
              <Icon name="bell" size={14} />
            </div>
            {contracts
              .filter((c) => { const d = daysUntil(c.expiresDate); return d != null && d < 180; })
              .sort((a, b) => daysUntil(a.expiresDate) - daysUntil(b.expiresDate))
              .slice(0, 4)
              .map((c) => {
                const d = daysUntil(c.expiresDate);
                return (
                  <div key={c.id} className="row between" style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>{c.name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{c.type} · expires {c.expiresDate}</div>
                    </div>
                    <span className="chip warn">{d}d</span>
                  </div>
                );
              })}
          </div>

          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 14 }}>By type</div>
            {Object.entries(
              contracts.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} style={{ padding: "10px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>{type}</span>
                    <span className="mono muted" style={{ fontSize: 12 }}>{count}</span>
                  </div>
                  <div className="bar"><i style={{ width: `${(count/contracts.length)*100}%`, background: "var(--ink)" }} /></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Contract detail ----------
const ContractDetail = ({ contract: c, onBack, onNav }) => {
  const $ = useMoney();
  const days = daysUntil(c.expiresDate);

  return (
    <div className="fade-in">
      <Topbar title={c.name} subtitle="Contract" />
      <div className="content">
        <button className="btn ghost sm" onClick={onBack} style={{ marginBottom: 16 }}>
          <Icon name="chevRight" size={12} stroke={2} /> Back to contracts
        </button>

        <div className="grid-12">
          {/* Header card */}
          <div className="card pad-lg span-8">
            <div className="row gap-3" style={{ marginBottom: 6 }}>
              <span className="chip ghost">{c.type}</span>
              <span className={`chip ${STATUS_CHIP[c.status] || ""}`}>{c.status}</span>
              {c.attachments > 0 && <span className="chip ghost"><Icon name="contract" size={11} />{c.attachments} attachment{c.attachments > 1 ? "s" : ""}</span>}
            </div>
            <div className="serif" style={{ fontSize: 26, letterSpacing: "-0.01em", lineHeight: 1.15, marginTop: 4 }}>{c.name}</div>

            <div className="hr" style={{ margin: "20px 0" }} />

            <div className="grid-2" style={{ gap: 18 }}>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Parties</div>
                {c.parties.map((p, i) => (
                  <div key={i} style={{ fontSize: 13.5, marginTop: i === 0 ? 6 : 4 }}>
                    {i === 0 ? <strong>{p}</strong> : p}
                  </div>
                ))}
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Linked to</div>
                {c.linkedTo ? (
                  <button
                    onClick={() => onNav?.(c.linkedTo.kind === "investment" ? "investments" : c.linkedTo.kind === "loan" ? "loans" : c.linkedTo.kind === "project" ? "projects" : "income", c.linkedTo.id)}
                    style={{ textAlign: "left", marginTop: 6 }}
                  >
                    <div style={{ fontSize: 13.5, color: "var(--ink)" }}>{c.linkedTo.label}</div>
                    <div className="muted mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{c.linkedTo.kind} <Icon name="arrowRight" size={9} stroke={2.4} /></div>
                  </button>
                ) : <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Not linked</div>}
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Signed</div>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>{c.signedDate || "Not yet signed"}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Effective</div>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>{c.effectiveDate}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Expires / completion</div>
                <div className="row gap-2" style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 13.5 }}>{c.expiresDate}</span>
                  {days != null && days > 0 && days < 90 && <span className="chip warn">{days}d left</span>}
                  {days != null && days <= 0 && <span className="chip neg">overdue</span>}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Value</div>
                <div className="mono" style={{ fontSize: 17, marginTop: 6 }}>{c.value ? $.fmt(c.value, c.currency) : "—"}</div>
                {c.currency !== $.display && c.value > 0 && <div className="muted mono" style={{ fontSize: 11 }}>{formatCurrency(c.value, c.currency)}</div>}
              </div>
            </div>

            {c.notes && (
              <>
                <div className="hr" style={{ margin: "20px 0" }} />
                <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, lineHeight: 1.55 }}>{c.notes}</div>
              </>
            )}
          </div>

          {/* File preview card */}
          <div className="card pad-lg span-4">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Document</div>
            <div style={{
              width: "100%",
              aspectRatio: "8.5/11",
              background: "var(--canvas)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              padding: 16,
            }}>
              <div className="mono muted" style={{ fontSize: 8, marginBottom: 8 }}>PAGE 1 / {c.pages}</div>
              {/* fake doc lines */}
              <div style={{ height: 8, background: "var(--ink)", width: "60%", borderRadius: 2, marginBottom: 12 }} />
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ height: 3, background: "var(--line)", width: `${75 + (i % 4) * 5}%`, borderRadius: 2, marginBottom: 6 }} />
              ))}
              <div style={{ height: 3, background: "transparent", marginBottom: 4 }} />
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} style={{ height: 3, background: "var(--line)", width: `${68 + (i % 3) * 8}%`, borderRadius: 2, marginBottom: 6 }} />
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <div style={{ width: 50, height: 18, border: "1px solid var(--muted-2)", borderRadius: 2 }} />
                <div style={{ width: 50, height: 18, border: "1px solid var(--muted-2)", borderRadius: 2 }} />
              </div>
              <div className="mono muted" style={{ fontSize: 8, marginTop: 6, textAlign: "center" }}>signed · {c.signedDate || "unsigned"}</div>
            </div>

            <div className="row between" style={{ marginTop: 14, fontSize: 12 }}>
              <span className="muted">{c.fileSize} · {c.pages} pages</span>
              <span className="mono muted">v{c.attachments + 1}</span>
            </div>

            <div className="col gap-2" style={{ marginTop: 14 }}>
              <button className="btn primary"><Icon name="download" size={14} />Download PDF</button>
              <button className="btn"><Icon name="eye" size={14} />Preview full</button>
              <button className="btn"><Icon name="plus" size={14} />Upload new version</button>
            </div>
          </div>

          {/* Timeline */}
          <div className="card span-8">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Activity</div>
            {[
              ...(c.attachments > 0 ? [{ d: c.uploadedAt, msg: `${c.attachments} attachment${c.attachments > 1 ? "s" : ""} added`, who: c.uploadedBy }] : []),
              { d: c.uploadedAt, msg: "Uploaded to portal", who: c.uploadedBy },
              ...(c.signedDate ? [{ d: c.signedDate, msg: "Signed by all parties", who: "All parties" }] : [{ d: "—", msg: "Awaiting signatures", who: "Pending" }]),
              { d: c.effectiveDate, msg: "Contract effective date", who: "—" },
            ].map((a, i) => (
              <div key={i} className="row gap-3" style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)" }}>
                <span className="dot pos" style={{ marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{a.msg}</div>
                  <div className="muted mono" style={{ fontSize: 10.5, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{a.d} · {a.who}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card span-4">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Counsel</div>
            <div className="row gap-3" style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)" }}>
              <div className="avatar">KA</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Kwame Asante</div>
                <div className="muted" style={{ fontSize: 11 }}>Asante Law Group · Lawyer</div>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginTop: 12 }}>
              Reviewed and approved by counsel. Kwame has access to this contract via the team portal.
            </div>
            <button className="btn sm" style={{ marginTop: 14, width: "100%" }}><Icon name="bell" size={12} />Notify counsel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ContractsScreen = ContractsScreen;
