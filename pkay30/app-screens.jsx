// Pkay 30 — Black Tie Masquerade
// Step components

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────
const EVENT = {
  date: new Date("2026-05-16T19:00:00+00:00"),
  dateLabel: "Saturday · 16th May, 2026",
  time: "7:00 PM",
  venue: "Enclave Garden",
  city: "Luxury Doom · Accra",
  dress: "Masquerade · Black Tie",
  curatedBy: "Estilo de Vida",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Enclave+Garden+Accra",
};

const PALETTE_LABEL = {
  midnight: "Black Tie",
  oxblood: "Oxblood",
  onyx: "Onyx",
  champagne: "Champagne",
};

function FloralCorner({ position = "tl", opacity = 0.7 }) {
  const transforms = {
    tl: "rotate(0deg)",
    tr: "scaleX(-1)",
    bl: "scaleY(-1)",
    br: "scale(-1,-1)",
  };
  const positions = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0 },
    bl: { bottom: 0, left: 0 },
    br: { bottom: 0, right: 0 },
  };
  return (
    <div style={{
      position: "absolute", width: 180, height: 180, opacity,
      transform: transforms[position], pointerEvents: "none",
      ...positions[position],
    }}>
      <img src="assets/floral-corner.svg" style={{ width: "100%", height: "100%" }} alt="" />
    </div>
  );
}

function Petals({ count = 12 }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 6,
    dur: 8 + Math.random() * 8,
    size: 8 + Math.random() * 14,
    rot: Math.random() * 360,
    drift: (Math.random() - 0.5) * 200,
    op: 0.3 + Math.random() * 0.4,
  })), [count]);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }}>
      {items.map((p, i) => (
        <div key={i} className="petal" style={{
          left: `${p.left}%`, top: "-20px",
          width: p.size, height: p.size,
          opacity: p.op,
          animation: `petalFall ${p.dur}s linear ${p.delay}s infinite`,
          "--drift": `${p.drift}px`,
        }} />
      ))}
      <style>{`
        @keyframes petalFall {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(var(--drift), 110vh) rotate(720deg); }
        }
      `}</style>
    </div>
  );
}

function GoldRule({ children }) {
  return (
    <div className="gold-rule" style={{ width: "100%", margin: "10px 0" }}>
      <span className="diamond" />
      {children && <span style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase" }}>{children}</span>}
      <span className="diamond" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 1. Intro — Sealed envelope / mask reveal
// ─────────────────────────────────────────────────────────
function IntroScreen({ onOpen, headline }) {
  const [opening, setOpening] = useState(false);
  const handle = () => {
    setOpening(true);
    setTimeout(onOpen, 1700);
  };
  return (
    <div className="stage velvet" style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px", position: "relative", overflow: "hidden" }}>
      <FloralCorner position="tl" opacity={0.55} />
      <FloralCorner position="br" opacity={0.55} />

      {/* Ambient orb */}
      <div style={{
        position: "absolute", width: 460, height: 460,
        background: "radial-gradient(circle, rgba(139,28,44,0.4) 0%, rgba(74,13,24,0.2) 30%, transparent 70%)",
        filter: "blur(40px)", animation: "orb 6s ease-in-out infinite",
        zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 420, width: "100%" }}>
        <div className="eyebrow fade-in" style={{ animationDelay: "200ms" }}>You are cordially invited</div>

        {/* Mask — opens on tap */}
        <div style={{
          margin: "32px auto 24px", width: 240, height: 152, position: "relative",
          transition: "transform 1.4s cubic-bezier(0.22,1,0.36,1), opacity 1.2s",
          transform: opening ? "scale(1.4) translateY(-40px)" : "scale(1)",
          opacity: opening ? 0 : 1,
          filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(201,165,92,0.3))",
        }}>
          <img src="assets/mask.svg" alt="" style={{ width: "100%", height: "100%" }} />
        </div>

        <div className="serif gold-text fade-up" style={{
          fontSize: "clamp(56px, 18vw, 96px)", lineHeight: 0.95, letterSpacing: "-0.02em",
          animationDelay: "400ms",
        }}>
          PKay
        </div>
        <div className="italiana" style={{
          fontSize: 18, color: "var(--ivory-soft)", marginTop: 6,
          animation: "fadeUp 800ms 700ms cubic-bezier(0.22,1,0.36,1) both",
          letterSpacing: "0.12em",
        }}>
          {headline || "invites you to a black tie masquerade"}
        </div>

        <div style={{ margin: "30px auto 26px", maxWidth: 240, animation: "fadeUp 800ms 900ms both" }}>
          <GoldRule />
        </div>

        <div className="serif-italic" style={{ fontSize: 17, lineHeight: 1.6, color: "var(--smoke)", maxWidth: 320, margin: "0 auto",
          animation: "fadeUp 800ms 1100ms both" }}>
          a single evening of mystery, music & celebration —<br/>behind the mask, you shall find me.
        </div>

        <button className="btn-gold" onClick={handle}
          style={{ marginTop: 38, animation: "fadeUp 800ms 1300ms both" }}>
          Lift the Mask
        </button>

        <div style={{ marginTop: 22, fontSize: 10, letterSpacing: "0.32em", color: "var(--gold-deep)",
          animation: "fadeUp 800ms 1500ms both" }}>
          EST · MMXXVI · 16 · V
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 2. Welcome / Cover with countdown
// ─────────────────────────────────────────────────────────
function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const mins = Math.floor(diff / 60000) % 60;
  const secs = Math.floor(diff / 1000) % 60;
  return { days, hours, mins, secs };
}

function CoverScreen({ onBegin, headline }) {
  const c = useCountdown(EVENT.date);
  return (
    <div className="stage velvet fade-in" style={{ padding: "60px 24px 40px", position: "relative", overflow: "hidden" }}>
      <FloralCorner position="tl" opacity={0.5} />
      <FloralCorner position="tr" opacity={0.5} />
      <FloralCorner position="bl" opacity={0.4} />
      <FloralCorner position="br" opacity={0.4} />

      <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>

        <div style={{ width: 160, height: 102, marginBottom: 20 }}>
          <img src="assets/mask.svg" alt="" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 24px rgba(201,165,92,0.35))" }} />
        </div>

        <div className="eyebrow">Pkay invites you</div>

        <h1 className="serif" style={{
          margin: "12px 0 4px",
          fontSize: "clamp(64px, 22vw, 130px)", lineHeight: 0.9,
          letterSpacing: "-0.03em",
        }}>
          <span className="gold-text">{headline?.split("|")[0] || "Black Tie"}</span>
        </h1>
        <h1 className="italiana" style={{
          margin: 0,
          fontSize: "clamp(48px, 16vw, 90px)", lineHeight: 1,
          color: "var(--ivory)",
          fontStyle: "italic",
          letterSpacing: "0.02em",
        }}>
          {headline?.split("|")[1] || "Masquerade"}
        </h1>

        <div className="serif-italic" style={{ fontSize: 18, color: "var(--smoke)", marginTop: 18, maxWidth: 320 }}>
          a thirtieth year, in shadow & gold —<br/>shall you grace us with your presence?
        </div>

        {/* Countdown */}
        <div style={{ marginTop: 36, display: "flex", gap: 4, justifyContent: "center" }}>
          {[
            { v: c.days, l: "Days" },
            { v: c.hours, l: "Hrs" },
            { v: c.mins, l: "Min" },
            { v: c.secs, l: "Sec" },
          ].map((u, i) => (
            <div key={i} style={{ minWidth: 64, padding: "10px 8px", border: "1px solid var(--hair)", borderRadius: 4, background: "rgba(0,0,0,0.3)" }}>
              <div className="serif gold-text" style={{ fontSize: 32, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {String(u.v).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--gold-deep)", textTransform: "uppercase", marginTop: 4 }}>{u.l}</div>
            </div>
          ))}
        </div>

        <button className="btn-gold" onClick={onBegin} style={{ marginTop: 40 }}>
          Kindly RSVP
        </button>

        <div style={{ marginTop: 26, fontSize: 11, letterSpacing: "0.3em", color: "var(--gold-deep)", textTransform: "uppercase" }}>
          {EVENT.dateLabel}
        </div>

        <div style={{ marginTop: 22 }}>
          <StrictTimeStamp />
        </div>

        <div style={{ marginTop: 18, width: "100%", maxWidth: 380 }}>
          <DressCodeBadge />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 3. RSVP Step — Will you attend?
// ─────────────────────────────────────────────────────────
function StepFrame({ stepIdx, total, title, eyebrow, children, onBack, onNext, nextLabel = "Continue", nextDisabled, onSkip }) {
  return (
    <div className="stage fade-in" style={{ padding: "28px 24px 36px", position: "relative", overflow: "visible" }}>
      <FloralCorner position="tl" opacity={0.35} />
      <FloralCorner position="br" opacity={0.35} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn-ghost" onClick={onBack} style={{ padding: "8px 14px", fontSize: 10 }}>← Back</button>
          <div style={{ fontSize: 10, letterSpacing: "0.32em", color: "var(--gold-deep)", textTransform: "uppercase" }}>
            {stepIdx} / {total}
          </div>
        </div>

        {/* Progress hairline */}
        <div style={{ marginTop: 18, height: 1, background: "var(--hair)", position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${(stepIdx / total) * 100}%`,
            background: "linear-gradient(90deg, var(--gold-deep), var(--gold))",
            transition: "width 600ms cubic-bezier(0.22,1,0.36,1)",
          }} />
        </div>

        {/* Title block */}
        <div style={{ marginTop: 32 }}>
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="serif" style={{ fontSize: "clamp(38px, 11vw, 56px)", lineHeight: 1, margin: "8px 0 0", letterSpacing: "-0.02em" }}>
            <span className="gold-text">{title}</span>
          </h2>
        </div>

        {/* Body */}
        <div style={{ flex: 1, marginTop: 32 }}>{children}</div>

        {/* Footer */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button className="btn-gold" disabled={nextDisabled} onClick={onNext}>
            {nextLabel}
          </button>
          {onSkip && (
            <button onClick={onSkip} style={{ background: "transparent", border: 0, color: "var(--smoke)", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer", padding: 8 }}>
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendStep({ value, onChange, onNext, onBack }) {
  const options = [
    { id: "yes", title: "With pleasure", sub: "I shall be there", glyph: "♕" },
    { id: "no", title: "Regrettably, no", sub: "I cannot attend this time", glyph: "✕" },
  ];
  return (
    <StepFrame stepIdx={1} total={5} eyebrow="The first question" title="Will you attend?"
      onBack={onBack} onNext={onNext} nextDisabled={!value}
      nextLabel={value === "no" ? "Send my regrets" : "Continue"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {options.map(o => (
          <div key={o.id} className="choice" data-selected={value === o.id} onClick={() => onChange(o.id)}>
            <div>
              <div className="serif" style={{ fontSize: 24, color: "var(--ivory)" }}>{o.title}</div>
              <div style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--smoke)", marginTop: 4 }}>{o.sub}</div>
            </div>
            <div className="serif gold-text" style={{ fontSize: 30 }}>{o.glyph}</div>
          </div>
        ))}
      </div>
    </StepFrame>
  );
}

// ─────────────────────────────────────────────────────────
// 4. Identity step
// ─────────────────────────────────────────────────────────
function IdentityStep({ data, setData, onNext, onBack }) {
  const valid = data.name?.trim().length > 1 && data.phone?.trim().length >= 6;
  return (
    <StepFrame stepIdx={2} total={5} eyebrow="Who graces us?" title="Pray, your name."
      onBack={onBack} onNext={onNext} nextDisabled={!valid}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div className="field-label">Full name</div>
          <input className="field" placeholder="As you wish to be announced"
            value={data.name || ""}
            onChange={(e) => setData({ ...data, name: e.target.value })} />
        </div>
        <div>
          <div className="field-label">Telephone</div>
          <input className="field" placeholder="+233 ..." inputMode="tel"
            value={data.phone || ""}
            onChange={(e) => setData({ ...data, phone: e.target.value })} />
          <div style={{ fontSize: 11, color: "var(--smoke)", marginTop: 8, fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", fontSize: 14 }}>
            For your masque & venue confirmation.
          </div>
        </div>
        <div>
          <div className="field-label">Email <span style={{ color: "var(--gold-deep)" }}>· optional</span></div>
          <input className="field" placeholder="for the digital ticket" type="email"
            value={data.email || ""}
            onChange={(e) => setData({ ...data, email: e.target.value })} />
        </div>
      </div>
    </StepFrame>
  );
}

// ─────────────────────────────────────────────────────────
// 5. Plus ones
// ─────────────────────────────────────────────────────────
function GuestsStep({ data, setData, onNext, onBack }) {
  const n = data.guests ?? 1;
  const set = (v) => setData({ ...data, guests: Math.max(1, Math.min(4, v)) });
  return (
    <StepFrame stepIdx={3} total={5} eyebrow="Your company"
      title="How many shall arrive?" onBack={onBack} onNext={onNext}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, paddingTop: 20 }}>
        <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 18, textAlign: "center", maxWidth: 280 }}>
          Including yourself. Each guest will be welcomed by name at the door.
        </div>

        <div className="counter">
          <button onClick={() => set(n - 1)} aria-label="less">−</button>
          <div className="serif gold-text" style={{ fontSize: 96, lineHeight: 1, minWidth: 120, textAlign: "center" }}>
            {n}
          </div>
          <button onClick={() => set(n + 1)} aria-label="more">+</button>
        </div>

        <div style={{ fontSize: 11, letterSpacing: "0.32em", color: "var(--gold-deep)", textTransform: "uppercase" }}>
          {n === 1 ? "Just me" : `${n} of us`}
        </div>

        {/* Plus one names */}
        {n > 1 && (
          <div style={{ width: "100%", marginTop: 8 }}>
            <div className="field-label">Names of your guests</div>
            {Array.from({ length: n - 1 }).map((_, i) => (
              <input key={i} className="field" style={{ marginTop: 8 }}
                placeholder={`Guest ${i + 2}`}
                value={data.guestNames?.[i] || ""}
                onChange={(e) => {
                  const arr = [...(data.guestNames || [])];
                  arr[i] = e.target.value;
                  setData({ ...data, guestNames: arr });
                }} />
            ))}
          </div>
        )}
      </div>
    </StepFrame>
  );
}

// ─────────────────────────────────────────────────────────
// 6. Birthday message
// ─────────────────────────────────────────────────────────
function MessageStep({ data, setData, onNext, onBack }) {
  return (
    <StepFrame stepIdx={4} total={5} eyebrow="Whisper to the host"
      title="A note for Pkay" onBack={onBack} onNext={onNext}
      onSkip={() => { setData({ ...data, message: data.message || "" }); onNext(); }}>
      <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 18, marginBottom: 20 }}>
        Leave a birthday wish, a memory, or a quiet word — to be read aloud later in the evening.
      </div>
      <textarea className="field" rows={6}
        placeholder="To Pkay, on his thirtieth..."
        value={data.message || ""}
        onChange={(e) => setData({ ...data, message: e.target.value })}
        style={{ borderBottom: "1px solid var(--hair-2)", borderTop: 0, borderLeft: 0, borderRight: 0, fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 22 }}
      />
      <div style={{ textAlign: "right", fontSize: 11, color: "var(--gold-deep)", letterSpacing: "0.3em", marginTop: 6 }}>
        {(data.message || "").length} / 400
      </div>
    </StepFrame>
  );
}

// ─────────────────────────────────────────────────────────
// 7. Contribution / gift step
// ─────────────────────────────────────────────────────────
const WALLETS = {
  trc: "TZ53BeAgGAKkJHpxg9kV36zwSYXcrEGkie",
  erc: "0xd13E08a72fbE608005fFEB77b18C8ff4761161f0",
};

function QrSquare({ value, size = 160, dark = "#0a0807" }) {
  const grid = useMemo(() => {
    const qr = window.qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const out = [];
    for (let y = 0; y < count; y++) {
      const row = [];
      for (let x = 0; x < count; x++) row.push(qr.isDark(y, x) ? 1 : 0);
      out.push(row);
    }
    return out;
  }, [value]);
  const count = grid.length;
  const cell = size / count;
  return (
    <div className="qr-box" style={{ width: size + 28, height: size + 28 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grid.map((row, y) => row.map((v, x) => v ? (
          <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill={dark} />
        ) : null))}
      </svg>
    </div>
  );
}

function ContributeStep({ onNext, onBack, contribute, setContribute }) {
  const [tab, setTab] = useState("momo");
  const [copied, setCopied] = useState(null);
  const tiers = [
    { v: 500, l: "A toast" },
    { v: 1000, l: "A bottle" },
    { v: 5000, l: "A table" },
    { v: 10000, l: "A throne" },
  ];
  const copy = (txt) => {
    navigator.clipboard?.writeText(txt);
    setCopied(txt);
    setTimeout(() => setCopied(null), 1600);
  };
  return (
    <StepFrame stepIdx={5} total={5} eyebrow="A token, if you please"
      title="Bless the host"
      onBack={onBack} onNext={onNext}
      nextLabel="I'm done · Finish RSVP"
      onSkip={onNext}>
      <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 18, marginBottom: 22 }}>
        Your presence is the gift. But — should the spirit move you — a small contribution toward the night's wonder is most welcome.
      </div>

      {/* Tier suggestions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 22 }}>
        {tiers.map(t => (
          <div key={t.v}
            onClick={() => setContribute({ ...contribute, tier: t.v })}
            className="choice" data-selected={contribute.tier === t.v}
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "16px 18px" }}>
            <div className="serif gold-text" style={{ fontSize: 28, lineHeight: 1 }}>₵{t.v}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.24em", color: "var(--smoke)", textTransform: "uppercase", marginTop: 4 }}>{t.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", border: "1px solid var(--hair)", borderRadius: 999, padding: 4, marginBottom: 22 }}>
        {[
          { id: "momo", l: "Mobile Money" },
          { id: "crypto", l: "Crypto" },
        ].map(x => (
          <button key={x.id}
            onClick={() => setTab(x.id)}
            style={{
              flex: 1, padding: "10px 14px",
              background: tab === x.id ? "linear-gradient(180deg, var(--gold-bright), var(--gold))" : "transparent",
              border: 0, borderRadius: 999,
              color: tab === x.id ? "var(--ink)" : "var(--ivory)",
              fontFamily: "Manrope", fontWeight: 600, fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer",
              transition: "all 200ms",
            }}>
            {x.l}
          </button>
        ))}
      </div>

      {tab === "momo" && (
        <div className="card-velvet fade-in" style={{ padding: 22 }}>
          <div className="eyebrow">MTN Mobile Money · Ghana</div>
          <div className="serif" style={{ fontSize: 32, marginTop: 8, color: "var(--ivory)" }}>0546 307 943</div>
          <div className="serif-italic" style={{ color: "var(--smoke-2)", color: "var(--smoke)", fontSize: 18 }}>Ebenezer Ghanney</div>
          <button className="btn-ghost" style={{ marginTop: 16, width: "100%" }}
            onClick={() => copy("0546307943")}>
            {copied === "0546307943" ? "✓ Copied" : "Copy number"}
          </button>
          <div style={{ marginTop: 14, padding: "12px 14px", border: "1px dashed var(--hair-2)", borderRadius: 6, fontSize: 13, color: "var(--smoke)", lineHeight: 1.5 }}>
            Reference your name in the MoMo memo so we may thank you in person.
          </div>
        </div>
      )}

      {tab === "crypto" && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { id: "trc", label: "USDT (TRC20)", addr: WALLETS.trc, hint: "Tron network" },
            { id: "erc", label: "USDT (ERC20 / BEP20)", addr: WALLETS.erc, hint: "Ethereum / BSC network" },
          ].map(w => (
            <div key={w.id} className="card-velvet" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div className="eyebrow">{w.label}</div>
                  <div style={{ fontSize: 11, color: "var(--smoke)", marginTop: 4, fontStyle: "italic", fontFamily: "Cormorant Garamond, serif", fontSize: 14 }}>{w.hint}</div>
                </div>
                <QrSquare value={w.addr} size={84} />
              </div>
              <div style={{
                marginTop: 12, padding: "10px 12px", borderRadius: 6,
                background: "rgba(0,0,0,0.4)", border: "1px solid var(--hair)",
                fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11,
                color: "var(--ivory-soft)", wordBreak: "break-all", lineHeight: 1.5,
              }}>
                {w.addr}
              </div>
              <button className="btn-ghost" style={{ marginTop: 12, width: "100%" }}
                onClick={() => copy(w.addr)}>
                {copied === w.addr ? "✓ Copied" : "Copy address"}
              </button>
            </div>
          ))}
        </div>
      )}
    </StepFrame>
  );
}

// ─────────────────────────────────────────────────────────
// 8. Confirmation / digital ticket
// ─────────────────────────────────────────────────────────
function TicketScreen({ data, contribute, onShowAfter, showAfter, onEdit }) {
  const ticketRef = useRef(null);
  const code = data.code || (() => {
    const s = (data.name || "guest").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "PKY";
    const n = String(Math.floor(Math.random() * 900) + 100);
    return `MM-${s}-${n}`;
  })();

  // Mark partial as complete once ticket is shown
  useEffect(() => {
    if (data._sessionId && window.markPartialComplete) window.markPartialComplete(data._sessionId);
  }, []);

  const [savingPng, setSavingPng] = useState(false);

  const calendarGcal = () => {
    const gcalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("Pkay's 30th — Black Tie Masquerade") +
      "&dates=20260516T190000/20260517T020000" +
      "&location=" + encodeURIComponent(EVENT.venue + ", " + EVENT.city) +
      "&details=" + encodeURIComponent("Black tie + Masquerade Mask required. Doors close at 7:30 PM.");
    window.open(gcalUrl, "_blank");
  };

  const calendar = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PKay30//EN",
      "BEGIN:VEVENT",
      "SUMMARY:Pkay's 30th — Black Tie Masquerade",
      "DTSTART:20260516T190000",
      "DTEND:20260517T020000",
      "LOCATION:" + EVENT.venue + "\\, " + EVENT.city,
      "DESCRIPTION:Black tie + Masquerade Mask required. Doors close at 7:30 PM.",
      "END:VEVENT",
      "END:VCALENDAR",
    ];
    const ics = lines.join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pkay-30-masquerade.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Render the ticket to a PNG (used for download AND as the artwork inside the
  // .pkpass / Google Wallet bundle since we can't sign real wallet passes client-side)
  const renderTicketCanvas = async () => {
    const W = 1080, H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const PAD = 80;

    // Rich background with subtle warm gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f0a08");
    bg.addColorStop(0.3, "#1a0e0a");
    bg.addColorStop(0.7, "#0d0907");
    bg.addColorStop(1, "#080604");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Top glow
    const glow = ctx.createRadialGradient(W/2, 200, 0, W/2, 200, 500);
    glow.addColorStop(0, "rgba(201,165,92,0.2)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 600);

    // Outer border
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

    // Inner decorative border
    drawRoundRect(PAD + 16, PAD + 16, W - PAD*2 - 32, H - PAD*2 - 32, 24);
    ctx.strokeStyle = "rgba(201,165,92,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── TOP SECTION ──
    let y = 180;
    ctx.textAlign = "center";

    // Eyebrow
    ctx.fillStyle = "#c9a55c";
    ctx.font = "600 20px Manrope, sans-serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("P K A Y  ·  3 0 T H", W/2, y);

    // Title
    y += 100;
    ctx.font = "italic 500 140px 'Cormorant Garamond', serif";
    const goldGrad = ctx.createLinearGradient(0, y - 80, 0, y + 60);
    goldGrad.addColorStop(0, "#f5dba0");
    goldGrad.addColorStop(0.5, "#c9a55c");
    goldGrad.addColorStop(1, "#8a6530");
    ctx.fillStyle = goldGrad;
    ctx.fillText("Black Tie", W/2, y);

    y += 110;
    ctx.font = "italic 400 120px 'Italiana', serif";
    ctx.fillStyle = "#f4ead4";
    ctx.fillText("Masquerade", W/2, y);

    // Mask
    try {
      const img = new Image();
      img.src = "assets/mask.svg";
      await new Promise((res) => { img.onload = res; img.onerror = res; setTimeout(res, 600); });
      const mw = 260, mh = mw * 0.63;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(img, (W - mw)/2, y + 40, mw, mh);
      ctx.globalAlpha = 1;
    } catch(e) {}

    // ── TEAR LINE (perforated edge) ──
    const tearY = 620;
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "rgba(201,165,92,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD + 40, tearY); ctx.lineTo(W - PAD - 40, tearY); ctx.stroke();
    ctx.setLineDash([]);

    // Notch circles at tear line
    ctx.fillStyle = "#0f0a08";
    ctx.beginPath(); ctx.arc(PAD, tearY, 18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W - PAD, tearY, 18, 0, Math.PI * 2); ctx.fill();

    // ── DETAILS SECTION ──
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

    drawField("GUEST", (data.name || "Guest").toUpperCase(), leftCol, y);
    drawField("ADMIT", String(data.guests || 1), rightCol, y);
    y += 120;
    drawField("DATE", "16 MAY 2026", leftCol, y);
    drawField("TIME", "7:00 PM SHARP", rightCol, y);
    y += 120;
    drawField("VENUE", "ENCLAVE GARDEN", leftCol, y);
    drawField("DRESS", "BLACK TIE · MASK", rightCol, y);

    // ── DIVIDER ──
    y += 100;
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = "rgba(201,165,92,0.3)";
    ctx.beginPath(); ctx.moveTo(leftCol, y); ctx.lineTo(W - leftCol, y); ctx.stroke();
    ctx.setLineDash([]);

    // ── TICKET CODE ──
    y += 60;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(201,165,92,0.5)";
    ctx.font = "600 14px Manrope, sans-serif";
    ctx.fillText("TICKET CODE", W/2, y);
    y += 44;
    ctx.fillStyle = "#c9a55c";
    ctx.font = "500 32px ui-monospace, Menlo, monospace";
    ctx.fillText(code, W/2, y);

    // ── QR CODE ──
    y += 60;
    const qrSize = 240;
    const qrX = (W - qrSize) / 2;
    const qrY = y;

    // QR background with rounded corners
    ctx.fillStyle = "#faf3e3";
    drawRoundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 12);
    ctx.fill();

    // Real QR code
    const qrVal = `PKAY30-${code}-${data.name || ""}`;
    const qrGen = window.qrcode(0, "M");
    qrGen.addData(qrVal);
    qrGen.make();
    const modCount = qrGen.getModuleCount();
    const cellSz = qrSize / modCount;
    ctx.fillStyle = "#1a0e0a";
    for (let yy = 0; yy < modCount; yy++) {
      for (let xx = 0; xx < modCount; xx++) {
        if (qrGen.isDark(yy, xx)) {
          ctx.fillRect(qrX + xx * cellSz, qrY + yy * cellSz, cellSz, cellSz);
        }
      }
    }

    // Scan label
    y = qrY + qrSize + 50;
    ctx.fillStyle = "rgba(201,165,92,0.5)";
    ctx.font = "600 14px Manrope, sans-serif";
    ctx.fillText("SCAN AT ENTRY", W/2, y);

    // ── FOOTER ──
    y = H - 180;
    ctx.fillStyle = "rgba(201,165,92,0.4)";
    ctx.font = "600 14px Manrope, sans-serif";
    ctx.fillText("C U R A T E D   B Y   E S T I L O   D E   V I D A", W/2, y);

    y += 50;
    ctx.fillStyle = "rgba(244,234,212,0.6)";
    ctx.font = "italic 400 28px 'Cormorant Garamond', serif";
    ctx.fillText("Until then — keep the secret.", W/2, y);

    return canvas;
  };

  const [ticketDataUrl, setTicketDataUrl] = useState(null);

  useEffect(() => {
    renderTicketCanvas().then((canvas) => {
      setTicketDataUrl(canvas.toDataURL("image/png"));
    }).catch((e) => console.error("[pkay30] Ticket render:", e));
  }, []);

  const downloadPng = () => {
    if (!ticketDataUrl) {
      setSavingPng(true);
      renderTicketCanvas().then((canvas) => {
        const url = canvas.toDataURL("image/png");
        setTicketDataUrl(url);
        triggerDownload(url);
        setSavingPng(false);
      }).catch(() => setSavingPng(false));
      return Promise.resolve();
    }
    triggerDownload(ticketDataUrl);
    return Promise.resolve();
  };

  const triggerDownload = (dataUrl) => {
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `pkay-30-ticket-${code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {}
  };

  // Apple Wallet — a real .pkpass requires Apple-issued signing on a server.
  // Until that endpoint exists we (a) attempt a hosted endpoint if configured, and
  // (b) fall back to downloading the PNG ticket so the user can save it to their
  // Photos and add to Apple Wallet via Shortcuts. We also prep an .ics so the
  // event lives in their Calendar regardless.
  const addToAppleWallet = async () => {
    const endpoint = window.__PKPASS_ENDPOINT;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, guests: data.guests, code }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `pkay-30-${code}.pkpass`; a.click();
          return;
        }
      } catch (e) { /* fall through */ }
    }
    await downloadPng();
    calendarGcal();
  };

  // Google Wallet — same story: real save-to-wallet links require a signed JWT
  // from your service account. We open the prepared deep link if configured,
  // otherwise download PNG + .ics.
  const addToGoogleWallet = async () => {
    const link = window.__GOOGLE_WALLET_LINK;
    if (link) {
      window.open(link, "_blank");
      return;
    }
    await downloadPng();
    calendarGcal();
  };

  return (
    <div className="stage fade-in" style={{ padding: "40px 24px 60px", position: "relative", overflow: "hidden" }}>
      <FloralCorner position="tl" opacity={0.4} />
      <FloralCorner position="tr" opacity={0.4} />
      <FloralCorner position="bl" opacity={0.4} />
      <FloralCorner position="br" opacity={0.4} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <div className="eyebrow">Confirmed</div>
        <h2 className="serif" style={{ fontSize: "clamp(40px, 12vw, 64px)", lineHeight: 1, margin: "8px 0 4px" }}>
          <span className="gold-text">You are on the list</span>
        </h2>
        <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 18 }}>
          The mask awaits. Below — your ticket.
        </div>

        {/* Ticket card */}
        <div ref={ticketRef} style={{
          marginTop: 28,
          background: "linear-gradient(180deg, rgba(26,14,10,0.95) 0%, rgba(10,8,7,0.98) 100%)",
          border: "1px solid rgba(201,165,92,0.3)",
          borderRadius: 18,
          padding: 0,
          position: "relative",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.9), 0 0 60px -10px rgba(201,165,92,0.2)",
          textAlign: "center",
          overflow: "hidden",
        }}>
          {/* Inner glow */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, rgba(201,165,92,0.15), transparent 70%)" }} />

          {/* Top section */}
          <div style={{ padding: "28px 24px 20px", position: "relative" }}>
            <div className="eyebrow" style={{ fontSize: 10, letterSpacing: "0.4em" }}>P K A Y · 3 0 T H</div>
            <div style={{ marginTop: 10 }}>
              <span className="serif gold-text" style={{ fontSize: "clamp(36px, 10vw, 48px)", lineHeight: 1 }}>Black Tie</span>
            </div>
            <div className="italiana" style={{ fontSize: "clamp(28px, 8vw, 38px)", color: "var(--ivory)", fontStyle: "italic", marginTop: -2 }}>
              Masquerade
            </div>
            <div style={{ width: 80, height: 50, margin: "14px auto 0" }}>
              <img src="assets/mask.svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 12px rgba(201,165,92,0.4))" }} alt="" />
            </div>
          </div>

          {/* Tear line with notches */}
          <div style={{ position: "relative", margin: "0 -1px" }}>
            <div style={{ position: "absolute", left: -10, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", boxShadow: "inset 2px 0 4px rgba(0,0,0,0.4)" }} />
            <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", boxShadow: "inset -2px 0 4px rgba(0,0,0,0.4)" }} />
            <div style={{ borderTop: "2px dashed rgba(201,165,92,0.25)", margin: "0 24px" }} />
          </div>

          {/* Details section */}
          <div style={{ padding: "20px 24px", textAlign: "left" }}>
            {/* Guest name - prominent */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.4em", color: "var(--gold)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>GUEST</div>
              <div className="serif" style={{ fontSize: 28, color: "var(--ivory)", lineHeight: 1 }}>{data.name || "Guest"}</div>
              {data.guestNames && data.guestNames.filter(Boolean).length > 0 && (
                <div style={{ marginTop: 8, fontSize: 14, color: "var(--smoke)", fontFamily: "Cormorant Garamond, serif", fontStyle: "italic" }}>
                  + {data.guestNames.filter(Boolean).join(", ")}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 14px" }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(201,165,92,0.6)", textTransform: "uppercase", fontWeight: 600 }}>ADMIT</div>
                <div className="serif" style={{ fontSize: 20, color: "var(--ivory)", marginTop: 3 }}>{data.guests || 1}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(201,165,92,0.6)", textTransform: "uppercase", fontWeight: 600 }}>DATE</div>
                <div className="serif" style={{ fontSize: 20, color: "var(--ivory)", marginTop: 3 }}>16 May 2026</div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(201,165,92,0.6)", textTransform: "uppercase", fontWeight: 600 }}>TIME</div>
                <div className="serif" style={{ fontSize: 20, color: "var(--ivory)", marginTop: 3 }}>7:00 PM Sharp</div>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(201,165,92,0.6)", textTransform: "uppercase", fontWeight: 600 }}>VENUE</div>
                <div className="serif" style={{ fontSize: 20, color: "var(--ivory)", marginTop: 3 }}>{EVENT.venue}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(201,165,92,0.6)", textTransform: "uppercase", fontWeight: 600 }}>DRESS CODE</div>
                <div className="serif" style={{ fontSize: 20, color: "var(--ivory)", marginTop: 3 }}>Black Tie · Masquerade Mask</div>
              </div>
            </div>
          </div>

          {/* Bottom section - QR & code */}
          <div style={{ padding: "16px 24px 24px", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(201,165,92,0.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <QrSquare value={`PKAY30-${code}-${data.name || ""}`} size={88} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(201,165,92,0.5)", textTransform: "uppercase", fontWeight: 600 }}>TICKET CODE</div>
                <div style={{ fontSize: 16, color: "var(--gold)", letterSpacing: "0.2em", marginTop: 6, fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 500 }}>{code}</div>
                <div style={{ fontSize: 10, letterSpacing: "0.24em", color: "var(--smoke)", textTransform: "uppercase", marginTop: 8 }}>
                  Scan at entry
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Downloadable ticket image — always visible for long-press save */}
        {ticketDataUrl && (
          <div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: "1px solid rgba(201,165,92,0.2)", background: "rgba(0,0,0,0.3)", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "var(--gold-deep)", letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
              Press &amp; hold to save image
            </div>
            <img src={ticketDataUrl} alt="Your ticket" style={{ width: "100%", maxWidth: 300, borderRadius: 8, border: "1px solid rgba(201,165,92,0.15)" }} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <button className="btn-gold" onClick={downloadPng} disabled={savingPng}>
            {savingPng ? "Preparing…" : "Save Ticket to Device"}
          </button>

          {/* Wallet row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button onClick={addToAppleWallet}
              style={{
                appearance: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 12px", borderRadius: 999,
                background: "#000", color: "#fff",
                border: "1px solid rgba(255,255,255,0.18)",
                fontFamily: "Manrope, sans-serif",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 12.04c-.03-2.66 2.17-3.93 2.27-3.99-1.24-1.81-3.17-2.06-3.85-2.09-1.64-.17-3.2.96-4.04.96-.84 0-2.12-.94-3.49-.91-1.79.03-3.45 1.04-4.37 2.64-1.87 3.24-.48 8.04 1.34 10.67.89 1.29 1.95 2.74 3.32 2.69 1.34-.05 1.84-.86 3.46-.86 1.61 0 2.07.86 3.49.83 1.44-.02 2.35-1.31 3.23-2.6 1.02-1.49 1.44-2.94 1.46-3.02-.03-.01-2.79-1.07-2.82-4.32zM14.4 4.36c.74-.9 1.24-2.15 1.1-3.39-1.07.04-2.36.71-3.13 1.6-.69.79-1.29 2.06-1.13 3.27 1.19.09 2.41-.6 3.16-1.48z"/>
              </svg>
              <span style={{ fontSize: 11, lineHeight: 1.1, textAlign: "left" }}>
                <span style={{ display: "block", fontSize: 9, opacity: 0.7, letterSpacing: "0.1em" }}>Add to</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Apple Wallet</span>
              </span>
            </button>

            <button onClick={addToGoogleWallet}
              style={{
                appearance: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 12px", borderRadius: 999,
                background: "#fff", color: "#202124",
                border: "1px solid rgba(0,0,0,0.12)",
                fontFamily: "Manrope, sans-serif",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="13" rx="2" fill="none" stroke="#202124" strokeWidth="1.6"/>
                <path d="M3 10h18" stroke="#202124" strokeWidth="1.6"/>
                <circle cx="17" cy="14.5" r="1.4" fill="#ea4335"/>
                <circle cx="14.6" cy="14.5" r="1.4" fill="#fbbc05"/>
              </svg>
              <span style={{ fontSize: 11, lineHeight: 1.1, textAlign: "left" }}>
                <span style={{ display: "block", fontSize: 9, opacity: 0.6, letterSpacing: "0.1em" }}>Save to</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Google Wallet</span>
              </span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button className="btn-ghost" onClick={calendar}>Download .ics</button>
            <button className="btn-ghost" onClick={calendarGcal}>Google Calendar</button>
          </div>
          <a className="btn-ghost" href={EVENT.mapUrl} target="_blank" rel="noreferrer" style={{ textAlign: "center", textDecoration: "none" }}>
            Open map · {EVENT.venue}
          </a>
          {showAfter && (
            <button className="btn-ghost" onClick={onShowAfter}>
              About the after-party →
            </button>
          )}
          {onEdit && (
            <button className="btn-ghost" onClick={onEdit} style={{ opacity: 0.7 }}>
              Edit my details
            </button>
          )}
        </div>

        {/* Strict time + dress code — front and centre */}
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
          <StrictTimeStamp size="lg" />
          <div style={{ width: "100%" }}>
            <DressCodeBadge />
          </div>
        </div>

        {/* Event details */}
        <div className="card-velvet" style={{ marginTop: 28, padding: 22, textAlign: "left" }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>The Particulars</div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field l="Date" v={EVENT.dateLabel} />
            <Field l="Time" v={`${EVENT.time} sharp · until late`} />
            <Field l="Venue" v={EVENT.venue} />
            <Field l="City" v={EVENT.city} />
            <Field l="Dress" v="Black tie + Mask · Strict" />
            <Field l="Curated" v={EVENT.curatedBy} />
          </div>
        </div>

        {/* Map placeholder */}
        <div style={{ marginTop: 18, padding: 18, borderRadius: 12, border: "1px solid var(--hair)", background: "var(--ink-2)", position: "relative", overflow: "hidden" }}>
          <div style={{ height: 140, borderRadius: 8, position: "relative",
            background: `
              radial-gradient(circle at 70% 40%, rgba(201,165,92,0.4), transparent 30%),
              repeating-linear-gradient(45deg, rgba(201,165,92,0.06) 0 1px, transparent 1px 22px),
              repeating-linear-gradient(-45deg, rgba(244,234,212,0.04) 0 1px, transparent 1px 22px),
              linear-gradient(180deg, #1f1814, #14100e)
            `, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: "70%", top: "40%", transform: "translate(-50%,-50%)" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 8px rgba(201,165,92,0.18), 0 0 0 18px rgba(201,165,92,0.08)" }} />
            </div>
            <div style={{ position: "absolute", left: 16, bottom: 14, fontSize: 11, color: "var(--gold)", letterSpacing: "0.3em", textTransform: "uppercase" }}>{EVENT.venue}</div>
          </div>
          <a className="btn-ghost" href={EVENT.mapUrl} target="_blank" rel="noreferrer" style={{ marginTop: 14, display: "block", textAlign: "center", textDecoration: "none" }}>
            Get directions
          </a>
        </div>

        <div className="serif-italic" style={{ marginTop: 30, color: "var(--smoke)", fontSize: 18 }}>
          Until then — keep the secret.
        </div>
        <div style={{ marginTop: 8, fontSize: 10, letterSpacing: "0.32em", color: "var(--gold-deep)", textTransform: "uppercase" }}>
          Curated by {EVENT.curatedBy}
        </div>
      </div>
    </div>
  );
}

function Field({ l, v }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: "0.32em", color: "var(--gold-deep)", textTransform: "uppercase" }}>{l}</div>
      <div className="serif" style={{ fontSize: 17, color: "var(--ivory)", marginTop: 4, lineHeight: 1.2 }}>{v}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 9. Regrets screen
// ─────────────────────────────────────────────────────────
function RegretsScreen({ data, onBack }) {
  useEffect(() => {
    if (data._sessionId && window.markPartialComplete) window.markPartialComplete(data._sessionId);
  }, []);
  return (
    <div className="stage fade-in velvet" style={{ padding: "60px 28px", position: "relative", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <FloralCorner position="tl" opacity={0.4} />
      <FloralCorner position="br" opacity={0.4} />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 380 }}>
        <div className="eyebrow">Received with grace</div>
        <h2 className="serif" style={{ fontSize: "clamp(40px, 14vw, 64px)", lineHeight: 1, margin: "10px 0" }}>
          <span className="gold-text">You'll be missed</span>
        </h2>
        <div className="serif-italic" style={{ fontSize: 20, color: "var(--smoke)", marginTop: 16, lineHeight: 1.5 }}>
          {data.name ? `${data.name.split(" ")[0]}, ` : ""}thank you for letting us know. The masquerade will hold a candle in your honour.
        </div>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn-ghost" onClick={onBack}>← Change my mind</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 10. After-party reveal
// ─────────────────────────────────────────────────────────
function AfterPartyScreen({ onBack }) {
  return (
    <div className="stage fade-in" style={{ padding: "40px 24px 60px", position: "relative", background: "linear-gradient(180deg, var(--ink) 0%, #1a0608 100%)" }}>
      <FloralCorner position="tl" opacity={0.6} />
      <FloralCorner position="tr" opacity={0.6} />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <button className="btn-ghost" onClick={onBack} style={{ float: "left", padding: "8px 14px", fontSize: 10 }}>← Back</button>
        <div style={{ clear: "both", paddingTop: 30 }} />
        <div className="eyebrow">After dark</div>
        <h2 className="italiana" style={{ fontSize: "clamp(48px, 16vw, 80px)", lineHeight: 1, margin: "12px 0", color: "var(--ivory)", fontStyle: "italic" }}>
          The After-party
        </h2>
        <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 19, lineHeight: 1.5, maxWidth: 320, margin: "0 auto" }}>
          When the dinner candles fade — slip on your mask. The night is only half-told.
        </div>

        <div style={{ width: 200, height: 128, margin: "30px auto" }}>
          <img src="assets/mask.svg" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 30px rgba(201,165,92,0.4))" }} alt=""/>
        </div>

        <div className="card-velvet" style={{ padding: 22, textAlign: "left", maxWidth: 380, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field l="Begins" v="11:00 PM" />
            <Field l="Until" v="The dawn" />
            <Field l="Location" v="Revealed at venue" />
            <Field l="Dress" v="Mask required" />
          </div>
          <div style={{ borderTop: "1px dashed var(--hair-2)", margin: "16px 0" }} />
          <div className="serif-italic" style={{ color: "var(--smoke)", fontSize: 16, lineHeight: 1.5 }}>
            "Masks will be provided on arrival for those without one. To remove yours before the night ends is to break the spell."
          </div>
        </div>

        <button className="btn-gold" style={{ marginTop: 30 }} onClick={onBack}>← Back to my ticket</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Music toggle
// ─────────────────────────────────────────────────────────
function MusicToggle({ on, setOn }) {
  return (
    <button
      onClick={() => setOn(!on)}
      title={on ? "Mute ambient music" : "Play ambient music"}
      style={{
        position: "fixed", top: 16, right: 16, zIndex: 60,
        width: 44, height: 44, borderRadius: "50%",
        border: "1px solid var(--hair-2)",
        background: "rgba(10,8,7,0.65)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        color: "var(--gold)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      {on ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>
          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )}
    </button>
  );
}

// Expose to window for the main app file
Object.assign(window, {
  IntroScreen, CoverScreen, AttendStep, IdentityStep, GuestsStep, MessageStep,
  ContributeStep, TicketScreen, RegretsScreen, AfterPartyScreen,
  MusicToggle, FloralCorner, Petals, EVENT, PALETTE_LABEL,
});
