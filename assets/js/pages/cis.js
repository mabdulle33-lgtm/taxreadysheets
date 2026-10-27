import { bindForm, setOuts, gbp } from '../ui.js';
import { cisRefund } from '../calc.js';
import { RATES } from '../rates-2026-27.js';

const statusLabel = { registered: 'registered', unregistered: 'unregistered', grossPayment: 'gross payment' };

bindForm('calc', (v) => {
  const r = cisRefund({
    gross: v.gross,
    materials: v.materials,
    expenses: v.expenses,
    cisDeducted: v.cisDeducted,
    status: v.status,
    employmentIncome: v.employment,
    scotland: v.scotland
  });

  let headLabel = 'Estimated refund';
  let headline = gbp(r.refund);
  let note;
  if (r.outcome === 'owed') {
    headLabel = 'Estimated amount still to pay';
    headline = gbp(r.owed);
    note = `Your deductions fall ${gbp(r.owed)} short of your real bill. Plan to pay this by ${RATES.selfAssessment.balancingPayment}.`;
  } else if (r.outcome === 'refund') {
    note = `You look to have overpaid by ${gbp(r.refund)}. File your 2026/27 return from 6 April 2027 to claim it back.`;
  } else {
    note = r.deducted === 0 && r.liability === 0 ? 'Enter your figures to see your estimate.' : 'Your deductions match your bill almost exactly — nothing to pay and nothing back.';
  }

  setOuts({
    headLabel,
    headline,
    deducted: gbp(r.deducted),
    profit: gbp(r.profit),
    incomeTax: gbp(r.incomeTax),
    class4: gbp(r.class4),
    liability: gbp(r.liability),
    note,
    estimateNote: r.deductedEstimated
      ? `CIS deducted is an estimate: ${Math.round((RATES.cis[v.status] ?? RATES.cis.registered) * 100)}% of your labour (${gbp(r.labour)}) at ${statusLabel[v.status] || 'registered'} rate. Type your real total for a sharper figure.`
      : ''
  });
  const big = document.querySelector('[data-out="headline"]');
  if (big) big.className = 'big-number ' + (r.outcome === 'owed' ? 'bad-text' : r.outcome === 'refund' ? 'good-text' : '');
});
