// =========================================================
// Form primitives — SidePanel, Field, Input, Select, MoneyInput,
// Segmented, Switch, Stepper, Choice, Success state, QuickAddMenu
// =========================================================

// ---------- SidePanel ----------
const SidePanel = ({ open, onClose, title, subtitle, children, footer, wide = false, header = null }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return ReactDOM.createPortal(
    <>
      <div className="scrim" onClick={onClose} />
      <aside className={`panel ${wide ? "wide" : ""}`} role="dialog" aria-modal="true">
        <div className="panel-head">
          <div className="top">
            <span className="eyebrow">Add to portfolio</span>
            <button className="btn ghost icon" onClick={onClose} aria-label="Close">
              <Icon name="x" size={16} />
            </button>
          </div>
          <h2>{title}</h2>
          {subtitle && <div className="sub">{subtitle}</div>}
          {header}
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-foot">{footer}</div>}
      </aside>
    </>,
    document.body
  );
};

// ---------- Field ----------
const Field = ({ label, hint, required, error, children }) => (
  <div className="form-field">
    {label && (
      <label>
        {label}{required && <span className="req">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <div className="hint">{hint}</div>}
    {error && <div className="err">{error}</div>}
  </div>
);

// ---------- Input ----------
const Input = ({ value, onChange, placeholder, type = "text", error, autoFocus, prefix, suffix, ...rest }) => {
  if (prefix || suffix) {
    return (
      <div style={{ position: "relative" }}>
        {prefix && (
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 13, pointerEvents: "none", fontFamily: "var(--font-mono)" }}>{prefix}</div>
        )}
        <input
          className={`input ${error ? "err" : ""}`}
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{ paddingLeft: prefix ? 28 : undefined, paddingRight: suffix ? 36 : undefined }}
          {...rest}
        />
        {suffix && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 12, pointerEvents: "none" }}>{suffix}</div>
        )}
      </div>
    );
  }
  return (
    <input
      className={`input ${error ? "err" : ""}`}
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      {...rest}
    />
  );
};

// ---------- BeneficiaryPicker ----------
// A name input that doubles as a combobox over saved beneficiaries.
// Type to create a new one, or pick an existing name to reuse its details.
// `onPick(beneficiary)` fires when an existing entry is selected so the
// parent form can auto-fill the rest of the transaction.
const BeneficiaryPicker = ({ value, onChange, onPick, placeholder, autoFocus, error, filter }) => {
  const [open, setOpen] = React.useState(false);
  const all = React.useMemo(() => {
    const l = (window.bens?.list?.() || []);
    return filter ? l.filter(filter) : l;
  }, [open, value]);

  const q = (value || "").toLowerCase().trim();
  const matches = q ? all.filter((b) => b.name.toLowerCase().includes(q)) : all;
  const exactSaved = !!(value && window.bens?.find?.(value));
  // Hide the menu once the typed value exactly matches the only suggestion.
  const onlyExact = matches.length === 1 && matches[0].name.toLowerCase() === q;
  const showMenu = open && matches.length > 0 && !onlyExact;

  const initials = (n) =>
    (n || "").trim().split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  const pick = (b) => {
    onChange(b.name);
    onPick?.(b);
    setOpen(false);
  };

  return (
    <div className="ben-field">
      <Input
        value={value}
        onChange={(v) => { onChange(v); setOpen(true); }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        error={error}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
        style={exactSaved ? { paddingRight: 86 } : undefined}
      />
      {exactSaved && !open && (
        <span className="ben-badge"><Icon name="check" size={10} stroke={2.6} />Saved</span>
      )}
      {showMenu && (
        <div className="ben-menu">
          <div className="ben-menu-label">Saved beneficiaries · pick to reuse</div>
          {matches.slice(0, 7).map((b) => (
            <button
              key={b.id}
              type="button"
              className="ben-opt"
              onMouseDown={(e) => { e.preventDefault(); pick(b); }}
            >
              <span className="avatar sm">{initials(b.name)}</span>
              <span className="col" style={{ minWidth: 0 }}>
                <span className="ben-name">{b.name}</span>
                <span className="ben-sub">{[b.type, b.location, b.org].filter(Boolean).join(" · ") || "Beneficiary"}</span>
              </span>
              {b.usedCount > 1 && <span className="tag">×{b.usedCount}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- TextArea ----------
const TextArea = ({ value, onChange, placeholder, rows = 3, error }) => (
  <textarea
    className={`textarea ${error ? "err" : ""}`}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
  />
);

// ---------- Select ----------
const Select = ({ value, onChange, options, placeholder = "Select…", error }) => {
  return (
    <div style={{ position: "relative" }}>
      <select
        className={`input ${error ? "err" : ""}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ appearance: "none", paddingRight: 32, cursor: "pointer", color: value ? "var(--ink)" : "var(--muted)" }}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {options.map((o) => {
          const v = typeof o === "object" ? o.value : o;
          const l = typeof o === "object" ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "inline-flex" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </span>
    </div>
  );
};

// ---------- MoneyInput — amount + currency picker ----------
const MoneyInput = ({ amount, currency = "USD", onAmountChange, onCurrencyChange, currencies = ["USD", "GHS", "AED"], error }) => {
  return (
    <div className="money-input" style={error ? { borderColor: "var(--negative)" } : null}>
      <div style={{ position: "relative", minWidth: 0 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: 13, pointerEvents: "none", fontFamily: "var(--font-mono)", display: "inline-flex", alignItems: "center" }}>
          {currency === "AED" ? <AedMark style={{ fontSize: 14 }} /> : SYMBOLS[currency].trim()}
        </span>
        <input
          className="amount"
          type="text"
          inputMode="decimal"
          value={amount ?? ""}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.\-]/g, "");
            onAmountChange(v);
          }}
          placeholder="0"
          style={{ paddingLeft: 32, textAlign: "left" }}
        />
      </div>
      <div className="ccy-pick">
        {currencies.map((c) => (
          <button key={c} type="button" className={currency === c ? "on" : ""} onClick={() => onCurrencyChange(c)}>{c}</button>
        ))}
      </div>
    </div>
  );
};

// ---------- Segmented ----------
const Segmented = ({ value, onChange, options, cols }) => (
  <div className="segmented" style={{ gridTemplateColumns: `repeat(${cols || options.length}, 1fr)` }}>
    {options.map((o) => {
      const v = typeof o === "object" ? o.value : o;
      const l = typeof o === "object" ? o.label : o;
      return (
        <button key={v} type="button" className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>
      );
    })}
  </div>
);

// ---------- Switch / Toggle ----------
const Switch = ({ value, onChange }) => (
  <button type="button" className={`switch ${value ? "on" : ""}`} onClick={() => onChange(!value)} role="switch" aria-checked={value}>
    <span className="knob" />
  </button>
);

// ---------- Stepper ----------
const Stepper = ({ steps, current }) => (
  <div className="stepper">
    {steps.map((label, i) => (
      <div key={i} className={`step ${i === current ? "active" : i < current ? "done" : ""}`}>
        <span className="pip">{i < current ? <Icon name="check" size={12} stroke={2.6} /> : i + 1}</span>
        <span className="label">{label}</span>
      </div>
    ))}
  </div>
);

// ---------- Choice tiles ----------
const ChoiceGrid = ({ value, onChange, options }) => (
  <div className="choice-grid">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        className={`choice ${value === o.value ? "on" : ""}`}
        onClick={() => onChange(o.value)}
      >
        <div className="icon"><Icon name={o.icon} size={16} /></div>
        <div className="name">{o.name}</div>
        <div className="desc">{o.desc}</div>
      </button>
    ))}
  </div>
);

// ---------- Section ----------
const FormSection = ({ title, children }) => (
  <div className="form-section">
    {title && <div className="form-section-title">{title}</div>}
    {children}
  </div>
);

// ---------- Payment calculator preview (loan / instalment flows) ----------
const PaymentCalcCard = ({
  calc,
  currency = "USD",
  title = "Calculated from your terms",
  onApply,
  appliedAmount,
  variant = "loan", // "loan" | "instalment"
}) => {
  if (!calc) return null;
  const fmt = (n) => formatCurrency(n, currency);
  const isLoan = variant === "loan";
  const suggested = isLoan ? calc.periodPayment : calc.perInstalment;
  const isApplied =
    appliedAmount != null &&
    appliedAmount !== "" &&
    Math.abs(parseFloat(appliedAmount) - suggested) < 0.02;

  return (
    <div
      className="card"
      style={{
        padding: 14,
        marginBottom: 12,
        background: "var(--canvas)",
        border: "1px dashed var(--line-2)",
      }}
    >
      <div className="row between" style={{ marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <span className="eyebrow">{title}</span>
        {onApply && (
          <button
            type="button"
            className={`btn sm ${isApplied ? "" : "primary"}`}
            onClick={() => onApply(String(suggested))}
          >
            {isApplied ? (
              <>
                <Icon name="check" size={12} /> Applied
              </>
            ) : (
              <>Use {fmt(suggested)}</>
            )}
          </button>
        )}
      </div>

      <div className="col gap-2" style={{ fontSize: 12.5 }}>
        <div className="row between">
          <span className="muted">{isLoan ? calc.periodLabel : "Per instalment"}</span>
          <span className="mono" style={{ fontWeight: 500 }}>{fmt(suggested)}</span>
        </div>
        {isLoan && calc.plan !== "balloon" && (
          <>
            <div className="row between">
              <span className="muted">Payments</span>
              <span className="mono">{calc.paymentCount} × {fmt(calc.periodPayment)}</span>
            </div>
            <div className="row between">
              <span className="muted">Total interest</span>
              <span className="mono">{fmt(calc.totalInterest)}</span>
            </div>
            <div className="row between">
              <span className="muted">Total repayment</span>
              <span className="mono">{fmt(calc.totalRepayment)}</span>
            </div>
          </>
        )}
        {isLoan && calc.plan === "balloon" && (
          <>
            <div className="row between">
              <span className="muted">Principal</span>
              <span className="mono">{fmt(calc.principal)}</span>
            </div>
            <div className="row between">
              <span className="muted">Interest to maturity</span>
              <span className="mono">{fmt(calc.totalInterest)}</span>
            </div>
            <div className="row between">
              <span className="muted">Due at maturity</span>
              <span className="mono" style={{ fontWeight: 500 }}>{fmt(calc.totalRepayment)}</span>
            </div>
          </>
        )}
        {!isLoan && (
          <>
            <div className="row between">
              <span className="muted">Outstanding balance</span>
              <span className="mono">{fmt(calc.total)}</span>
            </div>
            <div className="row between">
              <span className="muted">Instalments</span>
              <span className="mono">{calc.count} equal payments</span>
            </div>
            {calc.lastInstalment !== calc.perInstalment && (
              <div className="muted" style={{ fontSize: 11 }}>
                Last instalment may be {fmt(calc.lastInstalment)} after rounding.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ---------- Mode pill ----------
const ModePill = ({ value, onChange, options }) => (
  <div className="mode-pill">
    {options.map((o) => (
      <button key={o.value} type="button" className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

// ---------- Success card ----------
const SuccessCard = ({ title, message, onClose, onAddAnother }) => (
  <div className="success-card">
    <div className="check"><Icon name="check" size={28} stroke={2.4} /></div>
    <h3>{title}</h3>
    <p>{message}</p>
    <div className="row gap-3 center">
      {onAddAnother && <button className="btn" onClick={onAddAnother}>Add another</button>}
      <button className="btn primary" onClick={onClose}>Done</button>
    </div>
  </div>
);

// ---------- Quick Add menu ----------
const QuickAddMenu = ({ open, onClose, onPick }) => {
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!e.target.closest(".qa-menu") && !e.target.closest("[data-qa-trigger]")) onClose();
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="qa-menu">
      <div className="qa-section">Add</div>
      <button className="qa-item" onClick={() => onPick("investment")}>
        <span className="ic"><Icon name="building" size={14} /></span>
        <span style={{ flex: 1 }}>
          New investment
          <div className="meta">Real estate, business, SPV</div>
        </span>
        <span className="kbd">I</span>
      </button>
      <button className="qa-item" onClick={() => onPick("loan")}>
        <span className="ic"><Icon name="loans" size={14} /></span>
        <span style={{ flex: 1 }}>
          Issue loan
          <div className="meta">Lend to individual or business</div>
        </span>
        <span className="kbd">L</span>
      </button>
      <button className="qa-item" onClick={() => onPick("trade")}>
        <span className="ic"><Icon name="trading" size={14} /></span>
        <span style={{ flex: 1 }}>
          New trade
          <div className="meta">Buy or sell a position</div>
        </span>
        <span className="kbd">T</span>
      </button>
      <button className="qa-item" onClick={() => onPick("project")}>
        <span className="ic"><Icon name="projects" size={14} /></span>
        <span style={{ flex: 1 }}>
          New project
          <div className="meta">Track ongoing work</div>
        </span>
        <span className="kbd">P</span>
      </button>
      <button className="qa-item" onClick={() => onPick("contract")}>
        <span className="ic"><Icon name="contract" size={14} /></span>
        <span style={{ flex: 1 }}>
          Add contract
          <div className="meta">Upload and link to an asset</div>
        </span>
        <span className="kbd">C</span>
      </button>
      <button className="qa-item" onClick={() => onPick("team")}>
        <span className="ic"><Icon name="user" size={14} /></span>
        <span style={{ flex: 1 }}>
          Invite team member
          <div className="meta">PA, lawyer, accountant…</div>
        </span>
      </button>
      <div className="qa-divider" />
      <div className="qa-section">Record</div>
      <button className="qa-item" onClick={() => onPick("income")}>
        <span className="ic"><Icon name="income" size={14} /></span>
        <span style={{ flex: 1 }}>
          Income received
          <div className="meta">Salary, commission, referral, distribution</div>
        </span>
      </button>
      <button className="qa-item" onClick={() => onPick("payment")}>
        <span className="ic"><Icon name="check" size={14} /></span>
        <span style={{ flex: 1 }}>
          Loan repayment
          <div className="meta">Mark a payment as received</div>
        </span>
      </button>
      <button className="qa-item" onClick={() => onPick("investment-payment")}>
        <span className="ic"><Icon name="invest" size={14} /></span>
        <span style={{ flex: 1 }}>
          Investment payment
          <div className="meta">Log a payment made toward an asset</div>
        </span>
      </button>
      <button className="qa-item" onClick={() => onPick("site-update")}>
        <span className="ic"><Icon name="building" size={14} /></span>
        <span style={{ flex: 1 }}>
          Site update
          <div className="meta">Construction progress, photos, milestones</div>
        </span>
      </button>
      <div className="qa-divider" />
      <div className="qa-section">Connect</div>
      <button className="qa-item" onClick={() => onPick("integration")}>
        <span className="ic"><Icon name="link" size={14} /></span>
        <span style={{ flex: 1 }}>
          Link account
          <div className="meta">Binance, Kraken, Coinbase, IBKR…</div>
        </span>
      </button>
    </div>
  );
};

// ---------- File upload (mock) ----------
const FileUpload = ({ files, onChange, accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg", multiple = false, hint }) => {
  const inputRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const addFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const meta = Array.from(fileList).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      addedAt: new Date().toISOString(),
    }));
    onChange(multiple ? [...(files || []), ...meta] : meta);
  };

  const fmt = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `1.5px dashed ${dragOver ? "var(--ink)" : "var(--line)"}`,
          background: dragOver ? "var(--canvas)" : "var(--surface-2)",
          borderRadius: 10,
          padding: 22,
          textAlign: "center",
          cursor: "pointer",
          transition: "all 120ms",
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 999, background: "var(--canvas)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
        }}>
          <Icon name="download" size={16} stroke={1.8} />
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>Drag a file here or click to browse</div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{hint || "PDF, DOC, DOCX up to 20MB"}</div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {(files || []).length > 0 && (
        <div className="col gap-2" style={{ marginTop: 12 }}>
          {(files || []).map((f, i) => (
            <div key={i} className="row gap-3" style={{
              padding: "10px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
            }}>
              <div style={{
                width: 28, height: 34, borderRadius: 3,
                background: "var(--canvas)", border: "1px solid var(--line-2)",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
                padding: "2px 1px", flexShrink: 0,
                fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)",
                fontWeight: 600,
              }}>
                {(f.name.split(".").pop() || "").toUpperCase().slice(0, 3)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                <div className="muted mono" style={{ fontSize: 10.5 }}>{fmt(f.size)} · added now</div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange((files || []).filter((_, idx) => idx !== i)); }}
                className="btn ghost icon"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  SidePanel, Field, Input, BeneficiaryPicker, TextArea, Select, MoneyInput,
  Segmented, Switch, Stepper, ChoiceGrid, FormSection, ModePill, PaymentCalcCard,
  SuccessCard, QuickAddMenu, FileUpload,
});
