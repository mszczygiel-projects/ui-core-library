import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const releaseType = process.argv[2];
const extraArgs = process.argv.slice(3);
const dryRun = extraArgs.includes('--dry-run');

if (!releaseType) {
  console.error('Usage: node tools/release.mjs <patch|minor|major|x.y.z> [--dry-run]');
  process.exit(1);
}

run(`node tools/release-version.mjs ${releaseType}${dryRun ? ' --dry-run' : ''}`);

const nextVersion = dryRun ? resolveNextVersionFromDryRun(releaseType) : readRootVersion();
const tagName = `v${nextVersion}`;

ensureTagDoesNotExist(tagName);

if (dryRun) {
  console.log(`dry-run: would create git tag ${tagName}`);
  console.log('dry-run: skipped build, test and publish');
  process.exit(0);
}

run('pnpm build');
run('pnpm test');
run('pnpm run publish');
run(`git tag -a ${tagName} -m ${tagName}`);

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function readRootVersion() {
  return JSON.parse(readFileSync('package.json', 'utf8')).version;
}

function ensureTagDoesNotExist(tagName) {
  try {
    execSync(`git rev-parse --verify --quiet refs/tags/${tagName}`, { stdio: 'ignore' });
    console.error(`Git tag ${tagName} already exists.`);
    process.exit(1);
  } catch {
    // Tag does not exist.
  }
}

function resolveNextVersionFromDryRun(type) {
  const currentVersion = readRootVersion();

  if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type;
  }

  const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported current version format: ${currentVersion}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (type) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Unsupported release type: ${type}`);
  }
}