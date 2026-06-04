// =========================================================
// Add Investment form (multi-step)
// =========================================================

const INVESTMENT_TYPES = [
  { value: "real-estate-offplan", name: "Real estate · off-plan", desc: "Apartment, house or unit under construction with payment plan.", icon: "building" },
  { value: "real-estate-developed", name: "Real estate · developed", desc: "Already-built property you own or co-own.", icon: "home" },
  { value: "real-estate-dev", name: "Real estate · development", desc: "You're building / co-developing the asset.", icon: "building" },
  { value: "business", name: "Business equity", desc: "Equity stake in an operating company.", icon: "storefront" },
  { value: "spv", name: "SPV / Contract", desc: "Special-purpose vehicle for a contract, e.g. government project.", icon: "contract" },
];

const InvestmentForm = ({ onClose, onSubmit }) => {
  const $ = useMoney();
  const [step, setStep] = React.useState(0);
  const [mode, setMode] = React.useState("new"); // "new" = forward / "record" = existing
  const [done, setDone] = React.useState(null);

  const [form, setForm] = React.useState({
    type: null,
    name: "",
    location: "",
    developer: "",
    currency: "USD",
    priceTotal: "",
    paid: "",
    equity: "",
    monthlyDistribution: "",
    acquisitionDate: "",
    handover: "",
    nextPaymentAmount: "",
    nextPaymentDate: "",
    notes: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const outstanding = React.useMemo(() => {
    const total = parseFloat(form.priceTotal) || 0;
    const paid = parseFloat(form.paid) || 0;
    return Math.max(0, total - paid);
  }, [form.priceTotal, form.paid]);

  // Reset secondary fields when mode flips
  React.useEffect(() => {
    if (mode === "record") {
      set("paid", form.priceTotal);
    }
    // eslint-disable-next-line
  }, [mode]);

  const steps = ["Type", "Details", mode === "new" ? "Schedule" : "Returns", "Review"];

  const isReal = form.type && form.type.startsWith("real-estate");
  const isOffPlan = form.type === "real-estate-offplan";
  const isBiz = form.type === "business";
  const isSpv = form.type === "spv";

  const validateStep = () => {
    if (step === 0 && !form.type) return "Pick an investment type.";
    if (step === 1) {
      if (!form.name) return "Give it a name.";
      if (!form.priceTotal) return "Enter the total commitment.";
      if (isReal && !form.location) return "Where is it located?";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { window.__toast?.(err); return; }
    if (step < steps.length - 1) setStep(step + 1);
  };
  const prev = () => setStep(Math.max(0, step - 1));

  const submit = async () => {
    const priceTotal = parseFloat(form.priceTotal) || 0;
    const paid = parseFloat(form.paid) || 0;
    const valueNow = priceTotal;
    const inv = {
      name: form.name,
      kind: isOffPlan ? "Real Estate" :
            form.type === "real-estate-dev" ? "Real Estate Development" :
            form.type === "real-estate-developed" ? "Real Estate" :
            isBiz ? "Business" : "Government Contract (SPV)",
      sub: INVESTMENT_TYPES.find((t) => t.value === form.type)?.name || "",
      location: form.location,
      developer: form.developer,
      currency: form.currency,
      priceTotal,
      paid,
      progress: priceTotal ? Math.min(1, paid / priceTotal) : 0,
      handover: form.handover,
      valueNow,
      yieldExp: form.monthlyDistribution ? `Distributions: ${SYMBOLS[form.currency]}${form.monthlyDistribution}/mo` : "TBD",
      equity: form.equity ? parseFloat(form.equity) / 100 : undefined,
      monthlyDistribution: form.monthlyDistribution ? parseFloat(form.monthlyDistribution) : undefined,
      nextPayment: form.nextPaymentAmount ? { amount: parseFloat(form.nextPaymentAmount), date: form.nextPaymentDate } : undefined,
      notes: form.notes || (mode === "record" ? "Recorded from existing portfolio." : "Newly added."),
    };
    try {
      const saved = window.db?.isConfigured?.()
        ? await window.db.investments.create(inv)
        : (window.investments.unshift({ ...inv, id: `inv-${Date.now()}` }), window.investments[0]);
      // Remember this name as a reusable beneficiary for future records.
      window.bens?.upsert?.({
        name: form.name,
        type: "Investment",
        location: form.location,
        org: form.developer,
        currency: form.currency,
      });
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
          title="Added to portfolio."
          message={`"${done.name}" is now tracked. You can update progress, log payments, and add site visits from the asset's detail page.`}
          onClose={onClose}
          onAddAnother={() => {
            setDone(null);
            setStep(0);
            setForm({
              type: null, name: "", location: "", developer: "",
              currency: "USD", priceTotal: "", paid: "", equity: "",
              monthlyDistribution: "", acquisitionDate: "", handover: "",
              nextPaymentAmount: "", nextPaymentDate: "", notes: "",
            });
          }}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      open
      onClose={onClose}
      title={mode === "new" ? "Add a new investment" : "Record an existing investment"}
      subtitle="Track its commitment, funding schedule and value over time."
      wide
      header={
        <>
          <div className="row between" style={{ marginTop: 10 }}>
            <ModePill
              value={mode}
              onChange={setMode}
              options={[
                { value: "new", label: "Forward-looking" },
                { value: "record", label: "Record existing" },
              ]}
            />
            <div className="muted mono" style={{ fontSize: 11 }}>Step {step + 1} of {steps.length}</div>
          </div>
          <Stepper steps={steps} current={step} />
        </>
      }
      footer={
        <>
          <button className="btn ghost" onClick={step === 0 ? onClose : prev}>
            {step === 0 ? "Cancel" : <><Icon name="chevRight" size={12} stroke={2.4} /> Back</>}
          </button>
          {step < steps.length - 1 ? (
            <button className="btn primary" onClick={next}>Continue <Icon name="arrowRight" size={12} /></button>
          ) : (
            <SubmitButton onSubmit={submit}><Icon name="plus" size={12} />{mode === "new" ? "Add investment" : "Record investment"}</SubmitButton>
          )}
        </>
      }
    >
      {step === 0 && (
        <FormSection title="What kind of investment?">
          <ChoiceGrid value={form.type} onChange={(v) => set("type", v)} options={INVESTMENT_TYPES} />
        </FormSection>
      )}

      {step === 1 && (
        <>
          <FormSection title="Basics">
            <Field label="Name" required hint="Pick a saved beneficiary to reuse its details, or type a new name.">
              <BeneficiaryPicker
                value={form.name}
                onChange={(v) => set("name", v)}
                onPick={(b) => setForm((f) => ({
                  ...f,
                  name: b.name,
                  location: b.location || f.location,
                  developer: b.org || f.developer,
                  currency: b.currency || f.currency,
                }))}
                placeholder={isReal ? "e.g. Cantonments Heights — Unit 8B" : isBiz ? "e.g. Scoop & Co. — Ice Cream Parlour" : "e.g. Eastern Corridor SPV"}
                autoFocus
              />
            </Field>
            {isReal && (
              <Field label="Location" required>
                <Input value={form.location} onChange={(v) => set("location", v)} placeholder="City, country" />
              </Field>
            )}
            {(isOffPlan || form.type === "real-estate-dev") && (
              <Field label="Developer / Operator">
                <Input value={form.developer} onChange={(v) => set("developer", v)} placeholder="e.g. Ridge Residences Ltd." />
              </Field>
            )}
            {isBiz && (
              <Field label="Location">
                <Input value={form.location} onChange={(v) => set("location", v)} placeholder="City" />
              </Field>
            )}
          </FormSection>

          <FormSection title="Commitment">
            <div className="input-row">
              <Field label="Total commitment" required hint="The full purchase price or capital pledge.">
                <MoneyInput
                  amount={form.priceTotal}
                  currency={form.currency}
                  onAmountChange={(v) => set("priceTotal", v)}
                  onCurrencyChange={(v) => set("currency", v)}
                />
              </Field>
              <Field label={mode === "record" ? "Amount funded to date" : "Already paid (deposit)"}>
                <MoneyInput
                  amount={form.paid}
                  currency={form.currency}
                  onAmountChange={(v) => set("paid", v)}
                  onCurrencyChange={(v) => set("currency", v)}
                />
              </Field>
            </div>
            {form.priceTotal && form.paid && (
              <div className="row between" style={{ background: "var(--canvas)", padding: "10px 12px", borderRadius: 8, fontSize: 12 }}>
                <span className="muted">Outstanding</span>
                <span className="mono">{formatCurrency(parseFloat(form.priceTotal || 0) - parseFloat(form.paid || 0), form.currency)} · {$.fmt(parseFloat(form.priceTotal || 0) - parseFloat(form.paid || 0), form.currency)}</span>
              </div>
            )}
          </FormSection>

          {(isBiz || isSpv) && (
            <FormSection title="Stake">
              <div className="input-row">
                <Field label="Your equity %" hint="0–100">
                  <Input value={form.equity} onChange={(v) => set("equity", v)} placeholder="40" type="number" suffix="%" />
                </Field>
                <Field label={mode === "record" ? "Acquisition date" : "Effective date"}>
                  <Input value={form.acquisitionDate} onChange={(v) => set("acquisitionDate", v)} placeholder="2025-09-15" type="date" />
                </Field>
              </div>
            </FormSection>
          )}
        </>
      )}

      {step === 2 && mode === "new" && (
        <>
          {(isOffPlan || form.type === "real-estate-dev") && (
            <>
              <FormSection title="Handover">
                <Field label="Expected handover">
                  <Input value={form.handover} onChange={(v) => set("handover", v)} placeholder="Q4 2026" />
                </Field>
              </FormSection>

              <FormSection title="Next payment reminder (optional)">
                <div className="input-row">
                  <Field label="Amount" hint="Native currency of the asset.">
                    <MoneyInput
                      amount={form.nextPaymentAmount}
                      currency={form.currency}
                      onAmountChange={(v) => set("nextPaymentAmount", v)}
                      onCurrencyChange={(v) => set("currency", v)}
                      currencies={[form.currency]}
                    />
                  </Field>
                  <Field label="Due date">
                    <Input value={form.nextPaymentDate} onChange={(v) => set("nextPaymentDate", v)} type="date" />
                  </Field>
                </div>
                {form.nextPaymentDate && (
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    <Icon name="bell" size={11} /> &nbsp;We'll remind you 5 days before this date.
                  </div>
                )}
                <div className="card flat" style={{ padding: "10px 12px", fontSize: 11.5 }}>
                  <span className="muted">Already made payments on this asset? Once it's created, open it and log each one with its real date under <b>Payment history</b>.</span>
                </div>
              </FormSection>
            </>
          )}

          {(isBiz || isSpv) && (
            <FormSection title={isBiz ? "Operating distributions" : "Expected returns"}>
              <Field label={isBiz ? "Monthly distribution to you" : "Profit share milestones"} hint={isBiz ? "Average expected distribution per month." : "Describe how/when you expect distributions."}>
                {isBiz ? (
                  <MoneyInput
                    amount={form.monthlyDistribution}
                    currency={form.currency}
                    onAmountChange={(v) => set("monthlyDistribution", v)}
                    onCurrencyChange={(v) => set("currency", v)}
                  />
                ) : (
                  <TextArea value={form.notes} onChange={(v) => set("notes", v)} placeholder="e.g. Milestone-based payouts as Ministry releases invoice payments." rows={3} />
                )}
              </Field>
            </FormSection>
          )}

          {form.type === "real-estate-developed" && (
            <FormSection title="Property details">
              <Field label="Acquired on">
                <Input value={form.acquisitionDate} onChange={(v) => set("acquisitionDate", v)} type="date" />
              </Field>
              <Field label="Expected rental yield">
                <Input value={form.handover} onChange={(v) => set("handover", v)} placeholder="e.g. 6.5%" suffix="annual" />
              </Field>
            </FormSection>
          )}
        </>
      )}

      {step === 2 && mode === "record" && (
        <>
          <FormSection title="Historical performance">
            <Field label="Acquisition date">
              <Input value={form.acquisitionDate} onChange={(v) => set("acquisitionDate", v)} type="date" />
            </Field>
            {isBiz && (
              <Field label="Monthly distribution to you (avg)">
                <MoneyInput
                  amount={form.monthlyDistribution}
                  currency={form.currency}
                  onAmountChange={(v) => set("monthlyDistribution", v)}
                  onCurrencyChange={(v) => set("currency", v)}
                />
              </Field>
            )}
            <Field label="Current market value" hint="Optional — we'll use commitment if you skip this.">
              <MoneyInput
                amount={form.priceTotal}
                currency={form.currency}
                onAmountChange={(v) => set("priceTotal", v)}
                onCurrencyChange={(v) => set("currency", v)}
              />
            </Field>
          </FormSection>
        </>
      )}

      {step === 3 && (
        <>
          <FormSection title="Notes (optional)">
            <Field hint="Anything else worth knowing about this asset.">
              <TextArea value={form.notes} onChange={(v) => set("notes", v)} placeholder="e.g. Title docs received. Site visit scheduled May 2026." rows={3} />
            </Field>
          </FormSection>

          <FormSection title="Review">
            <div className="card flat">
              <Review label="Type" value={INVESTMENT_TYPES.find((t) => t.value === form.type)?.name || "—"} />
              <Review label="Name" value={form.name} />
              {form.location && <Review label="Location" value={form.location} />}
              {form.developer && <Review label="Developer" value={form.developer} />}
              <Review label="Commitment" value={`${formatCurrency(parseFloat(form.priceTotal || 0), form.currency)}${form.currency !== $.display ? ` · ${$.fmt(parseFloat(form.priceTotal||0), form.currency)}` : ""}`} mono />
              <Review label="Funded so far" value={`${formatCurrency(parseFloat(form.paid || 0), form.currency)} (${form.priceTotal ? Math.round((parseFloat(form.paid||0)/parseFloat(form.priceTotal||1))*100) : 0}%)`} mono />
              {form.equity && <Review label="Equity stake" value={`${form.equity}%`} mono />}
              {form.nextPaymentAmount && <Review label="Next payment" value={`${formatCurrency(parseFloat(form.nextPaymentAmount), form.currency)} · ${form.nextPaymentDate || "TBD"}`} mono />}
              {form.handover && <Review label="Handover / yield" value={form.handover} />}
              {form.monthlyDistribution && <Review label="Distribution / mo" value={formatCurrency(parseFloat(form.monthlyDistribution), form.currency)} mono />}
            </div>
          </FormSection>
        </>
      )}
    </SidePanel>
  );
};

const Review = ({ label, value, mono }) => (
  <div className="row between" style={{ padding: "8px 0", borderBottom: "1px solid var(--line-2)", fontSize: 13 }}>
    <span className="muted">{label}</span>
    <span className={mono ? "mono" : ""} style={{ textAlign: "right", maxWidth: 360 }}>{value || "—"}</span>
  </div>
);

window.InvestmentForm = InvestmentForm;
window.Review = Review;
