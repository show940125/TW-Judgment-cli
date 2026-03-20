#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { buildInstallPlan } from './lib/compat.js';
import { copyDirectory, ensureCleanDir, pathExists } from './lib/fs.js';
import { defaultHomeDir, detectOpencliInstall } from './lib/opencli.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(repoRoot, 'dist');
const syncMode = process.argv.includes('--sync');

function runtimeShim(url) {
  return `export * from ${JSON.stringify(url)};\n`;
}

async function main() {
  const install = await detectOpencliInstall();
  if (!install.supported) {
    throw new Error(`UNSUPPORTED_OPENCLI_VERSION: opencli ${install.version} is outside the supported range`);
  }

  const plan = buildInstallPlan(defaultHomeDir(), distRoot);
  if (!(await pathExists(plan.adapterSource))) {
    throw new Error('ADAPTER_NOT_INSTALLED: build the repo first with npm run build');
  }

  if (syncMode) {
    await ensureCleanDir(plan.siteRoot);
  } else {
    await fs.mkdir(plan.siteRoot, { recursive: true });
  }
  await fs.mkdir(plan.shimRoot, { recursive: true });

  await copyDirectory(plan.adapterSource, plan.siteRoot);
  await fs.writeFile(path.join(plan.siteRoot, 'package.json'), JSON.stringify({ type: 'module' }, null, 2), 'utf8');
  await fs.writeFile(path.join(plan.shimRoot, 'package.json'), JSON.stringify({ type: 'module' }, null, 2), 'utf8');
  await fs.rm(path.join(plan.shimRoot, 'registry.js'), { force: true });
  await fs.rm(path.join(plan.shimRoot, 'errors.js'), { force: true });
  await fs.writeFile(path.join(plan.shimRoot, 'registry.mjs'), runtimeShim(install.registryUrl), 'utf8');
  await fs.writeFile(path.join(plan.shimRoot, 'errors.mjs'), runtimeShim(install.errorsUrl), 'utf8');

  console.log(`Installed judicial adapters into ${plan.siteRoot}`);
  console.log(`Generated opencli shims in ${plan.shimRoot}`);
  console.log(`Detected opencli ${install.version}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
