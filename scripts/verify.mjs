#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import { runOpencli } from './lib/opencli.js';

const execAsync = promisify(exec);

async function main() {
  const npmBinary = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await execAsync(`${npmBinary} test`, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 });

  const advanced = JSON.parse((await runOpencli([
    'judicial',
    'advanced-search',
    '--courts',
    '嘉義地院',
    '--case-types',
    'criminal',
    '--case-year',
    '115',
    '--case-word',
    '金訴',
    '--case-number',
    '204',
    '--limit',
    '1',
    '-f',
    'json',
  ])).stdout);
  if (!Array.isArray(advanced) || advanced.length === 0 || !advanced[0].id) {
    throw new Error('VERIFY_FAILED: advanced-search command returned no usable id');
  }

  const id = advanced[0].id;
  const read = JSON.parse((await runOpencli(['judicial', 'read', '--id', id, '-f', 'json'])).stdout);
  const batch = JSON.parse((await runOpencli(['judicial', 'read-batch', '--ids', `${id},${id}`, '-f', 'json'])).stdout);
  const pdf = JSON.parse((await runOpencli(['judicial', 'pdf', '--id', id, '-f', 'json'])).stdout);
  const search = JSON.parse((await runOpencli(['judicial', 'search', '--query', '詐騙', '--limit', '1', '-f', 'json'])).stdout);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'twjud-verify-'));
  const inputPath = path.join(tempDir, 'batch.json');
  await fs.writeFile(inputPath, JSON.stringify(batch, null, 2), 'utf8');
  const exported = JSON.parse((await runOpencli(['judicial', 'export-results', '--input', inputPath, '--export-format', 'md', '-f', 'json'])).stdout);
  const outputPath = exported.output_path;
  const exportedText = await fs.readFile(outputPath, 'utf8');

  if (!Array.isArray(batch) || batch.length !== 2 || !read.text || !pdf.pdf_url || !Array.isArray(search) || search.length === 0) {
    throw new Error('VERIFY_FAILED: judicial smoke test did not return the expected fields');
  }

  if (!exportedText.includes(id)) {
    throw new Error('VERIFY_FAILED: export-results did not write the expected dossier');
  }

  console.log(`Verified advanced-search/read/read-batch/pdf/export-results with id ${id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
