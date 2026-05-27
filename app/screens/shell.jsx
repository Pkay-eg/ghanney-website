// =========================================================
// App shell — sidebar / topnav / rail variants + topbar
// =========================================================

const NAV = [
  { id: "overview",   label: "Overview",    icon: "overview" },
  { id: "income",     label: "Income",      icon: "income"   },
  { id: "investments",label: "Investments", icon: "invest"   },
  { id: "trading",    label: "Trading",     icon: "trading"  },
  { id: "loans",      label: "Loans",       icon: "loans"    },
  { id: "projects",   label: "Projects",    icon: "projects" },
  { id: "contracts",  label: "Contracts",   icon: "contract" },
  { id: "networth",   label: "Net Worth",   icon: "networth" },
];

// Compute the right-aligned meta badge for each nav item from the
// currently loaded data. Returns "" (hidden) when there's nothing
// meaningful to show — keeps the sidebar honest with empty portfolios.
const navMeta = (id) => {
  try {
    if (id === "income") {
      const ytd = (window.incomeMonthly || []).reduce((s, m) => s + (m.commission || 0) + (m.referral || 0), 0);
      if (!ytd) return "";
      return "+$" + (ytd >= 1000 ? (ytd / 1000).toFixed(1) + "K" : ytd.toFixed(0));
    }
    if (id === "investments") return (window.investments || []).length || "";
    if (id === "loans")       return (window.loans || []).length || "";
    if (id === "projects")    return (window.projects || []).length || "";
    if (id === "contracts")   return (window.contracts || []).length || "";
    if (id === "trading") {
      const pos = window.tradingPositions || [];
      const cost = pos.reduce((s, p) => s + p.qty * p.avg, 0);
      const value = pos.reduce((s, p) => s + p.qty * p.last, 0);
      if (!cost) return "";
      const pct = ((value - cost) / cost) * 100;
      return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
    }
  } catch (e) {}
  return "";
};

const Sidebar = ({ active, onNav, mode }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="word">ghanney</span>
        <span className="dot-after">.</span>
      </div>

      <div className="nav-section">Portfolio</div>
      {NAV.map((n) => {
        const meta = navMeta(n.id);
        return (
          <button
            key={n.id}
            className={`nav-item ${active === n.id ? "active" : ""}`}
            onClick={() => onNav(n.id)}
            title={n.label}
          >
            <span className="ic"><Icon name={n.icon} size={16} /></span>
            <span>{n.label}</span>
            {meta !== "" && meta !== 0 && <span className="meta">{meta}</span>}
          </button>
        );
      })}

      <div className="nav-section">Tools</div>
      <button className={`nav-item ${active === "team" ? "active" : ""}`} onClick={() => onNav("team")}>
        <span className="ic"><Icon name="user" size={16} /></span>
        <span>Team</span>
        <span className="meta">{(window.team || []).length}</span>
      </button>
      <button className="nav-item">
        <span className="ic"><Icon name="calendar" size={16} /></span>
        <span>Calendar</span>
      </button>
      <button className="nav-item">
        <span className="ic"><Icon name="download" size={16} /></span>
        <span>Statements</span>
      </button>
      <button className="nav-item">
        <span className="ic"><Icon name="settings" size={16} /></span>
        <span>Settings</span>
      </button>

      <div style={{ flex: 1 }} />

      <div style={{
        borderTop: "1px solid var(--line)",
        marginTop: 12,
        paddingTop: 12,
        display: mode === "rail" ? "flex" : "flex",
        gap: 10,
        alignItems: "center",
        padding: mode === "rail" ? "12px 0 0" : "12px 8px 0",
      }}>
        {(() => {
          const me = (window.__myInfo?.() || {});
          return (
            <>
              <div className="avatar">{me.initials || "U"}</div>
              {mode !== "rail" && (
                <div className="col" style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.name || "Member"}</div>
                  <div className="muted" style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.role || "Owner"}{me.location ? ` · ${me.location}` : ""}</div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </aside>
  );
};

const TopNav = ({ active, onNav }) => (
  <div className="topnav">
    <div className="brand">ghanney<span style={{ color: "var(--positive)" }}>.</span></div>
    <div className="nav-tabs">
      {NAV.map((n) => (
        <button
          key={n.id}
          className={`nav-tab ${active === n.id ? "active" : ""}`}
          onClick={() => onNav(n.id)}
        >{n.label}</button>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    <div className="search" style={{ width: 240 }}>
      <Icon name="search" size={14} />
      <input placeholder="Jump to…" />
      <span className="kbd">⌘K</span>
    </div>
    <button className="btn icon" title="Notifications"><Icon name="bell" size={16} /></button>
    <div className="avatar">{(window.__myInfo?.() || {}).initials || "U"}</div>
  </div>
);

const Topbar = ({ title, subtitle, actions }) => {
  const [qaOpen, setQaOpen] = React.useState(false);
  return (
    <div className="topbar">
      <div className="col">
        <div className="eyebrow">{subtitle || "Personal Portal"}</div>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{title}</div>
      </div>
      <div className="row gap-3">
        <CurrencySwitch size="sm" />
        <div className="search">
          <Icon name="search" size={14} />
          <input placeholder="Search assets, loans, transactions…" />
          <span className="kbd">⌘K</span>
        </div>
        <button className="btn icon" title="Notifications">
          <Icon name="bell" size={16} />
        </button>
        <div style={{ position: "relative" }}>
          <button
            className="btn primary"
            data-qa-trigger
            onClick={() => setQaOpen((s) => !s)}
          >
            <Icon name="plus" size={14} />New
            <Icon name="chevDown" size={11} stroke={2.2} />
          </button>
          <QuickAddMenu
            open={qaOpen}
            onClose={() => setQaOpen(false)}
            onPick={(type) => {
              setQaOpen(false);
              window.__openForm?.(type);
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Command palette overlay (cosmetic — opens via ⌘K)
const CommandPalette = ({ open, onClose, onNav }) => {
  const items = [
    { label: "Go to Overview", action: () => onNav("overview"), kind: "Nav" },
    { label: "Go to Investments", action: () => onNav("investments"), kind: "Nav" },
    { label: "Go to Loans", action: () => onNav("loans"), kind: "Nav" },
    { label: "Go to Trading", action: () => onNav("trading"), kind: "Nav" },
    { label: "Log a loan repayment", action: () => onClose(), kind: "Action" },
    { label: "Record commission earned", action: () => onClose(), kind: "Action" },
    { label: "Add new investment", action: () => onClose(), kind: "Action" },
    { label: "Export statements (PDF)", action: () => onClose(), kind: "Action" },
  ];
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,17,14,0.32)",
        zIndex: 100, display: "flex", justifyContent: "center", paddingTop: 120,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560, background: "var(--surface-2)", border: "1px solid var(--line)",
          borderRadius: 14, boxShadow: "0 24px 60px -20px rgba(0,0,0,0.3)", overflow: "hidden",
        }}
      >
        <div className="row gap-3" style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <Icon name="search" size={16} />
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command, page, or asset…"
            style={{ border: "none", outline: "none", flex: 1, background: "none", fontSize: 14 }}
          />
          <span className="kbd">esc</span>
        </div>
        <div style={{ maxHeight: 360, overflow: "auto", padding: 6 }}>
          {filtered.map((it, i) => (
            <button
              key={i}
              onClick={it.action}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 8, fontSize: 13,
                alignItems: "center",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas)"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}
            >
              <span>{it.label}</span>
              <span className="tag">{it.kind}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="muted" style={{ padding: 16, fontSize: 13, textAlign: "center" }}>No matches.</div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Sidebar, TopNav, Topbar, CommandPalette, NAV });
