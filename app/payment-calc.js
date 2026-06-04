// =============================================================
// Payment calculator — loan amortization, balloon, instalments
// Used by Add Loan, Add Investment, and Log repayment forms.
// =============================================================
(function () {
  "use strict";

  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  function parseDueToIso(due) {
    if (!due || due === "—") return null;
    const s = String(due).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  /** Whole months between two ISO dates (YYYY-MM-DD). */
  function termMonthsFromDates(startIso, endIso) {
    if (!startIso || !endIso) return null;
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (end.getDate() < start.getDate()) months -= 1;
    return Math.max(1, months);
  }

  /** Months from startIso until endIso (or from today if start omitted). */
  function remainingMonthsFromDates(endIso, startIso) {
    const from = startIso ? new Date(startIso) : new Date();
    const end = new Date(endIso);
    if (isNaN(end.getTime()) || end <= from) return null;
    let months = (end.getFullYear() - from.getFullYear()) * 12 + (end.getMonth() - from.getMonth());
    if (end.getDate() < from.getDate()) months -= 1;
    return Math.max(1, months);
  }

  /**
   * Standard loan schedule from principal + APR + term.
   * @param {object} opts
   * @param {number|string} opts.principal
   * @param {number|string} opts.annualRatePct  — APR as percent (e.g. 12 for 12%)
   * @param {number} opts.termMonths
   * @param {'monthly'|'quarterly'|'balloon'} opts.plan
   */
  function loanSchedule({ principal, annualRatePct, termMonths, plan = "monthly" }) {
    const P = Number(principal);
    if (!P || P <= 0 || !isFinite(P)) return null;

    const apr = Math.max(0, Number(annualRatePct) || 0) / 100;
    const n = Math.max(1, Math.floor(Number(termMonths) || 12));

    if (plan === "balloon") {
      const years = n / 12;
      const totalInterest = round2(P * apr * years);
      const lumpSum = round2(P + totalInterest);
      return {
        plan: "balloon",
        periodPayment: lumpSum,
        periodLabel: "Lump sum at maturity",
        paymentCount: 1,
        totalInterest,
        totalRepayment: lumpSum,
        principal: P,
      };
    }

    const periodsPerYear = plan === "quarterly" ? 4 : 12;
    const r = apr / periodsPerYear;
    const numPayments = plan === "quarterly" ? Math.max(1, Math.ceil(n / 3)) : n;

    let periodPayment;
    if (r === 0) {
      periodPayment = round2(P / numPayments);
    } else {
      const factor = Math.pow(1 + r, numPayments);
      periodPayment = round2((P * r * factor) / (factor - 1));
    }

    const totalRepayment = round2(periodPayment * numPayments);
    const totalInterest = round2(totalRepayment - P);

    return {
      plan,
      periodPayment,
      periodLabel: plan === "quarterly" ? "Per quarter" : "Per month",
      paymentCount: numPayments,
      totalInterest,
      totalRepayment,
      principal: P,
    };
  }

  /** Equal instalments on outstanding commitment (off-plan, etc.). */
  function splitInstalments({ outstanding, count }) {
    const o = Number(outstanding);
    const c = Math.max(1, Math.floor(Number(count) || 1));
    if (!o || o <= 0 || !isFinite(o)) return null;
    const perInstalment = round2(o / c);
    return {
      perInstalment,
      count: c,
      total: round2(o),
      lastInstalment: round2(o - perInstalment * (c - 1)),
    };
  }

  /**
   * Suggest next payment when logging a repayment against an existing loan.
   * Uses remaining balance and time left until due date.
   */
  function suggestLoanRepayment(loan, asOfIso) {
    if (!loan) return null;
    const outstanding = (Number(loan.principal) || 0) - (Number(loan.paidBack) || 0);
    if (outstanding <= 0) return null;

    const ratePct = (Number(loan.interest) || 0) * 100;
    const plan = loan.repaymentPlan || "monthly";

    const dueIso = parseDueToIso(loan.due);
    const issuedIso = parseDueToIso(loan.issued) || (loan.issued && /^\d{4}-\d{2}-\d{2}/.test(loan.issued) ? loan.issued.slice(0, 10) : null);

    let termMonths = dueIso ? remainingMonthsFromDates(dueIso, asOfIso) : null;
    if (!termMonths && issuedIso && dueIso) {
      termMonths = termMonthsFromDates(issuedIso, dueIso);
    }
    if (!termMonths) termMonths = 12;

    const sched = loanSchedule({
      principal: outstanding,
      annualRatePct: ratePct,
      termMonths,
      plan,
    });
    if (!sched) return null;

    return {
      ...sched,
      outstanding,
      note: plan === "balloon"
        ? "Remaining balance + interest to maturity"
        : `Based on ${sched.paymentCount} remaining ${plan === "quarterly" ? "quarters" : "months"}`,
    };
  }

  window.paymentCalc = {
    round2,
    termMonthsFromDates,
    remainingMonthsFromDates,
    loanSchedule,
    splitInstalments,
    suggestLoanRepayment,
  };
})();
