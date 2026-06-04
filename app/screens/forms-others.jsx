// =========================================================
// Loan / Trade / Project / Income / Payment forms
// =========================================================

// ---------- Loan form ----------
const LoanForm = ({ onClose }) => {
  const $ = useMoney();
  const [done, setDone] = React.useState(null);
  const [repaymentTouched, setRepaymentTouched] = React.useState(false);
  const [form, setForm] = React.useState({
    borrower: "", type: "Individual",
    currency: "USD", principal: "",
    issued: new Date().toISOString().slice(0, 10),
    dueMonths: 12, customDue: "",
    interest: 0, status: "On track",
    repaymentPlan: "monthly",
    repaymentAmount: "",
    securedBy: "",
    notes: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const dueDate = form.customDue || (() => {
    if (!form.issued || !form.dueMonths) return "";
    const d = new Date(form.issued);
    d.setMonth(d.getMonth() + parseInt(form.dueMonths || 0));
    return d.toISOString().slice(0, 10);
  })();

  const termMonths = React.useMemo(() => {
    if (form.dueMonths === 0 || form.dueMonths === "0") {
      return window.paymentCalc?.termMonthsFromDates?.(form.issued, form.customDue) || null;
    }
    return parseInt(form.dueMonths, 10) || null;
  }, [form.issued, form.dueMonths, form.customDue]);

  const loanCalc = React.useMemo(() => {
    if (!form.principal || !termMonths) return null;
    return window.paymentCalc?.loanSchedule?.({
      principal: form.principal,
      annualRatePct: form.interest,
      termMonths,
      plan: form.repaymentPlan,
    });
  }, [form.principal, form.interest, form.repaymentPlan, termMonths]);

  // Re-suggest payment when terms change (unless user typed their own amount).
  React.useEffect(() => {
    setRepaymentTouched(false);
  }, [form.principal, form.interest, form.repaymentPlan, termMonths]);

  React.useEffect(() => {
    if (repaymentTouched || !loanCalc) return;
    set("repaymentAmount", String(loanCalc.periodPayment));
  }, [loanCalc, repaymentTouched]);

  const submit = async () => {
    if (!form.borrower || !form.principal) { window.__toast?.("Fill borrower + amount"); return; }
    const principal = parseFloat(form.principal) || 0;
    const loan = {
      borrower: form.borrower,
      type: form.type,
      principal,
      currency: form.currency,
      issued: form.issued,
      due: dueDate,
      interest: parseFloat(form.interest) / 100 || 0,
      status: form.status,
      paidBack: 0,
      nextPayment: form.repaymentAmount ? { amount: parseFloat(form.repaymentAmount), date: addOneMonth(form.issued) } : { amount: 0, date: "—" },
      securedBy: form.securedBy,
      repaymentPlan: form.repaymentPlan,
      notes: form.notes || `${form.repaymentPlan === "balloon" ? "Balloon" : "Periodic"} repayment.${form.securedBy ? ` Secured by: ${form.securedBy}.` : ""}`,
      history: [],
    };
    try {
      const saved = window.db?.isConfigured?.()
        ? await window.db.loans.create(loan)
        : (window.loans.unshift({ ...loan, id: `ln-${Date.now()}` }), window.loans[0]);
      window.__bumpRev?.();
      setDone(saved);
    } catch (e) {
      window.__toast?.(e?.message || "Could not save");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title={`Loan to ${done.borrower} recorded.`}
          message={`${formatCurrency(done.principal, done.currency)} due ${done.due}. Send a payment reminder anytime from the loan's detail page.`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="Issue a loan"
      subtitle="Record money you've lent to an individual or business."
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}><Icon name="plus" size={12} />Record loan</button>
        </>
      }
    >
      <FormSection title="Borrower">
        <Field label="Name" required>
          <Input value={form.borrower} onChange={(v) => set("borrower", v)} placeholder="e.g. Akua Mensah or Kontact Logistics Ltd." autoFocus />
        </Field>
        <Field label="Borrower type">
          <Segmented value={form.type} onChange={(v) => set("type", v)} options={["Individual", "Business"]} />
        </Field>
      </FormSection>

      <FormSection title="Terms">
        <Field label="Principal" required>
          <MoneyInput
            amount={form.principal}
            currency={form.currency}
            onAmountChange={(v) => set("principal", v)}
            onCurrencyChange={(v) => set("currency", v)}
          />
        </Field>

        <div className="input-row">
          <Field label="Interest rate" hint="Annual percentage rate.">
            <Input value={form.interest} onChange={(v) => set("interest", v)} type="number" placeholder="0" suffix="% APR" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(v) => set("status", v)} options={["On track", "Due soon", "Overdue", "Family"]} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Schedule">
        <div className="input-row">
          <Field label="Issued">
            <Input value={form.issued} onChange={(v) => set("issued", v)} type="date" />
          </Field>
          <Field label="Term" hint={dueDate ? `Due ${dueDate}` : ""}>
            <Select
              value={form.dueMonths}
              onChange={(v) => { set("dueMonths", v); set("customDue", ""); }}
              options={[
                { value: 3, label: "3 months" },
                { value: 6, label: "6 months" },
                { value: 12, label: "12 months" },
                { value: 24, label: "24 months" },
                { value: 0, label: "Custom date" },
              ]}
            />
          </Field>
        </div>
        {form.dueMonths == 0 && (
          <Field label="Custom due date">
            <Input value={form.customDue} onChange={(v) => set("customDue", v)} type="date" />
          </Field>
        )}

        <Field label="Repayment plan">
          <Segmented
            value={form.repaymentPlan}
            onChange={(v) => set("repaymentPlan", v)}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly" },
              { value: "balloon", label: "Balloon" },
            ]}
          />
        </Field>

        {loanCalc && (
          <PaymentCalcCard
            calc={loanCalc}
            currency={form.currency}
            appliedAmount={form.repaymentAmount}
            onApply={(v) => {
              set("repaymentAmount", v);
              setRepaymentTouched(false);
            }}
          />
        )}

        {!loanCalc && form.principal && !termMonths && (
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Set a term or custom due date to calculate expected payments.
          </div>
        )}

        <Field label="Expected payment amount" hint={form.repaymentPlan === "balloon" ? "Lump sum at maturity." : "Per period — auto-filled from calculator above."}>
          <MoneyInput
            amount={form.repaymentAmount}
            currency={form.currency}
            onAmountChange={(v) => {
              setRepaymentTouched(true);
              set("repaymentAmount", v);
            }}
            onCurrencyChange={(v) => set("currency", v)}
            currencies={[form.currency]}
          />
        </Field>
      </FormSection>

      <FormSection title="Optional">
        <Field label="Secured by" hint="Collateral, guarantee, asset assignment, etc.">
          <Input value={form.securedBy} onChange={(v) => set("securedBy", v)} placeholder="e.g. Personal guarantee, vehicle fleet" />
        </Field>
        <Field label="Notes">
          <TextArea value={form.notes} onChange={(v) => set("notes", v)} placeholder="Anything else worth remembering about this loan." />
        </Field>
      </FormSection>
    </SidePanel>
  );
};

const addOneMonth = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
};

// ---------- Trade form ----------
const TradeForm = ({ onClose, defaultAction = "Buy" }) => {
  const [done, setDone] = React.useState(null);
  const [form, setForm] = React.useState({
    action: defaultAction,
    cls: "Stock",
    sym: "",
    name: "",
    qty: "",
    price: "",
    venue: "Interactive Brokers",
    notes: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const total = (parseFloat(form.qty) || 0) * (parseFloat(form.price) || 0);

  const submit = async () => {
    if (!form.sym || !form.qty || !form.price) { window.__toast?.("Symbol, qty and price required"); return; }
    const sym = form.sym.toUpperCase();
    const existing = window.tradingPositions.find((p) => p.sym === sym);
    let nextPos;
    if (form.action === "Buy") {
      if (existing) {
        const newQty = existing.qty + parseFloat(form.qty);
        const newCost = existing.qty * existing.avg + parseFloat(form.qty) * parseFloat(form.price);
        nextPos = { sym, name: existing.name, qty: newQty, avg: newCost / newQty, last: parseFloat(form.price), cls: existing.cls };
      } else {
        nextPos = { sym, name: form.name || sym, qty: parseFloat(form.qty), avg: parseFloat(form.price), last: parseFloat(form.price), cls: form.cls };
      }
    } else if (existing) {
      nextPos = { ...existing, qty: Math.max(0, existing.qty - parseFloat(form.qty)) };
    }
    try {
      if (window.db?.isConfigured?.()) {
        await window.db.trading.logTrade({ ...form, sym });
        if (nextPos) await window.db.trading.upsertPosition(nextPos);
      } else if (nextPos) {
        const idx = window.tradingPositions.findIndex((p) => p.sym === sym);
        if (idx >= 0) window.tradingPositions[idx] = nextPos;
        else window.tradingPositions.unshift(nextPos);
      }
      window.__bumpRev?.();
      setDone({ ...form, total });
    } catch (e) {
      window.__toast?.(e?.message || "Could not save trade");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title={`${done.action} ticket filled.`}
          message={`${done.action} ${done.qty} × ${done.sym.toUpperCase()} @ $${parseFloat(done.price).toLocaleString()} for $${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}. Settled via ${done.venue}.`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="New trade"
      subtitle="Buy or sell a position. Prices and quantities are in USD."
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${form.action === "Buy" ? "primary" : ""}`} onClick={submit} style={form.action === "Sell" ? { background: "var(--negative)", color: "var(--surface)", borderColor: "var(--negative)" } : null}>
            {form.action === "Buy" ? "Place buy" : "Place sell"}
          </button>
        </>
      }
    >
      <FormSection>
        <Segmented
          value={form.action}
          onChange={(v) => set("action", v)}
          options={[
            { value: "Buy", label: "Buy" },
            { value: "Sell", label: "Sell" },
          ]}
        />
      </FormSection>

      <FormSection title="Instrument">
        <div className="input-row">
          <Field label="Asset class">
            <Segmented value={form.cls} onChange={(v) => set("cls", v)} options={["Stock", "ETF", "Crypto"]} />
          </Field>
          <Field label="Venue">
            <Select value={form.venue} onChange={(v) => set("venue", v)} options={["Interactive Brokers", "Coinbase", "Kraken", "Binance", "Schwab"]} />
          </Field>
        </div>

        <Field label="Ticker / Symbol" required>
          <Input value={form.sym} onChange={(v) => set("sym", v.toUpperCase())} placeholder="e.g. NVDA, BTC, VOO" autoFocus />
        </Field>
        <Field label="Name" hint="Optional — defaults to ticker.">
          <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. NVIDIA Corp." />
        </Field>
      </FormSection>

      <FormSection title="Order">
        <div className="input-row">
          <Field label="Quantity" required>
            <Input value={form.qty} onChange={(v) => set("qty", v)} type="number" placeholder="0" />
          </Field>
          <Field label="Limit / market price" required>
            <Input value={form.price} onChange={(v) => set("price", v)} type="number" placeholder="0.00" prefix="$" />
          </Field>
        </div>

        <div style={{ padding: "14px 16px", background: form.action === "Buy" ? "var(--positive-soft)" : "var(--negative-soft)", borderRadius: 10 }}>
          <div className="row between" style={{ fontSize: 12 }}>
            <span style={{ color: form.action === "Buy" ? "var(--positive)" : "var(--negative)", fontWeight: 500, letterSpacing: "0.02em" }}>
              Estimated {form.action === "Buy" ? "cost" : "proceeds"}
            </span>
            <span className="mono" style={{ fontSize: 18, color: form.action === "Buy" ? "var(--positive)" : "var(--negative)" }}>
              {form.action === "Buy" ? "-" : "+"}${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="row between" style={{ fontSize: 11, marginTop: 4 }}>
            <span className="muted">Commission · {form.venue}</span>
            <span className="mono muted">−$1.50</span>
          </div>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <Field>
          <TextArea value={form.notes} onChange={(v) => set("notes", v)} placeholder="Optional trade rationale." rows={2} />
        </Field>
      </FormSection>
    </SidePanel>
  );
};

// ---------- Project form ----------
const ProjectForm = ({ onClose }) => {
  const [done, setDone] = React.useState(null);
  const [form, setForm] = React.useState({
    name: "",
    status: "In progress",
    owner: "Ghanney",
    deadline: "",
    note: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name) { window.__toast?.("Project needs a name"); return; }
    const project = {
      name: form.name,
      status: form.status,
      owner: form.owner || "Ghanney",
      progress: 0,
      deadline: form.deadline || "TBD",
      note: form.note || "Just kicked off.",
    };
    try {
      if (window.db?.isConfigured?.()) {
        await window.db.projects.create(project);
      } else {
        window.projects.unshift({ ...project, id: `pr-${Date.now()}` });
      }
      window.__bumpRev?.();
      setDone(form.name);
    } catch (e) {
      window.__toast?.(e?.message || "Could not save project");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title={`Project created.`}
          message={`"${done}" is now in your active project list. Update progress as you go.`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="New project"
      subtitle="Track ongoing work — partnerships, expansions, decisions in flight."
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}><Icon name="plus" size={12} />Create project</button>
        </>
      }
    >
      <FormSection title="What's the project?">
        <Field label="Name" required>
          <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Scoop & Co. — Spintex location" autoFocus />
        </Field>
        <Field label="Short note">
          <TextArea value={form.note} onChange={(v) => set("note", v)} placeholder="One line describing the work / decision." rows={2} />
        </Field>
      </FormSection>

      <FormSection title="Ownership & status">
        <div className="input-row">
          <Field label="Status">
            <Select value={form.status} onChange={(v) => set("status", v)} options={["In progress", "Active", "Evaluating", "On hold"]} />
          </Field>
          <Field label="Owner / partners">
            <Input value={form.owner} onChange={(v) => set("owner", v)} placeholder="Ghanney + 2 partners" />
          </Field>
        </div>
        <Field label="Deadline / target">
          <Input value={form.deadline} onChange={(v) => set("deadline", v)} placeholder="e.g. Q3 2026 or 2026-09-30" />
        </Field>
      </FormSection>
    </SidePanel>
  );
};

// ---------- Income transaction form ----------
const INCOME_TYPES = [
  { value: "Salary", icon: "income" },
  { value: "Commission", icon: "income" },
  { value: "Referral", icon: "income" },
  { value: "Distribution", icon: "coin" },
  { value: "Rental", icon: "building" },
];

const IncomeForm = ({ onClose }) => {
  const $ = useMoney();
  const [done, setDone] = React.useState(null);
  const [form, setForm] = React.useState({
    type: "Commission",
    source: "",
    amount: "",
    currency: "USD",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.source || !form.amount) { window.__toast?.("Source + amount required"); return; }
    try {
      if (window.db?.isConfigured?.()) {
        await window.db.income.record({
          type: form.type,
          source: form.source,
          amount: parseFloat(form.amount),
          currency: form.currency,
          date: form.date,
          note: form.note,
        });
      }
      window.__bumpRev?.();
      setDone(form);
    } catch (e) {
      window.__toast?.(e?.message || "Could not save income");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title="Income recorded."
          message={`${formatCurrency(parseFloat(done.amount), done.currency)} from ${done.source}. Will appear in your income ledger for ${new Date(done.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}.`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="Record income received"
      subtitle="Log a salary payment, commission, referral fee or distribution."
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}><Icon name="plus" size={12} />Record income</button>
        </>
      }
    >
      <FormSection title="What kind of income?">
        <Segmented value={form.type} onChange={(v) => set("type", v)} options={INCOME_TYPES.map((t) => t.value)} cols={3} />
      </FormSection>

      <FormSection title="Details">
        <Field label="Source / payer" required>
          <Input value={form.source} onChange={(v) => set("source", v)} placeholder={form.type === "Salary" ? "e.g. WeWire Ghana" : form.type === "Commission" ? "e.g. WeWire FX desk — May trades" : "e.g. Greentree Capital"} autoFocus />
        </Field>
        <div className="input-row">
          <Field label="Amount received" required>
            <MoneyInput
              amount={form.amount}
              currency={form.currency}
              onAmountChange={(v) => set("amount", v)}
              onCurrencyChange={(v) => set("currency", v)}
            />
          </Field>
          <Field label="Date received">
            <Input value={form.date} onChange={(v) => set("date", v)} type="date" />
          </Field>
        </div>
        {form.amount && form.currency !== $.display && (
          <div className="row between" style={{ background: "var(--canvas)", padding: "10px 12px", borderRadius: 8, fontSize: 12 }}>
            <span className="muted">In your display currency ({$.display})</span>
            <span className="mono">{$.fmt(parseFloat(form.amount || 0), form.currency)}</span>
          </div>
        )}
      </FormSection>

      <FormSection title="Notes">
        <Field>
          <TextArea value={form.note} onChange={(v) => set("note", v)} placeholder="Optional — invoice ref, deal description, etc." rows={2} />
        </Field>
      </FormSection>
    </SidePanel>
  );
};

// ---------- Payment form (loan repayment) ----------
const PaymentForm = ({ onClose, defaultLoanId = null }) => {
  const $ = useMoney();
  const [done, setDone] = React.useState(null);
  const [amountTouched, setAmountTouched] = React.useState(false);
  const [form, setForm] = React.useState({
    loanId: defaultLoanId || (window.loans[0]?.id || ""),
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loan = window.loans.find((l) => l.id === form.loanId);

  const repaymentCalc = React.useMemo(() => {
    if (!loan) return null;
    return window.paymentCalc?.suggestLoanRepayment?.(loan, form.date);
  }, [loan, form.loanId, form.date]);

  React.useEffect(() => {
    setAmountTouched(false);
  }, [form.loanId]);

  React.useEffect(() => {
    if (amountTouched) return;
    if (repaymentCalc) set("amount", String(repaymentCalc.periodPayment));
    else if (loan?.nextPayment?.amount) set("amount", String(loan.nextPayment.amount));
  }, [repaymentCalc, amountTouched, loan]);

  const submit = async () => {
    if (!loan || !form.amount) { window.__toast?.("Pick a loan + amount"); return; }
    const amt = parseFloat(form.amount);
    try {
      if (window.db?.isConfigured?.()) {
        await window.db.loans.addPayment(loan.id, amt, form.date, form.note);
      } else {
        loan.paidBack = (loan.paidBack || 0) + amt;
        loan.history = [{ d: new Date(form.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }), a: amt }, ...(loan.history || [])];
        if (loan.paidBack >= loan.principal) loan.status = "Paid";
      }
      window.__bumpRev?.();
      setDone({ ...form, loan });
    } catch (e) {
      window.__toast?.(e?.message || "Could not record payment");
    }
  };

  if (done) {
    return (
      <SidePanel open onClose={onClose} title="Done">
        <SuccessCard
          title="Payment recorded."
          message={`${formatCurrency(parseFloat(done.amount), done.loan.currency)} received from ${done.loan.borrower}. Outstanding now ${formatCurrency(done.loan.principal - done.loan.paidBack, done.loan.currency)}.`}
          onClose={onClose}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open onClose={onClose}
      title="Log a loan repayment"
      subtitle="Mark a payment as received from a borrower."
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}><Icon name="check" size={12} stroke={2.4} />Record payment</button>
        </>
      }
    >
      <FormSection title="Loan">
        <Field label="Borrower" required>
          <Select
            value={form.loanId}
            onChange={(v) => set("loanId", v)}
            options={window.loans.map((l) => ({ value: l.id, label: `${l.borrower} — ${formatCurrency(l.principal - l.paidBack, l.currency || "USD")} outstanding` }))}
          />
        </Field>

        {loan && (
          <div className="card flat" style={{ padding: 14 }}>
            <div className="row between" style={{ fontSize: 12 }}>
              <span className="muted">Principal</span>
              <span className="mono">{formatCurrency(loan.principal, loan.currency)}</span>
            </div>
            <div className="row between" style={{ fontSize: 12, marginTop: 6 }}>
              <span className="muted">Paid to date</span>
              <span className="mono">{formatCurrency(loan.paidBack, loan.currency)}</span>
            </div>
            <div className="row between" style={{ fontSize: 12, marginTop: 6 }}>
              <span className="muted">Due</span>
              <span>{loan.due}</span>
            </div>
            <div className="bar pos" style={{ marginTop: 10 }}><i style={{ width: `${(loan.paidBack/loan.principal)*100}%` }} /></div>
          </div>
        )}
      </FormSection>

      <FormSection title="Payment">
        {repaymentCalc && (
          <PaymentCalcCard
            calc={repaymentCalc}
            currency={loan?.currency || "USD"}
            title={repaymentCalc.note || "Suggested payment"}
            appliedAmount={form.amount}
            onApply={(v) => {
              set("amount", v);
              setAmountTouched(false);
            }}
          />
        )}
        <div className="input-row">
          <Field label="Amount received" required hint={repaymentCalc ? "Auto-filled from remaining balance + rate." : ""}>
            <MoneyInput
              amount={form.amount}
              currency={loan?.currency || "USD"}
              onAmountChange={(v) => {
                setAmountTouched(true);
                set("amount", v);
              }}
              onCurrencyChange={() => {}}
              currencies={[loan?.currency || "USD"]}
            />
          </Field>
          <Field label="Date">
            <Input value={form.date} onChange={(v) => set("date", v)} type="date" />
          </Field>
        </div>
        <Field label="Note">
          <Input value={form.note} onChange={(v) => set("note", v)} placeholder="e.g. Bank transfer · MoMo · cheque" />
        </Field>
      </FormSection>
    </SidePanel>
  );
};

Object.assign(window, {
  LoanForm, TradeForm, ProjectForm, IncomeForm, PaymentForm,
});
