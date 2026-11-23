# Sample output

Hypothetical. These rows are not from a real run. Counts are made up. In a terminal the header and both rules are dim, a scoped name is bold, an alias name is dim, the version is green, and the week and total numbers are bold. The date, the publisher, and the developer stay the default color. This file shows the text only. The Markdown file the command writes has no color.

The console is sorted by `Total`. `@yourfam/yf-tree` at 860 comes before `@yourfam/yf-merge-check` at 128.

## Default

```text
yf-npm-search @yourfam
```

```text
------------------------------------------------------------------------------------
Name                      Version  Published    Publisher       Developer  Week  Total
------------------------------------------------------------------------------------
@yourfam/yf-tree          0.1.1    10-Nov-2026  kamal-yourfam   YourFam       40   860
yf-git-tree               0.1.1    10-Nov-2026  kamal-yourfam   YourFam        4    40
@yourfam/yf-merge-check   0.1.1    22-Nov-2026  kamal-yourfam   YourFam       12   128
yf-merge-check            0.1.1    22-Nov-2026  kamal-yourfam   YourFam        3    20

Week = last 7 days. Total = last 18 months (the longest range the npm downloads API returns).
```

`yf-git-tree` sits on the row after `@yourfam/yf-tree` because its description says `Unscoped alias of @yourfam/yf-tree`. The rules are as wide as the table. Text columns are left-aligned. `Week` and `Total` are right-aligned. `Week` is summed from the last 7 daily entries of the same 18-month range that supplies `Total`. A default command does not ask and does not write a file.

When the console shows 25 of 180 fetched rows, one dim line follows the footnote:

```text
Showing 25 of 180 rows. Pass --all for all rows, or --md to export.
```

## A search that includes an ordinary package

```text
yf-npm-search tree
```

```text
------------------------------------------------------------------------------------
Name                      Version  Published    Publisher       Developer  Week  Total
------------------------------------------------------------------------------------
left-pad                  1.0.0    01-Jan-2020  jane            Jane Doe     300   900
@yourfam/yf-tree          0.1.1    10-Nov-2026  kamal-yourfam   YourFam       40   860
yf-git-tree               0.1.1    10-Nov-2026  kamal-yourfam   YourFam        4    40

Week = last 7 days. Total = last 18 months (the longest range the npm downloads API returns).
```

`left-pad` is an ordinary package, so its own `Total` of 900 places it first. `Jane Doe` is the name taken from `Jane Doe <jane@example.com> (https://example.com)`.

When an alias is in the results and its scoped package is not, the dim word `alias` follows that name on the console only:

```text
yf-git-tree alias         0.1.1    10-Nov-2026  kamal-yourfam   YourFam        4    40
```

## A sentence

```text
yf-npm-search check merge conflicts
```

The cleanup service returns the words, and the command waits:

```text
Search: merge conflict branches
Use these terms? [Y]es / [R]aw ("check merge conflicts") / [E]xit:
```

`Y` searches those words. `R` searches the original sentence. `E` exits before npm.

## Version

```text
yf-npm-search --version
```

```text
0.1.2
```

That is the installed package version. Nothing else is printed, and nothing is downloaded.

## Markdown file

```text
yf-npm-search @yourfam --month
```

This asks before any network call, because the extra columns need a file and no path was given:

```text
Console shows Name, Version, Published, Publisher, Developer, Week, Total only.
Extra columns (--month) go to C:\Users\User\Desktop\yf-npm-search-23-Nov-2026.md.
Write Markdown file to C:\Users\User\Desktop\yf-npm-search-23-Nov-2026.md? [Y]es / [P]ath / [N]o (console only) / [E]xit:
```

`Y` fetches the rows and writes that file. The console table stays seven columns. `N` skips the month request and writes nothing. `E` exits before any network call.

`Desktop` here is the Windows Desktop, including an OneDrive Desktop when Windows has moved it. The date in the name is the local date. When that folder cannot be resolved, the suggested file is in the current directory.

`yf-npm-search-23-Nov-2026.md`:

```markdown
| Name | Version | Published | Publisher | Developer | Week | Total | Month |
|---|---|---|---|---|---|---|---|
| @yourfam/yf-tree | 0.1.1 | 10-Nov-2026 | kamal-yourfam | YourFam | 40 | 860 | 210 |
| yf-git-tree | 0.1.1 | 10-Nov-2026 | kamal-yourfam | YourFam | 4 | 40 | 11 |
| @yourfam/yf-merge-check | 0.1.1 | 22-Nov-2026 | kamal-yourfam | YourFam | 12 | 128 | 40 |
| yf-merge-check | 0.1.1 | 22-Nov-2026 | kamal-yourfam | YourFam | 3 | 20 | 9 |

Week = last 7 days. Total = last 18 months (the longest range the npm downloads API returns).
```

`Week` and `Month` are summed from the same 18-month range and are not part of `Total`. A lone alias is `yf-git-tree` in this table, without the word `alias`.
