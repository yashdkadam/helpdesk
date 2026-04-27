export function parseId(id: string): number | null {
  const n = parseInt(id, 10);
  if (isNaN(n) || n <= 0 || !Number.isInteger(n)) return null;
  return n;
}
