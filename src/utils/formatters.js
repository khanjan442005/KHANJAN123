export function padCount(value) {
  return String(value || 0).padStart(2, '0');
}

export function formatCurrency(amount) {
  return `INR ${Number(amount || 0).toLocaleString('en-IN')}`;
}

function parseDateValue(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  return new Date(value);
}

export function formatDateLabel(value) {
  if (!value) {
    return '';
  }

  const date = parseDateValue(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}
