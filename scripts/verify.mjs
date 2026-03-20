#!/usr/bin/env node

import process from 'node:process';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { runOpencli } from './lib/opencli.js';

const execAsync = promisify(exec);

async function main() {
  const npmBinary = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await execAsync(`${npmBinary} test`, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 });

  const search = JSON.parse((await runOpencli(['judicial', 'search', '--query', '105訴123', '--limit', '1', '-f', 'json'])).stdout);
  if (!Array.isArray(search) || search.length === 0 || !search[0].id) {
    throw new Error('VERIFY_FAILED: search command returned no usable id');
  }

  const id = search[0].id;
  const read = JSON.parse((await runOpencli(['judicial', 'read', '--id', id, '-f', 'json'])).stdout);
  const pdf = JSON.parse((await runOpencli(['judicial', 'pdf', '--id', id, '-f', 'json'])).stdout);

  if (!read.text || !pdf.pdf_url) {
    throw new Error('VERIFY_FAILED: read/pdf smoke test did not return the expected fields');
  }

  console.log(`Verified search/read/pdf with id ${id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
