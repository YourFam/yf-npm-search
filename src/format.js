export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatDate(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return `${pad2(date.getUTCDate())}-${MONTHS[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
}

export function formatLocalDate(date = new Date()) {
  return `${pad2(date.getDate())}-${MONTHS[date.getMonth()]}-${date.getFullYear()}`;
}

export function developerName(author) {
  if (author == null) return '-';
  if (typeof author === 'object') {
    if (typeof author.name === 'string' && author.name.trim()) return author.name.trim();
    return '-';
  }
  const text = String(author);
  const index = text.search(/[<(]/);
  const name = (index === -1 ? text : text.slice(0, index)).trim();
  return name || '-';
}

export function sanitizeCell(value) {
  return String(value).replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|');
}

export function detectAlias(description) {
  if (!description) return null;
  const match = String(description).match(/Unscoped alias of\s+(@\S+)/);
  return match ? match[1] : null;
}
