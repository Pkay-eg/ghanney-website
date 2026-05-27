// =========================================================
// Integrations — connect external accounts (Binance, Kraken,
// Coinbase, IBKR, …) and sync positions/balances into the
// trading + net worth views.
// =========================================================

const PROVIDER_BADGE = {
  binance:  { color: "#F0B90B", letter: "B" },
  kraken:   { color: "#5741D9", letter: "K" },
  coinbase: { color: "#0052FF", letter: "C" },
  ibkr:     { color: "#D71921", letter: "I" },
  manual:   { color: "var(--ink)",  letter: "M" },
};

const ProviderBadge = ({ id, size = 36 }) => {
  const b = PROVIDER_BADGE[id] || { color: "var(--ink)", letter: (id || "?").slice(0,1).toUpperCase() };
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: b.color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.42,
      letterSpacing: "-0.02em",
    }}>{b.letter}</div>
  );
};

// ---------- Connection modal (Add / Edit) ----------
const IntegrationFormPanel = ({ open, onClose, providerId, editing }) => {
  const connector = providerId ? window.connectors?.get(providerId) : null;
  const isEdit = !!editing;
  const initial = editing || { provider: providerId, label: connector?.label || "" };

  const [form, setForm] = React.useState(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState(null); // null | 'ok' | error message
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(editing || { provider: providerId, label: connector?.label || "" });
      setTestStatus(null);
    }
  }, [open, providerId, editing?.id]);

  if (!open || !connector) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const test = async () => {
    setTesting(true); setTestStatus(null);
    try {
      const res = await connector.test(form);
      setTestStatus({ ok: true, info: res });
    } catch (e) {
      setTestStatus({ ok: false, message: e.message || String(e) });
    } finally { setTesting(false); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      let integration;
      if (isEdit) {
        integration = await window.db.integrations.update(editing.id, form);
      } else {
        integration = await window.db.integrations.create({ ...form, scope: "read" });
      }
      // Auto-sync immediately if it's not the manual placeholder
      if (integration && connector.id !== "manual") {
        try {
          await window.connectors.sync(integration);
          window.__toast?.(`${connector.label} connected and synced.`);
        } catch (e) {
          await window.db.integrations.markError(integration.id, e.message || String(e));
          window.__toast?.(`Connected, but sync failed: ${e.message}`, "warn");
        }
      } else {
        window.__toast?.(`${connector.label} connected.`);
      }
      window.__bumpRev?.();
      onClose();
    } catch (e) {
      setTestStatus({ ok: false, message: e.message || String(e) });
    } finally { setSubmitting(false); }
  };

  const needs = connector.needs || [];

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={`${isEdit ? "Edit" : "Connect"} ${connector.label}`}
      subtitle={connector.kind}
      header={
        <div className="row gap-3" style={{ marginTop: 12 }}>
          <ProviderBadge id={connector.id} size={48} />
          <div className="col" style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: 12 }}>{connector.asset}</div>
            {connector.docsUrl && (
              <a href={connector.docsUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--ink-2)", textDecoration: "underline", marginTop: 2 }}>
                Where to create the key →
              </a>
            )}
          </div>
        </div>
      }
      footer={
        <div className="row between" style={{ width: "100%" }}>
          <button className="btn" onClick={test} disabled={testing || submitting || needs.length === 0}>
            {testing ? "Testing…" : "Test connection"}
          </button>
          <div className="row gap-2">
            <button className="btn" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="btn primary" onClick={submit} disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Connect & sync"}
            </button>
          </div>
        </div>
      }
    >
      {connector.notes && (
        <div className="card" style={{ marginBottom: 16, padding: 12, background: "var(--canvas)", border: "1px dashed var(--line-2)" }}>
          <div className="row gap-2" style={{ alignItems: "flex-start" }}>
            <span style={{ marginTop: 2 }}><Icon name="shieldCheck" size={14} /></span>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{connector.notes}</div>
          </div>
        </div>
      )}

      <FormSection title="Connection">
        <Field label="Label" hint="A nickname so you can tell connections apart later.">
          <Input value={form.label || ""} onChange={(v) => set("label", v)} placeholder={`${connector.label} · main`} />
        </Field>

        {needs.includes("endpoint") && (
          <Field label="Gateway URL" required hint="e.g. https://localhost:5000/v1/api">
            <Input value={form.endpoint || ""} onChange={(v) => set("endpoint", v)} placeholder="https://localhost:5000/v1/api" />
          </Field>
        )}

        {needs.includes("apiKey") && (
          <Field label="API Key" required>
            <Input value={form.apiKey || ""} onChange={(v) => set("apiKey", v)} placeholder="paste key here" />
          </Field>
        )}

        {needs.includes("apiSecret") && (
          <Field label="API Secret" required hint="Stored in your private Supabase row. Use a READ-ONLY key.">
            <Input value={form.apiSecret || ""} onChange={(v) => set("apiSecret", v)} placeholder="paste secret here" type="password" />
          </Field>
        )}

        {needs.includes("passphrase") && (
          <Field label="Passphrase" required>
            <Input value={form.passphrase || ""} onChange={(v) => set("passphrase", v)} placeholder="if your key requires one" type="password" />
          </Field>
        )}

        {needs.length === 0 && (
          <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>
            This provider doesn't need credentials. Click <b style={{ color: "var(--ink)" }}>Connect</b> to enable it
            and add positions manually via <b style={{ color: "var(--ink)" }}>+ New trade</b>.
          </div>
        )}
      </FormSection>

      {testStatus && (
        <div className={`card`} style={{
          marginTop: 16, padding: 14,
          border: `1px solid ${testStatus.ok ? "var(--positive)" : "var(--negative)"}`,
          background: testStatus.ok ? "color-mix(in srgb, var(--positive) 8%, transparent)" : "color-mix(in srgb, var(--negative) 8%, transparent)",
        }}>
          <div className="row gap-3" style={{ alignItems: "flex-start" }}>
            <Icon name={testStatus.ok ? "check" : "alert"} size={16} />
            <div className="col" style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {testStatus.ok ? "Connection successful" : "Connection failed"}
              </div>
              <div className="mono muted" style={{ fontSize: 11, marginTop: 4, whiteSpace: "pre-wrap" }}>
                {testStatus.ok ? JSON.stringify(testStatus.info, null, 2) : testStatus.message}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 14, background: "var(--surface-2)" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>What syncs?</div>
        <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
          When connected, this account's positions and balances will populate the Trading desk
          (and feed into your Net Worth). Manual positions are kept separate — re-syncing
          won't overwrite anything you've entered by hand.
        </div>
      </div>
    </SidePanel>
  );
};

// ---------- Integrations screen ----------
const IntegrationsScreen = () => {
  const [modalProvider, setModalProvider] = React.useState(null); // provider id or null
  const [editing, setEditing] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);

  const catalog = window.connectors?.list?.() || [];
  const live = window.integrations || [];

  const positionsBySource = React.useMemo(() => {
    const map = new Map();
    (window.tradingPositions || []).forEach((p) => {
      if (!p.integrationId) return;
      map.set(p.integrationId, (map.get(p.integrationId) || 0) + 1);
    });
    return map;
  }, [live.length, (window.tradingPositions || []).length, window.__rev]);

  const sync = async (integ) => {
    setBusyId(integ.id);
    try {
      await window.connectors.sync(integ);
      window.__toast?.(`${integ.label || integ.provider} synced.`);
    } catch (e) {
      await window.db.integrations.markError(integ.id, e.message || String(e));
      window.__toast?.(`${integ.label || integ.provider} sync failed: ${e.message}`, "warn");
    } finally {
      setBusyId(null);
      window.__bumpRev?.();
    }
  };

  const disconnect = async (integ) => {
    if (!confirm(`Disconnect ${integ.label || integ.provider}? Synced positions from this account will be removed; manual entries are kept.`)) return;
    setBusyId(integ.id);
    try {
      await window.db.integrations.remove(integ.id);
      window.__toast?.(`${integ.label || integ.provider} disconnected.`);
    } catch (e) {
      window.__toast?.(e.message || "Could not disconnect.", "warn");
    } finally {
      setBusyId(null);
      window.__bumpRev?.();
    }
  };

  const fmtRel = (iso) => {
    if (!iso) return "never";
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} d ago`;
  };

  return (
    <div className="fade-in" data-screen-label="09 Integrations">
      <Topbar title="Integrations" subtitle="Connected accounts" />
      <div className="content">
        {/* Hero / explainer */}
        <div className="card pad-lg" style={{ marginBottom: 24 }}>
          <div className="row between" style={{ alignItems: "flex-start", gap: 24 }}>
            <div style={{ maxWidth: 580 }}>
              <div className="eyebrow">External accounts</div>
              <div className="h-section" style={{ marginTop: 6 }}>Pull live positions from your brokers and exchanges.</div>
              <div className="muted" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6 }}>
                Add read-only API keys for the platforms you use. Once linked, your holdings appear on
                the Trading desk with a source badge and contribute to your net worth. We never store
                trade or withdrawal credentials — use keys with <b style={{ color: "var(--ink)" }}>view-only</b> permission.
              </div>
            </div>
            <div className="col" style={{ textAlign: "right", gap: 8, minWidth: 180 }}>
              <div className="eyebrow">Status</div>
              <div className="h-section">{live.length} connected</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {(window.tradingPositions || []).filter((p) => p.integrationId).length} synced position{(window.tradingPositions || []).filter((p) => p.integrationId).length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>

        {/* Connected list */}
        {live.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Connected</div>
            <div className="col gap-3">
              {live.map((i) => {
                const c = catalog.find((cc) => cc.id === i.provider);
                const positions = positionsBySource.get(i.id) || 0;
                const statusColor = i.status === "error" ? "var(--negative)" : i.status === "paused" ? "var(--warn)" : "var(--positive)";
                return (
                  <div key={i.id} className="card" style={{ padding: 18 }}>
                    <div className="row between" style={{ gap: 18, flexWrap: "wrap" }}>
                      <div className="row gap-3" style={{ alignItems: "center" }}>
                        <ProviderBadge id={i.provider} />
                        <div className="col" style={{ minWidth: 0 }}>
                          <div className="row gap-2" style={{ alignItems: "center" }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{i.label || c?.label || i.provider}</span>
                            <span className="chip" style={{ background: "color-mix(in srgb, " + statusColor + " 15%, transparent)", color: statusColor, fontSize: 11 }}>
                              <span className="dot" style={{ background: statusColor }} />
                              {i.status === "error" ? "Sync error" : i.status === "paused" ? "Paused" : "Connected"}
                            </span>
                          </div>
                          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                            {c?.kind || i.provider} · last sync {fmtRel(i.lastSyncAt)} · {positions} position{positions === 1 ? "" : "s"}
                          </div>
                          {i.status === "error" && i.lastSyncStatus && (
                            <div className="neg mono" style={{ fontSize: 11, marginTop: 4 }}>
                              {i.lastSyncStatus}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="row gap-2">
                        <button className="btn sm" onClick={() => sync(i)} disabled={busyId === i.id || c?.id === "manual"}>
                          <Icon name="refresh" size={12} />{busyId === i.id ? "Syncing…" : "Sync now"}
                        </button>
                        <button className="btn sm" onClick={() => { setEditing(i); setModalProvider(i.provider); }} disabled={busyId === i.id}>
                          <Icon name="settings" size={12} />Edit
                        </button>
                        <button className="btn sm" onClick={() => disconnect(i)} disabled={busyId === i.id}>
                          <Icon name="x" size={12} />Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available providers */}
        <div className="eyebrow" style={{ marginBottom: 14 }}>Available</div>
        <div className="grid-3" style={{ gap: 18 }}>
          {catalog.map((c) => {
            const connectedHere = live.find((i) => i.provider === c.id);
            return (
              <div key={c.id} className="card pad-lg" style={{ display: "flex", flexDirection: "column" }}>
                <div className="row gap-3" style={{ alignItems: "center", marginBottom: 14 }}>
                  <ProviderBadge id={c.id} size={42} />
                  <div className="col" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{c.label}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{c.kind}</div>
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.6, flex: 1 }}>
                  {c.asset}
                </div>
                {c.requiresGateway && (
                  <div className="chip warn" style={{ fontSize: 11, marginTop: 12, alignSelf: "flex-start" }}>
                    <Icon name="alert" size={11} /> Requires local gateway
                  </div>
                )}
                <div className="row gap-2" style={{ marginTop: 16 }}>
                  {connectedHere ? (
                    <>
                      <button className="btn sm" disabled style={{ flex: 1 }}>
                        <Icon name="check" size={12} />Connected
                      </button>
                      <button className="btn sm primary" onClick={() => { setEditing(null); setModalProvider(c.id); }}>
                        + Another
                      </button>
                    </>
                  ) : (
                    <button className="btn sm primary" style={{ flex: 1 }} onClick={() => { setEditing(null); setModalProvider(c.id); }}>
                      <Icon name="plus" size={12} />Connect
                    </button>
                  )}
                  {c.docsUrl && (
                    <a href={c.docsUrl} target="_blank" rel="noreferrer" className="btn sm" title="Open provider docs">
                      <Icon name="arrowRight" size={12} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming soon */}
        <div className="eyebrow" style={{ margin: "32px 0 14px" }}>Coming soon</div>
        <div className="grid-3" style={{ gap: 18 }}>
          {[
            { name: "Plaid (banks)", kind: "Bank balances · 12,000+ institutions", note: "Requires server-side relay (Plaid Link)" },
            { name: "WeWire commissions", kind: "Internal commission feed", note: "Webhook-based ingestion" },
            { name: "MetaMask / Wallets", kind: "On-chain holdings", note: "WalletConnect integration" },
          ].map((p) => (
            <div key={p.name} className="card pad-lg" style={{ opacity: 0.6 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{p.kind}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 12, fontStyle: "italic" }}>{p.note}</div>
            </div>
          ))}
        </div>
      </div>

      <IntegrationFormPanel
        open={!!modalProvider}
        providerId={modalProvider}
        editing={editing}
        onClose={() => { setModalProvider(null); setEditing(null); }}
      />
    </div>
  );
};

window.IntegrationsScreen = IntegrationsScreen;
window.IntegrationFormPanel = IntegrationFormPanel;
window.ProviderBadge = ProviderBadge;
