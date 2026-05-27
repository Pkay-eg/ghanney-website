// =========================================================
// Login screen — Supabase Auth
// =========================================================

const LoginScreen = ({ onSignIn }) => {
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [fullName, setFullName] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const configured = window.db?.isConfigured?.();

  const submit = async (e) => {
    e?.preventDefault();
    setErr(""); setInfo("");

    if (!configured) {
      setErr("Backend not configured yet. Add your Supabase URL + anon key in config.js, then redeploy.");
      return;
    }
    if (mode !== "reset" && !pass) { setErr("Enter your passphrase to continue."); return; }
    if (!email) { setErr("Enter your email."); return; }

    setSubmitting(true);
    try {
      if (mode === "signin") {
        await window.db.auth.signInWithPassword(email.trim(), pass);
        onSignIn();
      } else if (mode === "signup") {
        await window.db.auth.signUp(email.trim(), pass, fullName.trim() || undefined);
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        setPass("");
      } else if (mode === "reset") {
        await window.db.auth.resetPasswordForEmail(email.trim());
        setInfo("If that email exists, a reset link is on its way.");
        setMode("signin");
      }
    } catch (e) {
      setErr(e?.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const titleLine = mode === "signup"
    ? <>Open the portal.<br /><span className="muted" style={{ fontWeight: 400 }}>One account for everything.</span></>
    : mode === "reset"
    ? <>Forgot it?<br /><span className="muted" style={{ fontWeight: 400 }}>We'll send a reset link.</span></>
    : <>Welcome back.<br /><span className="muted" style={{ fontWeight: 400 }}>Eleven things waiting for you.</span></>;

  return (
    <div className="login-shell fade-in" data-screen-label="00 Login">
      <div className="login-pane">
        <div className="row gap-3" style={{ alignItems: "baseline", flexWrap: "nowrap" }}>
          <div className="serif" style={{ fontSize: 26, letterSpacing: "-0.02em", flexShrink: 0 }}>
            ghanney<span style={{ color: "var(--positive)" }}>.</span>
          </div>
          <div className="tag" style={{ whiteSpace: "nowrap" }}>private portal · v3.2</div>
        </div>

        <form className="login-form" onSubmit={submit}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>app.ghanney.com</div>
          <h1>{titleLine}</h1>
          <p className="lede">
            {mode === "signup"
              ? "Create your owner account. You can invite the team afterwards."
              : mode === "reset"
              ? "Enter the email you sign in with. We'll send a reset link."
              : "This portal is private. Sign in to review today's flow, scheduled payments, and active projects."}
          </p>

          {mode === "signup" && (
            <div className="field">
              <label>Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" autoComplete="name" />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@example.com" autoComplete="email" />
          </div>

          {mode !== "reset" && (
            <div className="field" style={{ position: "relative" }}>
              <label>Passphrase</label>
              <input
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => { setPass(e.target.value); setErr(""); }}
                placeholder="••••••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: "absolute", right: 12, bottom: 11, color: "var(--muted)" }}
                aria-label="toggle visibility"
              >
                <Icon name={show ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
          )}

          {err && <div className="chip neg" style={{ marginBottom: 10 }}>{err}</div>}
          {info && <div className="chip pos" style={{ marginBottom: 10 }}>{info}</div>}

          {mode === "signin" && (
            <div className="row between" style={{ marginTop: 4, marginBottom: 18 }}>
              <label className="row gap-2" style={{ fontSize: 12, color: "var(--muted)" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--ink)" }} />
                Trust this device for 30 days
              </label>
              <a className="muted" style={{ fontSize: 12, cursor: "pointer" }} onClick={() => { setMode("reset"); setErr(""); setInfo(""); }}>Forgot?</a>
            </div>
          )}

          <button className="login-cta" type="submit" disabled={submitting}>
            {submitting ? "Verifying…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
            <Icon name="arrowRight" size={14} />
          </button>

          <div className="row gap-3" style={{ marginTop: 18, color: "var(--muted)", fontSize: 11.5 }}>
            <Icon name="lock" size={12} />
            <span>End-to-end encrypted · {configured ? "Supabase Auth · sessions persisted locally" : "Backend not configured"}</span>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: "var(--muted-2)" }}>
            {mode === "signin" ? (
              <>No account? <a style={{ cursor: "pointer", color: "var(--ink)" }} onClick={() => { setMode("signup"); setErr(""); setInfo(""); }}>Create one →</a></>
            ) : (
              <a style={{ cursor: "pointer", color: "var(--ink)" }} onClick={() => { setMode("signin"); setErr(""); setInfo(""); }}>← Back to sign in</a>
            )}
          </div>
        </form>

        <div className="row between" style={{ color: "var(--muted)", fontSize: 11 }}>
          <span>© 2026 ghanney holdings</span>
          <span className="mono">accra · dubai</span>
        </div>
      </div>

      <div className="login-art">
        <LoginArt />
      </div>
    </div>
  );
};

// Decorative side panel — a "live tape" showing tickers, recent activity
const LoginArt = () => {
  // Use real data if available, else fall back to seed
  const series = (window.netWorthMonthly || []).map((p) => p.value).filter((v) => v > 0);
  const current = series.length ? series[series.length - 1] : 1684500;
  const prior = series.length > 1 ? series[series.length - 2] : 1612000;
  const delta = current - prior;

  return (
    <div style={{ padding: 56, width: "100%", maxWidth: 520 }}>
      <div className="card pad-lg" style={{ background: "var(--surface-2)" }}>
        <div className="row between" style={{ marginBottom: 18 }}>
          <div className="eyebrow">Last close · {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</div>
          <div className="row gap-2" style={{ fontSize: 11, color: "var(--positive)" }}>
            <span className="dot pos" />Markets calm
          </div>
        </div>

        <div className="serif" style={{ fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}>
          ${Math.round(current).toLocaleString()}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          Net worth · <span className={delta >= 0 ? "pos" : "neg"}>{delta >= 0 ? "+" : ""}${Math.round(delta).toLocaleString()}</span> this month
        </div>

        <div style={{ margin: "24px 0 6px" }}>
          <Sparkline
            data={series.length ? series : [1180, 1212, 1248, 1295, 1340, 1382, 1428, 1455, 1502, 1568, 1612, 1684]}
            color="var(--positive)" fill height={68} strokeW={1.8}
          />
        </div>

        <div className="hr" style={{ margin: "18px 0" }} />

        <div className="col gap-3">
          {(window.tradingTickers || []).slice(0, 3).map((t) => (
            <div key={t.sym} className="row between">
              <span className="muted" style={{ fontSize: 12 }}>{t.sym}</span>
              <span className="mono" style={{ fontSize: 12 }}>
                {t.price < 10 ? t.price.toFixed(4) : "$" + t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className={t.delta >= 0 ? "pos" : "neg"}>{t.delta >= 0 ? "+" : ""}{(t.delta || 0).toFixed(2)}%</span>
              </span>
            </div>
          ))}
        </div>

        <div className="hr" style={{ margin: "18px 0" }} />

        <div className="eyebrow" style={{ marginBottom: 10 }}>Coming up</div>
        <div className="col gap-3">
          {(window.upcoming || []).slice(0, 2).map((u, i) => (
            <div key={i} className="row between">
              <span style={{ fontSize: 12 }}>
                <span className={`dot ${u.cls === "warn" ? "warn" : u.cls === "pos" ? "pos" : "neg"}`} style={{ marginRight: 8 }} />
                {u.k} — {u.who}
              </span>
              <span className="mono" style={{ fontSize: 12 }}>
                {u.ccy === "USD" ? "$" : u.ccy === "GHS" ? "₵" : u.ccy === "AED" ? "د.إ " : ""}{u.amt.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="row between" style={{ marginTop: 18, padding: "0 4px", color: "var(--muted)", fontSize: 11 }}>
        <span className="mono">acc·gh / dxb·uae</span>
        <span className="mono">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
