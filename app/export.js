// =========================================================
// CSV export — turn the in-memory data into downloadable CSV files.
// window.__export(kind) builds + downloads; used by the command palette
// and the Export buttons. Pure client-side (no upload anywhere).
// =========================================================
(function () {
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const toCsv = (headers, rows) =>
    [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");

  const download = (filename, text) => {
    const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const stamp = () => new Date().toISOString().slice(0, 10);
  const pct = (n) => Math.round((Number(n) || 0) * 100);

  const builders = {
    investments: () => ({
      name: `investments-${stamp()}.csv`,
      headers: ["Name", "Type", "Location", "Developer", "Currency", "Committed", "Funded", "Outstanding", "Progress %", "Current value", "Handover"],
      rows: (window.investments || []).map((i) => [
        i.name, i.kind, i.location, i.developer, i.currency,
        i.priceTotal, i.paid, (i.priceTotal || 0) - (i.paid || 0), pct(i.progress), i.valueNow, i.handover,
      ]),
    }),
    "investment-payments": () => ({
      name: `investment-payments-${stamp()}.csv`,
      headers: ["Investment", "Amount", "Currency", "Date", "Method", "Note"],
      rows: (window.__investmentPayments || []).map((p) => {
        const inv = (window.investments || []).find((i) => i.id === p.investment_id);
        return [inv ? inv.name : p.investment_id, p.amount, p.currency, p.paid_on, p.method, p.note];
      }),
    }),
    loans: () => ({
      name: `loans-${stamp()}.csv`,
      headers: ["Borrower", "Type", "Currency", "Principal", "Paid back", "Outstanding", "Interest %", "Status", "Issued", "Due"],
      rows: (window.loans || []).map((l) => [
        l.borrower, l.type, l.currency, l.principal, l.paidBack,
        (l.principal || 0) - (l.paidBack || 0), pct(l.interest), l.status, l.issued, l.due,
      ]),
    }),
    networth: () => ({
      name: `net-worth-${stamp()}.csv`,
      headers: ["Month", "Net worth (USD)"],
      rows: (window.netWorthMonthly || []).map((p) => [p.m, p.value]),
    }),
    income: () => ({
      name: `income-${stamp()}.csv`,
      headers: ["Month", "Commission", "Referral", "Salary"],
      rows: (window.incomeMonthly || []).map((m) => [m.m, m.commission, m.referral, m.salary]),
    }),
    contracts: () => ({
      name: `contracts-${stamp()}.csv`,
      headers: ["Name", "Type", "Parties", "Value", "Currency", "Status", "Signed", "Expires"],
      rows: (window.contracts || []).map((c) => [
        c.name, c.type, (c.parties || []).join("; "), c.value, c.currency, c.status, c.signedDate, c.expiresDate,
      ]),
    }),
  };

  window.__export = (kind) => {
    const b = builders[kind];
    if (!b) { window.__toast?.("Nothing to export"); return; }
    const { name, headers, rows } = b();
    if (!rows.length) { window.__toast?.("Nothing to export yet"); return; }
    download(name, toCsv(headers, rows));
    window.__toast?.(`Exported ${rows.length} row${rows.length > 1 ? "s" : ""} → ${name}`);
  };
})();
