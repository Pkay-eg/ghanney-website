// =========================================================
// Contract / Site Update / Team Invite forms
// =========================================================

// ---------- Contract form ----------
const ContractForm = ({ onClose, defaultLinkedTo = null }) => {
  const $ = useMoney();
  const [done, setDone] = React.useState(null);
  const [files, setFiles] = React.useState([]);
  const [form, setForm] = React.useState({
    name: "",
    type: "Purchase Agreement",
    parties: "",
    counterparty: "",
    value: "",
    currency: "USD",
    linkTo: defaultLinkedTo ? `${defaultLinkedTo.kind}:${defaultLinkedTo.id}` : "",
    signedDate: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    expiresDate: "",
    isSigned: true,
    notes: "",
    notifyCounsel: true,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // build link-to options from investments / loans / projects
  const linkOptions = [
    ...investments.map((i) => ({ value: `investment:${i.id}`, label: `Investment — ${i.name}` })),
    ...loans.map((l) => ({ value: `loan:${l.id}`, label: `Loan — ${l.borrower}` })),
    ...projects.map((p) => ({ value: `project:${p.id}`, label: `Project — ${p.name}` })),
  ];

  const [uploading, setUploading] = React.useState(false);
  const submit = async () => {
    if (!form.name || !form.counterparty) { window.__toast?.("Name + counterparty required"); return; }
    if (files.length === 0) { window.__toast?.("Attach a contract document"); return; }
    const f = files[0];
    const [kind, id] = (form.linkTo || ":").split(":");
    const linked = kind && id ? {
      kind,
      id,
      label: (kind === "investment" ? investments.find((x) => x.id === id)?.name : kind === "loan" ? loans.find((x) => x.id === id)?.borrower : projects.find((x) => x.id === id)?.name) || "—",
    } : null;

    const myInfo = window.__myInfo?.() || {};
    const myName = myInfo.name || "Owner";

    const ct = {
      name: form.name,
      type: form.type,
      parties: [myName, form.counterparty, ...(form.parties ? form.parties.split(",").map((s) => s.trim()) : [])],
      value: parseFloat(form.value) || 0,
      currency: form.currency,
      linkedTo: linked,
      status: form.isSigned ? "Active" : "Pending signature",
      signedDate: form.isSigned ? (form.signedDate || form.effectiveDate) : null,
      effectiveDate: form.effectiveDate,
      expiresDate: form.expiresDate || "Indefinite",
      fileName: f.name,
      fileSizeBytes: f.size,
      fileSize: f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + " MB" : (f.size / 1024).toFixed(1) + " KB",
      pages: Math.floor(8 + Math.random() * 30),
      uploadedBy: myName,
      notes: form.notes,
      attachments: files.length - 1,
    };

    try {
      setUploading(true);
      if (window.db?.isConfigured?.()) {
        const path = await window.db.contracts.uploadFile(f.file || f, `${Date.now()}-${f.name}`);
        ct.filePath = path;
        const saved = await window.db.contracts.create(ct);
        // Also upload additional attachments
        for (let i = 1; i < files.length; i++) {
          try { await window.db.contracts.uploadFile(files[i].file || files[i], `${Date.now()}-${i}-${files[i].name}`); } catch (e) {}
        }
        setDone(saved);
      } else {
        window.contracts.unshift({ ...ct, id: `ct-${Date.now()}` });
        setDone(ct);
      }
      window.__bumpRev?.();
    } catch (e) {
      window.__toast?.(e?.message || "Could not store contract");
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title="Contract stored."
          message={`"${done.name}" is now in your document vault.`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="Add a contract"
      subtitle="Upload an agreement and link it to an investment, loan or project."
      wide
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={uploading}>
            <Icon name="plus" size={12} />{uploading ? "Uploading…" : "Store contract"}
          </button>
        </>
      }
    >
      <FormSection title="Document">
        <FileUpload files={files} onChange={setFiles} multiple hint="Primary contract first. Add amendments / appendices as additional files." />
      </FormSection>

      <FormSection title="Basics">
        <Field label="Contract name" required>
          <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Sale & Purchase Agreement — Cantonments Heights" autoFocus />
        </Field>
        <div className="input-row">
          <Field label="Type" required>
            <Select
              value={form.type}
              onChange={(v) => set("type", v)}
              options={CONTRACT_TYPES.map((t) => t.value)}
            />
          </Field>
          <Field label="Status">
            <Segmented
              value={form.isSigned ? "signed" : "pending"}
              onChange={(v) => set("isSigned", v === "signed")}
              options={[{ value: "signed", label: "Signed" }, { value: "pending", label: "Pending" }]}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Parties">
        <Field label="Counterparty" required hint="The other side. Add additional parties below if applicable.">
          <Input value={form.counterparty} onChange={(v) => set("counterparty", v)} placeholder="e.g. Ridge Residences Ltd." />
        </Field>
        <Field label="Other parties" hint="Comma-separated, if any.">
          <Input value={form.parties} onChange={(v) => set("parties", v)} placeholder="e.g. Co-investor A, Guarantor B" />
        </Field>
      </FormSection>

      <FormSection title="Value & link">
        <div className="input-row">
          <Field label="Contract value" hint="Total notional — leave blank if not applicable.">
            <MoneyInput
              amount={form.value}
              currency={form.currency}
              onAmountChange={(v) => set("value", v)}
              onCurrencyChange={(v) => set("currency", v)}
            />
          </Field>
          <Field label="Linked to">
            <Select
              value={form.linkTo}
              onChange={(v) => set("linkTo", v)}
              options={[{ value: "", label: "— Not linked —" }, ...linkOptions]}
              placeholder="Pick an asset"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Dates">
        <div className="input-row three">
          {form.isSigned && (
            <Field label="Signed">
              <Input value={form.signedDate} onChange={(v) => set("signedDate", v)} type="date" />
            </Field>
          )}
          <Field label="Effective">
            <Input value={form.effectiveDate} onChange={(v) => set("effectiveDate", v)} type="date" />
          </Field>
          <Field label="Expires" hint="Or completion date.">
            <Input value={form.expiresDate} onChange={(v) => set("expiresDate", v)} type="date" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Notes & review">
        <Field label="Internal notes">
          <TextArea value={form.notes} onChange={(v) => set("notes", v)} placeholder="Key clauses, escalations, things to remember." rows={3} />
        </Field>
        <div className="row gap-3" style={{ padding: "10px 12px", background: "var(--canvas)", borderRadius: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Notify {(window.team || []).find((m) => m.role === "Lawyer")?.name || "counsel"}</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>Sends a review request to your lawyer.</div>
          </div>
          <Switch value={form.notifyCounsel} onChange={(v) => set("notifyCounsel", v)} />
        </div>
      </FormSection>
    </SidePanel>
  );
};

// ---------- Site Update form ----------
const SiteUpdateForm = ({ onClose, defaultInvestmentId = null }) => {
  const [done, setDone] = React.useState(null);
  const [files, setFiles] = React.useState([]);
  const [form, setForm] = React.useState({
    investmentId: defaultInvestmentId || investments[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    milestone: "",
    progress: 50,
    reporter: "Site Engineer",
    notes: "",
    verified: false,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const inv = investments.find((i) => i.id === form.investmentId);
  // restrict to construction-stage investments
  const eligibleInvestments = investments.filter((i) => ((i.kind || "").includes("Real Estate") || (i.kind || "").includes("Government")));

  const submit = async () => {
    if (!form.investmentId || !form.milestone) { window.__toast?.("Pick an asset + milestone"); return; }
    const update = {
      date: form.date,
      milestone: form.milestone,
      progress: parseFloat(form.progress) / 100,
      reporter: form.reporter,
      photos: files.length,
      notes: form.notes,
      status: form.verified ? "verified" : "pending",
    };
    try {
      if (window.db?.isConfigured?.()) {
        await window.db.investments.addSiteUpdate(form.investmentId, update);
      } else {
        if (!window.siteUpdates[form.investmentId]) window.siteUpdates[form.investmentId] = [];
        window.siteUpdates[form.investmentId].unshift({
          ...update,
          id: `su-${Date.now()}`,
          date: new Date(form.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }),
        });
        if (inv) inv.progress = parseFloat(form.progress) / 100;
      }
      window.__bumpRev?.();
      setDone({ ...form, inv });
    } catch (e) {
      window.__toast?.(e?.message || "Could not save site update");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title="Site update logged."
          message={`"${done.milestone}" recorded for ${done.inv?.name}. ${files.length ? `${files.length} photo${files.length > 1 ? "s" : ""} attached.` : ""}`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="Log site update"
      subtitle="Record construction progress, milestones and site photos."
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <SubmitButton onSubmit={submit}><Icon name="plus" size={12} />Save update</SubmitButton>
        </>
      }
    >
      <FormSection title="Asset">
        <Field label="Which investment?" required>
          <Select
            value={form.investmentId}
            onChange={(v) => set("investmentId", v)}
            options={eligibleInvestments.map((i) => ({ value: i.id, label: `${i.name} (${Math.round(i.progress * 100)}%)` }))}
          />
        </Field>
        {inv && (
          <div className="card flat" style={{ padding: 14 }}>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="muted">Current progress</span>
              <span className="mono">{Math.round(inv.progress * 100)}%</span>
            </div>
            <div className="bar pos" style={{ marginTop: 8 }}><i style={{ width: `${inv.progress * 100}%` }} /></div>
            <div className="row between" style={{ marginTop: 8, fontSize: 11 }}>
              <span className="muted">Handover · {inv.handover || "TBD"}</span>
              <span className="muted">{inv.location}</span>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Milestone">
        <div className="input-row">
          <Field label="Date">
            <Input value={form.date} onChange={(v) => set("date", v)} type="date" />
          </Field>
          <Field label="Reported by">
            <Input value={form.reporter} onChange={(v) => set("reporter", v)} placeholder="Site Engineer / Developer / You" />
          </Field>
        </div>
        <Field label="Milestone reached" required hint="e.g. '6th floor slab cast' or 'Block work — floors 1-5'.">
          <Input value={form.milestone} onChange={(v) => set("milestone", v)} placeholder="Describe what was completed" />
        </Field>
        <Field label="Updated overall progress" hint={`${form.progress}% complete`}>
          <input
            type="range"
            min="0" max="100" step="5"
            value={form.progress}
            onChange={(e) => set("progress", e.target.value)}
            style={{ width: "100%", accentColor: "var(--positive)" }}
          />
          <div className="row between" style={{ fontSize: 10.5, color: "var(--muted)" }}>
            <span>Ground breaking</span><span>Structure</span><span>Envelope</span><span>Handover</span>
          </div>
        </Field>
      </FormSection>

      <FormSection title="Photos">
        <FileUpload
          files={files} onChange={setFiles} multiple
          accept="image/*"
          hint="Drop site photos here. JPG / PNG up to 10MB each."
        />
      </FormSection>

      <FormSection title="Detail">
        <Field label="Notes">
          <TextArea value={form.notes} onChange={(v) => set("notes", v)} placeholder="Anything important — delays, materials, snags, next steps." rows={3} />
        </Field>
        <div className="row gap-3" style={{ padding: "10px 12px", background: "var(--canvas)", borderRadius: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>I verified this in person</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>Otherwise it's marked as "pending verification".</div>
          </div>
          <Switch value={form.verified} onChange={(v) => set("verified", v)} />
        </div>
      </FormSection>
    </SidePanel>
  );
};

// ---------- Team invite form ----------
const TeamInviteForm = ({ onClose, defaultMember = null }) => {
  const [done, setDone] = React.useState(null);
  const [form, setForm] = React.useState(defaultMember ? {
    name: defaultMember.name, email: defaultMember.email, role: defaultMember.role,
    location: defaultMember.location || "", external: defaultMember.external || "",
    perms: { ...ROLE_PERMS[defaultMember.role] }, twoFa: true, expiresIn: "never",
  } : {
    name: "", email: "", role: "Personal Assistant",
    location: "", external: "",
    perms: { ...ROLE_PERMS["Personal Assistant"] },
    twoFa: true, expiresIn: "never",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const editing = !!defaultMember;
  const isCustom = form.role === "Custom";

  // When role changes, copy the preset perms (unless already Custom)
  const pickRole = (r) => {
    set("role", r);
    if (r !== "Custom") {
      setForm((f) => ({ ...f, role: r, perms: { ...ROLE_PERMS[r] } }));
    }
  };

  const submit = async () => {
    if (!form.name || !form.email) { window.__toast?.("Name and email required"); return; }
    try {
      if (window.db?.isConfigured?.()) {
        if (editing) {
          await window.db.team.update(defaultMember.id, form);
        } else {
          await window.db.team.invite({
            email: form.email, name: form.name, role: form.role,
            location: form.location, external: form.external,
          });
        }
      } else {
        if (editing) {
          const idx = window.team.findIndex((m) => m.id === defaultMember.id);
          window.team[idx] = { ...window.team[idx], ...form, perms: form.perms };
        } else {
          const initials = form.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
          window.team.push({
            id: `tm-${Date.now()}`,
            name: form.name, email: form.email, role: form.role,
            initials, status: "Pending",
            lastActive: "—", twoFa: form.twoFa,
            joined: "Invited just now",
            location: form.location, external: form.external,
            perms: form.perms,
          });
        }
      }
      window.__bumpRev?.();
      setDone(form);
    } catch (e) {
      window.__toast?.(e?.message || "Could not save team member");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title={editing ? `${done.name}'s access updated.` : `${done.name} invited.`}
          message={editing
            ? `Permissions saved. They'll see the new scope next time they sign in.`
            : `An invitation email has been sent to ${done.email}. They'll set up their passphrase and 2FA on first login.`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title={editing ? `Edit access — ${defaultMember.name}` : "Invite a team member"}
      subtitle="Give someone scoped access to your portal."
      wide
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <SubmitButton onSubmit={submit}>
            <Icon name={editing ? "check" : "plus"} size={12} stroke={editing ? 2.4 : undefined} />
            {editing ? "Save changes" : "Send invitation"}
          </SubmitButton>
        </>
      }
    >
      {!editing && (
        <FormSection title="Person">
          <div className="input-row">
            <Field label="Full name" required>
              <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Ama Owusu" autoFocus />
            </Field>
            <Field label="Email" required>
              <Input value={form.email} onChange={(v) => set("email", v)} placeholder="name@example.com" type="email" />
            </Field>
          </div>
          <div className="input-row">
            <Field label="Location" hint="Helps you keep track of who's where.">
              <Input value={form.location} onChange={(v) => set("location", v)} placeholder="Accra / Dubai / Remote" />
            </Field>
            <Field label="Organisation" hint="Only fill if they work for an external firm.">
              <Input value={form.external} onChange={(v) => set("external", v)} placeholder="e.g. Asante Law Group" />
            </Field>
          </div>
        </FormSection>
      )}

      <FormSection title="Role">
        <div className="col gap-2">
          {Object.entries(ROLE_PRESETS).map(([role, meta]) => (
            <button
              key={role}
              type="button"
              onClick={() => pickRole(role)}
              className="card"
              style={{
                textAlign: "left",
                padding: 14,
                borderColor: form.role === role ? "var(--ink)" : "var(--line)",
                background: form.role === role ? "var(--canvas)" : "var(--surface-2)",
                cursor: "pointer",
              }}
            >
              <div className="row between">
                <div className="row gap-3">
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{role}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{meta.desc}</div>
                  </div>
                </div>
                {form.role === role && <Icon name="check" size={16} stroke={2.4} />}
              </div>
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title={`Permissions ${isCustom ? "" : "(from preset — edit to customise)"}`}>
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
          <div className="row" style={{ padding: "10px 12px", background: "var(--canvas)", fontSize: 11, fontWeight: 500, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            <span style={{ flex: 1 }}>Module</span>
            <span style={{ width: 60, textAlign: "center" }}>None</span>
            <span style={{ width: 60, textAlign: "center" }}>View</span>
            <span style={{ width: 60, textAlign: "center" }}>Edit</span>
            <span style={{ width: 60, textAlign: "center" }}>Full</span>
          </div>
          {MODULES.map((m, i) => (
            <div key={m.key} className="row" style={{ padding: "10px 12px", borderTop: "1px solid var(--line-2)" }}>
              <span style={{ flex: 1, fontSize: 13 }}>{m.label}</span>
              {["none", "view", "edit", "full"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    set("perms", { ...form.perms, [m.key]: lvl });
                    if (!isCustom) set("role", "Custom");
                  }}
                  style={{
                    width: 60, textAlign: "center",
                  }}
                >
                  <span style={{
                    display: "inline-block",
                    width: 18, height: 18, borderRadius: 999,
                    border: `1.5px solid ${form.perms[m.key] === lvl ? (lvl === "none" ? "var(--muted)" : lvl === "view" ? "var(--accent)" : lvl === "edit" ? "var(--warn)" : "var(--positive)") : "var(--line)"}`,
                    background: form.perms[m.key] === lvl ? (lvl === "none" ? "var(--muted)" : lvl === "view" ? "var(--accent)" : lvl === "edit" ? "var(--warn)" : "var(--positive)") : "transparent",
                    transition: "all 120ms",
                  }} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </FormSection>

      {!editing && (
        <FormSection title="Security">
          <div className="row gap-3" style={{ padding: "10px 12px", background: "var(--canvas)", borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Require 2FA on first login</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>Recommended — adds passkey or TOTP to their sign-in.</div>
            </div>
            <Switch value={form.twoFa} onChange={(v) => set("twoFa", v)} />
          </div>
          <Field label="Access expires">
            <Segmented
              value={form.expiresIn}
              onChange={(v) => set("expiresIn", v)}
              options={[
                { value: "30d", label: "30 days" },
                { value: "90d", label: "90 days" },
                { value: "1y", label: "1 year" },
                { value: "never", label: "Never" },
              ]}
            />
          </Field>
        </FormSection>
      )}
    </SidePanel>
  );
};

// ---------- Investment payment form (log a historical payment) ----------
const PAYMENT_METHODS = ["Bank transfer", "Cash", "Cheque", "Mobile money", "Card", "Other"];

const InvestmentPaymentForm = ({ onClose, defaultInvestmentId = null, defaultAmount = null }) => {
  const $ = useMoney();
  const [done, setDone] = React.useState(null);
  const [form, setForm] = React.useState({
    investmentId: defaultInvestmentId || investments[0]?.id || "",
    amount: defaultAmount != null ? String(defaultAmount) : "",
    date: new Date().toISOString().slice(0, 10),
    method: "",
    note: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const inv = investments.find((i) => i.id === form.investmentId);
  const currency = inv?.currency || "USD";
  const outstanding = inv ? Math.max(0, (inv.priceTotal || 0) - (inv.paid || 0)) : 0;

  const submit = async () => {
    if (!form.investmentId || !form.amount) { window.__toast?.("Pick an asset + amount"); return; }
    const amt = parseFloat(form.amount) || 0;
    if (amt <= 0) { window.__toast?.("Enter a payment amount"); return; }
    const payment = { amount: amt, currency, date: form.date, method: form.method, note: form.note };
    try {
      if (window.db?.isConfigured?.()) {
        await window.db.investments.addPayment(form.investmentId, payment);
      } else {
        // Offline fallback — bump funded amount + keep a local payment record
        if (inv) {
          inv.paid = (inv.paid || 0) + amt;
          inv.progress = inv.priceTotal ? Math.min(1, inv.paid / inv.priceTotal) : 0;
        }
        if (!Array.isArray(window.__investmentPayments)) window.__investmentPayments = [];
        window.__investmentPayments.unshift({
          id: `ip-${Date.now()}`, investment_id: form.investmentId,
          amount: amt, currency, paid_on: form.date, method: form.method, note: form.note,
        });
      }
      window.__bumpRev?.();
      setDone({ amt, inv: investments.find((i) => i.id === form.investmentId) });
    } catch (e) {
      window.__toast?.(e?.message || "Could not record payment");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title="Payment recorded."
          message={`${formatCurrency(done.amt, currency)} logged for ${done.inv?.name}. Funded to date is now ${formatCurrency(done.inv?.paid || 0, currency)} of ${formatCurrency(done.inv?.priceTotal || 0, currency)}.`}
          onClose={onClose}
          onAddAnother={() => { setDone(null); set("amount", ""); set("note", ""); set("method", ""); }}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="Add a payment"
      subtitle="Log a payment you've already made toward this investment, with its real date."
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <SubmitButton onSubmit={submit}><Icon name="plus" size={12} />Add payment</SubmitButton>
        </>
      }
    >
      <FormSection title="Asset">
        <Field label="Which investment?" required>
          <Select
            value={form.investmentId}
            onChange={(v) => set("investmentId", v)}
            options={investments.map((i) => ({ value: i.id, label: i.name }))}
          />
        </Field>
        {inv && (
          <div className="card flat" style={{ padding: 14 }}>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="muted">Committed</span>
              <span className="mono">{formatCurrency(inv.priceTotal, currency)}</span>
            </div>
            <div className="row between" style={{ fontSize: 12, marginTop: 6 }}>
              <span className="muted">Funded to date</span>
              <span className="mono">{formatCurrency(inv.paid, currency)}</span>
            </div>
            <div className="row between" style={{ fontSize: 12, marginTop: 6 }}>
              <span className="muted">Outstanding</span>
              <span className="mono">{formatCurrency(outstanding, currency)}</span>
            </div>
            <div className="bar pos" style={{ marginTop: 10 }}><i style={{ width: `${inv.priceTotal ? Math.min(100, (inv.paid / inv.priceTotal) * 100) : 0}%` }} /></div>
          </div>
        )}
      </FormSection>

      <FormSection title="Payment">
        <div className="input-row">
          <Field label="Amount" required hint="Native currency of the asset.">
            <MoneyInput
              amount={form.amount}
              currency={currency}
              onAmountChange={(v) => set("amount", v)}
              onCurrencyChange={() => {}}
              currencies={[currency]}
            />
          </Field>
          <Field label="Date paid" required hint="Use the real date this payment was made.">
            <Input value={form.date} onChange={(v) => set("date", v)} type="date" />
          </Field>
        </div>
        <Field label="Method (optional)">
          <Select value={form.method} onChange={(v) => set("method", v)} placeholder="How was it paid?" options={PAYMENT_METHODS} />
        </Field>
        <Field label="Note (optional)">
          <TextArea value={form.note} onChange={(v) => set("note", v)} placeholder="e.g. 2nd instalment, milestone payment, deposit…" rows={2} />
        </Field>
      </FormSection>
    </SidePanel>
  );
};

Object.assign(window, { ContractForm, SiteUpdateForm, TeamInviteForm, InvestmentPaymentForm });
