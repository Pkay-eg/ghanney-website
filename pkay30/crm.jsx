// crm.jsx — submission + admin CRM
const { useState: useState_crm, useEffect: useEffect_crm, useMemo: useMemo_crm } = React;

// ── Configuration ─────────────────────────────────────────────
// Set window.__SHEETS_ENDPOINT to a deployed Google Apps Script Web App URL.
// The Apps Script (paste into a new "Containerized" script attached to a
// Google Sheet) should look like:
//
//   const SHEET_NAME = "RSVPs";
//   function doPost(e) {
//     const ss = SpreadsheetApp.getActiveSpreadsheet();
//     const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
//     if (sh.getLastRow() === 0) {
//       sh.appendRow(["Timestamp","Code","Name","Phone","Email",
//                     "Attend","Guests","GuestNames","Message",
//                     "Tier","Source"]);
//     }
//     const d = JSON.parse(e.postData.contents);
//     sh.appendRow([
//       new Date(), d.code||"", d.name||"", d.phone||"", d.email||"",
//       d.attend||"", d.guests||"", (d.guestNames||[]).join(", "),
//       d.message||"", d.tier||"", "pkay.ghanney.com"
//     ]);
//     return ContentService
//       .createTextOutput(JSON.stringify({ok:true}))
//       .setMimeType(ContentService.MimeType.JSON);
//   }
//   function doGet() {
//     const ss = SpreadsheetApp.getActiveSpreadsheet();
//     const sh = ss.getSheetByName(SHEET_NAME);
//     if (!sh) return ContentService.createTextOutput(JSON.stringify({rows:[]}))
//       .setMimeType(ContentService.MimeType.JSON);
//     const v = sh.getDataRange().getValues();
//     const [hdr, ...rows] = v;
//     return ContentService.createTextOutput(JSON.stringify({
//       rows: rows.map(r => Object.fromEntries(hdr.map((h,i)=>[h, r[i]])))
//     })).setMimeType(ContentService.MimeType.JSON);
//   }
//
// Deploy → New deployment → Web app → Execute as: Me, Anyone has access.
// Then in your hosted index.html add:
//   <script>window.__SHEETS_ENDPOINT="https://script.google.com/.../exec";</script>
//
// While developing or before the endpoint is set, submissions are stored in
// localStorage so the CRM can still demonstrate the flow.

const LS_KEY = "pkay30_rsvps_v1";

async function submitRSVP(payload) {
  const record = { ...payload, ts: new Date().toISOString() };
  // Always mirror to localStorage so the CRM has data even if Sheets is offline.
  try {
    const cur = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    cur.unshift(record);
    localStorage.setItem(LS_KEY, JSON.stringify(cur.slice(0, 500)));
  } catch (e) {}
  const endpoint = window.__SHEETS_ENDPOINT;
  if (!endpoint) {
    return { ok: true, mocked: true, record };
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      // Apps Script web-apps reject preflighted JSON; use text/plain to avoid CORS preflight.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(record),
    });
    return { ok: res.ok, record };
  } catch (e) {
    console.warn("Sheets submit failed; using local mirror.", e);
    return { ok: false, mocked: true, record, error: String(e) };
  }
}

function loadLocalRSVPs() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch (e) { return []; }
}

async function loadSheetRSVPs() {
  const endpoint = window.__SHEETS_ENDPOINT;
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const j = await res.json();
    return j.rows || [];
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
            No mask · no entry. Dress for shadow & gold.
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

// ── CRM Admin View ───────────────────────────────────────────
function CRMView({ onClose }) {
  const [rows, setRows] = useState_crm([]);
  const [source, setSource] = useState_crm("local");
  const [filter, setFilter] = useState_crm("all");
  const [query, setQuery] = useState_crm("");
  const [loading, setLoading] = useState_crm(false);
  const [selected, setSelected] = useState_crm(null);

  const refresh = async () => {
    setLoading(true);
    const sheet = await loadSheetRSVPs();
    if (sheet) {
      // Normalize sheet rows (Apps Script returns object keyed by header)
      setRows(sheet.map(r => ({
        ts: r.Timestamp || r.ts,
        code: r.Code || r.code,
        name: r.Name || r.name,
        phone: r.Phone || r.phone,
        email: r.Email || r.email,
        attend: r.Attend || r.attend,
        guests: r.Guests || r.guests,
        guestNames: typeof r.GuestNames === "string" ? r.GuestNames.split(",").map(s=>s.trim()).filter(Boolean) : (r.guestNames || []),
        message: r.Message || r.message,
        tier: r.Tier || r.tier,
      })));
      setSource("sheets");
    } else {
      setRows(loadLocalRSVPs());
      setSource("local");
    }
    setLoading(false);
  };
  useEffect_crm(() => { refresh(); }, []);

  const filtered = useMemo_crm(() => {
    return rows.filter(r => {
      if (filter !== "all" && r.attend !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${r.name||""} ${r.phone||""} ${r.email||""} ${r.message||""} ${r.code||""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, query]);

  const stats = useMemo_crm(() => {
    let yes = 0, no = 0, maybe = 0, heads = 0, tier = 0;
    rows.forEach(r => {
      if (r.attend === "yes") { yes++; heads += Number(r.guests || 1); }
      else if (r.attend === "no") no++;
      else if (r.attend === "maybe") { maybe++; heads += Number(r.guests || 1); }
      tier += Number(r.tier || 0);
    });
    return { yes, no, maybe, heads, tier, total: rows.length };
  }, [rows]);

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
              Source: {source === "sheets" ? "Google Sheet (live)" : "Local mirror — set window.__SHEETS_ENDPOINT to go live"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn-ghost" onClick={refresh} disabled={loading}>{loading ? "…" : "Refresh"}</button>
            <button className="btn-ghost" onClick={exportCsv}>Export CSV</button>
            <button className="btn-ghost" onClick={onClose}>← Back to site</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 22 }}>
          {[
            { l: "Total RSVPs", v: stats.total },
            { l: "Coming", v: stats.yes, c: "var(--gold)" },
            { l: "Maybes", v: stats.maybe },
            { l: "Regrets", v: stats.no },
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
                    <span className={`crm-pill pill-${r.attend || "maybe"}`}>
                      {r.attend === "yes" ? "Coming" : r.attend === "no" ? "Regrets" : "Maybe"}
                    </span>
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
          Tip: deploy the Apps Script in <code>crm.jsx</code> as a Web App, then add{" "}
          <code style={{ color: "var(--gold)" }}>&lt;script&gt;window.__SHEETS_ENDPOINT="…"&lt;/script&gt;</code>{" "}
          to your hosted page to mirror every RSVP into a Google Sheet automatically.
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
            <button className="btn-gold" onClick={() => setSelected(null)} style={{ marginTop: 18, width: "100%" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { submitRSVP, loadLocalRSVPs, DressCodeBadge, StrictTimeStamp, CRMView });
