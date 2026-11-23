#!/usr/bin/env node
import { main } from '../src/cli.js';

main().catch((err) => {
  const message = err && err.message ? err.message : String(err);
  process.stderr.write(message.endsWith('\n') ? message : message + '\n');
  process.exit(err && typeof err.exitCode === 'number' ? err.exitCode : 2);
});
