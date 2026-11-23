# yf-npm-search

One command. It reads the npm registry and prints one row per package. Scoped packages and their unscoped aliases are separate rows, listed one after the other. The console is the default. A Markdown file is written only when asked.

Node 20+. MIT. Zero runtime dependencies. `"type": "module"`.

| What | Name |
|---|---|
| GitHub | `YourFam/yf-npm-search` |
| npm | `@yourfam/yf-npm-search` |
| Command | `yf-npm-search` |
| Unscoped alias package | `yf-npm-search` |

```text
yf-npm-search @yourfam
```

The search text is required. There is no default scope. A missing search text prints `Error: a search text is required.` and exits `2` before any prompt and before any network call.

An unknown flag prints `Error: Unknown option: <flag>.` A missing `--limit` or `--sort` value, and a non-positive `--limit`, including `--limit 0`, prints `Error: --limit requires a positive integer.` or `Error: --sort requires a value.` An unknown `--sort`, including `--sort stars`, prints `Error: Unknown sort: <value>.` Each of these exits `2` before any prompt and before any network call.

Every positional argument is part of one search text, joined by single spaces. `yf-npm-search merge conflict branches` is the same search as `yf-npm-search "merge conflict branches"`. A token that starts with `-` is a flag, not part of the sentence.

## Default console table

The console always has these seven columns, in this order:

`Name  Version  Published  Publisher  Developer  Week  Total`

| Column | Value |
|---|---|
| Name | The package name npm shows |
| Version | The latest published version |
| Published | The latest publish date, `dd-mmm-yyyy`, for example `22-Nov-2026` |
| Publisher | The npm user who published that version |
| Developer | The `author` name in `package.json`. An object author uses `name`. A string author uses the text before `<` or `(`, with surrounding spaces removed. `Jane Doe <jane@example.com> (https://example.com)` is `Jane Doe`. An empty result is `-` |
| Week | Download count for the last 7 days, summed from the 18-month range |
| Total | Download count for the longest range the npm downloads API returns in one call |

`mmm` is `Jan`, `Feb`, `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`, or `Dec`.

There is no type column. A name that starts with `@` is the scoped package. A package whose description says `Unscoped alias of <scoped-name>` is an alias, and its row is the line immediately after `<scoped-name>`. A scoped package with no alias is still one row. An ordinary package is its own row.

An alias whose scoped package is not in the result list keeps the dim word `alias` after its name, inside the Name column. No other row prints that word. The Markdown `Name` cell is the package name only.

The header is printed once, with a line of `-` as wide as the table above it and another line of `-` below it. Each column is as wide as its header or its widest visible value, whichever is wider. Widths use only the rows the console will print. Two spaces separate columns. `Name`, `Version`, `Published`, `Publisher`, and `Developer` are left-aligned. `Week` and `Total` are right-aligned. The header words sit in those same columns.

After the last package row, print one blank line, then one dim footnote:

```text
Week = last 7 days. Total = last 18 months (the longest range the npm downloads API returns).
```

A package the API has no counts for shows `0`. `Total` is not a lifetime total. `Week` is the sum of the last 7 daily entries in the 18-month range, and `Month` (Markdown only) is the sum of the last 30 daily entries.

## Rows and sort

A family is a scoped package plus its alias, or a single row when it has no partner. The family's `Total` is the scoped row's `Total`, or the only row's `Total`. The family's date is the latest `Published` date among its rows.

The default sort is downloads. Families are ordered by `Total` descending, then by family name A to Z. `--sort recent` orders families by date, newest first, then by family name. `--sort name` orders families by family name A to Z. The family name is the scoped name, or the only row's name when there is no scoped package.

The console prints 25 rows. `--limit <n>` prints `n` rows. `--all` prints every fetched row. The fetch itself stops at 1,000 packages. The Markdown file, when written, contains every fetched row, not only the console rows.

If the cutoff falls between a scoped package and its alias, include the alias. The console may show one extra row. Do not drop that family to stay at 25.

When the console does not show every fetched row, print one dim line under the footnote. Without a Markdown file:

```text
Showing 25 of 180 rows. Pass --all for all rows, or --md to export.
```

With a Markdown file:

```text
Showing 25 of 180 rows in console (all 180 written to <path>). Pass --all for full console output.
```

Those counts are fetched rows. When the search reports a total above the number fetched, the console and the Markdown file also print one dim line: `Showing 1000 of <total>.`

## Color

Color is for the console only. The Markdown file has no color codes. When stdout is not a terminal, or `NO_COLOR` is set, print plain text.

| Part | Color |
|---|---|
| Header and the two rules | dim |
| Scoped name | bold |
| Alias name, and the word `alias` on a lone alias | dim |
| Version | green |
| Published, Publisher, Developer | default |
| Week and Total numbers | bold |
| Footnote, truncation line, and the 1,000-cap line | dim |

## Parameters

| Flag | Effect |
|---|---|
| `--month` | Add last-month downloads to the Markdown file |
| `--maintainers` | Add maintainer names, comma-separated, to the Markdown file |
| `--description` | Add the registry description to the Markdown file |
| `--keywords` | Add keywords, comma-separated, to the Markdown file |
| `--url` | Add the `https://npm.im/<name>` link to the Markdown file |
| `--sort downloads` | Default family order |
| `--sort recent` | Newest family first |
| `--sort name` | Family name A to Z |
| `--limit <n>` | Print `n` console rows |
| `--all` | Print every fetched row on the console |
| `--raw` | Do not call the cleanup service |
| `--md` | Write a Markdown file. With no path, prompt before any network call |
| `--md <path>` | Write that file. Do not prompt. Check the parent directory first |
| `--help`, `-h` | Print usage and exit `0`. No network call |
| `--version` | Print the installed package version and exit `0`. No network call |

The console never gains an eighth column. `Week` is always shown on the console and in the Markdown file. The remaining extra columns are added only to the Markdown file, after `Total`, in the order listed above. `Week` and `Month` are not included in `Total`; both are summed from the same 18-month downloads range.

`--version` prints the `version` from the installed package on stdout, then a newline, and nothing else. `--help` wins when both `--help` and `--version` are present. `--raw` on a single word changes nothing, because a single word does not call the cleanup service.

## Markdown file

The file is a Markdown table. It has the seven console columns, plus any extra columns the flags added. The footnote is a paragraph under the table. Publish dates use `dd-mmm-yyyy`. The lone-alias word is not written in the `Name` cell.

In every cell, replace each newline or carriage return with a space, then replace each `|` with `\|`.

`--md <path>` writes that file and does not ask. `<path>` is the file, not a folder. When the parent directory is missing, print `Error: directory not found: <directory>.` and exit `2` before any network call. Do not create the directory.

The suggested file is on the Desktop, named `yf-npm-search-<dd-mmm-yyyy>.md`, using the local date. On Windows the Desktop is the known Desktop folder, including an OneDrive-redirected Desktop. On macOS and Linux it is `~/Desktop` when that directory exists. When the Desktop directory cannot be resolved, the suggested file is `yf-npm-search-<dd-mmm-yyyy>.md` in the current working directory.

A default command does not ask and does not write a file, even when the console shows 25 of more rows.

Ask before any network call when `--md` has no path, or when an extra-column flag is passed without `--md <path>`. When an extra-column flag is present, the prompt is:

```text
Console shows Name, Version, Published, Publisher, Developer, Week, Total only.
Extra columns (--month, --description) go to <path>.
Write Markdown file to <path>? [Y]es / [P]ath / [N]o (console only) / [E]xit:
```

Without an extra-column flag, print only the `Write Markdown file` line. The listed extra flags are the ones the user passed.

`Y` or `y` writes the suggested file. `P` or `p` reads a file path. When its parent directory is missing, print the directory error and ask again. Do not fetch until the parent exists. `N` or `n` writes no file, fetches no extra columns, and still prints the seven-column console table. `E` or `e` exits `0` before the cleanup service and before npm. Nothing is written.

`Ctrl+C`, `Ctrl+D`, and `Ctrl+Z` at a prompt exit `0`. No stack trace. Nothing is written. Any other answer repeats the question. A prompt runs only when stdin and stdout are terminals. When they are not, skip the file and print the console table. If an extra-column flag was passed without `--md <path>`, also print `Note: extra columns require --md <path> in non-interactive mode.` on stderr. Exit `0`.

## Search text cleanup

A search text with no whitespace, such as `@yourfam` or `tree`, goes to npm unchanged. `--raw` skips the cleanup service.

A search text with whitespace is a sentence. On a terminal, and without `--raw`, the command sends that sentence to the publisher's cleanup service after the Markdown prompt, when there is one, has finished. It then prints the words and waits:

```text
Search: merge conflict branches
Use these terms? [Y]es / [R]aw ("<original>") / [E]xit:
```

`Y` or `y` searches those words. `R` or `r` searches the original text. `E` or `e` exits `0` and does not call npm. The same prompt keys for cancel and end of input apply.

The service is a `POST` of JSON `{"text":"<original>"}` to the public service URL. The response body is plain text, the search words, trimmed. The client aborts the request at 4000 ms.

The service calls xAI at `https://api.x.ai/v1`. Doppler injects `XAI_API_KEY` into the service process only. The published package does not contain that key, a Doppler token, or any other secret. The service URL in the package is public. The command never receives the key. Someone running the package can use the cleanup through the service. They cannot copy the key and call the model for another purpose. The service limits how often one caller can use it.

When the service is unreachable, over its limit, times out, or returns no words, skip the confirmation, print `Search:` with the original text, and search that text. That failure does not exit `2`. When stdin or stdout is not a terminal, skip the cleanup call and the confirmation, and search the original text.

## Network

The Markdown prompt, when it runs, finishes before any network call. The cleanup call, when it runs, finishes before npm. The command then loads every row before it prints. It does not print a package row until the search, the registry documents, and the download counts have finished.

Search uses `https://registry.npmjs.org/-/v1/search` with `size=250`. It advances `from` by 250 until a page returns fewer than 250 objects, and it stops after 1000 packages.

The registry document for each package supplies the publisher, the author, and the maintainers. The downloads API supplies the counts. Each downloads request names one package and uses one 18-month range (`/downloads/range/<start>:<end>/<pkg>`). `Total` is the sum of all daily entries in that range, `Week` is the sum of the last 7 daily entries, and `Month` (Markdown only) is the sum of the last 30 daily entries. The only other network call is the cleanup service. At most 8 registry and download requests run at a time.

On HTTP 429, that registry or downloads request waits and is tried up to 3 more times, with a longer wait each time. Any other failed registry, search, or downloads request, or a 429 that still fails after those retries, prints `Error: <what failed>.` and exits `2`. No package row and no footnote is printed.
