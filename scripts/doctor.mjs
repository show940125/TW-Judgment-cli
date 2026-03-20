#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildInstallPlan } from './lib/compat.js';
import { pathExists } from './lib/fs.js';
import { defaultHomeDir, detectOpencliInstall, runOpencli } from './lib/opencli.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(repoRoot, 'dist');

async function main() {
  const plan = buildInstallPlan(defaultHomeDir(), distRoot);
  const install = await detectOpencliInstall();
  const checks = [];

  checks.push(['opencli package', true, install.packageRoot]);
  checks.push(['opencli version supported', install.supported, install.version]);
  checks.push(['built adapters', await pathExists(plan.adapterSource), plan.adapterSource]);
  checks.push(['installed site root', await pathExists(plan.siteRoot), plan.siteRoot]);
  checks.push(['registry shim', await pathExists(path.join(plan.shimRoot, 'registry.mjs')), path.join(plan.shimRoot, 'registry.mjs')]);
  checks.push(['errors shim', await pathExists(path.join(plan.shimRoot, 'errors.mjs')), path.join(plan.shimRoot, 'errors.mjs')]);

  let discovered = false;
  try {
    const { stdout } = await runOpencli(['list', '-f', 'json']);
    const commands = JSON.parse(stdout);
    discovered = Array.isArray(commands) && commands.some((row) => row.command === 'judicial/search');
  } catch {
    discovered = false;
  }
  checks.push(['opencli discovery', discovered, 'judicial/search']);

  let failed = false;
  for (const [label, ok, detail] of checks) {
    console.log(`${ok ? 'OK' : 'FAIL'}  ${label}: ${detail}`);
    if (!ok) failed = true;
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
