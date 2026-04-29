// crm.jsx — submission + admin CRM
const { useState: useState_crm, useEffect: useEffect_crm, useMemo: useMemo_crm } = React;

// ── Configuration ─────────────────────────────────────────────
// Supabase is used as the backend. The client is initialized in index.html:
//   window.__supabase = supabase.createClient(URL, ANON_KEY);
// Table: "rsvps" with columns: id, created_at, code, name, phone, email,
//   attend, guests, guest_names, message, tier, type, step_reached, session_id, source
// While developing or before Supabase is configured, submissions fall back
// to localStorage so the CRM can still demonstrate the flow.

const LS_KEY = "pkay30_rsvps_v1";
const LS_PARTIAL_KEY = "pkay30_partials_v1";
const LS_AUTH_KEY = "pkay30_auth_v1";
const LS_USERS_KEY = "pkay30_users_v1";
const LS_SESSION_KEY = "pkay30_session_v1";

// ── Default admin credentials (SHA-256 hashed) ──────────────────
// Default: username "admin", password "pkay2026"
async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const DEFAULT_USERS = [
  { id: "u1", username: "admin", hash: "a]PLACEHOLDER[", role: "owner", created: "2026-04-29" },
];

function getUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_USERS_KEY));
    if (stored && stored.length > 0) return stored;
  } catch (e) {}
  return null;
}

function saveUsers(users) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

async function initUsers() {
  if (!getUsers()) {
    const hash = await hashPassword("pkay2026");
    saveUsers([{ id: "u1", username: "admin", hash, role: "owner", created: new Date().toISOString().slice(0, 10) }]);
  }
}

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SESSION_KEY));
    if (s && s.expires > Date.now()) return s;
    localStorage.removeItem(LS_SESSION_KEY);
  } catch (e) {}
  return null;
}

function setSession(user) {
  const s = { username: user.username, role: user.role, expires: Date.now() + 24 * 60 * 60 * 1000 };
  localStorage.setItem(LS_SESSION_KEY, JSON.stringify(s));
  return s;
}

function clearSession() {
  localStorage.removeItem(LS_SESSION_KEY);
}

// ── Partial RSVP tracking ────────────────────────────────────────
// Captures every step transition so even incomplete submissions are visible.
function savePartialRSVP(data, stepReached) {
  try {
    const partials = JSON.parse(localStorage.getItem(LS_PARTIAL_KEY) || "[]");
    const sid = data._sessionId;
    const existing = partials.findIndex(p => p._sessionId === sid);
    const record = {
      ...data,
      _sessionId: sid,
      _stepReached: stepReached,
      _lastUpdate: new Date().toISOString(),
      _completed: false,
    };
    if (existing >= 0) {
      partials[existing] = record;
    } else {
      partials.unshift(record);
    }
    localStorage.setItem(LS_PARTIAL_KEY, JSON.stringify(partials.slice(0, 500)));
    // Save partial to Supabase (non-blocking). Only insert once per session (step 0).
    const sb = window.__supabase;
    if (sb && stepReached === 0) {
      sb.from("rsvps").insert({
        session_id: sid,
        code: record.code || null,
        name: record.name || null,
        phone: record.phone || null,
        email: record.email || null,
        attend: record.attend || null,
        guests: Number(record.guests) || 0,
        guest_names: Array.isArray(record.guestNames) ? record.guestNames.join(", ") : (record.guestNames || null),
        message: record.message || null,
        tier: record.tier || null,
        type: "partial",
        step_reached: stepReached,
        source: "ghanney.com/pkay30",
      }).then(({ error }) => {
        if (error) console.warn("[pkay30] Supabase partial insert:", error.message);
      });
    }
  } catch (e) {}
}

function markPartialComplete(sessionId) {
  try {
    const partials = JSON.parse(localStorage.getItem(LS_PARTIAL_KEY) || "[]");
    const idx = partials.findIndex(p => p._sessionId === sessionId);
    if (idx >= 0) {
      partials[idx]._completed = true;
      localStorage.setItem(LS_PARTIAL_KEY, JSON.stringify(partials));
    }
  } catch (e) {}
}

function loadPartialRSVPs() {
  try { return JSON.parse(localStorage.getItem(LS_PARTIAL_KEY) || "[]"); }
  catch (e) { return []; }
}

function generateSessionId() {
  return "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// ── Full RSVP submission ─────────────────────────────────────────
async function submitRSVP(payload) {
  const record = { ...payload, ts: new Date().toISOString() };
  if (payload._sessionId) markPartialComplete(payload._sessionId);
  try {
    const cur = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    cur.unshift(record);
    localStorage.setItem(LS_KEY, JSON.stringify(cur.slice(0, 500)));
  } catch (e) {}
  const sb = window.__supabase;
  if (!sb) {
    return { ok: true, mocked: true, record };
  }
  try {
    const row = {
      code: record.code || null,
      name: record.name || null,
      phone: record.phone || null,
      email: record.email || null,
      attend: record.attend || null,
      guests: Number(record.guests) || 0,
      guest_names: Array.isArray(record.guestNames) ? record.guestNames.join(", ") : (record.guestNames || null),
      message: record.message || null,
      tier: record.tier || null,
      type: "completed",
      step_reached: null,
      session_id: (payload._sessionId || "") + "_done",
      source: "ghanney.com/pkay30",
    };
    const { error } = await sb.from("rsvps").insert(row);
    if (error) {
      console.warn("[pkay30] Supabase submit error:", error.message);
      return { ok: false, mocked: true, record, error: error.message };
    }
    return { ok: true, record };
  } catch (e) {
    console.warn("Supabase submit failed; using local mirror.", e);
    return { ok: false, mocked: true, record, error: String(e) };
  }
}

function loadLocalRSVPs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch (e) { return []; }
}

async function loadSupabaseRSVPs() {
  const sb = window.__supabase;
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from("rsvps")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.warn("Supabase fetch error:", error.message); return null; }
    return data || [];
  } catch (e) { return null; }
}

// ── Dress Code Badge — used across surfaces ──────────────────
function DressCodeBadge({ compact = false }) {
  if (compact) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 14px", borderRadius: 999,
        border: "1px solid var(--gold)",
        background: "linear-gradient(180deg, rgba(201,165,92,0.18), rgba(74,13,24,0.3))",
        color: "var(--gold-bright)",
        fontFamily: "Manrope, sans-serif", fontSize: 10,
        letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 600,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 4px rgba(201,165,92,0.2)" }} />
        Dress code · Black tie + Mask
      </div>
    );
  }
  return (
    <div style={{
      position: "relative",
      borderRadius: 12,
      padding: "20px 22px",
      background: "linear-gradient(180deg, rgba(201,165,92,0.14) 0%, rgba(74,13,24,0.35) 100%)",
      border: "1px solid var(--gold)",
      boxShadow: "0 0 0 1px rgba(201,165,92,0.3) inset, 0 12px 30px -10px rgba(0,0,0,0.7)",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(circle at 80% 0%, rgba(201,165,92,0.25), transparent 60%)",
      }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 52, height: 36, flexShrink: 0 }}>
          <img src="assets/mask.svg" style={{ width: "100%", height: "100%" }} alt="" />
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.32em", color: "var(--gold)", textTransform: "uppercase", fontWeight: 600 }}>
            Strict dress code
          </div>
          <div className="serif" style={{ fontSize: 26, lineHeight: 1.05, color: "var(--ivory)", marginTop: 4, letterSpacing: "-0.01em" }}>
            <span className="gold-text">Black Tie</span> + <span style={{ fontStyle: "italic" }}>Masquerade Mask</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--smoke)", marginTop: 8, letterSpacing: "0.04em", lineHeight: 1.5, fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 14 }}>
            No mask · no entry. Masks will be provided on arrival for those without one.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Strict Time Stamp ────────────────────────────────────────
function StrictTimeStamp({ size = "md" }) {
  const f = size === "lg" ? { p: "16px 28px", t: 13, n: 38 }
          : size === "sm" ? { p: "10px 18px", t: 9, n: 22 }
          :                 { p: "12px 22px", t: 11, n: 28 };
  return (
    <div style={{
      display: "inline-flex", flexDirection: "column", alignItems: "center",
      padding: f.p, borderRadius: 8,
      border: "1px solid var(--rose-deep)",
      background: "rgba(74,13,24,0.35)",
      whiteSpace: "nowrap",
    }}>
      <div style={{ fontSize: f.t, letterSpacing: "0.34em", color: "#e8c987", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" }}>
        Strictly
      </div>
      <div className="serif" style={{ fontSize: f.n, lineHeight: 1, color: "var(--ivory)", marginTop: 2, whiteSpace: "nowrap" }}>
        <span className="gold-text" style={{ whiteSpace: "nowrap" }}>7:00&nbsp;PM</span>
      </div>
      <div style={{ fontSize: 9, letterSpacing: "0.24em", color: "var(--smoke)", textTransform: "uppercase", marginTop: 6, whiteSpace: "nowrap" }}>
        Doors close at 7:30
      </div>
    </div>
  );
}

// ── Login Screen ─────────────────────────────────────────────
function LoginScreen({ onSuccess }) {
  const [username, setUsername] = useState_crm("");
  const [password, setPassword] = useState_crm("");
  const [error, setError] = useState_crm("");
  const [loading, setLoading] = useState_crm(false);

  React.useEffect(() => { initUsers(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const users = getUsers();
    if (!users) { setError("No users configured."); setLoading(false); return; }
    const hash = await hashPassword(password);
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.hash === hash);
    if (!user) { setError("Invalid username or password."); setLoading(false); return; }
    const session = setSession(user);
    setLoading(false);
    onSuccess(session);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ width: 80, height: 52, margin: "0 auto 20px" }}>
          <img src="assets/mask.svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 20px rgba(201,165,92,0.4))" }} alt="" />
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Admin Portal</div>
        <h2 className="serif" style={{ fontSize: 36, margin: "0 0 6px" }}>
          <span className="gold-text">Guest CRM</span>
        </h2>
        <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 16, marginBottom: 32 }}>
          Sign in to manage RSVPs
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ textAlign: "left" }}>
            <div className="field-label">Username</div>
            <input className="field" type="text" placeholder="Enter username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              autoComplete="username" autoFocus />
          </div>
          <div style={{ textAlign: "left" }}>
            <div className="field-label">Password</div>
            <input className="field" type="password" placeholder="Enter password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(217,60,60,0.15)", border: "1px solid rgba(217,60,60,0.4)", color: "#d97777", fontSize: 13, textAlign: "left" }}>
              {error}
            </div>
          )}

          <button className="btn-gold" type="submit" disabled={loading || !username || !password}
            style={{ marginTop: 8 }}>
            {loading ? "Verifying…" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: "var(--gold-deep)", letterSpacing: "0.2em" }}>
          PKAY · 30TH · ESTILO DE VIDA
        </div>
      </div>
    </div>
  );
}

// ── User Management Panel ────────────────────────────────────
function UserManagement({ currentUser, onBack }) {
  const [users, setUsersState] = useState_crm(getUsers() || []);
  const [newUser, setNewUser] = useState_crm("");
  const [newPass, setNewPass] = useState_crm("");
  const [newRole, setNewRole] = useState_crm("admin");
  const [msg, setMsg] = useState_crm("");

  const addUser = async (e) => {
    e.preventDefault();
    if (!newUser.trim() || !newPass.trim()) return;
    const existing = users.find(u => u.username.toLowerCase() === newUser.toLowerCase());
    if (existing) { setMsg("Username already exists."); return; }
    const hash = await hashPassword(newPass);
    const updated = [...users, {
      id: "u" + Date.now().toString(36),
      username: newUser.trim(),
      hash,
      role: newRole,
      created: new Date().toISOString().slice(0, 10),
    }];
    saveUsers(updated);
    setUsersState(updated);
    setNewUser(""); setNewPass("");
    setMsg("User added successfully.");
    setTimeout(() => setMsg(""), 3000);
  };

  const removeUser = (id) => {
    if (!confirm("Remove this user?")) return;
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
    setUsersState(updated);
  };

  const resetPassword = async (id) => {
    const pw = prompt("Enter new password for this user:");
    if (!pw) return;
    const hash = await hashPassword(pw);
    const updated = users.map(u => u.id === id ? { ...u, hash } : u);
    saveUsers(updated);
    setUsersState(updated);
    setMsg("Password reset successfully.");
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--ink)", color: "var(--ivory)", padding: "24px 20px 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div className="eyebrow">Admin</div>
            <h2 className="serif" style={{ fontSize: 32, margin: "6px 0 0" }}>
              <span className="gold-text">User Management</span>
            </h2>
          </div>
          <button className="btn-ghost" onClick={onBack}>← Back to CRM</button>
        </div>

        {msg && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(106,217,154,0.12)", border: "1px solid rgba(106,217,154,0.4)", color: "#6ad99a", fontSize: 13 }}>
            {msg}
          </div>
        )}

        {/* Existing users */}
        <div style={{ border: "1px solid var(--hair)", borderRadius: 12, overflow: "hidden", background: "var(--ink-2)", marginBottom: 28 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold-deep)", fontWeight: 600 }}>Username</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold-deep)", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold-deep)", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "12px 14px", textAlign: "right", fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--gold-deep)", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--hair)" }}>
                  <td style={{ padding: "14px", fontSize: 15 }}>
                    <span className="serif" style={{ color: "var(--ivory)" }}>{u.username}</span>
                    {u.username === currentUser.username && <span style={{ marginLeft: 8, fontSize: 10, color: "var(--gold)", letterSpacing: "0.2em" }}>(YOU)</span>}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, background: u.role === "owner" ? "rgba(201,165,92,0.18)" : "rgba(244,234,212,0.08)", color: u.role === "owner" ? "var(--gold)" : "var(--smoke)", border: `1px solid ${u.role === "owner" ? "var(--gold)" : "var(--hair)"}` }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px", fontSize: 13, color: "var(--smoke)" }}>{u.created}</td>
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => resetPassword(u.id)}
                        style={{ appearance: "none", background: "rgba(244,234,212,0.06)", border: "1px solid var(--hair)", borderRadius: 6, color: "var(--ivory)", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
                        Reset PW
                      </button>
                      {u.role !== "owner" && (
                        <button onClick={() => removeUser(u.id)}
                          style={{ appearance: "none", background: "rgba(217,60,60,0.1)", border: "1px solid rgba(217,60,60,0.3)", borderRadius: 6, color: "#d97777", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add new user form */}
        <div className="card-velvet" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Add New User</div>
          <form onSubmit={addUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div className="field-label">Username</div>
                <input className="field" placeholder="username" value={newUser}
                  onChange={(e) => setNewUser(e.target.value)} />
              </div>
              <div>
                <div className="field-label">Password</div>
                <input className="field" type="password" placeholder="password" value={newPass}
                  onChange={(e) => setNewPass(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="field-label">Role</div>
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                {["admin", "viewer"].map(r => (
                  <div key={r} className="choice" data-selected={newRole === r}
                    onClick={() => setNewRole(r)}
                    style={{ flex: 1, padding: "12px 16px", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-gold" type="submit" disabled={!newUser.trim() || !newPass.trim()}>
              Add User
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── CRM Admin View ───────────────────────────────────────────
function CRMView({ onClose }) {
  const [authed, setAuthed] = useState_crm(!!getSession());
  const [session, setSessionState] = useState_crm(getSession());
  const [view, setView] = useState_crm("crm");
  const [rows, setRows] = useState_crm([]);
  const [source, setSource] = useState_crm("local");
  const [filter, setFilter] = useState_crm("all");
  const [query, setQuery] = useState_crm("");
  const [loading, setLoading] = useState_crm(false);
  const [selected, setSelected] = useState_crm(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    let allRows = [];
    let src = "local";

    const sbData = await loadSupabaseRSVPs();
    if (sbData) {
      allRows = sbData.map(r => ({
        ts: r.created_at,
        code: r.code || "",
        name: r.name || "",
        phone: r.phone || "",
        email: r.email || "",
        attend: r.attend || "",
        guests: r.guests || 1,
        guestNames: r.guest_names ? r.guest_names.split(",").map(s => s.trim()).filter(Boolean) : [],
        message: r.message || "",
        tier: r.tier || "",
        _status: r.type === "partial" ? "partial" : "completed",
        _stepReached: r.step_reached,
      }));
      src = "supabase";
    } else {
      const local = loadLocalRSVPs().map(r => ({ ...r, _status: "completed" }));
      const partialList = loadPartialRSVPs().filter(p => !p._completed);
      const partialRows = partialList.map(p => ({
        ts: p._lastUpdate || p.ts,
        code: "",
        name: p.name || "",
        phone: p.phone || "",
        email: p.email || "",
        attend: p.attend || "",
        guests: p.guests || 1,
        guestNames: p.guestNames || [],
        message: p.message || "",
        tier: "",
        _status: "partial",
        _stepReached: p._stepReached,
      }));
      allRows = [...partialRows, ...local];
      src = "local";
    }

    setRows(allRows);
    setSource(src);
    setLoading(false);
  }, []);

  const filtered = useMemo_crm(() => {
    return rows.filter(r => {
      if (filter === "partial" && r._status !== "partial") return false;
      else if (filter !== "all" && filter !== "partial" && r.attend !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${r.name||""} ${r.phone||""} ${r.email||""} ${r.message||""} ${r.code||""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, query]);

  const stats = useMemo_crm(() => {
    let yes = 0, no = 0, maybe = 0, heads = 0, tier = 0, partial = 0;
    rows.forEach(r => {
      if (r._status === "partial") { partial++; return; }
      if (r.attend === "yes") { yes++; heads += Number(r.guests || 1); }
      else if (r.attend === "no") no++;
      else if (r.attend === "maybe") { maybe++; heads += Number(r.guests || 1); }
      tier += Number(r.tier || 0);
    });
    return { yes, no, maybe, heads, tier, total: rows.length, partial };
  }, [rows]);

  const STEP_LABELS = ["Opened RSVP", "Chose attendance", "Entered details", "Set guests", "Wrote message", "Contribution"];

  useEffect_crm(() => { initUsers(); }, []);
  useEffect_crm(() => { if (authed) refresh(); }, [authed]);

  const logout = () => { clearSession(); setAuthed(false); setSessionState(null); };

  if (!authed) {
    return <LoginScreen onSuccess={(s) => { setAuthed(true); setSessionState(s); }} />;
  }

  if (view === "users") {
    return <UserManagement currentUser={session} onBack={() => setView("crm")} />;
  }

  const exportCsv = () => {
    const cols = ["ts","code","name","phone","email","attend","guests","guestNames","message","tier"];
    const csv = [cols.join(",")].concat(rows.map(r =>
      cols.map(c => {
        const v = r[c];
        const s = Array.isArray(v) ? v.join("; ") : (v ?? "");
        return `"${String(s).replace(/"/g, '""')}"`;
      }).join(",")
    )).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pkay30-rsvps-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--ink)", color: "var(--ivory)", padding: "24px 20px 60px" }}>
      <style>{`
        .crm-table tr { border-bottom: 1px solid var(--hair); }
        .crm-table td, .crm-table th { padding: 12px 10px; text-align: left; vertical-align: top; font-size: 13px; }
        .crm-table th { font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--gold-deep); font-weight: 600; }
        .crm-row:hover { background: rgba(201,165,92,0.04); cursor: pointer; }
        .crm-pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; }
        .pill-yes { background: rgba(46,160,90,0.15); color: #6ad99a; border: 1px solid rgba(106,217,154,0.4); }
        .pill-no  { background: rgba(160,46,46,0.15); color: #d97777; border: 1px solid rgba(217,119,119,0.4); }
        .pill-maybe { background: rgba(201,165,92,0.15); color: var(--gold); border: 1px solid var(--hair-2); }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div className="eyebrow">Internal · Estilo de Vida</div>
            <h1 className="serif" style={{ fontSize: 40, margin: "6px 0 0", letterSpacing: "-0.02em" }}>
              <span className="gold-text">Guest CRM</span>
            </h1>
            <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 17, marginTop: 4 }}>
              Source: {source === "supabase" ? "Supabase (live)" : "Local mirror — configure Supabase to go live"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--gold-deep)", letterSpacing: "0.18em", marginRight: 4 }}>
              {session?.username}
            </span>
            <button className="btn-ghost" onClick={refresh} disabled={loading}>{loading ? "…" : "Refresh"}</button>
            <button className="btn-ghost" onClick={exportCsv}>Export CSV</button>
            {session?.role === "owner" && (
              <button className="btn-ghost" onClick={() => setView("users")}>Users</button>
            )}
            <button className="btn-ghost" onClick={logout}>Logout</button>
            <button className="btn-ghost" onClick={onClose}>← Back to site</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 22 }}>
          {[
            { l: "Total entries", v: stats.total },
            { l: "Coming", v: stats.yes, c: "var(--gold)" },
            { l: "Maybes", v: stats.maybe },
            { l: "Regrets", v: stats.no },
            { l: "Incomplete", v: stats.partial, c: "#fbbc05" },
            { l: "Head count", v: stats.heads, c: "var(--gold-bright)" },
            { l: "Pledged ₵", v: stats.tier.toLocaleString(), c: "var(--gold-bright)" },
          ].map((s, i) => (
            <div key={i} style={{ padding: 16, border: "1px solid var(--hair)", borderRadius: 10, background: "var(--ink-2)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--gold-deep)", textTransform: "uppercase", fontWeight: 600 }}>{s.l}</div>
              <div className="serif" style={{ fontSize: 32, marginTop: 4, color: s.c || "var(--ivory)", lineHeight: 1 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { id: "all", l: "All" },
            { id: "yes", l: "Coming" },
            { id: "maybe", l: "Maybe" },
            { id: "no", l: "Regrets" },
            { id: "partial", l: "Incomplete" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              appearance: "none", cursor: "pointer", padding: "8px 16px", borderRadius: 999,
              border: filter === f.id ? "1px solid var(--gold)" : "1px solid var(--hair)",
              background: filter === f.id ? "rgba(201,165,92,0.16)" : "transparent",
              color: filter === f.id ? "var(--gold)" : "var(--ivory)",
              fontFamily: "Manrope", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600,
            }}>{f.l}</button>
          ))}
          <input value={query} onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search name, phone, message…"
            style={{
              flex: 1, minWidth: 200,
              background: "rgba(0,0,0,0.3)", color: "var(--ivory)",
              border: "1px solid var(--hair)", borderRadius: 999,
              padding: "10px 16px", fontFamily: "Manrope", fontSize: 13, outline: "none",
            }} />
        </div>

        {/* Table */}
        <div style={{ border: "1px solid var(--hair)", borderRadius: 12, overflow: "hidden", background: "var(--ink-2)" }}>
          <table className="crm-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                <th>Name</th><th>Status</th><th>Heads</th><th>Phone</th><th>Tier</th><th>Message</th><th>Code</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: "center", padding: "30px 0", color: "var(--smoke)" }}>
                  No RSVPs yet. Submissions will appear here as guests respond.
                </td></tr>
              )}
              {filtered.map((r, i) => (
                <tr key={i} className="crm-row" onClick={() => setSelected(r)}>
                  <td>
                    <div className="serif" style={{ fontSize: 17, color: "var(--ivory)" }}>{r.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--gold-deep)" }}>{r.email || ""}</div>
                  </td>
                  <td>
                    {r._status === "partial" ? (
                      <span className="crm-pill" style={{ background: "rgba(251,188,5,0.15)", color: "#fbbc05", border: "1px solid rgba(251,188,5,0.4)" }}>
                        {STEP_LABELS[r._stepReached] || "Started"}
                      </span>
                    ) : (
                      <span className={`crm-pill pill-${r.attend || "maybe"}`}>
                        {r.attend === "yes" ? "Coming" : r.attend === "no" ? "Regrets" : "Maybe"}
                      </span>
                    )}
                  </td>
                  <td className="serif" style={{ fontSize: 18 }}>{r.guests || 1}</td>
                  <td style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>{r.phone || "—"}</td>
                  <td className="serif" style={{ color: "var(--gold)", fontSize: 16 }}>{r.tier ? `₵${Number(r.tier).toLocaleString()}` : "—"}</td>
                  <td style={{ maxWidth: 280, color: "var(--smoke)", fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.message || "—"}
                  </td>
                  <td style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: "var(--gold-deep)" }}>{r.code || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: "var(--smoke)", lineHeight: 1.6, fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", fontSize: 14 }}>
          Data is stored in Supabase. All submissions (including partials) sync automatically.
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 520, background: "var(--ink-2)", border: "1px solid var(--hair-2)", borderRadius: "16px 16px 0 0", padding: 24 }}>
            <div className="eyebrow">{selected.code || "Guest"}</div>
            <h3 className="serif" style={{ fontSize: 30, margin: "6px 0 4px" }}>
              <span className="gold-text">{selected.name || "—"}</span>
            </h3>
            <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 16 }}>
              {selected.attend === "yes" ? "Confirmed attending" : selected.attend === "no" ? "Sent regrets" : "Tentative"}
              {selected.guests ? ` · party of ${selected.guests}` : ""}
            </div>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field l="Phone" v={selected.phone || "—"} />
              <Field l="Email" v={selected.email || "—"} />
              <Field l="Tier" v={selected.tier ? `₵${Number(selected.tier).toLocaleString()}` : "—"} />
              <Field l="Submitted" v={selected.ts ? new Date(selected.ts).toLocaleString() : "—"} />
            </div>
            {selected.guestNames?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="field-label">Guests</div>
                <div className="serif" style={{ fontSize: 16, color: "var(--ivory)" }}>{selected.guestNames.join(" · ")}</div>
              </div>
            )}
            {selected.message && (
              <div style={{ marginTop: 16, padding: 16, border: "1px solid var(--hair)", borderRadius: 8, background: "rgba(0,0,0,0.3)" }}>
                <div className="field-label">Message to Pkay</div>
                <div className="serif-italic" style={{ fontSize: 18, color: "var(--ivory)", marginTop: 4, lineHeight: 1.5 }}>
                  &ldquo;{selected.message}&rdquo;
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn-gold" style={{ flex: 1 }}
                onClick={() => downloadTicketForGuest(selected)}>
                Regenerate Ticket
              </button>
              <button className="btn-ghost" style={{ flex: 1 }}
                onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ticket Generator (reusable from CRM) ────────────────────
async function generateTicketPng(guest) {
  const name = guest.name || "Guest";
  const guests = guest.guests || 1;
  const codeStr = guest.code || (() => {
    const s = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "PKY";
    const n = String(Math.floor(Math.random() * 900) + 100);
    return `MM-${s}-${n}`;
  })();

  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const PAD = 80;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f0a08");
  bg.addColorStop(0.3, "#1a0e0a");
  bg.addColorStop(0.7, "#0d0907");
  bg.addColorStop(1, "#080604");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W/2, 200, 0, W/2, 200, 500);
  glow.addColorStop(0, "rgba(201,165,92,0.2)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 600);

  const drawRoundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  drawRoundRect(PAD, PAD, W - PAD*2, H - PAD*2, 32);
  ctx.strokeStyle = "rgba(201,165,92,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawRoundRect(PAD + 16, PAD + 16, W - PAD*2 - 32, H - PAD*2 - 32, 24);
  ctx.strokeStyle = "rgba(201,165,92,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  let y = 180;
  ctx.textAlign = "center";
  ctx.fillStyle = "#c9a55c";
  ctx.font = "600 20px Manrope, sans-serif";
  ctx.fillText("P K A Y  ·  3 0 T H", W/2, y);

  y += 100;
  ctx.font = "italic 500 140px 'Cormorant Garamond', serif";
  const goldGrad = ctx.createLinearGradient(0, y - 80, 0, y + 60);
  goldGrad.addColorStop(0, "#f5dba0");
  goldGrad.addColorStop(0.5, "#c9a55c");
  goldGrad.addColorStop(1, "#8a6530");
  ctx.fillStyle = goldGrad;
  ctx.fillText("Midnight", W/2, y);

  y += 110;
  ctx.font = "italic 400 120px 'Italiana', serif";
  ctx.fillStyle = "#f4ead4";
  ctx.fillText("Masquerade", W/2, y);

  try {
    const img = new Image();
    img.src = "assets/mask.svg";
    await new Promise((res) => { img.onload = res; img.onerror = res; setTimeout(res, 600); });
    const mw = 260, mh = mw * 0.63;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(img, (W - mw)/2, y + 40, mw, mh);
    ctx.globalAlpha = 1;
  } catch(e) {}

  const tearY = 620;
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = "rgba(201,165,92,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD + 40, tearY); ctx.lineTo(W - PAD - 40, tearY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#0f0a08";
  ctx.beginPath(); ctx.arc(PAD, tearY, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - PAD, tearY, 18, 0, Math.PI * 2); ctx.fill();

  y = tearY + 70;
  const leftCol = 160;
  const rightCol = W/2 + 40;

  const drawField = (label, value, x, fy) => {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(201,165,92,0.7)";
    ctx.font = "600 16px Manrope, sans-serif";
    ctx.fillText(label, x, fy);
    ctx.fillStyle = "#f4ead4";
    ctx.font = "500 38px 'Cormorant Garamond', serif";
    ctx.fillText(value, x, fy + 48);
  };

  drawField("GUEST", name.toUpperCase(), leftCol, y);
  drawField("ADMIT", String(guests), rightCol, y);
  y += 120;
  drawField("DATE", "16 MAY 2026", leftCol, y);
  drawField("TIME", "7:00 PM SHARP", rightCol, y);
  y += 120;
  drawField("VENUE", "ENCLAVE GARDEN", leftCol, y);
  drawField("DRESS", "BLACK TIE · MASK", rightCol, y);

  y += 100;
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = "rgba(201,165,92,0.3)";
  ctx.beginPath(); ctx.moveTo(leftCol, y); ctx.lineTo(W - leftCol, y); ctx.stroke();
  ctx.setLineDash([]);

  y += 60;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(201,165,92,0.5)";
  ctx.font = "600 14px Manrope, sans-serif";
  ctx.fillText("TICKET CODE", W/2, y);
  y += 44;
  ctx.fillStyle = "#c9a55c";
  ctx.font = "500 32px ui-monospace, Menlo, monospace";
  ctx.fillText(codeStr, W/2, y);

  y += 60;
  const qrSize = 240;
  const qrX = (W - qrSize) / 2;
  const qrY = y;

  ctx.fillStyle = "#faf3e3";
  drawRoundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 12);
  ctx.fill();

  let hash = 0;
  const val = `PKAY30-${codeStr}-${name}`;
  for (let i = 0; i < val.length; i++) hash = (hash * 131 + val.charCodeAt(i)) >>> 0;
  let seed = hash || 1;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
  const N = 25, cellSz = qrSize / N;
  ctx.fillStyle = "#1a0e0a";
  for (let yy = 0; yy < N; yy++) {
    for (let xx = 0; xx < N; xx++) {
      const inFinder = (xx < 7 && yy < 7) || (xx >= N - 7 && yy < 7) || (xx < 7 && yy >= N - 7);
      let on = false;
      if (inFinder) {
        const fx = xx < 7 ? xx : xx - (N - 7);
        const fy = yy < 7 ? yy : yy - (N - 7);
        on = (fx === 0 || fx === 6 || fy === 0 || fy === 6) || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      } else { on = rand() > 0.48; }
      if (on) ctx.fillRect(qrX + xx * cellSz, qrY + yy * cellSz, cellSz - 0.5, cellSz - 0.5);
    }
  }

  y = qrY + qrSize + 50;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(201,165,92,0.5)";
  ctx.font = "600 14px Manrope, sans-serif";
  ctx.fillText("SCAN AT ENTRY", W/2, y);

  y = H - 180;
  ctx.fillStyle = "rgba(201,165,92,0.4)";
  ctx.font = "600 14px Manrope, sans-serif";
  ctx.fillText("C U R A T E D   B Y   E S T I L O   D E   V I D A", W/2, y);
  y += 50;
  ctx.fillStyle = "rgba(244,234,212,0.6)";
  ctx.font = "italic 400 28px 'Cormorant Garamond', serif";
  ctx.fillText("Until then — keep the secret.", W/2, y);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve({ blob, code: codeStr, canvas }), "image/png");
  });
}

function downloadTicketForGuest(guest) {
  generateTicketPng(guest).then(({ blob, code }) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pkay-30-ticket-${code}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

Object.assign(window, {
  submitRSVP, loadLocalRSVPs, loadSupabaseRSVPs, DressCodeBadge, StrictTimeStamp, CRMView,
  savePartialRSVP, markPartialComplete, generateSessionId, loadPartialRSVPs,
  initUsers, getSession, clearSession,
  generateTicketPng, downloadTicketForGuest,
});
