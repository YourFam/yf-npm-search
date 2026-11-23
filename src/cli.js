import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './args.js';
import { createColors } from './colors.js';
import { isTty, ask } from './prompt.js';
import { suggestedFilePath } from './desktop.js';
import { version } from './version.js';
import { CliError } from './errors.js';
import {
  searchPackages,
  fetchRegistryDoc,
  fetchDownloads,
  eighteenMonthRange,
  callCleanup,
  Pool,
} from './npm.js';
import {
  applyRegistryDoc,
  classifyRows,
  buildFamilies,
  sortFamilies,
  takeConsoleRows,
} from './model.js';
import { renderTable, renderMarkdown, EXTRA_COLUMN_KEYS } from './render.js';

const FOOTNOTE = 'Total = last 18 months (the longest range the npm downloads API returns).';

function collectExtraFlags(opts) {
  return EXTRA_COLUMN_KEYS.filter((key) => opts[key]);
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

async function promptForPath() {
  while (true) {
    const raw = (await ask('Path: ')).trim();
    if (!raw) return null;
    const resolved = path.resolve(raw);
    const dir = path.dirname(resolved);
    if (isDirectory(dir)) return resolved;
    process.stdout.write(`Error: directory not found: ${dir}.\n`);
  }
}

async function markdownPrompt(suggestedPath, extraFlags) {
  const extraNames = extraFlags.map((flag) => `--${flag}`).join(', ');
  while (true) {
    if (extraFlags.length > 0) {
      process.stdout.write('Console shows Name, Version, Published, Publisher, Developer, Total only.\n');
      process.stdout.write(`Extra columns (${extraNames}) go to ${suggestedPath}.\n`);
    }
    const answer = (
      await ask(
        `Write Markdown file to ${suggestedPath}? [Y]es / [P]ath / [N]o (console only) / [E]xit: `,
      )
    )
      .trim()
      .toLowerCase();
    if (answer === 'y') return { write: true, path: suggestedPath };
    if (answer === 'n') return { write: false, path: null };
    if (answer === 'e') process.exit(0);
    if (answer === 'p') {
      const resolvedPath = await promptForPath();
      if (resolvedPath) return { write: true, path: resolvedPath };
    }
    // any other answer repeats the question
  }
}

async function confirmSearchTerms(cleaned, original) {
  while (true) {
    process.stdout.write(`Search: ${cleaned}\n`);
    const answer = (
      await ask(`Use these terms? [Y]es / [R]aw ("${original}") / [E]xit: `)
    )
      .trim()
      .toLowerCase();
    if (answer === 'y') return cleaned;
    if (answer === 'r') return original;
    if (answer === 'e') process.exit(0);
    // any other answer repeats the question
  }
}

async function loadRows(packages, writeMd, opts) {
  const pool = new Pool(8);
  const rows = [];
  const tasks = [];

  for (const pkg of packages) {
    const row = {
      name: pkg.name,
      version: pkg.version ?? '',
      published: pkg.date ?? '',
      description: pkg.description ?? '',
      publisher: '-',
      developer: '-',
      maintainers: [],
      keywords: pkg.keywords ?? [],
      total: 0,
      week: null,
      month: null,
    };
    rows.push(row);

    tasks.push(
      pool.run(async () => {
        const doc = await fetchRegistryDoc(row.name);
        applyRegistryDoc(row, doc);
      }),
    );

    tasks.push(
      pool.run(async () => {
        row.total = await fetchDownloads(row.name, eighteenMonthRange());
      }),
    );

    if (writeMd && opts.week) {
      tasks.push(
        pool.run(async () => {
          row.week = await fetchDownloads(row.name, 'last-week');
        }),
      );
    }
    if (writeMd && opts.month) {
      tasks.push(
        pool.run(async () => {
          row.month = await fetchDownloads(row.name, 'last-month');
        }),
      );
    }
  }

  await Promise.all(tasks);
  return rows;
}

function usage() {
  return `Usage: yf-npm-search <search text> [options]

One command. It reads the npm registry and prints one row per package.
Scoped packages and their unscoped aliases are separate rows.

Options:
  --week              Add last-week downloads to the Markdown file
  --month             Add last-month downloads to the Markdown file
  --maintainers       Add maintainer names to the Markdown file
  --description       Add the registry description to the Markdown file
  --keywords          Add keywords to the Markdown file
  --url               Add the https://npm.im/<name> link to the Markdown file
  --sort <sort>       Family order: downloads (default), recent, or name
  --limit <n>         Print n console rows (default 25)
  --all               Print every fetched row
  --raw               Do not call the cleanup service
  --md [path]         Write a Markdown file; prompt when path is omitted
  --help, -h          Print this usage and exit
  --version           Print the installed version and exit`;
}

export async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  const { opts } = parsed;

  if (opts.help) {
    process.stdout.write(usage() + '\n');
    return;
  }
  if (opts.version) {
    process.stdout.write(version + '\n');
    return;
  }
  if (parsed.error) {
    throw new CliError(`Error: ${parsed.error}`);
  }

  const text = parsed.positional.join(' ');
  if (!text) {
    throw new CliError('Error: a search text is required.');
  }

  const extraFlags = collectExtraFlags(opts);
  const interactive = isTty(process.stdin) && isTty(process.stdout);

  // Decide the Markdown target before any network call.
  let mdPath = null;
  let writeMd = false;

  if (parsed.mdPath) {
    const dir = path.dirname(path.resolve(parsed.mdPath));
    if (!isDirectory(dir)) {
      throw new CliError(`Error: directory not found: ${dir}.`);
    }
    mdPath = parsed.mdPath;
    writeMd = true;
  } else if (parsed.mdFlag || extraFlags.length > 0) {
    if (interactive) {
      const result = await markdownPrompt(suggestedFilePath(), extraFlags);
      writeMd = result.write;
      mdPath = result.write ? result.path : null;
    } else {
      if (extraFlags.length > 0) {
        process.stderr.write('Note: extra columns require --md <path> in non-interactive mode.\n');
      }
      writeMd = false;
    }
  }

  // Clean up the search text (a sentence with whitespace) before calling npm.
  let searchText = text;
  if (/\s/.test(text) && !opts.raw && interactive) {
    const cleaned = await callCleanup(text);
    if (cleaned) {
      searchText = await confirmSearchTerms(cleaned, text);
    } else {
      process.stdout.write(`Search: ${text}\n`);
      searchText = text;
    }
  }

  // Load every row before printing anything.
  const { packages, total } = await searchPackages(searchText);
  const rows = await loadRows(packages, writeMd, opts);
  classifyRows(rows);
  const families = sortFamilies(buildFamilies(rows), parsed.sort);
  const orderedRows = families.flatMap((family) => family.rows);

  const limit = opts.all ? orderedRows.length : (parsed.limit ?? 25);
  const consoleRows = takeConsoleRows(families, limit);

  const colors = createColors(isTty(process.stdout) && !process.env.NO_COLOR);

  // Write the Markdown file before printing the console table.
  if (writeMd) {
    const markdownLines = [renderMarkdown(orderedRows, extraFlags), '', FOOTNOTE];
    if (total > orderedRows.length) {
      markdownLines.push(`Showing ${orderedRows.length} of ${total}.`);
    }
    fs.writeFileSync(mdPath, markdownLines.join('\n') + '\n');
  }

  const lines = [];
  lines.push(renderTable(consoleRows, colors));
  lines.push('');
  lines.push(colors.dim(FOOTNOTE));

  if (consoleRows.length < orderedRows.length) {
    const truncation = writeMd
      ? `Showing ${consoleRows.length} of ${orderedRows.length} rows in console (all ${orderedRows.length} written to ${mdPath}). Pass --all for full console output.`
      : `Showing ${consoleRows.length} of ${orderedRows.length} rows. Pass --all for all rows, or --md to export.`;
    lines.push(colors.dim(truncation));
  }

  if (total > orderedRows.length) {
    lines.push(colors.dim(`Showing ${orderedRows.length} of ${total}.`));
  }

  process.stdout.write(lines.join('\n') + '\n');
}

