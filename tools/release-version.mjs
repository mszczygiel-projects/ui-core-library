import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaceRoot = process.cwd();

const packageFiles = [
  'package.json',
  'packages/foundations/package.json',
  'packages/icons/package.json',
  'packages/react/package.json',
  'packages/web-components/package.json',
];

const releaseType = process.argv[2];
const options = new Set(process.argv.slice(3));
const dryRun = options.has('--dry-run');

if (!releaseType) {
  console.error('Usage: node tools/release-version.mjs <patch|minor|major|x.y.z> [--dry-run]');
  process.exit(1);
}

const currentVersion = readPackageJson(packageFiles[0]).version;
const nextVersion = resolveNextVersion(currentVersion, releaseType);

for (const relativePath of packageFiles) {
  const packageJson = readPackageJson(relativePath);
  const previousVersion = packageJson.version;
  packageJson.version = nextVersion;

  if (dryRun) {
    console.log(`${relativePath}: ${previousVersion} -> ${nextVersion}`);
    continue;
  }

  writePackageJson(relativePath, packageJson);
  console.log(`${relativePath}: ${nextVersion}`);
}

function readPackageJson(relativePath) {
  const absolutePath = resolve(workspaceRoot, relativePath);
  return JSON.parse(readFileSync(absolutePath, 'utf8'));
}

function writePackageJson(relativePath, packageJson) {
  const absolutePath = resolve(workspaceRoot, relativePath);
  writeFileSync(absolutePath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function resolveNextVersion(version, type) {
  if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type;
  }

  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Unsupported current version format: ${version}`);
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