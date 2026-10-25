export function generateOrderId() {
  const now = new Date();
  const yymmdd = `${String(now.getFullYear() % 100).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MOC${yymmdd}${time}${rand}`;
}

export function initStatusHistory(order, note = '') {
  return [
    {
      status: order.status,
      paymentStatus: order.paymentStatus,
      note,
      at: new Date(),
    },
  ];
}

export function appendStatusHistory(order, entry) {
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: entry.status ?? order.status,
    paymentStatus: entry.paymentStatus ?? order.paymentStatus ?? '',
    note: entry.note ?? '',
    at: new Date(),
  });
}
