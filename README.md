# yf-npm-search

One command. It reads the npm registry and prints one row per package. Scoped packages and their unscoped aliases are separate rows, listed one after the other. The console is the default. A Markdown file is written only when asked.

Node 20+. MIT. Zero runtime dependencies. `"type": "module"`.

| What | Name |
|---|---|
| GitHub | `YourFam/yf-npm-search` |
| npm | `@yourfam/yf-npm-search` |
| Command | `yf-npm-search` |
| Unscoped alias package | `yf-npm-search` |

## Install

```sh
npm install -g @yourfam/yf-npm-search
```

## Usage

```text
yf-npm-search @yourfam
```

The search text is required. Every positional argument is one search text, joined by single spaces:

```text
yf-npm-search merge conflict branches
```

### Console table

Six columns, always in this order:

`Name  Version  Published  Publisher  Developer  Total`

- **Name** — the package name npm shows. A scoped name is bold; its alias sits on the next row, dim.
- **Version** — the latest published version.
- **Published** — the latest publish date, `dd-mmm-yyyy`.
- **Publisher** — the npm user who published that version.
- **Developer** — the `author` name from `package.json`.
- **Total** — download count for the last 18 months (the longest range the npm downloads API returns).

Families (a scoped package plus its alias, or a single row) sort by `Total` descending by default. The console prints 25 rows; the Markdown file, when written, contains every fetched row.

### Options

```text
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
--help, -h          Print usage and exit
--version           Print the installed version and exit
```

Extra columns go to the Markdown file only, after `Total`, in the order above. The console never gains a seventh column.

### Markdown file

`--md <path>` writes the file without asking and checks the parent directory first. `--md` with no path, or an extra-column flag without `--md <path>`, prompts before any network call. In non-interactive mode the file is skipped and the console table is printed.

The suggested file is `yf-npm-search-<dd-mmm-yyyy>.md` on the Desktop (Windows, including an OneDrive-redirected Desktop; `~/Desktop` on macOS and Linux), or in the current directory when the Desktop cannot be resolved.

### Search text cleanup

A search text with whitespace is a sentence. On a terminal, without `--raw`, the command sends it to the cleanup service and asks you to confirm the cleaned words before calling npm. When the service is unreachable, over its limit, times out, or returns no words, the original text is searched.

## Cleanup service

The cleanup service is a separate deployment. It calls xAI and injects `XAI_API_KEY` via Doppler; the published package contains no key, Doppler token, or other secret. The command never receives the key.

The service URL is a public constant in `src/npm.js`. Set the real public URL there, or override it at runtime with the `YF_NPM_SEARCH_CLEANUP_URL` environment variable.

## Development

```sh
npm test
```

Tests use Node's built-in test runner and cover argument parsing, formatting, family/sort logic, rendering, and color handling — no network required.

