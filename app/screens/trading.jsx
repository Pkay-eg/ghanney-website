// =========================================================
// Trading desk
// =========================================================

const TradingScreen = () => {
  const [tab, setTab] = useState("All");
  const cls = tab === "All" ? null : tab;
  const positions = cls ? tradingPositions.filter((p) => p.cls === cls) : tradingPositions;

  const totalValue = tradingPositions.reduce((s, p) => s + p.qty * p.last, 0);
  const totalCost  = tradingPositions.reduce((s, p) => s + p.qty * p.avg, 0);
  const pnlAbs = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (pnlAbs / totalCost) * 100 : null;

  const cryptoValue = tradingPositions.filter((p) => p.cls === "Crypto").reduce((s, p) => s + p.qty * p.last, 0);
  const stockValue = tradingPositions.filter((p) => p.cls === "Stock").reduce((s, p) => s + p.qty * p.last, 0);
  const etfValue = tradingPositions.filter((p) => p.cls === "ETF").reduce((s, p) => s + p.qty * p.last, 0);

  return (
    <div className="fade-in" data-screen-label="04 Trading">
      <Topbar title="Trading desk" subtitle="Markets" />
      <div className="content">
        {/* tape — live data from CoinGecko (crypto) + Frankfurter (FX) + Yahoo (stocks) */}
        <MarketTape />

        <div className="grid-12">
          {/* Big P&L */}
          <div className="card pad-lg span-8">
            <div className="row between">
              <div>
                <div className="eyebrow">Portfolio Value</div>
                <div style={{ marginTop: 8 }}><Display value={totalValue} /></div>
                <div className="row gap-3" style={{ marginTop: 10 }}>
                  <Delta value={pnlPct} />
                  {pnlPct != null ? (
                    <>
                      <span className="muted" style={{ fontSize: 12.5 }}>unrealised · </span>
                      <span className={`mono ${pnlAbs >= 0 ? "pos" : "neg"}`} style={{ fontSize: 12.5 }}>{pnlAbs >= 0 ? "+" : "-"}${Math.abs(pnlAbs).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </>
                  ) : (
                    <span className="muted" style={{ fontSize: 12.5 }}>No positions yet</span>
                  )}
                </div>
              </div>
              <div className="row gap-2">
                {["1D", "1W", "1M", "3M", "6M", "YTD"].map((t) => (
                  <button key={t} className={`btn sm ${t === "6M" ? "primary" : ""}`}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              {tradingPositions.length === 0 ? (
                <div className="muted" style={{ padding: "32px 0", textAlign: "center", fontSize: 13 }}>
                  No P&L yet — record your first trade with <b style={{ color: "var(--ink)" }}>+ New</b>.
                </div>
              ) : (
                <AreaChart data={tradingPnL} valueKey="v" color="var(--accent)" height={220}
                  formatY={(v) => "$" + (v/1000).toFixed(0) + "K"} formatTip={(v) => "$" + v.toLocaleString()} />
              )}
            </div>
          </div>

          {/* allocation */}
          <div className="card pad-lg span-4">
            <div className="eyebrow" style={{ marginBottom: 14 }}>Allocation</div>
            {tradingPositions.length === 0 ? (
              <div className="muted" style={{ padding: "60px 0", textAlign: "center", fontSize: 13 }}>
                No positions yet.
              </div>
            ) : (
              <>
                <div className="row gap-4" style={{ alignItems: "center" }}>
                  <Donut
                    data={[
                      { label: "Stocks", value: stockValue, color: "var(--ink)" },
                      { label: "Crypto", value: cryptoValue, color: "var(--negative)" },
                      { label: "ETFs", value: etfValue, color: "var(--positive)" },
                    ]}
                    size={140} thickness={18}
                  />
                  <div className="col gap-3" style={{ flex: 1, fontSize: 12 }}>
                    <div className="row between"><span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--ink)" }} />Stocks</span><span className="mono">${(stockValue/1000).toFixed(0)}K</span></div>
                    <div className="row between"><span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--negative)" }} />Crypto</span><span className="mono">${(cryptoValue/1000).toFixed(0)}K</span></div>
                    <div className="row between"><span className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--positive)" }} />ETFs</span><span className="mono">${(etfValue/1000).toFixed(0)}K</span></div>
                  </div>
                </div>
                <div className="hr" style={{ margin: "16px 0" }} />
                {(() => {
                  const ranked = tradingPositions
                    .map((p) => ({ sym: p.sym, pct: p.avg > 0 ? ((p.last - p.avg) / p.avg) * 100 : 0 }))
                    .sort((a, b) => b.pct - a.pct);
                  const best = ranked[0];
                  const worst = ranked[ranked.length - 1];
                  return (
                    <div className="col gap-3" style={{ fontSize: 12 }}>
                      <div className="row between">
                        <span className="muted">Best performer</span>
                        <span>{best.sym} <span className={`mono ${best.pct >= 0 ? "pos" : "neg"}`}>{best.pct >= 0 ? "+" : ""}{best.pct.toFixed(1)}%</span></span>
                      </div>
                      <div className="row between">
                        <span className="muted">Worst performer</span>
                        <span>{worst.sym} <span className={`mono ${worst.pct >= 0 ? "pos" : "neg"}`}>{worst.pct >= 0 ? "+" : ""}{worst.pct.toFixed(1)}%</span></span>
                      </div>
                      <div className="row between"><span className="muted">Open positions</span><span className="mono">{tradingPositions.length}</span></div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* positions table */}
          <div className="card span-12">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="eyebrow">Open positions</div>
                <div className="h-section" style={{ marginTop: 4 }}>{positions.length} positions · ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="row gap-2">
                {["All", "Stock", "Crypto", "ETF"].map((t) => (
                  <button key={t} className={`btn sm ${tab === t ? "primary" : ""}`} onClick={() => setTab(t)}>{t}</button>
                ))}
                <button className="btn sm primary" onClick={() => window.__openForm?.("trade")}><Icon name="plus" size={12} />New trade</button>
              </div>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Class</th>
                  <th className="num">Qty</th>
                  <th className="num">Avg Cost</th>
                  <th className="num">Last</th>
                  <th className="num">Market Value</th>
                  <th>Trend · 30d</th>
                  <th className="num">P&L</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const value = p.qty * p.last;
                  const cost = p.qty * p.avg;
                  const pnl = value - cost;
                  const pct = ((p.last - p.avg) / p.avg) * 100;
                  // fake sparkline data
                  const spark = Array.from({ length: 18 }, (_, i) => p.avg + (p.last - p.avg) * (i / 17) * (0.8 + Math.sin(i + p.sym.charCodeAt(0)) * 0.18));
                  return (
                    <tr key={p.sym} className="clickable">
                      <td>
                        <div className="row gap-3">
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11, color: p.cls === "Crypto" ? "var(--negative)" : "var(--ink)" }}>{p.sym.slice(0,1)}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.sym}</div>
                            <div className="muted" style={{ fontSize: 11 }}>{p.name}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="chip ghost">{p.cls}</span></td>
                      <td className="num mono">{p.qty}</td>
                      <td className="num mono">${p.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="num mono">${p.last.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="num mono">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={{ width: 100 }}><Sparkline data={spark} color={pnl >= 0 ? "var(--positive)" : "var(--negative)"} height={24} strokeW={1.4} /></td>
                      <td className="num">
                        <div className={`mono ${pnl >= 0 ? "pos" : "neg"}`}>{pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className={pct >= 0 ? "pos" : "neg"} style={{ fontSize: 11 }}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</div>
                      </td>
                      <td className="row gap-2 muted">
                        <button className="btn ghost sm">Buy</button>
                        <button className="btn ghost sm">Sell</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recent activity */}
          <div className="card span-8">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Recent trades</div>
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Action</th><th>Symbol</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Total</th><th>Venue</th></tr>
              </thead>
              <tbody>
                {[
                  ["May 22", "Buy",  "NVDA",  10,   487.20, "Interactive Brokers"],
                  ["May 20", "Sell", "AAPL",  25,   192.10, "Interactive Brokers"],
                  ["May 18", "Buy",  "SOL",   8,    158.20, "Coinbase"],
                  ["May 14", "Buy",  "VOO",   12,   498.30, "Interactive Brokers"],
                  ["May 10", "Sell", "BTC",   0.15, 67200,  "Kraken"],
                  ["May 06", "Buy",  "ASML",  4,    868.40, "Interactive Brokers"],
                  ["May 02", "Buy",  "ETH",   1.2,  3580,   "Coinbase"],
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 12 }}>{r[0]}</td>
                    <td><span className={`chip ${r[1] === "Buy" ? "pos" : "neg"}`}>{r[1]}</span></td>
                    <td style={{ fontWeight: 500 }}>{r[2]}</td>
                    <td className="num mono">{r[3]}</td>
                    <td className="num mono">${r[4].toLocaleString()}</td>
                    <td className="num mono">${(r[3]*r[4]).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="muted" style={{ fontSize: 11 }}>{r[5]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Watchlist */}
          <div className="card span-4">
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="eyebrow">Watchlist</div>
              <button className="btn ghost sm"><Icon name="plus" size={12} /></button>
            </div>
            <div className="col">
              {[
                { sym: "TSLA", name: "Tesla",      last: 248.40, delta: +1.85 },
                { sym: "META", name: "Meta",       last: 488.90, delta: +0.72 },
                { sym: "AMD",  name: "AMD",        last: 168.30, delta: -0.42 },
                { sym: "AVGO", name: "Broadcom",   last: 1452.0, delta: +2.10 },
                { sym: "PYPL", name: "PayPal",     last: 64.20,  delta: -1.20 },
                { sym: "MARA", name: "Marathon",   last: 21.40,  delta: +3.40 },
              ].map((w) => (
                <div key={w.sym} className="row between" style={{ padding: "10px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{w.sym}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{w.name}</div>
                  </div>
                  <div className="col items-end">
                    <div className="mono" style={{ fontSize: 12 }}>${w.last.toLocaleString()}</div>
                    <div className={`mono ${w.delta >= 0 ? "pos" : "neg"}`} style={{ fontSize: 11 }}>{w.delta >= 0 ? "+" : ""}{w.delta.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.TradingScreen = TradingScreen;
