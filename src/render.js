import { formatDate, sanitizeCell } from './format.js';

const COLS = [
  { key: 'name', header: 'Name', align: 'left' },
  { key: 'version', header: 'Version', align: 'left' },
  { key: 'published', header: 'Published', align: 'left' },
  { key: 'publisher', header: 'Publisher', align: 'left' },
  { key: 'developer', header: 'Developer', align: 'left' },
  { key: 'week', header: 'Week', align: 'right' },
  { key: 'total', header: 'Total', align: 'right' },
];

export const EXTRA_COLUMN_KEYS = ['month', 'maintainers', 'description', 'keywords', 'url'];

const EXTRA_COLS = [
  { key: 'month', header: 'Month' },
  { key: 'maintainers', header: 'Maintainers' },
  { key: 'description', header: 'Description' },
  { key: 'keywords', header: 'Keywords' },
  { key: 'url', header: 'URL' },
];

function namePlain(row) {
  return row.isLoneAlias ? `${row.name} alias` : row.name;
}

function nameColored(row, colors) {
  if (row.isScoped) return colors.bold(row.name);
  if (row.isAlias) {
    const base = colors.dim(row.name);
    return row.isLoneAlias ? `${base} ${colors.dim('alias')}` : base;
  }
  return row.name;
}

function displayRow(row, colors) {
  const published = formatDate(row.published);
  return {
    namePlain: namePlain(row),
    nameColored: nameColored(row, colors),
    versionPlain: row.version,
    versionColored: colors.green(row.version),
    publishedPlain: published,
    publishedColored: published,
    publisherPlain: row.publisher,
    publisherColored: row.publisher,
    developerPlain: row.developer,
    developerColored: row.developer,
    weekPlain: String(row.week ?? 0),
    weekColored: colors.bold(String(row.week ?? 0)),
    totalPlain: String(row.total),
    totalColored: colors.bold(String(row.total)),
  };
}

export function renderTable(rows, colors) {
  const displays = rows.map((row) => displayRow(row, colors));

  const widths = COLS.map((col) => {
    let width = col.header.length;
    for (const display of displays) {
      const value = display[`${col.key}Plain`];
      if (value.length > width) width = value.length;
    }
    return width;
  });

  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + 2 * (COLS.length - 1);

  const pad = (colored, plain, width, align) => {
    const gap = width - plain.length;
    return align === 'right' ? ' '.repeat(gap) + colored : colored + ' '.repeat(gap);
  };

  const rule = colors.dim('-'.repeat(totalWidth));
  const headerCells = COLS.map((col, i) =>
    pad(colors.dim(col.header), col.header, widths[i], col.align),
  );

  const lines = [rule, headerCells.join('  '), rule];
  for (const display of displays) {
    const cells = COLS.map((col, i) =>
      pad(display[`${col.key}Colored`], display[`${col.key}Plain`], widths[i], col.align),
    );
    lines.push(cells.join('  '));
  }

  return lines.join('\n');
}

function extraValue(row, key) {
  switch (key) {
    case 'month':
      return row.month == null ? '0' : String(row.month);
    case 'maintainers':
      return (row.maintainers ?? []).join(', ');
    case 'description':
      return row.description ?? '';
    case 'keywords':
      return (row.keywords ?? []).join(', ');
    case 'url':
      return `https://npm.im/${row.name}`;
    default:
      return '';
  }
}

export function renderMarkdown(rows, extraFlags) {
  const activeExtra = EXTRA_COLS.filter((col) => extraFlags.includes(col.key));
  const headers = [...COLS.map((col) => col.header), ...activeExtra.map((col) => col.header)];
  const line = (cells) => `| ${cells.join(' | ')} |`;

  const out = [];
  out.push(line(headers));
  out.push(line(headers.map(() => '---')));

  for (const row of rows) {
    const baseCells = [
      sanitizeCell(row.name),
      sanitizeCell(row.version),
      sanitizeCell(formatDate(row.published)),
      sanitizeCell(row.publisher),
      sanitizeCell(row.developer),
      sanitizeCell(String(row.week ?? 0)),
      sanitizeCell(String(row.total)),
    ];
    const extraCells = activeExtra.map((col) => sanitizeCell(extraValue(row, col.key)));
    out.push(line([...baseCells, ...extraCells]));
  }

  return out.join('\n');
}
