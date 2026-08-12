// ============================================================
// src/services/receiptService.js
// WHAT:   Sends a transaction receipt to a customer over WhatsApp
//         (wa.me deep link — works with no backend, no SMS gateway
//         cost, and WhatsApp is the dominant messaging channel in
//         Ghana). The collector still taps "send" inside WhatsApp —
//         this pre-fills the message, it doesn't send silently.
// ============================================================

import { Linking } from 'react-native';

const METHOD_LABELS = { cash: 'Cash', momo: 'Mobile Money', bank: 'Bank Transfer' };

function fmt(n) {
  return `GHS ${Number(n || 0).toLocaleString('en-GH')}`;
}

// Ghanaian numbers are stored locally (e.g. "0244123456"). wa.me
// needs full international format with no leading zero or symbols.
function toInternational(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  return digits;
}

export function buildReceiptMessage({
  customerName, type, amount, date, time, paymentMethod, network, balance, businessName = 'SusuPro',
}) {
  const methodLabel = paymentMethod === 'momo' && network
    ? `Mobile Money (${network})`
    : (METHOD_LABELS[paymentMethod] || paymentMethod);
  const verb = type === 'contribution' ? 'Contribution Received' : 'Withdrawal Processed';

  return (
    `*${businessName} Receipt*\n\n` +
    `Hi ${customerName},\n\n` +
    `${verb}: ${fmt(amount)}\n` +
    `Method: ${methodLabel}\n` +
    `Date: ${date} · ${time}\n` +
    `New Balance: ${fmt(balance)}\n\n` +
    `Thank you for saving with us!`
  );
}

// ── SEND VIA WHATSAPP ─────────────────────────────────────────
export async function sendReceiptViaWhatsApp({ phone, message }) {
  try {
    const intl = toInternational(phone);
    if (!intl) throw new Error('This customer has no phone number on file.');

    const url = `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
    await Linking.openURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
