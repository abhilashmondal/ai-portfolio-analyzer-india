export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0.00%';
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value / 100);
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
}
