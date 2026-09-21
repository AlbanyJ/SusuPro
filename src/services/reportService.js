// ============================================================
// src/services/reportService.js
// WHAT:   Builds a shareable PDF report for a date range — totals,
//         per-customer breakdown, collector performance, and
//         payment method split — then opens the native share sheet.
// ============================================================

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PERIOD_LABELS = { '7': 'Last 7 Days', '30': 'Last 30 Days', all: 'All Time' };
const METHOD_LABELS = { cash: 'Cash', momo: 'Mobile Money', bank: 'Bank Transfer' };

function fmt(n) {
  return `GHS ${Number(n || 0).toLocaleString('en-GH')}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ── FILTER TRANSACTIONS BY PERIOD ─────────────────────────────
export function filterByPeriod(transactions, period) {
  if (period === 'all') return transactions;
  const days = period === '7' ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return transactions.filter(t => t.date >= cutoffStr);
}

function buildReportHtml({ customers, transactions, period, businessName }) {
  const totalCollected = transactions.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);

  // Per-customer breakdown
  const byCustomer = {};
  transactions.forEach(t => {
    if (!byCustomer[t.customerId]) byCustomer[t.customerId] = { collected: 0, withdrawn: 0 };
    if (t.type === 'contribution') byCustomer[t.customerId].collected += t.amount;
    else byCustomer[t.customerId].withdrawn += t.amount;
  });
  const customerRows = Object.entries(byCustomer)
    .map(([id, v]) => {
      const c = customers.find(cc => cc.id === id);
      return { name: c?.name || 'Unknown', phone: c?.phone || '—', ...v, net: v.collected - v.withdrawn };
    })
    .sort((a, b) => b.net - a.net);

  // Collector performance (by denormalized collectorName on each transaction)
  const byCollector = {};
  transactions.filter(t => t.type === 'contribution').forEach(t => {
    const name = t.collectorName || 'Unknown';
    byCollector[name] = (byCollector[name] || 0) + t.amount;
  });
  const collectorRows = Object.entries(byCollector).sort(([, a], [, b]) => b - a);

  // Payment method split
  const byMethod = {};
  transactions.forEach(t => {
    const m = t.paymentMethod || 'cash';
    byMethod[m] = (byMethod[m] || 0) + t.amount;
  });
  const methodRows = Object.entries(byMethod).sort(([, a], [, b]) => b - a);

  const generatedAt = new Date().toLocaleString('en-GH');
  const periodLabel = PERIOD_LABELS[period] || 'All Time';

  const customerRowsHtml = customerRows.length
    ? customerRows.map(r => `
        <tr>
          <td>${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.phone)}</td>
          <td class="num">${fmt(r.collected)}</td>
          <td class="num">${fmt(r.withdrawn)}</td>
          <td class="num strong">${fmt(r.net)}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" class="empty">No transactions in this period.</td></tr>`;

  const collectorRowsHtml = collectorRows.length
    ? collectorRows.map(([name, total]) => `
        <tr><td>${escapeHtml(name)}</td><td class="num strong">${fmt(total)}</td></tr>`).join('')
    : `<tr><td colspan="2" class="empty">No collections in this period.</td></tr>`;

  const methodRowsHtml = methodRows.length
    ? methodRows.map(([m, total]) => `
        <tr><td>${escapeHtml(METHOD_LABELS[m] || m)}</td><td class="num strong">${fmt(total)}</td></tr>`).join('')
    : `<tr><td colspan="2" class="empty">No transactions in this period.</td></tr>`;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a7344; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 800; color: #1a7344; }
          .meta { text-align: right; font-size: 11px; color: #64748b; }
          .summary { display: flex; gap: 16px; margin-bottom: 28px; }
          .stat { flex: 1; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 16px; }
          .stat .label { font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
          .stat .value { font-size: 20px; font-weight: 800; color: #16a34a; }
          .stat.negative .value { color: #ef4444; }
          h2 { font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase; color: #334155; margin: 28px 0 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; background: #f8fafc; color: #64748b; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; }
          td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
          td.num { text-align: right; font-variant-numeric: tabular-nums; }
          td.strong { font-weight: 700; }
          td.empty { text-align: center; color: #94a3b8; font-style: italic; }
          .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">${escapeHtml(businessName)}</div>
          <div class="meta">
            <div>${escapeHtml(periodLabel)}</div>
            <div>Generated ${escapeHtml(generatedAt)}</div>
          </div>
        </div>

        <div class="summary">
          <div class="stat">
            <div class="label">Total Collected</div>
            <div class="value">${fmt(totalCollected)}</div>
          </div>
          <div class="stat negative">
            <div class="label">Total Withdrawn</div>
            <div class="value">${fmt(totalWithdrawn)}</div>
          </div>
          <div class="stat">
            <div class="label">Net</div>
            <div class="value">${fmt(totalCollected - totalWithdrawn)}</div>
          </div>
        </div>

        <h2>Collector Performance</h2>
        <table>
          <thead><tr><th>Collector</th><th style="text-align:right">Collected</th></tr></thead>
          <tbody>${collectorRowsHtml}</tbody>
        </table>

        <h2>Payment Method Split</h2>
        <table>
          <thead><tr><th>Method</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${methodRowsHtml}</tbody>
        </table>

        <h2>Customer Breakdown</h2>
        <table>
          <thead><tr><th>Customer</th><th>Phone</th><th style="text-align:right">Collected</th><th style="text-align:right">Withdrawn</th><th style="text-align:right">Net</th></tr></thead>
          <tbody>${customerRowsHtml}</tbody>
        </table>

        <div class="footer">SusuPro — Built to handle real money, real people, real trust.</div>
      </body>
    </html>
  `;
}

// ── GENERATE + SHARE ──────────────────────────────────────────
export async function exportReportPdf({ customers, transactions, period, businessName = 'SusuPro' }) {
  try {
    const rangeTxns = filterByPeriod(transactions, period);
    const html = buildReportHtml({ customers, transactions: rangeTxns, period, businessName });

    const { uri } = await Print.printToFileAsync({ html });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${businessName} Report` });
    }

    return { success: true, uri, shared: canShare };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
