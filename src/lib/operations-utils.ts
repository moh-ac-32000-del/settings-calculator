export function formatWesternNumber(value: number | string) {
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',');
}

export function normalizeQuantity(value: string) {
  return formatWesternNumber(value)
    .replace(/،/g, '.')
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')
    .split('.')[0];
}

export function quantityValue(value: string) {
  const normalized = normalizeQuantity(value).split('.')[0];
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateShippingExpense(referenceCost: number, referenceQuantity: number, quantity: number) {
  if (
    !Number.isFinite(referenceCost)
    || referenceCost < 0
    || !Number.isFinite(referenceQuantity)
    || referenceQuantity <= 0
    || !Number.isFinite(quantity)
    || quantity <= 0
  ) return 0;
  if (quantity <= referenceQuantity / 2) return Math.round(referenceCost / 2);
  return Math.round((referenceCost / referenceQuantity) * quantity);
}

export function resolveShippingExpense(
  automaticAmount: number,
  manualEnabled: boolean,
  manualAmount: number,
  included: boolean,
) {
  if (!included) return 0;
  if (manualEnabled) {
    return Number.isFinite(manualAmount) && manualAmount >= 0 ? Math.round(manualAmount) : 0;
  }
  return Number.isFinite(automaticAmount) && automaticAmount >= 0 ? Math.round(automaticAmount) : 0;
}

export function appendQuantityKey(value: string, key: string) {
  const current = normalizeQuantity(value) || '0';
  if (key === 'clear') return '0';
  if (key === 'backspace') {
    if (current === '0') return '0';
    const next = current.slice(0, -1);
    return next || '0';
  }
  if (!/^\d$/.test(key)) return value;
  if (current === '0') return key;
  return `${current}${key}`;
}

export function formatAmount(value: number) {
  if (!Number.isFinite(value)) return '0.00';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}