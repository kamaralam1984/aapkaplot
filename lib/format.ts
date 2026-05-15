/**
 * Indian price formatter: 1850000 -> "₹18.50 L", 25000000 -> "₹2.50 Cr".
 */
export function formatInr(amount: number): string {
  if (amount >= 1_00_00_000) {
    return `₹${(amount / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (amount >= 1_00_000) {
    return `₹${(amount / 1_00_000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatArea(sqft: number): string {
  return `${sqft.toLocaleString("en-IN")} sqft`;
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes || 1}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
