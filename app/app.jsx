// =========================================================
// App — auth state + router + tweaks integration
// =========================================================

const App = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [me, setMe] = useState(null);
  const [hydrating, setHydrating] = useState(false);
  const [route, setRoute] = useState({ page: "overview", id: null });
  const [showCmd, setShowCmd] = useState(false);
  const [openForm, setOpenForm] = useState(null);   // { type: "investment" | "loan" | ..., props?: {} }
  const [toast, setToast] = useState(null);
  const [, bumpRev] = React.useReducer((x) => x + 1, 0);

  // Expose form openers + state-bump + toast to all babel scripts
  window.__openForm = (type, props = {}) => setOpenForm({ type, props });
  window.__closeForm = () => setOpenForm(null);
  window.__bumpRev = bumpRev;
  window.__me = me;
  window.__myInfo = () => {
    const u = window.__me;
    if (!u) return { name: "", first: "", initials: "?", email: "", role: "Member", location: "" };
    // Try profile from window.team first (loaded from DB), else fall back to auth metadata.
    const profile = (window.team || []).find((m) => m.email === u.email) || null;
    const fullName =
      profile?.name ||
      u.user_metadata?.full_name ||
      (u.email ? u.email.split("@")[0] : "User");
    const parts = fullName.trim().split(/\s+/);
    const rawFirst = parts[0] || "there";
    const first = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1);
    const initials =
      profile?.initials ||
      parts.map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() ||
      "U";
    return {
      name: fullName,
      first,
      initials,
      email: u.email,
      role: profile?.role || "Owner",
      location: profile?.location || "",
    };
  };
  window.__toast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // Bootstrap auth + listen for changes
  useEffect(() => {
    if (!window.db?.isConfigured?.()) {
      setAuthReady(true);
      return;
    }
    window.db.auth.getSession().then(async (session) => {
      if (session?.user) {
        setMe(session.user);
        setHydrating(true);
        await window.db.hydrate();
        setHydrating(false);
        setSignedIn(true);
      }
      setAuthReady(true);
    });
    const off = window.db.auth.onChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setMe(null);
        setSignedIn(false);
      } else if (session?.user) {
        setMe(session.user);
      }
    });
    return off;
  }, []);

  const handleSignIn = async () => {
    setHydrating(true);
    if (window.db?.isConfigured?.()) {
      const session = await window.db.auth.getSession();
      if (session?.user) setMe(session.user);
      await window.db.hydrate();
      bumpRev();
    }
    setHydrating(false);
    setSignedIn(true);
  };

  const handleSignOut = async () => {
    await window.db?.auth?.signOut?.();
    setSignedIn(false);
    setMe(null);
  };

  // Tweaks — default values
  const DEFAULTS = /*EDITMODE-BEGIN*/{
    "layout": "executive",
    "nav": "sidebar",
    "theme": "default",
    "showBalances": true,
    "investDisplay": "cards",
    "accent": "#3B5D3A",
    "displayCurrency": "USD"
  }/*EDITMODE-END*/;

  const [t, setTweak] = useTweaks(DEFAULTS);

  // Expose currency setter for topbar / switcher buttons
  window.__setDisplayCurrency = (v) => setTweak("displayCurrency", v);

  // Apply theme
  useEffect(() => {
    document.body.setAttribute("data-theme", t.theme === "default" ? "" : t.theme);
    // Accent palette tweak — derive matching tones from selected accent
    const accentMap = {
      "#3B5D3A": { soft: "#E6EEDF", deep: "#2E4A3A" },
      "#2A5A8A": { soft: "#DCE7F2", deep: "#274C73" },
      "#9C5A2A": { soft: "#F2DCC5", deep: "#7A4421" },
      "#6E3A66": { soft: "#ECD9E8", deep: "#5C2F55" },
    };
    const a = accentMap[t.accent] || accentMap["#3B5D3A"];
    document.documentElement.style.setProperty("--positive", t.accent);
    document.documentElement.style.setProperty("--positive-soft", a.soft);
    document.documentElement.style.setProperty("--accent", a.deep);
  }, [t.theme, t.accent]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmd((s) => !s);
      }
      if (e.key === "Escape") setShowCmd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Expose investment display setter so InvestmentsList can change it from header toggle
  window.__setInvestDisplay = (v) => setTweak("investDisplay", v);

  const nav = (page, id = null) => {
    setRoute({ page, id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  window.__nav = nav;

  // Render the form currently open
  const renderForm = () => {
    if (!openForm) return null;
    const close = () => setOpenForm(null);
    switch (openForm.type) {
      case "investment":  return <InvestmentForm onClose={close} />;
      case "loan":        return <LoanForm onClose={close} />;
      case "trade":       return <TradeForm onClose={close} {...(openForm.props || {})} />;
      case "project":     return <ProjectForm onClose={close} />;
      case "income":      return <IncomeForm onClose={close} />;
      case "payment":     return <PaymentForm onClose={close} {...(openForm.props || {})} />;
      case "contract":    return <ContractForm onClose={close} {...(openForm.props || {})} />;
      case "site-update": return <SiteUpdateForm onClose={close} {...(openForm.props || {})} />;
      case "team":        return <TeamInviteForm onClose={close} />;
      case "team-edit":   return <TeamInviteForm onClose={close} {...(openForm.props || {})} />;
      case "integration": return (
        <IntegrationFormPanel
          open
          providerId={openForm.props?.providerId || "binance"}
          editing={openForm.props?.editing || null}
          onClose={close}
        />
      );
      default: return null;
    }
  };

  // Toast layer
  const toastEl = toast && (
    <div style={{
      position: "fixed",
      bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: "var(--ink)", color: "var(--surface)",
      padding: "10px 18px", borderRadius: 999,
      fontSize: 13, zIndex: 200,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      display: "flex", alignItems: "center", gap: 10,
      animation: "fadeIn 200ms ease",
    }}>
      <span className="dot" style={{ background: "var(--negative)" }} />
      {toast}
    </div>
  );

  if (!authReady) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--canvas)" }}>
        <div className="muted" style={{ fontSize: 13 }}>Loading portal…</div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <CurrencyContext.Provider value={t.displayCurrency}>
        <LoginScreen onSignIn={handleSignIn} />
        <TweaksPanel title="Tweaks">
          <TweakSection label="Visual">
            <TweakRadio label="Theme" value={t.theme} onChange={(v) => setTweak("theme", v)}
              options={[
                { value: "default", label: "Warm" },
                { value: "paper", label: "Paper" },
                { value: "ink", label: "Ink" },
              ]} />
            <TweakColor label="Accent" value={t.accent} onChange={(v) => setTweak("accent", v)}
              options={["#3B5D3A", "#2A5A8A", "#9C5A2A", "#6E3A66"]} />
          </TweakSection>
          <TweakSection label="About">
            <div style={{ fontSize: 11, color: "rgba(41,38,27,.55)", padding: "0 2px", lineHeight: 1.5 }}>This portal is connected to a private Supabase backend. Sign in with your account to see your real data.</div>
          </TweakSection>
        </TweaksPanel>
      </CurrencyContext.Provider>
    );
  }

  if (hydrating) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--canvas)" }}>
        <div className="col gap-3" style={{ alignItems: "center" }}>
          <div className="serif" style={{ fontSize: 28 }}>ghanney<span style={{ color: "var(--positive)" }}>.</span></div>
          <div className="muted" style={{ fontSize: 13 }}>Loading your portfolio…</div>
        </div>
      </div>
    );
  }

  const ShellWrap = ({ children }) => {
    if (t.nav === "topnav") {
      return (
        <div>
          <TopNav active={route.page} onNav={(p) => nav(p)} />
          <div>{children}</div>
        </div>
      );
    }
    return (
      <div className={`app ${t.nav === "rail" ? "nav-rail" : ""}`}>
        <Sidebar active={route.page} onNav={(p) => nav(p)} mode={t.nav === "rail" ? "rail" : "full"} />
        <div>{children}</div>
      </div>
    );
  };

  const page = route.page;

  return (
    <CurrencyContext.Provider value={t.displayCurrency}>
      <ShellWrap>
        {page === "overview"    && <Dashboard layout={t.layout} onNav={nav} showSensitive={t.showBalances} />}
        {page === "income"      && <IncomeScreen />}
        {page === "investments" && <InvestmentsList onNav={nav} display={t.investDisplay} focused={route.id} />}
        {page === "trading"     && <TradingScreen />}
        {page === "loans"       && <LoansScreen onNav={nav} focused={route.id} />}
        {page === "projects"    && <ProjectsScreen />}
        {page === "contracts"   && <ContractsScreen onNav={nav} focused={route.id} />}
        {page === "networth"     && <NetWorthScreen />}
        {page === "team"         && <TeamScreen />}
        {page === "integrations" && <IntegrationsScreen />}
      </ShellWrap>

      <CommandPalette
        open={showCmd}
        onClose={() => setShowCmd(false)}
        onNav={(p) => { nav(p); setShowCmd(false); }}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Display currency">
          <TweakRadio label="Show in" value={t.displayCurrency} onChange={(v) => setTweak("displayCurrency", v)}
            options={[
              { value: "USD", label: "USD" },
              { value: "GHS", label: "GHS" },
              { value: "AED", label: "AED" },
            ]} />
        </TweakSection>

        <TweakSection label="Dashboard layout">
          <TweakRadio label="Style" value={t.layout} onChange={(v) => setTweak("layout", v)}
            options={[
              { value: "executive", label: "Executive" },
              { value: "operator",  label: "Operator" },
              { value: "calm",      label: "Calm" },
            ]} />
        </TweakSection>

        <TweakSection label="Navigation">
          <TweakRadio label="Pattern" value={t.nav} onChange={(v) => setTweak("nav", v)}
            options={[
              { value: "sidebar", label: "Sidebar" },
              { value: "topnav",  label: "Top nav" },
              { value: "rail",    label: "Rail" },
            ]} />
        </TweakSection>

        <TweakSection label="Investments display">
          <TweakRadio label="Layout" value={t.investDisplay} onChange={(v) => setTweak("investDisplay", v)}
            options={[
              { value: "cards", label: "Cards" },
              { value: "table", label: "Table" },
              { value: "map",   label: "Map" },
            ]} />
        </TweakSection>

        <TweakSection label="Visual">
          <TweakRadio label="Theme" value={t.theme} onChange={(v) => setTweak("theme", v)}
            options={[
              { value: "default", label: "Warm" },
              { value: "paper", label: "Paper" },
              { value: "ink", label: "Ink" },
            ]} />
          <TweakColor label="Accent" value={t.accent} onChange={(v) => setTweak("accent", v)}
            options={["#3B5D3A", "#2A5A8A", "#9C5A2A", "#6E3A66"]} />
          <TweakToggle label="Show balances" value={t.showBalances} onChange={(v) => setTweak("showBalances", v)} />
        </TweakSection>

        <TweakSection label="Session">
          {me && <div style={{ fontSize: 11, color: "var(--muted)", padding: "0 2px", marginBottom: 8 }}>{me.email}</div>}
          <TweakButton label="Sign out" onClick={handleSignOut} />
        </TweakSection>
      </TweaksPanel>

      {renderForm()}
      {toastEl}
    </CurrencyContext.Provider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
