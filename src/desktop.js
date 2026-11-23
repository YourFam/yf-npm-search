import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { formatLocalDate } from './format.js';

function expandEnvVars(value) {
  return value.replace(/%([^%]+)%/g, (_, name) => process.env[name] ?? `%${name}%`);
}

function windowsDesktopCandidates() {
  const candidates = [];
  try {
    const output = execFileSync(
      'reg',
      [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
        '/v',
        'Desktop',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const match = output.match(/Desktop\s+REG_(?:EXPAND_)?SZ\s+(.+)/i);
    if (match) candidates.push(expandEnvVars(match[1].trim()));
  } catch {
    // registry lookup is best-effort
  }
  if (process.env.USERPROFILE) candidates.push(path.join(process.env.USERPROFILE, 'Desktop'));
  if (process.env.OneDrive) candidates.push(path.join(process.env.OneDrive, 'Desktop'));
  if (process.env.OneDriveConsumer) {
    candidates.push(path.join(process.env.OneDriveConsumer, 'Desktop'));
  }
  return candidates;
}

export function desktopDirectory() {
  let candidates;
  if (process.platform === 'win32') {
    candidates = windowsDesktopCandidates();
  } else {
    candidates = [path.join(os.homedir(), 'Desktop')];
  }
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}

export function suggestedFilePath() {
  const base = `yf-npm-search-${formatLocalDate()}.md`;
  const dir = desktopDirectory();
  return dir ? path.join(dir, base) : path.join(process.cwd(), base);
}
