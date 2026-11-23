import { detectAlias, developerName } from './format.js';

export function applyRegistryDoc(row, doc) {
  const latest = doc && doc['dist-tags'] && doc['dist-tags'].latest
    ? doc['dist-tags'].latest
    : row.version;
  const versionData = doc && doc.versions && doc.versions[latest] ? doc.versions[latest] : {};

  row.version = latest || row.version;
  row.published = (doc && doc.time && doc.time[latest]) || row.published;
  row.description = versionData.description ?? doc?.description ?? row.description ?? '';

  const publisher =
    versionData._npmUser?.name ??
    versionData.maintainers?.[0]?.name ??
    doc?.maintainers?.[0]?.name ??
    '';
  row.publisher = publisher || '-';

  const author = versionData.author ?? doc?.author ?? null;
  row.developer = developerName(author);

  const maintainers = versionData.maintainers ?? doc?.maintainers ?? [];
  row.maintainers = Array.isArray(maintainers)
    ? maintainers.map((m) => m?.name ?? m?.username ?? '').filter(Boolean)
    : [];

  const keywords = versionData.keywords ?? doc?.keywords ?? row.keywords ?? [];
  row.keywords = Array.isArray(keywords) ? keywords.map(String) : [];
}

export function classifyRows(rows) {
  for (const row of rows) {
    row.isScoped = row.name.startsWith('@');
    row.aliasOf = row.isScoped ? null : detectAlias(row.description);
    row.isAlias = !row.isScoped && row.aliasOf !== null;
  }
  const scopedNames = new Set(rows.filter((r) => r.isScoped).map((r) => r.name));
  for (const row of rows) {
    row.isLoneAlias = row.isAlias && !scopedNames.has(row.aliasOf);
  }
  return rows;
}

export function buildFamilies(rows) {
  const families = [];
  const consumed = new Set();

  for (const row of rows) {
    if (consumed.has(row.name)) continue;

    if (row.isScoped) {
      const alias = rows.find((r) => r.isAlias && r.aliasOf === row.name && !r.isLoneAlias);
      const familyRows = [row];
      if (alias) {
        familyRows.push(alias);
        consumed.add(alias.name);
      }
      consumed.add(row.name);
      families.push(makeFamily(familyRows));
    } else if (row.isAlias && !row.isLoneAlias) {
      continue; // handled with its scoped parent
    } else {
      consumed.add(row.name);
      families.push(makeFamily([row]));
    }
  }

  return families;
}

function makeFamily(familyRows) {
  let dateMs = 0;
  for (const row of familyRows) {
    const time = Date.parse(row.published);
    if (!Number.isNaN(time) && time > dateMs) dateMs = time;
  }
  return {
    name: familyRows[0].name,
    total: familyRows[0].total,
    dateMs,
    rows: familyRows,
  };
}

function compareName(a, b) {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

export function sortFamilies(families, sort) {
  families.sort((a, b) => {
    if (sort === 'name') return compareName(a, b);
    if (sort === 'recent') {
      if (a.dateMs !== b.dateMs) return b.dateMs - a.dateMs;
      return compareName(a, b);
    }
    if (a.total !== b.total) return b.total - a.total;
    return compareName(a, b);
  });
  return families;
}

export function takeConsoleRows(families, limit) {
  const rows = [];
  for (const family of families) {
    if (rows.length >= limit) break;
    rows.push(...family.rows);
  }
  return rows;
}
