export function money(amount: number | string, currency = "USD"): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n || 0);
  } catch {
    // Fallback for unknown currency codes
    return `${(n || 0).toFixed(2)} ${currency}`;
  }
}

export function num(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return (n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
