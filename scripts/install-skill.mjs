#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { copyDirectory, ensureCleanDir, pathExists } from './lib/fs.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repoRoot, 'skill');
const targetRoot = path.join(process.env.USERPROFILE ?? process.cwd(), '.codex', 'skills', 'tw-judgment-cli');

async function main() {
  if (!(await pathExists(sourceRoot))) {
    throw new Error(`Skill source not found: ${sourceRoot}`);
  }

  await ensureCleanDir(targetRoot);
  await copyDirectory(sourceRoot, targetRoot);

  console.log(`Installed Codex skill into ${targetRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
