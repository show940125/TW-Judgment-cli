import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

import { isSupportedOpencliVersion } from './compat.js';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

function npmBinary() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export async function resolveGlobalNodeModules() {
  const { stdout } = await execAsync(`${npmBinary()} root -g`);
  return stdout.trim();
}

export async function resolveGlobalBinDir() {
  const { stdout } = await execAsync(`${npmBinary()} prefix -g`);
  return stdout.trim();
}

export async function detectOpencliInstall() {
  const globalRoot = await resolveGlobalNodeModules();
  const globalBinDir = await resolveGlobalBinDir();
  const packageRoot = path.join(globalRoot, '@jackwener', 'opencli');
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  return {
    globalRoot,
    globalBinDir,
    packageRoot,
    version,
    supported: isSupportedOpencliVersion(version),
    registryUrl: pathToFileURL(path.join(packageRoot, 'dist', 'registry.js')).href,
    errorsUrl: pathToFileURL(path.join(packageRoot, 'dist', 'errors.js')).href,
    mainUrl: pathToFileURL(path.join(packageRoot, 'dist', 'main.js')).href,
  };
}

export async function runOpencli(args) {
  const globalBinDir = await resolveGlobalBinDir();
  const binary = process.platform === 'win32'
    ? path.join(globalBinDir, 'opencli.cmd')
    : path.join(globalBinDir, 'opencli');
  const quotedArgs = args.map((value) => JSON.stringify(value)).join(' ');
  return execAsync(`${JSON.stringify(binary)} ${quotedArgs}`, { maxBuffer: 1024 * 1024 * 10 });
}

export function defaultHomeDir() {
  return os.homedir();
}
