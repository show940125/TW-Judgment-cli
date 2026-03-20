#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  const packageJson = JSON.parse(await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  const output = path.join(repoRoot, `tw-judgment-cli-${packageJson.version}.zip`);
  await fs.rm(output, { force: true });

  if (process.platform === 'win32') {
    await execFileAsync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path '${path.join(repoRoot, 'dist')}', '${path.join(repoRoot, 'docs')}', '${path.join(repoRoot, 'examples')}', '${path.join(repoRoot, 'skill')}', '${path.join(repoRoot, 'scripts')}', '${path.join(repoRoot, 'README.md')}', '${path.join(repoRoot, 'compatibility.md')}' -DestinationPath '${output}'`,
      ],
      { maxBuffer: 1024 * 1024 * 20 }
    );
  } else {
    await execFileAsync(
      'zip',
      ['-r', output, 'dist', 'docs', 'examples', 'skill', 'scripts', 'README.md', 'compatibility.md'],
      { cwd: repoRoot, maxBuffer: 1024 * 1024 * 20 }
    );
  }

  console.log(`Created release bundle at ${output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
