// =============================================================
// External account connectors.
//
// IMPORTANT — security model
// ----------------------------------------------------------------
// These connectors make signed, authenticated requests from the
// browser using API keys you paste in. They are intended ONLY for
// READ-ONLY keys with no withdrawal / trading permission. Treat
// any key you enter as a low-security secret: anyone with access
// to your signed-in browser tab can see it.
//
// For brokers that require server-side signing (IBKR Client Portal,
// most bank Open Banking APIs) we expose a stub connector that
// surfaces a "Requires gateway" status until you wire up a proxy.
// =============================================================
(function () {
  "use strict";

  // ---- crypto helpers --------------------------------------------------
  const enc = new TextEncoder();
  const toHex = (buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const toB64 = (buf) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64 = (str) =>
    Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

  async function hmac(key, message, algo, output) {
    const keyBuf = typeof key === "string" ? enc.encode(key) : key;
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyBuf, { name: "HMAC", hash: algo }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC", cryptoKey, typeof message === "string" ? enc.encode(message) : message
    );
    return output === "hex" ? toHex(sig) : output === "b64" ? toB64(sig) : sig;
  }

  async function sha256(message) {
    const buf = await crypto.subtle.digest(
      "SHA-256", typeof message === "string" ? enc.encode(message) : message
    );
    return buf;
  }

  // ---- shared utils ----------------------------------------------------

  // Map provider symbol to a clean display symbol + class
  const classify = (sym, providerCls) => {
    const cls = providerCls || (
      /^(BTC|ETH|SOL|USDT|USDC|BNB|ADA|XRP|DOGE|LTC|AVAX|MATIC|DOT|TRX|LINK|UNI|ATOM)/i.test(sym)
        ? "Crypto"
        : "Stock"
    );
    return cls;
  };

  // ---------------------------------------------------------------
  // 1. BINANCE
  //    https://binance-docs.github.io/apidocs/spot/en/
  //    CORS-enabled on api.binance.com. Read-only keys are sufficient
  //    for /api/v3/account.
  // ---------------------------------------------------------------
  const binance = {
    id: "binance",
    label: "Binance",
    kind: "Crypto exchange",
    asset: "Spot wallet + balances",
    needs: ["apiKey", "apiSecret"],
    docsUrl: "https://www.binance.com/en/my/settings/api-management",
    notes:
      "Create a key with Enable Reading only. Disable Spot/Margin trading and withdrawals for safety.",

    async test(creds) {
      // Lightest signed call: GET /api/v3/account
      const account = await this._signedGet(creds, "/api/v3/account", {});
      return {
        accountType: account.accountType,
        canTrade: account.canTrade,
        canWithdraw: account.canWithdraw,
        balances: (account.balances || []).filter(
          (b) => Number(b.free) + Number(b.locked) > 0
        ).length,
      };
    },

    async syncPositions(creds) {
      const account = await this._signedGet(creds, "/api/v3/account", {});
      const balances = (account.balances || [])
        .map((b) => ({
          sym: b.asset,
          qty: Number(b.free) + Number(b.locked),
        }))
        .filter((b) => b.qty > 0 && !["USDT", "USDC", "BUSD", "FDUSD", "DAI"].includes(b.sym));

      if (balances.length === 0) return [];

      // Build symbol set we need a USDT price for
      const symbols = balances.map((b) => b.sym + "USDT");
      const priceRes = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(symbols))}`
      ).catch(() => null);
      const prices = priceRes && priceRes.ok ? await priceRes.json() : [];
      const priceMap = Object.fromEntries(prices.map((p) => [p.symbol, Number(p.price)]));

      return balances
        .map((b) => {
          const last = priceMap[b.sym + "USDT"];
          if (!last) return null;
          return {
            sym: b.sym,
            name: b.sym,
            cls: "Crypto",
            qty: b.qty,
            avg: last,   // we don't know cost basis from /account; use last so PnL = 0 until user overrides
            last,
            externalId: `binance:${b.sym}`,
          };
        })
        .filter(Boolean);
    },

    async _signedGet(creds, path, params) {
      const ts = Date.now();
      const query = new URLSearchParams({ ...params, timestamp: ts, recvWindow: 10000 }).toString();
      const sig = await hmac(creds.apiSecret, query, "SHA-256", "hex");
      const url = `https://api.binance.com${path}?${query}&signature=${sig}`;
      const res = await fetch(url, { headers: { "X-MBX-APIKEY": creds.apiKey } });
      if (!res.ok) {
        let body = "";
        try { body = await res.text(); } catch (e) {}
        throw new Error(`Binance ${res.status}: ${body || res.statusText}`);
      }
      return res.json();
    },
  };

  // ---------------------------------------------------------------
  // 2. KRAKEN
  //    https://docs.kraken.com/rest/
  //    Private endpoints sign with HMAC-SHA512 using the base64-
  //    decoded secret. Note: Kraken's CORS policy varies; if a
  //    request errors with a network/CORS message, the user needs
  //    to enable a CORS proxy.
  // ---------------------------------------------------------------
  const kraken = {
    id: "kraken",
    label: "Kraken",
    kind: "Crypto exchange",
    asset: "Account balance + open positions",
    needs: ["apiKey", "apiSecret"],
    docsUrl: "https://www.kraken.com/u/security/api",
    notes:
      "Create a key with the Query Funds permission only. Browser-side calls may need a CORS proxy.",

    async test(creds) {
      const balance = await this._signedPost(creds, "/0/private/Balance", {});
      return { assets: Object.keys(balance).length };
    },

    async syncPositions(creds) {
      const balance = await this._signedPost(creds, "/0/private/Balance", {});
      // Normalize Kraken asset names (e.g., XXBT -> BTC, XETH -> ETH, ZUSD -> USD)
      const normalize = (k) => {
        const m = { XXBT: "BTC", XBT: "BTC", XETH: "ETH", XLTC: "LTC", XXRP: "XRP", ZUSD: "USD", ZEUR: "EUR", ZGBP: "GBP" };
        return m[k] || (k.length === 4 && k.startsWith("X") ? k.slice(1) : k);
      };

      const holdings = Object.entries(balance)
        .map(([k, v]) => ({ sym: normalize(k), qty: Number(v) }))
        .filter((h) => h.qty > 0 && !["USD", "EUR", "GBP", "USDT", "USDC", "DAI"].includes(h.sym));

      if (holdings.length === 0) return [];

      // Public ticker
      const pairs = holdings.map((h) => `${h.sym}USD`).join(",");
      const tickerRes = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pairs}`);
      const ticker = await tickerRes.json();
      const priceMap = {};
      for (const k of Object.keys(ticker.result || {})) {
        const last = Number(ticker.result[k].c?.[0]);
        // Try to find the matching base symbol
        const matched = holdings.find((h) => k.includes(h.sym));
        if (matched) priceMap[matched.sym] = last;
      }

      return holdings
        .map((h) => {
          const last = priceMap[h.sym];
          if (!last) return null;
          return {
            sym: h.sym,
            name: h.sym,
            cls: "Crypto",
            qty: h.qty,
            avg: last,
            last,
            externalId: `kraken:${h.sym}`,
          };
        })
        .filter(Boolean);
    },

    async _signedPost(creds, path, params) {
      const nonce = Date.now().toString() + Math.floor(Math.random() * 1000);
      const body = new URLSearchParams({ ...params, nonce }).toString();
      // sign = HMAC-SHA512(base64-decode(secret), path + SHA256(nonce + body))
      const hashed = await sha256(nonce + body);
      const merged = new Uint8Array(enc.encode(path).length + hashed.byteLength);
      merged.set(enc.encode(path), 0);
      merged.set(new Uint8Array(hashed), enc.encode(path).length);
      const secretKey = fromB64(creds.apiSecret);
      const sig = await hmac(secretKey, merged, "SHA-512", "b64");

      const res = await fetch(`https://api.kraken.com${path}`, {
        method: "POST",
        headers: {
          "API-Key": creds.apiKey,
          "API-Sign": sig,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!res.ok) throw new Error(`Kraken ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (json.error && json.error.length) throw new Error(json.error.join(", "));
      return json.result;
    },
  };

  // ---------------------------------------------------------------
  // 3. COINBASE (Coinbase Exchange / Advanced Trade)
  //    Uses an HMAC-SHA256 signature over (timestamp + method + path + body).
  //    The retail Coinbase API has switched to JWT for Advanced Trade — this
  //    connector uses the simpler Exchange Pro API endpoint, which still
  //    works for most personal accounts. If your key was issued for the
  //    JWT-only flow this connector will return an auth error.
  // ---------------------------------------------------------------
  const coinbase = {
    id: "coinbase",
    label: "Coinbase",
    kind: "Crypto exchange",
    asset: "Account balances",
    needs: ["apiKey", "apiSecret", "passphrase"],
    docsUrl: "https://docs.cloud.coinbase.com/exchange/docs/authorization-and-authentication",
    notes:
      "Create an Exchange/Pro API key with View permission only. Newer keys require JWT auth — those aren't supported yet.",

    async test(creds) {
      const accounts = await this._signedGet(creds, "/accounts");
      return { accounts: accounts.length };
    },

    async syncPositions(creds) {
      const accounts = await this._signedGet(creds, "/accounts");
      const holdings = accounts
        .map((a) => ({ sym: a.currency, qty: Number(a.balance) }))
        .filter((h) => h.qty > 0 && !["USD", "EUR", "GBP", "USDT", "USDC"].includes(h.sym));
      if (holdings.length === 0) return [];

      // Public ticker for each
      const prices = await Promise.all(holdings.map(async (h) => {
        try {
          const r = await fetch(`https://api.exchange.coinbase.com/products/${h.sym}-USD/ticker`);
          if (!r.ok) return null;
          const j = await r.json();
          return [h.sym, Number(j.price)];
        } catch (e) { return null; }
      }));
      const priceMap = Object.fromEntries(prices.filter(Boolean));

      return holdings.map((h) => {
        const last = priceMap[h.sym];
        if (!last) return null;
        return {
          sym: h.sym, name: h.sym, cls: "Crypto",
          qty: h.qty, avg: last, last,
          externalId: `coinbase:${h.sym}`,
        };
      }).filter(Boolean);
    },

    async _signedGet(creds, path) {
      const ts = Math.floor(Date.now() / 1000).toString();
      const method = "GET";
      const message = ts + method + path;
      const secretKey = fromB64(creds.apiSecret);
      const sig = await hmac(secretKey, message, "SHA-256", "b64");
      const res = await fetch(`https://api.exchange.coinbase.com${path}`, {
        headers: {
          "CB-ACCESS-KEY": creds.apiKey,
          "CB-ACCESS-SIGN": sig,
          "CB-ACCESS-TIMESTAMP": ts,
          "CB-ACCESS-PASSPHRASE": creds.passphrase || "",
        },
      });
      if (!res.ok) {
        let body = "";
        try { body = await res.text(); } catch (e) {}
        throw new Error(`Coinbase ${res.status}: ${body || res.statusText}`);
      }
      return res.json();
    },
  };

  // ---------------------------------------------------------------
  // 4. INTERACTIVE BROKERS (IBKR)
  //    The IBKR Client Portal Web API only works against the user's
  //    own local gateway. From a static webpage we can either:
  //      a) point to a self-hosted gateway URL, or
  //      b) accept a manual position export (CSV) until a backend
  //         relay is built.
  //    We default to mode (a) here. Endpoint field collects the
  //    gateway base URL, e.g. https://localhost:5000/v1/api.
  // ---------------------------------------------------------------
  const ibkr = {
    id: "ibkr",
    label: "Interactive Brokers",
    kind: "Broker · stocks, options, FX",
    asset: "Open positions + account NLV",
    needs: ["endpoint"],
    docsUrl: "https://www.interactivebrokers.com/en/index.php?f=5041",
    requiresGateway: true,
    notes:
      "Requires the IBKR Client Portal Gateway running locally and an authenticated browser session in that gateway.",

    async test(creds) {
      const base = (creds.endpoint || "").replace(/\/$/, "");
      if (!base) throw new Error("Set the Client Portal Gateway base URL first.");
      const res = await fetch(`${base}/iserver/auth/status`, { credentials: "include" });
      if (!res.ok) throw new Error(`IBKR ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (!data.authenticated) {
        throw new Error("Gateway running but not authenticated. Log in at the gateway URL first.");
      }
      return { gateway: base, connected: !!data.connected };
    },

    async syncPositions(creds) {
      const base = (creds.endpoint || "").replace(/\/$/, "");
      // Need account id first
      const accRes = await fetch(`${base}/iserver/accounts`, { credentials: "include" });
      if (!accRes.ok) throw new Error("Could not list IBKR accounts.");
      const acc = await accRes.json();
      const accountId = acc.accounts?.[0] || acc.selectedAccount;
      if (!accountId) throw new Error("No IBKR account found in gateway session.");

      const posRes = await fetch(`${base}/portfolio/${accountId}/positions/0`, { credentials: "include" });
      if (!posRes.ok) throw new Error("Could not fetch IBKR positions.");
      const positions = await posRes.json();

      return positions
        .filter((p) => Math.abs(Number(p.position)) > 0)
        .map((p) => ({
          sym: p.contractDesc || p.ticker || String(p.conid),
          name: p.name || p.contractDesc || "",
          cls: classify(p.contractDesc, p.assetClass === "STK" ? "Stock" : p.assetClass === "ETF" ? "ETF" : p.assetClass),
          qty: Number(p.position),
          avg: Number(p.avgCost) || Number(p.avgPrice) || 0,
          last: Number(p.mktPrice) || Number(p.lastPrice) || 0,
          externalId: `ibkr:${p.conid}`,
        }));
    },
  };

  // ---------------------------------------------------------------
  // 5. GOOGLE FINANCE (via a Google Sheet running =GOOGLEFINANCE())
  //
  // Google killed their public Finance API in 2012 — the realistic
  // way to use Google's live quotes is to point this connector at a
  // Google Sheet containing =GOOGLEFINANCE() formulas and let the
  // tape pull values via the public gviz endpoint (CORS-enabled,
  // no API key, works for any "Anyone with link" sheet).
  //
  // Expected sheet layout (tab name: "tickers", row 1 = headers):
  //
  //   A: Symbol         (e.g. NVDA, BTC-USD, CURRENCY:USDGHS, ^GSPC)
  //   B: Display        (e.g. NVDA, BTC, USD/GHS, S&P 500)
  //   C: Type           (Stock | ETF | Crypto | FX | Index)
  //   D: Price          =GOOGLEFINANCE(A2)
  //   E: Change %       =GOOGLEFINANCE(A2,"changepct")   ← for stocks
  //                   OR =(D2-INDEX(GOOGLEFINANCE(A2,"price",WORKDAY(TODAY(),-2),WORKDAY(TODAY(),-1)),2,2))
  //                       / INDEX(...) * 100             ← for CURRENCY: pairs
  //   F: Decimals       optional (2, 3, 4 — defaults sensibly)
  // ---------------------------------------------------------------
  const googlefinance = {
    id: "googlefinance",
    label: "Google Finance",
    kind: "Market data · via Google Sheets",
    asset: "Live quotes for tape, FX engine, and net worth",
    needs: ["endpoint"],          // re-uses the endpoint field to store the sheet id
    docsUrl: "https://support.google.com/docs/answer/3093281",
    notes:
      'Create a Google Sheet, add a tab named "tickers" with the columns documented in the sidebar tooltip, share it as "Anyone with the link can view", then paste the sheet ID (or full URL) below.',

    extractSheetId(input) {
      if (!input) return "";
      const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      return (m ? m[1] : input).trim();
    },

    async _loadRows(creds) {
      const id = this.extractSheetId(creds.endpoint || "");
      if (!id) throw new Error("Provide a Google Sheet URL or ID.");
      const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=tickers`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Sheet not found or no tab named "tickers". Check the sheet ID and tab name.');
        if (res.status === 401 || res.status === 403) throw new Error('Sheet is not shared publicly. Set sharing to "Anyone with the link can view".');
        throw new Error(`Google Sheets ${res.status}: ${res.statusText}`);
      }
      const text = await res.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error('Sheet has no data rows — add at least one ticker beneath the header.');
      // Drop header row and require at least Symbol + Display + Price
      return rows.slice(1)
        .filter((r) => (r[0] || "").trim() && (r[3] || "").trim())
        .map((r) => ({
          symbol:   (r[0] || "").trim(),
          display:  (r[1] || r[0] || "").trim(),
          type:     ((r[2] || "Stock").trim()),
          price:    Number(String(r[3]).replace(/[,$]/g, "")),
          delta:    Number(String(r[4] || "0").replace(/[,%]/g, "")) || 0,
          decimals: r[5] ? Number(r[5]) : null,
        }))
        .filter((t) => !isNaN(t.price));
    },

    async test(creds) {
      const rows = await this._loadRows(creds);
      return {
        sheetId: this.extractSheetId(creds.endpoint || ""),
        tickers: rows.length,
        sample: rows.slice(0, 3).map((r) => `${r.display}: ${r.price}`),
      };
    },

    // Push everything into window.tradingTickers + window.FX_RATES.
    // Returns [] for the positions sync (this provider doesn't manage holdings).
    async syncPositions(creds) {
      const rows = await this._loadRows(creds);

      // Re-build the tape from this sheet, preserving the configured order
      const arr = rows.map((r) => ({
        sym:     r.display,
        price:   r.price,
        delta:   r.delta,
        priceDp: r.decimals != null ? r.decimals : (r.price >= 100 ? 2 : r.price >= 1 ? 3 : 4),
      }));
      if (Array.isArray(window.tradingTickers)) {
        window.tradingTickers.length = 0;
        arr.forEach((row) => window.tradingTickers.push(row));
      } else {
        window.tradingTickers = arr;
      }

      // Update the conversion engine when the user has FX rows.
      // We expect rows like { display: "USD/GHS", type: "FX", price: 14.5 }
      rows.forEach((r) => {
        if ((r.type || "").toUpperCase() !== "FX") return;
        const m = r.display.match(/USD\s*\/\s*([A-Z]{3})/i);
        if (!m) return;
        const code = m[1].toUpperCase();
        if (window.FX_RATES && code in window.FX_RATES) window.FX_RATES[code] = r.price;
      });

      // Mark this as the active feed so tickers.js stays out of the way
      window.__googleFinanceActive = true;
      window.__bumpRev?.();

      // Notify any MarketTape subscribers so the UI repaints immediately
      // (mirrors the notification path inside tickers.js).
      if (window.tickers?._notify) window.tickers._notify();

      return []; // Google Finance doesn't hold positions of its own
    },
  };

  // Minimal CSV parser that handles quoted fields with embedded commas / quotes.
  function parseCsv(text) {
    const rows = [];
    let row = [], field = "", inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (inQuotes) {
        if (c === '"' && n === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { row.push(field); field = ""; }
        else if (c === "\n" || c === "\r") {
          if (field || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
          if (c === "\r" && n === "\n") i++;
        } else field += c;
      }
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // ---------------------------------------------------------------
  // 6. MANUAL — no-op connector for "add positions by hand"
  // ---------------------------------------------------------------
  const manual = {
    id: "manual",
    label: "Manual",
    kind: "Hand-entered positions",
    asset: "Whatever you enter via + New trade",
    needs: [],
    notes: "Use this when you don't want an API connection — positions are added by hand.",
    async test() { return { ok: true }; },
    async syncPositions() { return []; },
  };

  // ---------------------------------------------------------------
  // Catalog
  // ---------------------------------------------------------------
  const CATALOG = [googlefinance, binance, kraken, coinbase, ibkr, manual];

  window.connectors = {
    list: () => CATALOG,
    get: (id) => CATALOG.find((c) => c.id === id),
    // High-level sync entry point — used by the integrations screen.
    // Returns the array of positions written so the UI can update.
    async sync(integration) {
      const c = CATALOG.find((x) => x.id === integration.provider);
      if (!c) throw new Error(`Unknown provider: ${integration.provider}`);

      // Google Finance is a market-data source, not a position source.
      // It updates the tape + FX engine and reports its own sync metadata
      // (number of tickers, not number of holdings).
      if (c.id === "googlefinance") {
        const rows = await c._loadRows(integration);
        await c.syncPositions(integration); // performs the actual data push
        if (window.db?.integrations?.update) {
          await window.db.integrations.update(integration.id, {
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: "ok",
            lastSyncCount: rows.length,
            status: "connected",
            metadata: { ...(integration.metadata || {}), kind: "market-data", tickerCount: rows.length },
          });
        }
        return [];
      }

      const positions = await c.syncPositions(integration);
      if (window.db?.integrations?.syncPositions) {
        await window.db.integrations.syncPositions(integration, positions);
      }
      return positions;
    },
  };
})();
