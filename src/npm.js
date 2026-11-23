import { CliError } from './errors.js';

const SEARCH_BASE = 'https://registry.npmjs.org/-/v1/search';
const REGISTRY_BASE = 'https://registry.npmjs.org';
const DOWNLOADS_RANGE_BASE = 'https://api.npmjs.org/downloads/range';

// Public cleanup service URL. The service is deployed separately (it injects
// XAI_API_KEY via Doppler; this package never receives that key). Replace this
// placeholder with the real public URL, or override it with
// YF_NPM_SEARCH_CLEANUP_URL at runtime.
export const CLEANUP_SERVICE_URL =
  process.env.YF_NPM_SEARCH_CLEANUP_URL || 'https://cleanup.yourfam.co/yf-npm-search';

function encodePackage(name) {
  return name.includes('/') ? name.replace('/', '%2F') : name;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The npm downloads API (api.npmjs.org) enforces a burst limit that recovers
// in about one second. Pacing download requests keeps the run under that
// limit while still honoring the "at most 8 concurrent requests" rule.
class RateLimiter {
  constructor(minIntervalMs) {
    this.minIntervalMs = minIntervalMs;
    this.next = 0;
  }

  async acquire() {
    const now = Date.now();
    if (now < this.next) {
      await sleep(this.next - now);
    }
    this.next = Date.now() + this.minIntervalMs;
  }
}

const downloadsLimiter = new RateLimiter(200);

async function fetchJson(url, what, { notFoundIsEmpty = false } = {}) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    let res;
    try {
      res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    } catch {
      clearTimeout(timer);
      throw new CliError(`Error: ${what} failed.`);
    }
    clearTimeout(timer);

    if (res.status === 429 && attempt < 3) {
      const retryAfter = res.headers.get('retry-after');
      const parsed = Number(retryAfter);
      let waitMs = Number.isFinite(parsed) && parsed > 0
        ? parsed * 1000
        : 1000 * Math.pow(2, attempt);
      waitMs += Math.floor(Math.random() * 1000);
      await sleep(waitMs);
      continue;
    }
    if (notFoundIsEmpty && res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new CliError(`Error: ${what} failed.`);
    }
    try {
      return await res.json();
    } catch {
      throw new CliError(`Error: ${what} failed.`);
    }
  }
}

export async function searchPackages(text) {
  const packages = [];
  let total = 0;
  let from = 0;
  let first = true;

  while (packages.length < 1000) {
    const url = `${SEARCH_BASE}?text=${encodeURIComponent(text)}&size=250&from=${from}`;
    const data = await fetchJson(url, 'the search request');
    if (first) {
      total = data && typeof data.total === 'number' ? data.total : 0;
      first = false;
    }
    const objects = data && Array.isArray(data.objects) ? data.objects : [];
    for (const object of objects) {
      if (object && object.package) packages.push(object.package);
      if (packages.length >= 1000) break;
    }
    if (objects.length < 250) break;
    from += 250;
  }

  return { packages, total };
}

export async function fetchRegistryDoc(name) {
  const url = `${REGISTRY_BASE}/${encodePackage(name)}`;
  return fetchJson(url, `the registry request for ${name}`);
}

function twoDigit(n) {
  return String(n).padStart(2, '0');
}

function toDateString(date) {
  return `${date.getUTCFullYear()}-${twoDigit(date.getUTCMonth() + 1)}-${twoDigit(date.getUTCDate())}`;
}

export function eighteenMonthRange() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - 18);
  return `${toDateString(start)}:${toDateString(end)}`;
}

export async function fetchDownloadRange(name, range) {
  await downloadsLimiter.acquire();
  const url = `${DOWNLOADS_RANGE_BASE}/${range}/${encodePackage(name)}`;
  const data = await fetchJson(url, `the downloads request for ${name}`, { notFoundIsEmpty: true });
  if (!data || !Array.isArray(data.downloads)) return [];
  return data.downloads;
}

export async function callCleanup(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(CLEANUP_SERVICE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const words = (await res.text()).trim();
    return words || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export class Pool {
  constructor(limit) {
    this.limit = limit;
    this.active = 0;
    this.queue = [];
  }

  run(fn) {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        } finally {
          this.active--;
          this._next();
        }
      };
      this.queue.push(task);
      this._next();
    });
  }

  _next() {
    while (this.active < this.limit && this.queue.length) {
      this.active++;
      const task = this.queue.shift();
      task();
    }
  }
}
