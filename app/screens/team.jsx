// =========================================================
// Team screen — members, permissions, activity
// =========================================================

const PERM_DOT = {
  none: { color: "var(--muted-2)", label: "—" },
  view: { color: "var(--accent)", label: "View" },
  edit: { color: "var(--warn)",   label: "Edit" },
  full: { color: "var(--positive)", label: "Full" },
};

const TeamScreen = () => {
  const [openMember, setOpenMember] = React.useState(null);

  return (
    <div className="fade-in" data-screen-label="09 Team">
      <Topbar title="Team & access" subtitle="People · permissions · activity" />
      <div className="content">

        <div className="grid-4" style={{ marginBottom: 24 }}>
          <KPI eyebrow="Members" value={String(team.length)} sub={`${team.filter((m) => m.status === "Active").length} active · ${team.filter((m) => m.status === "Pending").length} pending`} />
          <KPI eyebrow="Roles in use" value={String(new Set(team.map((m) => m.role)).size)} sub="Owner, PA, Lawyer, Accountant" />
          <KPI eyebrow="External advisors" value={String(team.filter((m) => m.external).length)} sub="Lawyer, accountant, partners" />
          <KPI eyebrow="2FA coverage" value={`${Math.round(team.filter((m) => m.twoFa).length / team.length * 100)}%`} sub={`${team.filter((m) => !m.twoFa).length} member${team.filter((m) => !m.twoFa).length === 1 ? "" : "s"} without 2FA`} />
        </div>

        {/* Members table */}
        <div className="row between" style={{ marginBottom: 16 }}>
          <div>
            <div className="eyebrow">People</div>
            <div className="h-section" style={{ marginTop: 4 }}>Who can see and change what</div>
          </div>
          <div className="row gap-2">
            <button className="btn sm"><Icon name="download" size={12} />Export audit log</button>
            <button className="btn sm primary" onClick={() => window.__openForm?.("team")}><Icon name="plus" size={12} />Invite member</button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Scope</th>
                <th>Location</th>
                <th>2FA</th>
                <th>Last active</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => {
                const preset = ROLE_PRESETS[m.role] || ROLE_PRESETS.Custom;
                return (
                  <tr key={m.id} className="clickable" onClick={() => setOpenMember(m)}>
                    <td>
                      <div className="row gap-3">
                        <div className="avatar" style={{ background: m.id === "tm-kobby" ? "var(--ink)" : "var(--canvas)", color: m.id === "tm-kobby" ? "var(--surface)" : "var(--ink)", border: m.id === "tm-kobby" ? "none" : "1px solid var(--line)" }}>{m.initials}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                          <div className="muted" style={{ fontSize: 11 }}>{m.email}{m.external ? ` · ${m.external}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="row gap-2">
                        <span className="dot" style={{ background: preset.color }} />
                        <span style={{ fontSize: 13 }}>{m.role}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <PermSummary perms={ROLE_PERMS[m.role] || m.perms || {}} />
                    </td>
                    <td style={{ fontSize: 12 }}>{m.location}</td>
                    <td>
                      {m.twoFa
                        ? <span className="chip pos"><Icon name="check" size={10} stroke={2.4} />On</span>
                        : <span className="chip warn">Off</span>}
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{m.lastActive}</td>
                    <td>
                      <span className={`chip ${m.status === "Active" ? "pos" : m.status === "Pending" ? "warn" : "neg"}`}>{m.status}</span>
                    </td>
                    <td><Icon name="chevRight" size={14} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid-12">
          {/* Activity feed */}
          <div className="card span-7">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Recent activity</div>
                <div className="h-section" style={{ marginTop: 4 }}>What the team's been doing</div>
              </div>
              <button className="btn ghost sm"><Icon name="refresh" size={14} /></button>
            </div>
            {teamActivity.map((a, i) => {
              const member = team.find((m) => m.name === a.who);
              return (
                <div key={i} className="row gap-3" style={{ padding: "12px 0", borderBottom: "1px solid var(--line-2)", alignItems: "flex-start" }}>
                  <div className="avatar sm" style={{ background: "var(--canvas)", color: "var(--ink)", border: "1px solid var(--line)", marginTop: 2 }}>
                    {member?.initials || a.who.split(" ").map((s)=>s[0]).slice(0,2).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>
                      <strong style={{ fontWeight: 500 }}>{a.who}</strong> · {a.msg}
                    </div>
                    <div className="muted mono" style={{ fontSize: 10.5, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{a.t} · {a.tag}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Roles legend / quick presets */}
          <div className="card span-5">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Role presets</div>
            {Object.entries(ROLE_PRESETS).map(([role, meta]) => {
              if (role === "Custom") return null;
              const perms = ROLE_PERMS[role];
              const userCount = team.filter((m) => m.role === role).length;
              return (
                <div key={role} style={{ padding: "14px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div className="row gap-2">
                      <span className="dot" style={{ background: meta.color }} />
                      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{role}</span>
                    </div>
                    <span className="muted mono" style={{ fontSize: 11 }}>{userCount} {userCount === 1 ? "person" : "people"}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 8 }}>{meta.desc}</div>
                  {perms && <PermSummary perms={perms} small />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member detail panel */}
      {openMember && (
        <SidePanel
          open onClose={() => setOpenMember(null)}
          title={openMember.name}
          subtitle={`${openMember.role}${openMember.external ? ` · ${openMember.external}` : ""}`}
          footer={
            openMember.role === "Owner" ? null : (
              <>
                <button className="btn ghost" onClick={() => setOpenMember(null)}>Close</button>
                <button className="btn" onClick={() => { setOpenMember(null); window.__openForm?.("team-edit", { defaultMember: openMember }); }}>
                  <Icon name="settings" size={12} />Edit access
                </button>
                <button className="btn" style={{ borderColor: "var(--negative)", color: "var(--negative)" }}>
                  <Icon name="x" size={12} />Revoke
                </button>
              </>
            )
          }
        >
          <FormSection>
            <div className="row gap-3" style={{ padding: 16, background: "var(--canvas)", borderRadius: 12 }}>
              <div className="avatar lg" style={{ background: openMember.id === "tm-kobby" ? "var(--ink)" : "var(--surface-2)", color: openMember.id === "tm-kobby" ? "var(--surface)" : "var(--ink)", border: openMember.id === "tm-kobby" ? "none" : "1px solid var(--line)" }}>{openMember.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>{openMember.name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{openMember.email}</div>
                <div className="row gap-2" style={{ marginTop: 8 }}>
                  <span className="chip" style={{ background: ROLE_PRESETS[openMember.role]?.color + "20", color: ROLE_PRESETS[openMember.role]?.color }}>{openMember.role}</span>
                  <span className={`chip ${openMember.status === "Active" ? "pos" : "warn"}`}>{openMember.status}</span>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Details">
            <div className="col gap-3" style={{ fontSize: 13 }}>
              <div className="row between"><span className="muted">Location</span><span>{openMember.location}</span></div>
              {openMember.external && <div className="row between"><span className="muted">Organisation</span><span>{openMember.external}</span></div>}
              <div className="row between"><span className="muted">Joined</span><span>{openMember.joined}</span></div>
              <div className="row between"><span className="muted">Last active</span><span>{openMember.lastActive}</span></div>
              <div className="row between"><span className="muted">2FA</span><span>{openMember.twoFa ? <span className="pos">Enabled</span> : <span className="neg">Disabled</span>}</span></div>
            </div>
          </FormSection>

          <FormSection title="What they can do">
            <PermMatrix perms={ROLE_PERMS[openMember.role] || openMember.perms || {}} />
          </FormSection>

          {openMember.role !== "Owner" && (
            <FormSection title="Recent activity">
              {teamActivity.filter((a) => a.who === openMember.name).slice(0, 4).map((a, i) => (
                <div key={i} className="row gap-3" style={{ padding: "10px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <span className="dot pos" style={{ marginTop: 6 }} />
                  <div>
                    <div style={{ fontSize: 12.5 }}>{a.msg}</div>
                    <div className="muted mono" style={{ fontSize: 10.5, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>{a.t}</div>
                  </div>
                </div>
              ))}
              {teamActivity.filter((a) => a.who === openMember.name).length === 0 && (
                <div className="muted" style={{ fontSize: 12.5, padding: "8px 0" }}>No recent activity from {openMember.name.split(" ")[0]}.</div>
              )}
            </FormSection>
          )}
        </SidePanel>
      )}
    </div>
  );
};

// Compact pill list of permission levels
const PermSummary = ({ perms, small = false }) => {
  const counts = Object.values(perms).reduce((acc, p) => { acc[p] = (acc[p] || 0) + 1; return acc; }, {});
  return (
    <div className="row gap-2">
      {["full", "edit", "view", "none"].map((lvl) => {
        if (!counts[lvl]) return null;
        return (
          <span key={lvl} className="row gap-2" style={{ fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: PERM_DOT[lvl].color, display: "inline-block" }} />
            <span className="muted">{counts[lvl]} {PERM_DOT[lvl].label.toLowerCase()}</span>
          </span>
        );
      })}
    </div>
  );
};

// Full permission matrix
const PermMatrix = ({ perms }) => (
  <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
    {MODULES.map((m, i) => {
      const p = perms[m.key] || "none";
      return (
        <div key={m.key} className="row between" style={{ padding: "10px 14px", borderTop: i > 0 ? "1px solid var(--line-2)" : "none", fontSize: 13 }}>
          <span>{m.label}</span>
          <span className="row gap-2">
            <span className="dot" style={{ background: PERM_DOT[p].color }} />
            <span className="muted">{PERM_DOT[p].label}</span>
          </span>
        </div>
      );
    })}
  </div>
);

window.TeamScreen = TeamScreen;
