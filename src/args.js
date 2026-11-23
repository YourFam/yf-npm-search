const BOOLEAN_FLAGS = new Set([
  'month',
  'maintainers',
  'description',
  'keywords',
  'url',
  'all',
  'raw',
]);

const SORTS = new Set(['downloads', 'recent', 'name']);

export function parseArgs(argv) {
  const opts = {
    month: false,
    maintainers: false,
    description: false,
    keywords: false,
    url: false,
    all: false,
    raw: false,
    help: false,
    version: false,
  };
  const positional = [];
  let sort = 'downloads';
  let limit = null;
  let mdPath = null;
  let mdFlag = false;
  let error = null;

  const fail = (message) => {
    if (error === null) error = message;
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      opts.help = true;
      continue;
    }
    if (token === '--version') {
      opts.version = true;
      continue;
    }

    if (token === '--sort') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) {
        fail('--sort requires a value.');
        continue;
      }
      i++;
      if (!SORTS.has(value)) {
        fail(`Unknown sort: ${value}.`);
        continue;
      }
      sort = value;
      continue;
    }

    if (token === '--limit') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-') || !/^\d+$/.test(value) || Number(value) <= 0) {
        fail('--limit requires a positive integer.');
        if (value !== undefined && !value.startsWith('-')) i++;
        continue;
      }
      i++;
      limit = Number(value);
      continue;
    }

    if (token === '--md') {
      mdFlag = true;
      const value = argv[i + 1];
      if (value !== undefined && !value.startsWith('-')) {
        i++;
        mdPath = value;
      } else {
        mdPath = '';
      }
      continue;
    }

    if (BOOLEAN_FLAGS.has(token.slice(2))) {
      opts[token.slice(2)] = true;
      continue;
    }

    if (token.startsWith('-')) {
      fail(`Unknown option: ${token}.`);
      continue;
    }

    positional.push(token);
  }

  return { positional, opts, sort, limit, mdPath, mdFlag, error };
}
