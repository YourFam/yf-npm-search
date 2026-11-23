export function createColors(useColor) {
  const wrap = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
  return {
    dim: wrap('2'),
    bold: wrap('1'),
    green: wrap('32'),
  };
}
