export function sumDaily(daily) {
  let total = 0;
  for (const entry of daily) {
    const n = Number(entry && entry.downloads);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}

export function sumLastDays(daily, n) {
  return sumDaily(daily.slice(-n));
}
